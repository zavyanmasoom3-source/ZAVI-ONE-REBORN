#!/usr/bin/env python3
"""Owner-approved: genuine dashboard filters, invoices, calendar and Western digits.

Runs in a disposable Chrome profile. Creates test entries only in memory;
never posts to Supabase and never persists a real financial transaction.
"""
import json
from chrome_cdp import Session, ROOT
from pathlib import Path

out=ROOT/'qa-v6662-three-section-finish'
out.mkdir(exist_ok=True)

with Session() as browser:
    browser.unlock_one()
    browser.route('dashboard')
    browser.until("""document.querySelector('#content.z66d-root .z66d-invoices')
       && !!document.querySelector('#zaviChartMonth')
       && !!window.ZaviDualDate?.setPreferred
       && !!window.ZaviEnglishDigitsV645""",
       'approved dashboard, invoice list and calendar initialized')

    initial=browser.eval("""(()=>{
      const r=document.getElementById('content');
      return {tx:db.tx.length,months:r.querySelectorAll('.bar-chart .bar-col').length,
        invoiceCard:!!r.querySelector('.z66d-invoices'),
        donut:!!r.querySelector('.z6539-donut'),
        calendar:document.getElementById('zaviChartCalendar').value,
        years:[...document.querySelector('#zaviChartYear').options].map(x=>x.text),
        support:!!document.querySelector('.z66d-invoice-all[data-go="sales"]')};
    })()""")
    assert initial['months']==12 and initial['invoiceCard'] and initial['donut'],initial
    assert initial['support'] and initial['years'],initial
    assert all(not any(ch in x for ch in '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩')
               for x in initial['years']),initial

    # Chart preference is a real persisted display setting, never an accounting write.
    browser.eval("""(()=>{
      const field=document.getElementById('zaviChartCalendar');
      field.value='gregorian';field.dispatchEvent(new Event('change',{bubbles:true}));
    })()""")
    browser.until("""document.getElementById('zaviChartCalendar')?.value==='gregorian'
     && window.ZaviDualDate.preferred()==='gregorian'""",
     'Gregorian preference selected and saved')
    selected=browser.eval("""({
      saved:localStorage.getItem('zavi_calendar_display_preference_v19'),
      monthCount:document.getElementById('zaviChartMonth').options.length,
      month:document.getElementById('zaviChartMonth').value,
      stillNoFinancialWrite:db.tx.length===%s
    })"""%initial['tx'])
    assert selected['saved']=='gregorian' and selected['monthCount']==12,selected
    assert selected['stillNoFinancialWrite'],selected

    browser.eval("""(()=>{
      const field=document.getElementById('zaviChartCalendar');
      field.value='solar';field.dispatchEvent(new Event('change',{bubbles:true}));
    })()""")
    browser.until("""document.getElementById('zaviChartCalendar')?.value==='solar'
        && window.ZaviDualDate.preferred()==='solar'""",
        'Afghan Solar preference persists')
    stamp=browser.eval("""(()=>{
       const sample=window.ZaviDualDate.formatBoth(new Date());
       return {sample,arabic:/[۰-۹٠-٩]/.test(sample),monthCount:document.querySelectorAll('.bar-chart .bar-col').length};
    })()""")
    assert stamp['sample'].count(' · ')==1 and not stamp['arabic'],stamp
    assert stamp['monthCount']==12,stamp

    # Synthetic only in memory: simulate actual invoice records from the same
    # ledger schema, verify both real native routes without signing or saving.
    browser.eval("""(()=>{
       const day=nowISO(),line={productId:'qa-mem-only',qty:2,price:7,cost:3};
       db.tx.push({id:'qa-dashboard-sale',type:'sale',date:day,code:'ZW-QA-SALE',
          items:[line],discount:0,customerName:'QA CUSTOMER ONLY'});
       db.tx.push({id:'qa-dashboard-purchase',type:'purchase',date:day,code:'ZW-QA-PUR',
          items:[line],discount:0,shipping:0,customerName:'QA SUPPLIER ONLY'});
       render();
    })()""")
    browser.until("""!![...document.querySelectorAll('.z66d-invoice-number')]
      .find(x=>x.textContent==='ZW-QA-SALE')""",
      'actual ledger-backed dashboard invoice row renders')
    row=browser.eval("""(()=>{
       const e=[...document.querySelectorAll('.z66d-invoice-entry')]
        .find(x=>x.querySelector('.z66d-invoice-number')?.textContent==='ZW-QA-SALE');
       return {id:e?.dataset.detail,
        dualDate:e?.querySelector('.z66d-invoice-date')?.textContent,
        amount:e?.querySelector('.z66d-invoice-amount')?.textContent,
        count:db.tx.length};
    })()""")
    assert row['id']=='qa-dashboard-sale' and '14' in row['amount'],row
    assert ' · ' in row['dualDate'],row

    browser.eval("""document.querySelector('.z66d-invoice-tab[data-z66-invoice-kind=purchase]').click()""")
    browser.until("""!![...document.querySelectorAll('.z66d-invoice-number')]
      .find(x=>x.textContent==='ZW-QA-PUR')""",
      'purchase tab uses same native ledger')
    browser.eval("""document.querySelector('.z66d-invoice-all').click()""")
    browser.until("""typeof page!=='undefined'&&page==='purchases'""",
       'view all invoices navigates to original purchases management')
    assert browser.eval('db.tx.length')==initial['tx']+2

    # One and ADMIN share this display-only number standard.
    field=browser.eval("""(()=>{
       const el=document.createElement('input');el.type='text';document.body.append(el);
       el.value='۱۲۳٤٥';el.dispatchEvent(new Event('input',{bubbles:true}));
       const result=el.value;el.remove();return result;
    })()""")
    assert field=='12345',field

    # Standalone invoice and PDF/print must show BOTH dates even when the
    # selected input calendar is Afghan Solar Hijri.
    browser.command('Page.navigate',{'url':browser.web+'/apps/one/invoice.html'})
    browser.until("""document.readyState==='complete'
       && typeof zaviInvoiceUpdateDualDate==='function'
       && !!document.getElementById('zaviInvoiceDualDate')""",
       'manual invoice dual-calendar layout loaded')
    manual=browser.eval("""(()=>{
      const input=document.querySelector('input[name=date]');
      const note=document.getElementById('zaviInvoiceDualDate');
      const original=input.value;
      input.value='1405/08/21';input.dispatchEvent(new Event('input',{bubbles:true}));
      return {original,date:input.value,dual:note.textContent,
        error:input.getAttribute('aria-invalid'),
        pdfVisible:getComputedStyle(note).display!=='none'};
    })()""")
    assert manual['pdfVisible'] and manual['error'] is None,manual
    assert '1405/08/21' in manual['dual'] and '2026' in manual['dual'],manual
    assert not any(ch in manual['dual'] for ch in '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩'),manual
    browser.eval("""(()=>{
       const date=document.querySelector('input[name=date]');
       date.value='2026-11-12';date.dispatchEvent(new Event('input',{bubbles:true}));
    })()""")
    assert '1405' in browser.eval("document.getElementById('zaviInvoiceDualDate').textContent")

    # An input mistake may not silently generate a misleading printed date.
    browser.eval("""(()=>{
       const date=document.querySelector('input[name=date]');
       date.value='1405/13/99';date.dispatchEvent(new Event('input',{bubbles:true}));
    })()""")
    assert browser.eval("document.querySelector('input[name=date]').getAttribute('aria-invalid')")=='true'

    (out/'result.json').write_text(json.dumps({
      'dashboard':initial,'preference':selected,'date':stamp,
      'ledgerInvoice':row,'manualInvoice':manual
    },ensure_ascii=False,indent=2),encoding='utf-8')
    print('PASS: 12 real month labels, Afghan/Gregorian preference, receipt distribution and invoice routes')
    print('PASS: dual-dated print/PDF preview, ASCII numerals and invalid-date guard; no real financial write')

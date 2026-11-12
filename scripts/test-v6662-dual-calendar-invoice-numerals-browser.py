#!/usr/bin/env python3
"""Approved ONE V66.62: native dashboard, dual date, invoice list, ASCII digits.

Runs in an isolated Chrome profile. Never commits a business transaction.
"""
from chrome_cdp import Session, ROOT
from pathlib import Path
import json

out=ROOT/'qa-v6662-approved-dates-invoices'
out.mkdir(exist_ok=True)
with Session() as browser:
    browser.unlock_one()
    browser.route('dashboard')
    browser.until("""!!document.querySelector('#content.z66d-root .z66d-invoices')
      && !!document.querySelector('#zaviChartMonth')
      && !!document.querySelector('#content .z6539-donut-card')""",
      'owner-approved invoice dashboard and real chart filters are mounted')
    first=browser.eval("""(()=>{
      const c=document.querySelector('#content');
      const invoice=c.querySelector('.z66d-invoices');
      const d=window.ZaviDualDate;
      const date=d?.formatBoth?.('2026-11-12T12:00:00Z')||'';
      return {
        invoice:!!invoice,year:!!document.getElementById('zaviChartYear'),
        month:!!document.getElementById('zaviChartMonth'),
        calendar:!!document.getElementById('zaviChartCalendar'),
        list:!!invoice?.querySelector('.z66d-invoice-list'),
        sales:!!invoice?.querySelector('[data-z66-invoice-kind=sale]'),
        purchases:!!invoice?.querySelector('[data-z66-invoice-kind=purchase]'),
        search:!!invoice?.querySelector('input[type=search]'),
        nativeRate:!!c.querySelector('#usdRateDashboardForm')||!!c.querySelector('.zavi-usd-fixed'),
        donut:!!c.querySelector('.z6539-donut'),
        dual:date,
        hasLatin:date.includes('1405')&&date.includes('2026'),
        hasPersianDigits:/[۰-۹٠-٩]/.test(date)
      };
    })()""")
    assert all(first[x] for x in ('invoice','year','month','calendar',
      'list','sales','purchases','search','nativeRate','donut','hasLatin')),first
    assert not first['hasPersianDigits'],first
    initial=browser.eval("db.tx.length")
    browser.eval("""(()=>{
       const c=document.getElementById('zaviChartCalendar');
       c.value='gregorian';c.dispatchEvent(new Event('change',{bubbles:true}));
    })()""")
    browser.until("""document.getElementById('zaviChartCalendar')?.value==='gregorian'
       && window.ZaviDualDate?.preferred?.()==='gregorian'""",
       'Gregorian preference is persistent and dashboard calendar switches')
    ordered=browser.eval("""window.ZaviDualDate.formatBoth('2026-11-12T12:00:00Z')""")
    assert ordered.index('2026')<ordered.index('1405'),ordered
    browser.eval("""(()=>{
       const c=document.getElementById('zaviChartCalendar');
       c.value='solar';c.dispatchEvent(new Event('change',{bubbles:true}));
    })()""")
    browser.until("""document.getElementById('zaviChartCalendar')?.value==='solar'
       && window.ZaviDualDate?.preferred?.()==='solar'""",
       'Afghan Solar preference is persistent; both dates still render')
    dual=browser.eval("""window.ZaviDualDate.formatBoth('2026-11-12T12:00:00Z')""")
    assert dual.index('1405')<dual.index('2026'),dual
    # Calendar change rerenders the dashboard. Wait for the REAL invoice tabs
    # to be mounted again before clicking; do not weaken the tab assertion.
    browser.until("""!!document.querySelector('[data-z66-invoice-kind=purchase]')
      && !!document.querySelector('[data-z66-invoice-kind=sale]')""",
      'native invoice tabs remount after switching calendar')
    browser.eval("""document.querySelector('[data-z66-invoice-kind=purchase]').click()""")
    browser.until("""document.querySelector('[data-z66-invoice-kind=purchase]')
         ?.getAttribute('aria-pressed')==='true'""",'native purchase invoice list opens')
    browser.eval("""document.querySelector('[data-z66-invoice-kind=sale]').click()""")
    assert browser.eval("db.tx.length")==initial,'visual filtering must not write transactions'
    # Real numeric inputs refuse Persian/Arabic digits without rewriting existing data.
    inputGuard=browser.eval("""(()=>{
       const n=document.createElement('input');n.type='tel';
       document.body.append(n);
       const e=new InputEvent('beforeinput',{data:'۱۲۳',inputType:'insertText',
          bubbles:true,cancelable:true});
       n.dispatchEvent(e);n.remove();return e.defaultPrevented;
    })()""")
    assert inputGuard,'numeric keyboard must require ASCII digits'
    browser.eval("window.ZaviThemeV29.set('dark')")
    browser.until("""document.documentElement.dataset.zaviTheme==='dark'""",
       'approved premium invoice card survives dark mode')
    assert browser.eval("""document.querySelector('.z66d-invoices')
       ?.getBoundingClientRect()?.width>250"""),'invoice card clipped in dark mode'
    assert browser.eval("db.tx.length")==initial
    print('PASS: all approved real dashboard sections, dual dates, both calendars, native invoice tabs, ASCII input guard')
    (out/'contract.json').write_text(json.dumps({'baseline':first,'dual':dual},
       ensure_ascii=False,indent=2),encoding='utf-8')

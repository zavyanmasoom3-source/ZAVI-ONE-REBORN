#!/usr/bin/env python3
"""REAL Chromium UI/financial-flow smoke test for owner-provided sales screenshots.

Only a disposable local browser profile is used. A synthetic product is added to
memory inside that profile, and the native sale handler is exercised once. No
Supabase access tokens, real customer records, release builds, or APKs are used.
This proves browser behaviors, NOT pixel-perfect photographic comparison,
per-warehouse server stock enforcement or real-device barcode permission.
"""
from pathlib import Path
import json
import os
import time
from chrome_cdp import Session, ROOT

out=ROOT/'qa-approved-sales'
out.mkdir(exist_ok=True)
proof={"status":"browser QA, not production acceptance","commit":os.environ.get("GITHUB_SHA","local"),
       "reference":"seven owner-provided screenshots, 2026-11-09",
       "live_server_access":False,"financial_data":"disposable browser only",
       "pixel_parity_verified":False,"device_camera_verified":False}

with Session() as b:
    b.navigate('one')
    b.eval("localStorage.setItem('zavi_theme_preference_v29','light');localStorage.setItem('zavi_ui_appearance_v2','light')")
    assert not b.unlock_one(), 'Disposable PIN unlock failed'
    # A DOM-ready page can still be visually covered by the *real* splash.
    # Capture the approved screen only after the visible launch finishes.
    time.sleep(3.0)
    original=b.eval(r"""(()=>{
      const pid='qa-approved-sale-product';
      if(!db.products.find(p=>p.id===pid)){
        // Real stockState uses immutable-workspace memoization. Replace the
        // throwaway in-memory db snapshot, instead of mutating its array.
        db={...db,products:[...db.products,{id:pid,name:'QA_LOCAL_APPROVED_SALE_PRODUCT',
          sku:'QA-SALE-APPROVED-01',barcodes:['9050403020103'],openingQty:10,
          openingCost:2,purchasePrice:2,salePrice:17,reorder:1,category:'General'}]};
      }
      return {productId:pid,stock:stockOf(pid),transactionCount:db.tx.length,
        initialCurrency:db.currency,products:db.products.length};
    })()""")
    assert original['stock']==10,original
    route=b.route('sales')
    assert route['selected'] and route['visible'] and not route['locked'],route
    b.until("!!document.querySelector('.zsal-approved-page .zsal-list-tab')",
            'sales list from real renderer')
    sales=b.eval(r"""(()=>{
      const root=document.querySelector('#content .zsal-approved-page');
      const tabs=[...root.querySelectorAll('.zsal-list-tab')];
      const saved=root.querySelector('.zsal-list-panel section.card .searchbox #searchInput');
      const btn=root.querySelector('[data-action=sale]');
      const metrics=root.querySelectorAll('.zsal-stat');
      return {head:root.querySelector('.page-head h2').textContent,
        count:tabs.length,picker:!!saved,liveSale:!!btn,metrics:metrics.length,
        today:metrics[0]?.textContent,summary:metrics[1]?.textContent,
        archived:root.querySelectorAll('.zsal-list-panel > section.card').length};
    })()""")
    assert sales['count']==2 and sales['picker'] and sales['liveSale'],sales
    assert sales['metrics']==2 and sales['archived']>=3,sales
    (out/'sales-list-mobile.png').write_bytes(b.screenshot())
    tabs=b.eval(r"""(()=>{
      const ts=[...document.querySelectorAll('.zsal-list-tab')];
      ts[1].click();
      const p2=!document.getElementById('zsal-manual-panel').hidden &&
         document.getElementById('zsal-invoices-panel').hidden;
      ts[0].click();
      const p1=!document.getElementById('zsal-invoices-panel').hidden &&
         document.getElementById('zsal-manual-panel').hidden;
      return {manual:p2,sales:p1};
    })()""")
    assert tabs['manual'] and tabs['sales'],tabs
    print('PASS: owner-approved sales summary, real search and two functional invoice tabs')

    b.eval("document.querySelector('.zsal-approved-page [data-action=sale]').click()")
    b.until("!!document.querySelector('#overlay .zsal-approved-modal [data-zavi-flow=order]')",
            'real sale modal and original 3-stage form')
    b.until("document.querySelectorAll('#overlay .zsal-approved-modal input[name=zsalMode]').length===3",
            'approved payment options attached to the real sale form')
    modal=b.eval(r"""(()=>{
      const d=document.querySelector('#overlay .zsal-approved-modal');
      const f=d.querySelector('#dialogForm');
      const panes=[...d.querySelectorAll('.zavi-flow-panel')];
      const keys=[...d.querySelectorAll('.zavi-flow-tab')].map(x=>x.dataset.zaviFlowLabel);
      const fields=['date','freeContactName','freeContactPhone','accountId','discount','paid','note'];
      return {kind:d.dataset.zaviOrderKind,hasSubmit:typeof f.onsubmit==='function',
        fields:fields.every(n=>!!f.elements[n]),panes:panes.length,keys,
        barcode:!!d.querySelector('#zaviBarcodeScan'),
        camera:!!d.querySelector('[data-zavi-camera-open=zaviBarcodeScan]'),
        paymentRadios:d.querySelectorAll('input[name=zsalMode]').length,
        preview:!!d.querySelector('.zsal-preview-button'),
        nativeSave:!!f.querySelector('.modal-foot button[type=submit]')};
    })()""")
    assert modal['kind']=='sale' and modal['hasSubmit'] and modal['fields'],modal
    assert modal['panes']==3 and modal['keys']==['products','customer','payment'],modal
    assert modal['barcode'] and modal['camera'] and modal['paymentRadios']==3,modal
    assert modal['preview'] and modal['nativeSave'],modal
    layout=b.eval(r"""(()=>{
      const d=document.querySelector('#overlay .zsal-approved-modal');
      const f=d.querySelector('#dialogForm');
      const flow=f.querySelector('.zsal-vertical');
      const groups=[...flow.querySelectorAll(':scope > .zavi-flow-panel')];
      const scan=d.querySelector('#zaviBarcodeScan').getBoundingClientRect();
      const cam=d.querySelector('[data-zavi-camera-open="zaviBarcodeScan"]').getBoundingClientRect();
      const overlap=Math.max(0,Math.min(scan.right,cam.right)-Math.max(scan.left,cam.left))*
        Math.max(0,Math.min(scan.bottom,cam.bottom)-Math.max(scan.top,cam.top));
      const bounds=d.getBoundingClientRect();
      const date=f.querySelector('.zsal-dual-date')?.textContent||'';
      return {scrollGroups:groups.length,shown:groups.every(x=>!x.hidden),
        firstGroupContainsDate:!!groups[0].querySelector('input[name=date]'),
        secondGroupContainsBarcode:!!groups[1].querySelector('#zaviBarcodeScan'),
        thirdGroupContainsPaid:!!groups[2].querySelector('input[name=paid]'),
        overlappingScanAndCamera:overlap,
        cameraX:cam.left,cameraRight:cam.right,
        scannerX:scan.left,scannerRight:scan.right,
        screenWidth:innerWidth,modalRight:bounds.right,
        dualDate:date,dualValue:f.elements.date.value,
        dualFormatter:typeof window.ZaviDesignSystemV1?.formatDualDate,
        dualProbe:(()=>{try{return window.ZaviDesignSystemV1?.formatDualDate(
            f.elements.date.value,{language:'fa-AF',timezone:'Asia/Kabul'})}
            catch(e){return 'ERR:'+e.message}})(),
        tabNavHidden:flow.querySelector('.zavi-flow-tabs')?.hidden,
        buttonBg:getComputedStyle(d.querySelector('.modal-foot [type=submit]')).backgroundColor};
    })()""")
    assert layout['scrollGroups']==3 and layout['shown'] and layout['tabNavHidden'],layout
    assert layout['firstGroupContainsDate'] and layout['secondGroupContainsBarcode'] and layout['thirdGroupContainsPaid'],layout
    assert layout['overlappingScanAndCamera']==0 and layout['cameraX']>=0 and layout['cameraRight']<=layout['screenWidth'],layout
    assert layout['dualDate'] and '|' in layout['dualDate'],layout
    (out/'sale-product-form.png').write_bytes(b.screenshot())
    b.eval("""(()=>{const m=document.querySelector('.zsal-approved-modal .modal-body');
      const item=m.querySelector('#orderItems');m.scrollTop=item.getBoundingClientRect().top-
      m.getBoundingClientRect().top+m.scrollTop-20;})()""")
    (out/'sale-products-scrolled.png').write_bytes(b.screenshot())
    b.eval("""(()=>{const m=document.querySelector('.zsal-approved-modal .modal-body');
      m.scrollTop=m.scrollHeight-m.clientHeight;})()""")
    (out/'sale-payment-scrolled.png').write_bytes(b.screenshot())
    b.eval("""(()=>{const m=document.querySelector('.zsal-approved-modal .modal-body');m.scrollTop=0})()""")
    print('PASS: original sale handler, account/customer/discount/receipt fields and native barcode camera remain connected')

    qty=b.eval(r"""(()=>{
      const scan=document.getElementById('zaviBarcodeScan');
      const add=()=>{
        scan.value='9050403020103';
        scan.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
      };
      add();add();
      const row=document.querySelector('#orderItems .order-line');
      return {qty:row.querySelector('[data-field=qty]').value,
        product:row.querySelector('[data-field=productName]').value,
        unit:row.querySelector('[data-field=price]').value,
        sku:row.querySelector('[data-field=productSku]').value};
    })()""")
    assert qty['qty']=='2' and qty['product']=='QA_LOCAL_APPROVED_SALE_PRODUCT',qty
    assert float(qty['unit'])==17,qty
    b.until("document.querySelector('#dialogForm').elements.paid.value==='34'",
            'cash invoice auto-updates after two barcode scans')
    bank=b.eval(r"""(()=>{
      const f=document.querySelector('#dialogForm'),mode=f.querySelector('input[name=zsalMode][value=bank]');
      mode.checked=true;mode.dispatchEvent(new Event('change',{bubbles:true}));
      const bankAccount=f.elements.accountId.value,bankPaid=f.elements.paid.value;
      const cash=f.querySelector('input[name=zsalMode][value=cash]');
      cash.checked=true;cash.dispatchEvent(new Event('change',{bubbles:true}));
      const cashAccount=f.elements.accountId.value,cashPaid=f.elements.paid.value;
      const credit=f.querySelector('input[name=zsalMode][value=credit]');
      credit.checked=true;credit.dispatchEvent(new Event('change',{bubbles:true}));
      return {bankAccount,bankPaid,cashAccount,cashPaid,
        creditPaid:f.elements.paid.value,creditChecked:credit.checked};
    })()""")
    assert bank['bankAccount']=='a_bank' and bank['cashAccount']=='a_cash',bank
    assert bank['bankPaid']=='34' and bank['cashPaid']=='34',bank
    assert bank['creditPaid']=='0' and bank['creditChecked'],bank
    print('PASS: live cash/bank account switches, paid amount 34 auto-updates, credit mode posts zero')
    print('PASS: repeated offline barcode input resolves catalog product and increments quantity once per scan')

    valid=b.eval(r"""(()=>{
      const form=document.getElementById('dialogForm'),row=form.querySelector('.order-line');
      const price=row.querySelector('[data-field=price]');price.value='0';
      price.dispatchEvent(new Event('input',{bubbles:true}));
      const before=db.tx.length;
      form.querySelector('.zsal-preview-button').click();
      const isError=price.getAttribute('aria-invalid')==='true'||
        !!price.closest('.order-line').querySelector('.zds-field-error');
      const pane=[...form.querySelectorAll('.zavi-flow-tab')]
        .findIndex(x=>x.getAttribute('aria-selected')==='true');
      price.value='17';price.dispatchEvent(new Event('input',{bubbles:true}));
      form.elements.freeContactName.value='QA Test Customer';
      form.elements.paid.value='0';
      form.querySelector('.zsal-preview-button').click();
      const creditError=!!form.elements.freeContactName.closest('.field')
        ?.querySelector('.zds-field-error')?.textContent;
      return {priceError:isError,activePane:pane,sameCount:db.tx.length===before,
        creditError};
    })()""")
    assert valid['priceError'] and valid['sameCount'],valid
    # The first click can show an error, so close it before the next preview.
    b.eval(r"""(()=>{
      const form=document.getElementById('dialogForm');
      const button=form.querySelector('.zsal-preview-button');
      const receipt=form.querySelector('.zsal-receipt');
      if(!receipt.hidden){button.click()}
      const flow=form.querySelector('[data-zavi-flow=order]');
      flow.zaviActivate(1);
      form.elements.freeContactName.value='QA Test Customer';
      flow.zaviActivate(2);
      form.elements.paid.value='0';
      flow.zaviActivate(0);
      button.click();
    })()""")
    b.until("!document.querySelector('.zsal-receipt').hidden",'unsaved receipt preview')
    receipt=b.eval(r"""(()=>{
      const box=document.querySelector('.zsal-receipt');
      return {text:box.textContent,rows:box.querySelectorAll('tbody tr').length,
        transactionCount:db.tx.length,expected:db.tx.length===0,
        total:window.ZaviDecimal.invoiceTotals([{qty:'2',price:'17'}],'0','0','0').total};
    })()""")
    assert receipt['rows']==1 and 'QA_LOCAL_APPROVED_SALE_PRODUCT' in receipt['text'],receipt
    assert receipt['total']==34 and receipt['transactionCount']==original['transactionCount'],receipt
    (out/'sale-unsaved-receipt.png').write_bytes(b.screenshot())
    print('PASS: zero price is blocked under the original field; live receipt preview never saves a transaction')

    # Check the Android phone-size modal and three responsive themes without a browser restart.
    for theme in ['light','dark','glass']:
      result=b.eval(r"""(()=>{
        const theme=%s;
        const doc=document.documentElement;
        doc.dataset.zaviTheme=theme==='glass'?'dark':theme;
        doc.dataset.zaviAppearance=theme;
        const modal=document.querySelector('.zsal-approved-modal');
        const css=getComputedStyle(modal);
        return {width:modal.getBoundingClientRect().width,
          maxWidth:innerWidth,
          color:css.color,background:css.backgroundColor,
          panelWidth:modal.querySelector('.zavi-flow-layout').getBoundingClientRect().width};
      })()""" % json.dumps(theme))
      assert result['width']<=result['maxWidth'] and result['panelWidth']<=result['width'],result
      (out/('sale-'+theme+'-mobile.png')).write_bytes(b.screenshot())
    print('PASS: form remains within 420px phone viewport across light/dark/glass style selectors')
    locales={}
    for lang_id,locale_name,expected in (
      ('en','english','New sale'),
      ('ps-AF','pashto','نوی پلور ثبتول'),
      ('fa-AF','dari','ثبت فروش جدید')
    ):
      b.eval("document.documentElement.lang="+json.dumps(lang_id,ensure_ascii=False)+
             ";document.dispatchEvent(new Event('zavi:language-change'))")
      b.until("document.querySelector('.zsal-approved-modal .modal-head h3')?.textContent===" +
              json.dumps(expected,ensure_ascii=False),
              'live sales translation to '+locale_name,seconds=8)
      state=b.eval("""(()=>({
        translated:document.querySelector('.zsal-approved-modal .modal-head h3').textContent,
        date:document.querySelector('.zsal-dual-date')?.textContent||'',
        lang:document.documentElement.lang
      }))()""")
      locales[locale_name]={'translated':state['translated']==expected,
                            'date':state['date'],'lang':state['lang']}
    assert all(locales[k]['translated'] and locales[k]['date'] for k in ('english','pashto','dari')),locales
    print('PASS: real-time Dari/Pashto/English sales header and dual Afghan/Gregorian date update without reload')
    # Exercise actual native localStorage transaction posting in the disposable
    # browser. This is not an RLS test and does NOT have production credentials.
    b.command('Network.enable')
    b.command('Network.setBlockedURLs',{'urls':['*supabase.co/*','*supabase.in/*']})
    posted=b.eval(r"""(()=>{
      const form=document.querySelector('#overlay .zsal-approved-modal #dialogForm');
      const before=db.tx.length,stockBefore=stockOf('qa-approved-sale-product');
      if(!form)return {error:'Native sale form missing'};
      const original=window.zaviCloudCanEdit;
      // Test-only authenticated-owner permission stub. The real server is
      // blocked by Chromium, and this browser profile is disposable.
      window.zaviCloudCanEdit=()=>true;
      form.elements.freeContactName.value='QA LOCAL CREDIT CUSTOMER';
      form.elements.paid.value='20';
      form.elements.paid.dispatchEvent(new Event('input',{bubbles:true}));
      form.requestSubmit();
      const after=db.tx.length,stockAfter=stockOf('qa-approved-sale-product');
      const sale=db.tx.at(-1),contact=db.contacts.find(c=>c.id===sale?.contactId);
      const due=contact?contactBalances()[contact.id]?.receivable:null;
      form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
      const afterDoubleSubmit=db.tx.length;
      window.zaviCloudCanEdit=original;
      return {before,after,afterDoubleSubmit,stockBefore,stockAfter,
        type:sale?.type,invoice:sale?.code,customer:contact?.name,
        paid:sale?.paid,due,total:txTotal(sale||{}),
        savedInLocalStorage:localStorage.getItem(KEY)?.includes(sale?.id||'not-saved')||false};
    })()""")
    assert not posted.get('error'),posted
    assert posted['after']==posted['before']+1 and posted['afterDoubleSubmit']==posted['after'],posted
    assert posted['stockBefore']==10 and posted['stockAfter']==8,posted
    assert posted['total']==34 and posted['paid']==20 and posted['due']==14,posted
    assert posted['customer']=='QA LOCAL CREDIT CUSTOMER' and posted['savedInLocalStorage'],posted
    print('PASS: real native local sale commits once, stock 10 -> 8, paid 20, receivable 14, durable localStorage')
    # Confirm no user data can be sent to the backend by this test.
    proof.update({
      "source_screen":"real sales route and original HTML form",
      "visual_structure":layout,"bank_cash_credit":bank,"language_switch":locales,
      "browser_screenshots":sorted(p.name for p in out.glob('*.png')),
      "barcode_scan":"synthetic keyboard scan, not tested physical camera",
      "observed_quantity":qty['qty'],"expected_preview_total":34,
      "save_side_effects":"one local-only, disposable committed sale after preview",
      "local_financial_posting":posted,"native_submit_listener_preserved":modal['hasSubmit'],
      "remaining":["real physical camera permission","cloud stock-per-warehouse enforcement",
                   "mixed FX payment","end-to-end real RLS and update/rollback",
                   "pixel comparison against source screenshots"]
    })
    (out/'result.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    assert all(p.stat().st_size>9000 for p in out.glob('*.png'))
    print('PASS: actual Chrome screenshot evidence saved; NOT A RELEASE OR PIXEL-PARITY CERTIFICATE')

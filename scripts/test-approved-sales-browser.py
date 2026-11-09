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
from chrome_cdp import Session, ROOT

out=ROOT/'qa-approved-sales'
out.mkdir(exist_ok=True)
proof={"status":"browser QA, not production acceptance","commit":os.environ.get("GITHUB_SHA","local"),
       "reference":"seven owner-provided screenshots, 2026-11-09",
       "live_server_access":False,"financial_data":"disposable browser only",
       "pixel_parity_verified":False,"device_camera_verified":False}

with Session() as b:
    b.navigate('one')
    assert not b.unlock_one(), 'Disposable PIN unlock failed'
    original=b.eval(r"""(()=>{
      const pid='qa-approved-sale-product';
      if(!db.products.find(p=>p.id===pid)){
        db.products.push({id:pid,name:'QA_LOCAL_APPROVED_SALE_PRODUCT',
          sku:'QA-SALE-APPROVED-01',barcodes:['9050403020103'],openingQty:10,
          openingCost:2,purchasePrice:2,salePrice:17,reorder:1,category:'General'});
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
    (out/'sale-product-form.png').write_bytes(b.screenshot())
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
    # Confirm no user data can be sent to the backend by this test.
    proof.update({
      "source_screen":"real sales route and original HTML form",
      "browser_screenshots":sorted(p.name for p in out.glob('*.png')),
      "barcode_scan":"synthetic keyboard scan, not tested physical camera",
      "observed_quantity":qty['qty'],"expected_preview_total":34,
      "save_side_effects":False,"native_submit_listener_preserved":modal['hasSubmit'],
      "remaining":["real physical camera permission","cloud stock-per-warehouse enforcement",
                   "mixed FX payment","end-to-end real RLS and update/rollback",
                   "pixel comparison against source screenshots"]
    })
    (out/'result.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    assert all(p.stat().st_size>9000 for p in out.glob('*.png'))
    print('PASS: actual Chrome screenshot evidence saved; NOT A RELEASE OR PIXEL-PARITY CERTIFICATE')

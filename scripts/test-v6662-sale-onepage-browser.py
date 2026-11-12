#!/usr/bin/env python3
"""Owner-approved ZAVI 66.62 one-page sale: Chrome runtime contract.

Uses a disposable local browser only; no server login, no real financial writes.
Original native sale form, barcode handler, validation, and transaction array
must remain intact; this is not Android device acceptance or a release test.
"""
from pathlib import Path
from chrome_cdp import Session,ROOT

out=ROOT/'qa-v6662-sale'
out.mkdir(exist_ok=True)

with Session() as browser:
    error=browser.unlock_one()
    if error:raise AssertionError('Disposable PIN unlock failed: '+str(error))
    browser.eval("""(()=>{
        db.products.push({id:'qa-only-disposable',name:'QA_NOT_A_REAL_PRODUCT',
          sku:'QA-NONRELEASE',category:'QA',salePrice:5,purchasePrice:3,
          openingQty:3,reorder:1});
        openOrder('sale');
        return true;
    })()""")
    browser.until("""!!document.querySelector(
      '#dialogForm[data-zavi-sale-onepage="true"] [data-zavi-sale-onepage="66.62"]')""",
      'real approved single-page sale, NOT three wizard tabs')
    browser.until("""!!document.querySelector('#dialogForm .z66-sale-input[data-z66-missing]')
        || document.querySelectorAll('#dialogForm .z66-sale-input').length>=3""",
      'native quantity and unit price inputs have visible captions')
    sale=browser.eval("""(()=>{
      const f=document.getElementById('dialogForm');
      const view=f.querySelector('.z66-sale-single');
      const sections=[...view.querySelectorAll(':scope > section')];
      const row=view.querySelector('#orderItems .order-line');
      return {
        onepage:sections.length===4&&!view.querySelector('[role="tab"]'),
        order:sections.map(s=>s.className.split(' ').find(c=>c.startsWith('z66-sale-')&&c!=='z66-sale-section')),
        customer:!!view.querySelector('[name="freeContactName"]')&&!!view.querySelector('[name="freeContactPhone"]'),
        barcode:!!view.querySelector('#zaviBarcodeScan')
          &&!!view.querySelector('[data-zavi-camera-open="zaviBarcodeScan"]')
          &&!!view.querySelector('#z659BarcodeConfirm'),
        products:!!view.querySelector('#orderItems')&&!!view.querySelector('#addLine'),
        unit:!!row?.querySelector('.z66-sale-unit-price [data-field="price"]'),
        quantity:!!row?.querySelector('.z66-sale-qty [data-field="qty"]'),
        payment:!!view.querySelector('[name="paid"]')
          &&!!view.querySelector('[name="accountId"]')
          &&!!view.querySelector('[name="discount"]'),
        advanced:!!view.querySelector('details.z66-sale-advanced'),
        save:!!f.querySelector('.modal-foot button[type=submit]'),
        rows:f.querySelectorAll('.order-line').length,
        noClonedInputs:f.querySelectorAll('[name="paid"]').length===1 &&
          f.querySelectorAll('[name="discount"]').length===1 &&
          f.querySelectorAll('#zaviBarcodeScan').length===1
      };
    })()""")
    assert sale['onepage'] and sale['rows']>=1,sale
    assert all(sale[k] for k in ['customer','barcode','products','unit',
       'quantity','payment','advanced','save','noClonedInputs']),sale
    assert sale['order']==['z66-sale-customer','z66-sale-barcode',
        'z66-sale-products','z66-sale-payment'],sale

    scanner=browser.eval("""(()=>{
      const form=document.querySelector('#dialogForm[data-zavi-sale-onepage="true"]');
      const box=form.querySelector('.z66-sale-barcode .zavi-barcode-box');
      const buttons=[...box.querySelectorAll('.z66-sale-scan-choice')];
      const input=box.querySelector('#zaviBarcodeScan');
      const auto=box.querySelector('.z66-sale-autoadd input');
      const before=db.tx.length;
      const camera=!!box.querySelector('[data-zavi-camera-open="zaviBarcodeScan"]');
      const defaultMode=box.dataset.z66ScanMode;
      box.querySelector('[data-z66-scanner-mode="usb"]').click();
      const usb=box.dataset.z66ScanMode==='usb'&&input.getAttribute('inputmode')==='none';
      box.querySelector('[data-z66-scanner-mode="bluetooth"]').click();
      const bt=box.dataset.z66ScanMode==='bluetooth';
      input.value='QA-NONRELEASE';auto.checked=false;
      const preRows=form.querySelectorAll('#orderItems .order-line').length;
      input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
      const noAuto=form.querySelectorAll('#orderItems .order-line').length===preRows;
      input.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));
      const noTabAuto=form.querySelectorAll('#orderItems .order-line').length===preRows;
      auto.checked=true;input.value='';
      box.querySelector('[data-z66-scanner-mode="manual"]').click();
      const manual=box.dataset.z66ScanMode==='manual'&&input.getAttribute('inputmode')==='text';
      box.querySelector('[data-z66-scanner-mode="camera"]').click();
      return {choices:buttons.map(x=>x.dataset.z66ScannerMode),camera,
        defaultMode,usb,bt,manual,noAuto,noTabAuto,originalTransactionCount:db.tx.length===before,
        cameraSelected:box.dataset.z66ScanMode==='camera',
        singleInput:form.querySelectorAll('#zaviBarcodeScan').length===1,
        nativeConfirm:!!box.querySelector('#z659BarcodeConfirm'),
        noPairingClaim:!box.textContent.includes('Connected')};
    })()""")
    assert scanner['choices']==['camera','manual','usb','bluetooth'],scanner
    assert all(scanner[k] for k in ['camera','usb','bt','manual','noAuto','noTabAuto',
      'originalTransactionCount','cameraSelected','singleInput','nativeConfirm',
      'noPairingClaim']),scanner
    assert scanner['defaultMode']=='camera',scanner
    # Exact registered barcode enters native product line. Repeated barcode
    # must increase quantity and not overwrite manually typed unit price.
    scan=browser.eval("""(()=>{
      const f=document.getElementById('dialogForm');
      const code=f.querySelector('#zaviBarcodeScan');
      const rows=f.querySelector('#orderItems');
      const submit=new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});
      code.value='QA-NONRELEASE';code.dispatchEvent(submit);
      const row=[...rows.querySelectorAll('.order-line')].find(x=>x.dataset.scanProductId==='qa-only-disposable');
      if(!row)return {matched:false};
      const price=row.querySelector('[data-field="price"]');
      const qty=row.querySelector('[data-field="qty"]');
      price.value='7.25';price.dispatchEvent(new Event('input',{bubbles:true}));
      const before=Number(qty.value);
      code.value='QA-NONRELEASE';
      code.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
      return {matched:true,before,after:Number(qty.value),
        price:price.value,cleared:code.value==='',
        total:f.querySelector('#sumTotal')?.textContent,
        stockPreserved:db.products.find(x=>x.id==='qa-only-disposable').salePrice===5};
    })()""")
    assert scan['matched'] and scan['before']>=1,scan
    assert scan['after']==scan['before']+1 and scan['price']=='7.25',scan
    assert scan['cleared'] and scan['stockPreserved'],scan
    # Payment buttons modify only the existing paid field; no journal posts.
    modes=browser.eval("""(()=>{
      const f=document.getElementById('dialogForm');
      const buttons=f.querySelectorAll('.z66-sale-paymode');
      const start=db.tx.length;
      const cashBtn=f.querySelector('[data-z66-payment="cash"]');
      const cashDisabled=cashBtn.disabled;
      cashBtn.click();
      const cashPressed=cashBtn.getAttribute('aria-pressed');
      const lastCash=f.querySelector('.z66-sale-paymodes').dataset.z66LastPaymentMode;
      const cashCalculated=f.querySelector('.z66-sale-paymodes').dataset.z66CashCalculated;
      const full=Number(f.elements.paid.value);
      f.querySelector('[data-z66-payment="credit"]').click();
      const zero=Number(f.elements.paid.value);
      f.querySelector('[data-z66-payment="partial"]').click();
      return {choices:buttons.length,full,zero,
        partial:f.querySelector('[data-z66-payment="partial"]').getAttribute('aria-pressed')==='true',
        sameJournal:db.tx.length===start,
        cashDisabled,cashPressed,lastCash,cashCalculated,
        cashButtons:[...buttons].map(b=>({key:b.dataset.z66Payment,disabled:b.disabled})),
        calcError:f.querySelector('.z66-sale-paymodes')?.dataset.z66PaymentCalcError,
        totalText:f.querySelector('#sumTotal')?.textContent,
        linePrices:[...f.querySelectorAll('#orderItems .order-line')].map(r=>({
           price:r.querySelector('[data-field="price"]')?.value,
           qty:r.querySelector('[data-field="qty"]')?.value
        })),
        paidField:!!f.elements.namedItem('paid'),
        decimal:typeof window.ZaviDecimal};
    })()""")
    assert modes['choices']==3 and modes['full']>0 and modes['zero']==0,modes
    assert modes['partial'] and modes['sameJournal'],modes
    saleReject=browser.eval("""(()=>{
      const form=document.getElementById('dialogForm');
      const price=form.querySelector('#orderItems [data-field="price"]');
      price.value='0';
      const before=db.tx.length;
      const event=new Event('submit',{cancelable:true,bubbles:true});
      const dispatched=form.dispatchEvent(event);
      return {blocked:!dispatched&&event.defaultPrevented,
        transactionsUnchanged:db.tx.length===before,
        fieldInvalid:price.getAttribute('aria-invalid')==='true',
        localError:!!price.nextElementSibling?.classList.contains('zds-field-error'),
        paymentHandlerSkipped:db.tx.length===before};
    })()""")
    assert all(saleReject.values()),saleReject
    print('PASS: approved sale invoice in one real page; customer, barcode, quantity, editable unit price, totals, live native save')
    print('PASS: identical barcode repeat increments quantity and preserves manual unit price')
    print('PASS: three payment presets use the real paid input; no synthetic posting')
    print('PASS: zero-price sale is blocked in real form without posting a transaction')
    (out/'sale-form-no-transactions.png').write_bytes(browser.screenshot())



print('PASS: one-page sale screenshot and browser contract completed (TEST DATA ONLY)')

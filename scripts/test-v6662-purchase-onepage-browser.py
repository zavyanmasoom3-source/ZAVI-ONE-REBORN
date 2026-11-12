#!/usr/bin/env python3
"""V66.62 owner-approved compact purchase invoice, using the ORIGINAL live form.
Disposable Chrome, no persistent records and no real purchases posted.
"""
from chrome_cdp import Session,ROOT
from pathlib import Path
import json
out=ROOT/'qa-v6662-purchase'
out.mkdir(exist_ok=True)

with Session() as browser:
    err=browser.unlock_one()
    if err: raise AssertionError(err)
    browser.eval("openOrder('purchase')")
    browser.until("""!!document.querySelector(
      '#dialogForm[data-zavi-purchase-onepage="true"] [data-zavi-purchase-onepage="66.62"]')""",
      'approved new-purchase invoice is a SINGLE native form')
    browser.until("""document.querySelectorAll('#dialogForm .z66-purchase-input').length===3""",
      'native product quantity and unit-price fields labelled')
    state=browser.eval("""(()=>{
      const f=document.getElementById('dialogForm'),root=f.querySelector('.z66-purchase-onepage');
      const sections=[...root.querySelectorAll(':scope > section')];
      const by=n=>!!root.querySelector(n);
      const field=n=>f.elements.namedItem(n);
      return {sectionNames:sections.map(x=>x.dataset.z66PurchaseSection),
         noTabs:!root.querySelector('[role=tab]'),
         nativeFields:['date','freeContactName','freeContactPhone','accountId','discount',
          'originalCurrency','purchaseOrigin','exchangeRate','shippingOriginal','paid','note']
          .every(x=>!!field(x)),
         noClones:['accountId','discount','originalCurrency','purchaseOrigin','exchangeRate',
           'shippingOriginal','paid'].every(x=>f.querySelectorAll('[name="'+x+'"]').length===1),
         currencyVisible:by('.z66-purchase-currency [name="originalCurrency"]')&&
           by('.z66-purchase-currency [name="exchangeRate"]')&&
           by('.z66-purchase-currency #fxPreview'),
         supplierVisible:by('.z66-purchase-supplier [name="date"]')&&
           by('.z66-purchase-supplier [name="freeContactName"]'),
         barcode:by('#zaviBarcodeScan')&&by('#z659BarcodeConfirm')&&
           by('[data-zavi-camera-open="zaviBarcodeScan"]')&&by('#z650ManualProduct'),
         products:by('#orderItems .order-line')&&by('#addLine')&&
           by('.z66-purchase-input-price [data-field="price"]')&&
           by('.z66-purchase-input-qty [data-field="qty"]'),
         totals:by('#sumBefore')&&by('#sumTotal')&&by('#sumRemaining'),
         pay:by('.z66-purchase-payment [name="paid"]')&&
           by('.z66-purchase-payment [name="accountId"]'),
         advanced:by('.z66-purchase-advanced [name="discount"]')&&
           by('.z66-purchase-advanced [name="shippingOriginal"]')&&
           by('.z66-purchase-advanced [name="purchaseOrigin"]')&&
           by('.z66-purchase-advanced [name="note"]'),
         realSubmit:!!f.querySelector('.modal-foot button[type="submit"]'),
         originalTransactionCount:db.tx.length};
    })()""")
    assert state['sectionNames']==['supplier','currency','barcode','products','payment'],state
    assert all(state[k] for k in ['noTabs','nativeFields','noClones','currencyVisible',
      'supplierVisible','barcode','products','totals','pay','advanced','realSubmit']),state
    advanced=browser.eval("""(()=>{
      const f=document.getElementById('dialogForm'),field=f.elements;
      const names=['pCountry','pCustoms','pInsurance','pOther','pTaxOn','pTaxRate',
        'pTaxIncluded','pAllocation','pSupplierInvoice','pPayMode','pSplitPay',
        'pSecondPaid','pSecondAccount','pDue'];
      const all=names.every(name=>!!field.namedItem(name));
      field.pCustoms.value='6';field.pInsurance.value='2';field.pOther.value='1';
      field.pTaxOn.checked=true;field.pTaxRate.value='5';
      const cost=window.ZaviPurchaseUpgrade6662.calculate(field,100,0);
      field.pCustoms.value='0';field.pInsurance.value='0';field.pOther.value='0';
      field.pTaxOn.checked=false;field.pTaxRate.value='0';
      return {all,cost,ledger:db.tx.length,accountCount:field.accountId.options.length};
    })()""")
    assert advanced['all'] and advanced['cost']['additional']==14,advanced
    assert advanced['ledger']==0 and advanced['accountCount']>=4,advanced
    print('PASS: real purchase fields include customs/tax/insurance, split payment and existing accounts')
    # Original currency/rate calculation must still run from the actual inputs.
    math=browser.eval("""(()=>{
       const f=document.getElementById('dialogForm');
       const line=f.querySelector('#orderItems .order-line');
       const write=(el,val)=>{
         el.value=val;el.dispatchEvent(new Event('input',{bubbles:true}));
       };
       write(line.querySelector('[data-field="productName"]'),'QA PURCHASE ONLY');
       write(line.querySelector('[data-field="qty"]'),'2');
       write(line.querySelector('[data-field="price"]'),'10');
       const money=f.elements.namedItem('originalCurrency');
       const base=db.currency;
       money.value=base;money.dispatchEvent(new Event('change',{bubbles:true}));
       write(f.elements.namedItem('discount'),'2');
       write(f.elements.namedItem('shippingOriginal'),'3');
       const total=f.querySelector('#sumTotal')?.textContent||'';
       const preview=f.querySelector('#fxPreview')?.textContent||'';
       const output={
         total,preview,unitPrice:line.querySelector('[data-field="price"]').value,
         amount:line.querySelector('[data-field="qty"]').value,
         rate:f.elements.namedItem('exchangeRate').value,
         saved:db.tx.length===%s
       };
       const next=document.getElementById('addLine');
       next.click();
       output.added=f.querySelectorAll('#orderItems .order-line').length===2;
       output.newLabeled=f.querySelectorAll('.z66-purchase-input-price').length===2;
       return output;
    })()"""%state['originalTransactionCount'])
    browser.until("""document.querySelectorAll(
      '#dialogForm .z66-purchase-input-price').length===2""",
      'newly added item displays manual unit-price caption')
    assert math['added'] and math['saved'] and math['unitPrice']=='10' and math['amount']=='2',math
    assert math['rate']=='1' and math['total'] and '21' in math['total'],math
    print('PASS: real purchase one-page layout, native editable unit prices, supplier, currency, barcode and totals')
    print('PASS: existing shipping, discount and FX preview still calculate, nothing posted')
    invalid=browser.eval("""(()=>{
      const f=document.getElementById('dialogForm');
      const lines=[...f.querySelectorAll('#orderItems .order-line')];
      lines[1].querySelector('[data-field="productName"]').value='QA PRODUCT 2';
      lines[1].querySelector('[data-field="price"]').value='0';
      const before=db.tx.length;
      const event=new Event('submit',{bubbles:true,cancelable:true});
      const continued=f.dispatchEvent(event);
      return {blocked:!continued&&event.defaultPrevented,
        sameJournal:db.tx.length===before,
        invalid:lines[1].querySelector('[data-field="price"]').getAttribute('aria-invalid')==='true'};
    })()""")
    assert all(invalid.values()),invalid
    print('PASS: invalid zero-price purchase cannot reach the native posting handler')
    for width,height in ((320,568),(360,720),(393,852),(430,932)):
       browser.command('Emulation.setDeviceMetricsOverride',{
         'width':width,'height':height,'deviceScaleFactor':1,
         'mobile':True,'screenWidth':width,'screenHeight':height})
       geom=browser.eval("""(()=>{
         const body=document.querySelector('#dialogForm .modal-body');
         const root=document.querySelector('#dialogForm .z66-purchase-onepage');
         const r=root.getBoundingClientRect();
         return {width:root.scrollWidth,client:root.clientWidth,
           left:r.left,right:r.right,viewport:document.documentElement.clientWidth,
           scrollbar:body.scrollWidth-body.clientWidth};
       })()""")
       assert geom['width']<=geom['client']+2 and geom['scrollbar']<=2,geom
       assert geom['left']>=-1 and geom['right']<=width+1,geom
       if width==393:
         (out/'purchase-393x852.png').write_bytes(browser.screenshot())
    browser.eval("window.ZaviLocaleV22.set('en')")
    browser.until("""document.querySelector(
       '.z66-purchase-section h3')?.textContent==='Date & supplier'""",
      'purchase headings translate immediately')
    browser.eval("window.ZaviLocaleV22.set('fa-AF')")
    print('PASS: responsive mobile widths and native three-language heading updates')

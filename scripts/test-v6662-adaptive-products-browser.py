#!/usr/bin/env python3
"""V66.62: original product modal, adaptive 21-trade categories and metadata.
Disposable browser. No saved purchases, invoices, products or remote writes.
"""
from chrome_cdp import Session,ROOT
from pathlib import Path
out=ROOT/'qa-v6662-adaptive-products'
out.mkdir(exist_ok=True)

with Session() as browser:
    error=browser.unlock_one()
    if error: raise AssertionError(error)
    browser.until("""window.ZaviProductCategories6662?.profiles?.length===21
          && window.ZAVIUnified20?.profiles?.length===21""",
      '21 owner business choices and 21 actual category profiles')
    state=browser.eval("""(()=>{
       window.__qaTradeOriginal=zaviBusinessTypeV638;
       window.__qaActiveOriginal=window.zaviActiveIndustry;
       zaviBusinessTypeV638=()=> 'accessories';
       window.zaviActiveIndustry=()=> 'accessories';
       openEntity('product');
       return {before:db.products.length,txBefore:db.tx.length};
    })()""")
    try:
      print('ADAPTIVE DEBUG',browser.eval("""(()=>{
      const f=document.getElementById('dialogForm');
      const c=f?.querySelector('.z629-industry');
      return {modal:!!f,title:document.querySelector('.modal-head h3')?.textContent,
         class:f?.className,dataset:f?.dataset.z66ProductTrade,
         presentFields:!!f?.elements?.namedItem('openingQty')&&!!f?.elements?.namedItem('category'),
         category:window.zaviActiveIndustry?.(),industry:typeof zaviBusinessTypeV638==='function'?zaviBusinessTypeV638():null,
         countCategories:window.ZaviProductCategories6662?.profiles?.length,
         schema:c?.dataset.z629Type,colour:!!c?.querySelector('.z66-color-editor'),
         overlays:document.querySelectorAll('#overlay').length,
         scripts:[...document.querySelectorAll('script[src]')].filter(x=>x.src.includes('product-adaptive')).map(x=>x.src)};
    })()"""),flush=True)
      browser.until("""!!document.querySelector('#dialogForm.z66-product-editor[data-z66-product-trade="accessories"] .z66-color-editor[data-z66-color-editor="1"]')""",
        'real accessories product form enhanced with native variants')
    except Exception:
      debug=browser.eval("""(()=>{
        const f=document.getElementById('dialogForm');
        return {
          modal:document.querySelector('.modal-head h3')?.textContent,
          productForm:!!f,
          tradeGetter:zaviBusinessTypeV638(),
          activeGetter:window.zaviActiveIndustry?.(),
          currentSchema:window.ZaviIndustryForms6529?.types?.length,
          firstFields:[...f?.querySelectorAll('[name]')||[]].slice(0,25).map(x=>x.name),
          enhanced:f?.className,
          dataset:f?.dataset?.z66ProductTrade,
          industry:f?.querySelector('.z629-industry')?.dataset?.z629Type,
          editor:!!f?.querySelector('.z66-color-editor'),
          category:!!f?.querySelector('[name=category]'),
          errors:window.ZaviProductAdaptiveError||null
        }
      })()""")
      print('DEBUG accessory mount:',debug,flush=True)
      raise
    initial=browser.eval("""(()=>{
      const form=document.getElementById('dialogForm');
      return {
        categoryOptions:[...form.querySelectorAll('#zawiCategoryOptions option')].map(x=>x.value),
        brand:!!form.querySelector('[data-z629-key="brand"]'),
        model:!!form.querySelector('[data-z629-key="model"]'),
        variant:!!form.querySelector('[data-z629-key="colorVariants"]'),
        rate:!!form.elements.namedItem('productPriceCurrency'),
        nativeSku:!!form.elements.namedItem('sku').value,
        barcodeCamera:!!form.querySelector('[data-zavi-camera-open="z66ProductPrimaryBarcode"]'),
        photo:!!form.querySelector('#zaviProductPhotoInput'),
        photoCamera:!!form.querySelector('.z66-photo-camera input[type=file][capture=environment]'),
        originalSave:typeof form.onsubmit==='function',
        trade:form.dataset.z66ProductTrade,
        extraBarcodes:!!form.elements.namedItem('barcodes')
      };
    })()""")

    approved=browser.eval("""(()=>{
      const f=document.getElementById('dialogForm');
      const types=[...f.querySelector('[data-z66-registration-industry]').options];
      const code=f.elements.namedItem('sku');
      const barcode=f.querySelector('#z66ProductPrimaryBarcode');
      const buttons=[...f.querySelectorAll('.z66-reg-method')];
      const camera=f.querySelector('[data-zavi-camera-open="z66ProductPrimaryBarcode"]');
      const codes=f.elements.namedItem('barcodes').value.split(String.fromCharCode(10)).filter(Boolean);
      const before=db.products.length,tx=db.tx.length;
      const a=f.querySelector('.z66-registration-scanner');
      a.querySelector('[data-z66-scan-mode="usb"]').click();
      const usb=barcode.getAttribute('inputmode')==='none';
      a.querySelector('[data-z66-scan-mode="bluetooth"]').click();
      barcode.value='QA-REG-BT-01';
      barcode.dispatchEvent(new Event('input',{bubbles:true}));
      const kb=new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});
      barcode.dispatchEvent(kb);
      a.querySelector('[data-z66-scan-mode="manual"]').click();
      const manual=barcode.getAttribute('inputmode')==='text';
      const synced=f.elements.namedItem('barcodes').value.split(String.fromCharCode(10)).includes('QA-REG-BT-01');
      const sameCatalog=window.ZaviBarcodeV641.inspect(db.products,code.value,
         f.elements.namedItem('barcodes').value.split(String.fromCharCode(10))).ok;
      const beforeSku=code.value;
      const sb=f.querySelector('.z66-reg-segment');
      sb.querySelectorAll('button')[1].click();code.value='QA-MANUAL-SKU-21';
      code.dispatchEvent(new Event('input',{bubbles:true}));
      return {types:types.length,trade:f.dataset.z66ProductNativeTrade,
        camera:!!camera,methods:buttons.length,usb,manual,synced,
        noPosting:db.products.length===before&&db.tx.length===tx,
        skuAuto:!!beforeSku,skuManual:code.value==='QA-MANUAL-SKU-21',
        nativeCodes:sameCatalog,cameraIsNative:camera?.getAttribute('type')==='button'};
    })()""")
    assert approved['types']==21 and approved['trade']=='accessories',approved
    assert all(approved[k] for k in ['camera','usb','manual','synced','noPosting',
      'skuAuto','skuManual','nativeCodes','cameraIsNative']),approved
    assert approved['methods']==4,approved
    assert initial['trade']=='accessories' and initial['originalSave'],initial
    assert all(initial[k] for k in ['brand','model','variant','rate','nativeSku',
      'barcodeCamera','photo','photoCamera','extraBarcodes']),initial
    assert 'پوش و قاب موبایل' in initial['categoryOptions'],initial
    entered=browser.eval("""(()=>{
      const f=document.getElementById('dialogForm'),editor=f.querySelector('.z66-color-editor');
      const add=editor.querySelector('[data-z66-add-color]');
      const put=(el,value)=>{
         el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));
      };
      add.click();add.click();
      const [a,b]=editor.querySelectorAll('.z66-variant-row');
      put(a.querySelector('[data-z66-color]'),'سیاه');
      put(a.querySelector('[data-z66-qty]'),'5');
      put(a.querySelector('[data-z66-barcode]'),'QA-BLACK-01');
      put(b.querySelector('[data-z66-color]'),'سفید');
      put(b.querySelector('[data-z66-qty]'),'3');
      put(b.querySelector('[data-z66-barcode]'),'QA-WHITE-01');
      const savedByNative=JSON.parse(f.querySelector('[data-z629-key="colorVariants"]').value);
      const total=f.elements.namedItem('openingQty').value;
      const before=db.products.length,tx=db.tx.length;
      let nativeCalled=false;
      f.onsubmit=e=>{nativeCalled=true;e.preventDefault()};
      const event=new Event('submit',{bubbles:true,cancelable:true});
      f.dispatchEvent(event);
      return {total,barcodes:f.elements.namedItem('barcodes').value.split(/\\n/),
        variants:savedByNative,after:JSON.parse(f.querySelector('[data-z629-key="colorVariants"]').value),
        nativeCalled,notPosted:db.products.length===before&&db.tx.length===tx,
        originalSku:f.elements.namedItem('sku').value};
    })()""")
    assert entered['total']=='8' and len(entered['variants'])==2,entered
    assert entered['barcodes']==['QA-BLACK-01','QA-WHITE-01'],entered
    assert entered['nativeCalled'] and entered['notPosted'],entered
    # Invalid duplicate colour must stop the native submit handler in capture.
    duplicate=browser.eval("""(()=>{
      const f=document.getElementById('dialogForm');
      const rows=f.querySelectorAll('.z66-variant-row');
      rows[1].querySelector('[data-z66-color]').value='سیاه';
      rows[1].querySelector('[data-z66-color]').dispatchEvent(
         new Event('input',{bubbles:true}));
      let nativeCalled=false;
      f.onsubmit=e=>{nativeCalled=true;e.preventDefault()};
      const ev=new Event('submit',{bubbles:true,cancelable:true});
      f.dispatchEvent(ev);
      return {nativeCalled,blocked:ev.defaultPrevented,
        error:f.querySelector('.z66-product-status').textContent,
        unchanged:db.products.length===%s&&db.tx.length===%s};
    })()"""%(state['before'],state['txBefore']))
    assert duplicate['blocked'] and not duplicate['nativeCalled'] and duplicate['unchanged'],duplicate
    browser.eval("document.getElementById('cancelModal').click()")
    browser.eval("""(()=>{
      zaviBusinessTypeV638=()=> 'gold';
      window.zaviActiveIndustry=()=> 'gold';
      openEntity('product');
    })()""")
    browser.until("""!!document.querySelector('#dialogForm.z66-product-editor[data-z66-product-trade="gold"] [data-z629-key="jewelryKind"]')""",
      'genuine gold catalogue: locket and jewellery set')
    gold=browser.eval("""(()=>{
      const f=document.getElementById('dialogForm'),c=f.elements.namedItem('category');
      const kind=f.querySelector('[data-z629-key="jewelryKind"]');
      const locket=f.querySelector('[data-z629-key="locketType"]').closest('.z629-field');
      const pieces=f.querySelector('[data-z629-key="setPieces"]').closest('.z629-field');
      c.value='لاکت طلا';c.dispatchEvent(new Event('change',{bubbles:true}));
      const locketVisible=!locket.hidden&&pieces.hidden&&kind.value==='لاکت طلا';
      c.value='سیت (ست) طلا';c.dispatchEvent(new Event('change',{bubbles:true}));
      pieces.querySelector('.z66-set-pieces input[value="گردنبند"]').click();
      pieces.querySelector('.z66-set-pieces input[value="گوشواره"]').click();
      const actual=window.ZaviIndustryForms6529.collect(f.querySelector('.z629-industry'),'gold');
      return {locketVisible,
         setVisible:!pieces.hidden&&locket.hidden,
         setSelected:actual.values.jewelryKind==='سیت (ست) طلا',
         pieces:actual.values.setPieces,
         noPosting:db.tx.length===%s&&db.products.length===%s};
    })()"""%(state['txBefore'],state['before']))
    assert gold['locketVisible'] and gold['setVisible'] and gold['setSelected'],gold
    assert 'گردنبند' in gold['pieces'] and 'گوشواره' in gold['pieces'] and gold['noPosting'],gold
    (out/'gold-set-native-form.png').write_bytes(browser.screenshot())
    browser.eval("""(()=>{
      zaviBusinessTypeV638=window.__qaTradeOriginal;
      window.zaviActiveIndustry=window.__qaActiveOriginal;
      document.getElementById('cancelModal').click();
    })()""")
    print('PASS: 21 businesses and adaptive original form with category choices')
    print('PASS: mobile cases multi-colour quantities and unique barcode integration with native input')
    print('PASS: duplicate colour blocked without any product or transaction write')
    print('PASS: gold locket / jewellery set fields, pieces and no native ledger mutation')

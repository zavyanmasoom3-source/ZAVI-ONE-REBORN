#!/usr/bin/env python3
"""Native invoice camera/keyboard barcode event routing to distinct colour stock.
Synthetic disposable Chrome session; never calls live Supabase or posts customer data.
"""
from chrome_cdp import Session

with Session() as browser:
    error=browser.unlock_one()
    if error: raise AssertionError(error)
    browser.eval("""(()=>{
      window.__qaCanEditOriginal=window.zaviCloudCanEdit;
      window.__qaAfterSaveOriginal=window.zaviCloudAfterSave;
      window.zaviCloudCanEdit=()=>true;
      window.zaviCloudAfterSave=()=>{};
      const ok=commit(n=>{
        const p={id:'qa-barcode-colour-one',name:'QA Colour Scanner Case',
          sku:'QA-SCAN-BASE',salePrice:20,purchasePrice:10,openingQty:7,openingCost:10,
          reorder:1,category:'پوش موبایل',barcodes:['QA-SCAN-BLACK','QA-SCAN-WHITE'],
          industryDetails:{type:'accessories',values:{colorVariants:JSON.stringify([
            {color:'سیاه',qty:4,barcode:'QA-SCAN-BLACK'},
            {color:'سفید',qty:3,barcode:'QA-SCAN-WHITE'}])}}};
        ZaviVariantInventory6662.begin(p,ZaviVariantInventory6662.rows(p),7,n.tx);
        n.products.push(p);
      });
      if(!ok)throw Error('Fixture product failed to commit');
      openOrder('sale');
    })()""")
    browser.until("!!document.querySelector('#dialogForm #zaviBarcodeScan')",
                  "original sale scanner input ready")
    result=browser.eval("""(()=>{
      const field=document.getElementById('zaviBarcodeScan');
      const scan=code=>{field.value=code;
        field.dispatchEvent(new Event('input',{bubbles:true}));
        field.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
      };
      scan('QA-SCAN-BLACK');
      scan('QA-SCAN-BLACK');
      scan('QA-SCAN-WHITE');
      const form=document.getElementById('dialogForm');
      const lines=[...form.querySelectorAll('.order-line')].filter(
        x=>x.querySelector('[data-field="productName"]').value.trim());
      const before=lines.map(x=>({name:x.querySelector('[data-field="productName"]').value,
        qty:Number(x.querySelector('[data-field="qty"]').value),
        variant:x.querySelector('[data-field="variantKey"]').value}));
      form.elements.paid.value='60';
      form.requestSubmit();
      const p=db.products.find(x=>x.id==='qa-barcode-colour-one');
      const t=db.tx.at(-1);
      const after=ZaviVariantInventory6662.verify(p,db.tx,stockOf(p.id));
      return {before,type:t?.type,items:t?.items?.map(x=>({variant:x.variantKey,qty:x.qty})),
        after:after.map(x=>x.qty),stock:stockOf(p.id)};
    })()""")
    assert len(result['before'])==2,result
    assert result['before'][0]['variant']=='سیاه' and result['before'][0]['qty']==2,result
    assert result['before'][1]['variant']=='سفید' and result['before'][1]['qty']==1,result
    assert result['type']=='sale' and len(result['items'])==2,result
    assert result['after']==[2,2] and result['stock']==4,result
    browser.eval("""(()=>{
      window.zaviCloudCanEdit=window.__qaCanEditOriginal;
      window.zaviCloudAfterSave=window.__qaAfterSaveOriginal;
    })()""")
    print('PASS: actual V66.62 barcode Enter handler, repeat same colour increments quantity, distinct colour gets separate stock and invoice line')

#!/usr/bin/env python3
"""Disposable browser QA: native product, invoice, stock, barcode and void paths.
No Supabase writes. The original owner UI is exercised without replacing save().
"""
from chrome_cdp import Session

with Session() as browser:
    err=browser.unlock_one()
    if err: raise AssertionError(err)
    browser.eval("""(()=>{
      window.__qaOriginalTrade=zaviBusinessTypeV638;
      window.__qaOriginalActive=window.zaviActiveIndustry;
      window.__qaCanEdit=window.zaviCloudCanEdit;
      window.__qaCloudSave=window.zaviCloudAfterSave;
      window.zaviCloudCanEdit=()=>true;
      window.zaviCloudAfterSave=()=>{};
      zaviBusinessTypeV638=()=> 'accessories';
      window.zaviActiveIndustry=()=> 'accessories';
      openEntity('product');
    })()""")
    browser.until("""!!document.querySelector('#dialogForm.z66-product-editor .z66-color-editor')""",
                  "native product form with colour editor")
    created=browser.eval("""(()=>{
      const f=document.getElementById('dialogForm'), put=(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};
      put(f.elements.name,'QA CASE UNIQUE 662');
      put(f.elements.purchasePrice,'10');
      put(f.elements.salePrice,'100');
      const ed=f.querySelector('.z66-color-editor'), add=ed.querySelector('[data-z66-add-color]');
      add.click();add.click();
      const rows=[...ed.querySelectorAll('.z66-variant-row')];
      for(const [idx,color,barcode,qty] of [[0,'سیاه','QA-V662-BLACK','5'],[1,'سفید','QA-V662-WHITE','3']]){
        put(rows[idx].querySelector('[data-z66-color]'),color);
        put(rows[idx].querySelector('[data-z66-qty]'),qty);
        put(rows[idx].querySelector('[data-z66-barcode]'),barcode);
      }
      const before=db.products.length,txBefore=db.tx.length;
      f.requestSubmit();
      const p=db.products.find(x=>x.name==='QA CASE UNIQUE 662');
      return {created:!!p,id:p?.id,qty:p?.openingQty,ledger:!!p?.variantLedger,
              current:p?ZaviVariantInventory6662.verify(p,db.tx,stockOf(p.id)).map(x=>x.qty):[],
              before,after:db.products.length,txBefore,txAfter:db.tx.length,valid:f.checkValidity(),invalid:[...f.querySelectorAll(':invalid')].map(x=>x.name||x.outerHTML.slice(0,90)),toast:document.getElementById('toast')?.textContent,qtyInput:f.elements.openingQty.value,barcodes:f.elements.barcodes.value,canEdit:window.zaviCloudCanEdit?.()};
    })()""")
    assert created['created'] and created['ledger'] and created['qty']==8,created
    assert created['after']==created['before']+1 and created['current']==[5,3],created

    sale=browser.eval("""(()=>{
      const p=db.products.find(x=>x.id===%s);
      openOrder('sale');
      const form=document.getElementById('dialogForm'),row=form.querySelector('.order-line');
      const put=(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};
      put(row.querySelector('[data-field="productName"]'),p.name);
      const variant=row.querySelector('[data-field="variantKey"]');
      put(variant,ZaviVariantInventory6662.key('سیاه'));
      put(row.querySelector('[data-field="qty"]'),'2');
      put(row.querySelector('[data-field="price"]'),'100');
      put(form.elements.paid,'200');
      const prev=db.tx.length;
      form.requestSubmit();
      const t=db.tx.at(-1),remainder=ZaviVariantInventory6662.verify(p,db.tx,stockOf(p.id));
      return {before:prev,after:db.tx.length,id:t?.id,type:t?.type,variant:t?.items?.[0]?.variantKey,
        q:remainder.map(x=>x.qty),productQty:stockOf(p.id),total:t?.items?.[0]?.qty};
    })()"""%repr(created['id']))
    assert sale['after']==sale['before']+1 and sale['type']=='sale',sale
    assert sale['q']==[3,3] and sale['productQty']==6,sale

    purchased=browser.eval("""(()=>{
      const p=db.products.find(x=>x.id===%s);
      openOrder('purchase');
      const f=document.getElementById('dialogForm'),row=f.querySelector('.order-line');
      const put=(el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))};
      put(row.querySelector('[data-field="productName"]'),p.name);
      put(row.querySelector('[data-field="variantKey"]'),ZaviVariantInventory6662.key('سفید'));
      put(row.querySelector('[data-field="qty"]'),'4');
      put(row.querySelector('[data-field="price"]'),'10');
      put(f.elements.paid,'40');
      const previous=db.tx.length;
      f.requestSubmit();
      return {old:previous,now:db.tx.length,type:db.tx.at(-1)?.type,
        balance:ZaviVariantInventory6662.verify(p,db.tx,stockOf(p.id)).map(x=>x.qty),
        total:stockOf(p.id)};
    })()"""%repr(created['id']))
    assert purchased['now']==purchased['old']+1 and purchased['type']=='purchase',purchased
    assert purchased['balance']==[3,7] and purchased['total']==10,purchased

    void=browser.eval("""(()=>{
      const prior=window.confirm;window.confirm=()=>true;
      try{voidDocument(%s)}finally{window.confirm=prior}
      const p=db.products.find(x=>x.id===%s);
      return {voided:db.tx.find(t=>t.id===%s)?.voided===true,
        total:stockOf(p.id),balance:ZaviVariantInventory6662.verify(p,db.tx,stockOf(p.id)).map(x=>x.qty),
        durable:!!JSON.parse(localStorage.getItem(KEY)||'{}').products?.find(x=>x.id===p.id)?.variantLedger};
    })()"""%(repr(sale['id']),repr(created['id']),repr(sale['id'])))
    assert void['voided'] and void['total']==12 and void['balance']==[5,7] and void['durable'],void

    browser.eval("""(()=>{
      zaviBusinessTypeV638=window.__qaOriginalTrade;
      window.zaviActiveIndustry=window.__qaOriginalActive;
      window.zaviCloudCanEdit=window.__qaCanEdit;
      window.zaviCloudAfterSave=window.__qaCloudSave;
    })()""")
    print("PASS native original 66.62 product registration, variant sale/purchase, real saved lines, void and durable offline ledger")

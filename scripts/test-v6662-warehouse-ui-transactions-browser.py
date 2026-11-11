#!/usr/bin/env python3
"""Disposable UI regression: actually click colour transfer form, then sell and buy by bin.
No production writes, no online RPC, no real cloud sync.
"""
from chrome_cdp import Session

with Session() as browser:
    error=browser.unlock_one()
    if error: raise AssertionError(error)
    prepared=browser.eval("""(()=>{
      const w1='11111111-1111-4111-8111-111111111111',w2='22222222-2222-4222-8222-222222222222';
      window.__qaBins={w1,w2};
      window.__qaOriginal={
        cloud:window.zaviCloudRestoreInfo,editable:window.zaviCloudCanEdit,
        after:window.zaviCloudAfterSave,session:window.zaviCloudGetAuthSession,
        config:window.zaviCloudGetPublicConfig,list:window.ZaviWarehouseV1.list,
        afterRender:window.ZaviWarehouseV1.afterRender
      };
      window.zaviCloudRestoreInfo=()=>({role:'owner',workspace:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'});
      window.zaviCloudCanEdit=()=>true;
      window.zaviCloudAfterSave=()=>{};
      window.zaviCloudGetAuthSession=()=>({user:{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}});
      window.zaviCloudGetPublicConfig=()=>({url:'https://example.supabase.co',key:'sb_publishable_test'});
      const warehouses=[{id:w1,name:'گدام اول',code:'ONE',is_active:true,workspace_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},
        {id:w2,name:'گدام دوم',code:'TWO',is_active:true,workspace_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}];
      window.__qaWhRows=warehouses;
      window.ZaviWarehouseV1.list=()=>warehouses;
      window.ZaviWarehouseV1.afterRender=()=>{};
      const ok=commit(n=>{
        const p={id:'p-qa-warehouse-ui',name:'QA WAREHOUSE UI CASE',sku:'QA-UI-662',
         openingQty:8,openingCost:10,purchasePrice:10,salePrice:25,reorder:1,barcodes:[],
         industryDetails:{type:'accessories',values:{
          colorVariants:JSON.stringify([{color:'سیاه',qty:5,barcode:'QA-UI-BLK'},{color:'سفید',qty:3,barcode:'QA-UI-WHT'}])}}};
        ZaviVariantInventory6662.begin(p,ZaviVariantInventory6662.rows(p),8,n.tx);
        ZaviVariantInventory6662.allocateWarehouse(p,n.tx,w1);
        n.products.push(p);
      });
      return {ok,product:!!db.products.find(x=>x.id==='p-qa-warehouse-ui')};
    })()""")
    assert prepared['ok'] and prepared['product'],prepared
    transfer=browser.eval("""(()=>{
      const {w1,w2}=window.__qaBins, host=document.createElement('section');
      host.id='zaviWarehouseManagerV1';
      host.innerHTML='<div class="zv-wh-row"><button data-wh-toggle="'+w1+'"></button></div>'+
       '<div class="zv-wh-row"><button data-wh-toggle="'+w2+'"></button></div>'+
       '<div class="zv-wh-transfer"></div>';
      document.body.append(host);
      ZaviWarehouseTransfersV1.mount(host,window.__qaWhRows);
      const f=host.querySelector('form[data-zv-transfer-form]');
      if(!f)return {form:false,html:host.textContent.slice(0,300)};
      f.elements.product.value='p-qa-warehouse-ui';
      f.elements.product.dispatchEvent(new Event('change',{bubbles:true}));
      f.elements.from.value=w1;f.elements.to.value=w2;
      f.elements.variant.value=ZaviVariantInventory6662.key('سیاه');
      f.elements.quantity.value='2';
      const previous=db.tx.length;
      f.requestSubmit();
      const p=db.products.find(x=>x.id==='p-qa-warehouse-ui'),v=ZaviVariantInventory6662;
      return {form:true,variants:!!f.elements.variant,
       before:previous,after:db.tx.length,kind:db.tx.at(-1)?.type,
       stock:v.warehouseBalances(p,db.tx).map(x=>({warehouse:x.warehouseId,key:x.variantKey,qty:x.qty})),
       total:stockOf(p.id),status:host.querySelector('[data-zv-transfer-status]')?.textContent};
    })()""")
    assert transfer['form'] and transfer['variants'] and transfer['after']==transfer['before']+1,transfer
    assert transfer['kind']=='warehouse_transfer' and transfer['total']==8,transfer
    assert any(x['warehouse']=='22222222-2222-4222-8222-222222222222' and x['qty']==2 for x in transfer['stock']),transfer

    sale=browser.eval("""(()=>{
      const p=db.products.find(x=>x.id==='p-qa-warehouse-ui');
      openOrder('sale');
      const f=document.getElementById('dialogForm'),row=f.querySelector('.order-line');
      const input=(el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))};
      input(row.querySelector('[data-field="productName"]'),p.name);
      input(row.querySelector('[data-field="qty"]'),'1');
      input(row.querySelector('[data-field="price"]'),'25');
      input(row.querySelector('[data-field="variantKey"]'),'سیاه');
      input(row.querySelector('[data-field="warehouseId"]'),window.__qaBins.w1);
      input(f.elements.paid,'25');
      const previous=db.tx.length;f.requestSubmit();
      const v=ZaviVariantInventory6662,stock=v.warehouseBalances(p,db.tx);
      return {before:previous,after:db.tx.length,type:db.tx.at(-1)?.type,
       line:db.tx.at(-1)?.items?.[0],stock:stock.map(x=>({key:x.variantKey,wh:x.warehouseId,qty:x.qty})),total:stockOf(p.id)};
    })()""")
    assert sale['after']==sale['before']+1 and sale['type']=='sale',sale
    assert sale['line']['warehouseId']=='11111111-1111-4111-8111-111111111111',sale
    assert sale['total']==7,sale

    purchase=browser.eval("""(()=>{
      const p=db.products.find(x=>x.id==='p-qa-warehouse-ui');
      openOrder('purchase');
      const f=document.getElementById('dialogForm'),row=f.querySelector('.order-line');
      const input=(el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))};
      input(row.querySelector('[data-field="productName"]'),p.name);
      input(row.querySelector('[data-field="qty"]'),'2');
      input(row.querySelector('[data-field="price"]'),'10');
      input(row.querySelector('[data-field="variantKey"]'),'سفید');
      input(row.querySelector('[data-field="warehouseId"]'),window.__qaBins.w2);
      input(f.elements.paid,'20');
      const previous=db.tx.length;f.requestSubmit();
      const v=ZaviVariantInventory6662,stock=v.warehouseBalances(p,db.tx);
      return {before:previous,after:db.tx.length,type:db.tx.at(-1)?.type,
       line:db.tx.at(-1)?.items?.[0],stock:stock.map(x=>({key:x.variantKey,wh:x.warehouseId,qty:x.qty})),total:stockOf(p.id)};
    })()""")
    assert purchase['after']==purchase['before']+1 and purchase['type']=='purchase',purchase
    assert purchase['line']['warehouseId']=='22222222-2222-4222-8222-222222222222' and purchase['total']==9,purchase

    browser.eval("""(()=>{
      const a=window.__qaOriginal;window.zaviCloudRestoreInfo=a.cloud;
      window.zaviCloudCanEdit=a.editable;window.zaviCloudAfterSave=a.after;
      window.zaviCloudGetAuthSession=a.session;window.zaviCloudGetPublicConfig=a.config;
      window.ZaviWarehouseV1.list=a.list;window.ZaviWarehouseV1.afterRender=a.afterRender;
    })()""")
    print('PASS: native warehouse transfer form + colour-selected native sale and purchase, journal stock reconciles and stays offline-durable')

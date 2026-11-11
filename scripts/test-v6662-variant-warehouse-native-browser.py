#!/usr/bin/env python3
"""Real V66.62 accounting snapshot, two warehouses and colour transfer.
Browser instance is disposable. No live Supabase writes or customer data touched.
"""
from chrome_cdp import Session

with Session() as browser:
    error=browser.unlock_one()
    if error: raise AssertionError(error)
    browser.eval("""(()=>{
      window.__variantTestOriginal={
       restore:window.zaviCloudRestoreInfo,
       canEdit:window.zaviCloudCanEdit,
       afterSave:window.zaviCloudAfterSave,
       list:window.ZaviWarehouseV1?.list,
       afterRender:window.ZaviWarehouseV1?.afterRender
      };
      window.zaviCloudRestoreInfo=()=>({role:'owner',workspace:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'});
      window.zaviCloudCanEdit=()=>true;
      window.zaviCloudAfterSave=()=>{};
      const one='11111111-1111-4111-8111-111111111111';
      const two='22222222-2222-4222-8222-222222222222';
      window.__variantTestBinA=one;window.__variantTestBinB=two;
      window.ZaviWarehouseV1.list=()=>[
       {id:one,name:'گدام مرکزی',code:'MAIN',is_active:true,workspace_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},
       {id:two,name:'گدام دوم',code:'SECOND',is_active:true,workspace_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}
      ];
      window.ZaviWarehouseV1.afterRender=()=>{};
      const original=db.products.length;
      const ok=commit(n=>{
       const p={id:'p_variant_warehouse_qa',name:'QA VARIANT WAREHOUSE',sku:'QA-WH-662',
        openingQty:8,openingCost:10,purchasePrice:10,salePrice:25,barcodes:[],
        category:'پوش موبایل',reorder:1,industryDetails:{type:'accessories',
         values:{colorVariants:JSON.stringify([
          {color:'سیاه',barcode:'QA-VH-BLACK',qty:5},
          {color:'سفید',barcode:'QA-VH-WHITE',qty:3}
         ])}}};
       const variants=ZaviVariantInventory6662.rows(p);
       ZaviVariantInventory6662.begin(p,variants,8,n.tx);
       ZaviVariantInventory6662.allocateWarehouse(p,n.tx,one);
       n.products.push(p);
      });
      if(!ok||db.products.length!==original+1)throw Error('QA product not committed');
    })()""")
    result=browser.eval("""(()=>{
      const v=ZaviVariantInventory6662,p=db.products.find(x=>x.id==='p_variant_warehouse_qa');
      const before=db.tx.length;
      const data={id:'qa-wh-move-001',productId:p.id,variantKey:v.key('سیاه'),
       fromWarehouseId:window.__variantTestBinA,toWarehouseId:window.__variantTestBinB,
       qty:'3',reference:'QA test only'};
      const posted=window.zaviVariantWarehousePost(data);
      const moved=db.tx.find(x=>x.id===data.id);
      const bins=window.zaviVariantWarehouseRead().filter(x=>x.productId===p.id);
      const durable=JSON.parse(localStorage.getItem(KEY)||'{}');
      const snapshot=durable.tx.find(x=>x.id===data.id);
      let duplicate='';try{window.zaviVariantWarehousePost(data)}catch(e){duplicate=e.message||String(e)}
      let overdraft='';try{window.zaviVariantWarehousePost({...data,id:'qa-wh-overdraft',qty:'8'})}
        catch(e){overdraft=e.message||String(e)}
      const post=db.tx.length;
      return {posted,before,after:post,moved:!!moved,stored:!!snapshot,duplicate,overdraft,
       unchangedCash:db.tx.filter(x=>x.type==='sale'||x.type==='purchase').length,
       bins:bins.map(x=>({key:x.variantKey,warehouse:x.warehouseId,qty:x.qty})),
       sum:v.verify(p,db.tx,8).reduce((n,x)=>n+x.qty,0),
       verifies:v.verifyWorkspace(db)};
    })()""")
    assert result['posted'] and result['moved'] and result['stored'],result
    assert result['after']==result['before']+1 and result['duplicate'] and result['overdraft'],result
    assert result['sum']==8 and result['verifies'],result
    assert any(x['warehouse']=='22222222-2222-4222-8222-222222222222' and x['qty']==3
               and x['key']=='سیاه' for x in result['bins']),result
    assert any(x['warehouse']=='11111111-1111-4111-8111-111111111111' and x['qty']==2
               and x['key']=='سیاه' for x in result['bins']),result
    browser.eval("""(()=>{
      const a=window.__variantTestOriginal;
      window.zaviCloudRestoreInfo=a.restore;
      window.zaviCloudCanEdit=a.canEdit;
      window.zaviCloudAfterSave=a.afterSave;
      window.ZaviWarehouseV1.list=a.list;
      window.ZaviWarehouseV1.afterRender=a.afterRender;
    })()""")
    print('PASS: real colour warehouse bridge, signed-in owner scope, atomic snapshot commit, duplicate/overdraw rejection, durable offline balance')

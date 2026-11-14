#!/usr/bin/env python3
"""Regression for the ACTUAL V66.62 products route, not a mocked tab fixture.

The old suite checked the product modal, but never checked that the warehouse
manager and its four approved tabs were mounted in the real page. Disposable
Chrome profile only; does not mutate Supabase or production accounting.
"""
from chrome_cdp import Session, ROOT
from pathlib import Path

out=ROOT/'qa-v6662-products-approved'
out.mkdir(exist_ok=True)

with Session() as browser:
    error=browser.unlock_one()
    if error: raise AssertionError(error)
    browser.route('products')
    browser.until("""!!document.querySelector('#content [data-zavi-flow="products"]')
      && !!document.querySelector('#zaviWarehouseManagerV1 [data-wh-add]')""",
      'native approved products tabs and actual warehouse creation form appear',
      seconds=18)
    info=browser.eval("""(()=>{
      const root=document.querySelector('#content [data-zavi-flow="products"]');
      const tabs=[...root.querySelectorAll('.zavi-flow-tabs > [role=tab]')];
      const manager=root.querySelector('#zaviWarehouseManagerV1');
      const scanner=root.querySelector('.zavi-products-scanner-details .z638-warehouse-scanner');
      const add=manager?.querySelector('[data-wh-add]');
      return {
        tabs:tabs.map(t=>t.textContent.trim()),
        labels:tabs.map(t=>t.dataset.zaviFlowLabel),
        manager:!!manager,scanner:!!scanner,
        overview:!!root.querySelector('.zavi-products-overview > .report-grid'),
        cards:root.querySelectorAll('.zavi-products-overview .report-grid > .card').length,
        addForm:!!add,warehouseName:!!add?.querySelector('[name=warehouse_name]'),
        warehouseCode:!!add?.querySelector('[name=warehouse_code]'),
        addHidden:!!add?.hidden,
        labelButton:!!root.querySelector('.zavi-products-label-panel [data-action=barcode_label]'),
        productButton:!!document.querySelector('#content .page-head [data-action=product]'),
        duplicateLabel:!!document.querySelector('#zavi-label-launcher'),
        stockHistory:!!manager?.querySelector('.zv-wh-history'),
        transfer:!!manager?.querySelector('.zv-wh-transfer'),
        active:root.dataset.activeTab
      };
    })()""")
    assert info['labels']==['products','warehouses','movements','labels'],info
    assert all(info[k] for k in ('manager','scanner','addForm','warehouseName','warehouseCode',
                                  'labelButton','productButton','stockHistory','transfer')),info
    assert not info['addHidden'] and not info['duplicateLabel'],info
    assert info['overview'] and info['cards']>=4,info
    for index in range(4):
        browser.eval("""document.querySelectorAll('#content [data-zavi-flow=products] .zavi-flow-tabs [role=tab]')[%d].click()"""%index)
        result=browser.eval("""(()=>{
          const root=document.querySelector('#content [data-zavi-flow=products]');
          return {
            active:root.dataset.activeTab,
            visible:[...root.querySelectorAll(':scope > [role=tabpanel]')]
                  .map(p=>!p.hidden),
            selected:[...root.querySelectorAll('.zavi-flow-tabs > [role=tab]')]
                  .map(t=>t.getAttribute('aria-selected'))
          };
        })()""")
        assert result['active']==str(index) and result['visible']==[i==index for i in range(4)],result
        assert result['selected']==['true' if i==index else 'false' for i in range(4)],result
    # Exact owner-approved inventory screen: real three movement actions and
    # compact warehouse forms instead of a bare read-only history projection.
    flow=browser.eval("""(()=>{
      const root=document.querySelector('#content [data-zavi-flow=products]');
      const buttons=[...root.querySelectorAll('[data-zavi-stock-action]')];
      const add=root.querySelector('.zavi-warehouse-add-fold');
      const transfer=root.querySelector('.zavi-warehouse-transfer-fold');
      return {
        actions:buttons.map(b=>b.dataset.zaviStockAction),
        addFold:!!add,addSummary:add?.querySelector('summary')?.textContent,
        transferFold:!!transfer,
        formInside:!!add?.querySelector('[data-wh-add] [name=warehouse_code]'),
        stockFold:!!root.querySelector('.zavi-warehouse-stock-fold .zv-wh-stock'),
        historyFold:!!root.querySelector('.zavi-warehouse-history-fold .zv-wh-history')
      };
    })()""")
    assert flow['actions']==['transfer','receive','adjust'],flow
    assert all(flow[k] for k in ('addFold','transferFold','formInside','stockFold','historyFold')),flow
    browser.eval("""(()=>{
      const root=document.querySelector('#content [data-zavi-flow=products]');
      root.querySelector('[data-zavi-flow-label=movements]').click();
      root.querySelector('[data-zavi-stock-action=transfer]').click();
    })()""")
    navigation=browser.eval("""(()=>{
      const root=document.querySelector('#content [data-zavi-flow=products]');
      return {
        active:root.dataset.activeTab,
        open:!!root.querySelector('.zavi-warehouse-transfer-fold[open]'),
        transfer:!!root.querySelector('.zv-wh-transfer')
      };
    })()""")
    assert navigation=={'active':'1','open':True,'transfer':True},navigation
    browser.eval("""(()=>{
      // Stock adjustment is correctly blocked when the native product
      // catalogue is empty. Seed one disposable in-memory product first.
      if(!db.products.some(p=>p.id==='z66-qa-label-only'))
        db.products.push({id:'z66-qa-label-only',name:'QA-only label product',
          sku:'QA-128-66',barcodes:['QA-128-66'],salePrice:25,purchasePrice:10,
          category:'QA',openingQty:0,reorder:0});
      const root=document.querySelector('#content [data-zavi-flow=products]');
      root.querySelector('[data-zavi-flow-label=movements]').click();
      root.querySelector('[data-zavi-stock-action=adjust]').click();
    })()""")
    browser.until("""!!document.querySelector('#dialogForm') &&
      !!document.querySelector('#dialogForm [name="productId"]')""",
      'real stock adjustment opens native accounting form',seconds=9)
    browser.eval("closeModal();go('products')")
    browser.until("""!!document.querySelector('#content [data-zavi-flow=products]')""",
                  'return to approved stock movements',seconds=10)
    browser.eval("""(()=>{
      const root=document.querySelector('#content [data-zavi-flow=products]');
      root.querySelector('[data-zavi-flow-label=movements]').click();
      root.querySelector('[data-zavi-stock-action=receive]').click();
    })()""")
    browser.until("""!!document.querySelector('#content [data-z66pm-pane=orders]') &&
      !document.querySelector('#content [data-z66pm-pane=orders]').hidden""",
      'receive goods opens the native in-transit purchase and server receipt view',seconds=12)
    browser.eval("go('products');openEntity('product')")
    browser.until("""!!document.querySelector('#dialogForm.z66-product-editor .zavi-product-three-step')
      && !!document.querySelector('#dialogForm [data-zavi-product-flow=true]')""",
      'native product edit uses all three approved sections',seconds=12)
    productForm=browser.eval("""(()=>{
      const f=document.querySelector('#dialogForm.z66-product-editor');
      const flow=f.querySelector('.zavi-product-three-step');
      const panes=[...flow.querySelectorAll(':scope > .zavi-product-step-panel')];
      const present=(i,name)=>!!panes[i].querySelector('[name="'+name+'"]');
      return {
        panes:panes.length,tabs:flow.querySelectorAll('.zavi-product-step-tab').length,
        first:present(0,'name')&&present(0,'sku')&&present(0,'category'),
        second:present(1,'openingQty')&&present(1,'salePrice')&&present(1,'reorder'),
        third:present(2,'barcodes')&&!!panes[2].querySelector('#zaviProductPhotoInput')
              &&!!panes[2].querySelector('.z629-industry'),
        nativeSave:typeof f.onsubmit==='function',
        barcodeMethods:f.querySelectorAll('.z66-reg-method').length,
        photoOptional:!!f.querySelector('.zavi-product-optional #zaviProductPhotoInput'),
        active:flow.dataset.activeStep
      };
    })()""")
    assert productForm['panes']==3 and productForm['tabs']==3,productForm
    assert all(productForm[k] for k in ('first','second','third','nativeSave','photoOptional')),productForm
    assert productForm['barcodeMethods']==4 and productForm['active']=='0',productForm
    for i in range(3):
        browser.eval("""document.querySelectorAll(
            '#dialogForm .zavi-product-step-tab')[%d].click()"""%i)
        state=browser.eval("""(()=>{
          const f=document.querySelector('#dialogForm'),flow=f.querySelector('.zavi-product-three-step');
          return {
            active:flow.dataset.activeStep,
            displayed:[...flow.querySelectorAll(':scope > .zavi-product-step-panel')].map(p=>!p.hidden),
            tabs:[...flow.querySelectorAll('.zavi-product-step-tab')].map(t=>t.getAttribute('aria-selected'))
          };
        })()""")
        assert state['active']==str(i) and state['displayed']==[j==i for j in range(3)],state
        assert state['tabs']==['true' if j==i else 'false' for j in range(3)],state
    browser.eval("closeModal()")
    print('PASS original V66.62 3-step native product form, compact authenticated warehouse forms and 3 live stock actions')
    # Existing barcode builder must launch, with real product list supplied in
    # the test's disposable in-memory ledger (no saved purchases/sales).
    browser.eval("""(()=>{
      if(!db.products.some(p=>p.id==='z66-qa-label-only'))
        db.products.push({id:'z66-qa-label-only',name:'QA-only label product',
         sku:'QA-128-66',barcodes:['QA-128-66'],salePrice:25,purchasePrice:10,
         category:'QA',openingQty:0,reorder:0});
      if(typeof go==='function')go('products');
    })()""")
    browser.until("""!!document.querySelector('#content [data-zavi-flow=products]')""",
                  'approved product tabs survive native rerender',seconds=14)
    browser.eval("""document.querySelector('#content [data-zavi-flow=products] [data-zavi-flow-label=labels]').click()""")
    browser.eval("""document.querySelector('#content .zavi-products-label-panel [data-action=barcode_label]').click()""")
    browser.until("""!!document.querySelector('#dialogForm #z-label-type')""",
                  'actual printable barcode modal opens from approved Labels tab',seconds=10)
    label=browser.eval("""(()=>{
      const f=document.querySelector('#dialogForm');
      return {
        name:f.querySelector('#z-label-product')?.selectedOptions[0]?.textContent,
        code:f.querySelector('#z-label-code')?.value,
        type:[...f.querySelector('#z-label-type').options].map(o=>o.value),
        size:[...f.querySelector('#z-label-size').options].map(o=>o.value),
        copies:f.querySelector('#z-label-copies')?.value,
        toggleName:!!f.querySelector('#z-label-name'),
        togglePrice:!!f.querySelector('#z-label-price'),
        preview:!!f.querySelector('#z-label-preview .zavi-label-bars')
      };
    })()""")
    assert label['name']=='QA-only label product' and label['code']=='QA-128-66',label
    assert label['type']==['code128','ean13'],label
    assert '50x30' in label['size'] and label['copies']=='1',label
    assert label['toggleName'] and label['togglePrice'] and label['preview'],label
    browser.eval("closeModal()")
    for width,height in ((320,720),(390,844),(430,932)):
        browser.command('Emulation.setDeviceMetricsOverride',{
            'width':width,'height':height,'deviceScaleFactor':1,'mobile':True,
            'screenWidth':width,'screenHeight':height})
        geometry=browser.eval("""(()=>{
          const root=document.querySelector('#content [data-zavi-flow=products]');
          const t=root?.querySelector('.zavi-flow-tabs');
          const a=root?.querySelector('.zavi-flow-tab');
          return {
            width:document.documentElement.clientWidth,
            scroll:document.getElementById('content').scrollWidth,
            client:document.getElementById('content').clientWidth,
            tabWidth:t?.getBoundingClientRect().width,
            buttonHeight:a?.getBoundingClientRect().height,
            manager:!!root?.querySelector('[data-wh-add]')
          };
        })()""")
        assert geometry['scroll']<=geometry['client']+3,(width,geometry)
        assert geometry['tabWidth']>0 and geometry['buttonHeight']>=40 and geometry['manager'],geometry
    print('PASS native V66.62 four-tab products, visible warehouse add form, scanner, real printable label and 320-430px layout')

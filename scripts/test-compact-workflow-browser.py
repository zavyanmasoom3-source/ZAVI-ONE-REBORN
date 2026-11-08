#!/usr/bin/env python3
"""Run REAL accounting routes in a throwaway browser profile.

This test verifies presentation-only reparenting of existing live controls.
It does not submit transactions or touch the server; no real data is mutated.
"""
from chrome_cdp import Session, ROOT
from pathlib import Path
import json

out=ROOT/'qa-compact-workflow'
out.mkdir(exist_ok=True)

with Session() as browser:
    browser.navigate('one')
    browser.unlock_one()
    browser.until("document.querySelectorAll('#mobileBottom .bottom-btn').length===5",
                  'five bottom navigation slots')
    nav=browser.eval("""(()=>{
       const items=[...document.querySelectorAll('#mobileBottom .bottom-btn')];
       return {ids:items.map(x=>x.dataset.go),
        labels:items.map(x=>x.innerText.trim())};
    })()""")
    assert nav['ids']==['dashboard','sales','products','purchases','more'],nav
    print('PASS: exact five mobile destinations:',nav['ids'])
    quick=browser.eval("""(()=>{
      const root=document.querySelector('.zavi-dash-fast-actions');
      if(!root)return {present:false};
      const actual=[...root.querySelectorAll('[data-zavi-fast-action]')]
        .map(el=>el.dataset.zaviFastAction);
      const expected=['sales','purchases','debtors','products'].filter(id=>zaviModuleEnabled(id));
      const date=document.querySelector('.zui-dashboard-page .zv-today')?.textContent||'';
      return {present:true,actual,expected,dualDate:date.includes('|')};
    })()""")
    assert quick['present'] and quick['actual']==quick['expected'] and quick['dualDate'],quick
    print('PASS: permission-filtered dashboard actions link to live routes; compact dual date rendered')
    for route,keys in [
      ('money',['accounts','transactions','more']),
      ('reports',['summary','details','output'])
    ]:
      state=browser.route(route)
      assert state['selected'] and state['visible'] and not state['locked'],state
      browser.until(
        "document.querySelector('[data-zavi-flow="+json.dumps(route)+"]')!==null",
        route+' real tab containers')
      result=browser.eval("""(()=>{
        const route=%s;
        const flow=document.querySelector('[data-zavi-flow="'+route+'"]');
        const tabs=[...flow.querySelectorAll('[role=tab]')];
        const panels=[...flow.querySelectorAll('[role=tabpanel]')];
        const checked={length:tabs.length,keys:tabs.map(x=>x.dataset.zaviFlowLabel),
         controls:tabs.every((x,i)=>x.getAttribute('aria-controls')===panels[i].id),
         firstVisible:!panels[0].hidden};
        tabs[1].click();
        checked.secondVisible=!panels[1].hidden && panels[0].hidden;
        tabs[2].click();
        checked.thirdVisible=!panels[2].hidden&&panels[1].hidden;
        checked.actionsRemain=route==='money'?
           !!panels[2].querySelector('[data-action="transfer"]'):
           !!panels[2].querySelector('[data-action="export_products"]');
        tabs[0].click();
        return checked;
      })()""" % json.dumps(route))
      assert result['length']==3 and result['keys']==keys and all(result[k] for k in
          ('controls','firstVisible','secondVisible','thirdVisible','actionsRemain')),result
      (out/(route+'.png')).write_bytes(browser.screenshot())
      print('PASS:',route,'live account/report controls remain connected across all three tabs')

    browser.eval("openOrder('purchase')")
    browser.until("!!document.querySelector('[data-zavi-flow=\"order\"]')",
                  'real purchase three-step modal')
    purchase=browser.eval("""(()=>{
       const form=document.getElementById('dialogForm');
       const flow=form.querySelector('[data-zavi-flow="order"]');
       const tabs=[...flow.querySelectorAll('[role="tab"]')];
       const panes=[...flow.querySelectorAll('[role="tabpanel"]')];
       const keys=tabs.map(x=>x.dataset.zaviFlowLabel);
       const original={
         itemContainer:form.querySelectorAll('#orderItems').length,
         name:!!form.querySelector('[data-field="productName"]'),
         account:!!form.elements.namedItem('accountId'),
         discount:!!form.elements.namedItem('discount'),
         pay:!!form.elements.namedItem('paid'),
         submit:!!form.querySelector('.modal-foot button[type=submit]'),
         submitOutsidePanels:!form.querySelector('.zavi-flow-panel .modal-foot'),
       };
       const details=panes[0].querySelector('[name=date]')!==null;
       const products=panes[1].querySelector('#orderItems')!==null;
       const payment=panes[2].querySelector('[name=paid]')!==null
         &&panes[2].querySelector('[name=accountId]')!==null;
       tabs[1].click();
       const shifted=!panes[1].hidden&&panes[0].hidden;
       const productInput=form.querySelector('[data-field="productName"]');
       const connected=productInput?.isConnected===true;
       return {keys,details,products,payment,shifted,connected,...original};
    })()""")
    assert purchase['keys']==['specs','products','payment'],purchase
    assert all(purchase[x] for x in ['itemContainer','name','account','discount','pay',
      'submit','submitOutsidePanels','details','products','payment','shifted','connected']),purchase
    (out/'purchase-form.png').write_bytes(browser.screenshot())
    print('PASS: purchase form has three live stages; all original named fields, product row and submit remain connected')
    # Synthetic in-memory-only product: this disposable browser has no customer
    # workspace or cloud authorization. Nothing is saved or synchronized.
    browser.eval("""(()=>{
       document.getElementById('cancelModal')?.click();
       db.products.push({id:'qa-only-disposable',name:'QA_NOT_A_REAL_PRODUCT',
         sku:'QA-NONRELEASE',category:'QA',salePrice:5,purchasePrice:3,
         openingQty:3,reorder:1});
       openOrder('sale');
       return true;
    })()""")
    browser.until("!!document.querySelector('[data-zavi-flow=\"order\"]')",
                  'real sale three-step modal')
    sale=browser.eval("""(()=>{
       const f=document.getElementById('dialogForm');
       const flow=f.querySelector('[data-zavi-flow="order"]');
       const panes=[...flow.querySelectorAll('[role="tabpanel"]')];
       return {keys:[...flow.querySelectorAll('[role="tab"]')].map(x=>x.dataset.zaviFlowLabel),
          product:!!panes[0].querySelector('#orderItems'),
          customer:!!panes[1].querySelector('[name="freeContactName"]'),
          payment:!!panes[2].querySelector('[name="paid"]') &&
             !!panes[2].querySelector('[name="accountId"]'),
          savePresent:!!f.querySelector('.modal-foot button[type=submit]'),
          rows:f.querySelectorAll('.order-line').length};
    })()""")
    assert sale['keys']==['products','customer','payment'] and sale['rows']>=1,sale
    assert all(sale[k] for k in ['product','customer','payment','savePresent']),sale
    (out/'sale-form-no-transactions.png').write_bytes(browser.screenshot())
    print('PASS: three-tab sales form keeps actual item, customer, payment and submit controls')

(out/'result.json').write_text(json.dumps({
  'scope':'real browser UI and existing live nodes only; no transaction submitted',
  'fiveNav':nav,'purchase':purchase,
  'moneyAndReportsThreeTabs':True,'financialPostingTested':False,
  'realDeviceTested':False
},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('PASS: real five-button navigation + money, report and purchase flow UI; financial posting not tested')

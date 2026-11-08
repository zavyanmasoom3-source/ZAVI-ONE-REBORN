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
        const flow=document.querySelector('[data-zavi-flow=%s]');
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

(out/'result.json').write_text(json.dumps({
  'scope':'real browser UI and existing live nodes only; no transaction submitted',
  'fiveNav':nav,'purchase':purchase,
  'moneyAndReportsThreeTabs':True,'financialPostingTested':False,
  'realDeviceTested':False
},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('PASS: real five-button navigation + money, report and purchase flow UI; financial posting not tested')

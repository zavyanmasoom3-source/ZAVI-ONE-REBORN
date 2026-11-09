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
      const root=document.querySelector('#content.zrf-dashboard>.zavi-native-home .zrf-quick-actions');
      if(!root)return {present:false};
      const buttons=[...root.querySelectorAll('.zrf-quick-action[data-zrf-go]')];
      const actual=buttons.map(el=>el.dataset.zrfGo);
      const expected=['sales','purchases','contacts','products'];
      const permissions=buttons.every(el=>el.disabled===!zaviModuleEnabled(el.dataset.zrfGo));
      const date=document.querySelector('.zui-dashboard-page .zv-today')?.textContent||'';
      return {present:true,actual,expected,permissions,dualDate:date.includes('|')};
    })()""")
    assert quick['present'] and quick['actual']==quick['expected'] and quick['permissions'] and quick['dualDate'],quick
    print('PASS: permission-filtered dashboard actions link to live routes; compact dual date rendered')
    # The sample rate exists only in memory inside this disposable test browser.
    # It is never committed to the app, cloud or a customer's workspace.
    rate=browser.eval("""(()=>{
       const original=db.usdRate,unit=db.currency;
       db.currency='AFN';db.usdRate=75;
       go('dashboard');
       const text=document.querySelector('.zavi-usd-rate-value')?.textContent||'';
       db.usdRate=original;db.currency=unit;
       go('dashboard');
       return text.trim();
    })()""")
    assert rate=='۱ USD = ۷۵ AFN',rate
    print('PASS: actual dashboard displays ۱ USD = ۷۵ AFN with uniform digits and correct order')
    cash=browser.eval("""(()=>{
      const account=db.accounts.find(x=>x.id==='a_cash');
      const initial=account.opening;
      const extra=[
        {id:'qa-cash-sale',type:'sale',accountId:'a_cash',paid:50,amount:50,
          date:'2026-11-09',created:'2026-11-09T10:00:00Z',items:[]},
        {id:'qa-cash-expense',type:'expense',accountId:'a_cash',amount:30,
          date:'2026-11-09',created:'2026-11-09T10:01:00Z'},
        {id:'qa-cash-transfer',type:'transfer',fromAccountId:'a_cash',
          toAccountId:'a_bank',amount:20,fee:2,date:'2026-11-09',
          created:'2026-11-09T10:02:00Z'}
      ];
      const origLength=db.tx.length;
      account.opening=200;db.tx.push(...extra);
      go('dashboard');
      const current=document.querySelector('[data-zavi-cash-current]')?.textContent;
      const details=document.querySelector('.zavi-dash-cash-card details');
      details.open=true;
      const got={
        current,
        opening:document.querySelector('[data-zavi-cash-opening]')?.textContent,
        incoming:document.querySelector('[data-zavi-cash-received]')?.textContent,
        outgoing:document.querySelector('[data-zavi-cash-paid]')?.textContent,
        balance:cashBalances().a_cash,
        liveMoneyButton:!!document.querySelector('.zavi-dash-cash-card [data-go=money]'),
        expected:{current:currency(198),opening:currency(200),
          incoming:currency(50),outgoing:currency(52)}
      };
      db.tx.length=origLength;account.opening=initial;go('dashboard');
      return got;
    })()""")
    assert cash['balance']==198 and cash['liveMoneyButton'],cash
    for key in ['current','opening','incoming','outgoing']:
        assert cash[key]==cash['expected'][key],cash
    print('PASS: dashboard cash = opening 200 + receipts 50 - outgoing 52 = 198 (disposable in-memory only)')
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

    # Synthetic memory-only ledger documents: never call commit()/save()/RPC.
    journal=browser.eval("""(()=>{
      db.journalNotes.push({id:'qa-local-note',date:'2026-11-09',
         text:'QA_UNSAVED_NOTE',created:'2026-11-09T12:00:00Z'});
      db.tx.push({id:'qa-local-expense',date:'2026-11-09',
         type:'expense',amount:1,paid:1,note:'QA_UNSAVED_TRANSACTION',
         created:'2026-11-09T12:01:00Z'});
      go('journal');
      const labels=[...document.querySelectorAll('[data-zavi-journal-tab]')]
         .map(x=>x.dataset.zaviJournalTab);
      const trans=document.querySelector('.zv-journal-list')?.textContent||'';
      const dual=!!document.querySelector('.zv-journal-item small')?.textContent.includes('|');
      document.querySelector('[data-zavi-journal-tab="notes"]').click();
      const notes=document.querySelector('.zv-journal-list')?.textContent||'';
      const state=typeof z659JournalTab!=='undefined'?z659JournalTab:'missing';
      document.querySelector('[data-zavi-journal-tab="inventory"]').click();
      const inv=document.querySelector('.zv18-insight');
      const display=inv&&getComputedStyle(inv).display!=='none';
      return {labels,transactionsOnly:trans.includes('QA_UNSAVED_TRANSACTION') &&
           !trans.includes('QA_UNSAVED_NOTE'),notesOnly:notes.includes('QA_UNSAVED_NOTE') &&
           !notes.includes('QA_UNSAVED_TRANSACTION'),noteState:state,
           visibleInventory:!!display,dual};
    })()""")
    assert journal['labels']==['transactions','notes','inventory'],journal
    assert journal['transactionsOnly'] and journal['notesOnly'] and journal['dual'],journal
    assert journal['noteState']=='notes' and journal['visibleInventory'],journal
    (out/'journal-inventory.png').write_bytes(browser.screenshot())
    print('PASS: journal transactions/notes independently filter actual in-memory records; inventory and dual date render')
    browser.route('products')
    browser.until("!!document.querySelector('[data-zavi-flow=\"products\"]')",
                  'inventory product warehouse movement tabs mounted')
    warehouse=browser.eval("""(()=>{
       const root=document.querySelector('[data-zavi-flow="products"]');
       const tabs=[...root.querySelectorAll('[role="tab"]')];
       const panels=[...root.querySelectorAll('[role="tabpanel"]')];
       const real=panels[1].querySelector('.zv-wh-manager');
       const first=!!panels[0].querySelector('section.card .table-bar')&&
           !!panels[0].querySelector('.z638-warehouse-scanner');
       tabs[1].click();
       const second=!panels[1].hidden && panels[0].hidden;
       tabs[2].click();
       const third=!panels[2].hidden && panels[1].hidden;
       const source=real?.querySelector('.zv-wh-history');
       const projected=panels[2].querySelector('.zavi-history-rows');
       return {keys:tabs.map(x=>x.dataset.zaviFlowLabel),
           first,second,third,manager:!!real,
           sameOriginalManager:real?.id==='zaviWarehouseManagerV1',
           formPreserved:!!real?.querySelector('form[data-wh-add]'),
           historySource:!!source,projection:!!projected&&!!projected.textContent.trim(),
           projectionReadOnly:!projected?.querySelector('form,input,button')};
    })()""")
    assert warehouse['keys']==['products','warehouses','movements'],warehouse
    assert all(warehouse[k] for k in ['first','second','third','manager',
       'sameOriginalManager','formPreserved','historySource','projection','projectionReadOnly']),warehouse
    (out/'inventory-warehouses-stock-history.png').write_bytes(browser.screenshot())
    print('PASS: three inventory tabs preserve the live warehouse editor and read-only actual server history')
    browser.route('purchases')
    purchaseActions=browser.eval("""(()=>{
      const container=document.querySelector('[data-module="purchases"]');
      return [...container.querySelectorAll('.page-head [data-action]')].map(x=>x.dataset.action);
    })()""")
    assert purchaseActions==['purchase','local_purchase','foreign_purchase','purchase_return'],purchaseActions
    browser.eval("document.querySelector('[data-action=\"local_purchase\"]').click()")
    browser.until("!!document.querySelector('#dialogForm [name=purchaseOrigin]')",
                  'domestic purchase form opened')
    domestic=browser.eval("document.querySelector('#dialogForm [name=purchaseOrigin]').value")
    assert domestic=='AF',domestic
    browser.eval("document.getElementById('cancelModal').click()")
    browser.eval("document.querySelector('[data-action=\"foreign_purchase\"]').click()")
    browser.until("!!document.querySelector('#dialogForm [name=purchaseOrigin]')",
                  'foreign purchase form opened')
    international=browser.eval("""(()=>{
      const f=document.getElementById('dialogForm');
      return {origin:f.elements.namedItem('purchaseOrigin').value,
        required:f.elements.namedItem('purchaseOrigin').required,
        productRows:f.querySelectorAll('.order-line').length};
    })()""")
    assert international['origin']=='' and international['required'] and international['productRows']>=1,international
    browser.eval("document.getElementById('cancelModal').click()")
    print('PASS: four purchase actions, domestic AF default and foreign free-text country required')
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
    inline=browser.eval("""(()=>{
       const form=document.getElementById('dialogForm');
       const name=form.querySelector('#orderItems [data-field="productName"]');
       name.value='';
       const valid=name.checkValidity();
       const panel=name.closest('[role="tabpanel"]');
       const error=name.nextElementSibling;
       return {blocked:!valid,invalid:name.getAttribute('aria-invalid')==='true',
          inline:!!error&&error.classList.contains('zds-field-error')&&!error.hidden,
          productTabOpened:!!panel&&!panel.hidden};
    })()""")
    assert all(inline.values()),inline
    print('PASS: invalid required product opens its real tab and displays localized field error underneath')
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
          customer:!!panes[0].querySelector('[name="freeContactName"]'),
          product:!!panes[1].querySelector('#orderItems'),
          payment:!!panes[2].querySelector('[name="paid"]') &&
             !!panes[2].querySelector('[name="accountId"]'),
          savePresent:!!f.querySelector('.modal-foot button[type=submit]'),
          rows:f.querySelectorAll('.order-line').length};
    })()""")
    assert sale['keys']==['customer','products','payment'] and sale['rows']>=1,sale
    assert all(sale[k] for k in ['product','customer','payment','savePresent']),sale
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
    print('PASS: zero-price sale submission is blocked at its field; no accounting document posted')
    (out/'sale-form-no-transactions.png').write_bytes(browser.screenshot())
    print('PASS: three-tab sales form keeps actual item, customer, payment and submit controls')

(out/'result.json').write_text(json.dumps({
  'scope':'real browser UI and existing live nodes only; no transaction submitted',
  'fiveNav':nav,'purchase':purchase,
  'moneyAndReportsThreeTabs':True,'financialPostingTested':False,
  'realDeviceTested':False
},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('PASS: real five-button navigation + money, report and purchase flow UI; financial posting not tested')

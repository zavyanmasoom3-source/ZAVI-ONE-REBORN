#!/usr/bin/env python3
"""Regression of accounting edge cases against real browser-side math.

No production records or client storage are changed: the fixture is a
disposable, in-memory business state inside headless Chrome only.
"""
from chrome_cdp import Session
import json

with Session() as browser:
 error=browser.unlock_one()
 if error:
  raise SystemExit('PIN setup failed: '+error)
 result=browser.eval("""(()=>{
  const d=blankDB();
  d.currency='AFN';
  d.products=[{id:'p1',name:'Fixture',sku:'QA-EDGE',openingQty:10,
       openingCost:5,purchasePrice:5,salePrice:15,reorder:2}];
  d.contacts=[
    {id:'c1',name:'Customer',type:'customer',openingReceivable:100,openingPayable:0},
    {id:'s1',name:'Supplier',type:'supplier',openingReceivable:0,openingPayable:60}
  ];
  d.accounts.find(a=>a.id==='a_cash').opening=1000;
  d.accounts.find(a=>a.id==='a_bank').opening=500;
  const row=(id,type,extra)=>({id,code:'QA-'+id,type,date:'2026-11-08',
      created:'2026-11-08T00:00:00Z',...extra});
  const items=(qty,price,cost)=>[{productId:'p1',qty,price,cost,productName:'Fixture'}];
  d.tx=[
   row('1','sale',{contactId:'c1',accountId:'a_cash',items:items(4,15,5),paid:20,discount:0}),
   row('2','sale_return',{contactId:'c1',accountId:'a_cash',items:items(1,15,5),paid:5,discount:0}),
   row('3','purchase',{contactId:'s1',accountId:'a_bank',items:items(5,8,8),paid:10,discount:0}),
   row('4','purchase_return',{contactId:'s1',accountId:'a_bank',items:items(2,8,8),paid:4,discount:0}),
   row('5','customer_payment',{contactId:'c1',accountId:'a_cash',amount:12}),
   row('6','supplier_payment',{contactId:'s1',accountId:'a_bank',amount:8}),
   row('7','expense',{accountId:'a_cash',amount:5}),
   row('8','transfer',{fromAccountId:'a_cash',toAccountId:'a_bank',amount:50,fee:2}),
   row('9','sale',{contactId:'c1',accountId:'a_cash',items:items(100,15,5),paid:300,voided:true}),
   row('10','supplier_debt',{contactId:'s1',amount:13}),
   row('11','customer_loan',{contactId:'c1',accountId:'a_cash',amount:9}),
   row('12','creditor_loan',{contactId:'s1',accountId:'a_cash',amount:7}),
   row('13','customer_payment',{contactId:'c1',accountId:'a_cash',amount:15,
      originalCurrency:'USD',originalAmount:0.2,exchangeRate:75})
  ];
  db=d;
  const cash=cashBalances(),contact=contactBalances(),stat=summary(),total=totals();
  return {
    stock:stockState().p1.qty,cash:cash.a_cash,bank:cash.a_bank,
    totalCash:total.cash,receivable:contact.c1.receivable,
    payable:contact.s1.payable,sales:stat.sales,purchases:stat.purchases,
    expenses:stat.expenses,cogs:stat.cogs,profit:stat.profit,
    transactionCount:db.tx.length,
    fxStored:db.tx[12].originalAmount===0.2&&db.tx[12].exchangeRate===75
  };
 })()""")
 expected={
    'stock':10,'cash':983,'bank':536,'totalCash':1519,
    'receivable':112,'payable':90,'sales':45,'purchases':24,
    'expenses':7,'cogs':15,'profit':23,'transactionCount':13,'fxStored':True
 }
 print(json.dumps(result,ensure_ascii=False,indent=2))
 for key,want in expected.items():
  actual=result.get(key)
  if isinstance(want,(int,float)) and not isinstance(want,bool):
   ok=isinstance(actual,(int,float)) and abs(want-actual)<.0001
  else:
   ok=actual==want
  if not ok:
   raise SystemExit('FAIL accounting edge case '+key+
                    ': expected '+str(want)+' got '+str(actual))
 print('PASS: returns, voided docs, opening debt, loan, transfer fee and stored-FX accounting')

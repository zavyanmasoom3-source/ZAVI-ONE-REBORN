#!/usr/bin/env python3
"""Non-destructive browser regression for populated ZAVI ONE workspaces.

All records exist exclusively in the disposable Chrome profile's in-memory
`db` object. No Supabase accounts, credentials or customer records are touched.
Checks old failure mode: only dashboard opens after data has been persisted.
"""
from chrome_cdp import Session
import json

ROUTES = (
    'dashboard', 'sales', 'purchases', 'products', 'contacts',
    'debtors', 'creditors', 'money', 'reports', 'settings'
)

with Session() as browser:
    auth_error = browser.unlock_one()
    if auth_error:
        raise SystemExit('PIN setup failed: ' + auth_error)
    expected = browser.eval("""
    (() => {
      if (typeof blankDB !== 'function' || typeof stockState !== 'function' ||
          typeof cashBalances !== 'function' || typeof contactBalances !== 'function') {
        throw Error('Accounting functions missing');
      }
      const state = blankDB();
      state.storeName = 'ZAVI QA - DISPOSABLE';
      state.storeConfigured = true;
      state.currency = 'AFN';
      state.accounts.find(a=>a.id==='a_cash').opening = 1000;
      state.accounts.find(a=>a.id==='a_bank').opening = 500;
      state.products = [{
        id:'p1',name:'Test Product',sku:'QA-001',category:'General',
        openingQty:20,openingCost:8,purchasePrice:8,salePrice:15,reorder:3
      }];
      state.contacts = [
        {id:'c1',name:'Test Customer',phone:'',type:'customer',
         openingReceivable:50,openingPayable:0,note:''},
        {id:'c2',name:'Test Supplier',phone:'',type:'supplier',
         openingReceivable:0,openingPayable:20,note:''}
      ];
      const tx=(id,type,extras)=>({
        id,code:'QA-'+id,type,date:'2026-11-08',
        created:'2026-11-08T00:00:00.000Z',note:'',
        ...extras
      });
      state.tx = [
        tx('1','sale',{contactId:'c1',accountId:'a_cash',paid:30,discount:0,
          items:[{productId:'p1',productName:'Test Product',qty:3,price:15,cost:8}]}),
        tx('2','purchase',{contactId:'c2',accountId:'a_bank',paid:20,discount:0,
          items:[{productId:'p1',productName:'Test Product',qty:5,price:10,cost:10}]}),
        tx('3','customer_payment',{contactId:'c1',accountId:'a_cash',amount:10}),
        tx('4','supplier_payment',{contactId:'c2',accountId:'a_bank',amount:5}),
        tx('5','transfer',{fromAccountId:'a_cash',toAccountId:'a_bank',amount:30,fee:1}),
        tx('6','expense',{accountId:'a_cash',amount:2})
      ];
      db = state; // in-memory only; do NOT invoke save()/commit() or cloud hooks
      const cash = cashBalances(), debt = contactBalances(), stock = stockState();
      const stats = summary(), aggregate = totals();
      return {
        count:db.tx.length, products:db.products.length,
        stock:stock.p1.qty, cash:cash.a_cash, bank:cash.a_bank,
        totalCash:aggregate.cash,
        receivable:debt.c1.receivable,
        payable:debt.c2.payable,
        sales:stats.sales, purchases:stats.purchases, profit:stats.profit,
        tenantBound:window.zaviTenantIsBound?.()||false
      };
    })()
    """)
    desired = {
        'count':6,'products':1,'stock':22,'cash':1007,'bank':505,
        'totalCash':1512,'receivable':55,'payable':45,
        'sales':45,'purchases':50,'profit':18,
        'tenantBound':False
    }
    for key, value in desired.items():
        actual = expected.get(key)
        if isinstance(value, (int,float)) and not isinstance(value, bool):
            valid = isinstance(actual, (int,float)) and abs(actual-value)<.0001
        else:
            valid = actual == value
        if not valid:
            raise SystemExit('FAIL financial invariant '+key+
                             ': expected '+str(value)+' got '+str(actual))
    checks = [browser.route(route) for route in ROUTES]
    failed = [item for item in checks if not
              (item['selected'] and item['active'] and item['visible'] and
               not item['locked'])]
    print(json.dumps({'financial':expected,'routes':checks},
                     ensure_ascii=False,indent=2))
    if failed:
        raise SystemExit('FAIL non-empty routes: '+str(failed))
    print('PASS: populated local accounting snapshot, cash/debt/stock math and 10 routes')

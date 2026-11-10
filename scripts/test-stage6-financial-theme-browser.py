#!/usr/bin/env python3
"""Stage 6: verify finance never changes under 3 languages x 3 themes.

Uses the actual ONE pages, not a fake UI, in a disposable Chromium profile.
No app save(), cloud account, customer identity, APK or production RPC.
"""
import json
from chrome_cdp import Session

with Session() as browser:
    err=browser.unlock_one()
    if err:raise SystemExit('Private PIN setup failed: '+err)
    baseline=browser.eval("""(()=>{
      if(typeof blankDB!=='function'||typeof summary!=='function')
        throw Error('Real accounting engine missing');
      const state=blankDB();
      state.storeName='STAGE6-SYNTHETIC';
      state.storeConfigured=true;
      state.currency='AFN';
      state.accounts.find(x=>x.id==='a_cash').opening=1000;
      state.accounts.find(x=>x.id==='a_bank').opening=500;
      state.products=[{id:'P-6',name:'QA only',sku:'QA6',openingQty:10,
        openingCost:5,purchasePrice:5,salePrice:20,reorder:1}];
      state.contacts=[{id:'C-6',name:'QA-only buyer',
        openingReceivable:25,openingPayable:0,type:'customer'}];
      state.tx=[
        {id:'S-6',type:'sale',date:'2026-11-10',created:'2026-11-10T00:00:00Z',
         accountId:'a_cash',contactId:'C-6',paid:25,discount:0,
         items:[{productId:'P-6',productName:'QA only',qty:2,price:20,cost:5}]},
        {id:'E-6',type:'expense',date:'2026-11-10',
         created:'2026-11-10T00:01:00Z',accountId:'a_cash',amount:3}
      ];
      db=state;
      const amounts=()=>({
        cash:cashBalances().a_cash,
        bank:cashBalances().a_bank,
        stock:stockState()['P-6'].qty,
        debt:contactBalances()['C-6'].receivable,
        sales:summary().sales,
        profit:summary().profit,
        txCount:db.tx.length
      });
      window.__stage6Amounts=amounts;
      return amounts();
    })()""")
    assert baseline=={'cash':1022,'bank':500,'stock':8,'debt':40,
                      'sales':40,'profit':27,'txCount':2},baseline
    report=[]
    for theme in ('light','dark','glass'):
        for language,expected_dir in [('fa-AF','rtl'),('ps-AF','rtl'),('en','ltr')]:
            state=browser.eval("""(()=>{
              const mode=%s,language=%s;
              window.ZaviThemeV29.set(mode);
              window.ZaviLocaleV22.set(language);
              // Navigate real routes and ensure switching the view cannot
              // mutate money, inventory or write an additional transaction.
              go('dashboard');go('sales');go('purchases');go('money');
              const amounts=window.__stage6Amounts();
              return {theme:window.ZaviThemeV29.get(),
                rootTheme:document.documentElement.dataset.zaviTheme,
                language:window.ZaviLocaleV22.get(),
                dir:document.documentElement.dir,amounts,
                content:!!document.querySelector('#content')?.innerText.trim(),
                active:page==='money'};
            })()"""%(json.dumps(theme),json.dumps(language)))
            assert state['theme']==theme and state['rootTheme']==theme,state
            assert state['language']==language and state['dir']==expected_dir,state
            assert state['amounts']==baseline,('FINANCIAL_DRIFT',state,baseline)
            assert state['content'] and state['active'],state
            report.append({'theme':theme,'language':language,'pass':True})
    print('PASS: 9 real Light/Dark/Glass x Dari/Pashto/English combinations, real routes')
    print('PASS: cash, bank, inventory, customer receivables and net profit unchanged')
    print('DISPOSABLE:',json.dumps({'baseline':baseline,'matrix':report},ensure_ascii=False))
    print('NOT VERIFIED: real Android physical device, multi-user production sessions')

#!/usr/bin/env node
/* Pure deterministic cheque accounting tests; no production data or network. */
'use strict';
const a=require('node:assert/strict');
const {process,minor,fxMinor}=require('../packages/shared/accounting/cheque-settlement-contract.js');
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const w=id(1),c=id(2),o=n=>id(n);
let base={
 workspaceId:w,baseCurrency:'AFN',events:[],journal:[],
 cheques:[{id:c,workspaceId:w,direction:'received',counterpartyId:'customer-A',
  amount:'100.00',settledAmount:'0.00',currency:'AFN',status:'pending'}]
};
const apply=e=>{const x=process(base,e);base=x.ledger;return x};
const evt=(n,kind,fields={})=>({operationId:o(n),chequeId:c,kind,...fields});
const d=apply(evt(10,'deposit'));a.equal(d.journalAdded,0);
apply(evt(11,'settle',{amount:'30.00',accountId:'a_bank'}));
a.equal(base.cheques[0].status,'partially_cleared');
a.equal(base.cheques[0].settledAmount,'30.00');
a.equal(base.journal[0].debit.account,'bank:a_bank');
a.equal(base.journal[0].credit.account,'accounts_receivable:customer-A');
a.equal(base.journal[0].debit.amount,'30.00');
apply(evt(12,'settle',{amount:'70.00',accountId:'a_bank'}));
a.equal(base.cheques[0].status,'cleared');
const before=JSON.stringify(base);
const duplicate=process(base,evt(12,'settle',{amount:'70.00',accountId:'a_bank'}));
a.equal(duplicate.replayed,true);a.equal(JSON.stringify(duplicate.ledger),before);
a.throws(()=>apply(evt(12,'settle',{amount:'1.00',accountId:'a_bank'})),/IDEMPOTENCY_KEY/);
a.throws(()=>apply(evt(13,'settle',{amount:'0.01',accountId:'a_bank'})),/INVALID_SETTLEMENT_STATE/);
a.throws(()=>apply(evt(14,'cancel')),/CANNOT_CANCEL/);
const bounce=apply(evt(15,'bounce'));
a.equal(bounce.journalAdded,2);
a.equal(base.cheques[0].status,'bounced');
a.equal(base.cheques[0].settledAmount,'0.00');
a.equal(base.journal.length,4);
const net=new Map();
for(const j of base.journal){
 a.equal(j.debit.amount,j.credit.amount);
 for(const [line,sgn] of [[j.debit,1n],[j.credit,-1n]])
  net.set(line.account,(net.get(line.account)||0n)+sgn*minor(line.amount,'POSTING'));
}
a.ok([...net.values()].every(v=>v===0n),'Bounce exactly reverses prior ledger');
a.equal(process(base,evt(15,'bounce')).journalAdded,0);
a.throws(()=>apply(evt(16,'settle',{amount:'1.00',accountId:'a_bank'})),/TERMINAL_CHEQUE_STATUS/);
const issued={workspaceId:w,baseCurrency:'AFN',events:[],journal:[],
 cheques:[{id:c,workspaceId:w,direction:'issued',counterpartyId:'supplier-B',
 amount:'55.00',currency:'AFN',status:'pending'}]};
const paid=process(issued,evt(20,'settle',{amount:'55.00',accountId:'a_cash'})).ledger;
a.equal(paid.journal[0].debit.account,'accounts_payable:supplier-B');
a.equal(paid.journal[0].credit.account,'bank:a_cash');
const reversed=process(paid,evt(21,'bounce')).ledger;
a.equal(reversed.journal[1].debit.account,'bank:a_cash');
a.equal(reversed.journal[1].credit.account,'accounts_payable:supplier-B');
const forex={workspaceId:w,baseCurrency:'AFN',events:[],journal:[],
 cheques:[{id:c,workspaceId:w,direction:'received',counterpartyId:'customer-A',
 amount:'12.34',currency:'USD',status:'pending'}]};
a.throws(()=>process(forex,evt(30,'settle',{amount:'12.34',accountId:'a_cash'})),/EXCHANGE_RATE/);
const fx=process(forex,evt(31,'settle',{amount:'12.34',accountId:'a_cash',exchangeRate:'72.345678'})).ledger;
a.equal(fx.journal[0].debit.amount,'892.84'); // rounded half-up in base currency
a.equal(fx.cheques[0].status,'cleared');
a.equal(fxMinor(1n,'0.500000'),1n,'half-up rounding');
a.throws(()=>process(forex,evt(32,'settle',{amount:'12.35',accountId:'a_cash',exchangeRate:'72'})),/EXCEEDS/);
const other={...issued,cheques:[{...issued.cheques[0],workspaceId:id(77)}]};
a.throws(()=>process(other,evt(33,'settle',{amount:'1',accountId:'a_cash'})),/CHEQUE_NOT_IN_WORKSPACE/);
const cancelled=process(issued,evt(34,'cancel')).ledger;
a.equal(cancelled.journal.length,0);
a.throws(()=>process(cancelled,evt(35,'settle',{amount:'1',accountId:'a_cash'})),/TERMINAL/);
console.log('PASS: cheque partial/full clearing, idempotency, reversal, zero net journal, issued/received, multi-currency rounding, cancellation');

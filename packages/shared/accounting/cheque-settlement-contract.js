/* ZAVI ONE: cheque settlement arithmetic contract.
 * PURE ENGINE: no database writes, remote calls, UI or privilege elevation.
 * Server integration MUST lock a workspace, verify owner/ledger and apply
 * journal+cheque+audit+revision atomically before this may be enabled.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.ZaviChequeLedgerContractV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 function requireId(v,label){
  if(typeof v!=='string'||!uuid.test(v))throw Error('INVALID_'+label);
  return v.toLowerCase();
 }
 function minor(value,label){
  const v=String(value);
  if(!/^\d{1,14}(?:\.\d{1,2})?$/.test(v))throw Error('INVALID_'+label);
  const parts=v.split('.');
  return BigInt(parts[0])*100n+BigInt((parts[1]||'').padEnd(2,'0'));
 }
 function formatted(value){
  const v=BigInt(value),sgn=v<0n?'-':'',abs=v<0n?-v:v;
  return sgn+(abs/100n).toString()+'.'+(abs%100n).toString().padStart(2,'0');
 }
 function fxMinor(amount,rate){
  const s=String(rate);
  if(!/^\d{1,9}(?:\.\d{1,6})?$/.test(s))throw Error('INVALID_EXCHANGE_RATE');
  const p=s.split('.');
  const micro=BigInt(p[0])*1000000n+BigInt((p[1]||'').padEnd(6,'0'));
  if(micro===0n)throw Error('INVALID_EXCHANGE_RATE');
  return (amount*micro+500000n)/1000000n;
 }
 const clone=v=>JSON.parse(JSON.stringify(v));
 function process(original,event){
  if(!original||!Array.isArray(original.cheques)||!Array.isArray(original.events)||
     !Array.isArray(original.journal)||!original.workspaceId||
     !/^[A-Z]{3}$/.test(original.baseCurrency||''))throw Error('INVALID_WORKSPACE_LEDGER');
  const workspaceId=requireId(original.workspaceId,'WORKSPACE');
  const operationId=requireId(event?.operationId,'OPERATION');
  const chequeId=requireId(event?.chequeId,'CHEQUE');
  const kind=event?.kind;
  if(!['deposit','settle','bounce','cancel'].includes(kind))throw Error('INVALID_CHEQUE_OPERATION');
  const serialized=JSON.stringify({
   workspaceId,operationId,chequeId,kind,
   amount:event.amount??null,accountId:event.accountId??null,
   exchangeRate:event.exchangeRate??null
  });
  const old=original.events.find(x=>x.operationId===operationId);
  if(old){
   if(old.request!==serialized)throw Error('IDEMPOTENCY_KEY_REUSED_FOR_DIFFERENT_OPERATION');
   return {ledger:clone(original),replayed:true,journalAdded:0};
  }
  const ledger=clone(original);
  const cheque=ledger.cheques.find(x=>x.id===chequeId);
  if(!cheque||cheque.workspaceId!==workspaceId)throw Error('CHEQUE_NOT_IN_WORKSPACE');
  if(!['received','issued'].includes(cheque.direction))throw Error('INVALID_DIRECTION');
  if(typeof cheque.counterpartyId!=='string'||!cheque.counterpartyId.trim())
   throw Error('COUNTERPARTY_REQUIRED');
  const face=minor(cheque.amount,'FACE_AMOUNT');
  if(face<=0n)throw Error('INVALID_FACE_AMOUNT');
  const settled=minor(cheque.settledAmount??'0.00','SETTLED_AMOUNT');
  if(settled>face)throw Error('CORRUPT_CHEQUE_BALANCE');
  if(cheque.status==='bounced'||cheque.status==='cancelled')throw Error('TERMINAL_CHEQUE_STATUS');
  const newJournal=[];
  function appendPosting(type,accountId,amount,ref,reverse){
   // Every entry has exactly two balanced lines in the workspace base currency.
   const bank='bank:'+accountId;
   const counter=cheque.direction==='received'?'accounts_receivable:'+cheque.counterpartyId:
    'accounts_payable:'+cheque.counterpartyId;
   const debit=(cheque.direction==='received')!==reverse?bank:counter;
   const credit=debit===bank?counter:bank;
   newJournal.push({id:ref,chequeId,operationId,
    type,currency:ledger.baseCurrency,
    debit:{account:debit,amount:formatted(amount)},
    credit:{account:credit,amount:formatted(amount)}});
  }
  switch(kind){
   case 'deposit':
    if(cheque.status!=='pending')throw Error('DEPOSIT_REQUIRES_PENDING');
    cheque.status='deposited';break;
   case 'settle':{
    if(!['pending','deposited','partially_cleared'].includes(cheque.status))
     throw Error('INVALID_SETTLEMENT_STATE');
    if(typeof event.accountId!=='string'||!/^[a-zA-Z0-9_:-]{1,90}$/.test(event.accountId))
     throw Error('INVALID_BANK_ACCOUNT');
    const part=minor(event.amount,'SETTLEMENT_AMOUNT');
    if(part<=0n||part>face-settled)throw Error('SETTLEMENT_EXCEEDS_BALANCE');
    if(!/^[A-Z]{3}$/.test(cheque.currency||''))throw Error('INVALID_CHEQUE_CURRENCY');
    const base=cheque.currency===ledger.baseCurrency?part:fxMinor(part,event.exchangeRate);
    if(base<=0n)throw Error('ROUNDED_TO_ZERO');
    appendPosting('cheque_settlement',event.accountId,base,'cheque:'+chequeId+':'+operationId,false);
    const after=settled+part;
    cheque.settledAmount=formatted(after);
    cheque.status=after===face?'cleared':'partially_cleared';
    break;
   }
   case 'bounce':{
    if(!['pending','deposited','partially_cleared','cleared'].includes(cheque.status))
     throw Error('BOUNCE_INVALID_STATUS');
    const prior=ledger.journal.filter(x=>x.chequeId===chequeId&&x.type==='cheque_settlement');
    const earlierReversed=new Set(ledger.journal.filter(x=>x.chequeId===chequeId&&x.type==='cheque_reversal').map(x=>x.reverses));
    for(const posting of prior){
     if(earlierReversed.has(posting.id))continue;
     const amount=minor(posting.debit.amount,'EXISTING_JOURNAL');
     const account=String(posting.debit.account).startsWith('bank:')?
       String(posting.debit.account).slice(5):String(posting.credit.account).slice(5);
     appendPosting('cheque_reversal',account,amount,'reversal:'+posting.id,true);
     newJournal[newJournal.length-1].reverses=posting.id;
    }
    cheque.status='bounced';cheque.settledAmount='0.00';break;
   }
   case 'cancel':
    if(settled>0n||cheque.status!=='pending')throw Error('CANNOT_CANCEL_SETTLED_OR_DEPOSITED_CHEQUE');
    cheque.status='cancelled';break;
  }
  ledger.journal.push(...newJournal);
  ledger.events.push({operationId,chequeId,workspaceId,kind,request:serialized,
   status:cheque.status,createdAt:event.createdAt||null});
  for(const entry of newJournal){
   if(entry.debit.amount!==entry.credit.amount||entry.currency!==ledger.baseCurrency)
    throw Error('UNBALANCED_JOURNAL');
  }
  return {ledger,replayed:false,journalAdded:newJournal.length};
 }
 return Object.freeze({process,minor,formatted,fxMinor});
});

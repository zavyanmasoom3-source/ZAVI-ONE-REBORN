#!/usr/bin/env node
'use strict';
// Pure parsing and durable queue contracts of the REAL client module.
// No network and no real customer, database, Supabase, or device access.
const assert=require('node:assert/strict');
const client=require('../apps/one/zavi-cheques-v1.js');
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const ws=id(1),uid=id(2),cheque=id(3),op=id(4);
const reg={workspace:ws,direction:'received',cheque_number:'CH-100',
 bank_name:'Test Bank',counterparty_id:'c1',amount:'100.50',
 currency:'AFN',issue_date:'2026-11-10',due_date:'2026-11-12'};
const ok=client.validateRegistration(reg);
assert.equal(ok.status,'pending','registration must NEVER create a cleared cheque');
assert.equal(ok.amount,100.50);
for(const modified of [
 {amount:'0'}, {amount:'100.999'}, {amount:'-0.1'}, {amount:'1e6'},
 {currency:'AF'}, {workspace:'unbound'}, {bank_name:''}, {cheque_number:' '},
 {issue_date:'invalid'},{issue_date:'2026-02-30'}, {due_date:'2026-11-09'}, {direction:'hacked'}
])assert.throws(()=>client.validateRegistration({...reg,...modified}),/INVALID_CHEQUE_REGISTRATION/);
const intent={uid,workspace:ws,cheque,id:op,kind:'settle',
 amount:'30.00',account:'a_cash',rate:null,created_at:new Date().toISOString()};
assert.equal(client.validateOperation(intent),intent);
for(const modified of [
 {id:'not-uuid'}, {workspace:id(5),cheque:'wrong'}, {kind:'hacked'},
 {amount:'0'}, {amount:'1.234'}, {amount:'1e30'}, {account:'a cash'},
 {rate:'0'}, {rate:'1.1234567'}
])assert.throws(()=>client.validateOperation({...intent,...modified}));
assert.equal(client.validateOperation({...intent,kind:'bounce',
 amount:null,account:null,rate:null}).kind,'bounce');
assert.throws(()=>client.validateOperation({...intent,kind:'bounce'}),/INVALID_OPERATION_EXTRAS/);
class Storage{
 constructor(){this.map=new Map()}
 getItem(k){return this.map.get(k)??null}
 setItem(k,v){this.map.set(k,String(v))}
}
const mem=new Storage();
assert.deepEqual(client.safeQueue(mem,uid,ws),[]);
assert.equal(client.queueKey(uid,ws).includes(uid+'_'+ws),true);
client.saveQueue(mem,uid,ws,[intent]);
assert.equal(client.safeQueue(mem,uid,ws)[0].id,op);
assert.deepEqual(client.safeQueue(mem,id(5),ws),[],'no cross-owner queue');
assert.deepEqual(client.safeQueue(mem,uid,id(5)),[],'no cross-workspace queue');
mem.setItem(client.queueKey(uid,ws),'broken');
assert.deepEqual(client.safeQueue(mem,uid,ws),[],'malformed queue fails closed');
assert.throws(()=>client.saveQueue(mem,uid,ws,Array.from({length:101},()=>intent)),
 /QUEUE_CAPACITY_EXCEEDED/);
console.log('PASS: pending-only registration, strict cents and currency, immutable intent validation');
console.log('PASS: owner/workspace scoped durable queue, corruption and saturation fail-closed');

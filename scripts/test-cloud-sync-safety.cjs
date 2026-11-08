#!/usr/bin/env node
/* Deterministic regression for ambiguous cloud acknowledgements and restart recovery.
 * No real Supabase credentials and no customer data. Tests the shipping cloud.js source.
 */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../apps/one/cloud.js'),'utf8');

function extract(start,end){
 const pos=source.indexOf(start);
 assert.ok(pos>=0,'Missing cloud code anchor: '+start);
 const stop=source.indexOf(end,pos+start.length);
 assert.ok(stop>pos,'Missing closing anchor: '+end);
 return source.slice(pos,stop);
}
const sameCode=extract('function zaviCloudSamePayload(', '\nfunction afterSave()');
const compare=vm.runInNewContext(sameCode+';zaviCloudSamePayload');
const original={
 version:1,updatedAt:1720000000,products:[{id:'A',openingQty:8}],
 contacts:[{id:'C',openingReceivable:200}],
 tx:[{id:'S',type:'sale',paid:9}],accounts:[{id:'cash',opening:100}],
 audit:[{action:'sale'}],settings:{theme:'dark',warehouse:{enabled:true}}
};
const deepCopy=()=>JSON.parse(JSON.stringify(original));
const reordered={
 settings:{warehouse:{enabled:true},theme:'dark'},audit:[{action:'sale'}],
 accounts:[{opening:100,id:'cash'}],tx:[{paid:9,type:'sale',id:'S'}],
 contacts:[{openingReceivable:200,id:'C'}],products:[{openingQty:8,id:'A'}],
 updatedAt:1720000000,version:1
};
assert.equal(compare(original,reordered),true,'JSONB object key reordering');
for(const [field,mutate] of [
 ['products',s=>s.products[0].openingQty++],
 ['contacts',s=>s.contacts.push({id:'FOREIGN'})],
 ['tx',s=>s.tx[0].paid++],
 ['accounts',s=>s.accounts[0].opening++],
 ['audit',s=>s.audit[0].action='void'],
 ['warehouse settings',s=>s.settings.warehouse.enabled=false],
 ['theme',s=>s.settings.theme='light'],
 ['timestamp',s=>s.updatedAt++],
 ['extra records',s=>s.manualInvoices=[{id:'new'}]]
]){
 const modified=deepCopy();mutate(modified);
 assert.equal(compare(original,modified),false,'Must reject partial ack: '+field);
}
assert.equal(compare(original,null),false);
assert.equal(compare({values:[1,2]},{values:[2,1]}),false,'Array order matters');
const large={tx:Array.from({length:25000},(_,i)=>({id:'t'+i,paid:i%100}))};
assert.equal(compare(large,JSON.parse(JSON.stringify(large))),true,'Large ledger comparison');
const recovery=extract('   const cachedRev=Number(meta?.revision);','   waiting={workspace_id');
const safeRevision=new Function('meta','id','identity','serverRevision',
  recovery+'\nreturn safeRevision;');
const me='owner-one',ws='workspace-one';
assert.equal(safeRevision(null,ws,me,16),-1,'Missing metadata must cause conflict');
assert.equal(safeRevision({id:ws,owner_uid:me,user_uid:me},ws,me,16),-1);
assert.equal(safeRevision({id:ws,owner_uid:'different',user_uid:me,revision:16},ws,me,16),-1);
assert.equal(safeRevision({id:ws,owner_uid:me,user_uid:me,revision:14},ws,me,16),14);
assert.equal(safeRevision({id:ws,owner_uid:me,user_uid:me,revision:0},ws,me,16),0);
assert.equal(safeRevision({id:ws,owner_uid:me,user_uid:me,revision:-1},ws,me,16),-1);
assert.match(source,/zaviCloudSamePayload\(current\.payload,snapshot\)/,
  'All-field acknowledgement must be used by the network retry code');
assert.match(source,/validWaiting&&pendingRevision>=0&&serverRevision>pendingRevision/,
  'No resetting unknown-base offline ledger');
console.log('PASS: full cloud payload matching, JSONB reordered fields, protected crash recovery, unknown-revision conflict');

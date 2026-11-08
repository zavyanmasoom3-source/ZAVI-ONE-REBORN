'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('apps/one/zavi-message-center-v6720.js','utf8');
const storage=new Map();
const win={open:()=>{throw Error('WhatsApp must not be opened automatically')}};
const context={window:win,KEY:'workspace-A',localStorage:{
 getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
 document:{getElementById:()=>null,addEventListener:()=>{}},
 MutationObserver:class{observe(){}},setTimeout:()=>{},console};
vm.runInNewContext(script,context);
const api=win.ZaviMessageCenterV6720;
assert(api,'WhatsApp centre API must initialize');
assert.equal(api.phone('0700 000 000'),'93700000000');
assert.equal(api.phone('+93 700 000 000'),'93700000000');
assert.equal(api.phone('۰۷۰۰۰۰۰۰۰۰'),'93700000000');
assert.equal(api.phone('invalid'),'');
assert(api.message('invoice','Ali','AFN 100').includes('AFN 100'));
assert(api.message('reminder','Ali','AFN 100').includes('Ali'));
assert(api.link('93700000000','hello').startsWith('https://wa.me/93700000000?text='));
storage.set('zavi_message_queue_v6720:workspace-A',JSON.stringify([{text:'A'}]));
assert.equal(api.read().length,1);
context.KEY='workspace-B';
assert.equal(api.read().length,0,'message queues must not cross workspaces');
console.log('PASS: scoped manual message queue and phone validation');

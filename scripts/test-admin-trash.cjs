#!/usr/bin/env node
'use strict';
// Exercise the actual ADMIN handlers with disposable server-RPC doubles.
// Real production customers, tokens and billing entries are never used.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../apps/admin/app.js'),'utf8');
const start=source.indexOf('async function archiveCustomer(id){');
const end=source.indexOf('function confirmStatus(){',start);
assert.ok(start>=0&&end>start,'Soft-delete/restore source missing');
const handlers=source.slice(start,end);
assert.match(handlers,/zavi_admin_trash_customer/);
assert.match(handlers,/zavi_admin_restore_trash_customer/);
const id='11111111-2222-4444-8888-111111111111';
const customer={workspace_id:id,workspace_name:'QA Sample Shop',owner_email:'qa@example.invalid'};
const context={
 rows:[customer],archivedRows:[],lastActionBusy:false,mode:'live',
 navigator:{onLine:true},allowAdmin:true,promptName:customer.workspace_name,
 confirmAllowed:true,events:[],rpcCalls:[],serverArchived:false,
 isMainAdmin(){return context.allowAdmin},
 toast(t,bad){context.events.push({msg:t,error:!!bad})},
 confirm(){context.events.push('confirm');return context.confirmAllowed},
 prompt(){context.events.push('typed');return context.promptName},
 async api(url,request){
  context.rpcCalls.push({url,request});
  if(url.endsWith('/zavi_admin_trash_customer')){
   assert.equal(request.body.p_workspace_id,id);
   assert.equal(request.method,'POST');context.serverArchived=true;return true;
  }
  if(url.endsWith('/zavi_admin_restore_trash_customer')){
   assert.equal(request.body.p_workspace_id,id);
   context.serverArchived=false;return true;
  }
  throw Error('Unexpected RPC '+url);
 },
 async fetchRows(){
  context.archivedRows=context.serverArchived?[customer]:[];
  context.rows=context.serverArchived?[]:[customer];
 },
 render(){context.events.push('render')}
};
context.globalThis=context;
const script=vm.createScript(handlers+'\nglobalThis.trashQa=archiveCustomer;globalThis.restoreQa=restoreCustomer;', {filename:'admin-trash-source.js'});
vm.createContext(context);script.runInContext(context);
(async()=>{
 context.allowAdmin=false;
 await context.trashQa(id);
 assert.equal(context.rpcCalls.length,0,'Non-owner must never issue delete RPC');
 context.allowAdmin=true;context.confirmAllowed=false;
 await context.trashQa(id);
 assert.equal(context.rpcCalls.length,0,'First confirmation must be mandatory');
 context.confirmAllowed=true;context.promptName='WRONG NAME';
 await context.trashQa(id);
 assert.equal(context.rpcCalls.length,0,'Second confirmation must match shop name');
 context.promptName=customer.workspace_name;
 context.navigator.onLine=false;
 await context.trashQa(id);
 assert.equal(context.rpcCalls.length,0,'Offline deletion must be forbidden');
 context.navigator.onLine=true;
 await context.trashQa(id);
 assert.equal(context.rpcCalls.length,1,'One server trash RPC expected');
 assert.equal(context.serverArchived,true);
 assert.equal(context.rows.length,0);
 assert.equal(context.archivedRows.length,1);
 assert.equal(context.lastActionBusy,false);
 await context.restoreQa(id);
 assert.equal(context.rpcCalls.length,2,'One server restore RPC expected');
 assert.equal(context.serverArchived,false);
 assert.equal(context.rows.length,1);
 assert.equal(context.archivedRows.length,0);
 context.allowAdmin=false;
 await context.restoreQa(id);
 assert.equal(context.rpcCalls.length,2,'Non-owner cannot restore');
 console.log('PASS: ADMIN two-confirmation soft delete, owner-only+online guard, server result check, and restoration');
})().catch(e=>{console.error(e);process.exitCode=1});

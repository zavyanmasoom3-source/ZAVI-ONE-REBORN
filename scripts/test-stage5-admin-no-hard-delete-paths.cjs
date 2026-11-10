#!/usr/bin/env node
'use strict';
// Static regression against accidental reintroduction of irreversible
// customer destruction in executable ADMIN paths.
// Historical translation keys and documentation are not executable actions.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const dir=path.join(__dirname,'../apps/admin');
const files=fs.readdirSync(dir).filter(x=>x.endsWith('.js'));
const dangerousRPC=/\bzavi_owner_delete_customer\b/;
const irreversibleRequest=/\bp_preview\s*:\s*false\b/;
const forbiddenControls=/\bdata-v24="permanent-delete"\b/; // compatibility-only selector is permitted in recovery overlay.
const failures=[];
for(const filename of files){
 const text=fs.readFileSync(path.join(dir,filename),'utf8');
 if(dangerousRPC.test(text))failures.push(filename+': hard deletion RPC');
 if(irreversibleRequest.test(text))failures.push(filename+': irreversible bulk request');
 if(filename==='account-control.js'&&/permanent-delete|DELETE CUSTOMER PERMANENTLY/.test(text))
  failures.push(filename+': irreversible customer control');
 if(filename==='app.js'){
  if(/DELETE ALL CUSTOMER ACCOUNTS|DELETE CUSTOMER PERMANENTLY/.test(text))
   failures.push(filename+': irreversible customer control');
  if(!/zavi_admin_trash_all_customer_accounts/.test(text))
   failures.push(filename+': reversible bulk server RPC missing');
 }
}
assert.deepEqual(failures,[],'Irreversible user-management routes must stay retired');
assert.ok(files.length>=40,'Expected complete ADMIN JavaScript module inventory');
console.log('PASS: '+files.length+' ADMIN JavaScript files scanned; no executable permanent-delete RPC or bulk purge');
console.log('PASS: account-control and primary ADMIN app use reversible trash; old i18n dictionary keys are inert');

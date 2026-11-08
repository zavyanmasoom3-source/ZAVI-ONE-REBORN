#!/usr/bin/env python3
"""Non-destructive backup compatibility and integrity smoke.

Uses the real client-side backup code in a disposable local browser, without
authenticating to Supabase or importing over a real customer's workspace.
"""
from chrome_cdp import Session
import json

with Session() as browser:
 error=browser.unlock_one()
 if error:
  raise SystemExit('PIN setup failed: '+error)
 result=browser.eval("""(async()=>{
  if(typeof blankDB!=='function'||typeof validateBackupData!=='function'||
     typeof zaviBackupVerifyScopeV646!=='function'||
     !window.ZaviBackupIntegrity647)throw Error('Backup implementation missing');
  const original=blankDB();
  original.storeName='DISPOSABLE BACKUP TEST';
  original.products=[{id:'qa-p',name:'Sample',sku:'QA-001',
      openingQty:7,openingCost:12,salePrice:15}];
  original.contacts=[{id:'qa-c',name:'Sample customer',type:'customer',
      openingReceivable:25,openingPayable:0}];
  original.tx=[{id:'qa-t',type:'sale',date:'2026-11-08',
      code:'QA-1',contactId:'qa-c',accountId:'a_cash',paid:10,
      items:[{productId:'qa-p',qty:1,price:15,cost:12}]}];
  const api=window.ZaviBackupIntegrity647;
  const sealed=await api.seal(original);
  const verified=await api.verify(sealed);
  const rehydrated=validateBackupData(JSON.parse(JSON.stringify(sealed)));
  let tamperRejected=false,scopeRejected=false;
  try {await api.verify({...sealed,storeName:'TAMPERED'})}
  catch(_){tamperRejected=true}
  try {
    zaviBackupVerifyScopeV646({
      zavi_backup_scope:{format:'zavi-backup-scope-v1',
        workspace_id:'another-tenant',owner_uid:'another-owner'}
    });
  } catch(_){scopeRejected=true}
  const legacy=await api.verify(original);
  return {
    verified:verified.status,legacy:legacy.status,
    version:rehydrated.version,products:rehydrated.products.length,
    contacts:rehydrated.contacts.length,transactions:rehydrated.tx.length,
    snapshotUnchanged:original.storeName==='DISPOSABLE BACKUP TEST',
    tamperRejected,scopeRejected
  };
 })()""")
 wanted={
   'verified':'verified','legacy':'legacy','version':1,
   'products':1,'contacts':1,'transactions':1,
   'snapshotUnchanged':True,'tamperRejected':True,'scopeRejected':True
 }
 print(json.dumps(result,ensure_ascii=False,indent=2))
 for k,v in wanted.items():
  if result.get(k)!=v:
   raise SystemExit('FAIL backup '+k+': expected '+str(v)+
                    ' got '+str(result.get(k)))
 print('PASS: new/legacy backup formats, SHA tamper rejection, tenant mismatch')

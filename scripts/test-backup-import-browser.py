#!/usr/bin/env python3
"""End-to-end file-import regression in a disposable local Chrome profile.

This exercises the app's REAL importBackup(FileReader) and save() path, unlike
tests that only validate a JSON object in memory. This is still NOT a physical
Android installation or a real-cloud account/device migration.
"""
from chrome_cdp import Session
import json
import time

with Session() as browser:
    error=browser.unlock_one()
    if error:
        raise SystemExit('PIN setup failed: '+error)

    prepared=browser.eval("""(async()=>{
      if (typeof importBackup!=='function' || typeof blankDB!=='function' ||
          !window.ZaviBackupIntegrity647) throw Error('Backup implementation missing');
      // Sandbox only: never authenticate, create a tenant, or call the cloud.
      window.zaviCloudCanEdit=()=>true;
      window.zaviCloudAfterSave=()=>{};
      window.zaviOfflineBackupSave=()=>{};
      window.confirm=()=>true;
      const sample=blankDB();
      sample.storeName='REBORN DISPOSABLE RESTORE QA';
      sample.storeConfigured=true;
      sample.accounts.find(x=>x.id==='a_cash').opening=100;
      sample.products=[{
        id:'qa-product',name:'QA item',sku:'ZAVI-QA',openingQty:10,
        openingCost:5,purchasePrice:5,salePrice:15,reorder:1
      }];
      sample.contacts=[{
        id:'qa-person',name:'QA customer',type:'customer',
        openingReceivable:0,openingPayable:0
      }];
      sample.tx=[{
        id:'qa-sale',code:'QA-001',type:'sale',date:'2026-11-08',
        created:'2026-11-08T00:00:00.000Z',contactId:'qa-person',
        accountId:'a_cash',paid:4,discount:0,
        items:[{productId:'qa-product',qty:1,price:15,cost:5}]
      }];
      window.__zaviQaRestoreFile=await window.ZaviBackupIntegrity647.seal(sample);
      return {size:JSON.stringify(window.__zaviQaRestoreFile).length,
              hasRealUser:!!window.zaviCloudGetAuthSession?.()?.user?.id,
              tenantBound:!!window.zaviTenantIsBound?.()};
    })()""")
    if prepared.get('hasRealUser') or prepared.get('tenantBound'):
        raise SystemExit('Test must remain unauthenticated and tenant-free')
    if prepared.get('size',0)<=100:
        raise SystemExit('Synthetic backup payload unexpectedly empty')
    browser.eval("""(()=>{
      const json=JSON.stringify(window.__zaviQaRestoreFile);
      importBackup(new File([json],'qa-restore.json',{type:'application/json'}));
      return true;
    })()""")
    browser.until("""(()=>{
      return db.storeName==='REBORN DISPOSABLE RESTORE QA' &&
        db.tx.length===1 && db.products.length===1;
    })()""",'verified FileReader backup import into fresh profile',seconds=20)
    restored=browser.eval("""(()=>{
      const state=JSON.parse(localStorage.getItem(KEY)||'null');
      return {
        name:db.storeName,
        persisted:state?.storeName===db.storeName && state?.tx?.length===1,
        stock:stockState()['qa-product']?.qty,
        cash:cashBalances()['a_cash'],
        debt:contactBalances()['qa-person']?.receivable,
        tx:db.tx.length,
        tenantBound:!!window.zaviTenantIsBound?.()
      };
    })()""")
    if restored!={'name':'REBORN DISPOSABLE RESTORE QA','persisted':True,
                  'stock':9,'cash':104,'debt':11,'tx':1,'tenantBound':False}:
        raise SystemExit('FAIL backup import calculation or durable storage: '+
                         json.dumps(restored,ensure_ascii=False))

    browser.eval("""(async()=>{
      const changed={...window.__zaviQaRestoreFile,
                     storeName:'MALICIOUS FILE WITH ALTERED DATA'};
      importBackup(new File([JSON.stringify(changed)],'tampered.json',
                            {type:'application/json'}));
      const foreign={...window.__zaviQaRestoreFile,
        zavi_backup_scope:{format:'zavi-backup-scope-v1',
          workspace_id:'other-tenant',owner_uid:'other-owner'}};
      const sealed=await window.ZaviBackupIntegrity647.seal(foreign);
      importBackup(new File([JSON.stringify(sealed)],'foreign.json',
                            {type:'application/json'}));
      return true;
    })()""")
    time.sleep(.8)
    rejected=browser.eval("""(()=>{
      const persisted=JSON.parse(localStorage.getItem(KEY)||'null');
      return {
        current:db.storeName,
        persisted:persisted?.storeName,
        count:db.tx.length
      };
    })()""")
    if rejected!={'current':'REBORN DISPOSABLE RESTORE QA',
                  'persisted':'REBORN DISPOSABLE RESTORE QA','count':1}:
        raise SystemExit('FAIL rejected import overwrote records: '+
                         json.dumps(rejected,ensure_ascii=False))
    print(json.dumps({'prepared':prepared,'restored':restored,
                      'rejected':rejected},ensure_ascii=False,indent=2))
    print('PASS: actual fresh-profile file import, durable storage, '
          'financial math and protection against tamper/cross-tenant backup')

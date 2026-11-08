/* ZAVI ONE V44 — local-only offline accounting health diagnostics.
 * Does not expose IDs, names, tokens, customer records or credentials. */
(()=>{'use strict';
async function run(){
 const shell=window.zaviOfflineShell?.status?.()||{},permit=window.zaviOfflineStatus?.()||{};
 const info=window.zaviCloudRestoreInfo?.()||{},session=window.zaviCloudGetAuthSession?.();
 const uid=session?.user?.id||'',ws=info.workspace||'',owner=info.role==='owner';
 const key=uid&&ws?'zavi_v34_tenant_'+uid+'_'+ws:'';
 let tenantFound=false, snapshotValid=false, txCount=0, snapshotBytes=0, snapshotUpdated=false;
 let pendingMarker=false, storageWritable=false, idbUsable=false, storageError='';
 try{
  if(key){const raw=localStorage.getItem(key);tenantFound=!!raw;
   if(raw){snapshotBytes=raw.length;
    const state=JSON.parse(raw);snapshotValid=!!(state&&Array.isArray(state.tx)&&Array.isArray(state.contacts)&&Array.isArray(state.products));
    if(snapshotValid){txCount=state.tx.length;snapshotUpdated=!!Number(state.updatedAt||0);}
   }
   const marker=JSON.parse(localStorage.getItem('zavi_v34_pending_'+uid+'_'+ws)||'null');
   pendingMarker=!!(marker&&marker.workspace_id===ws&&marker.owner_uid===uid);
  }
  const probe='zavi_v44_health_probe';localStorage.setItem(probe,'test');storageWritable=localStorage.getItem(probe)==='test';localStorage.removeItem(probe);
 }catch(e){storageError=(e?.name||'StorageError');}
 try{
  if(window.indexedDB){idbUsable=await new Promise(resolve=>{
   const request=indexedDB.open('ZaviStoreAccounting',1);const timeout=setTimeout(()=>resolve(false),4000);
   request.onsuccess=()=>{clearTimeout(timeout);request.result.close();resolve(true)};
   request.onerror=()=>{clearTimeout(timeout);resolve(false)};
   request.onblocked=()=>{clearTimeout(timeout);resolve(false)};
  });}
 }catch(_){idbUsable=false}
 let persistent=false,quotaEstimate=null;
 try{persistent=!!await navigator.storage?.persisted?.();const x=await navigator.storage?.estimate?.();if(x&&Number.isFinite(x.quota)&&x.quota>0)quotaEstimate=Math.round((x.usage||0)*100/x.quota)}catch(_){ }
 const report={version:'V47',checked_at:new Date().toISOString(),online:navigator.onLine!==false,
   shell_ready:shell.ready===true&&shell.controlled===true,controlled:shell.controlled===true,
   lease_valid:permit.valid_now===true,minutes_left:Number(permit.minutes_left||0),
   authenticated:!!uid,workspace_selected:!!ws,owner,tenant_found:tenantFound,snapshot_valid:snapshotValid,
   local_transactions:txCount,local_snapshot_characters:snapshotBytes,snapshot_has_update_time:snapshotUpdated,
   pending_changes:!!info.pending||pendingMarker,sync_conflict:!!info.conflict,
   localstorage_ok:storageWritable,indexeddb_ok:idbUsable,persistent_storage:persistent,
   storage_usage_percentage:quotaEstimate,storage_error:storageError};
 report.ready_for_offline_accounting=!!(report.shell_ready&&report.lease_valid&&owner&&snapshotValid&&storageWritable&&!report.sync_conflict);
 return report;
}
function description(s){
 return s.ready_for_offline_accounting?'✅ آفلاین آماده است.':
 '⚠️ آفلاین آماده نیست.'+
 (!s.shell_ready?'\nفایل‌ها: ناقص':'')+
 (!s.lease_valid?'\nمجوز دستگاه: نامعتبر':'')+
 (!s.snapshot_valid?'\nاطلاعات محلی: ناقص':'')+
 (!s.localstorage_ok?'\nحافظه: خطا':'')+
 (s.sync_conflict?'\nهمگام‌سازی: تعارض':'');
}

window.zaviOfflineHealth={run,description};
document.addEventListener('click',async e=>{
 const button=e.target.closest('[data-zavi-health-check]');if(!button)return;
 e.preventDefault();button.disabled=true;
 const panel=document.querySelector('[data-zavi-health]');if(panel)panel.textContent='در حال بررسی حافظه و مجوز…';
 try{const status=await run();if(panel)panel.textContent=description(status)}
 catch(_){if(panel)panel.textContent='بررسی کامل نشد؛ حافظه مرورگر و دسترسی آفلاین را بررسی کنید.'}
 finally{button.disabled=false}
});
})();

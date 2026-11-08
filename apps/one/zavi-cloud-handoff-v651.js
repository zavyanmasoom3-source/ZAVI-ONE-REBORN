/* ZAVI ONE V65.1 — automatic, tenant-safe cloud workspace handoff.
 * Selecting a store downloads server-authorized records; it NEVER performs
 * privileged primary-device transfer or overwrites unsynced owner edits.
 */
(()=>{'use strict';
 const validUuid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s||''));
 function plan(rows,uid,preferred=''){
  if(!validUuid(uid)||!Array.isArray(rows))return {id:null,reason:'invalid-session'};
  const own=rows.filter(row=>row&&validUuid(row.id)&&row.owner_uid===uid);
  if(validUuid(preferred)&&own.some(row=>row.id===preferred))return {id:preferred,reason:'owner-preferred'};
  if(own.length===1)return {id:own[0].id,reason:'unique-owner'};
  return {id:null,reason:own.length>1?'multiple-owner-workspaces':'no-unique-owner'};
 }
 function shouldPromptTransfer(status,ctx){
  return !!(ctx&&ctx.role==='owner'&&validUuid(ctx.workspace)
   && status?.status==='error'
   && /ANOTHER_DEVICE_ACTIVE|دستگاه یا آدرس [^.!?]{0,80} دیگری فعال است|another.device.active|دستگاه اصلی دیگری/.test(String(status.message||'')));
 }
 window.ZaviCloudHandoff651=Object.freeze({plan,shouldPromptTransfer});
})();

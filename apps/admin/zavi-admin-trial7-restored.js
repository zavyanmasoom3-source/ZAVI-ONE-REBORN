/* Restore owner-only 7-day trial in the existing subscription modal.
   Uses the original server-guarded RPC; never records a fake payment. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 let busy=false;
 function install(){
  const modal=$('modalBg'),body=$('modalBody');
  if(!modal||modal.hidden||!body||$('zaviTrial7Restore'))return;
  const old=$('renewConfirm');
  if(!old)return;
  const box=document.createElement('section');box.id='zaviTrial7Restore';
  box.style.cssText='margin:14px 0;padding:14px;border:1px solid var(--border,#8b95a5);border-radius:12px';
  const heading=document.createElement('strong');heading.textContent='تمدید آزمایشی رایگان — ۷ روز';
  const info=document.createElement('p');info.textContent='برای امتحان سیستم؛ بدون ثبت پرداخت. تمدید فقط با تأیید سرور انجام می‌شود.';
  const btn=document.createElement('button');btn.type='button';btn.className='button ghost';btn.textContent='فعال‌سازی ۷ روز آزمایشی';
  const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  box.append(heading,info,btn,status);old.closest('.modal-actions')?.before(box);
  btn.addEventListener('click',async()=>{
   if(busy)return;
   const api=window.ZaviAdminAPI;
   const selected=modal.querySelector('.receipt-preview');
   const email=selected?.textContent||'';
   const id=modal.dataset.zaviTrialWorkspace||'';
   const rows=api?.getRows?.()||[];
   const current=rows.find(r=>r.workspace_id===id);
   if(!api||api.getMode?.()!=='live'){status.textContent='این گزینه فقط در حساب واقعی مالک مرکزی فعال است.';return}
   if(!current){status.textContent='مشتری معتبر انتخاب نشده است. از فهرست مشتریان دوباره باز کنید.';return}
   if(current.plan==='lifetime'){status.textContent='اشتراک دائمی به تمدید آزمایشی نیاز ندارد.';return}
   if(!confirm('۷ روز رایگان به اشتراک همین مشتری اضافه شود؟'))return;
   busy=true;btn.disabled=true;status.textContent='در حال تأیید روی سرور…';
   try{
    const result=await api.request('/rest/v1/rpc/zavi_admin_grant_trial_7days',{method:'POST',body:{p_workspace_id:id,p_reason:'7 day free trial'}});
    const record=Array.isArray(result)?result[0]:result;
    if(!record?.expires_at)throw Error('سرور تاریخ پایان را تأیید نکرد؛ قبل از تکرار، وضعیت مشتری را بررسی کنید.');
    status.textContent='تمدید ۷ روزه ثبت شد. پایان: '+new Date(record.expires_at).toLocaleDateString('fa-AF');
    window.dispatchEvent(new CustomEvent('zavi-admin-trial-granted',{detail:{workspace_id:id}}));
   }catch(err){status.textContent='ثبت تمدید تأیید نشد: '+String(err?.message||err)}
   finally{busy=false;btn.disabled=false}
  });
 }
 document.addEventListener('click',event=>{
  const b=event.target.closest?.('[data-renew]');
  if(b){const modal=$('modalBg');if(modal)modal.dataset.zaviTrialWorkspace=b.dataset.renew||'';queueMicrotask(install)}
 });
 const obs=new MutationObserver(()=>{if(!$('modalBg')?.hidden)install()});
 const start=()=>obs.observe(document.body,{subtree:true,childList:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
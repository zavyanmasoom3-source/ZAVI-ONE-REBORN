/* ZAVI ONE ADMIN v1.4.1 — Recoverable account deletion, separate recycle bin.
   Original UI and financial features remain unchanged.
   This module replaces clicks on the dangerous permanent-delete controls with
   server-authorized archive actions. Actual hard-deleted data isn't fabricated. */
(()=>{'use strict';
const SELECTOR='[data-v24="permanent-delete"],#z53DeleteCustomers';
const api=()=>window.ZaviAdminAPI;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const texts={
 fa:{tab:'🗑 سطل بازیابی',title:'سطل بازیابی مشتریان',intro:'مشتریانی که از این پس به سطل انتقال می‌یابند، همراه با معلومات‌شان باقی می‌مانند و دوباره قابل بازگردانی‌اند.',history:'سابقه حذف‌های قبلی',recoverable:'قابل بازیابی',irreversible:'قبلاً برای همیشه حذف شده؛ بازیابی از این سابقه ممکن نیست',deleted:'تاریخ انتقال / حذف',name:'فروشگاه',email:'ایمیل',restore:'↩ بازیابی مشتری',close:'✕ بستن',refresh:'↻ تازه‌سازی',search:'جستجوی نام فروشگاه یا ایمیل',empty:'در حال حاضر حسابی در این دسته موجود نیست.',loading:'در حال دریافت از سرور امن…',error:'دریافت اطلاعات انجام نشد: ',confirm:'آیا این فروشگاه با تمام معلومات موجود دوباره در فهرست مشتریان فعال شود؟ ممکن است اشتراک آن نیاز به تمدید داشته باشد.',done:'حساب از سطل بازیابی برگشت و اطلاعات قبلی محفوظ ماند.',trash:'انتقال به سطل بازیابی',trashConfirm:'این مشتری به سطل بازیابی منتقل می‌شود. فاکتورها و معلوماتش پاک نمی‌شوند و بعداً قابل بازگردانی است. تأیید می‌کنید؟',trashDone:'مشتری به سطل بازیابی منتقل شد. در «کنترول حساب‌ها ← سطل بازیابی» می‌توانید برگردانید.',bulkTitle:'حذف گروهیِ قابل بازیابی',bulkAsk:'تمام حساب‌های مشتریان (به‌جز حساب مالک اصلی) به سطل بازیابی منتقل شوند؟ این کار قابل برگشت است و اطلاعات را پاک نمی‌کند.',bulkCheck:'برای تأیید دقیقاً بنویسید: TRASH ALL CUSTOMER ACCOUNTS',bulkDone:' حساب به سطل بازیابی منتقل شد.',cannot:'این یک سابقه از حذف واقعی گذشته است، نه نسخه پشتیبان. بازیابی آن با این ابزار ممکن نیست.',active:'حساب‌های قابل بازیابی',historical:'حذف‌های قدیمی',note:'حذف قطعیِ قبلی را نمی‌توان فقط از روی نام و تاریخ بازسازی کرد. برای بازگردانی آن باید نسخه پشتیبان معتبر موجود باشد.'},
 en:{tab:'🗑 Recycle bin',title:'Customer recycle bin',intro:'From now on, moving a customer to the recycle bin preserves the account and records for restoration.',history:'Past permanent deletions',recoverable:'Recoverable',irreversible:'Previously permanently deleted; cannot restore from this log',deleted:'Moved / deleted at',name:'Store',email:'Email',restore:'↩ Restore customer',close:'✕ Close',refresh:'↻ Refresh',search:'Search store or email',empty:'No accounts in this category.',loading:'Loading protected records…',error:'Unable to load: ',confirm:'Restore this customer and its existing data? Subscription renewal may still be required.',done:'Customer restored with existing information intact.',trash:'Move to recycle bin',trashConfirm:'Move this customer to the recoverable recycle bin? Invoices and data will be preserved and can be restored.',trashDone:'Moved to recycle bin. Restore under Account control → Recycle bin.',bulkTitle:'Recoverable bulk deletion',bulkAsk:'Move all customer accounts except the main owner into the recoverable bin? Information will be preserved.',bulkCheck:'Enter exactly: TRASH ALL CUSTOMER ACCOUNTS',bulkDone:' customers moved to recycle bin.',cannot:'This is a historical record of a hard deletion, not a backup; restoration is unavailable.',active:'Recoverable accounts',historical:'Older deletions',note:'Previously hard-deleted records cannot be reconstructed from names and dates; a valid backup is needed.'},
 ps:{tab:'🗑 د بېرته راوړلو سطل',title:'د مشتریانو د بېرته راوړلو سطل',intro:'له دې وروسته حذف شوي مشتریان او د هغوی مالومات خوندي پاتې کېږي او بېرته راوړل کېدای شي.',history:'پخوانۍ بشپړې ړنګونې',recoverable:'بېرته راګرځېدونکی',irreversible:'مخکې د تل لپاره ړنګ شوی؛ له دې ثبت څخه نه راګرځي',deleted:'د ړنګولو نېټه',name:'دوکان',email:'بریښنالیک',restore:'↩ مشتری بېرته راوړل',close:'✕ بندول',refresh:'↻ تازه کول',search:'دوکان یا ایمیل ولټوئ',empty:'دلته کوم حساب نشته.',loading:'له خوندي سرور څخه معلومات راوړل کېږي…',error:'معلومات ترلاسه نه شول: ',confirm:'دا حساب له پخوانیو معلوماتو سره بېرته فعال شي؟ د ګډون تمدید ته ښايي اړتیا وي.',done:'حساب له معلوماتو سره بېرته راوستل شو.',trash:'سطل ته لېږل',trashConfirm:'حساب سطل ته ولېږو؟ مالومات او بیلونه به وساتل شي.',trashDone:'حساب سطل ته ولېږل شو. بېرته راګرځولای شئ.',bulkTitle:'د ټولو حسابونو ساتل شوی حذف',bulkAsk:'ټول مشتریان سطل ته ولیږل شي؟ مالومات نه پاکېږي.',bulkCheck:'دا جمله ولیکئ: TRASH ALL CUSTOMER ACCOUNTS',bulkDone:' حسابونه سطل ته ولېږل شول.',cannot:'دا یوازې د پخواني حذف تاریخچه ده، نه بیک اپ.',active:'د راوړلو وړ حسابونه',historical:'پخواني حذفونه',note:'د تل لپاره پاک شوي حسابونه یوازې له بیک اپ څخه راګرځي.'}
};
function t(){const v=String(document.querySelector('#zaviAdminLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return texts[v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa']}
let records=[],filter='',busy=false,open=false,pending=false,showHistorical=false,renderCache='';
const styles=`
#zaviRecovery141{position:fixed;inset:0;z-index:2147482500;display:flex;justify-content:center;align-items:center;box-sizing:border-box;background:rgba(2,14,33,.9);padding:env(safe-area-inset-top,0px) 10px env(safe-area-inset-bottom,0px);direction:rtl;color:#eaf5ff}
#zaviRecovery141[hidden]{display:none!important}
#zaviRecovery141 .zr141Page{box-sizing:border-box;background:linear-gradient(135deg,#113b75,#06162d);width:min(1020px,100%);max-height:96dvh;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;border:1px solid #346ca2;border-radius:18px;padding:16px;color:#eef8ff}
#zaviRecovery141 *{box-sizing:border-box}
#zaviRecovery141 .zr141Head,#zaviRecovery141 .zr141Actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
#zaviRecovery141 h2{font-size:clamp(18px,4vw,24px);line-height:1.6;margin:0;font-weight:850;color:#fff}
#zaviRecovery141 p{font-size:13px;line-height:1.9;color:#cbdff4;margin:8px 0 12px}
#zaviRecovery141 button{min-height:43px;border:1px solid #5a93c1;background:#185487;color:white;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:750;cursor:pointer}
#zaviRecovery141 button.zr141Restore{background:#087a65;border-color:#11ad8c}
#zaviRecovery141 button:disabled{opacity:.6;cursor:wait}
#zaviRecovery141 input{display:block;width:100%;padding:11px 12px;min-height:44px;background:#0a2a51;color:#f4faff;border:1px solid #4380b6;border-radius:10px;font-size:14px;margin:8px 0 14px}
#zaviRecovery141 input::placeholder{color:#bacadd}
#zaviRecovery141 .zr141Columns{display:grid;grid-template-columns:1fr 1fr;gap:14px}
#zaviRecovery141 .zr141Box{background:rgba(3,18,40,.55);border:1px solid #376791;border-radius:14px;padding:14px;min-width:0}
#zaviRecovery141 .zr141Box h3{font-size:16px;color:#f8fdff;margin:0 0 10px}
#zaviRecovery141 .zr141Item{border:1px solid #3d729f;background:#0d315b;border-radius:11px;padding:12px;display:grid;gap:9px;margin:9px 0;overflow-wrap:anywhere}
#zaviRecovery141 .zr141Item strong{font-size:14px;line-height:1.7}
#zaviRecovery141 .zr141Item small{font-size:12px;color:#bcd5eb;direction:ltr;unicode-bidi:isolate}
#zaviRecovery141 .zr141Muted{font-size:12px;opacity:.76}
#zaviRecovery141 .zr141Status{font-size:13px;line-height:1.9;color:#d3e6f7;margin:8px 0}
#z24Root .v24-tabs .zr141Tab{background:#115e84!important;color:#fff!important;border:1px solid #47b4d3!important}
#z24Root .v24-btn[data-v24="permanent-delete"]{background:#165f6a!important;color:white!important;border:1px solid #3fb6b1!important}
@media(max-width:730px){#zaviRecovery141 .zr141Columns{grid-template-columns:1fr}#zaviRecovery141 .zr141Page{padding:12px;max-height:100dvh;border-radius:0}#zaviRecovery141{padding:0}}
@media print{#zaviRecovery141{display:none!important}}
`;
function ensure(){let el=document.getElementById('zaviRecovery141');if(el)return el;
 const st=document.createElement('style');st.id='zaviRecovery141CSS';st.textContent=styles;document.head.append(st);
 el=document.createElement('div');el.id='zaviRecovery141';el.hidden=true;
 el.innerHTML='<div class="zr141Page" role="dialog" aria-modal="true" aria-label="Customer recovery"><div class="zr141Head"><h2 class="zr141Title"></h2><div class="zr141Actions"><button type="button" data-zr141="refresh"></button><button type="button" data-zr141="close"></button></div></div><p class="zr141Intro"></p><input id="zaviRecoverySearch141" type="search" autocomplete="off"><p class="zr141Status" aria-live="polite"></p><div class="zr141Columns"><section class="zr141Box"><h3 class="zr141ActiveHeading"></h3><div class="zr141Active"></div></section><section class="zr141Box"><h3 class="zr141OldHeading"></h3><div class="zr141Old"></div></section></div><p class="zr141Note"></p></div>';
 document.body.append(el);
 el.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b){if(ev.target===el)hide();return}
   if(b.dataset.zr141==='close')hide();else if(b.dataset.zr141==='refresh')fetchRecords();else if(b.dataset.zr141==='restore')restore(b.dataset.id)});
 el.querySelector('input').addEventListener('input',ev=>{filter=ev.target.value.trim().toLowerCase();paint()});return el;
}
function syncTabs(){const nav=document.querySelector('#z24Root .v24-tabs');if(!nav)return;
 if(!nav.querySelector('.zr141Tab')){const b=document.createElement('button');b.type='button';b.className='v24-btn zr141Tab';b.textContent=t().tab;b.addEventListener('click',show);nav.append(b)}
 const tabButton=nav.querySelector('.zr141Tab');
 const title=t().tab;
 if(tabButton && tabButton.textContent!==title)tabButton.textContent=title;
 document.querySelectorAll('#z24Root button[data-v24="permanent-delete"]').forEach(b=>{
   const caption='🗑 '+t().trash;
   if(b.textContent!==caption)b.textContent=caption;
   if(b.title!==t().trashDone)b.title=t().trashDone;
 });
}
function hide(){open=false;const el=document.getElementById('zaviRecovery141');if(el)el.hidden=true;filter=''}
function show(){if(api()?.getMode?.()!=='live')return alert('برای بازیابی با حساب مالک مرکزی وارد شوید.');open=true;const el=ensure();el.hidden=false;filter='';el.querySelector('input').value='';paint();fetchRecords();}
async function rpc(name,body){if(api()?.getMode?.()!=='live')throw Error('ADMIN session required');return api().request('/rest/v1/rpc/'+name,{method:'POST',body:body||{}})}
async function fetchRecords(){if(busy)return;busy=true;pending=true;renderCache='';paint();try{const result=await rpc('zavi_admin_recovery_catalog');if(!Array.isArray(result))throw Error('Invalid recovery response');records=result;pending=false;}
catch(e){pending=false;records=[];const el=ensure();el.querySelector('.zr141Status').textContent=t().error+e.message;busy=false;return}busy=false;paint()}
function formatTime(value){if(!value)return '—';const x=new Date(value);return Number.isNaN(x.getTime())?'—':x.toLocaleString('fa-AF')}
function items(list,recoverable){if(!list.length)return '<p>'+esc(t().empty)+'</p>';
 return list.map(x=>{
  const action=recoverable?'<button type="button" class="zr141Restore" data-zr141="restore" data-id="'+esc(x.workspace_id)+'">'+esc(t().restore)+'</button>':'<span class="zr141Muted">'+esc(t().irreversible)+'</span>';
  return '<article class="zr141Item"><strong>'+esc(x.workspace_name||'—')+'</strong><small>'+esc(x.owner_email||'—')+'</small><small>'+esc(t().deleted)+': '+esc(formatTime(x.deleted_at))+'</small><div>'+action+'</div></article>'
 }).join('');}
function paint(){if(!open)return;const el=ensure();const w=t();el.querySelector('.zr141Title').textContent='🗑 '+w.title;
 el.querySelector('.zr141Intro').textContent=w.intro;el.querySelector('[data-zr141="refresh"]').textContent=w.refresh;el.querySelector('[data-zr141="close"]').textContent=w.close;
 el.querySelector('input').placeholder=w.search;el.querySelector('.zr141ActiveHeading').textContent='↩ '+w.active;el.querySelector('.zr141OldHeading').textContent='📋 '+w.historical;
 el.querySelector('.zr141Note').textContent=w.note;
 if(pending){el.querySelector('.zr141Status').textContent=w.loading;return}el.querySelector('.zr141Status').textContent='';
 const valid=records.filter(x=>[x.workspace_name,x.owner_email,x.workspace_id].join(' ').toLowerCase().includes(filter));
 el.querySelector('.zr141Active').innerHTML=items(valid.filter(x=>x.recoverable===true),true);
 el.querySelector('.zr141Old').innerHTML=items(valid.filter(x=>x.recoverable!==true),false);
}
async function restore(id){if(busy||!records.some(x=>x.workspace_id===id&&x.recoverable))return;
 const a=records.find(x=>x.workspace_id===id);if(!confirm('«'+(a.workspace_name||'')+'»\n\n'+t().confirm))return;
 busy=true;try{const ok=await rpc('zavi_admin_restore_trash_customer',{p_workspace_id:id});if(ok!==true)throw Error('The server did not confirm the restore');alert(t().done);busy=false;await fetchRecords();refreshAccountControl();}
 catch(e){busy=false;alert(t().error+e.message)}
}
function refreshAccountControl(){const b=document.querySelector('#z24Root button[data-v24="refresh"]');if(b)b.click();const button=document.getElementById('refreshBtn');if(button)button.click();}
async function trashOne(button){if(busy)return;const id=button.dataset.id;if(!/^[0-9a-f-]{36}$/i.test(id||''))return alert('شناسه حساب درست نیست.');
 const tr=button.closest('tr');const label=tr?.querySelector('td:first-child b')?.textContent||'';
 if(!confirm((label?'«'+label+'»\n\n':'')+t().trashConfirm))return;
 busy=true;try{const ok=await rpc('zavi_admin_trash_customer',{p_workspace_id:id,p_reason:'انتقال قابل بازیابی توسط مدیر'});if(ok!==true)throw Error('Server did not confirm moving the account');alert(t().trashDone);refreshAccountControl();}
 catch(e){alert(t().error+e.message)}finally{busy=false}}
async function trashAll(){if(busy)return;if(!confirm(t().bulkAsk))return;const phrase=prompt(t().bulkCheck);
 if(phrase!=='TRASH ALL CUSTOMER ACCOUNTS')return;
 busy=true;try{const count=await rpc('zavi_admin_trash_all_customer_accounts',{p_confirmation:phrase});if(!Number.isInteger(Number(count)))throw Error('Unexpected bulk result');alert(String(count)+t().bulkDone);refreshAccountControl();}
 catch(e){alert(t().error+e.message)}finally{busy=false}}
function intercept(event){const el=event.target.closest?.(SELECTOR);if(!el)return;
 // Capture before original legacy click listener: never call the real hard-delete RPC.
 event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();
 if(el.dataset.v24==='permanent-delete')trashOne(el);
 else if(el.id==='z53DeleteCustomers')trashAll();}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;syncTabs()},40)}
function start(){document.addEventListener('click',intercept,true);document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&open)hide()});document.addEventListener('change',ev=>{if(ev.target.id==='zaviAdminLanguage'){syncTabs();paint()}});
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});syncTabs();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* ZAVI ONE ADMIN v24 — archived customers, subscription pause, approved PIN reset.
   Runs ONLY through restricted سرور مرکزی RPC functions; NEVER receives customers' private PINs. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dig=v=>String(v).replace(/\d/g,c=>'۰۱۲۳۴۵۶۷۸۹'[+c]);
const months=['حمل','ثور','جوزا','سرطان','اسد','سنبله','میزان','عقرب','قوس','جدی','دلو','حوت'];
function date(value){if(!value)return '—';try{const parts=new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:'Asia/Kabul',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date(value));const m=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${dig(m.day)} ${months[+m.month-1]} ${dig(m.year)}`}catch{return '—'}}
function dateBoth(value){if(!value)return '—';if(window.ZaviDualDate?.formatHTML)return window.ZaviDualDate.formatHTML(value);const d=new Date(value);if(!Number.isFinite(d.getTime()))return '—';const gp=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kabul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const g=Object.fromEntries(gp.map(x=>[x.type,x.value]));return `<span class="zavi-v10-date"><span><small>هجری شمسی:</small> ${date(value)}</span><span><small>عیسوی (میلادی):</small> ${dig(g.day)}-${dig(g.month)}-${dig(g.year)}</span></span>`}

const api=()=>window.ZaviAdminAPI;
async function rpc(name,p={}){return api().request('/rest/v1/rpc/'+name,{method:'POST',body:p})}
async function boundedRead(promise,label,limit=15000){
 let timer;
 try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error((label||'درخواست')+': مدت انتظار طولانی شد؛ اینترنت را بررسی کنید و دوباره بزنید.')),limit)})])}
 finally{clearTimeout(timer)}
}
const MAIN_OWNER_EMAIL='zavyanmasoom6@gmail.com';
let ownerVerified=false;
async function verifyOwner(){try{const x=await boundedRead(api().request('/auth/v1/user',{method:'GET'}),'تأیید مالک',10000);ownerVerified=String(x?.email||'').toLowerCase()===MAIN_OWNER_EMAIL;}catch{ownerVerified=false;}return ownerVerified}
let opened=false,tab='accounts',accounts=[],requests=[],events=[],showArchived=false,history=false,term='',busy=false;
const css=`
#z24Open{position:fixed;bottom:85px;left:18px;z-index:1600;padding:13px 18px;border:0;border-radius:16px;background:linear-gradient(125deg,#0d325a,#0a8fad);color:white;box-shadow:0 10px 32px #082b5680;font:bold 13px Tahoma;cursor:pointer}
#z24Root{position:fixed;inset:0;z-index:1800;background:#e9f2f8;overflow:auto;direction:rtl;color:#123753;font-family:Tahoma,Arial,sans-serif;font-size:13px}
#z24Root *,#z24Root *:before{box-sizing:border-box} .v24-shell{max-width:1240px;margin:0 auto;padding:24px 19px 90px}.v24-hero{background:linear-gradient(125deg,#072b51,#08738c);border-radius:24px;color:white;padding:26px;display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap;box-shadow:0 16px 35px #19345325}
.v24-hero h1{margin:0 0 8px;font-size:25px}.v24-hero p{color:#d4ebf1;line-height:2;margin:0}.v24-tabs{display:flex;flex-wrap:wrap;gap:9px;margin:24px 0}.v24-btn{font:bold 13px Tahoma;min-height:39px;padding:10px 15px;border-radius:11px;border:0;cursor:pointer;background:#097f9a;color:white}.v24-btn.subtle{background:#e5f0f6;color:#154363;border:1px solid #bbd4e5}.v24-btn.danger{background:#fff0f0;border:1px solid #fac0c0;color:#b12d3c}.v24-btn:disabled{opacity:.45;cursor:not-allowed}.v24-tabs .v24-btn.current{background:#133e68;color:white}
.v24-box{border:1px solid #dce9f0;background:white;border-radius:19px;padding:20px;margin:14px 0;box-shadow:0 9px 22px #1535530b}.v24-statgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:16px 0}.v24-stat{border:1px solid #dae8f0;background:white;padding:18px;border-radius:15px}.v24-stat b{display:block;font-size:24px;margin-top:7px}.v24-ctrl{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px}.v24-input{width:100%;min-width:180px;border:1px solid #c6d6e2;border-radius:11px;padding:12px 14px;font:13px Tahoma;outline-color:#14a2b6}.v24-list{overflow-x:auto}.v24-table{width:100%;border-collapse:collapse;text-align:right;min-width:920px}.v24-table th{background:#eff7fa;color:#4c6677;font-weight:800}.v24-table td,.v24-table th{padding:13px;border-bottom:1px solid #e9f0f5;vertical-align:middle}.v24-table small{display:block;margin-top:3px;color:#687f91}.v24-actions{display:flex;flex-wrap:wrap;gap:7px}.v24-chip{display:inline-block;padding:5px 9px;background:#e2f9ef;color:#146646;border-radius:20px;font-size:12px}.v24-chip.block{background:#ffe9ea;color:#a12435}.v24-chip.wait{background:#fff3d9;color:#9e6d1f}.v24-alert{background:#fff7e3;border:1px solid #f0dfb1;border-radius:13px;padding:16px;line-height:2;margin:16px 0}.v24-empty{padding:35px;text-align:center;color:#668398}.v24-err{color:#b32e43}.v24-muted{color:#5c7689;line-height:2}.v24-cardrow{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
@media(max-width:700px){.v24-statgrid{grid-template-columns:1fr}.v24-hero h1{font-size:21px}.v24-shell{padding:12px 10px 50px}.v24-box{padding:12px}}
#z24Root{background:radial-gradient(circle at 70% 0%,#154991,#051329 55%,#07152c)!important;color:#f3faff!important}
#z24Root .v24-box,#z24Root .v24-stat{background:linear-gradient(135deg,#133e7f,#081c3d)!important;border:1px solid #356ba5!important;color:#f0f9ff!important}
#z24Root .v24-table th{background:#123b75!important;color:#eff9ff!important}
#z24Root .v24-table td{background:#0b2853!important;border-color:#335d99!important;color:#fff!important}
#z24Root .v24-table small,#z24Root .v24-muted{color:#bad5ec!important}
#z24Root .v24-input{background:#0d305f!important;color:#eff9ff!important;border:1px solid #3977ad!important}
#z24Root .v24-alert{background:#3a321c!important;border-color:#ad8a4e!important;color:#fff0c5!important}
#z24Root .v24-btn.subtle{background:#153c75!important;color:#ecfaff!important;border:1px solid #3a79ac!important}
#z24Root .v24-btn.danger{background:#72334b!important;color:#ffe3ec!important;border-color:#b36986!important}
/* Mobile account cards: desktop table and functional actions remain unchanged. */
@media(max-width:700px){
#z24Root .v24-table:has(.v24-actions){display:block!important;min-width:0!important;width:100%!important}
#z24Root .v24-table:has(.v24-actions) thead{display:none!important}
#z24Root .v24-table:has(.v24-actions) tbody{display:grid!important;gap:11px!important}
#z24Root .v24-table:has(.v24-actions) tr{display:grid!important;gap:8px!important;background:#0e315d!important;border:1px solid #4286b5!important;border-radius:14px!important;padding:11px!important}
#z24Root .v24-table:has(.v24-actions) td{display:block!important;min-width:0!important;padding:6px 4px!important;border:none!important;background:transparent!important;font-size:14px!important}
#z24Root .v24-table:has(.v24-actions) td::before{content:attr(data-label);display:block;font-size:11px;font-weight:800;opacity:.7;margin-bottom:4px}
#z24Root .v24-table:has(.v24-actions) .v24-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}
#z24Root .v24-table:has(.v24-actions) .v24-actions button{width:100%!important;white-space:normal!important;min-height:45px!important}
#z24Root .v24-table:has(.v24-actions) .v24-actions button:last-child:nth-child(odd){grid-column:1/-1}
}


`;
function init(){
 if(!document.getElementById('z24Styles')){const s=document.createElement('style');s.id='z24Styles';s.textContent=css;document.head.appendChild(s)}
 const nav=$('z24NavOpen');
 if(nav){
   nav.hidden=api()?.getMode?.()!=='live';
   if(!nav.dataset.bound){nav.addEventListener('click',open);nav.dataset.bound='1'}
   $('z24Open')?.remove();
 }else{
   if(!$('z24Open')){const b=document.createElement('button');b.id='z24Open';b.textContent='🔐 مدیریت حساب‌ها و بازیابی رمز';document.body.appendChild(b);b.addEventListener('click',open)}
   $('z24Open').hidden=api()?.getMode?.()!=='live';
 }
}
function root(){return $('z24Root')}
async function open(){if(api()?.getMode?.()!=='live')return alert('اول با حساب مدیریت وارد شوید.');document.body.classList.remove('mobile-drawer');opened=true;if(!root()){const r=document.createElement('div');r.id='z24Root';document.body.appendChild(r);r.addEventListener('click',click);r.addEventListener('input',e=>{if(e.target.id==='z24Search'){term=e.target.value;const at=e.target.selectionStart;paint();const box=$('z24Search');if(box){box.focus();try{box.setSelectionRange(at,at)}catch{}}}})}if(root())root().innerHTML='<div class="v24-shell v24-box" role="status">🔐 در حال بررسی اجازه مدیر... <button type="button" class="v24-btn subtle" data-v24="close">✕ بستن</button></div>';await verifyOwner();await refresh()}
function close(){opened=false;root()?.remove();$('refreshBtn')?.click()}
function shell(content){root().innerHTML=`<div class="v24-shell"><header class="v24-hero"><div><h1>🔐 کنترول حساب‌های مشتریان</h1><p>مدیریت امن حساب‌ها، بایگانی و درخواست‌های بازیابی</p></div><div class="v24-actions"><button class="v24-btn subtle" data-v24="refresh">↻ تازه‌سازی</button><button class="v24-btn" data-v24="close">← برگشت به پنل</button></div></header><nav class="v24-tabs"><button class="v24-btn ${tab==='accounts'?'current':'subtle'}" data-v24="accounts">👥 حساب‌های مشتریان</button><button class="v24-btn ${tab==='requests'?'current':'subtle'}" data-v24="requests">🔑 درخواست‌های بازیابی ${requests.filter(r=>r.request_status==='pending').length?'('+dig(requests.filter(r=>r.request_status==='pending').length)+')':''}</button><button class="v24-btn ${tab==='events'?'current':'subtle'}" data-v24="events">📋 سابقه تصمیم‌ها</button></nav>${content}</div>`}
async function refresh(){if(!opened)return;
 root().innerHTML='<div class="v24-shell v24-box" role="status">⏳ در حال دریافت معلومات از دیتابیس مرکزی… <button class="v24-btn subtle" data-v24="close">✕ بستن</button></div>';
 try{
  if(tab==='accounts')accounts=await boundedRead(rpc('zavi_admin_v24_accounts'),'دریافت حساب‌ها');
  else if(tab==='requests')requests=await boundedRead(rpc('zavi_admin_v24_pin_requests',{p_history:history}),'دریافت درخواست‌ها');
  else events=await boundedRead(rpc('zavi_admin_v24_events'),'دریافت سابقه');
  if(!opened||!root())return;
  paint();
 }catch(e){
  if(!opened||!root())return;
  shell(`<section class="v24-box v24-err" role="alert"><h2>⚠️ دریافت معلومات انجام نشد</h2><p>${esc(e?.message||'خطای نامشخص')}</p><p>اتصال اینترنت، ورود مدیر اصلی و وضعیت سرور را بررسی کنید.</p><div class="v24-actions"><button type="button" class="v24-btn" data-v24="refresh">↻ تلاش دوباره</button><button type="button" class="v24-btn subtle" data-v24="close">✕ بستن</button></div></section>`);
 }
}
function status(a){if(a.archived)return ['بایگانی / بسته','block'];if(a.sub_status==='suspended')return ['اشتراک متوقف','block'];if(a.plan==='none'||a.sub_status==='pending')return ['هنوز فعال نیست','wait'];if(['annual','semiannual'].includes(a.plan)&&(!a.expires_at||new Date(a.expires_at)<=new Date()))return ['مدت اشتراک ختم شده','wait'];return ['فعال','']}
function drawAccounts(){const filtered=accounts.filter(a=>(showArchived||!a.archived)&&(a.workspace_name+' '+(a.owner_email||'')).toLowerCase().includes(term.trim().toLowerCase()));const archivedCount=accounts.filter(a=>a.archived).length;return `<div class="v24-statgrid"><div class="v24-stat">تمام حساب‌ها<b>${dig(accounts.length)}</b></div><div class="v24-stat">حساب‌های فعال در فهرست<b>${dig(accounts.length-archivedCount)}</b></div><div class="v24-stat">حساب‌های بایگانی<b>${dig(archivedCount)}</b></div></div>
 <section class="v24-box"><div class="v24-cardrow"><h2>فهرست و مدیریت حساب‌ها</h2><label><input type="checkbox" id="z24ShowArchived" ${showArchived?'checked':''}> نمایش حساب‌های بایگانی</label></div><div class="v24-ctrl"><input class="v24-input" id="z24Search" placeholder="جستجو با نام دوکان یا ایمیل" value="${esc(term)}"></div><div class="v24-list"><table class="v24-table"><thead><tr><th>دوکان و مالک</th><th>وضعیت</th><th>نوع اشتراک</th><th>تاریخ ختم</th><th>عملیات مدیر</th></tr></thead><tbody>${filtered.map(a=>{const st=status(a);return `<tr><td data-label="دوکان و مالک"><b>${esc(a.workspace_name)}</b><small dir="ltr">${esc(a.owner_email)}</small></td><td data-label="وضعیت"><span class="v24-chip ${st[1]}">${st[0]}</span></td><td data-label="نوع اشتراک">${a.plan==='annual'?'سالانه':a.plan==='semiannual'?'شش‌ماهه':a.plan==='lifetime'?'طرح ویژه':'ثبت نشده'}</td><td data-label="تاریخ ختم">${dateBoth(a.expires_at)}</td><td data-label="عملیات مدیر"><div class="v24-actions">${a.archived?`<button class="v24-btn subtle" data-v24="restore" data-id="${a.workspace_id}">↩ بازگردانی</button>`:`<button class="v24-btn danger" data-v24="archive" data-id="${a.workspace_id}">🗃 حذف از فهرست / بایگانی</button>`}${ownerVerified&&String(a.owner_email||'').toLowerCase()!==MAIN_OWNER_EMAIL?`<button class="v24-btn danger" data-v24="permanent-delete" data-id="${esc(a.workspace_id)}">🗑 حذف دائمی</button>`:''}${!a.archived&&a.plan!=='lifetime'?`<button class="v24-btn" data-v24="renew" data-id="${a.workspace_id}">↻ تمدید اشتراک</button>`:''}${!a.archived&&a.plan!=='none'?`<button class="v24-btn ${a.sub_status==='suspended'?'subtle':'danger'}" data-v24="subscription" data-id="${a.workspace_id}">${a.sub_status==='suspended'?'✓ بازکردن اشتراک':'⛔ توقف اشتراک'}</button>`:''}</div></td></tr>`}).join('')}</tbody></table>${!filtered.length?'<div class="v24-empty">حسابی با این مشخصات پیدا نشد.</div>':''}</div></section>`}
function drawRequests(){return `<section class="v24-box"><div class="v24-cardrow"><h2>درخواست‌های فراموشی رمز شخصی</h2><label><input type="checkbox" id="z24History" ${history?'checked':''}> نمایش تمام سابقه</label></div><p class="v24-muted">رمز مشتری نزد ما ثبت یا نمایش داده نمی‌شود. مشتری با حساب آنلاین خودش درخواست می‌فرستد؛ شما ابتدا هویت او را تأیید کنید. پس از تأیید شما، مشتری فقط تا <b>۳۰ دقیقه</b> فرصت دارد روی همان دستگاه رمز تازه بسازد.</p><div class="v24-alert">⚠️ قبل از تأیید، با مالک واقعی دوکان از طریق شماره تماس یا روش مستقل ارتباط بگیرید. داشتن ایمیل و رمز حساب، به‌تنهایی برای تأیید هویت کافی نیست.</div><div class="v24-list"><table class="v24-table"><thead><tr><th>مشتری</th><th>وضعیت</th><th>ثبت درخواست</th><th>مهلت تأیید</th><th>عملیات</th></tr></thead><tbody>${requests.map(r=>`<tr><td><b>${esc(r.workspace_name)}</b><small dir="ltr">${esc(r.owner_email)}</small></td><td>${esc(({pending:'منتظر تأیید',approved:'تأیید شد',denied:'رد شد',used:'استفاده شد',expired:'مهلت ختم شد'})[r.request_status]||r.request_status)}</td><td>${dateBoth(r.requested_at)}</td><td>${dateBoth(r.expires_at)}</td><td><div class="v24-actions">${r.request_status==='pending'?`<button class="v24-btn" data-v24="approve" data-id="${r.request_id}">✓ تأیید بازیابی</button><button class="v24-btn danger" data-v24="deny" data-id="${r.request_id}">رد درخواست</button>`:'—'}</div></td></tr>`).join('')}</tbody></table>${!requests.length?'<div class="v24-empty">درخواست تازه‌ای وجود ندارد.</div>':''}</div></section>`}
function drawEvents(){return `<section class="v24-box"><h2>سابقه مدیریت حساب‌ها</h2><p class="v24-muted">تصمیم‌های بایگانی، بازگردانی و تأیید/رد بازیابی در دیتابیس ثبت شده‌اند.</p><div class="v24-list"><table class="v24-table" style="min-width:650px"><thead><tr><th>دوکان</th><th>عملیات</th><th>یادداشت</th><th>زمان</th></tr></thead><tbody>${events.map(e=>`<tr><td>${esc(e.workspace_name)}</td><td>${esc(({archive:'بایگانی',restore:'بازگردانی',pin_approved:'تأیید بازیابی',pin_denied:'رد بازیابی'})[e.action]||e.action)}</td><td>${esc(e.details)}</td><td>${dateBoth(e.occurred_at)}</td></tr>`).join('')}</tbody></table></div></section>`}
function paint(){if(!opened||!root())return;shell(tab==='accounts'?drawAccounts():tab==='requests'?drawRequests():drawEvents())}
async function action(fn,p,msg){if(busy)return;busy=true;try{await rpc(fn,p);api()?.notify?.(msg);await refresh()}catch(e){alert('عملیات انجام نشد: '+e.message)}finally{busy=false}}
async function click(e){const input=e.target;if(input.id==='z24ShowArchived'){showArchived=input.checked;paint();return}if(input.id==='z24History'){history=input.checked;await refresh();return}const b=e.target.closest('button[data-v24]');if(!b)return;const op=b.dataset.v24;
 if(op==='close'){close();return}
 if(busy)return;if(op==='refresh'){await refresh();return}if(['accounts','requests','events'].includes(op)){tab=op;await refresh();return}
 const a=accounts.find(x=>x.workspace_id===b.dataset.id);
 if(op==='permanent-delete'){
   if(!a)return;
   if(String(a.owner_email||'').toLowerCase()===MAIN_OWNER_EMAIL)return alert('حساب مالک اصلی را نمی‌توان حذف دائمی کرد؛ برای پنهان‌کردن از گزینه بایگانی استفاده کنید.');
   if(!(await verifyOwner()))return alert('فقط مالک اصلی اجازه حذف دائمی مشتری را دارد.');
   if(!confirm(`⚠️ حذف دائمی فروشگاه «${a.workspace_name}»\n\nتمام اطلاعات سروری مرتبط با این فروشگاه ممکن است حذف شود و بازگشت آن تضمین نیست.\n\nقبل از ادامه پشتیبان مستقل تهیه کرده‌اید؟`))return;
   // Workspace ID is selected internally from the chosen customer row.
   // Never ask the owner to manually enter the UUID.
   if(!a.workspace_id)return alert('شناسه داخلی فروشگاه یافت نشد؛ حذف لغو شد.');
   const phrase=prompt('تأیید نهایی: عبارت DELETE CUSTOMER PERMANENTLY را دقیق وارد کنید:');
   if(phrase!=='DELETE CUSTOMER PERMANENTLY')return alert('حذف لغو شد.');
   if(!confirm('آخرین تأیید: آیا مطمئن هستید که این فروشگاه برای همیشه حذف شود؟'))return;
   busy=true;
   try{const result=await rpc('zavi_owner_delete_customer',{p_workspace_id:a.workspace_id,p_confirmation:phrase});if(result!==true)throw Error('سرور حذف را تأیید نکرد.');accounts=accounts.filter(x=>x.workspace_id!==a.workspace_id);api()?.notify?.('حذف فروشگاه در سرور ثبت شد.');await refresh()}catch(err){alert('حذف انجام نشد: '+err.message)}finally{busy=false}
   return;
 }
 if(op==='renew'){if(!a)return;close();document.dispatchEvent(new CustomEvent('zavi-admin-open-renew',{detail:{workspace_id:a.workspace_id}}));return}
 if(op==='archive'){if(!a)return;const reason=prompt(`دوکان «${a.workspace_name}» از فهرست حذف و بایگانی شود؟\n\nهیچ معلومات، فاکتور یا پرداختی پاک نمی‌شود.\nعلت را بنویسید:`,'درخواست مالک / توقف فروش');if(reason===null)return;if(!confirm('تأیید نهایی: حساب بسته و بایگانی شود؟'))return;await action('zavi_admin_v24_archive',{p_workspace_id:a.workspace_id,p_archive:true,p_reason:reason.trim()},'حساب بایگانی شد.');return}
 if(op==='restore'){if(!a||!confirm(`«${a.workspace_name}» از بایگانی بازگردانده شود؟ برای فعالیت دوباره ممکن است تمدید یا بازکردن اشتراک هم لازم باشد.`))return;await action('zavi_admin_v24_archive',{p_workspace_id:a.workspace_id,p_archive:false,p_reason:'بازگردانی توسط مدیر'},'حساب از بایگانی بازگردانده شد.');return}
 if(op==='subscription'){if(!a)return;const next=a.sub_status==='suspended'?'active':'suspended';if(!confirm(next==='suspended'?`اشتراک «${a.workspace_name}» همین حالا متوقف شود؟ تاریخ پایان تغییر نمی‌کند و مدت توقف جبران نمی‌شود.`:`اشتراک «${a.workspace_name}» دوباره باز شود؟ اگر تاریخ اشتراک ختم شده باشد، تمدید لازم است.`))return;await action('zavi_v30_admin_set_subscription_status',{p_workspace_id:a.workspace_id,p_new_status:next,p_reason:'تغییر وضعیت از پنل مدیریت نسخه ۲۴'},'وضعیت اشتراک ثبت شد.');return}
 if(op==='approve'||op==='deny'){const req=requests.find(x=>x.request_id===b.dataset.id);if(!req)return;const yes=op==='approve';const question=yes?`هویت واقعی صاحب «${req.workspace_name}» را جداگانه بررسی کرده‌اید؟ اگر بلی، یک مجوز یک‌بارمصرف برای تعیین رمز تازه صادر می‌شود.`:`درخواست بازیابی «${req.workspace_name}» رد شود؟`;if(!confirm(question))return;const note=prompt('یادداشت مدیر (اختیاری):',yes?'هویت از طریق تماس مستقل تأیید شد':'درخواست تأیید نشد');if(note===null)return;await action('zavi_admin_v24_pin_decide',{p_request_id:req.request_id,p_approve:yes,p_note:note.trim()},yes?'بازیابی تأیید شد؛ مشتری تا ۳۰ دقیقه فرصت دارد.':'درخواست رد شد.');return}
}
setInterval(init,2000);setTimeout(init,600);
})();

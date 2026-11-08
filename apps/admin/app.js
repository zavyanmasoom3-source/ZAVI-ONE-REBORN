(()=>{'use strict';
const $=s=>document.querySelector(s), el=id=>document.getElementById(id), escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ADMIN_SESSION_KEY='zavi_admin_session', ADMIN_PERSIST_KEY='zavi_admin_persistent_session_v23_1';
let config={url:'',key:''},session=null,mode='login',page='overview',rows=[],selected=null,filter='all',search='',lastActionBusy=false;
const faDigits=x=>String(x).replace(/\d/g,c=>'۰۱۲۳۴۵۶۷۸۹'[Number(c)]);
const money=(n,c='AFN')=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(+n||0)+' '+c;
const AF_MONTHS=['حمل','ثور','جوزا','سرطان','اسد','سنبله','میزان','عقرب','قوس','جدی','دلو','حوت'];
const afSolarParts=d=>{if(!d)return null;const parts=new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric',timeZone:'Asia/Kabul'}).formatToParts(new Date(d));const out={};for(const part of parts){if(part.type==='year'||part.type==='month'||part.type==='day')out[part.type]=Number(String(part.value).replace(/[^0-9]/g,''))}return out.year&&out.month&&out.day?out:null};
const formatAfghanSolar=d=>{const p=afSolarParts(d);return p?`${faDigits(p.day)} ${AF_MONTHS[p.month-1]||''} ${faDigits(p.year)}`:'—'};
const date=d=>window.ZaviDualDate?.formatBoth?.(d)||formatAfghanSolar(d);
const shortDate=d=>window.ZaviDualDate?.formatBoth?.(d)||formatAfghanSolar(d);
// V10: Persian Solar and Gregorian are two views of the SAME instant.
// Use Kabul civil dates for both; never subtract days twice or trust the device timezone.
const ZAVI_GREG_MONTHS=['جنوری','فبروری','مارچ','اپریل','می','جون','جولای','اگست','سپتمبر','اکتوبر','نومبر','دسمبر'];
const zaviGregorianParts=value=>{
 if(!value)return null;const d=new Date(value);if(!Number.isFinite(d.getTime()))return null;
 const p={};new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kabul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d).forEach(part=>{if(['year','month','day'].includes(part.type))p[part.type]=Number(part.value)});
 return p.year&&p.month&&p.day?p:null;
};
const formatGregorianKabul=value=>{const p=zaviGregorianParts(value);return p?`${faDigits(p.day)} ${ZAVI_GREG_MONTHS[p.month-1]} ${faDigits(p.year)}`:'—'};
const formatSubscriptionBoth=value=>window.ZaviDualDate?.formatHTML?.(value)||(value&&Number.isFinite(new Date(value).getTime())?`<span class="zavi-v10-date"><span><small>هجری شمسی:</small> ${escapeHTML(formatAfghanSolar(value))}</span><span><small>عیسوی (میلادی):</small> ${escapeHTML(formatGregorianKabul(value))}</span></span>`:'—');
const subscriptionDateCSV=value=>value&&Number.isFinite(new Date(value).getTime())?`${formatAfghanSolar(value)} / ${formatGregorianKabul(value)}`:'—';
const todayAfghanText=()=>formatAfghanSolar(new Date());
const planTitle=r=>r.plan==='annual'?'سالانه':r.plan==='semiannual'?'شش‌ماهه':r.plan==='lifetime'?'طرح ویژه':'ثبت نشده';
const planTag=r=>r.plan==='annual'?'سالانه':r.plan==='semiannual'?'شش‌ماهه':r.plan==='lifetime'?'طرح ویژه':'بدون اشتراک';
// Display-only calendar-day count: exact expires_at time still controls access.
// Calendar dates are always evaluated in Afghanistan time (Asia/Kabul),
// even if the phone is in another timezone or has stayed open overnight.
const zaviKabulCivilDay = value => {
 const d = new Date(value);
 if (!Number.isFinite(d.getTime())) return NaN;
 const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kabul', year: 'numeric', month: '2-digit', day: '2-digit'
 }).formatToParts(d);
 const p = {};
 for (const part of parts) if (['year','month','day'].includes(part.type)) p[part.type]=Number(part.value);
 return Date.UTC(p.year,p.month-1,p.day)/86400000;
};
const daysLeft=d=>{
 if (!d) return null;
 const expiry=new Date(d).getTime(),liveNow=Date.now();
 if (!Number.isFinite(expiry)) return null;
 if (expiry<=liveNow) return 0;
 return Math.max(0,Math.round(zaviKabulCivilDay(expiry)-zaviKabulCivilDay(liveNow)));
};
const demoRows=[{workspace_id:'demo-1',workspace_name:'فروشگاه احمد',owner_email:'ahmad@example.com',owner_uid:'mock',plan:'annual',status:'active',started_at:'2025-11-02T00:00:00Z',expires_at:new Date(Date.now()+5*86400000).toISOString(),last_paid_at:'2025-10-15T12:00:00Z',last_amount:4990,last_currency:'AFN'},{workspace_id:'demo-2',workspace_name:'تجارت محمود',owner_email:'mahmood@example.com',owner_uid:'mock',plan:'annual',status:'active',started_at:'2024-01-02T00:00:00Z',expires_at:new Date(Date.now()-2*86400000).toISOString(),last_paid_at:'2025-05-01T12:00:00Z',last_amount:4990,last_currency:'AFN'},{workspace_id:'demo-3',workspace_name:'دوکان کابل',owner_email:'kabul@example.com',owner_uid:'mock',plan:'annual',status:'active',started_at:'2026-07-05T00:00:00Z',expires_at:new Date(Date.now()+185*86400000).toISOString(),last_paid_at:'2026-07-05T00:00:00Z',last_amount:4990,last_currency:'AFN'},{workspace_id:'demo-4',workspace_name:'شرکت ساحل',owner_email:'sahel@example.com',owner_uid:'mock',plan:'lifetime',status:'active',started_at:'2026-06-01T00:00:00Z',expires_at:null,last_paid_at:'2026-06-01T00:00:00Z',last_amount:14900,last_currency:'AFN'},{workspace_id:'demo-5',workspace_name:'فروشگاه نور',owner_email:'noor@example.com',owner_uid:'mock',plan:'none',status:'pending',expires_at:null,last_paid_at:null,last_amount:null,last_currency:'AFN'},{workspace_id:'demo-6',workspace_name:'بازار شرق',owner_email:'sharq@example.com',owner_uid:'mock',plan:'annual',status:'suspended',expires_at:new Date(Date.now()+40*86400000).toISOString(),last_paid_at:'2026-04-05T00:00:00Z',last_amount:4990,last_currency:'AFN'}];
let demoPayments=[{event_type:'annual_payment',amount:4990,currency:'AFN',payment_method:'cash',receipt_reference:'ZAV-1024',notes:'پرداخت نقدی',recorded_at:new Date(Date.now()-86400000).toISOString(),old_expires_at:null,new_expires_at:new Date(Date.now()+365*86400000).toISOString()},{event_type:'lifetime_payment',amount:14900,currency:'AFN',payment_method:'hawala',receipt_reference:'ZAV-1003',notes:'حواله',recorded_at:new Date(Date.now()-4*86400000).toISOString()}];
function toast(m,err=false){let div=document.createElement('div');div.className='toast'+(err?' error':'');div.textContent=m;el('toast').appendChild(div);setTimeout(()=>div.remove(),5300)}
function saveConfig(){localStorage.setItem('zavi_admin_public_cfg',JSON.stringify(config))}
function restoreConfig(){try{let s=JSON.parse(localStorage.getItem('zavi_admin_public_cfg')||'{}');if(s.url&&s.key)config=s}catch{};
if(!config.url||!config.key)config={url:'https://wbbmwfnmurpphwxesssx.supabase.co',key:'sb_publishable_qv0LSRUyBASqLG_VS0TUcg_ioZWdlWX'};
el('cfgUrl').value=config.url||'';el('cfgKey').value=config.key||''}
// Keep login across reloads/reopens on this trusted device. Logout removes all tokens.
// Persist only the سرور مرکزی session (never the password). The refresh token renews short-lived access.
function storeSession(){
 try{
  if(session?.access_token && session?.refresh_token){
   localStorage.setItem(ADMIN_PERSIST_KEY,JSON.stringify(session));
   sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }else{
   localStorage.removeItem(ADMIN_PERSIST_KEY);
   sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
 }catch(e){console.warn('Storage unavailable',e)}
}
function savedSession(){
 try{
  const raw=localStorage.getItem(ADMIN_PERSIST_KEY)||sessionStorage.getItem(ADMIN_SESSION_KEY);
  return raw?JSON.parse(raw):null;
 }catch{return null}
}

function checkConfig(){if(!/^https:\/\/[\w.-]+\.supabase\.co\/?$/.test(config.url))throw Error('آدرس پروژه باید HTTPS و بدون /rest/v1 باشد.');if(!/^sb_publishable_|^eyJ/.test(config.key)||config.key.length<25)throw Error('فقط کلید عمومی Publishable یا anon را وارد کنید.');if(/secret|service_role/i.test(config.key))throw Error('کلید مخفی در برنامه ممنوع است.')}
function adminServerError(d,httpCode){
 const code=String(d?.code||''),raw=String(d?.message||d?.error_description||d?.error||d?.msg||'');
 if(code==='23505'||/zavi_v32_unique_brand_payment_reference|zavi_v31_unique_customer_receipts/i.test(raw))return 'شماره رسید قبلاً برای یک پرداخت استفاده شده است؛ رسید دیگری ثبت کنید. [23505]';
 if(code==='42501')return 'شما اجازه این عملیات مدیریتی را ندارید. نقش و دسترسی حساب خود را در سرور بررسی کنید. [42501]';
 if(/Valid amount, payment currency, period and receipt required/i.test(raw))return 'ارز، مبلغ، مدت یا شماره رسید در سرور تأیید نشد. لطفاً ارز را دوباره انتخاب کنید و مقدار پرداخت و مدت اشتراک را بررسی کنید. [ZAVI-CURRENCY]';
 if(code==='42702')return 'خطای ساختار تابع در دیتابیس: ارجاع نام ستون مبهم است. [42702]';
 if(code==='40001')return 'هم‌زمانی عملیات باعث تعارض شده است. صفحه را تازه کنید و دوباره وضعیت را بررسی نمایید. [40001]';
 return raw||`خطای ارتباط با سرور (HTTP ${httpCode})`;
}
async function api(path,{method='GET',body,auth=true,retry=true}={}){checkConfig();const head={'apikey':config.key,'Content-Type':'application/json'};if(auth&&session?.refresh_token&&session?.expires_at&&Date.now()/1000>=Number(session.expires_at)-60){await refreshSession()}if(auth)head.Authorization='Bearer '+(session?.access_token||'');else head.Authorization='Bearer '+config.key;let resp;try{resp=await fetch(config.url.replace(/\/$/,'')+path,{method,headers:head,body:body===undefined?undefined:JSON.stringify(body)})}catch{throw Error('ارتباط با سرور برقرار نشد. انترنت را بررسی کنید.')}if(resp.status===401&&auth&&retry&&session?.refresh_token){await refreshSession();return api(path,{method,body,auth,retry:false})}let d=null;try{d=await resp.json()}catch{}if(!resp.ok)throw Error(adminServerError(d,resp.status));return d}
let adminRefreshInFlight=null;
async function refreshSession(){
 if(adminRefreshInFlight)return adminRefreshInFlight;
 adminRefreshInFlight=(async()=>{
  let r=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token},auth:false});
  session={...session,...r,expires_at:r.expires_at||(r.expires_in?Math.floor(Date.now()/1000)+Number(r.expires_in):session.expires_at)};storeSession();return session;
 })();
 try{return await adminRefreshInFlight}finally{adminRefreshInFlight=null}
}
const ZAVI_ADMIN_ALLOWED_EMAILS=new Set(['zavyanmasoom6@gmail.com']);
async function login(){
 const btn=el('loginBtn');btn.disabled=true;
 try{
  config={url:el('cfgUrl').value.trim().replace(/\/$/,''),key:el('cfgKey').value.trim()};checkConfig();saveConfig();
  const email=el('authEmail').value.trim().toLowerCase();
  const password=el('authPassword').value;
  if(!ZAVI_ADMIN_ALLOWED_EMAILS.has(email))throw Error('این ایمیل در فهرست مدیران مجاز نیست.');
  if(!password)throw Error('رمز عبور خود را وارد کنید.');
  const r=await api('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email,password}});
  el('authPassword').value='';
  if(!r.access_token||!r.user)throw Error('ورود تأیید نشد.');
  if(!ZAVI_ADMIN_ALLOWED_EMAILS.has(String(r.user.email||'').toLowerCase()))throw Error('حساب مجاز نیست.');
  session={...r,expires_at:r.expires_at||(r.expires_in?Math.floor(Date.now()/1000)+Number(r.expires_in):null)};
  // Backend admin RPC must authorize the authenticated UID, not just the email.
  await fetchRows();storeSession();mode='live';showApp();
  toast('با موفقیت وارد حساب خود شدید.');
 }catch(e){session=null;storeSession();el('authPassword').value='';toast(e.message,true)}finally{btn.disabled=false}
}
async function fetchRows(){
 const result=await api('/rest/v1/rpc/zavi_admin_list_workspaces',{method:'POST',body:{}});
 if(!Array.isArray(result))throw Error('فهرست مشتریان دریافت نشد.');
 // Archived accounts stay on the server; the ordinary customer list excludes them.
 const archived=await api('/rest/v1/rpc/zavi_admin_v24_accounts',{method:'POST',body:{}});
 if(!Array.isArray(archived))throw Error('وضعیت بایگانی حساب‌ها دریافت نشد.');
 const hidden=new Set(archived.filter(r=>r.archived).map(r=>r.workspace_id));
 rows=result.filter(r=>!hidden.has(r.workspace_id));
 try{adminFinancePeriodStart=await api('/rest/v1/rpc/zavi_admin_get_report_period',{method:'POST',body:{}})}catch(e){console.warn('Report period unavailable',e)}
 el('connectionStatus').textContent='متصل به سرور مرکزی';document.dispatchEvent(new Event('zavi-admin-data-updated'));
}
function showApp(){closeModal();el('resumeBtn').hidden=true;el('authScreen').hidden=true;el('appScreen').hidden=false;el('sidebarEmail').textContent=mode==='demo'?'DEMO — نمونه نمایشی':session?.user?.email||el('authEmail').value;render()}
function status(r){if(r.status==='suspended')return ['suspended','بسته / معلق'];if(r.plan==='none')return ['pending','در انتظار فعال‌سازی'];if(r.plan==='lifetime')return ['active','فعال'];const expiry=Date.parse(r.expires_at||'');if(!Number.isFinite(expiry)||expiry<=Date.now())return ['expired','پایان‌یافته'];const days=daysLeft(r.expires_at);if(days<=30)return ['warning','نزدیک ختم'];return ['active','فعال']}
const statLabel=r=>{let [cls,t]=status(r);return `<span class="status ${cls}">${escapeHTML(t)}</span>`};
const until=r=>r.plan==='lifetime'&&r.status==='active'?'بدون تاریخ انقضا':r.expires_at?formatSubscriptionBoth(r.expires_at):'هنوز فعال نشده';
function customerRows(list,max){const arr=max?list.slice(0,max):list;return arr.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>نام فروشگاه</th><th>نوع اشتراک</th><th>وضعیت</th><th>تاریخ پایان</th><th>روز باقی‌مانده</th><th>آخرین تمدید / پرداخت</th><th>مدیریت</th></tr></thead><tbody>${arr.map(r=>`<tr><td><b>${escapeHTML(r.workspace_name)}</b><small>${escapeHTML(r.owner_email||'')}</small></td><td><span class="tag">${planTag(r)}</span></td><td>${statLabel(r)}</td><td>${until(r)}</td><td><span class="tag">${r.plan==='lifetime'?'بدون محدودیت':r.expires_at?faDigits(Math.max(0,daysLeft(r.expires_at)))+' روز':'—'}</span></td><td>${r.last_paid_at?formatSubscriptionBoth(r.last_paid_at):'—'}</td><td><div class="action-cell"><button class="button ghost" data-renew="${escapeHTML(r.workspace_id)}">${r.plan==='lifetime'?'جزئیات':'تمدید'}</button>${r.plan!=='none'&&r.plan!=='lifetime'?`<button class="button ${r.status==='suspended'?'ghost':'danger'}" data-substatus="${escapeHTML(r.workspace_id)}">${r.status==='suspended'?'✓ بازکردن':'⏸ توقف اشتراک'}</button>`:''}<button class="button ghost" data-archive="${escapeHTML(r.workspace_id)}" title="بدون حذف اطلاعات، از فهرست پنهان می‌شود">بایگانی</button></div></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">هیچ مشتری با این مشخصات پیدا نشد.</div>'}
function heading(title,subtitle,buttons=''){return `<div class="page-head"><div><div class="eyebrow">ZAVI ONE · ADMIN CENTER</div><h1>${title}</h1><p>${subtitle}</p></div><div class="page-actions"><span class="tag">امروز: ${todayAfghanText()}</span>${buttons}</div></div>`}
function refreshFooterDate(){const x=document.getElementById('footerDate');if(x)x.textContent=window.ZaviDualDate?.formatBoth?.(new Date())||todayAfghanText()}
function stats(){let a=rows.filter(r=>['annual','semiannual'].includes(r.plan)&&r.status==='active'&&Number.isFinite(Date.parse(r.expires_at||''))&&Date.parse(r.expires_at)>Date.now()).length;let ex=rows.filter(r=>status(r)[0]==='expired').length;let soon=rows.filter(r=>status(r)[0]==='warning').length;let rev=rows.filter(r=>r.last_amount).reduce((s,r)=>s+(+r.last_amount||0),0);return `<div class="metric-grid"><section class="metric"><span class="metric-icon">♧</span><div class="label">تمام فروشگاه‌ها</div><strong>${faDigits(rows.length)}</strong><small>ثبت‌شده در دیتابیس</small></section><section class="metric"><span class="metric-icon">✓</span><div class="label">اشتراک فعال ۱۸۰ و ۳۶۵ روزه</div><strong>${faDigits(a)}</strong><small>دارای اعتبار</small></section><section class="metric warn"><span class="metric-icon">◷</span><div class="label">نزدیک ختم</div><strong>${faDigits(soon)}</strong><small>۳۰ روز یا کمتر</small></section><section class="metric alert"><span class="metric-icon">!</span><div class="label">اشتراک پایان‌یافته</div><strong>${faDigits(ex)}</strong><small>منتظر تمدید</small></section></div>`}
function adminDashboardCounts(){
 const counts={all:rows.length,active:0,warning:0,expired:0,pending:0,suspended:0};
 rows.forEach(r=>{const k=status(r)[0];counts[k]=(counts[k]||0)+1});
 return counts;
}
function renderOverview(){
 const c=adminDashboardCounts();
 const alerts=rows.filter(r=>['expired','warning','pending'].includes(status(r)[0]));
 const recent=rows.filter(r=>r.last_paid_at && Number.isFinite(new Date(r.last_paid_at).getTime())).sort((a,b)=>new Date(b.last_paid_at)-new Date(a.last_paid_at)).slice(0,5);
 const distro=[['فعال',c.active,'#1ad1a5'],['نزدیک ختم',c.warning,'#ffb454'],['منقضی',c.expired,'#ff6485'],['در انتظار',c.pending,'#568aff'],['معلق',c.suspended,'#9585ff']];
 const total=Math.max(1,rows.length);let upto=0;
 const grad=distro.map(([,,color],i)=>{const s=upto;upto+=distro[i][1]*100/total;return `${color} ${s.toFixed(2)}% ${upto.toFixed(2)}%`}).join(',');
 return `<section class="admin-hero"><div><div class="admin-hero-kicker">پنل اختصاصی مالک اصلی · Z1 ADMIN</div><h1>ZAVI ONE <em>ADMIN</em></h1><h2>مدیریت مرکزی فروشگاه‌ها</h2><p>فروشگاه‌ها، تمدید اشتراک، دستگاه‌ها و پشتیبانی در یک محیط امن</p><button type="button" class="button primary" data-nav="customers">مدیریت فروشگاه‌ها ←</button></div><div class="admin-hero-art"><img src="./z1-admin-official.jpg" alt="لوگوی رسمی Z1 ADMIN" width="160" height="160"><span>کنترل مرکزی</span></div></section>
 <div class="admin-kpis" aria-label="آمار واقعی حساب‌ها">
 ${[['فروشگاه‌ها',c.all,'▣','blue'],['اشتراک فعال',c.active,'✓','green'],['نزدیک انقضا',c.warning,'◷','orange'],['منقضی',c.expired,'!','red'],['در انتظار',c.pending,'◆','purple']].map(([title,num,ico,color])=>`<article class="admin-kpi ${color}"><span class="kpi-ico">${ico}</span><small>${title}</small><strong>${faDigits(num)}</strong><span class="kpi-foot">${mode==='demo'?'نمونه آزمایشی':'بر اساس آخرین دریافت از سرور'}</span></article>`).join('')}</div>
 <div class="admin-analytics">
  <section class="panel admin-analytics-main"><div class="panel-heading"><h2>وضعیت اشتراک فروشگاه‌ها</h2><button type="button" class="button ghost" data-nav="customers">مشاهده همه</button></div>
   <div class="admin-bars">${distro.map(([label,num,color])=>`<div class="admin-bar-row"><span>${label}</span><div class="admin-bar-track"><i style="width:${num?Math.max(3,100*num/total):0}%;background:${color}"></i></div><strong>${faDigits(num)}</strong></div>`).join('')}</div>
   <p class="admin-muted">این نمودار توزیع اشتراک‌های دریافت‌شده را نشان می‌دهد؛ درآمد یا دستگاه‌های ناشناخته تخمین زده نشده‌اند.</p>
  </section>
  <section class="panel admin-distribution"><div class="panel-heading"><h2>توزیع فروشگاه‌ها</h2></div><div class="admin-donut-wrap"><div class="admin-donut" style="background:conic-gradient(${grad})"><div><b>${faDigits(rows.length)}</b><small>فروشگاه</small></div></div><div class="admin-legend">${distro.map(([label,num,color])=>`<div><span style="background:${color}"></span>${label}<b>${faDigits(num)}</b></div>`).join('')}</div></div></section>
 </div>
 <div class="admin-secondary">
  <section class="panel"><div class="panel-heading"><h2>فروشگاه‌های نیازمند پیگیری</h2><button type="button" class="button ghost" data-nav="customers">فهرست کامل</button></div>${alerts.length?`<div class="admin-list">${alerts.slice(0,5).map(r=>`<div class="admin-item"><div><b>${escapeHTML(r.workspace_name)}</b><small>${escapeHTML(r.owner_email||'')}</small></div>${statLabel(r)}<button type="button" class="button ghost" data-renew="${escapeHTML(r.workspace_id)}">بررسی</button></div>`).join('')}</div>`:'<div class="empty">در فهرست فعلی موردی برای پیگیری وجود ندارد.</div>'}</section>
  <section class="panel"><div class="panel-heading"><h2>آخرین تمدیدهای ثبت‌شده</h2><button type="button" class="button ghost" data-nav="payments">سوابق</button></div>${recent.length?`<div class="admin-list">${recent.map(r=>`<div class="admin-item"><div><b>${escapeHTML(r.workspace_name)}</b><small>${escapeHTML(shortDate(r.last_paid_at))}</small></div><strong>${r.last_amount!=null?escapeHTML(money(r.last_amount,r.last_currency||'AFN')):'—'}</strong></div>`).join('')}</div>`:'<div class="empty">پرداخت ثبت‌شده‌ای در اطلاعات دریافت‌شده نیست.</div>'}</section>
 </div>
 <section class="panel admin-quick"><div class="panel-heading"><h2>دسترسی سریع</h2></div><div class="admin-quick-grid">${[['customers','▣','فروشگاه‌ها'],['payments','♛','اشتراک‌ها'],['devices','▤','دستگاه‌ها'],['support','☏','پشتیبانی'],['finance','▥','گزارش مالی'],['security','♢','امنیت']].map(([key,icon,title])=>`<button type="button" data-nav="${key}"><span>${icon}</span>${title}</button>`).join('')}</div></section>`;
}
function renderDevices(){return heading('مدیریت دستگاه‌ها','تعویض دستگاه اصلی و سیاست مجوز آفلاین هر فروشگاه فقط با تأیید سرور')+
 `<div class="admin-kpis"><article class="admin-kpi blue"><small>فروشگاه‌های قابل انتخاب</small><strong>${faDigits(rows.length)}</strong><span>تعداد دستگاه‌ها فقط پس از دریافت مجاز از سرور مشخص می‌شود</span></article></div>`+
 `<section class="panel"><h2>کنترل دستگاه و انتقال امن</h2><p class="form-helper">فروشگاه مشتری را انتخاب کنید؛ سپس از قسمت مدیریت برند، دستگاه اصلی و سیاست آفلاین را بررسی نمایید. هیچ انتقالی بدون تأیید شما و سرور انجام نمی‌شود.</p><div class="form-group"><label>فروشگاه</label><select id="adminDeviceStore"><option value="">انتخاب فروشگاه</option>${rows.map(r=>`<option value="${escapeHTML(r.workspace_id)}">${escapeHTML(r.workspace_name)}</option>`).join('')}</select></div><div class="modal-actions"><button class="button primary" id="adminDeviceManage">ورود به مدیریت دستگاه فروشگاه</button></div><p class="notice warn">قطع دسترسی دستگاه آفلاین ممکن است تا زمان بررسی مجدد مجوز در دستگاه اثر نکند. عملیات بدون اینترنت مجاز نیست.</p></section>`}
function renderSupport(){return heading('پشتیبانی مشتریان','پاسخ‌گویی به تیکت‌ها و مشاهده رسیدها از سرور مرکزی')+`<div class="admin-secondary"><section class="panel"><h2>تیکت‌ها و پیام‌ها</h2><p class="form-helper">پیام‌ها از سرور خوانده می‌شوند؛ هنگام پاسخ، وضعیت تیکت به‌روز می‌گردد.</p><button type="button" class="button primary" id="adminOpenSupport">بازکردن مرکز تیکت‌ها</button></section><section class="panel"><h2>رسیدهای اشتراک</h2><p class="form-helper">رسیدهای ثبت‌شده پس از تأیید پرداخت، قابل مشاهده و چاپ هستند.</p><button type="button" class="button ghost" id="adminOpenReceipts">مشاهده رسیدها</button></section></div>`}
function renderActivity(){const a=[...rows].filter(r=>r.last_paid_at).sort((x,y)=>new Date(y.last_paid_at)-new Date(x.last_paid_at));return heading('پیگیری و فعالیت‌ها','تاریخ آخرین تمدیدها و فهرست مشتریان نیازمند پیگیری')+`<section class="panel"><h2>آخرین تمدیدهای دریافت‌شده</h2><div class="admin-list">${a.length?a.map(r=>`<div class="admin-item"><b>${escapeHTML(r.workspace_name)}</b><small>${escapeHTML(shortDate(r.last_paid_at))}</small><b>${r.last_amount!=null?escapeHTML(money(r.last_amount,r.last_currency||'AFN')):'—'}</b></div>`).join(''):'<div class="empty">هنوز سابقه تمدیدی دریافت نشده است.</div>'}</div><p class="form-helper">این بخش فقط فعالیت‌های پرداخت موجود در فهرست را نشان می‌دهد؛ برای گزارش ممیزی کامل باید سرویس Audit سرور پیکربندی شود.</p></section>`}
function renderHealth(){return heading('سلامت و وضعیت سیستم','وضعیت سرور از روی اتصال واقعی بررسی می‌شود؛ درصد پایداری ساختگی نمایش داده نمی‌شود')+`<section class="panel admin-health"><h2>بررسی اتصال امن</h2><p>برای تأیید دسترسی به سرور مرکزی و معتبر بودن نشست مالک، دکمه زیر را بزنید.</p><button class="button primary" type="button" id="adminCheckHealth">بررسی سرور و هویت مالک</button><div id="adminHealthResult" role="status" class="notice">هنوز بررسی نشده است.</div></section><section class="panel"><h2>اصول محافظت از اطلاعات</h2><p>بخش مدیریت مرکزی برای ثبت پرداخت و مدیریت مشتری نیازمند اینترنت و احراز هویت سرور است. داده‌های حسابداری مشتریان از پنل مدیریتی حذف یا پاک نمی‌شود مگر با دستور جداگانه و مجوز معتبر.</p></section>`}
function renderSecurity(){return heading('امنیت و دسترسی','کنترل دسترسی اختصاصی مالک اصلی و ابزارهای مدیریت حساب')+`<div class="admin-secondary"><section class="panel"><h2>🔒 دسترسی فقط برای مالک اصلی</h2><p>ورود نیاز به ایمیل مجاز، رمز صحیح، نشست معتبر و مجوز سرور دارد. ظاهر پنهان یا منوی مخفی جایگزین کنترل دسترسی سمت سرور نیست.</p><p class="notice">${mode==='live'?'نشست سرور تأیید شده است.':'پیش‌نمایش آزمایشی محلی؛ هیچ عملیات مدیریتی واقعی مجاز نیست.'}</p><button class="button ghost" data-nav="settings">تنظیمات و تغییر رمز</button></section><section class="panel"><h2>📋 کنترل حساب‌ها</h2><p>بایگانی، بازیابی و عملیات حساس در بخش مدیریت برند یا تنظیمات و با تأیید جداگانه انجام می‌شوند.</p><button class="button ghost" data-nav="brand">مدیریت برند</button></section></div>`}
function renderCustomers(){let list=rows.filter(r=>{let text=(r.workspace_name+' '+r.owner_email).toLowerCase();return text.includes(search.toLowerCase())&&(filter==='all'||status(r)[0]===filter)});return heading('مشتریان و اشتراک‌ها','هر فروشگاه حساب جداگانه دارد؛ تنها مدیر برند اجازه تمدید، بازکردن یا بستن اشتراک را دارد.',`<button class="button ghost" id="exportBtn">خروجی CSV</button>`)+`<section class="panel"><div class="panel-heading"><h2>فهرست فروشگاه‌ها <small class="small-muted">(${faDigits(list.length)})</small></h2></div><div class="toolbar"><input id="customerSearch" placeholder="نام فروشگاه یا ایمیل مشتری" value="${escapeHTML(search)}"><select id="customerFilter"><option value="all" ${filter==='all'?'selected':''}>همه وضعیت‌ها</option><option value="active" ${filter==='active'?'selected':''}>فعال</option><option value="warning" ${filter==='warning'?'selected':''}>نزدیک ختم</option><option value="expired" ${filter==='expired'?'selected':''}>پایان‌یافته</option><option value="pending" ${filter==='pending'?'selected':''}>بدون اشتراک</option><option value="suspended" ${filter==='suspended'?'selected':''}>بسته / معلق</option></select></div></section><section class="panel">${customerRows(list)}</section>`}
function renderPayments(){return heading('سوابق تمدید و پرداخت','تاریخچه پرداخت هر مشتری به‌طور جداگانه و با امکان پیگیری رسید ثبت می‌شود.')+`<section class="panel"><div class="panel-heading"><h2>فروشگاه موردنظر را انتخاب کنید</h2></div><div class="form-group"><select id="historyWorkspace"><option value="">انتخاب فروشگاه</option>${rows.map(r=>`<option value="${escapeHTML(r.workspace_id)}" ${selected===r.workspace_id?'selected':''}>${escapeHTML(r.workspace_name)}</option>`).join('')}</select></div><div id="historyArea">${selected?'در حال دریافت سوابق...':'برای دیدن سابقه، فروشگاه را انتخاب کنید.'}</div></section>`}
function renderBrand(){
 const customerOptions=rows.map(r=>`<option value="${escapeHTML(r.workspace_id)}">${escapeHTML(r.workspace_name)} — ${escapeHTML(r.owner_email||'')}</option>`).join('');
 return heading('مدیریت برند','تنظیمات اختصاصی مالک ZAVI ONE، دستگاه‌ها و خدمات مرکزی')+`
<section class="panel"><h2>🛡️ مدیریت دستگاه و مجوز آفلاین</h2><p class="form-helper">در این قسمت می‌توانید برای هر مشتری دارای اشتراک معتبر سیاست استفاده آفلاین را ثبت و دستگاه اصلی را تعویض کنید. قطع دسترسی دستگاهی که آفلاین است تا بررسی دوباره سرور فوری نخواهد بود.</p>
<div class="form-group"><label>انتخاب مشتری</label><select id="z32BrandWorkspace"><option value="">یک فروشگاه را انتخاب کنید</option>${customerOptions}</select></div>
<form id="z32OfflinePolicyForm" class="form-grid"><div class="form-group"><label>مدت سیاست آفلاین</label><select name="days"><option value="180">۱۸۰ روز</option><option value="365">۳۶۵ روز</option></select></div><label class="form-group"><input type="checkbox" name="enabled"> فعال‌سازی سیاست آفلاین برای این مشتری</label><div class="modal-actions"><button type="submit" class="button primary">ذخیره سیاست روی سرور</button></div></form>
<div class="modal-actions" style="margin-top:12px"><button type="button" class="button ghost" id="zaviAdminReplaceDevice">تعویض دستگاه اصلی مشتری انتخاب‌شده</button></div>
<p class="form-helper">مدت مجوز امضاشده واقعی را سرور تعیین می‌کند؛ این تنظیمات به‌تنهایی اشتراک رایگان فعال نمی‌سازند.</p></section>
<section class="panel"><h2>👥 مدیریت مشتریان و بایگانی</h2><p class="form-helper">حذف از فهرست و بازگردانی از بایگانی بدون پاک‌کردن اطلاعات در بخش کنترول حساب‌ها انجام می‌شود.</p><button type="button" class="button ghost" id="z32BrandAccounts">بازکردن کنترول حساب‌ها</button></section>
<section class="panel"><h2>💬 پشتیبانی و پیام‌ها</h2><div class="modal-actions"><button type="button" class="button ghost" id="z30SupportSettings">پیام‌های مشتریان</button><button type="button" class="button ghost" id="z30ReceiptsSettings">رسیدها</button></div></section>
<section class="panel"><h2>⚙️ تنظیمات سرور</h2><p class="form-helper">آدرس پروژه: ${escapeHTML(config.url||'—')}<br>کلیدهای خصوصی و امضای مجوز فقط در سرور سرور مرکزی نگهداری می‌شوند.</p></section>`;
}
// V53: dangerous operations are deliberately separate and never run on page load.
let adminFinancePeriodStart=null;
let adminResetBusy=false;
const isMainAdmin=()=>mode==='live' && String(session?.user?.email||'').toLowerCase()==='zavyanmasoom6@gmail.com';
const RESET_FINANCE_PHRASE='RESET ADMIN REPORTS';
const RESET_CUSTOMERS_PHRASE='DELETE ALL CUSTOMER ACCOUNTS';
function renderAdminResetCenter(){
 const owner=isMainAdmin();
 const current=adminFinancePeriodStart?`گزارش مالی فعلی از ${window.ZaviDualDate?.formatBoth?.(adminFinancePeriodStart)||shortDate(adminFinancePeriodStart)} آغاز شده است.`:'هنوز دوره مالی جدیدی ثبت نشده است؛ همه سوابق موجود در گزارش نمایش داده می‌شوند.';
 return `<section class="panel z53-reset-center" aria-labelledby="z53ResetHeading"><div class="panel-heading"><h2 id="z53ResetHeading">🛡️ مرکز صفرسازی و پاکسازی مدیریت</h2><span class="tag">فقط مالک اصلی</span></div>
 <p class="form-helper">دو عملیات مستقل دارید. هیچ‌کدام هنگام ورود یا تازه‌کردن برنامه خودکار اجرا نمی‌شود.</p>
 <div class="z53-reset-grid"><article class="z53-reset-card"><h3>صفرسازی حسابداری ZAVI ONE ADMIN</h3><p>یک دوره مالی جدید از صفر آغاز کنید. مجموع درآمد، مصارف و کمیشن در گزارش دوره جدید صفر می‌شود و با معاملات بعدی افزایش می‌یابد.</p><p class="z53-reset-note">${escapeHTML(current)}</p><p class="z53-reset-note">سوابق پرداخت و رسیدهای قبلی حذف نمی‌شوند؛ تنها تاریخ شروع گزارش تغییر می‌کند. بدهی‌های واقعی با این کار بخشوده نمی‌شوند.</p><button id="z53ResetFinance" class="button ghost" type="button" ${!owner||adminResetBusy?'disabled':''}>↻ شروع دوره مالی صفر</button></article>
 <article class="z53-reset-card z53-destructive"><h3>حذف همه حساب‌های مشتریان</h3><p>همه فروشگاه‌های مشتریان غیرمالک و اطلاعات ذخیره‌شده آن‌ها از سرور به شکل دائمی حذف می‌شود. حساب مالک اصلی و امکان ورود ADMIN محفوظ می‌ماند.</p><p class="z53-reset-note">داده‌های حذف‌شده بدون پشتیبان قابل بازیابی نیستند. رویداد حذف برای ممیزی حفظ می‌شود. مجوزهای آفلاین صادرشده ممکن است تا پایان اعتبارشان در دستگاه باقی بمانند.</p><button id="z53DeleteCustomers" class="button danger" type="button" ${!owner||adminResetBusy?'disabled':''}>⌫ بررسی و حذف همه مشتریان</button></article></div>
 ${!owner?'<div class="notice warn">این گزینه‌ها تنها در نشست آنلاین مالک اصلی فعال می‌شوند.</div>':''}</section>`;
}
async function z53ResetFinance(){
 if(adminResetBusy||!isMainAdmin())return toast('فقط مالک اصلی اجازه صفرسازی دارد.',true);
 if(mode!=='live'||!navigator.onLine)return toast('برای این عملیات اتصال به انترنت لازم است.',true);
 const entered=prompt('برای آغاز یک دوره جدید، عبارت زیر را دقیق وارد کنید:\n'+RESET_FINANCE_PHRASE);
 if(entered!==RESET_FINANCE_PHRASE)return toast('تأیید عملیات درست نبود؛ هیچ تغییری ایجاد نشد.',true);
 if(!confirm('تأیید نهایی: گزارش‌های مالی از صفر دوره جدید را نشان دهند؟ سوابق قبلی محفوظ می‌مانند.'))return;
 adminResetBusy=true;
 try{
   const dateResult=await api('/rest/v1/rpc/zavi_owner_reset_admin_report_period',{method:'POST',body:{p_confirmation:RESET_FINANCE_PHRASE}});
   if(!dateResult||Number.isNaN(new Date(dateResult).getTime()))throw Error('تأیید تاریخ دوره جدید از سرور دریافت نشد.');
   adminFinancePeriodStart=dateResult;
   await fetchFinance();
   render();toast('دوره جدید حسابداری مدیریت آغاز شد. مبالغ قبلی محفوظ ماندند.');
 }catch(e){toast('صفرسازی انجام نشد: '+e.message,true)}finally{adminResetBusy=false;render()}
}
async function z53DeleteAllCustomers(){
 if(adminResetBusy||!isMainAdmin())return toast('فقط مالک اصلی اجازه حذف همه مشتریان را دارد.',true);
 if(mode!=='live'||!navigator.onLine)return toast('برای حذف حساب‌ها اتصال به انترنت لازم است.',true);
 adminResetBusy=true;
 try{
   const preview=await api('/rest/v1/rpc/zavi_owner_reset_customer_accounts',{method:'POST',body:{p_preview:true,p_confirmation:null}});
   const count=Number(preview?.customer_count);
   if(!Number.isSafeInteger(count)||count<0)throw Error('تعداد حساب‌ها از سرور تأیید نشد.');
   if(count===0){toast('هیچ حساب مشتری برای حذف موجود نیست.');return;}
   const entered=prompt(`اخطار: ${faDigits(count)} فروشگاه و معلومات آن‌ها برای همیشه حذف خواهند شد. حساب مدیر اصلی حذف نمی‌شود. برای ادامه دقیقاً این عبارت را وارد کنید:
${RESET_CUSTOMERS_PHRASE}`);
   if(entered!==RESET_CUSTOMERS_PHRASE){toast('تأیید عملیات انجام نشد. هیچ حسابی حذف نشد.',true);return;}
   if(!confirm(`تأیید نهایی حذف دائمی ${faDigits(count)} حساب مشتری و اطلاعات آن‌ها؟ امکان بازیابی بدون پشتیبان نیست.`))return;
   const result=await api('/rest/v1/rpc/zavi_owner_reset_customer_accounts',{method:'POST',body:{p_preview:false,p_confirmation:RESET_CUSTOMERS_PHRASE}});
   if(result?.completed!==true)throw Error('سرور تأیید نهایی حذف را برنگرداند.');
   await fetchRows();finance=null;await fetchFinance().catch(()=>{});
   page='customers';render();toast(`${faDigits(result.deleted_count||0)} حساب مشتری حذف شد. گزارش حذف در سرور نگهداری شد.`);
 }catch(e){toast('عملیات حذف نهایی نشد: '+e.message+' — وضعیت حساب‌ها را تازه کنید.',true)}finally{adminResetBusy=false}
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.id==='z53ResetFinance')z53ResetFinance();
 if(b.id==='z53DeleteCustomers')z53DeleteAllCustomers();
});
function renderSettings(){return heading('تنظیمات و امنیت','مدیریت سرور مرکزی، دسترسی مدیر و نحوه ثبت تمدیدها')+`<section class="panel zavi-theme-settings" aria-label="ظاهر برنامه"><h2>🎨 ظاهر برنامه</h2><div class="zavi-theme-picker" role="group" aria-label="انتخاب ظاهر"><button type="button" class="zavi-theme-choice" data-zavi-theme-choice="dark" aria-pressed="true">🌙 حالت تیره</button><button type="button" class="zavi-theme-choice" data-zavi-theme-choice="light" aria-pressed="false">☀️ حالت روشن</button></div></section><section class="panel"><h2>مرکز پیام‌ها و رسیدها</h2><p class="form-helper">پیام‌های پشتیبانی در این قسمت مدیریت می‌شوند و در صفحه‌های دیگر نمایش داده نمی‌شوند.</p><div class="modal-actions"><button type="button" class="button primary" id="z30SupportSettings">💬 پیام‌های مشتریان</button><button type="button" class="button ghost" id="z30ReceiptsSettings">🧾 رسیدها</button></div></section><section class="panel"><h2>آدرس اتصال</h2><div class="mini-box"><strong>سرور مرکزی Project URL</strong><code>${escapeHTML(config.url||'نمایش آزمایشی')}</code></div><p class="form-helper">تنظیمات فقط با کلید عمومی اجرا می‌شود. هیچ کلید مخفی یا رمز دیتابیس نباید وارد برنامه گردد.</p><button class="button danger" data-logout="1">خروج و قطع نشست</button></section><section class="panel"><h2>🔐 تغییر رمز عبور شخصی</h2><p class="form-helper">رمز هر مدیر فقط برای حساب خودش تغییر می‌کند. رمزها در برنامه ذخیره نمی‌شوند.</p><form id="zaviChangePasswordForm" autocomplete="off"><div class="form-group"><label for="zaviCurrentPassword">رمز فعلی</label><input id="zaviCurrentPassword" type="password" autocomplete="current-password" required minlength="8"></div><div class="form-group"><label for="zaviNewPassword">رمز جدید (حداقل ۱۲ حرف)</label><input id="zaviNewPassword" type="password" autocomplete="new-password" required minlength="12"></div><div class="form-group"><label for="zaviConfirmPassword">تکرار رمز جدید</label><input id="zaviConfirmPassword" type="password" autocomplete="new-password" required minlength="12"></div><button type="submit" class="button primary">ذخیره رمز جدید</button></form></section><section class="panel"><h2>قوانین تمدید</h2><div class="steps"><div class="step"><span class="step-number">◷</span> روزهای هشدار: ۳۰، ۱۵، ۷، ۳ و ۱ روز پیش از پایان.</div><div class="step"><span class="step-number">✓</span> تمدید پیش از ختم: ۱۸۰ یا ۳۶۵ روز مطابق گزینه انتخابی به مهلت باقی‌مانده اضافه می‌شود.</div><div class="step"><span class="step-number">↻</span> تمدید پس از ختم: ۱۸۰ یا ۳۶۵ روز از تاریخ تأیید پرداخت.</div><div class="step"><span class="step-number">⌁</span> با همان حساب و همان معلومات قبلی ادامه می‌دهد.</div></div></section>`+renderAdminResetCenter()}
// ZAVI ONE ADMIN 22.0 — secure server-backed finance module.
// Income comes from zavi_billing_audit, not user-editable localStorage.
let finance=null,financeCurrency='AFN',financeBusy=false;
const FIN_CURRENCIES=['AFN','USD','CNY','PKR','EUR'];
const fAmount=a=>Number(a||0);
const fSum=arr=>arr.reduce((sum,row)=>sum+fAmount(row.amount??row.commission_amount),0);
const fMoney=n=>money(n,financeCurrency);
const fEsc=x=>escapeHTML(x);
const fArr=k=>{let a=Array.isArray(finance?.[k])?finance[k]:[];
 if(!adminFinancePeriodStart||!['revenue','expenses','commissions','payouts'].includes(k))return a;
 const cutoff=Date.parse(adminFinancePeriodStart);
 if(!Number.isFinite(cutoff))return a;
 const dateKey=k==='revenue'?'recorded_at':'created_at';
 return a.filter(x=>{const ts=Date.parse(x?.[dateKey]||x?.recorded_at||x?.created_at||'');return Number.isFinite(ts)&&ts>=cutoff;});
};
function renderFinMoney(n){return `<strong dir="ltr">${fMoney(n)}</strong>`}
function fOptions(options,selected){return options.map(([value,label])=>`<option value="${fEsc(value)}" ${value===selected?'selected':''}>${fEsc(label)}</option>`).join('')}
function renderFinance(){
 const current=financeCurrency, rev=fArr('revenue').filter(t=>t.currency===current),
 expenses=fArr('expenses').filter(t=>t.currency===current),
 commissions=fArr('commissions').filter(t=>t.currency===current),
 payouts=fArr('payouts').filter(t=>t.currency===current),
 earned=fSum(commissions), paid=fSum(payouts), gross=fSum(rev), spent=fSum(expenses), due=Math.max(0,earned-paid);
 const ops=finance?`<button class="button ghost" id="financeCsv">⬇ خروجی CSV</button><button class="button ghost" id="financeReload">↻ تازه‌سازی</button>`:'';
 const header=heading('حسابداری درآمد ZAVI ONE ADMIN',`فروش اشتراک‌ها، فیصدی فروشنده‌گان، پرداخت کمیشن و مصارف به تفکیک واحد پول${adminFinancePeriodStart?' · دوره جاری از '+shortDate(adminFinancePeriodStart):''}`,ops);
 if(!finance)return header+`<section class="panel"><h2>راه‌اندازی حسابداری درآمد</h2><p>ابتدا فایل SQL جداگانه نسخه ۲۲ را در سرور مرکزی اجرا کنید؛ بعد همین صفحه را تازه‌سازی نمایید. معلومات پرداخت‌های قبلی از دیتابیس خوانده می‌شوند.</p><button class="button primary" id="financeReload">بررسی اتصال بخش مالی</button><div class="notice warn">ثبت مصارف و فیصدی‌ها در دیتابیس مرکزی ذخیره می‌شوند. بدون نصب SQL این بخش فقط پیام راه‌اندازی نشان می‌دهد.</div></section>`;
 const filter=`<section class="panel finbar"><div><b>واحد پول راپور</b><small>واحدهای پول باهم جمع نمی‌شوند. برای دیدن حساب دالر، USD را انتخاب کنید.</small></div><select id="financeCurrency" aria-label="واحد پول راپور">${fOptions(FIN_CURRENCIES.map(c=>[c,c]),current)}</select><div class="fin-date">تاریخ امروز: ${window.ZaviDualDate?.formatBoth?.(new Date())||date(new Date())}</div></section>`;
 const cards=`<div class="fin-cards">
 <article class="fin-metric"><span>مجموع فروش اشتراک</span>${renderFinMoney(gross)}<small>فقط پول‌های ثبت‌شده در بخش تمدید</small></article>
 <article class="fin-metric"><span>مصارف شرکت</span>${renderFinMoney(spent)}<small>ثبت‌شده در بخش مصارف</small></article>
 <article class="fin-metric"><span>فیصدی به‌دست‌آمده فروشنده‌گان</span>${renderFinMoney(earned)}<small>هزینه کمیشن؛ شامل پرداخت‌نشده</small></article>
 <article class="fin-metric accent"><span>مفاد تخمینی پس از کمیشن و مصارف</span>${renderFinMoney(gross-spent-earned)}<small>فروش − مصارف − کمیشن ایجادشده</small></article>
 <article class="fin-metric"><span>کمیشن پرداخت‌شده</span>${renderFinMoney(paid)}<small>پول پرداختی به فروشنده‌گان</small></article>
 <article class="fin-metric"><span>کمیشن باقی‌مانده</span>${renderFinMoney(due)}<small>فیصدی ایجادشده منهای پرداختی</small></article>
 <article class="fin-metric"><span>پول نقد تخمینی بعد از پرداخت‌ها</span>${renderFinMoney(gross-spent-paid)}<small>فروش − مصارف − پرداخت کمیشن</small></article>
 </div>`;
 const agents=fArr('agents'), assignments=fArr('assignments');
 const solarNow=afSolarParts(new Date())||{year:new Date().getFullYear(),month:1};
 const chartYear=solarNow.year;
 const chartMonths=AF_MONTHS.map((name,index)=>({year:chartYear,month:index+1,name}));
 const chartAmounts=chartMonths.map(p=>rev.filter(x=>{let d=afSolarParts(x.recorded_at);return d&&d.year===p.year&&d.month===p.month}).reduce((a,x)=>a+fAmount(x.amount),0));
 const highest=Math.max(1,...chartAmounts);
 const monthlyChart=`<section class="panel"><div class="panel-heading"><h2>نمودار فروش ۱۲ ماه هجری شمسی افغانستان</h2><span class="tag">سال ${faDigits(chartYear)} · ${current}</span></div><div class="fin-chart">${chartMonths.map((m,i)=>`<div class="fin-chart-col"><span>${money(chartAmounts[i],current)}</span><div class="fin-chart-rail"><div style="height:${Math.max(2,100*chartAmounts[i]/highest)}%"></div></div><small>${m.name}</small></div>`).join('')}</div></section>`;
 const agentRows=agents.length?agents.map(a=>{
   const cEarn=fSum(commissions.filter(v=>v.agent_id===a.id)), cPaid=fSum(payouts.filter(v=>v.agent_id===a.id));
   return `<tr><td><b>${fEsc(a.name)}</b><small>${fEsc(a.phone||'—')}</small></td><td>${a.default_pct}%</td><td dir="ltr">${money(cEarn,current)}</td><td dir="ltr">${money(cPaid,current)}</td><td dir="ltr">${money(cEarn-cPaid,current)}</td></tr>`;
 }).join(''):'<tr><td colspan="5">هنوز فروشنده ثبت نشده است.</td></tr>';
 const agentList=agents.filter(a=>a.active).map(a=>[a.id,a.name+' ('+a.default_pct+'٪)']);
 const storeList=rows.map(w=>[w.workspace_id,w.workspace_name+' — '+(w.owner_email||'')]);
 const assignmentRows=assignments.length?assignments.map(a=>`<tr><td>${fEsc(a.workspace_name||a.workspace_id)}</td><td>${fEsc(agents.find(p=>p.id===a.agent_id)?.name||'—')}</td><td>${a.pct}%</td><td><button class="button ghost fin-small" data-fin-unassign="${fEsc(a.workspace_id)}">حذف تخصیص</button></td></tr>`).join(''):'<tr><td colspan="4">هنوز فروشنده‌ای به فروشگاه اختصاص نیافته است.</td></tr>';
 const expenseRows=expenses.slice(0,60).map(e=>`<tr><td>${window.ZaviDualDate?.formatBoth?.(e.created_at)||date(e.created_at)}</td><td>${fEsc(e.title)}</td><td>${fEsc(e.category)}</td><td dir="ltr">${money(e.amount,current)}</td><td>${fEsc(e.paid_via||'—')}</td></tr>`).join('')||'<tr><td colspan="5">مصرفی ثبت نشده است.</td></tr>';
 const revenueRows=rev.slice(0,100).map(v=>`<tr><td>${window.ZaviDualDate?.formatBoth?.(v.recorded_at)||date(v.recorded_at)}</td><td>${fEsc(v.workspace_name||'—')}</td><td>${v.event_type==='annual_payment'?'اشتراک سالانه':v.event_type==='semiannual_payment'?'اشتراک شش‌ماهه':v.event_type==='lifetime_payment'?'طرح ویژه قدیمی':'خرید ثبت‌شده'}</td><td dir="ltr">${money(v.amount,current)}</td><td>${fEsc(v.receipt_reference||'—')}</td></tr>`).join('')||'<tr><td colspan="5">هنوز فروش ثبت نشده است.</td></tr>';
 return header+filter+cards+monthlyChart+`<div class="fin-grid">
 <section class="panel"><div class="panel-heading"><h2>ثبت مصارف ZAVI PRO</h2><span class="tag">مربوط به شرکت نرم‌افزاری</span></div>
 <form id="finExpenseForm" class="fin-form"><label>نام مصرف<input name="title" required maxlength="150" placeholder="مثلاً مصارف انترنت / تبلیغات"></label>
 <label>بخش مصرف<select name="category">${fOptions([['advertising','اعلانات'],['internet','انترنت'],['hosting','میزبانی سرور'],['transport','ترانسپورت'],['salary','معاش'],['office','دفتر'],['other','دیگر']],'other')}</select></label>
 <label>مبلغ (${current})<input name="amount" inputmode="decimal" type="number" min="0.01" step="0.01" required></label>
 <label>روش پرداخت<select name="method">${fOptions([['cash','نقدی'],['hawala','حواله'],['bank','بانک'],['other','دیگر']],'cash')}</select></label>
 <label class="fin-full">یادداشت (اختیاری)<input name="memo" maxlength="1000" placeholder="جزئیات مصرف"></label>
 <button class="button primary fin-full" ${financeBusy?'disabled':''}>ثبت مصرف</button></form></section>
 <section class="panel"><div class="panel-heading"><h2>فروشنده‌گان و فیصدی</h2><span class="tag">تعیین فیصدی اختصاصی</span></div>
 <form id="finAgentForm" class="fin-form"><label>نام فروشنده<input name="name" required minlength="2" maxlength="120" placeholder="نام شخص فروشنده"></label>
 <label>شماره تماس<input name="phone" maxlength="50" placeholder="اختیاری"></label>
 <label>فیصدی معمول (%)<input name="pct" type="number" min="0" max="100" step="0.001" value="10" required></label>
 <button class="button primary" ${financeBusy?'disabled':''}>ثبت فروشنده</button></form>
 <hr class="fin-hr"><form id="finAssignmentForm" class="fin-form"><label class="fin-full">فروشگاه مشتری<select name="workspace" required>${fOptions([['','انتخاب فروشگاه'],...storeList],'')}</select></label>
 <label>فروشنده<select name="agent" required>${fOptions([['','انتخاب فروشنده'],...agentList],'')}</select></label>
 <label>فیصدی برای این فروشگاه<input name="pct" type="number" min="0" max="100" step="0.001" value="10" required></label>
 <button class="button primary fin-full" ${financeBusy?'disabled':''}>ثبت فیصدی فروشنده برای فروشگاه</button></form>
 <p class="fin-help">اول فروشنده را برای فروشگاه تعیین کنید، سپس پرداخت اشتراک را تأیید کنید. کمیشن فروش‌های بعدی به‌صورت خودکار محاسبه می‌شود.</p></section>
 </div><div class="fin-grid"><section class="panel"><h2>پرداخت فیصدی فروشنده‌گان</h2>
 <form id="finPayoutForm" class="fin-form"><label class="fin-full">انتخاب فروشنده<select name="agent" required>${fOptions([['','انتخاب فروشنده'],...agentList],'')}</select></label>
 <label>مبلغ (${current})<input name="amount" type="number" inputmode="decimal" min="0.01" step="0.01" required></label>
 <label>طریقه پرداخت<select name="method">${fOptions([['cash','نقدی'],['hawala','حواله'],['bank','بانک']],'cash')}</select></label>
 <label>شماره رسید<input name="reference" maxlength="120"></label><label>یادداشت<input name="notes" maxlength="1000"></label>
 <button class="button primary fin-full" ${financeBusy?'disabled':''}>ثبت پرداخت فیصدی</button></form><p class="fin-help">سیستم پرداخت بیشتر از کمیشن باقی‌مانده را قبول نمی‌کند.</p></section>
 <section class="panel"><h2>یادآوری حسابداری</h2><div class="notice">درآمد از پرداخت‌های تأییدشده اشتراک گرفته می‌شود. فیصدی فروشنده هنگام ثبت پرداخت محاسبه می‌شود؛ پولی که بعداً به فروشنده می‌دهید دوباره از مفاد کم نمی‌شود. برای هر واحد پول راپور جدا است.</div>
 <p class="fin-help">پرداخت‌های قدیمی که پیش از تعیین فروشنده ثبت شده‌اند به‌صورت خودکار کمیشن ندارند. ارقام منفی یا استرداد پول باید به‌صورت جداگانه و با سند اصلاح شوند.</p></section></div>
 <section class="panel"><h2>حساب فروشنده‌گان — ${current}</h2><div class="table-scroll"><table class="data-table"><thead><tr><th>نام</th><th>فیصدی معمول</th><th>کمیشن مجموع</th><th>پرداخت‌شده</th><th>باقی</th></tr></thead><tbody>${agentRows}</tbody></table></div></section>
 <section class="panel"><h2>فروشنده‌های تعیین‌شده برای مشتریان</h2><div class="table-scroll"><table class="data-table"><thead><tr><th>فروشگاه</th><th>فروشنده</th><th>فیصدی</th><th>عملیات</th></tr></thead><tbody>${assignmentRows}</tbody></table></div></section>
 <div class="fin-grid"><section class="panel"><h2>آخرین درآمدهای اشتراک (${current})</h2><div class="table-scroll"><table class="data-table"><thead><tr><th>تاریخ</th><th>فروشگاه</th><th>نوع</th><th>مبلغ</th><th>رسید</th></tr></thead><tbody>${revenueRows}</tbody></table></div></section>
 <section class="panel"><h2>آخرین مصارف (${current})</h2><div class="table-scroll"><table class="data-table"><thead><tr><th>تاریخ</th><th>مصرف</th><th>دسته</th><th>مبلغ</th><th>روش</th></tr></thead><tbody>${expenseRows}</tbody></table></div></section></div>
 <div class="notice warn">این راپور عملیاتی است، نه صورت مالی حسابرسی‌شده. هر پرداخت موفق در سرور مرکزی ثبت می‌شود و مشتریان اجازه دیدن حسابداری مدیر را ندارند.</div>`;
}
async function fetchFinance(){
 if(mode==='demo'){finance={revenue:[],expenses:[],agents:[],assignments:[],commissions:[],payouts:[]};return;}
 // Server timestamp controls report reset, never an untrusted localStorage value.
 adminFinancePeriodStart=await api('/rest/v1/rpc/zavi_admin_get_report_period',{method:'POST',body:{}});
 finance=await api('/rest/v1/rpc/zavi_admin_finance_snapshot',{method:'POST',body:{}});
 if(!finance||!Array.isArray(finance.revenue))throw Error('SQL بخش مالی روی سرور مرکزی راه‌اندازی نشده است.');
}
async function financeRpc(method,params,message){
 if(financeBusy||mode==='demo')return;
 financeBusy=true;try{await api('/rest/v1/rpc/'+method,{method:'POST',body:params});await fetchFinance();toast(message||'معلومات ذخیره شد.');render()}
 catch(e){toast('ثبت ناموفق: '+e.message,true)}finally{financeBusy=false}
}
function financeCSV(){
 if(!finance)return;let rowsCSV=[['نوع','تاریخ','شرح','مبلغ','واحد پول'],
 ...fArr('revenue').map(r=>['درآمد',date(r.recorded_at),r.workspace_name||'',r.amount,r.currency]),
 ...fArr('expenses').map(r=>['مصرف',date(r.created_at),r.title,r.amount,r.currency]),
 ...fArr('commissions').map(r=>['کمیشن ایجادشده',date(r.created_at),fArr('agents').find(a=>a.id===r.agent_id)?.name||'',r.commission_amount,r.currency]),
 ...fArr('payouts').map(r=>['کمیشن پرداخت‌شده',date(r.created_at),fArr('agents').find(a=>a.id===r.agent_id)?.name||'',r.amount,r.currency])];
 let content='\uFEFF'+rowsCSV.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
 let blob=new Blob([content],{type:'text/csv;charset=utf-8'}), url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ZAVI_PRO_ADMIN_حسابداری_'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
async function handleFinSubmit(form){
 let data=Object.fromEntries(new FormData(form).entries());
 if(mode==='demo')return toast('نمونه بدون اتصال است؛ معلومات ثبت نمی‌شود.',true);
 if(form.id==='finAgentForm')return financeRpc('zavi_admin_add_agent',{p_name:data.name,p_phone:data.phone,p_pct:Number(data.pct)},'فروشنده ثبت شد.');
 if(form.id==='finAssignmentForm')return financeRpc('zavi_admin_assign_agent',{p_workspace_id:data.workspace,p_agent_id:data.agent,p_pct:Number(data.pct)},'فیصدی فروشنده برای فروشگاه ثبت شد.');
 if(form.id==='finExpenseForm')return financeRpc('zavi_admin_add_expense',{p_title:data.title,p_category:data.category,p_amount:Number(data.amount),p_currency:financeCurrency,p_paid_via:data.method,p_memo:data.memo},'مصرف ثبت شد.');
 if(form.id==='finPayoutForm'){
  if(!confirm(`آیا واقعاً مبلغ ${money(data.amount,financeCurrency)} را به فروشنده پرداخت کرده‌اید؟`))return;
  return financeRpc('zavi_admin_pay_agent',{p_agent_id:data.agent,p_amount:Number(data.amount),p_currency:financeCurrency,p_method:data.method,p_reference:data.reference,p_notes:data.notes},'پرداخت فیصدی ثبت شد.');
 }
}
document.addEventListener('submit',e=>{const form=e.target;if(['finExpenseForm','finAgentForm','finAssignmentForm','finPayoutForm'].includes(form.id)){e.preventDefault();handleFinSubmit(form)}});
document.addEventListener('change',e=>{if(e.target.id==='financeCurrency'){financeCurrency=e.target.value;render()}});
document.addEventListener('click',async e=>{let button=e.target.closest('button');if(!button)return;
 if(button.id==='financeCsv')financeCSV();
 if(button.id==='financeReload'){try{await fetchFinance();render();toast('حسابداری درآمد تازه شد.')}catch(err){finance=null;render();toast(err.message,true)}}
 if(button.dataset.finUnassign){if(!confirm('فروشنده از این فروشگاه برداشته شود؟ کمیشن‌های قبلی محفوظ می‌مانند.'))return;await financeRpc('zavi_admin_unassign_agent',{p_workspace_id:button.dataset.finUnassign},'فروشنده از فروشگاه برداشته شد.')}
});

function render(){let titles={overview:'داشبورد',customers:'فروشگاه‌ها و اشتراک‌ها',payments:'پرداخت و تمدید',finance:'حسابداری درآمد',settings:'تنظیمات',brand:'مدیریت برند',devices:'دستگاه‌ها',support:'پشتیبانی',activity:'فعالیت‌ها',health:'وضعیت سیستم',security:'امنیت'};el('pageCrumb').textContent=titles[page]||'مدیریت';document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('selected',n.dataset.page===page));let html=mode==='demo'?'<div class="demo-banner">● حالت نمایشی — مشتریان و مبالغ این صفحه ساختگی‌اند؛ هیچ پرداخت یا تمدید واقعی ثبت نمی‌شود.</div>':'';html+=({overview:renderOverview,customers:renderCustomers,payments:renderPayments,finance:renderFinance,settings:renderSettings,brand:renderBrand,devices:renderDevices,support:renderSupport,activity:renderActivity,health:renderHealth,security:renderSecurity}[page]||renderOverview)();el('view').innerHTML=html;refreshFooterDate();if(page==='payments'&&selected)loadHistory();}
window.zaviAdminDeviceRpc=(name,body)=>api("/rest/v1/rpc/"+name,{method:"POST",body});
let zaviModalFocusBefore=null;
function zaviNewPaymentReference(){
 const dt=new Date();
 const utc=dt.getUTCFullYear().toString()+String(dt.getUTCMonth()+1).padStart(2,'0')+String(dt.getUTCDate()).padStart(2,'0')+String(dt.getUTCHours()).padStart(2,'0')+String(dt.getUTCMinutes()).padStart(2,'0')+String(dt.getUTCSeconds()).padStart(2,'0');
 const suffix=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase():Math.random().toString(36).slice(2,12).toUpperCase();
 return 'ZAVI-'+utc+'-'+suffix;
}
function openModal(r){if(!r || !['live','demo'].includes(mode))return;zaviModalFocusBefore=document.activeElement;setTimeout(()=>el('modalClose')?.focus(),0);selected=r.workspace_id;el('modalBg').hidden=false;el('modalBg').setAttribute('aria-hidden','false');el('modalTitle').textContent='مدیریت اشتراک — '+r.workspace_name;let active=statLabel(r);const isLegacyLifetime=r.plan==='lifetime';el('modalBody').innerHTML=`<div class="receipt-preview"><strong>${escapeHTML(r.workspace_name)}</strong><br>${escapeHTML(r.owner_email)}<br><span>نوع اشتراک: ${isLegacyLifetime?'طرح ویژه (قدیمی)':planTitle(r)}</span> &nbsp; ${active}<br>آخرین تمدید / پرداخت: <b>${r.last_paid_at?formatSubscriptionBoth(r.last_paid_at):'—'}</b><br>تاریخ پایان: <b>${until(r)}</b><br><small>روزهای باقی‌مانده بر اساس تاریخ کابل محاسبه می‌شود؛ دو تقویم یک روز مشترک را نشان می‌دهند.</small></div><div class="form-group"><label>مدت اشتراک</label><select id="paymentTerm"><option value="365">سالانه — ۳۶۵ روز</option><option value="180">شش‌ماهه — ۱۸۰ روز</option></select></div><div class="form-row"><div class="form-group"><label>مبلغ دریافت‌شده</label><input type="number" inputmode="decimal" min="0" id="paymentAmount" value="${r.last_amount||4990}"></div><div class="form-group"><label>واحد پول</label><select id="paymentCurrency" aria-label="ارز پرداخت"><option value="AFN">AFN</option><option value="USD">USD</option><option value="CNY">CNY</option><option value="PKR">PKR</option><option value="EUR">EUR</option></select></div></div><div class="form-row"><div class="form-group"><label>روش دریافت</label><select id="paymentMethod"><option value="cash">نقدی</option><option value="hawala">حواله</option><option value="bank">انتقال بانکی</option><option value="other">دیگر</option></select></div><div class="form-group"><label>شماره رسید / مرجع پرداخت</label><input id="paymentReceipt" maxlength="120" value="${escapeHTML(zaviNewPaymentReference())}" placeholder="شماره رسید الزامی و غیرتکراری"></div></div><div class="form-group"><label>یادداشت پرداخت</label><textarea id="paymentNotes" rows="2" maxlength="1000" placeholder="ملاحظات اختیاری"></textarea></div><div id="zaviRenewLiveFeedback" role="status" aria-live="polite" class="zavi-renew-feedback" hidden></div><p class="form-helper">قبل از تأیید حتماً پول را دریافت کنید. این عملیات روی سرور ثبت می‌شود. اگر مشتری زودتر تمدید کند، روزهای باقیمانده حفظ می‌شوند.</p><div class="modal-actions"><button class="button primary" id="renewConfirm" ${mode==='demo'||isLegacyLifetime?'disabled':''}>✓ ثبت پرداخت و فعال‌سازی اشتراک</button></div><div class="modal-actions"><button class="button ${r.status==='suspended'?'ghost':'danger'}" id="statusConfirm" ${mode==='demo'||r.plan==='none'||isLegacyLifetime?'disabled':''}>${r.status==='suspended'?'بازکردن اشتراک':'بستن / تعلیق اشتراک'}</button><button class="button ghost" id="historyBtn">مشاهده سوابق مشتری</button></div>${isLegacyLifetime?'<p class="notice warn">گزینه اشتراک دایمی از پنل حذف شده است. برای این حساب قدیمی فقط مشاهده سوابق ممکن است و ایجاد یا لغو طرح دایمی در این نسخه انجام نمی‌شود.</p>':''}${mode==='demo'?'<p class="notice warn">پیش‌نمایش: دکمه‌های مالی در حالت نمایشی غیرفعال هستند.</p>':''}`;}
function closeModal(){const m=el('modalBg');if(!m)return;m.hidden=true;m.setAttribute('aria-hidden','true');if(zaviModalFocusBefore?.isConnected)zaviModalFocusBefore.focus();zaviModalFocusBefore=null;}
document.addEventListener('keydown',e=>{
 const modal=el('modalBg');if(!modal||modal.hidden)return;
 if(e.key==='Escape'){e.preventDefault();closeModal();return;}
 if(e.key!=='Tab')return;
 const focusables=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(x=>x.getClientRects().length);
 if(!focusables.length)return;
 const first=focusables[0],last=focusables[focusables.length-1];
 if(e.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){e.preventDefault();last.focus()}
 else if(!e.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){e.preventDefault();first.focus()}
});
// ISO currency is independent of the translated text displayed in the dropdown.
// v1.4.4 had <option>AFN</option> without explicit value; when i18n changed
// its text to افغانی the browser sent that text instead of AFN to the RPC.
function zaviCanonicalPaymentCurrency(input){
 const raw=String(input??'').trim();
 const latin=raw.toUpperCase();
 if(['AFN','USD','CNY','PKR','EUR'].includes(latin))return latin;
 const matches={
   'افغانی':'AFN','افغاني':'AFN','افغانۍ':'AFN','afghani':'AFN',
   'دالر':'USD','دلار':'USD','ډالر':'USD','US DOLLAR':'USD',
   'یوان':'CNY','یوان چین':'CNY','يوان چين':'CNY',
   'روپیه پاکستانی':'PKR','روپۍ پاکستانۍ':'PKR',
   'یورو':'EUR','يورو':'EUR','EURO':'EUR'
 };
 return matches[raw]||matches[latin]||'';
}
async function confirmRenew(lifetime=false){
 if(lastActionBusy||mode==='demo')return;
 if(lifetime)return toast('فعال‌سازی دائمی از مسیر قدیمی غیرفعال است.',true);
 const r=rows.find(x=>x.workspace_id===selected);if(!r)return toast('حساب مشتری یافت نشد؛ فهرست را تازه کنید.',true);
 const btn=el('renewConfirm'), feedback=el('zaviRenewLiveFeedback');
 const tell=(message,error=false)=>{if(feedback){feedback.hidden=false;feedback.classList.toggle('is-error',error);feedback.textContent=message}toast(message,error)};
 const amt=Number(el('paymentAmount')?.value),days=Number(el('paymentTerm')?.value);
 if(!Number.isFinite(amt)||amt<=0)return tell('مبلغ پرداخت باید بیشتر از صفر باشد.',true);
 if(![180,365].includes(days))return tell('مدت اشتراک معتبر نیست.',true);
 const currency=zaviCanonicalPaymentCurrency(el('paymentCurrency')?.value),method=el('paymentMethod')?.value;
 if(!currency)return tell('واحد پول معتبر نیست. لطفاً دوباره ارز را انتخاب کنید.',true);
 const receiptField=el('paymentReceipt');
 if(receiptField&&!receiptField.value.trim())receiptField.value=zaviNewPaymentReference();
 const receipt=receiptField?.value?.trim()||'';
 if(!receipt)return tell('شماره رسید ساخته نشد؛ دوباره فرم تمدید را باز کنید.',true);
 if(!confirm(`تأیید می‌کنید مبلغ ${money(amt,currency)} واقعاً دریافت شده و اشتراک ${days===365?'۳۶۵':'۱۸۰'} روزه برای «${r.workspace_name}» فعال شود؟\n\nشماره رسید: ${receipt}`))return;
 lastActionBusy=true;if(btn){btn.disabled=true;btn.textContent='در حال ثبت امن پرداخت…'}
 tell('در حال ثبت پرداخت روی سرور؛ لطفاً دوباره دکمه را فشار ندهید.');
 let response=null;
 try{
  response=await api('/rest/v1/rpc/zavi_v29_admin_record_and_activate_payment',{method:'POST',body:{p_workspace_id:selected,p_amount:amt,p_currency:currency,p_subscription_days:days,p_payment_method:method,p_payment_reference:receipt}});
  const item=Array.isArray(response)?response[0]:response;
  if(!item||String(item.workspace_id)!==String(selected)||!item.payment_id||!item.expires_at)throw Error('ثبت سرور پاسخ کامل برنگرداند. پیش از اقدام دوباره، سوابق همین شماره رسید را بررسی کنید: '+receipt);
  const endDate=shortDate(item.expires_at);
  // The paid renewal has already succeeded. Refresh errors must not mislabel it as failed.
  tell('✓ تمدید در سرور ثبت شد. شماره رسید: '+receipt+' — تاریخ پایان: '+endDate);
  document.dispatchEvent(new CustomEvent('zavi-payment-saved',{detail:{workspace_id:r.workspace_id,receipt_reference:receipt,payment_id:item.payment_id}}));
  try{await fetchRows();render();closeModal();toast('تمدید تأیید شد. شماره رسید: '+receipt)}
  catch(refreshError){tell('✓ پرداخت ثبت شد، اما تازه‌سازی فهرست انجام نشد. شماره رسید '+receipt+' — بعداً از «تازه‌سازی» وضعیت را بررسی کنید.',false)}
 }catch(e){
  const msg=String(e?.message||e);
  tell('ثبت تمدید تأیید نشد: '+msg+' — قبل از تلاش دوباره، در سوابق همین شماره رسید ('+receipt+') را بررسی کنید.',true);
 }finally{
  lastActionBusy=false;
  if(btn&&btn.isConnected){btn.disabled=false;btn.textContent='✓ ثبت پرداخت و فعال‌سازی اشتراک'}
 }
}
async function revokeLifetime(){
 if(lastActionBusy||mode==='demo')return;
 const r=rows.find(x=>x.workspace_id===selected);
 if(!r||r.plan!=='lifetime')return toast('این مشتری اشتراک دائمی ندارد.',true);
 if(!confirm(`اشتراک دائمی «${r.workspace_name}» لغو شود؟ دسترسی مشتری متوقف می‌شود، اما اطلاعات حسابداری او حذف نخواهد شد.`))return;
 const answer=prompt('برای تأیید نهایی، کلمه LIFETIME-REVOKE را بنویسید:');
 if(answer!=='LIFETIME-REVOKE')return toast('لغو اشتراک تأیید نشد.',true);
 lastActionBusy=true;
 const btn=el('revokeLifetime');if(btn)btn.disabled=true;
 try{
  await api('/rest/v1/rpc/zavi_admin_revoke_lifetime',{method:'POST',body:{p_workspace_id:selected,p_confirmation:answer}});
  toast('اشتراک دائمی لغو و دسترسی مشتری متوقف شد. اطلاعات مشتری محفوظ است.');
  closeModal();await fetchRows();render();
 }catch(e){toast('خطا در لغو اشتراک دائمی: '+e.message,true)}
 finally{lastActionBusy=false;if(btn&&btn.isConnected)btn.disabled=false}
}
async function changeSubscriptionStatus(id){
 if(lastActionBusy||mode!=='live')return;
 const r=rows.find(row=>row.workspace_id===id);
 if(!r||!['annual','semiannual'].includes(r.plan))return toast('این مشتری اشتراک مدت‌دار ندارد.',true);
 const next=r.status==='suspended'?'active':'suspended';
 if(next==='active'&&(!r.expires_at||new Date(r.expires_at)<=new Date()))return toast('اشتراک پایان یافته است. ابتدا پرداخت جدید و تمدید انجام دهید.',true);
 if(!confirm(next==='suspended'?`اشتراک «${r.workspace_name}» متوقف شود؟ زمان اشتراک هنگام توقف ادامه می‌یابد و اطلاعات مشتری حذف نمی‌شود.`:`اشتراک «${r.workspace_name}» با اعتبار باقی‌مانده دوباره باز شود؟`))return;
 lastActionBusy=true;
 try{await api('/rest/v1/rpc/zavi_v30_admin_set_subscription_status',{method:'POST',body:{p_workspace_id:id,p_new_status:next,p_reason:'تغییر وضعیت توسط مدیر برند'}});
  await fetchRows();render();closeModal();toast(next==='active'?'اشتراک باز شد.':'اشتراک متوقف شد.');
 }catch(e){toast('عملیات اشتراک انجام نشد: '+e.message,true)}finally{lastActionBusy=false}
}
async function archiveCustomer(id){
 if(lastActionBusy||mode!=='live')return;
 const r=rows.find(row=>row.workspace_id===id);if(!r)return;
 if(!confirm(`«${r.workspace_name}» از فهرست روزمره پنهان و بایگانی شود؟
اطلاعات مشتری حذف نخواهد شد.
بازگردانی از «کنترول حساب‌های مشتریان» امکان دارد.`))return;
 lastActionBusy=true;
 try{await api('/rest/v1/rpc/zavi_admin_v24_archive',{method:'POST',body:{p_workspace_id:id,p_archive:true,p_reason:'بایگانی توسط مدیر برند'}});await fetchRows();render();toast('حساب بدون حذف اطلاعات از فهرست پنهان شد.');}
 catch(e){toast('بایگانی انجام نشد: '+e.message,true)}finally{lastActionBusy=false}
}
function confirmStatus(){if(selected)changeSubscriptionStatus(selected)}
async function loadHistory(){let place=el('historyArea');if(!place||!selected)return;let result=mode==='demo'?demoPayments:await api('/rest/v1/rpc/zavi_admin_billing_history',{method:'POST',body:{p_workspace_id:selected}});if(!Array.isArray(result)||!result.length){place.innerHTML='<div class="empty">هنوز پرداخت یا تمدیدی برای این فروشگاه ثبت نشده است.</div>';return}place.innerHTML=`<div class="table-scroll"><table class="data-table"><thead><tr><th>تاریخ ثبت (شمسی / عیسوی)</th><th>نوع عملیات</th><th>مبلغ</th><th>روش پرداخت</th><th>شماره رسید</th><th>یادداشت</th></tr></thead><tbody>${result.map(t=>`<tr><td>${formatSubscriptionBoth(t.recorded_at)}</td><td>${t.event_type==='annual_payment'?'تمدید سالانه':t.event_type==='semiannual_payment'?'تمدید شش‌ماهه':t.event_type==='lifetime_payment'?'طرح ویژه قدیمی':'تغییر وضعیت'}</td><td dir="ltr">${t.amount!=null?money(t.amount,t.currency):'—'}</td><td>${escapeHTML(t.payment_method||'—')}</td><td>${escapeHTML(t.receipt_reference||'—')}</td><td>${escapeHTML(t.notes||'—')}</td></tr>`).join('')}</tbody></table></div>`}
function downloadCsv(){let arr=[['نام فروشگاه','ایمیل مالک','نوع اشتراک','وضعیت','تاریخ پایان هجری شمسی','تاریخ پایان عیسوی','آخرین تمدید هجری شمسی','آخرین تمدید عیسوی','روزهای باقی‌مانده','آخرین مبلغ'],...rows.map(r=>[r.workspace_name,r.owner_email,planTitle(r),status(r)[1],date(r.expires_at),formatGregorianKabul(r.expires_at),date(r.last_paid_at),formatGregorianKabul(r.last_paid_at),r.expires_at?daysLeft(r.expires_at):'',r.last_amount??''])];let csv='\uFEFF'+arr.map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='ZAVI_ONE_Customers.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
async function logout(){
 closeModal();
 const token=session?.access_token;
 session=null;storeSession();el('resumeBtn').hidden=true;mode='login';
 el('appScreen').hidden=true;el('authScreen').hidden=false;el('authPassword').value='';
 // Revoke session on server where possible; local logout always takes effect.
 if(token){try{await fetch(config.url+'/auth/v1/logout',{method:'POST',headers:{'apikey':config.key,'Authorization':'Bearer '+token}})}catch{}}
 toast('از حساب خارج شدید. برای ورود دوباره رمز لازم است.');
}
document.addEventListener('click',async e=>{let t=e.target.closest('button');if(!t)return;if(t.dataset.nav){page=t.dataset.nav;render()}if(t.dataset.page){page=t.dataset.page;document.body.classList.remove('mobile-drawer');render();if(page==='finance'){try{await fetchFinance();render()}catch(e){finance=null;render();toast('فایل SQL حسابداری درآمد را نصب کنید: '+e.message,true)}}}if(t.dataset.renew){let r=rows.find(x=>x.workspace_id===t.dataset.renew);if(r)openModal(r)}if(t.dataset.substatus)await changeSubscriptionStatus(t.dataset.substatus);if(t.dataset.archive)await archiveCustomer(t.dataset.archive);if(t.id==='z32BrandAccounts')document.getElementById('z24NavOpen')?.click();if(t.id==='mobileMenu')document.body.classList.toggle('mobile-drawer');if(t.id==='modalClose')closeModal();if(t.id==='renewConfirm')await confirmRenew(false);if(t.id==='lifetimeConfirm')await confirmRenew(true);if(t.id==='revokeLifetime')await revokeLifetime();if(t.id==='statusConfirm')await confirmStatus();if(t.id==='historyBtn'){page='payments';closeModal();render()}if(t.id==='logoutBtn'||t.dataset.logout)logout();if(t.id==='exportBtn')downloadCsv()});
document.addEventListener('submit',async e=>{
 if(e.target.id!=='z32OfflinePolicyForm')return;e.preventDefault();
 if(mode!=='live')return toast('در حالت نمایشی امکان تغییر وجود ندارد.',true);
 const ws=el('z32BrandWorkspace')?.value,form=e.target;
 if(!ws||!rows.some(r=>r.workspace_id===ws))return toast('نخست مشتری را انتخاب کنید.',true);
 const days=Number(form.elements.days.value),enabled=!!form.elements.enabled.checked;
 if(![180,365].includes(days))return toast('مدت مجوز معتبر نیست.',true);
 if(!confirm('سیاست دسترسی آفلاین این مشتری روی سرور تغییر کند؟'))return;
 const btn=form.querySelector('[type=submit]');btn.disabled=true;
 try{await api('/rest/v1/rpc/zavi_v269_set_offline_policy',{method:'POST',body:{p_workspace_id:ws,p_offline_days:days,p_enabled:enabled}});toast('سیاست آفلاین برای مشتری انتخاب‌شده ثبت شد.');}
 catch(err){toast('ذخیره سیاست آفلاین انجام نشد: '+err.message,true)}finally{btn.disabled=false}
});
document.addEventListener('input',e=>{if(e.target.id==='customerSearch'){search=e.target.value;let elTable=el('view').querySelector('.panel:last-child');if(elTable){let list=rows.filter(r=>(r.workspace_name+' '+r.owner_email).toLowerCase().includes(search.toLowerCase())&&(filter==='all'||status(r)[0]===filter));elTable.innerHTML=customerRows(list)}}});document.addEventListener('change',e=>{if(e.target.id==='customerFilter'){filter=e.target.value;render()}if(e.target.id==='historyWorkspace'){selected=e.target.value;loadHistory().catch(x=>toast(x.message,true))}});
async function resumeSavedSession(){if(!session?.access_token||!ZAVI_ADMIN_ALLOWED_EMAILS.has(String(session?.user?.email||'').toLowerCase()))return toast('دسترسی مخصوص مالک اصلی است.',true);
 const btn=el('resumeBtn');btn.disabled=true;
 try{await refreshSession();await fetchRows();mode='live';showApp();toast('اتصال قبلی دوباره برقرار شد.');}
 catch(e){toast('اتصال به سرور برقرار نشد: '+e.message,true)}finally{btn.disabled=false}
}
el('resumeBtn').addEventListener('click',resumeSavedSession);
el('loginBtn').addEventListener('click',login);el('authPassword').addEventListener('keydown',e=>{if(e.key==='Enter')login()});el('refreshBtn').addEventListener('click',async()=>{if(mode==='demo')return toast('این یک پیش‌نمایش نمایشی است.');try{await fetchRows();if(page==='finance')await fetchFinance();render();toast('اطلاعات تازه شد.')}catch(e){toast(e.message,true)}});if(['localhost','127.0.0.1'].includes(location.hostname))el('demoBtn').hidden=false;el('demoBtn').addEventListener('click',()=>{mode='demo';session=null;rows=demoRows;showApp();toast('نسخه نمایشی بدون دسترسی به سرور باز شد.')});el('modalBg').addEventListener('click',e=>{if(e.target===el('modalBg'))closeModal()});
document.addEventListener('zavi-admin-open-renew',async event=>{
 if(mode!=='live')return toast('ابتدا وارد حساب مدیر شوید.',true);
 const ws=event.detail?.workspace_id;if(!ws)return toast('مشتری برای تمدید انتخاب نشده است.',true);
 // Do not block the renewal modal on unrelated list refresh/RPC failures.
 let r=rows.find(x=>x.workspace_id===ws);
 if(!r){try{await fetchRows();r=rows.find(x=>x.workspace_id===ws)}catch(err){return toast('دریافت مشخصات مشتری انجام نشد: '+err.message,true)}}
 if(!r)return toast('مشتری یافت نشد؛ فهرست را تازه کنید.',true);
 page='customers';render();openModal(r);
});
// The count changes at Kabul midnight without any payment/RPC operation.
let zaviAdminLastKabulDay=zaviKabulCivilDay(Date.now());
function zaviAdminRefreshDayIfNeeded(){
 const today=zaviKabulCivilDay(Date.now());
 if(today!==zaviAdminLastKabulDay){
  zaviAdminLastKabulDay=today;
  if(['live','demo'].includes(mode) && ['customers','overview'].includes(page))render();
  else if(mode!=='login')refreshFooterDate();
 }
}
setInterval(zaviAdminRefreshDayIfNeeded,45000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')zaviAdminRefreshDayIfNeeded()});
window.ZaviAdminAPI={request:(path,opts)=>api(path,opts),getRows:()=>rows,getMode:()=>mode,notify:toast};
closeModal();el('appScreen').hidden=true;el('authScreen').hidden=false;restoreConfig();(async()=>{
 if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('demo')==='1'){mode='demo';rows=demoRows;page=new URLSearchParams(location.search).get('view')||'overview';showApp();return}
 session=savedSession();if(!session?.access_token||!session?.refresh_token||!ZAVI_ADMIN_ALLOWED_EMAILS.has(String(session?.user?.email||'').toLowerCase())){session=null;storeSession();return;}el('resumeBtn').hidden=false;
 try{await refreshSession();await fetchRows();mode='live';showApp()}
 catch(e){ // A transient failure or an invalid subscription RPC must not delete login.
  el('authEmail').value=session?.user?.email||'';
  toast('حساب شما در این دستگاه محفوظ است. دریافت معلومات سرور مشکل داشت: '+e.message+' — انترنت را بررسی کنید یا دوباره وارد شوید.',true);
 }
document.addEventListener('click',async event=>{
 const b=event.target.closest('button');if(!b)return;
 if(b.id==='adminOpenSupport')window.ZaviAdminSupport?.open?.();
 if(b.id==='adminOpenReceipts')window.ZaviAdminSupport?.receipts?.();
 if(b.id==='adminDeviceManage'){
  const ws=document.getElementById('adminDeviceStore')?.value;
  if(!ws)return toast('اول فروشگاه را انتخاب کنید.',true);
  page='brand';render();const target=document.getElementById('z32BrandWorkspace');if(target)target.value=ws;
  document.getElementById('z32BrandWorkspace')?.scrollIntoView({behavior:'smooth',block:'center'});
 }
 if(b.id==='adminCheckHealth'){
  const node=document.getElementById('adminHealthResult');if(!node)return;
  node.textContent='در حال بررسی اتصال و هویت...';
  if(mode!=='live'){node.textContent='حالت آزمایشی محلی: بررسی سرور انجام نمی‌شود.';return}
  try{const res=await api('/auth/v1/user',{method:'GET'});node.textContent=res?.id?'اتصال و هویت مالک در سرور تأیید شد.':'هویت مالک تأیید نشد.';}
  catch(e){node.textContent='بررسی ناموفق: '+e.message}
 }
});

})();

// Change the signed-in user's own password; never store credentials locally.
document.addEventListener('submit',async event=>{
 if(event.target?.id!=='zaviChangePasswordForm')return;
 event.preventDefault();
 const form=event.target,button=form.querySelector('button[type="submit"]');
 if(mode!=='live'||!session?.access_token){toast('ابتدا وارد حساب خود شوید.',true);return;}
 const current=document.getElementById('zaviCurrentPassword').value;
 const next=document.getElementById('zaviNewPassword').value;
 const confirm=document.getElementById('zaviConfirmPassword').value;
 if(next.length<12){toast('رمز جدید باید حداقل ۱۲ حرف داشته باشد.',true);return;}
 if(next!==confirm){toast('تکرار رمز جدید یکسان نیست.',true);return;}
 if(next===current){toast('رمز جدید باید متفاوت باشد.',true);return;}
 button.disabled=true;
 try{
  const email=String(session.user?.email||'').trim().toLowerCase();
  if(!ZAVI_ADMIN_ALLOWED_EMAILS.has(email))throw Error('حساب مدیریت مجاز نیست.');
  await api('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email,password:current}});
  await api('/auth/v1/user',{method:'PUT',body:{password:next}});
  form.reset();
  toast('رمز حساب شما تغییر کرد. برای امنیت دوباره وارد شوید.');
  logout();
 }catch(err){toast(err.message||'تغییر رمز انجام نشد.',true)}
 finally{form.reset();button.disabled=false;}
});
})();

// V30: settings-only support and receipt entry.
document.addEventListener('click',function(e){if(e.target.closest('#z30SupportSettings'))window.ZaviAdminSupport?.open();if(e.target.closest('#z30ReceiptsSettings'))window.ZaviAdminSupport?.receipts();});

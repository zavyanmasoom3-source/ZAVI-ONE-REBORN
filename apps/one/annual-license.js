/* ZAVI ONE Annual customer guard. Requires cloud.js and secure SQL server RLS.
 * This client-side guard improves UX; DB RLS is the actual security boundary.
 * Offline mode: server-signed ES256 lease; no bypass when a valid lease is absent.
 * IMPORTANT: browser local cache is NOT a cryptographically secure offline license.
 */
(()=>{'use strict';
const escapes=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lang=()=>window.zaviPublicLanguage?.()||'fa-AF';const isPashto=()=>lang()==='ps-AF';const isEnglish=()=>lang()==='en';
const T={title:['اشتراک سالانه ZAVI ONE','د ZAVI ONE کلنی ګډون','ZAVI ONE annual subscription'],checking:['در حال بررسی اعتبار با سرور...','د سرور سره د ګډون تصدیق کېږي...','Checking subscription on the server...'],notConnected:['برای استفاده از نسخه سالانه، ابتدا در تنظیمات به حساب ابری وارد شوید و فروشگاه مشترک را انتخاب کنید.','د کلنۍ نسخې لپاره لومړی خپل کلاوډ حساب ته ننوځئ.','Sign in to your cloud account and select a workspace first.'],expired:['اعتبار اشتراک شما پایان یافته است. معلومات قبلی محفوظ‌اند؛ برای ادامه ثبت معاملات، با فروشنده تماس بگیرید.','ستاسې ګډون پای ته رسېدلی. پخوانۍ معلومات خوندي دي؛ د نوي کولو لپاره پلورونکي سره اړیکه ونیسئ.','Your subscription expired. Existing records remain available. Contact the seller to renew.'],pending:['اشتراک این فروشگاه هنوز فعال نشده است. پس از پرداخت، مدیر ZAVI ONE آن را فعال می‌کند.','د دې دوکان ګډون لا نه دی فعال شوی. له تادیې وروسته مدیر یې فعالوي.','This workspace is waiting for activation by your seller.'],offline:['ارتباط با سرور برقرار نیست؛ تا بررسی دوباره، ثبت و تغییر معلومات غیرفعال است.','له سرور سره اړیکه نشته؛ تر تصدیق پورې بدلونونه بند دي.','Server unavailable: editing is paused until a new verification.'],warn:['اشتراک شما به‌زودی پایان می‌یابد. برای تمدید با فروشنده تماس بگیرید.','ستاسې ګډون ژر پای ته رسېږي. له پلورونکي سره اړیکه ونیسئ.','Your subscription expires soon. Contact your seller to renew.'],active:['اشتراک فعال است.','ګډون فعال دی.','Subscription is active.'],lifetime:['اشتراک دائمی شما فعال است و نیاز به تمدید ندارد.','دایمي ګډون فعال دی.','Lifetime access is active.'],suspended:['اشتراک توسط مدیریت به حالت تعلیق درآمده است.','ګډون د مدیر لخوا ځنډول شوی.','Subscription is suspended.'],backup:['مشاهده معلومات قبلی و دریافت پشتیبان همچنان ممکن است.','د پخوانیو معلوماتو کتل او بیک اپ اخیستل شوني دي.','Previous records and backups remain available.'],refresh:['بررسی دوباره اشتراک','ګډون بیا وڅېړئ','Check subscription again'],contact:['تماس برای تمدید','د نوي کولو اړیکه','Contact to renew']};
const word=k=>T[k]?.[isEnglish()?2:isPashto()?1:0]||k;
// WhatsApp of ZAVI ONE software seller, NOT the customer's own shop WhatsApp.
const ZAVI_SELLER_WHATSAPP_LOCAL='0764713434';
const ZAVI_SELLER_WHATSAPP_E164='93764713434';
function renewalMessage(){return isEnglish()?'Hello, I would like to renew my ZAVI ONE subscription.':isPashto()?'سلام، د ZAVI ONE کلنی ګډون نوي کول غواړم.':'سلام، می‌خواهم اشتراک ZAVI ONE را تمدید کنم.'}
function renewalLink(){return 'https://wa.me/'+ZAVI_SELLER_WHATSAPP_E164+'?text='+encodeURIComponent(renewalMessage())}

const AFGHAN_MONTHS=['حمل','ثور','جوزا','سرطان','اسد','سنبله','میزان','عقرب','قوس','جدی','دلو','حوت'];
const jdate=s=>{if(!s)return '—';const p=new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric',timeZone:'Asia/Kabul'}).formatToParts(new Date(s));let m={};p.forEach(x=>{if(['year','month','day'].includes(x.type))m[x.type]=+x.value});return isEnglish()?`${m.day} ${AFGHAN_MONTHS[m.month-1]} ${m.year}`:`${String(m.day).replace(/\d/g,c=>'۰۱۲۳۴۵۶۷۸۹'[+c])} ${AFGHAN_MONTHS[m.month-1]} ${String(m.year).replace(/\d/g,c=>'۰۱۲۳۴۵۶۷۸۹'[+c])}`};
// V10: render Afghan Solar and Gregorian (عیسوی) for the same UTC timestamp.
const ZAVI_GREG_MONTHS=['جنوری','فبروری','مارچ','اپریل','می','جون','جولای','اگست','سپتمبر','اکتوبر','نومبر','دسمبر'];
const zaviFaNumber=value=>isEnglish()?String(value):String(value).replace(/\d/g,c=>'۰۱۲۳۴۵۶۷۸۹'[+c]);
const gregorianDate=s=>{
 if(!s)return '—';const d=new Date(s);if(!Number.isFinite(d.getTime()))return '—';
 const out={};new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kabul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d).forEach(p=>{if(['year','month','day'].includes(p.type))out[p.type]=Number(p.value)});
 if(!out.year||!out.month||!out.day)return '—';
 return isEnglish()?`${out.day} ${ZAVI_GREG_MONTHS[out.month-1]} ${out.year}`:`${zaviFaNumber(out.day)} ${ZAVI_GREG_MONTHS[out.month-1]} ${zaviFaNumber(out.year)}`;
};
const dualDate=s=>(s==null||s===''||s===0||s==='0')?'—':(window.ZaviDualDate?.formatHTML?.(s)||(s&&Number.isFinite(new Date(s).getTime())?`<span class="zavi-v10-date"><span><small>هجری شمسی</small><b>${escapes(jdate(s))}</b></span><span><small>عیسوی (میلادی)</small><b>${escapes(gregorianDate(s))}</b></span></span>`:'—'));

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
const timeDelta=(now,exp)=>{
 const expiry=new Date(exp).getTime(), liveNow=Date.now();
 if (!Number.isFinite(expiry)||expiry<=liveNow) return 0;
 return Math.max(0,Math.round(zaviKabulCivilDay(expiry)-zaviKabulCivilDay(liveNow)));
}; // Only affects the displayed days; signed lease and exact expiry still enforce access.
const daysText=n=>isEnglish()?n+' days':(isPashto()?`${n} ورځې`:`${n} روز`);
let subscriptionDates=null;let entitlement=null,entWorkspace=null,checking=false,lastCheck=0,lastError='',timer=0;
// Offline validity comes only from a verified signed lease.
let offlineMode=false;
let secureLease=null;
// A definitive server denial overrides an earlier cached offline token for this open session.
// A loss of connectivity alone must not turn a real subscriber into a viewer.
let onlineDenied=false, networkUnavailable=false;
let offlinePrepError='', lastPrepAttempt=0, lastPrepWorkspace='';
const PREP_RETRY_MS=5*60*1000; // Stop flooding the license server when an old device is registered.

const info=()=>window.zaviCloudRestoreInfo?.()||{};
const DATES_CACHE_PREFIX='zavi_v31_subscription_dates_';
function cachedDates(ws){try{const v=JSON.parse(localStorage.getItem(DATES_CACHE_PREFIX+ws)||'null');return v?.workspace_id===ws?v.details:null}catch{return null}}
async function restoreSecureLease(){
 const ws=info().workspace;
 secureLease=await window.zaviSecureOfflineLicense?.cached(ws)||null;
 return !!secureLease;
}
function offlineAllowed(){
 if(onlineDenied)return false;
 const claims=secureLease?.claims;
 const currentUid=window.zaviCloudGetAuthSession?.()?.user?.id;
 // An offline token is usable ONLY by its signed owner, on the exact workspace/device.
 if(!claims||!currentUid||claims.sub!==currentUid||claims.workspace_id!==info().workspace||claims.device_id!==window.zaviSecureOfflineLicense?.device()||claims.status!=='active'||claims.can_write!==true)return false;
 // Do not extend time when offline; the signed expiration is a hard limit.
 return Number.isFinite(claims.exp)&&Number.isFinite(claims.iat)&&Date.now()<claims.exp*1000&&Date.now()>=(claims.iat-60)*1000;
}
// Some mobile browsers report navigator.onLine=true even with no usable internet.
// FALL BACK only for a transport failure, never for server rejection (401/403/expired).
function transportFailure(error){
 const msg=String(error?.message||error||'');
 return navigator.onLine===false || error?.name==='AbortError' || error instanceof TypeError ||
  /Failed to fetch|Load failed|NetworkError|network request failed|network connection|internet connection|ERR_INTERNET_DISCONNECTED|ERR_NETWORK_CHANGED|سرور دسترسی نیست|به سرور دسترسی نیست|اتصال انترنت|اتصال اینترنت|ارتباط شبکه|انترنت قطع|HTTP (502|503|504)/i.test(msg);
}
function offlineRemaining(){return offlineAllowed()?Math.max(0,Math.ceil((secureLease.claims.exp*1000-Date.now())/86400000)):0}
let baseCanEdit=window.zaviCloudCanEdit||(()=>true),baseAfterRender=window.zaviCloudAfterRender||(()=>{}),baseCloudPanel=window.zaviCloudPanel||(()=>''),baseAfterSave=window.zaviCloudAfterSave||(()=>{});
function validSubscription(){return !!(entitlement&&entitlement.status==='active'&&(entitlement.plan==='lifetime'||(['annual','semiannual','trial'].includes(entitlement.plan)&&new Date(entitlement.expires_at).getTime()>Date.now())))}
function allowed(){
 if(!baseCanEdit()||!window.zaviTenantIsBound?.()||onlineDenied)return false;
 // Never permit a write past either the online subscription deadline or signed
 // offline expiry. The server-signed token is the ONLY offline authority.
 if(offlineMode||navigator.onLine===false||networkUnavailable)return offlineAllowed();
 return !!(validSubscription()&&entitlement?.can_write===true&&entWorkspace===info().workspace&&!lastError);
}
function blockedReason(){
 const ctx=info();
 if(!ctx.workspace)return 'ابتدا با اینترنت وارد حساب شوید و فروشگاه خود را انتخاب کنید.';
 if(ctx.role!=='owner')return 'این فروشگاه فقط برای مشاهده باز شده است؛ برای ثبت فروش باید مالک حساب وارد شود.';
 if(!window.zaviTenantIsBound?.())return 'حافظه همین فروشگاه آماده نشده است؛ ابتدا یک‌بار با اینترنت فروشگاه را باز کنید.';
 if(onlineDenied||entitlement?.status==='suspended'||entitlement?.status==='cancelled')return 'اشتراک این فروشگاه توسط مدیریت متوقف یا لغو شده است.';
 if(entitlement?.expires_at&&new Date(entitlement.expires_at).getTime()<=Date.now())return 'اعتبار اشتراک پایان یافته است؛ برای فروش و خرید جدید باید تمدید شود.';
 if(secureLease?.claims?.exp&&Date.now()>=secureLease.claims.exp*1000)return 'اعتبار مجوز آفلاین تمام شده است؛ برای تمدید با اینترنت متصل شوید.';
 if(offlineMode||navigator.onLine===false||networkUnavailable)return offlinePrepError?('مجوز آفلاین آماده نیست: '+offlinePrepError):'مجوز معتبر آفلاین برای این دستگاه پیدا نشد؛ هنگام اتصال به اینترنت از «اشتراک من» دستگاه را آماده کنید.';
 if(checking)return 'در حال بررسی اشتراک با سرور هستیم؛ چند ثانیه بعد دوباره تلاش کنید.';
 if(lastError)return 'اعتبار قابل بررسی نیست: '+lastError+'؛ برای آفلاین، مجوز امضاشده لازم است.';
 if(!entitlement)return 'اطلاعات اشتراک دریافت نشده است؛ ابتدا اینترنت را وصل و اشتراک را بررسی کنید.';
 if(!validSubscription())return 'اشتراک معتبر وجود ندارد؛ تمدید اشتراک لازم است.';
 return 'برای ثبت معامله، حساب مالک و اشتراک معتبر لازم است.';
}
window.zaviAccessDiagnostic=blockedReason;
window.zaviCloudCanEdit=()=>allowed();
const uiClass=()=>{
 if(!info().workspace)return 'wait';if(offlineMode&&offlineAllowed())return 'active';if(checking)return 'wait';if(lastError)return 'error';if(!entitlement)return 'wait';if(entitlement.status==='suspended'||entitlement.status==='cancelled')return 'blocked';if(entitlement.plan==='none')return 'blocked';if(!validSubscription())return 'blocked';if((['annual','semiannual'].includes(entitlement.plan)&&timeDelta(entitlement.server_time,entitlement.expires_at)<=30)||(entitlement.plan==='trial'&&timeDelta(entitlement.server_time,entitlement.expires_at)<=2))return 'warning';return 'active';
};
function message(){if(!info().workspace)return word('notConnected');if(offlineMode&&offlineAllowed())return '✅ حسابداری آفلاین فعال است.';if(lastError)return word('offline')+' '+escapes(lastError);if(checking)return word('checking');if(!entitlement)return word('checking');if(entitlement.status==='suspended'||entitlement.status==='cancelled')return word('suspended');if(entitlement.plan==='none')return word('pending');if(!validSubscription())return word('expired');if(entitlement.plan==='lifetime')return word('lifetime');let d=timeDelta(entitlement.server_time,entitlement.expires_at);return d<=30?word('warn')+' '+daysText(d):word('active')}
function subscriptionDetails(){
 if(!entitlement||(lastError&&!offlineMode)||checking)return '';
 const active=entitlement.status==='active';
 const plan=entitlement.plan;
 if(plan==='none')return '';
 const start=subscriptionDates?.started_at;
 const startLine=start?`<div>📅 تاریخ فعال‌سازی: <b>${dualDate(start)}</b></div>`:`<div>📅 تاریخ فعال‌سازی: <b>در حال دریافت / نامشخص</b></div>`;
 if(plan==='lifetime'&&active)return `<div style="margin-top:8px;font-size:13px;line-height:2"><b>♾️ اشتراک دائمی (Lifetime)</b>${startLine}<div>تاریخ پایان: <b>بدون تاریخ انقضا</b></div><div>تمدید: <b>نیاز ندارد</b></div></div>`;
 if(['annual','semiannual','trial'].includes(plan))return `<div style="margin-top:8px;font-size:13px;line-height:2"><b>📘 ${plan==='trial'?'اشتراک آزمایشی ۷روزه':plan==='semiannual'?'اشتراک شش‌ماهه':'اشتراک سالانه'}</b>${startLine}<div>📅 تاریخ پایان: <b>${dualDate(entitlement.expires_at)}</b></div>${active&&entitlement.expires_at?`<div>روزهای باقی‌مانده: <b>${Math.max(0,timeDelta(entitlement.server_time,entitlement.expires_at))}</b></div>`:''}</div>`;
 return '';
}
async function loadSubscriptionDates(cfg,session,ws){
 subscriptionDates=null;
 try{
 const ctl=new AbortController();const timeout=setTimeout(()=>ctl.abort(),6500);
 let response;try{response=await fetch(cfg.url.replace(/\/$/,'')+'/rest/v1/rpc/zavi_my_subscription_details',{method:'POST',headers:{'Content-Type':'application/json',apikey:cfg.key,Authorization:'Bearer '+session.access_token},body:JSON.stringify({p_workspace_id:ws}),signal:ctl.signal})}finally{clearTimeout(timeout)}
 if(!response.ok)return;
 const json=await response.json();
 if(info().workspace===ws&&entWorkspace===ws&&Array.isArray(json)&&json[0]){
   subscriptionDates={...json[0]};
   // The subscription-details RPC returns started_at, not last_paid_at.
   // For last renewal, use ONLY the authenticated customer's existing receipt RPC.
   try{
    const rc=new AbortController(), rt=setTimeout(()=>rc.abort(),6000);
    let resp;try{resp=await fetch(cfg.url.replace(/\/$/,'')+'/rest/v1/rpc/zavi_my_receipts',{method:'POST',headers:{'Content-Type':'application/json',apikey:cfg.key,Authorization:'Bearer '+session.access_token},body:JSON.stringify({p_workspace_id:ws}),signal:rc.signal})}finally{clearTimeout(rt)}
    if(resp.ok){const receipts=await resp.json();if(Array.isArray(receipts)){
     const renewals=receipts.filter(x=>x?.paid_at&&['annual_payment','semiannual_payment'].includes(x.subscription_type)).sort((a,b)=>new Date(b.paid_at)-new Date(a.paid_at));
     if(renewals[0])subscriptionDates.last_renewed_at=renewals[0].paid_at;
    }}
   }catch(e){console.info('Renewal receipt date currently unavailable:',e.message)}
   if(info().workspace===ws&&entWorkspace===ws){try{localStorage.setItem(DATES_CACHE_PREFIX+ws,JSON.stringify({workspace_id:ws,details:subscriptionDates}))}catch{}}
  }
 }catch(e){console.warn('Subscription start date unavailable:',e.message)}
 paint();
}
function banner(){let s=uiClass();return `<section id="zaviAnnualBanner" style="border:1px solid ${s==='blocked'||s==='error'?'#9e536f':s==='warning'?'#9a8141':'#2b5a96'};background:linear-gradient(135deg,#113262,#081b3b);border-radius:16px;padding:10px 13px;margin:8px 0 12px;color:#eff8ff;box-shadow:0 9px 32px #000c2480,inset 0 1px #ffffff12"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:14px;align-items:center"><div><strong style="font-size:14px">☁️ ${word('title')}</strong> <span style="display:inline-block;border-radius:22px;background:#103364;border:1px solid #356aa1;color:#dff8ff;padding:5px 10px;font-size:11px">${escapes(s==='active'?'● فعال':s==='warning'?'◷ نزدیک انقضا':s==='blocked'?'🔒 متوقف':'↻ بررسی اتصال')}</span><div style="font-size:12px;line-height:1.65;margin-top:4px">${message()}</div>${subscriptionDetails()}${s==='blocked'||s==='error'?`<div style="font-size:11px;margin-top:7px">${word('backup')}</div>`:''}</div><div style="display:flex;gap:7px;flex-wrap:wrap"><button id="zaviAnnualRefresh" type="button" style="border:0;border-radius:10px;background:linear-gradient(110deg,#1858ed,#06bcd7);border:1px solid #2ca9fd;color:#fff;padding:7px 10px;cursor:pointer">↻ ${word('refresh')}</button><button id="zaviAnnualContact" type="button" style="border:1px solid #b8dfec;border-radius:10px;background:#103364;color:#dff8ff;border:1px solid #356aa1;padding:7px 10px;cursor:pointer">${word('contact')}</button><a href="${renewalLink()}" target="_blank" rel="noopener noreferrer" class="zavi-renew-whatsapp" style="background:#0b4f48;border:1px solid #178c82;color:#94ffdb;padding:7px 10px;border-radius:10px;text-decoration:none;font-weight:750">📱 WhatsApp: <b dir="ltr">${ZAVI_SELLER_WHATSAPP_LOCAL}</b></a></div></div></section>`}
function paint(){document.getElementById('zaviAnnualBanner')?.remove();const el=document.getElementById('zaviSubscriptionHub');if(el)el.outerHTML=window.zaviSubscriptionView();}
async function verify(force=false){const ws=info().workspace;if(!ws){entitlement=null;subscriptionDates=null;entWorkspace=null;offlineMode=false;secureLease=null;onlineDenied=false;networkUnavailable=false;offlinePrepError='';lastPrepWorkspace='';lastError='';paint();return}if(checking)return;if(!force&&entWorkspace===ws&&Date.now()-lastCheck<25000)return;
 checking=true;paint();try{
 let cfg=JSON.parse(localStorage.getItem('z20_cloud_settings')||'{}'),session=await window.zaviCloudRefreshAuthSession?.()||window.zaviCloudGetAuthSession?.()||JSON.parse(sessionStorage.getItem('z20_auth_session')||localStorage.getItem('z20_auth_session_persistent_v23_1')||'{}');
 if(!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(cfg.url||'')||!session.access_token)throw Error('ورود به حساب آنلاین لازم است.');
 const control=new AbortController();const tout=setTimeout(()=>control.abort(),9500);
 let res;try{res=await fetch(cfg.url.replace(/\/$/,'')+'/rest/v1/rpc/zavi_my_entitlement',{method:'POST',headers:{'Content-Type':'application/json',apikey:cfg.key,Authorization:'Bearer '+session.access_token},body:JSON.stringify({p_workspace_id:ws}),signal:control.signal})}finally{clearTimeout(tout)}
 let output;try{output=await res.json()}catch{output=null};if(!res.ok)throw Error(output?.message||'HTTP '+res.status);if(!Array.isArray(output)||!output[0])throw Error('جدول اشتراک یا مجوز دسترسی یافت نشد.');
 if(ws!==info().workspace)return;
 entitlement=output[0];entWorkspace=ws;lastError='';offlineMode=false;networkUnavailable=false;
 onlineDenied=entitlement?.can_write!==true||entitlement?.status!=='active'||!validSubscription();
 lastCheck=Date.now();// Online entitlement is authoritative for online editing. A separate offline-lease
 // failure must never invalidate an already confirmed active online subscription.
 // A license is requested ONLY for an active paid subscription. A previous
 // device registration is not silently overridden. The customer gets exact guidance.
 const previousLease=await window.zaviSecureOfflineLicense?.cached(ws).catch(()=>null)||null;
 secureLease=previousLease;
 const expiresFromServer=Math.floor(Date.parse(entitlement?.expires_at||'')/1000);
 const staleSubscription=!!previousLease && Number.isFinite(expiresFromServer) && previousLease.claims.subscription_exp!==expiresFromServer;
 const expiringSoon=!!previousLease && previousLease.claims.exp*1000-Date.now()<15*60*1000;
 const shouldTry=entitlement?.can_write===true&&validSubscription()&&
   (!previousLease||staleSubscription||expiringSoon)&&
   (force||ws!==lastPrepWorkspace||Date.now()-lastPrepAttempt>PREP_RETRY_MS);
 if(shouldTry){
   lastPrepAttempt=Date.now();lastPrepWorkspace=ws;offlinePrepError='';
   try {secureLease=await window.zaviDeviceActivation.prepare({silent:true,session,cfg});}
   catch(leaseError){
     // A signed, unexpired cached lease remains valid; never invent permission.
     offlinePrepError=leaseError?.message||'درخواست مجوز آفلاین پذیرفته نشد.';
     console.warn('ZAVI offline preparation:',offlinePrepError);
     secureLease=await window.zaviSecureOfflineLicense?.cached(ws).catch(()=>null)||null;
   }
 }
 if(secureLease)offlinePrepError='';
 if(entitlement?.can_write!==true)offlinePrepError='';
 await loadSubscriptionDates(cfg,session,ws);
 }catch(e){if(ws!==info().workspace)return;lastError=e.message||'انترنت قطع است';const transportError=transportFailure(e);networkUnavailable=transportError;offlineMode=transportError&&!onlineDenied&&await restoreSecureLease();if(offlineMode){subscriptionDates=cachedDates(ws);entitlement={plan:secureLease.claims.plan,status:secureLease.claims.status,expires_at:secureLease.claims.subscription_exp?new Date(secureLease.claims.subscription_exp*1000).toISOString():null,can_write:true,server_time:new Date(secureLease.claims.iat*1000).toISOString()};entWorkspace=ws;}else{entitlement=null;subscriptionDates=null;entWorkspace=null;}if(transportError&&!offlineMode)lastError=offlinePrepError||'این دستگاه مجوز معتبر آفلاین ندارد یا تاریخ آن گذشته است. برای آماده‌سازی دوباره ابتدا انترنت وصل و اشتراک معتبر باشد.';if(!transportError){onlineDenied=true;offlineMode=false;}}finally{checking=false;paint()}}
window.zaviOfflineVerify=verify; // read-only verification and lease renewal using server checks
async function hydrate(){const ws=info().workspace;if(ws!==entWorkspace){entitlement=null;subscriptionDates=null;entWorkspace=null;onlineDenied=false;offlinePrepError='';lastPrepWorkspace='';networkUnavailable=navigator.onLine===false;offlineMode=await restoreSecureLease();if(offlineMode){subscriptionDates=cachedDates(ws);entitlement={plan:secureLease.claims.plan,status:'active',expires_at:secureLease.claims.subscription_exp?new Date(secureLease.claims.subscription_exp*1000).toISOString():null,can_write:true,server_time:new Date(secureLease.claims.iat*1000).toISOString()};entWorkspace=ws;}lastCheck=0}paint();clearTimeout(timer);timer=setTimeout(()=>verify(false),navigator.onLine===false?2500:300)}
window.zaviCloudAfterRender=function(){baseAfterRender();hydrate()};
window.zaviCloudAfterSave= function(next){if(!allowed()){console.warn('Unexpected local save without a verified entitlement.');return}baseAfterSave(next)};
window.zaviCloudPanel=function(){return baseCloudPanel()};
function subscriptionView(){
 const status=uiClass(),e=entitlement||{},p=e.plan||'none',active=e.status==='active';
 const planName=p==='lifetime'?'مادام‌العمر':p==='semiannual'?'شش‌ماهه':p==='annual'?'سالانه':p==='trial'?'آزمایشی ۷روزه':'هنوز ثبت نشده';
 const days=active&&e.expires_at?Math.max(0,timeDelta(e.server_time,e.expires_at)):0;
 const start=subscriptionDates?.started_at||null;
 const renewal=subscriptionDates?.last_renewed_at||null;
 const duration=p==='trial'?7:p==='semiannual'?180:p==='annual'?365:0;
 const used=duration?Math.min(100,Math.max(0,Math.round((duration-days)/duration*100))):0;
 const stateText=checking?'در حال بررسی':status==='active'?'فعال':status==='warning'?'نزدیک پایان':status==='blocked'?'غیرفعال / تعلیق':status==='error'?'نیاز به اتصال':'در حال بررسی';
 return `<div id="zaviSubscriptionHub" class="zsh" dir="rtl">
 <div class="zsh-hero"><div class="zsh-hero-top"><div><span class="zsh-eyebrow">ZAVI ONE • MEMBERSHIP</span><h2>اشتراک من</h2><p>مدیریت اعتبار، تمدید و دستگاه اصلی در یک مکان</p></div><div class="zsh-emblem">✦</div></div><div class="zsh-state"><span class="zsh-dot"></span>${escapes(stateText)} ${offlineMode?'· حالت آفلاین':''}</div></div>
 <section class="zsh-card z46-offline-card" data-zavi-auto-offline-card data-state="working" aria-label="دسترسی بدون اینترنت">
   <div class="zsh-section-title"><span class="zsh-icon" aria-hidden="true">◈</span><div><h3>حسابداری آفلاین</h3><p>فعال‌سازی و تمدید مجوز به‌صورت خودکار</p></div></div>
   <div class="z46-offline-indicator" role="status" aria-live="polite"><span class="z46-indicator-dot" aria-hidden="true"></span><strong data-zavi-auto-offline-status>در حال بررسی…</strong></div>
   <div class="z46-shell-actions" data-zavi-offline-shell-actions>
     <button type="button" class="zsh-btn zsh-btn-light" data-zavi-shell-prepare>📥 دریافت و آماده‌سازی فایل‌های آفلاین</button>
     <span class="z46-shell-status" data-zavi-shell-state role="status" aria-live="polite">فایل‌های برنامه در حال بررسی است…</span>
   </div>
   <div class="z46-offline-recovery" data-zavi-offline-recovery hidden>
     <p class="z46-recovery-message" data-zavi-auto-offline-help></p>
     <div class="zsh-actions">
       <button type="button" class="zsh-btn zsh-btn-primary" data-zavi-auto-retry>تلاش دوباره</button>
       <button type="button" class="zsh-btn zsh-btn-light" id="zaviDeviceReplace" data-zavi-offline-transfer hidden title="انتقال مجاز + دریافت خودکار مجوز آفلاین">انتقال دستگاه اصلی به این دستگاه</button>
       <button type="button" class="zsh-btn zsh-btn-light" data-zavi-health-check>بررسی مشکل</button>
     </div>
     <div data-zavi-health role="status" aria-live="polite" class="z46-technical-result"></div>
     <details class="z46-technical-options"><summary>گزینه‌های رفع مشکل</summary>
       <div class="zsh-actions"><button type="button" class="zsh-btn zsh-btn-light" id="zaviDeviceActivate">دریافت دوباره مجوز</button><button type="button" class="zsh-btn zsh-btn-light" id="zaviDeviceCheck">بررسی دستگاه</button><button type="button" class="zsh-btn zsh-btn-light" id="zaviDeviceCopyId">کاپی شناسه دستگاه</button></div>

     </details>
   </div>
 </section>
 <div class="zsh-grid"><section class="zsh-card zsh-main"><span class="zsh-caption">نوع اشتراک</span><h3>${escapes(planName)}</h3><div class="zsh-days">${p==='lifetime'?'∞':p==='none'?'—':escapes(days)}<small>${p==='lifetime'?'بدون انقضا':'روز باقی‌مانده'}</small></div><div class="zsh-progress"><span style="width:${used}%"></span></div><div class="zsh-progress-note">محاسبه یک‌بار، بر اساس روز تقویمی کابل (همان روز در هر دو تقویم).</div><div class="zsh-progress-note">${duration?'مدت برنامه: '+duration+' روز':'اطلاعات اعتبار از سرور دریافت می‌شود'}</div><div class="zsh-progress-note" aria-live="polite">${info().pending?'⏳ تغییرات محلی در انتظار همگام‌سازی با ابر هستند.':offlineMode?'📴 بدون اینترنت: ذخیره محلی فعال است، ارسال ابری بعداً انجام می‌شود.':'☁️ پس از وصل‌شدن اینترنت، وضعیت تغییرات ابری بررسی می‌شود.'}</div><div class="zsh-progress-note" role="status">${offlineAllowed()?'✅ آفلاین فعال است':active&&p!=='none'?'مجوز آفلاین در حال آماده‌سازی است.':'اشتراک معتبر نیاز است.'}</div></section>
 <section class="zsh-card"><span class="zsh-caption">تاریخ‌ها و وضعیت</span><div class="zsh-row"><span>شروع اشتراک</span><strong>${dualDate(start)}</strong></div><div class="zsh-row"><span>آخرین تمدید / پرداخت</span><strong>${renewal?dualDate(renewal):'—'}</strong></div><div class="zsh-row"><span>پایان اشتراک</span><strong>${p==='lifetime'?'بدون انقضا':dualDate(e.expires_at)}</strong></div><div class="zsh-row"><span>وضعیت</span><strong>${escapes(stateText)}</strong></div><div class="zsh-note">${message()} ${!active?word('backup'):''}</div></section></div>
 <div class="zsh-grid"><section class="zsh-card"><div class="zsh-section-title"><span class="zsh-icon">↻</span><div><h3>تمدید و بررسی اشتراک</h3><p>اعتبار اشتراک از سرور مرکزی بررسی می‌شود.</p></div></div><p class="zsh-hint">نوع و مدت اشتراک فقط پس از ثبت و تأیید پرداخت توسط مدیریت تعیین می‌شود.</p><div class="zsh-actions"><button id="zaviAnnualRefresh" class="zsh-btn zsh-btn-primary" type="button">↻ بررسی دوباره اشتراک</button><a class="zsh-btn zsh-btn-light" href="${renewalLink()}" target="_blank" rel="noopener noreferrer">✆ تماس برای تمدید</a></div></section>
 <section class="zsh-card z46-security-note"><div class="zsh-section-title"><span class="zsh-icon">✓</span><div><h3>دسترسی امن</h3><p>برنامه دستگاه و مجوز آفلاین را خودکار مدیریت می‌کند. انتقال از دستگاه دیگری فقط با تأیید مالک انجام می‌شود.</p></div></div></section></div>
 </div>`;
}
window.zaviSubscriptionView=subscriptionView;
document.addEventListener('click',e=>{let t=e.target.closest('#zaviAnnualRefresh,#zaviAnnualContact');if(!t)return;e.preventDefault();if(t.id==='zaviAnnualRefresh')verify(true);else window.open(renewalLink(),'_blank','noopener,noreferrer');});
window.zaviOfflineStatus=()=>({tenant_bound:!!window.zaviTenantIsBound?.(),workspace:!!info().workspace,offline_mode:offlineMode,has_verified_lease:!!secureLease,valid_now:offlineAllowed(),minutes_left:offlineAllowed()?Math.max(0,Math.ceil((secureLease.claims.exp*1000-Date.now())/60000)):0,preparation_error:offlinePrepError,block_reason:allowed()?'':blockedReason()});
window.addEventListener('zavi-offline-lease-ready',async e=>{if((e?.detail?.workspace_id||e?.detail?.workspace)!==info().workspace)return;secureLease=await window.zaviSecureOfflineLicense.cached(info().workspace);offlinePrepError='';lastError='';lastPrepAttempt=Date.now();paint();});
// Periodic checks, including after owner renews the license in another device.
setInterval(()=>{if(document.visibilityState==='visible'){paint();if(offlineMode&&!offlineAllowed()){offlineMode=false;entitlement=null;lastError='Offline lease expired';paint()}if(navigator.onLine)verify(false)}},60000);
// Refresh the day number after Afghanistan midnight, including on idle/open tabs.
let zaviLastKabulDay=zaviKabulCivilDay(Date.now());
function zaviRefreshDailyCounter(){
 const current=zaviKabulCivilDay(Date.now());
 if(current!==zaviLastKabulDay){
  zaviLastKabulDay=current;
  if(document.getElementById('zaviSubscriptionHub'))paint();
 }
}
setInterval(zaviRefreshDailyCounter,45000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){zaviRefreshDailyCounter();if(navigator.onLine)verify(true)}});
window.addEventListener('offline',async()=>{networkUnavailable=true;offlineMode=!onlineDenied&&await restoreSecureLease();if(offlineMode){const ws=info().workspace;subscriptionDates=cachedDates(ws);entitlement={plan:secureLease.claims.plan,status:'active',expires_at:secureLease.claims.subscription_exp?new Date(secureLease.claims.subscription_exp*1000).toISOString():null,can_write:true,server_time:new Date(secureLease.claims.iat*1000).toISOString()};entWorkspace=ws;lastError='';}else{lastError='برای این دستگاه مجوز معتبر آفلاین موجود نیست؛ هنگام اتصال به اینترنت، دستگاه را آماده‌سازی کنید.';}paint()});
window.addEventListener('online',()=>{networkUnavailable=false;verify(true)});
// Render guard and no write until verified. Local-only mode is deliberately read-only.
window.addEventListener('load',()=>setTimeout(hydrate,1000));
})();

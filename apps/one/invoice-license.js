/* ZAVI ONE V38: invoice write gate for paid online + server-signed offline use.
 * Separate invoice tab shares account-scoped cache; no free local permission.
 */
(()=>{'use strict';
const params=new URLSearchParams(location.search),archived=Boolean(params.get('id'));
const PUBLIC_KEY={"kty":"EC","crv":"P-256","x":"zsbLX8Ww0-G1BRrTuX7MauNT4oqklU6DcmrCayblg0o","y":"EQYGiqUW2-d-5Rb1nRs6UHQIG2T53o2m0wvmRTuOSto"};
const notice=document.createElement('section');notice.id='zaviInvoiceLicense';notice.setAttribute('role','status');
notice.style.cssText='max-width:148mm;margin:8px auto 15px;border:1px solid #f1d6a2;background:#fffae9;padding:13px;border-radius:11px;font:13px/2 Tahoma;text-align:center;color:#70521a';
notice.textContent='در حال بررسی اعتبار اشتراک...';document.body.insertBefore(notice,document.querySelector('.paper'));
let canWrite=false, mode='none',expiresAt=0,busy=false,seq=0,checkedUser='',checkedWorkspace='',keyPromise=null;
function get(store,k){try{return JSON.parse(store.getItem(k)||'null')}catch{return null}}
function access(){const session=get(localStorage,'z20_auth_session_persistent_v23_1')||get(sessionStorage,'z20_auth_session');const ws=get(localStorage,'z20_workspace_id');const uid=session?.user?.id||'';let metadata=get(localStorage,'z20_workspace_offline_metadata_v31_'+ws);return {session,ws,uid,metadata}}
function ownerBound(a){return a.uid&&a.ws&&a.metadata?.id===a.ws&&a.metadata?.owner_uid===a.uid&&a.metadata?.user_uid===a.uid}
function display(ok,msg,kind='none',exp=0){canWrite=ok;mode=kind;expiresAt=exp;
 if(ok){checkedUser=access().uid;checkedWorkspace=access().ws;}else{checkedUser='';checkedWorkspace=''}
 notice.style.background=ok?'#e8f9f4':'#fff5e9';notice.style.borderColor=ok?'#bee9dd':'#f1d6a2';notice.textContent=msg;
 document.querySelectorAll('.paper input:not([readonly]),.paper textarea').forEach(el=>{el.disabled=!ok});
 const b=document.querySelector('.tools button:nth-child(2)');if(b)b.disabled=!ok;
}
function allowed(){const a=access();return !!(canWrite&&checkedUser===a.uid&&checkedWorkspace===a.ws&&(!expiresAt||Date.now()<expiresAt)&& (mode!=='offline'||ownerBound(a)));}
window.zaviInvoiceCanWrite=allowed;
function protect(){if(allowed())return true;display(false,'🔒 مجوز این فاکتور پایان یافته یا برای حساب دیگری است؛ ابتدا به صفحه اصلی ZAVI ONE بروید و اعتبار فروشگاه را بررسی کنید.');return false;}
const oldSave=window.saveForm;
if(typeof oldSave==='function')window.saveForm=function(...args){if(!protect()){alert('برای ذخیره فاکتور جدید، مجوز معتبر آنلاین یا آفلاین ضروری است.');return}return oldSave.apply(this,args)};
const oldPdf=window.downloadInvoicePdf;
if(typeof oldPdf==='function')window.downloadInvoicePdf=function(...args){if(!archived&&!protect()){alert('برای ساخت فاکتور جدید، اشتراک معتبر لازم است.');return}return oldPdf.apply(this,args)};
const oldPrint=window.print.bind(window);
window.print=function(...args){if(!archived&&!protect()){alert('برای چاپ فاکتور جدید، اشتراک معتبر لازم است.');return}return oldPrint(...args)};
const b64bytes=x=>{let s=x.replace(/-/g,'+').replace(/_/g,'/');s+='='.repeat((4-s.length%4)%4);return Uint8Array.from(atob(s),c=>c.charCodeAt(0))};
const parse=x=>JSON.parse(new TextDecoder().decode(b64bytes(x)));
async function cachedLease(a){
 if(!ownerBound(a))return null;
 const did=localStorage.getItem('zavi_v26_primary_device_uuid')||'';if(!did)return null;
 const tok=localStorage.getItem('zavi_v38_signed_lease_'+a.uid+'_'+a.ws)||localStorage.getItem('zavi_v267_signed_lease_'+a.ws);
 if(!tok)return null;
 try{
  const arr=tok.split('.');if(arr.length!==3||parse(arr[0]).alg!=='ES256')return null;
  keyPromise ||= crypto.subtle.importKey('jwk',PUBLIC_KEY,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  const authentic=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},await keyPromise,b64bytes(arr[2]),new TextEncoder().encode(arr[0]+'.'+arr[1]));
  if(!authentic)return null;
  const c=parse(arr[1]),now=Date.now();
  if(c.iss!=='zavi-one-lease-v1'||c.aud!=='zavi-one-client'||c.sub!==a.uid||c.workspace_id!==a.ws||c.device_id!==did||c.can_write!==true||c.status!=='active'||!['annual','semiannual','lifetime'].includes(c.plan))return null;
  if(!Number.isFinite(c.iat)||!Number.isFinite(c.exp)||c.exp<=c.iat||c.exp-c.iat>366*86400||now<(c.iat-60)*1000||now>=c.exp*1000)return null;
  if(c.plan!=='lifetime'&&(!Number.isFinite(c.subscription_exp)||c.exp>c.subscription_exp))return null;
  return c;
 }catch{return null}
}
function cfg(){return window.ZAVI_CLOUD_DEFAULTS?.url?window.ZAVI_CLOUD_DEFAULTS:get(localStorage,'z20_cloud_settings')||{}}
async function renew(config,s){if(!s?.refresh_token)throw Error('نشست ورود پایان یافته است؛ دوباره وارد شوید.');const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),11000);try{
 const res=await fetch(config.url.replace(/\/$/,'')+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token}),signal:ctl.signal});const j=await res.json().catch(()=>({}));if(!res.ok||!j.access_token)throw Error('ورود ابری پایان یافته است. از صفحه اصلی دوباره وارد شوید.');const next={...s,...j,expires_at:j.expires_at||Math.floor(Date.now()/1000)+Number(j.expires_in||3600)};localStorage.setItem('z20_auth_session_persistent_v23_1',JSON.stringify(next));sessionStorage.setItem('z20_auth_session',JSON.stringify(next));return next;
 }finally{clearTimeout(tm)}}
function isNetworkFailure(e){return navigator.onLine===false||e?.name==='AbortError'||e instanceof TypeError||/Failed to fetch|NetworkError|Load failed|ERR_INTERNET_DISCONNECTED|network/i.test(e?.message||'')}
async function applyOffline(a){const lease=await cachedLease(a);if(!lease){display(false,'🔒 مجوز معتبر آفلاین برای این دستگاه موجود نیست. در صفحه اصلی، آنلاین شوید و در بخش «اشتراک من» دستگاه را آماده کنید.');return false;}
 display(true,'📴 فاکتور آفلاین فعال است؛ در حافظه اختصاصی همین فروشگاه ذخیره می‌شود و پس از وصل‌شدن اینترنت قابل همگام‌سازی است.','offline',lease.exp*1000);return true;}
async function verify(){if(busy)return;busy=true;const call=++seq,initial=access();display(false,'در حال بررسی اشتراک فروشگاه...');
 try{
  if(!initial.ws||!initial.uid||!initial.session?.access_token)throw Error('ابتدا به حساب ابری وارد شوید و فروشگاه را انتخاب کنید.');
  if(navigator.onLine===false){await applyOffline(initial);return}
  const settings=cfg();if(!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(settings.url||'')||!settings.key)throw Error('تنظیمات سرور ابری موجود نیست.');
  let session=initial.session;
  if(session.expires_at&&Date.now()/1000>Number(session.expires_at)-90)session=await renew(settings,session);
  const request=async()=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),11500);try{return await fetch(settings.url.replace(/\/$/,'')+'/rest/v1/rpc/zavi_my_entitlement',{method:'POST',headers:{apikey:settings.key,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({p_workspace_id:initial.ws}),cache:'no-store',signal:c.signal})}finally{clearTimeout(t)}};
  let res=await request();if(res.status===401){session=await renew(settings,session);res=await request()}
  const data=await res.json().catch(()=>null);if(!res.ok)throw Object.assign(new Error(data?.message||'HTTP '+res.status),{code:res.status});
  const row=Array.isArray(data)?data[0]:data;
  if(!row)throw Error('معلومات اشتراک موجود نیست.');
  if(call!==seq||access().ws!==initial.ws||access().uid!==initial.uid)return;
  const exp=Date.parse(row.expires_at||'');const valid=row.status==='active'&&['annual','semiannual'].includes(row.plan)&&Number.isFinite(exp)&&exp>Date.now();
  if(valid&&row.can_write===true){display(true,'✅ اشتراک آنلاین معتبر است؛ فاکتور فروش فعال است.','online',exp);return;}
  display(false,'🔒 اشتراک این فروشگاه تمام شده، تعلیق شده یا مالک حساب اجازه ثبت ندارد.');
 }catch(e){if(call!==seq)return;
  if(isNetworkFailure(e))await applyOffline(initial);
  else display(false,'🔒 تأیید اشتراک ممکن نشد: '+(e?.message||e));
 }finally{busy=false}}
verify();
window.addEventListener('offline',()=>verify());window.addEventListener('online',()=>verify());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')verify()});
window.addEventListener('storage',e=>{if(['z20_auth_session_persistent_v23_1','z20_workspace_id','z20_cloud_settings','zavi_v26_primary_device_uuid'].includes(e.key))verify()});
setInterval(()=>{if(mode==='offline'||!allowed()){
 if(!allowed())display(false,'🔒 زمان مجوز به پایان رسیده است؛ به صفحه اصلی بروید و اشتراک را بررسی کنید.');}
 else if(navigator.onLine)verify();},60000);
const retry=document.createElement('button');retry.type='button';retry.textContent='↻ بررسی دوباره اشتراک';retry.style.cssText='display:block;margin:8px auto 0;border:0;background:#096f9a;color:white;padding:6px 14px;border-radius:7px;cursor:pointer';retry.onclick=verify;notice.after(retry);
})();

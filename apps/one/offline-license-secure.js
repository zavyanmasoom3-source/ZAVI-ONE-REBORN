/* ZAVI ONE V38: owner/workspace/device-bound ES256 lease; offline writes fail closed.
 * Public key only. Private signing key always stays in سرور مرکزی Edge Functions.
 */
(()=>{'use strict';
const PUBLIC_KEY={"kty":"EC","crv":"P-256","x":"zsbLX8Ww0-G1BRrTuX7MauNT4oqklU6DcmrCayblg0o","y":"EQYGiqUW2-d-5Rb1nRs6UHQIG2T53o2m0wvmRTuOSto"};
const OLD_PREFIX='zavi_v267_signed_lease_';
const PREFIX='zavi_v38_signed_lease_';
let publicKeyPromise;
const b64urlToBytes=s=>{let x=s.replace(/-/g,'+').replace(/_/g,'/');x+='='.repeat((4-x.length%4)%4);return Uint8Array.from(atob(x),c=>c.charCodeAt(0))};
const decode=s=>JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
const authUid=()=>window.zaviCloudGetAuthSession?.()?.user?.id||'';
const key=(ws,uid)=>PREFIX+uid+'_'+ws;
const workspace=()=>window.zaviCloudRestoreInfo?.()?.workspace||'';
const device=()=>window.zaviDeviceActivation?.getDeviceId?.()||'';
async function verify(token,ws,d){
 if(typeof token!=='string'||token.length>8192)throw Error('INVALID_TOKEN');
 const parts=token.split('.');if(parts.length!==3)throw Error('INVALID_TOKEN_STRUCTURE');
 const hdr=decode(parts[0]);if(hdr.alg!=='ES256'||hdr.typ!=='JWT')throw Error('INVALID_ALGORITHM');
 publicKeyPromise ||= crypto.subtle.importKey('jwk',PUBLIC_KEY,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 const ok=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},await publicKeyPromise,b64urlToBytes(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
 if(!ok)throw Error('INVALID_SIGNATURE');
 const p=decode(parts[1]);const now=Date.now(),uid=authUid();
 if(!uid||p.sub!==uid||p.iss!=='zavi-one-lease-v1'||p.aud!=='zavi-one-client'||p.workspace_id!==ws||p.device_id!==d||p.can_write!==true||p.status!=='active'||!['annual','semiannual','trial','lifetime'].includes(p.plan))throw Error('WRONG_USER_WORKSPACE_OR_DEVICE');
 if(!Number.isFinite(p.iat)||!Number.isFinite(p.exp)||p.exp<=p.iat||p.exp-p.iat>366*86400||now>=p.exp*1000||now<(p.iat-60)*1000)throw Error('LEASE_EXPIRED_OR_DEVICE_TIME_INVALID');
 if(['annual','semiannual','trial'].includes(p.plan)&&(!Number.isFinite(p.subscription_exp)||p.exp>p.subscription_exp))throw Error('SUBSCRIPTION_EXPIRY_INVALID');
 return p;
}
let lastCacheError='';
async function cached(ws=workspace()){
 const uid=authUid(),d=device();if(!uid||!ws||!d)return null;
 let tokens=[];try{tokens=[localStorage.getItem(key(ws,uid)),localStorage.getItem(OLD_PREFIX+ws)].filter(Boolean)}catch{return null}
 for(const token of tokens){try{const claims=await verify(token,ws,d);if(token!==tokens[0])localStorage.setItem(key(ws,uid),token);lastCacheError='';return {claims,token}}catch(e){lastCacheError=e?.message||'INVALID_CACHED_LICENSE'}}
 return null;
}
function describe(code){const m={
 'Subscription inactive':'اشتراک این فروشگاه فعال نیست یا مدت آن تمام شده است.',
 'Subscription expired':'تاریخ ختم اشتراک گذشته است؛ برای ادامه باید مدیریت تمدید کند.',
 'Device not authorized':'دستگاه فعلی در سرور به‌عنوان دستگاه اصلی ثبت نشده است؛ اگر دستگاه دیگری ثبت است از مدیریت درخواست تعویض نمایید.',
 'Device check failed':'سرور نتوانست دستگاه را بررسی کند؛ با حساب مالک وارد شوید و دوباره بررسی کنید.',
 'Offline access not enabled':'سیاست دسترسی آفلاین برای این فروشگاه فعال نیست؛ با مدیریت تماس بگیرید.',
 'Offline policy check failed':'تنظیمات آفلاین سرور در دسترس نیست؛ دوباره تلاش کنید.',
 'Subscription check failed':'بررسی اشتراک توسط سرور انجام نشد؛ وضعیت حساب را در «اشتراک من» بررسی کنید.',
 'Authentication required':'ابتدا با اینترنت وارد حساب ابری شوید.',
 'No remaining offline validity':'اعتبار اشتراک تمام شده است؛ مجوز جدید صادر نمی‌شود.'};return m[code]||'';}
async function request(ws,session,cfg){
 const d=device();if(!ws||!d||!authUid())throw Error('دستگاه یا حساب مالک هنوز انتخاب نشده است.');
 if(!session?.access_token||!cfg?.url||!cfg?.key)throw Error('ابتدا آنلاین وارد حساب ابری شوید.');
 const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),11000);
 let response;
 try{response=await fetch(cfg.url.replace(/\/$/,'')+'/functions/v1/zavi-offline-lease',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token,apikey:cfg.key},body:JSON.stringify({workspace_id:ws,device_id:d}),signal:ctrl.signal})}finally{clearTimeout(timeout)}
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const code=String(data?.error||'HTTP '+response.status);const error=new Error(describe(code)||('سرور مجوز آفلاین را رد کرد: '+code));error.code=code;error.httpStatus=response.status;throw error;}
 const token=data.token||data.license;let claims;try{claims=await verify(token,ws,d)}catch(e){if(e?.message==='INVALID_SIGNATURE')throw Error('امضای مجوز دریافتی با کلید عمومی برنامه مطابقت ندارد. مدیر برند باید تنظیمات امضای سرور را بررسی کند.');if(e?.message==='WRONG_USER_WORKSPACE_OR_DEVICE')throw Error('مجوز برای مالک یا دستگاه فعلی نیست؛ از همان حساب مالک وارد شوید و دستگاه را بررسی کنید.');throw e;}
 localStorage.setItem(key(ws,authUid()),token);
 lastCacheError='';
 return {claims,token};
}
window.zaviSecureOfflineLicense={cached,request,verify,workspace,device,cacheError:()=>lastCacheError};
})();

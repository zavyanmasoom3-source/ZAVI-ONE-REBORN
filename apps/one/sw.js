/* ZAVI ONE V57 V16 — میزبانی آنلاین static PWA / offline shell; v19 localization and contacts.
 * Cache ONLY published, same-origin program assets. No API, auth, payment,
 * signed lease, or customer data is cached by this service worker.
 * Keeping and migrating private local data is the responsibility of the app.
 */
'use strict';
const APK_ORIGIN='https://appassets.androidplatform.net';
const CACHE_NAME='zavi-one-shell-reborn-20261109-r6';
const SHELL_PROTOCOL='zavi-shell-v2';
const CACHE_PREFIX='zavi-one-';
const CORE=[
  "index.html",
  "zavi-compact-workflow-v1.css",
  "zavi-compact-workflow-v1.js",
  "zavi-showcase-v6668.css",
  "zavi-clean-professional-v6667.css",
  "zavi-warehouse-transfers-v1.js",
  "zavi-in-transit-v1.js",
  "zavi-in-transit-v1.css",
  "zavi-whatsapp-v1.js",
  "zavi-three-sizes-v6588.js",
  "zavi-three-sizes-v6588.css",
  "zavi-landscape-v6589.js",
  "zavi-landscape-v6589.css",
  "zavi-mobile-rescue-v6590.js",
  "zavi-mobile-rescue-v6590.css",
  "zavi-store-recovery-v6594.js",
  "zavi-store-recovery-v6594.css",
  "zavi-dual-command-v6605.js",
  "zavi-dual-command-v6605.css",
  "zavi-zxing-offline-v1.js",
  "zavi-warehouses-v1.css",
  "zavi-warehouses-v1.js",
  "zavi-entry-appearance.css",
  "zavi-web-responsive-v1.css",
  "zavi-web-responsive-v1.js",
  "zavi-luxe-v1.css",
  "zavi-luxe-v1.js",
  "zavi-i18n-v6541-verified.js",
  "zavi-i18n-v6540-dictionary.js",
  "zavi-polish-v6539.css",
  "zavi-theme-unified-v6538.css",
  "zavi-scroll-unified-v6537.css",
  "zavi-scroll-recovery-v6537.js",
  "zavi-mobile-scroll-v6536.css",
  "zavi-mobile-recovery-v6535.css",
  "zavi-responsive-design-v6533.css",
  "zavi-responsive-design-v6533.js",
  "zavi-v6531-final-design.css",
  "zavi-trade-plus-v6530.js",
  "zavi-industry-forms-v6529.js",
  "zavi-industry-forms-v6529.css",
  "zavi-creditors-simple-v6528.js",
  "zavi-creditors-simple-v6528.css",
  "zavi-invoice-studio-v6527.js",
  "zavi-invoice-studio-v6527.css",
  "zavi-invoice-manual-v6527.js",
  "zavi-invoice-manual-v6527.css",
  "zavi-industry-engine-v6526.js",
  "zavi-industry-v6526.css",
  "zavi-industry-kit-v6525.js",
  "zavi-industry-workspace-v6525.css",
  "zavi-industry-setup-v6525.js",
  "zavi-industry-setup-v6525.css",
  "zavi-smart-care-v6524.js",
  "zavi-smart-care-ui-v6524.js",
  "zavi-smart-care-v6524.css",
  "zavi-v6523-emergency.css",
  "zavi-v6518-fixes.css",
  "zavi-i18n-v6518-extra.js",
  "zavi-i18n-v6517-extra.js",
  "zavi-i18n-v6516-extra.js",
  "zavi-v6515-personal.css",
  "zavi-v6515-personal.js",
  "zavi-v6514-mobile-scroll.css",
  "zavi-v6514-mobile-scroll.js",
  "zavi-v6513-release.css",
  "zavi-v6513-release.js",
  "zavi-v659-polish.css",
  "zavi-v659-mobile.js",
  "zavi-devices-v652.js",
  "zavi-devices-v652.css",
  "zavi-cloud-handoff-v651.js",
  "zavi-v650-productivity.css",
  "zavi-dashboard-performance-v649.css",
  "zavi-staff-v648.css",
  "zavi-staff-v648-core.js",
  "zavi-staff-v648.js",
  "zavi-paging-v647.js",
  "zavi-paging-v647.css",
  "zavi-backup-integrity-v647.js",
  "zavi-experience-v645.css",
  "zavi-business-experience-v645.css",
  "zavi-display-digits-v645.js",
  "zavi-business-plus-v644.js",
  "zavi-business-plus-v644.css",
  "training.html",
  "zavi-ops-center-v643.js",
  "zavi-premium-comfort-v643.css",
  "zavi-smart-business-v642.js",
  "zavi-smart-business-v642.css",
  "zavi-barcode-v641.js",
  "zavi-barcode-polish-v641.css",
  "zavi-ui-finish-v640.css",
  "zavi-industry-focus-v639.js",
  "zavi-pin-motion-v639.js",
  "zavi-motion-industry-v639.css",
  "zavi-polish-v638.css",
  "zavi-business-polish-v638.css",
  "zavi-studio-v637.css",
  "zavi-ai-v637.css",
  "zavi-ai-v637.js",
  "zavi-integrity-v636.js",
  "zavi-integrity-v636.css",
  "zavi-decimal-v636.js",
  "zavi-camera-scan-v635.js",
  "zavi-camera-scan-v635.css",
  "zavi-v63-team-operations.css",
  "zavi-v63-team-operations.js",
  "zavi-manual-waste-v41.css",
  "zavi-layout-contrast-v40.css",
  "zavi-premium-v37.css",
  "zavi-dashboard-actions-v37.js",
  "zavi-signature-v35.css",
  "zavi-locale-signature-v35.js",
  "zavi-phonebook-v19.css",
  "zavi-phonebook-v19.js",
  "zavi-legacy-locale-v19.js",
  "zavi-locales-v19.js",
  "zavi-dark-executive-v18.css",
  "zavi-auto-update-v18.js",
  "zavi-finance-stock-v18.js",
  "zavi-invoice-v18.css",
  "zavi-invoice-light-v34.css",
  "invoice-i18n-v18.js",
  "invoice-qr-v18.js",
  "cloud-config.js",
  "cloud.js",
  "zavi-viewer-management-v60.css",
  "zavi-iphone-dashboard-layout-v59.css",
  "zavi-mobile-chart-and-viewer-v58.css",
  "zavi-mobile-chart-and-viewer-v58.js",
  "zavi-i18n-v22.js",
  "zavi-theme-v29.css",
  "zavi-final-light-v30.css",
  "zavi-light-production-v31.css",
  "zavi-light-hotfix-v32.css",
  "zavi-light-finish-v33.css",
  "zavi-light-studio-v34.css",
  "zavi-localization-finish-v33.js",
  "zavi-residual-i18n-v32.js",
  "zavi-theme-v29.js",
  "zavi-i18n-v27.js",
  "en.json",
  "fa.json",
  "ps.json",
  "zavi-i18n-v22.css",
  "zavi-calendar-chart-v26.css",
  "zavi-dark-executive-v23.css",
  "zavi-dual-calendar-v22.js",
  "annual-license.js",
  "device-activation.js",
  "offline-license-secure.js",
  "offline-app-shell.js",
  "offline-auto-prepare.js",
  "offline-backup.js",
  "receipt-ui.js",
  "customer-portal.js",
  "pin-recovery.js",
  "invoice-license.js",
  "offline-health.js",
  "offline-ui-v46.js",
  "v45-business.js",
  "v47-business.js",
  "subscription-hub.css",
  "neon-theme-v47.css",
  "neon-invoice-v47.css",
  "neon-hero.svg",
  "zavi-android-v5-fix.css",
  "zavi-android-v6-fix.css",
  "invoice.html",
  "v25-business.html",
  "offline-check.html",
  "offline-check.js",
  "zavi-release-polish-v19.css",
  "zavi-display-settings-v6545.js",
  "zavi-biometric-ui-v6546.js",
  "zavi-mobile-ux-safe-v6547.js",
  "zavi-signup-whatsapp-once-v6548.js",
  "zavi-v6549-ergonomics.js",
  "zavi-reference-store-v6557.css",
  "zavi-final-settings-common-v1.css",
  "zavi-cinematic-v2.css",
  "zavi-final-reference-store.css",
  "zavi-dashboard-polish-v6562.css",
  "zavi-mobile-cleanup-v6563.css",
  "zavi-v6564-layout.css",
  "zavi-v6565-sales-settings.css",
  "zavi-v6567-sections-readable.css",
  "zavi-v6570-store-offline.css",
  "zavi-v6571-store-settings-devices.css",
  "zavi-v6572-store-trial-and-assistant.css",
  "zavi-unified20.css",
  "zavi-store-v6576-settings-profile.css",
  "zavi-store-v6577-compact-sales-barcode.css",
  "zavi-store-v6578-allfix.css",
  "zavi-store-v6582-trial7-simple.css",
  "zavi-ui-foundation-v2.css",
  "zavi-preferences-v2.css",
  "zavi-preferences-v2.js",
  "zavi-pdf-screen-map-v6740.js",
  "zavi-pdf-final-v6760.css",
  "zavi-reborn-design-v1.css",
  "zavi-reference-store-v6557.js",
  "zavi-final-settings-store-v6559.js",
  "zavi-cinematic-v2.js",
  "zavi-final-reference-store.js",
  "zavi-dashboard-polish-v6562.js",
  "zavi-mobile-cleanup-v6563.js",
  "zavi-v6564-layout.js",
  "zavi-v6565-sales-settings.js",
  "zavi-v6567-sections-readable.js",
  "zavi-v6570-store-offline.js",
  "zavi-v6572-store-trial7.js",
  "zavi-v6572-offline-accounting-assistant.js",
  "zavi-unified20.js",
  "zavi-store-v6576-settings-profile.js",
  "zavi-store-v6578-allfix.js",
  "zavi-store-v6579-auto-signed-offline.js",
  "zavi-store-v6582-trial7-simple.js",
  "zavi-mobile-photo-qa-v6669.css",
  "zavi-unified-compact-v1.css",
  "zavi-barcode-label-v6700.css",
  "zavi-barcode-label-v6700.js",
  "zavi-message-center-v6720.css",
  "zavi-message-center-v6720.js",
  "zavi-safe-transfer-v1.css",
  "zavi-safe-transfer-v1.js",
  "../../packages/shared/database/supabase-config.js",
  "../../packages/shared/security/access-contract.js",
  "../../packages/shared/i18n/language-core.js",
  "../../packages/shared/ui/design-system-v1.css",
  "../../packages/shared/ui/design-system-v1.js",
  "../../packages/shared/diagnostics/build-proof-v1.js"
];
const OPTIONAL=["manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "install.html", "invoice-a5.html", "404.html", "health.html", "connectivity-check.html", "zavi-one-original-logo.png"];
const SCOPE=new URL(self.registration.scope);
const INDEX=new URL('./index.html',SCOPE).href;
const appUrl=name=>new URL('./'+name,SCOPE).href;
const toKey=url=>new URL(new URL(url).pathname,SCOPE.origin).href;
const ROOT=SCOPE.href;
const STATIC=new Set([...CORE,...OPTIONAL].map(appUrl));
const HTML=new Set([...CORE,...OPTIONAL].filter(x=>x.endsWith('.html')).map(appUrl));
const isScope=url=>url.origin===SCOPE.origin&&(url.pathname.startsWith(SCOPE.pathname)||STATIC.has(url.href));
function valid(response,url){
 if(!response||!response.ok||response.type==='opaque'||response.type==='opaqueredirect')return false;
 const type=(response.headers.get('content-type')||'').toLowerCase();
 const path=new URL(url).pathname;
 // میزبانی آنلاین (or a proxy) may respond 200 index.html for missing resources.
 if(/\.(?:js|css|json|webmanifest|png|svg)$/i.test(path)&&/text\/html|application\/xhtml/i.test(type))return false;
 if(/\.js$/i.test(path)&&type&&!/javascript|ecmascript/i.test(type))return false;
 if(/\.css$/i.test(path)&&type&&!/text\/css/i.test(type))return false;
 if(/\.png$/i.test(path)&&type&&!/image\/png/i.test(type))return false;
 if(/\.svg$/i.test(path)&&type&&!/image\/svg\+xml/i.test(type))return false;
 if(HTML.has(url)&&type&&!/html/i.test(type))return false;
 return true;
}
async function status(){
 const c=await caches.open(CACHE_NAME),missing=[];
 for(const file of CORE){const url=appUrl(file);if(!valid(await c.match(url),url))missing.push(file)}
 return {ready:missing.length===0,cached:CORE.length-missing.length,required:CORE.length,
         missing,version:CACHE_NAME,protocol:SHELL_PROTOCOL,scope:SCOPE.href,app_cached:valid(await c.match(INDEX),INDEX)};
}
async function save(name,cache){
 const url=appUrl(name);
 if(valid(await cache.match(url),url))return true;
 for(let attempt=0;attempt<2;attempt++){
  const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),attempt?14000:11000);
  try{
   const response=await fetch(new Request(url,{cache:'reload',credentials:'same-origin',signal:ctrl.signal}));
   if(!valid(response,url))return false;
   await cache.put(url,response.clone());return true;
  }catch(_){/* network or quota; the prior active release stays installed */}
  finally{clearTimeout(timeout)}
 }
 return false;
}
async function batch(files,cache,count){
 let i=0;
 await Promise.all(Array.from({length:Math.min(count,files.length)},async()=>{
  while(i<files.length){const path=files[i++];await save(path,cache)}
 }));
}
let pending=null;
function prepare(){
 if(pending)return pending;
 pending=(async()=>{await batch(CORE,await caches.open(CACHE_NAME),4);return status()})();
 return pending.finally(()=>{pending=null});
}
function unavailable(){return new Response('<!doctype html><html lang="fa-AF" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZAVI ONE — آفلاین</title><body style="font:16px/2 Tahoma,system-ui;background:#f0f7fc;color:#143753;padding:25px"><h2>فایل‌های برنامه هنوز آماده نیستند</h2><p>برای استفادهٔ آفلاین ابتدا یک بار با اینترنت صفحهٔ اصلی و بخش بررسی آفلاین را باز کنید.</p><p>اطلاعات ذخیره‌شدهٔ دستگاه را پاک نکنید.</p></body></html>',
 {status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})}
async function cached(url){const c=await caches.open(CACHE_NAME),r=await c.match(url);return valid(r,url)?r:null}
async function get(req,event){
 const requestUrl=new URL(req.url),nav=req.mode==='navigate'||req.destination==='document';
 const key=toKey(req.url)===ROOT?INDEX:toKey(req.url);
 const known=STATIC.has(key)||key===INDEX;
 const home=key===INDEX; // Includes offline home route in cache-first navigation
 const hit=known?await cached(key):null;
 // Static JS/CSS is fast and coherent: only this release cache is served.
 // Prefer the APK's current packaged asset; keep verified offline fallback.
 if(known&&!nav&&hit){
   try {
     const fresh=await fetch(new Request(req,{cache:'no-store'}));
     if(valid(fresh,key)){
       event.waitUntil(caches.open(CACHE_NAME).then(c=>c.put(key,fresh.clone())).catch(()=>{}));
       return fresh;
     }
   }catch(_){return hit}
   return hit;
 }
 // Non-home HTML diagnostics are fast offline if cached.
 // Navigation is network-first so stale میزبانی آنلاین edge-injected badges and old app shells
 // do not remain permanently visible from Service Worker HTML cache.
 // Offline navigation still falls back to the last verified cached HTML.
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),hit?2500:12000);
 try{
  const res=await fetch(req,{signal:controller.signal});
  if(known&&valid(res,key)){
    event.waitUntil(caches.open(CACHE_NAME).then(c=>c.put(key,res.clone())).catch(()=>{}));
    return res;
  }
  if(hit)return hit;
  if(nav&&res.status>=500)return hit||unavailable();
  return res;
 }catch(_){
  if(hit)return hit;
  if(nav&&home){const local=await cached(INDEX);if(local)return local}
  return nav?unavailable():Response.error();
 }finally{clearTimeout(timeout)}
}
self.addEventListener('install',e=>{
 e.waitUntil((async()=>{
  const result=await prepare();
  // Never activate a half-updated shell; old worker continues to serve.
  if(!result.ready)throw Error('Incomplete ZAVI shell: '+result.missing.join(','));
  // Await the safe update signal. New worker stays waiting while an old tab is active.
 })());
});
self.addEventListener('activate',e=>{
 // Old complete shell is retained for rollback; NEVER delete IndexedDB/localStorage.
 e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;
 const u=new URL(r.url);if(!isScope(u))return;
  // Installed APK assets must bypass PWA caches; the Android asset loader owns them.
  if(u.origin===APK_ORIGIN)return;
 const doc=r.mode==='navigate'||r.destination==='document';
 const key=toKey(r.url)===ROOT?INDEX:toKey(r.url);
 if(!doc&&!STATIC.has(key))return;
 e.respondWith(get(r,e));
});
self.addEventListener('message',e=>{
 const data=e.data||{};if(data.type==='ZAVI_RELEASE_READY'){e.waitUntil(self.skipWaiting());return;}
 if(!['ZAVI_SHELL_PREPARE','ZAVI_SHELL_STATUS'].includes(data.type))return;
 e.waitUntil((async()=>{
  let state;
  try{state=data.type==='ZAVI_SHELL_PREPARE'?await prepare():await status()}
  catch(err){state={ready:false,error:String(err),version:CACHE_NAME,missing:CORE}};
  try{e.ports?.[0]?.postMessage(state)}catch(_){}
  // Nonessential images/pages can be cached later; they must not hold up readiness.
  if(state.ready&&data.type==='ZAVI_SHELL_PREPARE')await batch(OPTIONAL,await caches.open(CACHE_NAME),3);
 })());
});

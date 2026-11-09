/* ZAVI SERVICE WORKER ADMIN V53 V18 — Offline-first STATIC shell only.
 * WARNING: Never cache سرور مرکزی/Auth/billing/API results or cache requests
 * outside this site's origin and Service Worker scope. Existing local data,
 * Auth, and signed offline entitlements are untouched by this worker.
 */
'use strict';
const APK_ORIGIN='https://appassets.androidplatform.net';
const CACHE_NAME='zavi-admin-ref-12-design-reset-v4-20261109';;
const CORE=[
  "../../packages/shared/ui/zavi-reference-v3.css",
  "../../packages/shared/ui/zavi-reference-navigation-v3.js",
  "zavi-reference-admin-v3.css",
  "../../packages/shared/ui/zavi-approved-navigation-v2.js",
  "../../packages/shared/ui/zavi-approved-visual-v2.css",
  "zavi-approved-admin-v2.css",
  "index.html",
  "zavi-admin-settings-hub-v1.css",
  "zavi-admin-settings-hub-v1.js",
  "zavi-admin-showcase-v1459.css",
  "zavi-clean-professional-v1458.css",
  "zavi-admin-renewal-v1439.js",
  "zavi-admin-congratulations-v1440.js",
  "zavi-admin-command-v1441.js",
  "zavi-admin-theme-congrats-v1440.css",
  "zavi-three-sizes-v6588.js",
  "zavi-three-sizes-v6588.css",
  "zavi-landscape-v6589.js",
  "zavi-landscape-v6589.css",
  "zavi-mobile-rescue-v6590.js",
  "zavi-mobile-rescue-v6590.css",
  "zavi-admin-ipad-v1438.js",
  "zavi-admin-ipad-v1438.css",
  "zavi-dual-command-v6605.js",
  "zavi-dual-command-v6605.css",
  "zavi-entry-appearance.css",
  "zavi-luxe-safe-v2.css",
  "zavi-luxe-safe-v2.js",
  "zavi-i18n-v6541-verified.js",
  "zavi-i18n-v12-dictionary.js",
  "zavi-v659-admin.css",
  "zavi-admin-experience-v645.css",
  "zavi-display-digits-v645.js",
  "zavi-update-center-v643.js",
  "zavi-admin-comfort-v643.css",
  "zavi-admin-studio-v642.css",
  "zavi-admin-finish-v640.css",
  "zavi-admin-premium-v639.css",
  "zavi-admin-polish-v638.css",
  "zavi-studio-admin-v637.css",
  "zavi-admin-v41-readable.css",
  "zavi-admin-v41-mobile-tables.js",
  "zavi-locale-signature-v35.js",
  "zavi-legacy-locale-v19.js",
  "zavi-locales-v19.js",
  "zavi-auto-update-v18.js",
  "style.css",
  "graphic-v24-1.css",
  "zavi-graphic-refresh.css",
  "zavi-android-v5-fix.css",
  "zavi-android-v6-fix.css",
  "zavi-android-v7-fix.css",
  "zavi-android-v8-login-fix.css",
  "app.js",
  "admin-portal.js",
  "account-control.js",
  "device-admin.js",
  "receipt-ui.js",
  "manifest.webmanifest",
  "zavi-admin-services-v15.js",
  "zavi-i18n-v22.js",
  "zavi-localization-finish-v33.js",
  "zavi-residual-i18n-v32.js",
  "zavi-theme-v29.js",
  "zavi-i18n-v27.js",
  "en.json",
  "fa.json",
  "ps.json",
  "zavi-i18n-v22.css",
  "zavi-dual-calendar-v22.js",
  "zavi-admin-services-v15.css",
  "offline-status.html",
  "zavi-admin-next-v1.css",
  "zavi-admin-theme-v11.css",
  "zavi-admin-v143-a11y.css",
  "zavi-admin-renewal-hotfix-v144.css",
  "zavi-web-responsive-v1.css",
  "zavi-ui-foundation-v2.css",
  "zavi-preferences-v2.css",
  "zavi-preferences-v2.js",
  "zavi-admin-pdf-screen-map-v1465.js",
  "zavi-admin-pdf-final-v1467.css",
  "zavi-admin-next-v1.js",
  "zavi-admin-theme-v11.js",
  "zavi-admin-service-whatsapp-v139.js",
  "zavi-admin-v140-ui-fixes.js",
  "zavi-admin-recovery-v141.js",
  "zavi-web-responsive-v1.js",
  "zavi-admin-trial7-restored.js",
  "zavi-unified-compact-v1.css",
  "../../packages/shared/database/supabase-config.js",
  "../../packages/shared/security/access-contract.js",
  "../../packages/shared/i18n/language-core.js",
  "../../packages/shared/ui/design-system-v1.css",
  "../../packages/shared/ui/design-system-v1.js",
  "../../packages/shared/diagnostics/build-proof-v1.js",
  "icon-192.png"
];
const EXTRA=['zavi-web-responsive-v1.css','zavi-web-responsive-v1.js','zavi-admin-recovery-v141.js','zavi-admin-v140-ui-fixes.js','zavi-admin-theme-v11.css','zavi-admin-theme-v11.js','zavi-admin-next-v1.css','zavi-admin-next-v1.js','z1-admin-official.jpg','icon-192.png'];
const SCOPE=new URL(self.registration.scope);
const ROOT=SCOPE.href;
const INDEX=new URL('./index.html',SCOPE).href;
const absolute=path=>new URL('./'+path,SCOPE).href;
const STATIC=new Set([...CORE,...EXTRA].map(absolute));
const HTML=new Set(["index.html", "offline-status.html"].map(absolute));
function canonical(address) {
  const u=new URL(address);
  return new URL(u.pathname,SCOPE.origin).href;
}
function within(u){return u.origin===SCOPE.origin&&(u.pathname.startsWith(SCOPE.pathname)||STATIC.has(u.href))}
function valid(response,address){
  if(!response||!response.ok||response.type==='opaque'||response.type==='opaqueredirect')return false;
  const t=(response.headers.get('content-type')||'').toLowerCase();
  const path=new URL(address).pathname;
  if(/\.(?:js|css|json|webmanifest|png|svg)$/i.test(path)&&/html|xml/i.test(t)&&!/image\/svg\+xml/i.test(t))return false;
  if(/\.js$/i.test(path)&&t&&!/javascript|ecmascript/i.test(t))return false;
  if(/\.css$/i.test(path)&&t&&!/text\/css/i.test(t))return false;
  if(/\.png$/i.test(path)&&t&&!/image\/png/i.test(t))return false;
  if(HTML.has(address)&&t&&!/html/i.test(t))return false;
  return true;
}
async function status(){
  const cache=await caches.open(CACHE_NAME), missing=[];
  for(const path of CORE){const uri=absolute(path);if(!valid(await cache.match(uri),uri))missing.push(path)}
  return {ready:missing.length===0,missing,required:CORE.length,cached:CORE.length-missing.length,
    version:CACHE_NAME,scope:SCOPE.href,app_cached:!!(await cache.match(INDEX))};
}
async function save(path,cache,attempts=3){
  const uri=absolute(path);
  // NEVER overwrite a good cached release file during an offline visit.
  if(valid(await cache.match(uri),uri))return true;
  for(let i=0;i<attempts;i++){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),i===0?11000:16500);
    try{
      const response=await fetch(new Request(uri,{cache:'reload',credentials:'same-origin',signal:controller.signal}));
      if(!valid(response,uri))return false;
      await cache.put(uri,response.clone());return true;
    }catch(_){/* temporary connection interruption or quota limit */}
    finally{clearTimeout(timeout)}
  }
  return false;
}
async function batch(names,cache,concurrency=4){
  let cursor=0;
  const results=await Promise.all(Array.from({length:Math.min(concurrency,names.length)},async()=>{
    const bad=[];
    while(cursor<names.length){const path=names[cursor++];if(!await save(path,cache))bad.push(path)}
    return bad;
  }));
  return results.flat();
}
let preparing;
function prepare(){
  if(preparing)return preparing;
  preparing=(async()=>{
    const cache=await caches.open(CACHE_NAME);
    await batch(CORE,cache,4);
    // Never delay worker installation for icons/test pages; cache them
    // opportunistically when explicitly preparing while online.
    return status();
  })();
  return preparing.finally(()=>{preparing=null});
}
function offlinePage(){
  // A first-ever visit without internet cannot magically install a web app.
  return new Response('<!doctype html><html lang="fa-AF" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZAVI ONE — آفلاین</title><body style="font:16px/2 Tahoma,system-ui;background:#f0f8ff;color:#143753;padding:24px"><h2>اتصال اینترنت قطع است</h2><p>برای اولین استفاده، برنامه را یک بار با اینترنت باز کنید تا فایل‌های آفلاین ذخیره شوند.</p></body></html>',
    {status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
async function route(request,event){
  const u=new URL(request.url);
  const nav=request.mode==='navigate'||request.destination==='document';
  const key=canonical(u.href)===ROOT?INDEX:canonical(u.href);
  const known=STATIC.has(key)||key===INDEX;
  const cache=await caches.open(CACHE_NAME);
  if(known){
    const hit=await cache.match(key);
    // Installed APK assets must take precedence over old Service Worker copies.
    // The current release cache remains a fallback when truly offline.
    if(valid(hit,key) && !nav) {
      try {
        const fresh = await fetch(new Request(request,{cache:'no-store'}));
        if(valid(fresh,key)) {
          event.waitUntil(cache.put(key,fresh.clone()).catch(()=>{}));
          return fresh;
        }
      } catch (_) { return hit; }
      return hit;
    }
  }
  // Network fallback only for missing/static files and unknown navigation.
  const controller=new AbortController();const abort=setTimeout(()=>controller.abort(),nav?7500:11500);
  try{
    const res=await fetch(request,{signal:controller.signal});
    if(res.ok&&known&&valid(res,key)){
      event.waitUntil(cache.put(key,res.clone()).catch(()=>{}));
    }
    if(nav&&res.status>=500)return offlinePage();
    return res;
  }catch(_){
    if(nav&&known){
      const page=await cache.match(INDEX);if(valid(page,INDEX))return page;
    }
    return nav?offlinePage():Response.error();
  }finally{clearTimeout(abort)}
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const state=await prepare();
    // Do NOT replace a working worker with an incomplete accounting shell.
    if(!state.ready)throw new Error('Incomplete ZAVI static shell: '+state.missing.join(','));
    // Claim new complete shell promptly; IndexedDB and customer data are untouched.
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  // Keep legacy caches for safe rollback. Never clear browser database or keys.
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const u=new URL(req.url);
  if(!within(u))return;
  // Installed APK assets must bypass PWA caches; the Android asset loader owns them.
  if(u.origin===APK_ORIGIN)return; // سرور مرکزی requests bypass the SW completely.
  const doc=req.mode==='navigate'||req.destination==='document';
  const key=canonical(req.url)===ROOT?INDEX:canonical(req.url);
  if(!doc&&!STATIC.has(key))return; // No caching arbitrary GET/API responses.
  event.respondWith(route(req,event));
});
self.addEventListener('message',event=>{
  const payload=event.data||{};
  if(payload.type==='ZAVI_RELEASE_READY'){event.waitUntil(self.skipWaiting());return;}
 if(!['ZAVI_SHELL_STATUS','ZAVI_SHELL_PREPARE'].includes(payload.type))return;
  event.waitUntil((async()=>{
    let report;
    try{report=payload.type==='ZAVI_SHELL_PREPARE'?await prepare():await status();if(report.ready&&payload.type==='ZAVI_SHELL_PREPARE'){await batch(EXTRA,await caches.open(CACHE_NAME),3)}}
    catch(err){report={ready:false,version:CACHE_NAME,error:String(err),missing:CORE}}
    try{event.ports?.[0]?.postMessage(report)}catch(_){}
  })());
});

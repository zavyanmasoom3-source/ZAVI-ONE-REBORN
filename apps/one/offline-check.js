/* Diagnostic only: a cached app shell never means the paid license is valid. */
(()=>{'use strict';
const status=document.getElementById('status');
const buttons=['prepare','check'].map(id=>document.getElementById(id));
let ongoing=false;
function show(text){status.textContent=text}
function query(worker,type){return new Promise((resolve,reject)=>{
 const ch=new MessageChannel(),timer=setTimeout(()=>{ch.port1.close();reject(Error('جواب Service Worker دریافت نشد.'))},20000);
 ch.port1.onmessage=e=>{clearTimeout(timer);ch.port1.close();resolve(e.data||{})};
 try{worker.postMessage({type},[ch.port2])}catch(e){clearTimeout(timer);reject(e)}
});}
async function diagnose(force){
 if(ongoing)return;ongoing=true;buttons.forEach(b=>b.disabled=true);
 show('در حال بررسی …');
 try{
  if(!('serviceWorker' in navigator)||!isSecureContext)throw Error('HTTPS و مرورگر با Service Worker لازم است.');
  let reg=await navigator.serviceWorker.getRegistration('./');
  if(!reg || !reg.active){
   reg=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
   await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('نصب هنوز کامل نیست. اینترنت را وصل کنید.')),23000))]);
  }
  if(!reg.active){reg=await navigator.serviceWorker.getRegistration('./')||reg}
  if(!reg.active)throw Error('Service Worker فعال نیست.');
  if(force&&navigator.storage?.persist){try{await navigator.storage.persist()}catch(_){}}
  const report=await query(reg.active,force?'ZAVI_SHELL_PREPARE':'ZAVI_SHELL_STATUS');
  let controlled=!!navigator.serviceWorker.controller;
  if(!controlled){await new Promise(resolve=>{const t=setTimeout(resolve,1800);navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(t);resolve()},{once:true})});controlled=!!navigator.serviceWorker.controller}
  const net=navigator.onLine?'اتصال شبکه در دستگاه روشن گزارش شده':'دستگاه آفلاین گزارش شده';
  const ok=report.ready&&controlled&&report.protocol==='zavi-shell-v2'&&report.app_cached===true;
  const lines=[
   (ok?'✅ فایل‌های لازم کامل ذخیره شده‌اند.':'⚠️ استفاده آفلاین هنوز آماده نیست.'),
   (controlled?'✅ کنترول Service Worker فعال است.':'❌ کنترول Service Worker هنوز فعال نشده است؛ صفحه را با اینترنت دوباره تازه کنید.'),
   net,
   'آدرس همین نصب: '+location.origin,
   'نسخه حافظه: '+String(report.version||'نامشخص'),
   (report.protocol==='zavi-shell-v2'?'✅ نسخه معتبر آفلاین است.':'⚠️ نسخه قدیمی کش فعال است؛ پس از همگام‌سازی معاملات، با اینترنت صفحه را دوباره باز کنید.'),
   'فایل‌های موجود: '+(report.cached??'—')+' / '+(report.required??'—'),
   'فایل‌های ناقص: '+(report.missing||[]).join(', ')
  ];
  if(report.error)lines.push('خطا: '+report.error);
  lines.push('یادآوری: مجوز اشتراک از داخل صفحه «اشتراک من» جداگانه بررسی می‌شود.');
  show(lines.join('\n'));
 }catch(e){show('❌ '+(e.message||String(e))+'\nهیچ اطلاعات حسابداری از دستگاه پاک نشده است.')}
 finally{ongoing=false;buttons.forEach(b=>b.disabled=false)}
}
buttons[0].addEventListener('click',()=>diagnose(true));buttons[1].addEventListener('click',()=>diagnose(false));
diagnose(false);
})();

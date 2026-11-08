/* ZAVI ONE V18 - silent and cautious WEB SHELL updates. Does not update native APK binaries. */
(()=>{'use strict';
if(!('serviceWorker'in navigator)||!isSecureContext)return;
let registration=null,waiting=null,dirty=false,applying=false,quietAt=Date.now();
const admin=/admin/i.test(document.title)&&!window.zaviPublicSetLang;
function unsafe(){
 if(dirty || document.querySelector('[aria-modal="true"]:not([hidden]) input:focus, [aria-modal="true"]:not([hidden]) textarea:focus'))return true;
 if(document.querySelector('dialog[open], #modalBg:not([hidden]), .modal:not([hidden]) input:focus'))return true;
 if(!admin){const s=window.zaviCloudRestoreInfo?.();
  // NEVER interrupt when the tenant has unsent changes or a conflict.
  if(s?.pending||s?.conflict)return true;
  try {const auth=window.zaviCloudGetAuthSession?.();if(auth?.user?.id&&s?.workspace){
   if(localStorage.getItem('zavi_v34_pending_'+auth.user.id+'_'+s.workspace))return true;
  }}catch(_){return true}
 }
 return Date.now()-quietAt<6000;
}
async function attempt(){
 if(!waiting||applying||unsafe()||!navigator.onLine)return;
 // Prefer a background / closed tab transition, not while the operator types a sale.
 if(document.visibilityState==='visible')return;
 applying=true;try{waiting.postMessage({type:'ZAVI_RELEASE_READY'})}catch(_){applying=false}
}
function consider(r){waiting=r?.waiting||null;if(waiting)attempt()}
function schedule(r){if(!r)return;
 registration=r;r.addEventListener('updatefound',()=>{const worker=r.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed')consider(r)})});
 consider(r);
}
function check(){if(!navigator.onLine)return;registration?.update().then(()=>consider(registration)).catch(()=>{});}
function init(){navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(schedule).catch(()=>{});
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  // Page reload only when no form inputs are in progress, and no offline sales wait for sync.
  if(!unsafe()&&document.visibilityState==='visible')location.reload();
 });
 document.addEventListener('input',e=>{if(e.target.matches('input,textarea,[contenteditable]')){dirty=true;quietAt=Date.now()}},true);
 document.addEventListener('submit',()=>{quietAt=Date.now();setTimeout(()=>dirty=false,4000)},true);
 document.addEventListener('click',()=>{quietAt=Date.now()},true);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){attempt()}else{quietAt=Date.now();check()} });
 window.addEventListener('online',check);
 setInterval(check,20*60*1000);
 setInterval(()=>{if(document.visibilityState==='hidden')attempt()},45000);
 window.ZaviWebUpdate={check, status:()=>({ready:!!waiting,blocked:unsafe(),version:'18',mode:'silent-on-idle'})};
}
if(document.readyState==='complete')init();else window.addEventListener('load',init,{once:true});
})();

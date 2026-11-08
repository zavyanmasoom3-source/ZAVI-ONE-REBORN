/* Web-only ZAVI ONE ADMIN enhancements. No data writes, storage resets, or auth overrides. */
(()=>{'use strict';
 const html=document.documentElement;
 html.classList.add('zavi-web-responsive');
 html.dataset.zaviWebEdition='2026.10.24';
 const supportsWeb=typeof navigator!=='undefined' && 'serviceWorker' in navigator;
 if(supportsWeb){
   // Existing registered worker handles static shell. No automatic unregistration or cache clearing:
   // doing so could interfere with offline states or account sign-ins.
 }
 const safeTitle=()=>{
   const title=document.title||'';
   if(!title.includes('ZAVI ONE ADMIN'))document.title='ZAVI ONE ADMIN | مدیریت مرکزی';
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',safeTitle,{once:true});else safeTitle();
})();

/* V65.9 progressive enhancement; no RPC, credentials or financial storage. */
(()=>{'use strict';
 const getLang=()=>document.documentElement.lang||'fa-AF';
 const setTitle=()=>{const e=document.getElementById('zaviDateBanner');if(e)e.setAttribute('aria-label',getLang()==='en'?'Kabul time, Gregorian and Solar Hijri dates':'تاریخ دقیق افغانستان، هجری شمسی و میلادی')};
 // A fresh displayed date is generated only on day/theme/language changes.
 document.addEventListener('zavi:theme-changed',()=>{window.ZaviDualDate?.refresh?.();setTitle()});
 document.addEventListener('zavi:language-changed',setTitle);
 function ownerButtons(){const el=document.querySelector('.z659-daily-quick');if(!el)return;const info=window.zaviCloudRestoreInfo?.()||{};const owner=info.role==='owner'&&!!info.workspace&&!!window.zaviCloudGetAuthSession?.()?.user?.id;const any=owner&&!!el.querySelector('[data-z660-daily]:not([hidden])');el.hidden=!any;el.setAttribute('aria-hidden',any?'false':'true');}
 window.addEventListener('pageshow',ownerButtons);window.addEventListener('focus',ownerButtons);document.addEventListener('visibilitychange',()=>{if(!document.hidden)ownerButtons()});
 document.addEventListener('zavi:theme-changed',ownerButtons);
 setInterval(()=>{if(document.visibilityState==='visible')ownerButtons()},10000);
 // Disabled animations follow reduced motion and the shop design preference.
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTitle();ownerButtons()},{once:true});else {setTitle();ownerButtons()}
})();

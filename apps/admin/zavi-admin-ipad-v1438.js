/* ADMIN 1.4.38: predictable iPad drawer and orientation restore; all billing/auth stays in original app.js. */
(()=>{'use strict';
const tablet=()=>window.matchMedia('(max-width:1199px)').matches;
let task=false;
function sync(){
 task=false;
 const shell=document.querySelector('#appScreen'),side=shell?.querySelector('.sidebar');
 if(!side)return;
 const b=document.getElementById('mobileMenu');
 if(tablet()){
  side.style.minWidth='0';
  if(b){b.hidden=false;b.setAttribute('aria-controls','z426-drawer-panel');}
 }else{
  document.body.classList.remove('mobile-drawer');
  side.classList.remove('z426-is-open');
  side.classList.add('z426-is-closed');
  if(b)b.setAttribute('aria-expanded','false');
 }
}
function schedule(){if(task)return;task=true;requestAnimationFrame(sync)}
window.addEventListener('resize',schedule,{passive:true});
window.addEventListener('orientationchange',schedule,{passive:true});
window.addEventListener('pageshow',schedule,{passive:true});
window.visualViewport?.addEventListener('resize',schedule,{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('mobile-drawer'))document.body.classList.remove('mobile-drawer')});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
window.ZaviAdminTabletV1438=Object.freeze({reflow:schedule});
})();

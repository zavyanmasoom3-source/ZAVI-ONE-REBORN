/* ZAVI ONE 65.97 / ADMIN 1.4.43 — tiny dashboard-first voice entry.
 * UI-only enhancement. The existing 65.96 voice engine, accounts and transaction approval stay unchanged.
 * No microphone access occurs until the user opens voice and taps Start.
 */
(()=>{'use strict';
if(window.ZaviVoiceDashboardV6597)return;
const ADMIN=!!document.querySelector('script[src*="zavi-voice-admin-v1442"]');
const app=()=>document.getElementById('appScreen');
const content=()=>document.getElementById('content');
const visible=e=>!!e&&!e.hidden&&getComputedStyle(e).display!=='none'&&!e.closest('[hidden],[aria-hidden="true"]');
function loggedIn(){
 const a=app();
 if(a&&!visible(a))return false;
 if(ADMIN) return !!a&&visible(a)&&window.ZaviAdminAPI?.getMode?.()==='live';
 if(!a&&document.getElementById('loginScreen')&&visible(document.getElementById('loginScreen')))return false;
 return !!(a&&visible(a)||visible(content()));
}
function holder(){
 // The real retail dashboard uses #content.zrf-dashboard and .z62-hero-tools.
 // ADMIN uses a distinct authenticated shell; never place an entry on login screen.
 const d=document.querySelector('#content.zrf-dashboard');
 if(d){
  return d.querySelector('.z62-hero-tools')||d.querySelector('.zrf-home')||d;
 }
 if(ADMIN&&loggedIn()){
  const a=app();
  return a.querySelector('.topbar')||a.querySelector('#view')||a.querySelector('.workspace')||a;
 }
 if(!ADMIN&&loggedIn()){
  // Some of the twenty legacy industry profiles use another dashboard markup.
  const c=content();if(c&&visible(c))return c.querySelector('.welcome')||c;
  const a=app();return a?.querySelector('.topbar')||a?.querySelector('.workspace')||a;
 }
 return null
}
function dashboardIsActive(){
 if(!loggedIn())return false;
 if(ADMIN)return true; // owner-only central shell, all pages
 const c=content();
 // Voice continues across every authorized screen after the one-time opt-in.
 // The small circular manual-off shortcut must remain accessible for privacy.
 return !!(c&&visible(c));
}
function icon(){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');
 svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','2');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');
 svg.innerHTML='<rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8"></path>';
 return svg
}
let button=null,currentParent=null,pending=false;
function language(){
 const v=(document.getElementById('zaviTopLanguage')?.value||document.getElementById('zaviAdminLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();
 return v.startsWith('ps')?'ps':v.startsWith('en')?'en':'fa'
}
function redraw(){
 pending=false;
 const target=holder();
 const can=!!target&&dashboardIsActive();
 if(!button){
  button=document.createElement('button');button.type='button';
  button.id='z197-dashboard-mic';button.className='z197-dashboard-mic';
  button.dataset.zaviVoiceDashboard='1';button.setAttribute('aria-haspopup','dialog');
  button.append(icon());
  button.addEventListener('click',e=>{
   e.preventDefault();
   if(!dashboardIsActive())return;
   if(window.ZaviVoiceProV6596?.open){window.ZaviVoiceProV6596.open()}
  });
 }
 if(target&&target!==currentParent){target.append(button);currentParent=target}
 const labels={fa:'دستیار صوتی زاوی',ps:'د زاوي غږیز مرستیال',en:'ZAVI voice assistant'};
 button.setAttribute('aria-label',labels[language()]);
 button.setAttribute('title',labels[language()]);
 button.hidden=!can;
 // Maintain a button purely as a visual shortcut; no auto-activation.
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(redraw)}
function init(){
 redraw();
 const observed=new WeakSet();
 function watch(n,opts){if(!n||observed.has(n))return;observed.add(n);new MutationObserver(schedule).observe(n,opts)}
 watch(document.body,{childList:true,subtree:false});
 const a=app(),c=content();
 watch(a,{attributes:true,attributeFilter:['hidden','class','style','aria-hidden']});
 watch(c,{attributes:true,attributeFilter:['hidden','class','style','aria-hidden'],childList:true,subtree:false});
 watch(document.documentElement,{attributes:true,attributeFilter:['lang','data-zavi-theme','data-theme','class']});
 document.addEventListener('click',e=>{if(e.target?.closest?.('[data-go],[data-page],#sidebarLinks,#mobileBottom,.nav-btn,.nav-item'))schedule()},true);
 document.addEventListener('change',e=>{if(e.target?.id==='zaviTopLanguage'||e.target?.id==='zaviAdminLanguage')schedule()});
 document.addEventListener('visibilitychange',schedule);
 const root=document.getElementById('appScreen')||document.body;
 watch(root,{childList:true,subtree:false});
}
window.ZaviVoiceDashboardV6597=Object.freeze({refresh:schedule,version:'65.97/1.4.43'});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

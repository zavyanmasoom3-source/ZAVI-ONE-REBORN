/* ZAVI ONE V65.33 — responsive visual housekeeping only.
   The existing app owns all navigation, product and money events. */
(()=>{
 'use strict';
 function cleanup(){
  // Legacy easy-mode controls were removed. This cleans up any old DOM from
  // an already-open tab after a hot update, without touching accounting data.
  document.querySelectorAll('.zavi-easy-controls,#zaviEasyQuickStart,#zaviEasySettings').forEach(el=>el.remove());
  delete document.documentElement.dataset.zaviEasy;
  delete document.documentElement.dataset.zaviEasyExpanded;
  document.querySelectorAll('.sidebar .zavi-easy-advanced,.sidebar .zavi-easy-active-extra').forEach(el=>{
   el.classList.remove('zavi-easy-advanced','zavi-easy-active-extra');
  });
 }
 function init(){cleanup();
  const content=document.getElementById('content');
  if(content){new MutationObserver(()=>{
   if(content.querySelector('#zaviEasyQuickStart,#zaviEasySettings'))cleanup();
  }).observe(content,{childList:true});}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.ZaviResponsiveDesignV6533={refresh:cleanup};
})();

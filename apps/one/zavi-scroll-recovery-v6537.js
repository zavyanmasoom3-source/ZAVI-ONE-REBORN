/* ZAVI ONE V65.37: clear stale mobile drawer scroll lock on navigation/orientation.
   No financial records, auth credentials, storage, licenses or user data are touched. */
(()=>{'use strict';
function sync(){
 const side=document.getElementById('side');
 if(!side)return;
 const open=side.classList.contains('mobile-drawer')&&getComputedStyle(side).display!=='none'&&window.innerWidth<=1050;
 if(!open)document.body.classList.remove('z6536-drawer-open');
}
function init(){
 const side=document.getElementById('side'),overlay=document.getElementById('overlay');
 if(!side)return;
 new MutationObserver(sync).observe(side,{attributes:true,attributeFilter:['class']});
 if(overlay)new MutationObserver(sync).observe(overlay,{childList:true});
 window.addEventListener('pageshow',sync);
 window.addEventListener('resize',sync,{passive:true});
 window.addEventListener('orientationchange',sync,{passive:true});
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

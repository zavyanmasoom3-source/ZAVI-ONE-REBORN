/* ZAVI ONE 65.89 / ADMIN 1.4.35. Layout only. Never reload, sign out, clear storage, or touch ledger. */
(()=>{'use strict';
let queued=false, lastOrientation='',lastWidth=0,lastHeight=0;
const root=document.documentElement;
function measure(){
 queued=false;
 const viewport=window.visualViewport;
 const width=Math.max(240,Math.round(viewport?.width||window.innerWidth||document.documentElement.clientWidth||360));
 const height=Math.max(200,Math.round(viewport?.height||window.innerHeight||document.documentElement.clientHeight||600));
 const landscape=window.matchMedia?.('(orientation: landscape)').matches??(window.innerWidth>window.innerHeight);
 root.style.setProperty('--z89-viewport-width',width+'px');
 root.style.setProperty('--z89-viewport-height',height+'px');
 root.dataset.zaviOrientation=landscape?'landscape':'portrait';
 if(lastWidth!==width||lastHeight!==height||lastOrientation!==root.dataset.zaviOrientation){
   lastWidth=width;lastHeight=height;lastOrientation=root.dataset.zaviOrientation;
   document.querySelectorAll('#content,#appScreen #view,.app>.main').forEach(element=>{
     element.style.minWidth='0';
     element.style.maxWidth='100%';
   });
   try{window.dispatchEvent(new CustomEvent('zavi:layout-ready',{detail:{width,height,orientation:lastOrientation}}))}catch(_){}
 }
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(measure);}
['resize','orientationchange','pageshow','zavi:native-configurationchange'].forEach(name=>window.addEventListener(name,queue,{passive:true}));
window.visualViewport?.addEventListener('resize',queue,{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});
else queue();
if(window.ResizeObserver){
 const start=()=>{const target=document.querySelector('#appScreen')||document.querySelector('.app')||document.body;if(target)new ResizeObserver(queue).observe(target)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
window.ZaviViewportV6589=Object.freeze({refresh:queue,orientation:()=>root.dataset.zaviOrientation});
})();

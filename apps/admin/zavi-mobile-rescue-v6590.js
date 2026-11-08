/* ZAVI ONE 65.90 / ADMIN 1.4.36 — visual viewport changes only, no reload or ledger state edits. */
(()=>{'use strict';
let last='',queued=false;
const root=document.documentElement;
function refresh(){
 queued=false;
 const vv=window.visualViewport;
 const h=Math.max(200,Math.round(vv?.height||window.innerHeight||root.clientHeight||600));
 const w=Math.max(240,Math.round(vv?.width||window.innerWidth||root.clientWidth||360));
 const key=w+'x'+h;
 root.style.setProperty('--z90-vh',h+'px');
 root.style.setProperty('--z90-vw',w+'px');
 if(key===last)return;
 last=key;
 // Native WebView reflows asynchronously after a device turn. Trigger layout
 // by a style read, but DO NOT reconstruct any form/input or page route.
 document.querySelectorAll('#content,#appScreen #view').forEach(el=>{
   el.style.minWidth='0';
   el.style.maxWidth='100%';
 });
 const panel=document.getElementById('z637AiPanel');
 if(panel?.getAttribute('aria-hidden')==='false'){
   const messages=panel.querySelector('.z637-ai-messages');
   if(messages&&messages.scrollHeight>messages.clientHeight){messages.scrollTop=messages.scrollHeight;}
 }
 try{window.dispatchEvent(new CustomEvent('zavi:visual-viewport',{detail:{width:w,height:h}}))}catch(_){}
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(refresh)}
for(const type of ['resize','orientationchange','pageshow','zavi:native-configurationchange'])window.addEventListener(type,queue,{passive:true});
window.visualViewport?.addEventListener('resize',queue,{passive:true});
window.visualViewport?.addEventListener('scroll',queue,{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});
else queue();
window.ZaviVisualRescueV6590=Object.freeze({refresh:queue});
})();

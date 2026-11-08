/* ZAVI ONE 65.67 – natural height and full text in the real All Sections dialog.
   Reads only existing navigation; no new routes, no user data changes. */
(()=>{
'use strict';
function repair(){
 const overlay=document.getElementById('zrf-all');if(!overlay)return;
 const items=overlay.querySelectorAll('.zrf-all-item');
 for(const item of items){
  const name=item.querySelector('.zrf-all-name');if(!name)continue;
  const original=name.textContent||'';
  // The menu icon already represents the feature; remove a duplicated decorative emoji prefix.
  const clean=original.replace(/^[\s\p{Extended_Pictographic}\uFE0F\u200D]+/u,'').replace(/\s+/g,' ').trim();
  if(clean&&clean!==original)name.textContent=clean;
  const text=name.textContent.trim();
  item.classList.toggle('z67-long',text.length>19||text.split(/\s+/).length>3);
  item.setAttribute('title',text);
  item.setAttribute('aria-label',text);
 }
}
function start(){
 repair();
 // Original app appends/removes #zrf-all as a *direct body child*.
 new MutationObserver(m=>{if(m.some(x=>Array.from(x.addedNodes).some(n=>n.nodeType===1&&n.id==='zrf-all')))repair()})
  .observe(document.body,{childList:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
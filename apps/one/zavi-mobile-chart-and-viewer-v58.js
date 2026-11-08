/* ZAVI ONE V58: WebKit-safe horizontal chart swiping and controls.
 * Presentation-only; never reads or writes accounting/customer records. */
(()=>{'use strict';
 const getScroll=()=>document.querySelector('.z47-chart-scroll.z27-chart-scroll');
 function step(dir){const sc=getScroll();if(!sc)return;const amount=Math.max(240,Math.round(sc.clientWidth*0.78));
  sc.scrollBy({left:dir*amount,behavior:'smooth'});
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-zavi-chart-step]');if(!b)return;
  e.preventDefault();step(Number(b.dataset.zaviChartStep)||0);
 });
 // Genuine native overflow scrolling is preferred. Only when iOS WebKit drops
 // a horizontal swipe do we apply the user gesture as an accessible fallback.
 let origin=null;
 document.addEventListener('touchstart',e=>{
  const sc=e.target.closest?.('.z47-chart-scroll.z27-chart-scroll');
  if(!sc||e.touches.length!==1)return;
  const touch=e.touches[0];origin={sc,x:touch.clientX,y:touch.clientY,at:sc.scrollLeft};
 },{passive:true});
 document.addEventListener('touchend',e=>{
  if(!origin||!e.changedTouches.length)return;
  const a=origin;origin=null;
  if(!a.sc.isConnected)return;
  const touch=e.changedTouches[0],dx=touch.clientX-a.x,dy=touch.clientY-a.y;
  if(Math.abs(dx)<25||Math.abs(dx)<Math.abs(dy)*1.35)return;
  if(Math.abs(a.sc.scrollLeft-a.at)>3)return;
  a.sc.scrollBy({left:-dx,behavior:'smooth'});
 },{passive:true});
 document.addEventListener('touchcancel',()=>{origin=null},{passive:true});
})();

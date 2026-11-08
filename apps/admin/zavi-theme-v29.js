/* ZAVI ONE / ADMIN: presentation-only light/dark mode.
 * The theme preference is local to this browser/origin; no accounting data or auth state is changed.
 */
(()=>{'use strict';
 const KEY='zavi_theme_preference_v29';
 const isValid=x=>x==='light'||x==='dark'||x==='glass';
 let current=document.documentElement.getAttribute('data-zavi-theme');
 try{current=localStorage.getItem(KEY)||current}catch(_){}
 if(!isValid(current))current='dark';
 function syncControls(){
  document.querySelectorAll('.zavi-theme-picker').forEach(group=>{
   if(!group.querySelector('[data-zavi-theme-choice="glass"]')){
    const button=document.createElement('button');button.type='button';button.className='zavi-theme-choice';button.setAttribute('data-zavi-theme-choice','glass');
    group.appendChild(button);
   }
  });
  const lang=(document.documentElement.lang||'fa').toLowerCase();
  const glassLabel=lang.startsWith('en')?'Glass':lang.startsWith('ps')?'ښیښه‌یي':'شیشه‌ای';
  document.querySelectorAll('[data-zavi-theme-choice="glass"]').forEach(el=>{if(el.textContent!==glassLabel)el.textContent=glassLabel});
  document.querySelectorAll('[data-zavi-theme-choice]').forEach(el=>{
   const active=el.getAttribute('data-zavi-theme-choice')===current;
   if(el.getAttribute('aria-pressed')!==String(active))el.setAttribute('aria-pressed',String(active));
   el.classList.toggle('is-selected',active);
  });
 }
 function setTheme(next){
  if(!isValid(next))return;
  current=next;
  document.documentElement.setAttribute('data-zavi-theme',next==='glass'?'dark':next);
  document.documentElement.setAttribute('data-zavi-appearance',next);
  try{localStorage.setItem(KEY,next)}catch(_){/* private browser mode */}
  syncControls();
  document.dispatchEvent(new CustomEvent('zavi:theme-changed',{detail:{theme:next}}));
 }
 document.addEventListener('click',e=>{
  const el=e.target.closest?.('[data-zavi-theme-choice]');
  if(el)setTheme(el.getAttribute('data-zavi-theme-choice'));
 });
 window.addEventListener('storage',e=>{if(e.key===KEY&&isValid(e.newValue))setTheme(e.newValue)});
 function init(){
  setTheme(current);
  let queued=false;
  const mo=new MutationObserver(mutations=>{
   const hasThemeControls=mutations.some(m=>[...m.addedNodes].some(node=>
    node.nodeType===1&&(node.matches?.('.zavi-theme-picker,[data-zavi-theme-choice]')||node.querySelector?.('.zavi-theme-picker,[data-zavi-theme-choice]'))));
   if(hasThemeControls&&!queued){queued=true;requestAnimationFrame(()=>{queued=false;syncControls()});}
  });
  mo.observe(document.body,{childList:true,subtree:true});
  new MutationObserver(syncControls).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.ZaviThemeV29={get:()=>current,set:setTheme};
})();

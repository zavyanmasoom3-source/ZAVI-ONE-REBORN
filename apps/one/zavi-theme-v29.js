/* ZAVI approved interface: light/dark only, with the existing public theme API.
   Legacy glass preference is migrated to dark without touching account data. */
(()=>{'use strict';
 const KEY='zavi_theme_preference_v29',UI_KEY='zavi_ui_appearance_v2';
 const normalize=value=>value==='light'?'light':'dark';
 let current=normalize(document.documentElement.getAttribute('data-zavi-theme'));
 try{current=normalize(localStorage.getItem(UI_KEY)||localStorage.getItem(KEY)||current)}catch(_){}
 function syncControls(){
   // Old settings may contain hard-coded glass buttons, not merely dynamic ones.
   document.querySelectorAll('[data-zavi-theme-choice="glass"]').forEach(el=>el.remove());
   document.querySelectorAll('[data-zavi-theme-choice]').forEach(el=>{
     const active=el.getAttribute('data-zavi-theme-choice')===current;
     if(el.getAttribute('aria-pressed')!==String(active))
       el.setAttribute('aria-pressed',String(active));
     el.classList.toggle('is-selected',active);
   });
 }
 function setTheme(requested){
   const next=normalize(requested);
   current=next;
   const root=document.documentElement;
   root.setAttribute('data-zavi-theme',next);
   root.setAttribute('data-zavi-appearance',next);
   try{localStorage.setItem(KEY,next);localStorage.setItem(UI_KEY,next)}catch(_){}
   syncControls();
   document.dispatchEvent(new CustomEvent('zavi:theme-changed',{detail:{theme:next}}));
 }
 document.addEventListener('click',event=>{
   const control=event.target.closest?.('[data-zavi-theme-choice]');
   if(control && control.dataset.zaviThemeChoice!=='glass')
     setTheme(control.dataset.zaviThemeChoice);
 });
 window.addEventListener('storage',event=>{
   if(event.key===KEY||event.key===UI_KEY)setTheme(event.newValue);
 });
 function init(){
   setTheme(current);
   let queued=false;
   const observer=new MutationObserver(mutations=>{
     if(queued||!mutations.some(m=>[...m.addedNodes].some(node=>
       node.nodeType===1 && (node.matches?.('.zavi-theme-picker,[data-zavi-theme-choice]')||
       node.querySelector?.('.zavi-theme-picker,[data-zavi-theme-choice]')))))return;
     queued=true;requestAnimationFrame(()=>{queued=false;syncControls()});
   });
   observer.observe(document.body,{childList:true,subtree:true});
   new MutationObserver(syncControls).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.ZaviThemeV29={get:()=>current,set:setTheme};
})();

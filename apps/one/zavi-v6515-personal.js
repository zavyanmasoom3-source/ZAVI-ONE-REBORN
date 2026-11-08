/* ZAVI ONE V65.15 — per-user presentation preferences (never financial state). */
(()=>{'use strict';
  const PREFIX='zavi_personal_font_v6515_';
  const allowed=new Set(['standard','vazir','estedad']);
  const root=document.documentElement;
  function identity(){
    try{return window.zaviCloudGetAuthSession?.()?.user?.id||'local-guest'}
    catch(_){return 'local-guest'}
  }
  function key(){return PREFIX+identity()}
  function saved(){
    try{const value=localStorage.getItem(key());return allowed.has(value)?value:'standard'}
    catch(_){return 'standard'}
  }
  function syncSelect(){
    const select=document.getElementById('z6515FontChoice');
    if(select&&select.value!==saved())select.value=saved();
  }
  function apply(){
    const value=saved();
    if(root.getAttribute('data-z6515-font')!==value)root.setAttribute('data-z6515-font',value);
    syncSelect();
  }
  function store(value){
    if(!allowed.has(value))return;
    try{localStorage.setItem(key(),value)}catch(_){/* Private browsers may block storage. */}
    root.setAttribute('data-z6515-font',value);
  }
  document.addEventListener('change',event=>{
    if(event.target?.id!=='z6515FontChoice')return;
    store(event.target.value);
  });
  window.addEventListener('zavi-cloud-session-changed',apply);
  window.addEventListener('storage',event=>{if(event.key===key())apply()});
  function ready(){
    apply();
    const content=document.getElementById('content');
    if(content){
      const observer=new MutationObserver(()=>{if(document.getElementById('z6515FontChoice'))syncSelect()});
      observer.observe(content,{childList:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
  window.ZaviFontSettingsV6515={get:saved,apply};
})();

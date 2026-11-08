/* ZAVI ONE 65.49 — additive usability correction, keep all business functionality */
(()=>{'use strict';
 const terms={fa:['بستن','جستجوی بخش‌ها'],en:['Close','Search sections'],ps:['بندول','برخې ولټوئ']};
 const locale=()=>{const s=String(document.querySelector('#zaviTopLanguage,#zaviSettingsLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return s.startsWith('en')?'en':s.startsWith('ps')?'ps':'fa'};
 const css=document.createElement('style');css.id='zavi-v6549-mobile-css';
 css.textContent=[
 '@media(max-width:900px){',
 '#side.sidebar.mobile-drawer{position:fixed!important;inset:0!important;width:100vw!important;max-width:100vw!important;min-width:100vw!important;height:100dvh!important;max-height:100dvh!important;transform:none!important;overflow-y:auto!important;overscroll-behavior:contain!important;touch-action:pan-y!important;z-index:2147481900!important;border-radius:0!important;}',
 '#side.sidebar.mobile-drawer .zavi-v6-menu-scroll{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;touch-action:pan-y!important;padding-bottom:max(24px,env(safe-area-inset-bottom,0px))!important;}',
 '#side.sidebar.mobile-drawer .nav-btn{min-height:48px!important;font-size:14px!important;white-space:normal!important;line-height:1.65!important;}',
 '#side.sidebar.mobile-drawer .z6547MenuTop{position:sticky!important;top:0!important;z-index:30!important;}',
 '#content,#view,.scroll-area,.drawer-content{overscroll-behavior:contain;scrollbar-width:thin;}',
 'button,input,select,textarea{max-width:100%;}',
 '}',
 '.z6547MenuClose:focus-visible,a:focus-visible,button:focus-visible{outline:3px solid #1cbbea!important;outline-offset:2px;}',
 '@media print{.z6547MenuClose{display:none!important}}'
 ].join('\n');
 (document.head||document.documentElement).appendChild(css);
 function update(){
  const menu=document.getElementById('side');if(!menu)return;
  const head=menu.querySelector('.z6547MenuTop');if(!head)return;
  const t=terms[locale()],close=head.querySelector('.z6547MenuClose'),search=head.querySelector('input[type=search]');
  if(close){const caption='✕ '+t[0];if(close.textContent!==caption)close.textContent=caption;close.setAttribute('aria-label',t[0]);}
  if(search)search.setAttribute('aria-label',t[1]);
 }
 function start(){
  const menu=document.getElementById('side');if(!menu)return;update();
  let scheduled=false;
  new MutationObserver(()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;update()},80)})
    .observe(menu,{childList:true,subtree:false});
  document.addEventListener('change',e=>{if(e.target.matches('#zaviTopLanguage,#zaviSettingsLanguage'))update()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('mobile-drawer'))document.getElementById('drawerShade')?.click()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
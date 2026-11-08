/* ZAVI ONE ADMIN 1.0 — UI only; backend remains the sole authority. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const splash=$('zaviAdminSplash');
 let splashTimer=0,booted=false;
 function playSplash(ms=1350){if(!splash)return;clearTimeout(splashTimer);splash.classList.remove('is-hidden');splash.setAttribute('aria-hidden','false');splashTimer=setTimeout(()=>{splash.classList.add('is-hidden');splash.setAttribute('aria-hidden','true')},window.matchMedia('(prefers-reduced-motion: reduce)').matches?170:ms)}
 function closeDrawer(){document.body.classList.remove('mobile-drawer');const opener=$('adminMoreBtn');opener?.setAttribute('aria-expanded','false')}
 function sync(){const active=document.querySelector('#appScreen .nav-item.selected')?.dataset.page||'overview';document.querySelectorAll('.admin-mobile-nav button[data-page]').forEach(b=>b.classList.toggle('selected',b.dataset.page===active));const visible=!$('appScreen').hidden;const nav=document.querySelector('.admin-mobile-nav');if(nav)nav.hidden=!visible;if(!visible)closeDrawer()}
 function init(){if(booted)return;booted=true;
  document.querySelector('.admin-mobile-nav')?.removeAttribute('hidden');
  $('adminDrawerScrim')?.addEventListener('click',closeDrawer);
  $('adminMoreBtn')?.addEventListener('click',()=>{const btn=$('mobileMenu');btn?.click();$('adminMoreBtn')?.setAttribute('aria-expanded',String(document.body.classList.contains('mobile-drawer')))});
  window.addEventListener('resize',()=>{if(window.innerWidth>760)closeDrawer()},{passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('mobile-drawer')){e.preventDefault();closeDrawer()}});
  document.querySelectorAll('.admin-mobile-nav button[data-page]').forEach(b=>b.addEventListener('click',()=>{closeDrawer()}));
  document.addEventListener('click',e=>{if(e.target.closest('#appScreen .sidebar button[data-page]'))closeDrawer()});
  // Keep the visual navigation synchronized after the established app's render() runs.
  const app=$('appScreen');let lastHidden=app.hidden;
  new MutationObserver(()=>{const h=app.hidden;if(h!==lastHidden){lastHidden=h;if(!h)playSplash(850)}sync()}).observe(app,{attributes:true,attributeFilter:['hidden']});
  const view=$('view');if(view)new MutationObserver(()=>sync()).observe(view,{childList:true,subtree:false});
  sync();playSplash();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

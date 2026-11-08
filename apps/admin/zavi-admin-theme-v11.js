/* ZAVI ONE ADMIN V1.1 — theme toggle, no changes to permission or accounting. */
(()=>{'use strict';
const key='zavi_theme_preference_v29';
const theme=()=>document.documentElement.getAttribute('data-zavi-theme')==='dark'?'dark':'light';
function refresh(){const b=document.getElementById('z11ThemeToggle');if(!b)return;b.textContent=theme()==='dark'?'☀':'☾';b.setAttribute('aria-label',theme()==='dark'?'تغییر به حالت روشن':'تغییر به حالت تیره');}
function change(){const v=theme()==='dark'?'light':'dark';if(window.ZaviThemeV29?.set)window.ZaviThemeV29.set(v);else{document.documentElement.setAttribute('data-zavi-theme',v);try{localStorage.setItem(key,v)}catch(_){}}refresh();}
function init(){document.getElementById('z11ThemeToggle')?.addEventListener('click',change);new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['data-zavi-theme']});refresh();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

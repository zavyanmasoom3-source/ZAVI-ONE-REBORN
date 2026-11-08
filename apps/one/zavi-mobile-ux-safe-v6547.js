/* V65.47 fullscreen mobile navigation and settings icons. Keeps all existing buttons. */
(function(){'use strict';
var mode=document.getElementById('side')?'one':'admin',side,bar,search;
var icons={overview:'🏠',dashboard:'🏠',customers:'🏪',sales:'🛒',sale:'🛒',purchases:'📦',purchase:'📦',products:'📦',devices:'📱',support:'🛟',payments:'💳',finance:'💰',activity:'📋',health:'🩺',brand:'🏷️',security:'🛡️',settings:'⚙️',reports:'📊',contacts:'👥',phonebook:'☎️',expenses:'📉',journal:'📒'};
function label(){var sel=document.querySelector('#zaviTopLanguage,#zaviAdminLanguage,#zaviSettingsLanguage');var v=(sel&&sel.value||document.documentElement.lang||'fa').toLowerCase();return v.indexOf('en')===0?['All sections','Close','Search sections']:v.indexOf('ps')===0?['ټولې برخې','بندول','برخې ولټوئ']:['همه بخش‌ها','بستن','جستجوی بخش‌ها']}
function style(){if(document.getElementById('z6547FullMenuCss'))return;
 var st=document.createElement('style');st.id='z6547FullMenuCss';st.textContent=[
 '@media(max-width:900px){',
 'body #side.sidebar.mobile-drawer,body.mobile-drawer #appScreen .sidebar{position:fixed!important;inset:0!important;left:0!important;right:0!important;top:0!important;bottom:0!important;width:100vw!important;max-width:100vw!important;min-width:100vw!important;height:100dvh!important;max-height:100dvh!important;overflow-y:auto!important;overflow-x:hidden!important;z-index:2147482000!important;transform:none!important;visibility:visible!important;display:flex!important;flex-direction:column!important;margin:0!important;padding:env(safe-area-inset-top,0px) 14px env(safe-area-inset-bottom,0px)!important;border-radius:0!important;}',
 'body #side.sidebar.mobile-drawer>.zavi-v6-menu-scroll,body.mobile-drawer #appScreen .sidebar>.zavi-v6-menu-scroll{flex:1 1 auto!important;overflow-y:auto!important;max-height:none!important;min-height:0!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding-bottom:22px!important;}',
 'body #side.sidebar.mobile-drawer .nav-btn,body.mobile-drawer #appScreen .sidebar .nav-item{min-height:49px!important;white-space:normal!important;font-size:14px!important;padding:10px 12px!important;max-width:100%!important;display:flex!important;align-items:center!important;gap:9px!important;}',
 '}',
 '.z6547MenuTop{position:sticky;top:0;z-index:30;padding:12px;border-radius:13px;background:linear-gradient(120deg,#153a6b,#1587ba);color:#fff;margin:8px 0 12px;}',
 '.z6547MenuTitle{font-weight:850;font-size:17px;color:white;}',
 '.z6547MenuClose{background:#fff!important;color:#103965!important;border:0;border-radius:9px;padding:9px 13px;font-weight:800;min-height:40px;}',
 '.z6547MenuRow{display:flex;justify-content:space-between;align-items:center;gap:12px;}',
 '.z6547MenuSearch{display:block!important;width:100%!important;background:#fff!important;color:#17324f!important;border-radius:10px!important;border:1px solid #bfdbf0!important;padding:9px 12px!important;margin-top:9px!important;height:43px!important;font-size:14px!important;}',
 '.z6547Filtered{display:none!important}',
 '.z6547Icon{display:inline-flex;justify-content:center;align-items:center;min-width:28px;font-size:18px;flex-shrink:0}',
 '.zavi-settings-6546-group>h3{display:flex;align-items:center;gap:9px;font-size:16px!important;}',
 '.zavi-settings-6546-group>h3>.z6547HeadingIcon{border-radius:9px;background:#167ca52b;min-width:38px;height:38px;display:inline-flex;align-items:center;justify-content:center;}',
 '@media print{.z6547MenuTop{display:none!important}}'
 ].join('\n');document.head.appendChild(st)}
function close(){if(mode==='one'){document.getElementById('drawerShade')?.click();}else{document.body.classList.remove('mobile-drawer')}}
function decorate(){
 if(!side)return;side.querySelectorAll(mode==='one'?'.nav-btn':'button[data-page]').forEach(function(b){
  var id=(b.dataset.page||b.dataset.go||b.id||'').toLowerCase();
  if(b.dataset.z6547Done)return;
  var match=Object.keys(icons).find(function(k){return id.indexOf(k)>=0});
  var symbol=icons[match]||'🧩';
  if(mode==='admin'){var icon=b.querySelector('span');if(icon){icon.textContent=symbol;icon.classList.add('z6547Icon')}}
  else if(!b.querySelector('svg,.z63-icon')){var icon=document.createElement('span');icon.className='z6547Icon';icon.textContent=symbol;b.prepend(icon)}
  b.dataset.z6547Done='1';
 });
 document.querySelectorAll('.zavi-settings-6546-group>h3').forEach(function(h){if(h.querySelector('.z6547HeadingIcon'))return;var map={secure:'🛡️',store:'🏪',display:'🎨',printing:'🖨️',data:'☁️',advanced:'🧰'},k=h.parentNode.dataset.section;var icon=document.createElement('span');icon.className='z6547HeadingIcon';icon.setAttribute('aria-hidden','true');icon.textContent=map[k]||'⚙️';h.prepend(icon)})
}
function applyText(){if(!bar)return;var t=label();bar.querySelector('.z6547MenuTitle').textContent=t[0];bar.querySelector('.z6547MenuClose').textContent='✕ '+t[1];search.placeholder=t[2]}
function mount(){side=mode==='one'?document.getElementById('side'):document.querySelector('#appScreen .sidebar');if(!side)return;style();
 if(!side.querySelector('.z6547MenuTop')){
  bar=document.createElement('div');bar.className='z6547MenuTop';bar.innerHTML='<div class="z6547MenuRow"><b class="z6547MenuTitle"></b><button type="button" class="z6547MenuClose"></button></div><input type="search" class="z6547MenuSearch">';
  var list=side.querySelector('.zavi-v6-menu-scroll');(list||side.firstElementChild).before(bar);
  bar.querySelector('button').addEventListener('click',close);
  bar.querySelector('input').addEventListener('input',function(){
    var q=this.value.trim().toLocaleLowerCase();side.querySelectorAll(mode==='one'?'.nav-btn':'button[data-page]').forEach(function(b){b.classList.toggle('z6547Filtered',!!q&&!b.textContent.toLocaleLowerCase().includes(q))})
  });
 }else bar=side.querySelector('.z6547MenuTop');
 search=bar.querySelector('input');applyText();decorate()
}
document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
document.addEventListener('click',function(e){if(e.target.closest('#mobileMenu,[data-go="more"]'))setTimeout(mount,30)});
document.addEventListener('change',function(e){if(e.target.matches('#zaviTopLanguage,#zaviAdminLanguage,#zaviSettingsLanguage'))applyText()});
function init(){mount();var root=document.querySelector(mode==='one'?'#content':'#view');if(root)new MutationObserver(function(){decorate()}).observe(root,{childList:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
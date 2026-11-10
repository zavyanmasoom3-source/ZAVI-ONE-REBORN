/* ZAVI ONE 65.87 / ADMIN 1.4.33 — 3 independent settings-only display controls.
   Visual preferences only. Never mutate ledger, membership, sync, route or auth.
   No page zoom / transform: CSS viewport stays faithful at 50–115%. */
(()=>{'use strict';
const root=document.documentElement;
const APP=document.currentScript?.getAttribute('data-zavi-app')==='admin'?'admin':'one';
const KEY='zavi_'+APP+'_three_sizes_v6587';
const MIN=50, MAX=115, STEP=5;
const sanitize=n=>Number.isFinite(Number(n))?Math.min(MAX,Math.max(MIN,Math.round(Number(n)/STEP)*STEP)):100;
const strings={
fa:{title:'سه اندازهٔ مستقل',help:'اندازۀ هر بخش را جداگانه تنظیم کنید. صفحه و منو در هر حالت کامل می‌مانند.',text:'اندازۀ متن‌ها',system:'اندازۀ سیستم',daily:'اندازۀ مدیریت روزمره',reset:'بازنشانی',close:'بستن',open:'نمایش اندازه‌ها',hint:'۵۰٪ تا ۱۱۵٪ · تغییرات در همین دستگاه ذخیره می‌شوند'},
en:{title:'Three independent sizes',help:'Adjust each area separately without resizing or cropping the page.',text:'Text size',system:'System size',daily:'Daily management size',reset:'Reset',close:'Collapse',open:'Show size options',hint:'50%–115% · Saved on this device'},
ps:{title:'درې جلا اندازې',help:'هره برخه بېله تنظیم کړئ. پاڼه او مېنو به بشپړ پاتې شي.',text:'د لیکنې اندازه',system:'د سیسټم اندازه',daily:'د ورځني مدیریت اندازه',reset:'بیا تنظیم',close:'بندول',open:'اندازې ښودل',hint:'۵۰٪ تر ۱۱۵٪ · دلته خوندي کېږي'}
};
let values={text:100,system:100,daily:100},expanded=true,scheduled=false,lastLanguage='';
try{const s=localStorage.getItem(KEY);if(s){let obj=JSON.parse(s);for(let key of Object.keys(values))values[key]=sanitize(obj[key]);}
else if(APP==='one'){const prior=localStorage.getItem('zavi_display_percent_v6545');if(prior!==null)values.system=sanitize(prior);}}
catch(_){}
function locale(){
 const el=document.querySelector('#zaviSettingsLanguage,#zaviAdminLanguage,#zaviTopLanguage,#zaviGateLanguage,[name="language"]');
 const val=String(el?.value||root.lang||'fa').trim().toLowerCase();
 return val.startsWith('en')?'en':val.startsWith('ps')?'ps':'fa';
}
function dailyView(){
 const area=document.querySelector(APP==='one'?'#content':'#appScreen #view');
 if(!area)return false;
 if(area.querySelector('[data-zavi-daily],#zaviDailyOperations,.zavi-daily-page,.trade-daily-page'))return true;
 const headings=[...area.querySelectorAll('h1,h2')].slice(0,6).map(x=>x.textContent||'').join(' ');
 return /کارهای روزمره|مدیریت روزمره|daily\s+(operations|management|tasks)|ورځن/i.test(headings);
}
function apply(){
 const set=(key,val)=>root.style.setProperty(key,String(val/100));
 set('--z87-text-ratio',values.text);
 set('--z87-system-ratio',values.system);
 set('--z87-daily-ratio',values.daily);
 root.dataset.z87ThreeScales='active';
 root.classList.toggle('z87-daily-active',dailyView());
 root.style.removeProperty('zoom');
 document.body?.style?.removeProperty('zoom');
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(values));}catch(_){}}
function change(which,next){
 if(!Object.hasOwn(values,which))return;
 values[which]=sanitize(next);persist();apply();refresh();
}
function render(){
 const rows=['text','system','daily'].map(which=>'<div class="z87-row" data-z87-row="'+which+'"><div class="z87-row-head"><label for="z87-range-'+which+'"></label><output class="z87-number" for="z87-range-'+which+'"></output></div><input type="range" class="z87-slider" id="z87-range-'+which+'" min="50" max="115" step="5" value="100"><div class="z87-foot"><span>50%</span><button type="button" class="z87-reset" data-z87-reset="'+which+'"></button><span>115%</span></div></div>').join('');
 const panel=document.createElement('section');
 panel.id='z87-three-scales';panel.className='z87-three-scales';
 panel.setAttribute('aria-label','Display size options');
 panel.innerHTML='<div class="z87-head"><div class="z87-title"></div><button type="button" class="z87-collapse" aria-expanded="true"></button></div><div class="z87-body"><p class="z87-help"></p><div class="z87-rows">'+rows+'</div><small class="z87-hint"></small></div>';
 panel.querySelectorAll('.z87-slider').forEach(input=>input.addEventListener('input',()=>change(input.closest('[data-z87-row]').dataset.z87Row,input.value)));
 panel.querySelectorAll('.z87-reset').forEach(button=>button.addEventListener('click',()=>change(button.dataset.z87Reset,100)));
 panel.querySelector('.z87-collapse').addEventListener('click',()=>{expanded=!expanded;refresh();});
 return panel;
}
function refresh(){
 const el=document.getElementById('z87-three-scales');if(!el)return;
 const language=locale(),t=strings[language];lastLanguage=language;
 const put=(selector,value)=>{const x=el.querySelector(selector);if(x&&x.textContent!==value)x.textContent=value;};
 put('.z87-title',t.title);put('.z87-help',t.help);put('.z87-hint',t.hint);put('.z87-collapse',expanded?t.close:t.open);
 const toggle=el.querySelector('.z87-collapse');
 toggle.setAttribute('aria-expanded',String(expanded));
 el.querySelector('.z87-body').hidden=!expanded;
 for(const key of Object.keys(values)){
   put('[data-z87-row="'+key+'"] label',t[key]);
   put('[data-z87-row="'+key+'"] output',values[key]+'%');
   put('[data-z87-reset="'+key+'"]',t.reset);
   const input=el.querySelector('#z87-range-'+key);
   if(input.value!==String(values[key]))input.value=String(values[key]);
   input.setAttribute('aria-label',t[key]);
 }
}
function findPlacement(){
 const old=document.getElementById('zavi-display-settings-v6545');
 if(old?.isConnected)return old;
 if(APP==='one'){
  const lang=document.querySelector('#zaviSettingsLanguage');
  if(lang && lang.closest('#content'))return lang.closest('.field,.settings-card,.z76-settings-group')||lang;
 }
 else{
  const theme=document.querySelector('.zavi-theme-settings');
  if(theme && theme.closest('#view'))return theme.closest('.panel,.settings-card,.z76-settings-group')||theme;
  const view=document.querySelector('#appScreen #view');
  if(view && /تنظیمات|settings|تنظیمات مدیریت|د مدیریت تنظیمات/i.test([...view.querySelectorAll('h1,h2')].slice(0,5).map(e=>e.textContent).join(' '))){
   return view.querySelector('.zavi-clean-settings-hub,.panel')||view.firstElementChild;
  }
 }
 return null;
}
function mount(){
 apply();
 const anchor=findPlacement();const current=document.getElementById('z87-three-scales');
 if(current?.isConnected){if(lastLanguage!==locale())refresh();return;}
 if(!anchor?.parentElement)return;
 const panel=render();
 anchor.insertAdjacentElement('afterend',panel);
 refresh();
}
function queue(){if(scheduled)return;scheduled=true;Promise.resolve().then(()=>{scheduled=false;mount();});}
root.dataset.z87App=APP;
apply();
window.ZaviTripleDisplaySize=Object.freeze({get:()=>({...values}),set:(key,value)=>change(key,value),limits:[MIN,MAX],isDailyPage:dailyView});
function init(){
 mount();
 const target=document.querySelector(APP==='one'?'#content':'#appScreen')||document.body;
 if(target)new MutationObserver(queue).observe(target,{childList:true,subtree:true});
 document.addEventListener('change',e=>{if(e.target.matches('#zaviSettingsLanguage,#zaviAdminLanguage,#zaviTopLanguage,[name="language"]'))refresh()});
 document.addEventListener('click',()=>{root.classList.toggle('z87-daily-active',dailyView())},true);
 window.addEventListener('storage',e=>{if(e.key===KEY){try{const raw=JSON.parse(e.newValue);for(const k of Object.keys(values))values[k]=sanitize(raw[k]);persist();apply();refresh()}catch(_){}}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
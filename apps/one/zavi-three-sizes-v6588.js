/* ZAVI ONE 65.88 / ADMIN 1.4.34 — unified accessible three independent sliders.
   Existing app data, locale, theme, cloud, and business logic are untouched.
   No zoom(), body transform, viewport width override, or external dependencies. */
(()=>{'use strict';
const APP=document.currentScript?.getAttribute('data-zavi-app')==='admin'?'admin':'one';
const MIN=50,MAX=150,STEP=5;
const KEY={text:'zavi_'+APP+'_size_text_v6588',system:'zavi_'+APP+'_size_system_v6588',icons:'zavi_'+APP+'_size_icons_v6588'};
const defaults={text:100,system:100,icons:100};
const lex={
 fa:{heading:'اندازه و نمایش سیستم',hint:'هر بخش را جداگانه کوچک یا بزرگ کنید؛ بدون کوچک‌شدن صفحه و خراب‌شدن چیدمان.',
      text:'اندازۀ متن‌ها',textHint:'عنوان‌ها، متن‌ها و نوشته‌های دکمه‌ها',
      system:'اندازۀ بخش‌های سیستم',systemHint:'دکمه‌ها، کارت‌ها و فاصله‌های صفحه',
      icons:'اندازۀ آیکن‌ها',iconsHint:'آیکن‌های منوها و دکمه‌ها',
      close:'بستن تنظیم اندازه',open:'بازکردن تنظیم اندازه',reset:'عادی ۱۰۰٪',smaller:'کوچک‌تر',larger:'بزرگ‌تر',
      resetAll:'بازگشت هر سه به ۱۰۰٪',size:'تغییر اندازه',summary:'تنظیم سه اندازۀ مستقل از ۵۰ تا ۱۵۰ درصد'},
 ps:{heading:'د سیسټم د ښودلو اندازې',hint:'لیکنې، د سیسټم برخې او نښانونه هر یو په جلا ډول بدل کړئ.',
      text:'د لیکنو اندازه',textHint:'سرلیکونه، متنونه او د تڼیو لیکنې',
      system:'د سیسټم برخو اندازه',systemHint:'تڼۍ، کارتونه او واټنونه',
      icons:'د نښانونو اندازه',iconsHint:'د مینو او تڼیو نښانونه',
      close:'د اندازو تنظیم بندول',open:'د اندازو تنظیم پرانیستل',reset:'عادي ۱۰۰٪',smaller:'کوچنی',larger:'لوی',
      resetAll:'درې واړه ۱۰۰٪ ته ستنول',size:'اندازه بدلول',summary:'له ۵۰ تر ۱۵۰ سلنې درې خپلواک اندازې'},
 en:{heading:'Display and size',hint:'Adjust text, interface size and icons separately without shrinking the page.',
      text:'Text size',textHint:'Headings, body text and button labels',
      system:'Interface size',systemHint:'Cards, buttons and spacing',
      icons:'Icon size',iconsHint:'Navigation and button icons',
      close:'Close size controls',open:'Open size controls',reset:'Normal 100%',smaller:'Smaller',larger:'Larger',
      resetAll:'Reset all three to 100%',size:'Adjust size',summary:'Three independent scales from 50 to 150 percent'}
};
const clamp=v=>Math.max(MIN,Math.min(MAX,Math.round(Number(v)/STEP)*STEP));
const safe=v=>Number.isFinite(Number(v))?clamp(v):100;
const values={...defaults};
let expanded=true,lastLang='',observerScheduled=false;
try{
 if(APP==='one'){
  const old=localStorage.getItem('zavi_display_percent_v6545');
  if(old!==null)values.system=safe(old);
  for(const k of ['text','system','icons']){const prior=localStorage.getItem('zavi_size_'+k+'_v6587');if(prior!==null)values[k]=safe(prior)}
 }else{
  const previous=localStorage.getItem('zavi_admin_three_sizes_v6587');
  if(previous){const parsed=JSON.parse(previous);for(const k of ['text','system'])if(parsed[k]!=null)values[k]=safe(parsed[k]);}
 }
 for(const k of Object.keys(KEY)){let stored=localStorage.getItem(KEY[k]);if(stored!==null)values[k]=safe(stored)}
}catch(_){}
function lang(){
 const f=document.querySelector('#zaviSettingsLanguage,#zaviAdminLanguage,#zaviTopLanguage,#zaviGateLanguage,[name="language"]');
 const raw=String(f?.value||document.documentElement.lang||'fa').toLowerCase().trim();
 return raw.startsWith('en')?'en':raw.startsWith('ps')?'ps':'fa';
}
function apply(){
 const root=document.documentElement;
 root.style.removeProperty('zoom');
 root.style.setProperty('--z87-text-scale',String(values.text/100));
 root.style.setProperty('--z87-system-scale',String(values.system/100));
 root.style.setProperty('--z87-icon-scale',String(values.icons/100));
 root.style.setProperty('--z87-text-ratio',String(values.text/100));
 root.style.setProperty('--z87-system-ratio',String(values.system/100));
 root.style.setProperty('--z86-ui-scale',String(values.system/100));
 root.classList.remove('z87-daily-active');
 root.dataset.zaviTextPercent=String(values.text);
 root.dataset.zaviDisplayPercent=String(values.system);
 root.dataset.zaviIconPercent=String(values.icons);
}
function store(k,v){
 if(!Object.prototype.hasOwnProperty.call(KEY,k))return;
 values[k]=safe(v);
 try{localStorage.setItem(KEY[k],String(values[k]));if(k==='system'&&APP==='one')localStorage.setItem('zavi_display_percent_v6545',String(values[k]))}catch(_){}
 apply();refresh();
}
function panelMarkup(){
 return '<div class="z87-head"><h3 class="z87-heading"></h3><button type="button" class="z87-toggle" aria-controls="z88-body" aria-expanded="true"></button></div>'+
 '<p class="z87-summary"></p>'+
 '<div class="z87-body" id="z88-body">'+
 ['text','system','icons'].map(k=>'<div class="z87-row" data-size-row="'+k+'">'+
 '<div class="z87-label-line"><div><label for="z87-'+k+'" class="z87-title"></label><p class="z87-hint"></p></div><output class="z87-value" for="z87-'+k+'">100%</output></div>'+
 '<input class="z87-slider" type="range" id="z87-'+k+'" min="50" max="150" step="5" value="100" data-size-key="'+k+'">'+
 '<div class="z87-ticks"><span>50%</span><span>100%</span><span>150%</span></div>'+
 '<div class="z87-actions"><button type="button" class="z87-step" data-step-key="'+k+'" data-dir="-1">−</button>'+
 '<button type="button" class="z87-reset-one" data-reset-key="'+k+'"></button>'+
 '<button type="button" class="z87-step" data-step-key="'+k+'" data-dir="1">+</button></div></div>').join('')+
 '<button type="button" class="z87-reset-all"></button></div>';
}
function refresh(){
 const p=document.getElementById('z88-size-settings');if(!p)return;
 const tr=lex[lang()];
 p.setAttribute('aria-label',tr.heading);
 p.querySelector('.z87-heading').textContent=tr.heading;
 p.querySelector('.z87-summary').textContent=tr.hint;
 p.querySelector('.z87-toggle').textContent=expanded?tr.close:tr.open;
 p.querySelector('.z87-toggle').setAttribute('aria-expanded',String(expanded));
 p.querySelector('.z87-body').hidden=!expanded;
 for(const key of Object.keys(KEY)){
  const row=p.querySelector('[data-size-row="'+key+'"]');
  row.querySelector('.z87-title').textContent=tr[key];
  row.querySelector('.z87-hint').textContent=tr[key+'Hint'];
  row.querySelector('.z87-value').textContent=values[key]+'%';
  const slider=row.querySelector('.z87-slider');
  slider.value=String(values[key]);slider.setAttribute('aria-label',tr.size+' — '+tr[key]);
  row.querySelector('.z87-reset-one').textContent=tr.reset;
  const [minus,plus]=row.querySelectorAll('.z87-step');
  minus.setAttribute('aria-label',tr.smaller+' — '+tr[key]);
  plus.setAttribute('aria-label',tr.larger+' — '+tr[key]);
 }
 p.querySelector('.z87-reset-all').textContent=tr.resetAll;
 lastLang=lang();
}
function findPlacement(){
 if(APP==='one'){
  const lang=document.querySelector('#zaviSettingsLanguage');
  if(!lang?.closest('#content'))return null;
  const legacy=document.getElementById('zavi-display-settings-v6545');
  if(legacy?.closest('#content'))return {anchor:legacy,before:true};
  return {anchor:lang.closest('.field,.settings-card,.z76-settings-group')||lang,before:true};
 }
 const view=document.querySelector('#appScreen #view');
 if(!view)return null;
 const theme=view.querySelector('.zavi-theme-settings');
 if(theme)return {anchor:theme.closest('.panel,.settings-card,.z76-settings-group')||theme,before:false};
 const headings=[...view.querySelectorAll('h1,h2,h3')].slice(0,8).map(e=>e.textContent||'').join(' ');
 if(!/تنظیمات|settings|د مدیریت تنظیمات|اعدادات/i.test(headings))return null;
 const anchor=view.querySelector('.zavi-clean-settings-hub,.panel,.settings-card')||view.firstElementChild;
 return anchor?{anchor,before:false}:null;
}
function mount(){
 const spot=findPlacement(),current=document.getElementById('z88-size-settings');
 if(current?.isConnected){if(lastLang!==lang())refresh();return}
 if(!spot?.anchor?.parentElement)return;
 const p=document.createElement('section');p.id='z88-size-settings';p.className='z87-panel z88-panel';
 p.innerHTML=panelMarkup();
 spot.anchor.insertAdjacentElement(spot.before?'beforebegin':'afterend',p);
 p.addEventListener('input',e=>{const k=e.target?.dataset?.sizeKey;if(k)store(k,e.target.value)});
 p.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.classList.contains('z87-toggle')){expanded=!expanded;refresh();return}
  if(b.classList.contains('z87-reset-all')){for(const k of Object.keys(KEY))store(k,100);return}
  const changeKey=b.dataset.stepKey;
  if(changeKey&&Object.prototype.hasOwnProperty.call(KEY,changeKey)){store(changeKey,values[changeKey]+STEP*Number(b.dataset.dir));return}
  const key=b.dataset.resetKey;if(key)store(key,100);
 });
 refresh();
}
function schedule(){if(observerScheduled)return;observerScheduled=true;Promise.resolve().then(()=>{observerScheduled=false;mount()})}
apply();
if(APP==='one')window.ZaviDisplayScale=Object.freeze({get:()=>values.system,set:n=>store('system',n),limits:[MIN,MAX]});
window.ZaviDisplaySettingsV6588=Object.freeze({get:k=>values[k],set:(k,v)=>store(k,v),reset:()=>{for(const k of Object.keys(KEY))store(k,100)},limits:[MIN,MAX]});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mount();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})},{once:true});
else {mount();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})}
document.addEventListener('change',e=>{if(e.target.matches('#zaviSettingsLanguage,#zaviAdminLanguage,#zaviTopLanguage,[name="language"]'))refresh()});
window.addEventListener('storage',e=>{for(const k of Object.keys(KEY)){if(e.key===KEY[k]&&e.newValue!==null){values[k]=safe(e.newValue);apply();refresh()}}});
})();

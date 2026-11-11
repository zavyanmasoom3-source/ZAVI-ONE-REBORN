/* ZAVI ONE: one canonical settings hub. Moves live nodes; keeps original handlers and forms. */
(()=>{'use strict';
// The ONE and only owner-approved settings regrouping engine.
window.ZaviUnifiedSettingsApproved=true;
const order=['store','look','cloud','security','invoice','subscription','advanced'];
const D={
fa:{title:'تنظیمات',desc:'تنظیمات فروشگاه در یک جای مرتب',search:'جستجو در تنظیمات',placeholder:'نام تنظیم را بنویسید...',help:'یک بخش را باز کنید.',none:'موردی یافت نشد.',found:'تنظیم پیدا شد',groups:[
 ['store','فروشگاه و کسب‌وکار','پروفایل، نام و نوع تجارت'],
 ['look','ظاهر، زبان و اندازه‌ها','دری، پشتو، انگلیسی و سه حالت'],
 ['cloud','ابر و دستگاه‌ها','حساب ابری، آفلاین، دستگاه‌ها'],
 ['security','امنیت و همکاران','PIN، اثر انگشت و مجوزها'],
 ['invoice','حسابداری و فاکتورها','حساب‌ها، ارز، چاپ و رسید'],
 ['subscription','اشتراک و پشتیبانی','اعتبار، تمدید و واتساپ'],
 ['advanced','پیشرفته و نگهداری','پشتیبان، سلامت و ابزارها']]},
ps:{title:'تنظیمات',desc:'د دوکان تنظیمات په یوه منظم ځای کې',search:'تنظیمات ولټوئ',placeholder:'د تنظیم نوم ولیکئ...',help:'یوه برخه پرانیزئ.',none:'څه ونه موندل شول.',found:'تنظیم وموندل شو',groups:[
 ['store','دوکان او کاروبار','پروفایل، نوم او د کاروبار ډول'],
 ['look','بڼه، ژبه او اندازې','دري، پښتو، انګلیسي او درې حالتونه'],
 ['cloud','کلاوډ او وسایل','کلاوډ، آفلاین او وسایل'],
 ['security','امنیت او همکاران','PIN، ګوتې نښه او اجازې'],
 ['invoice','حسابداري او بلونه','حسابونه، اسعار، چاپ او رسیدونه'],
 ['subscription','ګډون او ملاتړ','اعتبار، تمدید او واټساپ'],
 ['advanced','پرمختللي او ساتنه','بیک اپ، روغتیا او وسایل']]},
en:{title:'Settings',desc:'Everything for your shop, neatly organized',search:'Search settings',placeholder:'Find a setting...',help:'Open a section to begin.',none:'No matching settings.',found:'matching settings',groups:[
 ['store','Store & business','Profile, shop name and business type'],
 ['look','Appearance, language & sizes','Dari, Pashto, English and three themes'],
 ['cloud','Cloud & devices','Cloud account, offline and devices'],
 ['security','Security & colleagues','PIN, biometrics and permissions'],
 ['invoice','Accounting & invoices','Accounts, currencies, printing'],
 ['subscription','Subscription & support','Validity, renewal and WhatsApp'],
 ['advanced','Advanced & maintenance','Backup, integrity and tools']]}
};
const icons={store:'🏬',look:'🎨',cloud:'☁',security:'🔒',invoice:'🧾',subscription:'💬',advanced:'⚙'};

function locale(){const v=(document.documentElement.lang||document.querySelector('#zaviTopLanguage')?.value||'fa-AF').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'}
function group(el){
 const s=String(el.querySelector('h1,h2,h3,h4')?.textContent||el.getAttribute('aria-label')||'').trim().toLowerCase();
 const key=String(el.id||'')+' '+String(el.className||'');
 if(el.dataset.zaviSettingsGroup)return el.dataset.zaviSettingsGroup;
 if(/profile|avatar|پروفایل|پېژندپاڼه/i.test(s+' '+key))return 'store';
 if(/z20CloudPanel|z652DevicePanel|device|sync/i.test(key)||/دستگاه|همگام|کلاوډ|cloud|device|offline/i.test(s))return 'cloud';
 if(/اشتراک|پشتیبانی|تمدید|trial|subscription|renew|support|ګډون/i.test(s+' '+key))return 'subscription';
 if(/رمز|امنیت|قفل|دسترسی|همکار|اثر انگشت|security|pin|permission|staff|biometric/i.test(s+' '+key))return 'security';
 if(/فونت|ظاهر|زبان|شخصی‌سازی|انیمیشن|theme|appearance|language|font|رنګ|ژبه|size|zui-preferences|تقویم/i.test(s+' '+key))return 'look';
 if(/فاکتور|چاپ|رسید|صندوق|قیمت|حساب‌های نقدی|invoice|print|receipt|accounting|thermal|barcode/i.test(s+' '+key))return 'invoice';
 if(/دکان|فروشگاه|نوع تجارت|تجارت عمومی|کسب‌وکار|quick start|shop|business|store/i.test(s+' '+key))return 'store';
 return 'advanced';
}
const eligible='section.settings-card,div.settings-card,section.z20-panel,#z652DevicePanel,#z20CloudPanel,#z76-profile-card,#z74-workspace,#zavi-theme-controls,.z70-store-card,.z72-trial-card,.z72-ai-entry,.zui-preferences,.zavi-date-settings,.z643-workflow,.z6524-launch';
function removeBulkActions(root){
 root.querySelectorAll('#zaviEnableAllFeatures,.zavi-enable-all').forEach(x=>x.remove());
 root.querySelectorAll('button,a').forEach(x=>{const t=x.textContent.replace(/\s+/g,' ').trim();if(/^(همه بخش‌ها|همه بخش ها|نمایش همه بخش‌ها|روشن‌کردن تمام بخش‌ها و امکانات)$/u.test(t))x.remove()});
}
function shorten(root){
 if(locale()!=='fa')return;
 const map={'فونت دلخواه خود را انتخاب کنید؛ این انتخاب برای همین حساب در این دستگاه محفوظ می‌ماند.':'فونت دلخواه را انتخاب کنید.','تنظیم بخش‌ها و امکانات فروشگاه.':'مدیریت امکانات','زبان و بخش‌های دلخواه خود را انتخاب کنید.':'زبان و بخش‌ها را انتخاب کنید.'};
 root.querySelectorAll('p,.tiny-note').forEach(el=>{if(el.children.length)return;const r=map[el.textContent.trim()];if(r)el.textContent=r});
}
/* Repaint the eight native group headings after instant Dari/Pashto/English
 * switching. The live controls inside each group must not be re-created. */
function translateHub(hub){
 if(!hub?.isConnected)return;
 const dict=D[locale()],current=hub.dataset.locale;
 if(current===locale())return;
 hub.dataset.locale=locale();
 const title=hub.querySelector('.zavi-clean-settings-title');
 if(title){
  title.querySelector('strong').textContent=dict.title;
  title.querySelector('span').textContent=dict.desc;
 }
 const label=hub.querySelector('label[for="zaviCleanSettingsSearch"]');
 if(label)label.textContent=dict.search;
 const input=hub.querySelector('#zaviCleanSettingsSearch');
 if(input)input.placeholder=dict.placeholder;
 for(const [key,name,description] of dict.groups){
  const group=hub.querySelector('.zavi-clean-settings-group[data-group="'+key+'"]');
  const summary=group?.querySelector(':scope > summary');
  if(summary){
   summary.children[0].textContent=name;
   summary.children[1].textContent=description;
  }
 }
 if(input)search(hub,input.value);
}
function counts(hub){
 hub.querySelectorAll('.zavi-clean-settings-group').forEach(d=>{
  const n=d.querySelector('.zavi-clean-settings-stack')?.children.length||0;
  d.querySelector('.zavi-clean-count').textContent=n||'';
  d.hidden=n===0;
 });
}
function enhance(){
 const root=document.getElementById('content');if(!root)return;
 let hub=root.querySelector(':scope > .zavi-clean-settings-hub');
 if(!hub){
  const candidate=[...root.children].filter(el=>el.matches?.(eligible));
  if(candidate.length<5)return;
  const lang=D[locale()];hub=document.createElement('section');hub.className='zavi-clean-settings-hub';
  hub.innerHTML='<div class="zavi-clean-settings-title"><strong></strong><span></span></div><label class="zavi-clean-search-label" for="zaviCleanSettingsSearch"></label><input type="search" id="zaviCleanSettingsSearch" autocomplete="off"><p class="zavi-clean-search-help"></p><div class="zavi-clean-settings-groups"></div>';
  hub.querySelector('strong').textContent=lang.title;hub.querySelector('.zavi-clean-settings-title span').textContent=lang.desc;
  hub.querySelector('label').textContent=lang.search;hub.querySelector('input').placeholder=lang.placeholder;hub.querySelector('.zavi-clean-search-help').textContent=lang.help;
  candidate[0].before(hub);
  const list=hub.querySelector('.zavi-clean-settings-groups');
  for(const [id,title,sub] of lang.groups){
   const d=document.createElement('details');d.className='zavi-clean-settings-group';d.dataset.group=id;
   const summary=document.createElement('summary');summary.innerHTML='<span></span><small></small><span class="zavi-clean-count"></span>';
   summary.children[0].textContent=title;summary.children[1].textContent=sub;d.append(summary);
   const body=document.createElement('div');body.className='zavi-clean-settings-stack';d.append(body);list.append(d);
  }
  // All categories are collapsed on entry to match the approved settings index.
  hub.querySelector('input').addEventListener('input',e=>search(hub,e.target.value));
 }
 // Import only direct children; keep existing elements, form state and attached listeners.
 const list=hub.querySelector('.zavi-clean-settings-groups');
 const candidates=[...root.children].filter(el=>el!==hub&&el.matches?.(eligible));
 for(const el of candidates){
  shorten(el);
  const id=group(el);
  list.querySelector('[data-group="'+id+'"] .zavi-clean-settings-stack').append(el);
 }
 // Reconcile widgets injected later by legacy enhancement scripts, without cloning handlers.
 for(const el of [...hub.querySelectorAll('.zavi-clean-settings-stack > *')]){
  const id=group(el);
  const target=list.querySelector('[data-group="'+id+'"] .zavi-clean-settings-stack');
  if(target&&el.parentElement!==target)target.append(el);
 }
 // Do not remove any native action: every settings control remains mounted and operational.
 counts(hub);
 translateHub(hub);
}
function search(hub,query){
 const lang=D[locale()],q=query.trim().toLowerCase();let total=0;
 for(const d of hub.querySelectorAll('.zavi-clean-settings-group')){
  let count=0;const cards=d.querySelectorAll(':scope > .zavi-clean-settings-stack > *');
  cards.forEach(card=>{const ok=!q||String(card.textContent||'').toLowerCase().includes(q);card.hidden=!ok;if(ok)count++});
  d.hidden=count===0;if(q&&count)d.open=true;total+=count;
 }
 hub.querySelector('.zavi-clean-search-help').textContent=q?(total+' '+(total?lang.found:lang.none)):lang.help;
}
function ready(){
 const root=document.getElementById('content');if(!root)return;let queued=false;
 new MutationObserver(ms=>{
  if(!ms.some(m=>m.target===root&&m.type==='childList'))return;
  if(queued)return;queued=true;
  queueMicrotask(()=>{queued=false;try{enhance()}catch(e){console.warn('ZAVI Settings:',e)}});
 }).observe(root,{childList:true});
 enhance();
 function updateLocale(){
  const hub=root.querySelector(':scope > .zavi-clean-settings-hub');
  if(hub)translateHub(hub);
 }
 document.addEventListener('zavi:language-change',updateLocale);
 document.addEventListener('change',event=>{
  if(['zaviTopLanguage','zaviSettingsLanguage','zaviGateLanguage'].includes(event.target?.id))
   requestAnimationFrame(updateLocale);
 });
 new MutationObserver(updateLocale).observe(document.documentElement,{
  attributes:true,attributeFilter:['lang']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();

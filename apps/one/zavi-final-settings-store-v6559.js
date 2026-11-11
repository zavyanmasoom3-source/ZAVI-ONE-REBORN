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
 updateFeatureLanguage(hub);
 if(input)search(hub,input.value);
}

/* Keep the original form nodes: never clone forms, listeners, values or permissions.
   A compact disclosure wraps each native setting, including rare and legacy actions. */
const featureLabels={
 profile:['پروفایل و عکس من','زما پروفایل او عکس','My profile & photo'],
 shop:['معلومات و لوگوی فروشگاه','د دوکان معلومات او لوګو','Store details & logo'],
 rename:['تغییر نام فروشگاه','د دوکان نوم بدلول','Rename store'],
 modules:['زبان و نمایش بخش‌ها','ژبه او د برخو ښودنه','Language & visible modules'],
 font:['فونت نوشته‌ها','د لیکنو فونټ','Text fonts'],
 theme:['حالت‌های روشن، تاریک و شیشه‌ای','روښانه، تیاره او ښیښه‌یي بڼې','Light, dark & glass modes'],
 design:['رنگ و چیدمان','رنګ او جوړښت','Colours & layout'],
 pin:['قفل و رمز خصوصی','قفل او پټ رمز','App lock & PIN'],
 invoice:['قالب فاکتور و رسید','د بل او رسید بڼه','Invoice & receipt template'],
 accounts:['صندوق و حساب‌های پول','صندوق او د پیسو حسابونه','Cashbox & money accounts'],
 health:['بررسی سلامت حسابداری','د حسابدارۍ روغتیا','Accounting integrity check'],
 backup:['گرفتن و بازیابی پشتیبان','بیک اپ او بېرته راګرځول','Backup & restore'],
 reset:['پاک‌کردن اطلاعات (حساس)','د معلوماتو پاکول (حساس)','Erase data (sensitive)'],
 cloud:['حساب ابری و ورود','کلاوډ حساب او ننوتل','Cloud account & sign-in'],
 devices:['دستگاه‌ها و همگام‌سازی','وسایل او همغږي','Devices & sync'],
 support:['پشتیبانی و تمدید','ملاتړ او تمدید','Support & renewal'],
 business:['نوع تجارت و امکانات','د کاروبار ډول او امکانات','Business type & tools'],
 care:['بررسی و راهنمای سیستم','د سیستم کتنه او مرسته','System health & help']
};
const languageIndex=()=>locale()==='en'?2:locale()==='ps'?1:0;
function featureId(el){
 const key=String(el.id||'')+' '+String(el.className||'');
 if(/z76-profile-card|z70-store-card/.test(key))return 'profile';
 if(el.querySelector('#shopForm'))return 'shop';
 if(el.querySelector('#zaviRenameShopForm'))return 'rename';
 if(el.querySelector('#zaviSettingsLanguage'))return 'modules';
 if(el.querySelector('#z6515FontChoice'))return 'font';
 if(el.querySelector('#z637DesignForm'))return 'design';
 if(/zavi-theme-settings|zavi-theme-controls/.test(key))return 'theme';
 if(el.querySelector('#zawiChangePin'))return 'pin';
 if(el.querySelector('#zaviIntegrityCheckV636'))return 'health';
 if(el.querySelector('#importFile'))return 'backup';
 if(el.querySelector('[data-action="reset"]')||el.textContent.includes('پاک‌کردن همه اطلاعات'))return 'reset';
 if(el.querySelector('.accounts-grid'))return 'accounts';
 if(el.querySelector('#zaviInvoiceStudio')||/z6527|invoiceStudio|invoice-design/i.test(key))return 'invoice';
 if(/z652DevicePanel|zavi-devices|zavi-device/.test(key))return 'devices';
 if(/z20CloudPanel|z20-panel|cloud-panel/i.test(key))return 'cloud';
 if(/z6524-launch|z6524Care/i.test(key))return 'care';
 if(/z72-trial-card|support|subscription/.test(key))return 'support';
 if(el.querySelector('#z644ApplySmartBusiness')||/z642-smart|zavi-business/i.test(key))return 'business';
 return '';
}
function featureName(el,identifier){
 if(identifier&&featureLabels[identifier])return featureLabels[identifier][languageIndex()];
 const head=el.querySelector('h3,h2,h4')?.textContent||el.getAttribute('aria-label')||'';
 const title=String(head).replace(/^[\s\p{Extended_Pictographic}✦★✓✒️🎨]+/gu,'').replace(/\s+/g,' ').trim();
 return title.slice(0,68)||(locale()==='en'?'Additional settings':locale()==='ps'?'نور تنظیمات':'تنظیمات بیشتر');
}
function compactLargeLists(el){
 for(const [selector,labels] of [
  ['.zavi-module-grid',['بخش‌های قابل نمایش','ښودل کېدونکې برخې','Visible sections']],
  ['.z20-grid',['امکانات تکمیلی','نورې ځانګړنې','Additional features']]
 ]){
  const grid=el.querySelector(selector);
  if(!grid||grid.closest('.zavi-settings-extra'))continue;
  const prev=grid.previousElementSibling;
  const heading=prev?.tagName==='H4'?prev:null;
  const wrapper=document.createElement('details');
  wrapper.className='zavi-settings-extra';
  const summary=document.createElement('summary');summary.textContent=labels[languageIndex()];
  wrapper.append(summary);
  (heading||grid).before(wrapper);
  if(heading)wrapper.append(heading);
  wrapper.append(grid);
 }
}
function asFeature(el){
 if(el.matches('.zavi-settings-feature'))return el;
 const id=featureId(el),category=group(el);
 compactLargeLists(el);
 const wrapper=document.createElement('details');
 wrapper.className='zavi-settings-feature';wrapper.dataset.zaviSettingsGroup=category;
 wrapper.dataset.feature=id;
 const summary=document.createElement('summary');summary.className='zavi-settings-feature-name';
 summary.textContent=featureName(el,id);
 const contents=document.createElement('div');contents.className='zavi-settings-feature-body';
 el.before(wrapper);wrapper.append(summary,contents);contents.append(el);
 return wrapper;
}
function updateFeatureLanguage(hub){
 for(const d of hub.querySelectorAll('.zavi-settings-feature')){
  const node=d.querySelector(':scope > summary'),card=d.querySelector('.zavi-settings-feature-body > *');
  if(node&&card)node.textContent=featureName(card,d.dataset.feature);
 }
 for(const d of hub.querySelectorAll('.zavi-settings-extra')){
  const titles=d.querySelector('.zavi-module-grid')
   ?['بخش‌های قابل نمایش','ښودل کېدونکې برخې','Visible sections']
   :['امکانات تکمیلی','نورې ځانګړنې','Additional features'];
  const summary=d.querySelector(':scope > summary');if(summary)summary.textContent=titles[languageIndex()];
 }
}
function unwrapOldGroups(root){
 // Legacy competing re-groupers could have fired before this module mounted.
 // Move ONLY existing DOM nodes, not HTML strings; original handlers survive.
 for(const old of [...root.querySelectorAll(':scope > .zavi-settings-6546-group,:scope > #z76-settings-groups')]){
  const cards=[...old.querySelectorAll('section.settings-card,div.settings-card,section.z6524-launch,#z74-workspace')];
  for(const card of cards)root.append(card);
  old.remove();
 }
 root.querySelectorAll(':scope > .zavi-settings-6546-intro').forEach(n=>n.remove());
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
 const settings=typeof page==='string'?page==='settings':!!root.querySelector('#shopForm');
 document.body.classList.toggle('zavi-settings-clean-active',settings);
 if(!settings)return;
 unwrapOldGroups(root);
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
  // Keep only one major section open; searching may expose several matching groups.
  for(const d of hub.querySelectorAll('.zavi-clean-settings-group'))d.addEventListener('toggle',()=>{
   if(!d.open||hub.dataset.searching==='true')return;
   hub.querySelectorAll('.zavi-clean-settings-group').forEach(other=>{if(other!==d)other.open=false});
  });
  // All categories are collapsed on entry to match the approved settings index.
  hub.querySelector('input').addEventListener('input',e=>search(hub,e.target.value));
 }
 // Import only direct children; keep existing elements, form state and attached listeners.
 const list=hub.querySelector('.zavi-clean-settings-groups');
 const candidates=[...root.children].filter(el=>el!==hub&&el.matches?.(eligible));
 for(const el of candidates){
  shorten(el);
  const wrapped=asFeature(el);
  const id=group(wrapped);
  list.querySelector('[data-group="'+id+'"] .zavi-clean-settings-stack').append(wrapped);
 }
 // The original settings renderer and later enhancement scripts still append
 // large legacy headings and info banners OUTSIDE the seven compact groups.
 // They are the cause of the double settings screen reported on the real APK.
 // Move ALL meaningful direct settings children inside the seven groups.
 // Native elements keep their original listeners, values, permissions and IDs.
 for(const el of [...root.children]){
  if(el===hub||el.matches('script,style,template'))continue;
  if(el.matches('.page-head')&&!el.querySelector('button,a,input,select,textarea,[tabindex]')){
   el.dataset.zaviLegacyHeading='true';el.hidden=true;continue;
  }
  if(el.matches('[role="dialog"],.modal,.shade,.toast,#drawerShade'))continue;
  if(!el.textContent?.trim()&&!el.querySelector('input,select,textarea,button,a,img'))continue;
  shorten(el);
  const wrapped=asFeature(el);
  const id=group(wrapped);
  list.querySelector('[data-group="'+id+'"] .zavi-clean-settings-stack').append(wrapped);
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
  cards.forEach(card=>{const hay=(String(card.textContent||'')+' '+String(card.dataset.feature||'')+' '+String(card.querySelector('[id]')?.id||'')).toLowerCase();const ok=!q||hay.includes(q);card.hidden=!ok;if(ok){count++;if(q&&card.tagName==='DETAILS')card.open=true}});
  d.hidden=count===0;if(q&&count)d.open=true;total+=count;
 }
 hub.dataset.searching=q?'true':'false';
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

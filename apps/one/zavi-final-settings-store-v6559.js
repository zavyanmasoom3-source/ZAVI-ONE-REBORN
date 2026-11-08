/* ZAVI ONE: one canonical settings hub. Moves live nodes; keeps original handlers and forms. */
(()=>{'use strict';
const order=['account','store','look','security','cloud','invoice','subscription','advanced'];
const D={
fa:{title:'تنظیمات',desc:'بخش مورد نیاز را باز کنید.',search:'جستجوی تنظیمات',placeholder:'نام تنظیم را بنویسید',help:'تمام امکانات در دسته‌های زیر محفوظ است.',none:'موردی پیدا نشد.',found:'گزینه پیدا شد',groups:[['account','حساب و پروفایل','مشخصات شخصی'],['store','فروشگاه و کسب‌وکار','نام، ارز و نوع تجارت'],['look','ظاهر و زبان','روشن، تیره، شیشه‌ای و فونت'],['security','امنیت و دسترسی','قفل، رمز و صلاحیت‌ها'],['cloud','ابر و دستگاه‌ها','همگام‌سازی و دستگاه‌ها'],['invoice','حسابداری و فاکتورها','صندوق، چاپ و رسید'],['subscription','اشتراک و پشتیبانی','تمدید و ارتباط'],['advanced','پیشرفته و پشتیبان‌گیری','ابزارهای تکمیلی']]},
en:{title:'Settings',desc:'Open the section you need.',search:'Search settings',placeholder:'Search an option',help:'All tools remain available in these sections.',none:'No matching option.',found:'matching settings',groups:[['account','Account & profile','Personal details'],['store','Store & business','Name, currency and type'],['look','Appearance & language','Light, dark, glass and fonts'],['security','Security & access','Lock, credentials and roles'],['cloud','Cloud & devices','Sync and devices'],['invoice','Accounting & invoices','Cash, printing and receipts'],['subscription','Subscription & support','Renewal and help'],['advanced','Advanced & backups','Additional tools']]},
ps:{title:'تنظیمات',desc:'اړینه برخه پرانیزئ.',search:'تنظیمات ولټوئ',placeholder:'د انتخاب نوم ولیکئ',help:'ټول امکانات په دې برخو کې خوندي دي.',none:'څه ونه موندل شول.',found:'انتخابونه وموندل شول',groups:[['account','حساب او پېژندپاڼه','شخصي معلومات'],['store','دوکان او کاروبار','نوم، پیسې او ډول'],['look','بڼه او ژبه','رڼا، تیاره، ښیښه‌یي او فونټ'],['security','امنیت او لاسرسی','قفل، رمز او اجازې'],['cloud','کلاوډ او وسایل','همغږي او وسایل'],['invoice','حسابداري او بلونه','صندوق، چاپ او رسیدونه'],['subscription','ګډون او ملاتړ','تمدید او مرسته'],['advanced','پرمختللي او بیک اپ','نور وسایل']]}
};
function locale(){const v=(document.querySelector('#zaviTopLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'}
function group(el){
 const s=String(el.querySelector('h1,h2,h3,h4')?.textContent||el.getAttribute('aria-label')||'').trim().toLowerCase();
 const key=String(el.id||'')+' '+String(el.className||'');
 if(/profile|avatar|پروفایل|پېژندپاڼه/i.test(s+' '+key))return 'account';
 if(/z20CloudPanel|z652DevicePanel|device|sync/i.test(key)||/دستگاه|همگام|کلاوډ|cloud|device|offline/i.test(s))return 'cloud';
 if(/اشتراک|پشتیبانی|تمدید|trial|subscription|renew|support|ګډون/i.test(s+' '+key))return 'subscription';
 if(/رمز|امنیت|قفل|دسترسی|همکار|اثر انگشت|security|pin|permission|staff|biometric/i.test(s+' '+key))return 'security';
 if(/فونت|ظاهر|زبان|شخصی‌سازی|انیمیشن|theme|appearance|language|font|رنګ|ژبه|size|zui-preferences|تقویم/i.test(s+' '+key))return 'look';
 if(/فاکتور|چاپ|رسید|صندوق|قیمت|حساب‌های نقدی|invoice|print|receipt|accounting|thermal|barcode/i.test(s+' '+key))return 'invoice';
 if(/دکان|فروشگاه|نوع تجارت|تجارت عمومی|کسب‌وکار|quick start|shop|business|store/i.test(s+' '+key))return 'store';
 return 'advanced';
}
const eligible='section.settings-card,section.z20-panel,#z652DevicePanel,.z70-store-card,.z72-trial-card,.z72-ai-entry,.zui-preferences,.zavi-date-settings,.z643-workflow,.z6524-launch';
function removeBulkActions(root){
 root.querySelectorAll('#zaviEnableAllFeatures,.zavi-enable-all').forEach(x=>x.remove());
 root.querySelectorAll('button,a').forEach(x=>{const t=x.textContent.replace(/\s+/g,' ').trim();if(/^(همه بخش‌ها|همه بخش ها|نمایش همه بخش‌ها|روشن‌کردن تمام بخش‌ها و امکانات)$/u.test(t))x.remove()});
}
function shorten(root){
 if(locale()!=='fa')return;
 const map={'فونت دلخواه خود را انتخاب کنید؛ این انتخاب برای همین حساب در این دستگاه محفوظ می‌ماند.':'فونت دلخواه را انتخاب کنید.','تنظیم بخش‌ها و امکانات فروشگاه.':'مدیریت امکانات','زبان و بخش‌های دلخواه خود را انتخاب کنید.':'زبان و بخش‌ها را انتخاب کنید.'};
 root.querySelectorAll('p,.tiny-note').forEach(el=>{if(el.children.length)return;const r=map[el.textContent.trim()];if(r)el.textContent=r});
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
  const first=list.querySelector('[data-group="store"]');if(first)first.open=true;
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
 if(candidates.length)removeBulkActions(hub);
 counts(hub);
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
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();

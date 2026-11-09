/* ADMIN: compact settings without cloning, removing, or bypassing owner controls.
 * Moves existing live panels into accessible expandable groups. */
(() => {
 'use strict';
 const translations={
  fa:{title:'تنظیمات مدیریت',search:'جستجوی تنظیمات',empty:'موردی پیدا نشد.',
   appearance:['ظاهر و زبان','حالت‌های روشن و تیره'],
   security:['امنیت و رمز','مدیریت رمز خصوصی و دسترسی'],
   connection:['ابر و سرور','اتصال امن به سرور مرکزی'],
   renewal:['تمدید و اشتراک','قوانین و مدت اشتراک'],
   support:['پشتیبانی و رسیدها','پیام‌ها و اسناد'],
   advanced:['ابزارهای بیشتر','تنظیمات پیشرفته']},
  ps:{title:'د مدیریت تنظیمات',search:'تنظیمات ولټوئ',empty:'څه ونه موندل شول.',
   appearance:['بڼه او ژبه','روښانه او تیاره حالت'],
   security:['امنیت او پټنوم','د شخصي پټنوم او لاسرسي اداره'],
   connection:['کلاوډ او سرور','مرکزي سرور ته خوندي اړیکه'],
   renewal:['تمدید او ګډون','د ګډون اصول او موده'],
   support:['ملاتړ او رسیدونه','پیغامونه او اسناد'],
   advanced:['نور وسایل','پرمختللي تنظیمات']},
  en:{title:'Admin settings',search:'Search settings',empty:'No matching settings.',
   appearance:['Appearance & language','Light and dark'],
   security:['Security & password','Credentials and access controls'],
   connection:['Cloud & server','Secure central server connection'],
   renewal:['Subscriptions & renewal','Subscription rules and duration'],
   support:['Support & receipts','Messages and documents'],
   advanced:['More tools','Advanced settings']}
 };
 const order=['appearance','security','connection','renewal','support','advanced'];
 const lang=()=>{
   const value=(document.documentElement.lang||'fa-AF').toLowerCase();
   return value.startsWith('en')?'en':value.startsWith('ps')?'ps':'fa';
 };
 function classify(panel){
   if(panel.classList.contains('zui-preferences'))return 'appearance';
   const title=(panel.querySelector('h2,h3')?.textContent||'').toLowerCase();
   const full=(title+' '+(panel.id||'')+' '+panel.className).toLowerCase();
   if(/ظاهر|theme|بڼه|language|ژبه/.test(full))return 'appearance';
   if(/رمز|پټنوم|امنیت|security|password|reset|بازیابی/.test(full))return 'security';
   if(/اتصال|آدرس|url|server|سرور|کلاوډ|ابر/.test(full))return 'connection';
   if(/قوانین تمدید|تمدید|ګډون|renewal|subscription/.test(full))return 'renewal';
   if(/پیام|receipt|رسید|support|ملاتړ|پشتیبانی/.test(full))return 'support';
   return 'advanced';
 }
 function updateText(hub){
   const dict=translations[lang()];
   hub.querySelector('[data-zah-title]').textContent=dict.title;
   hub.querySelector('[data-zah-search]').textContent=dict.search;
   const input=hub.querySelector('[data-zah-input]');
   input.placeholder=dict.search;
   hub.querySelectorAll('[data-zah-group]').forEach(group=>{
     const id=group.dataset.zahGroup;
     group.querySelector('[data-zah-name]').textContent=dict[id][0];
     group.querySelector('[data-zah-desc]').textContent=dict[id][1];
   });
   filter(hub,input.value);
 }
 function filter(hub,raw){
   const query=raw.trim().toLocaleLowerCase();
   let count=0;
   hub.querySelectorAll('[data-zah-group]').forEach(section=>{
     let visible=0;
     const panels=section.querySelectorAll(':scope > .zavi-admin-settings-body > *');
     panels.forEach(panel=>{
       const matches=!query||String(panel.textContent||'').toLocaleLowerCase().includes(query)||
         section.querySelector('[data-zah-name]').textContent.toLocaleLowerCase().includes(query);
       panel.hidden=!matches;
       if(matches)visible++;
     });
     section.hidden=!visible;
     if(visible && query)section.open=true;
     count+=visible;
   });
   const empty=hub.querySelector('[data-zah-empty]');
   empty.hidden=!!count;
   empty.textContent=translations[lang()].empty;
 }
 function arrange(){
   const view=document.getElementById('view');
   if(!view)return;
   const active=document.querySelector('.nav-item.selected[data-page="settings"]');
   if(!active)return;
   let hub=view.querySelector(':scope > [data-zavi-admin-settings-hub]');
   if(!hub){
     const panels=[...view.children].filter(el=>el.matches('section.panel'));
     if(panels.length<4)return;
     hub=document.createElement('section');
     hub.className='zavi-admin-settings-hub';
     hub.dataset.zaviAdminSettingsHub='true';
     const heading=document.createElement('div');heading.className='zavi-admin-settings-heading';
     heading.innerHTML='<strong data-zah-title></strong><label data-zah-search for="zaviAdminSettingsSearch"></label>';
     const input=document.createElement('input');input.type='search';
     input.id='zaviAdminSettingsSearch';input.dataset.zahInput='true';
     input.autocomplete='off';input.setAttribute('aria-label','Search admin settings');
     heading.append(input);hub.append(heading);
     const groups=document.createElement('div');groups.className='zavi-admin-settings-groups';
     for(const name of order){
       const item=document.createElement('details');
       item.className='zavi-admin-settings-group';
       item.dataset.zahGroup=name;
       if(name==='appearance')item.open=true;
       const summary=document.createElement('summary');
       summary.innerHTML='<strong data-zah-name></strong><small data-zah-desc></small>';
       const body=document.createElement('div');body.className='zavi-admin-settings-body';
       item.append(summary,body);groups.append(item);
     }
     hub.append(groups);
     const empty=document.createElement('p');empty.dataset.zahEmpty='true';
     empty.className='zavi-admin-settings-empty';empty.hidden=true;
     hub.append(empty);
     panels[0].before(hub);
     input.addEventListener('input',()=>filter(hub,input.value));
   }
   // Move original nodes, retaining inputs, form state and event handlers.
   const candidates=[...view.children].filter(el=>el.matches('section.panel,.zui-preferences'));
   for(const panel of candidates){
     const where=classify(panel);
     hub.querySelector('[data-zah-group="'+where+'"] > .zavi-admin-settings-body').append(panel);
   }
   updateText(hub);
 }
 let queued=false;
 function schedule(){
   if(queued)return;
   queued=true;
   queueMicrotask(()=>{queued=false;try{arrange()}catch(e){
     console.warn('ZAVI ADMIN settings layout:',e?.message||e);
   }});
 }
 function init(){
   const view=document.getElementById('view');
   if(!view)return;
   new MutationObserver(schedule).observe(view,{childList:true});
   document.addEventListener('zavi:language-change',schedule);
   document.addEventListener('zavi:language-changed',schedule);
   schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();

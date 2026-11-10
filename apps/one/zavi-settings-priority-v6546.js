/* Settings priority layout 65.46. Preserves original input/forms and event handlers.
   Only changes arrangement when Settings is currently rendered. */
(()=>{'use strict';let busy=false;
const tr={
 fa:{head:'تنظیمات اصلی و امنیت',help:'بخش‌های مهم در بالا قرار دارند. تنظیمات پیشرفته در پایین صفحه است.',secure:'۱. امنیت و ورود',store:'۲. معلومات فروشگاه',display:'۳. ظاهر، زبان و اندازه نمایش',printing:'۴. فاکتور و چاپ',data:'۵. حساب‌ها و اطلاعات',advanced:'۶. ابزارهای پیشرفته'},
 ps:{head:'اصلي تنظیمات او امنیت',help:'مهمې برخې پورته دي. پرمختللي تنظیمات ښکته دي.',secure:'۱. امنیت او ننوتل',store:'۲. د دوکان معلومات',display:'۳. بڼه، ژبه او اندازه',printing:'۴. بیل او چاپ',data:'۵. حسابونه او معلومات',advanced:'۶. پرمختللي وسایل'},
 en:{head:'Settings & security',help:'Important settings come first; advanced tools follow below.',secure:'1. Security & access',store:'2. Store details',display:'3. Appearance & language',printing:'4. Invoices & printing',data:'5. Accounts & data',advanced:'6. Advanced tools'}
};
function locale(){const v=String(document.querySelector('#zaviSettingsLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'}
function css(){if(document.getElementById('zavi-settings-6546-style'))return;const s=document.createElement('style');s.id='zavi-settings-6546-style';s.textContent='.zavi-settings-6546-title{font:800 20px/1.5 Tahoma,Arial,sans-serif!important;letter-spacing:0;color:var(--text,inherit);margin:18px 0 6px}.zavi-settings-6546-help{font-size:13px;line-height:1.8;opacity:.75;margin:0 0 14px}.zavi-settings-6546-group{width:100%;min-width:0;margin:0 0 20px;padding:0;border:0}.zavi-settings-6546-group>h3{font-size:15px;line-height:1.8;font-weight:900;margin:18px 0 10px;padding:8px 12px;border-inline-start:4px solid #1494d3;background:rgba(31,124,170,.07);border-radius:6px}.zavi-settings-6546-group>.settings-card{margin:0 0 12px}.zavi-settings-6546-group>details{padding:10px;border-radius:10px}.zavi-settings-6546-group>details>summary{cursor:pointer;font-weight:700;padding:10px}.zavi-settings-6546-group>details>div{padding:4px 0}@media(max-width:540px){.zavi-settings-6546-group>h3{font-size:14px}}';document.head.appendChild(s)}
function category(card){
 const selectors=[
 ['secure','#zawiChangePin,#zavi-biometric-preferences-v6546'],
 ['store','#shopForm,#zaviRenameShopForm,#z644ApplySmartBusiness'],
 ['display','#zaviSettingsLanguage,#zavi-display-settings-v6545,.zavi-theme-picker,#z6515FontChoice'],
 ['printing','#z644ThermalForm,[id*="invoiceDesign"],[id*="InvoiceDesign"],[id*="printPrefs"]'],
 ['data','#usdRateForm,#importFile,#zaviIntegrityCheckV636'],
 ];
 for(const [name,selector] of selectors)if(card.matches(selector)||card.querySelector(selector))return name;
 const h=(card.querySelector('h3')?.textContent||'').toLowerCase();
 if(/فاکتور|چاپ|invoice|پرنتر|print/.test(h))return 'printing';
 if(/پشتیبان|backup|حساب|دالر|account|data/.test(h))return 'data';
 if(/مدیریت عمومی|تجارت|کسب‌وکار|shop/.test(h))return 'store';
 if(/ظاهر|فونت|زبان|theme|language/.test(h))return 'display';
 if(/امنیت|رمز|قفل|security|pin/.test(h))return 'secure';
 return 'advanced';
}
function arrange(){
 if(busy)return;
 const root=document.getElementById('content');
 if(!root||!root.querySelector('#zawiChangePin')||root.querySelector('.zavi-settings-6546-group'))return;
 busy=true;
 try{
  const cards=[...root.children].filter(n=>n.nodeType===1&&n.classList.contains('settings-card'));
  if(cards.length<3)return;
  css();
  const t=tr[locale()], first=cards[0];
  const intro=document.createElement('div');intro.className='zavi-settings-6546-intro';
  intro.innerHTML='<h2 class="zavi-settings-6546-title"></h2><p class="zavi-settings-6546-help"></p>';
  intro.querySelector('h2').textContent=t.head;intro.querySelector('p').textContent=t.help;
  root.insertBefore(intro,first);
  const groups=new Map();
  const order=['secure','store','display','printing','data','advanced'];
  for(const key of order){const container=document.createElement('section');container.className='zavi-settings-6546-group';container.dataset.section=key;container.setAttribute('aria-label',t[key]);const h=document.createElement('h3');h.textContent=t[key];container.append(h);groups.set(key,container)}
  for(const card of cards)groups.get(category(card)).append(card);
  const anchor=cards[cards.length-1].nextSibling;
  for(const key of order){const c=groups.get(key);if(c.children.length>1)root.insertBefore(c,anchor)}
 }finally{busy=false}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
function init(){const target=document.getElementById('content');if(!target)return;new MutationObserver(()=>arrange()).observe(target,{childList:true});arrange()}
})();

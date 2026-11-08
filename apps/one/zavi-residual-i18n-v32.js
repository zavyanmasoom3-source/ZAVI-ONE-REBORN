/* ZAVI residual i18n patch V32: fixes remaining Persian strings in English / Pashto,
   especially dynamic business management, finance helpers, and saved invoice labels. */
(()=>{'use strict';
const EXACT={
  'فقط برای نمایش قیمت‌ها و ارزش موجودی به AFN استفاده می‌شود و کاتوری‌های گذشته را تغییر نمی‌دهد.':{en:'Used only to display prices and inventory value in AFN. It does not change past records.',ps:'یوازې د بیو او موجودۍ ارزښت د AFN په بڼه ښيي او پخواني ریکارډونه نه بدلوي.'},
  '۱ دالر چند AFN؟':{en:'1 USD equals AFN:',ps:'۱ ډالر څو AFN دی؟'},
  'نرخ دلار را در تنظیمات ثبت کنید':{en:'Set the USD rate in Settings.',ps:'د ډالر نرخ په تنظیماتو کې ثبت کړئ.'},
  'گزارش سود و زیان':{en:'Profit & loss report',ps:'د ګټې او زیان راپور'},
  'سود و زیان':{en:'Profit & loss',ps:'ګټه او زیان'},
  'موجودی هوشمند':{en:'Smart inventory',ps:'هوښیار موجودي'},
  'فاکتورهای ذخیره‌شده':{en:'Saved invoices',ps:'ساتل شوي فاکتورونه'},
  'فاکتورهای دستی':{en:'Manual invoices',ps:'لاسي فاکتورونه'},
  'بازکردن مدیریت عمومی ←':{en:'Open business management ←',ps:'عمومي مدیریت پرانیزئ ←'},
  'تنظیمات و پشتیبان':{en:'Settings & backups',ps:'تنظیمات او بیک اپ'},
  'تنظیمات و پشتیبان‌گیری':{en:'Settings & backups',ps:'تنظیمات او بیک اپ'},
  'حساب قرضداران':{en:'Customer debts',ps:'د پېرودونکو پورونه'},
  'قرض‌های ما':{en:'Our payables',ps:'زموږ پورونه'},
  'روزنامچه':{en:'Daily journal',ps:'ورځپاڼه'},
  'فاکتورهای خرید و فروش':{en:'Purchase and sales invoices',ps:'د پېر او پلور فاکتورونه'}
};
const KEY=(location.pathname.includes('admin')||document.body?.dataset?.app==='admin')?'zavi_admin_language_v18':'zavi_public_language_v11';
const VALID=new Set(['fa-AF','ps-AF','en']);
const norm=s=>String(s||'').replace(/[‌‏‪-‮]/g,'').replace(/\s+/g,' ').trim();
const lang=()=>{let l='fa-AF';try{l=localStorage.getItem(KEY)||document.documentElement.getAttribute('data-zavi-lang')||'fa-AF'}catch(_){}return VALID.has(l)?l:'fa-AF'};
const pick=s=>{const row=EXACT[norm(s)];if(!row)return null;const l=lang();return l==='fa-AF'?null:(l==='en'?row.en:row.ps)};
const skip=el=>!el||el.closest('script,style,noscript,textarea,pre,code,[contenteditable],[translate="no"],[data-no-translate],[data-user-value],[data-contact-name],.user-entered,.customer-name,.prod-title');
function patchTextNode(n){if(!n||!n.nodeValue||skip(n.parentElement))return;const raw=n.nodeValue;const trimmed=raw.trim();if(!trimmed)return;const replaced=pick(trimmed);if(!replaced||replaced===trimmed)return;const lead=raw.match(/^\s*/)?.[0]||'';const tail=raw.match(/\s*$/)?.[0]||'';n.nodeValue=lead+replaced+tail;}
function patchAttrs(el){if(skip(el))return;for(const a of ['placeholder','title','aria-label','data-title','data-label','alt']){if(!el.hasAttribute(a))continue;const v=el.getAttribute(a)||'';const replaced=pick(v);if(replaced&&replaced!==v)el.setAttribute(a,replaced)}if(el instanceof HTMLInputElement&&(el.type==='button'||el.type==='submit')){const replaced=pick(el.value);if(replaced&&replaced!==el.value)el.value=replaced}}
function run(root=document.body){if(!root)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const text=[];while(walker.nextNode())text.push(walker.currentNode);text.forEach(patchTextNode);root.querySelectorAll?.('[placeholder],[title],[aria-label],[data-title],[data-label],[alt],input[type="button"],input[type="submit"]').forEach(patchAttrs)}
let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>run(document.body),120)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>run(document.body),{once:true});else run(document.body);
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label','data-title','data-label','alt','value']});
document.addEventListener('zavi:language-changed',schedule);
window.addEventListener('pageshow',schedule);
})();

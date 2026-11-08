/* ZAVI ONE 65.65 — exactly two SELLING navigation options and settings blank-page repair.
 * Visual/route presentation only. Original finance, data, security and offline code unchanged.
 */
(()=>{
'use strict';
const q=(s,p=document)=>p.querySelector(s), qa=(s,p=document)=>Array.from(p.querySelectorAll(s));
const labels={
 fa:{invoice:'ساختن فاکتور',invoiceSub:'فاکتور جدید',debts:'حساب قرضداران',debtsSub:'طلب و بدهی مشتریان',reports:'راپورها',reportsSub:'گزارش‌های مالی و فروش',inventory:'بررسی موجودی',inventorySub:'کنترول گدام',loading:'دریافت معلومات دستگاه‌ها طول کشیده است. اتصال اینترنت یا ورود ابری را بررسی کنید و «تازه‌سازی دستگاه‌ها» را بزنید.'},
 en:{invoice:'Create invoice',invoiceSub:'New sales invoice',debts:'Debtors accounts',debtsSub:'Customer balances',reports:'Reports',reportsSub:'Business and financial reports',inventory:'Stock check',inventorySub:'Inventory management',loading:'Device information is taking longer to load. Check your connection, then use Refresh devices.'},
 ps:{invoice:'رسید جوړول',invoiceSub:'د پلور نوی بل',debts:'د پور حسابونه',debtsSub:'د پېرودونکو پورونه',reports:'راپورونه',reportsSub:'د کاروبار او مالي چارو راپورونه',inventory:'د ګدام څارنه',inventorySub:'د موجودۍ کنټرول',loading:'د وسایلو معلومات لا نه دي راغلي. انټرنېټ وګورئ او وسایل بیا تازه کړئ.'}
};
function lang(){const v=(q('#zaviTopLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'}
function keyNative(k){
 const menus=qa('#sidebarLinks [data-go],#sidebarLinks2 [data-go],#side [data-go],#mobileBottom [data-go]');
 const keys={
  debtors:['debtors','debts','contacts','customers'],
  reports:['reports','report'],
  products:['products','inventory','stock']
 }[k]||[k];
 const label= k==='debtors'?/قرضداران|طلبکاران|Debtors|حساب قرضداران|پور/i:k==='reports'?/راپور|Report|گزارش/i:/محصول|گدام|Product|Stock|Inventory/i;
 const nav=menus.find(e=>keys.includes(e.dataset.go)&&
   (k!=='debtors'||/قرضداران|Debtor|پور/i.test(e.textContent||'')))||
   menus.find(e=>label.test(e.textContent||''))||
   menus.find(e=>keys.includes(e.dataset.go));
 if(nav)nav.click();
}
function retitle(btn,text,sub,icon,route){
 if(!btn)return;
 btn.removeAttribute('data-zrf-invoice');btn.removeAttribute('data-zrf-go');
 btn.removeAttribute('data-z63-quick');btn.dataset.z65Route=route;
 const title=q('b',btn)||q('.zrf-tile-copy b',btn)||q('span:not([class])',btn);
 if(title)title.textContent=text;
 const secondary=q('small',btn);if(secondary)secondary.textContent=sub;
 const symbol=q('.zrf-primary-icon,.zrf-tile-icon,.z63-quick-glyph',btn);
 if(symbol)symbol.textContent=icon;
}
function dashboard(content){
 const home=q(':scope > .zrf-home',content);if(!home)return;
 const t=labels[lang()];
 // Only top Welcome/ثبت فروش and bottom navigation/فروش remain as direct sales entry points.
 // This is the original INVOICE button; never relabel it as a second debtor shortcut.
 const invoice=q('.zrf-primary.zrf-invoice',home);
 if(invoice){
   invoice.removeAttribute('data-z65-route');
   invoice.removeAttribute('data-zrf-go');
   invoice.setAttribute('data-zrf-invoice','');
   const name=q('b',invoice),detail=q('small',invoice);
   if(name)name.textContent=t.invoice;
   if(detail)detail.textContent=t.invoiceSub;
   const glyph=q('.zrf-primary-icon',invoice);
   if(glyph)glyph.textContent='▣';
 }
 retitle(q('.zrf-primary.zrf-contact',home),t.reports,t.reportsSub,'▤','reports');
 retitle(q('.zrf-tile[data-zrf-go="sales"]',home),t.debts,t.debtsSub,'♙','debtors');
 const quick=q('.z63-quick-tile[data-z63-quick="sale"]',home);
 if(quick){
  quick.removeAttribute('data-z63-quick');quick.dataset.z65Route='products';
  const label=qa('span',quick).find(el=>!el.classList.contains('z63-quick-glyph'));
  if(label)label.textContent=t.inventory;
  const ico=q('.z63-quick-glyph',quick);if(ico)ico.textContent='⬡';
 }
 // Avoid another copy of the duplicated above-the-fold section after product reports.
 qa('.z63-quick-tile[data-z63-quick="sale"],.zrf-tile[data-zrf-go="sales"]',home)
  .forEach(el=>{el.removeAttribute('data-zrf-invoice');el.removeAttribute('data-z63-quick');el.removeAttribute('data-zrf-go')});
}
function compactSettings(content){
 const hub=q('.zavi-clean-settings-hub',content);
 if(!hub){content.classList.remove('z65-settings-page');return}
 content.classList.add('z65-settings-page');
 if(content.firstElementChild!==hub)content.prepend(hub);
 if(!hub.dataset.z65){hub.dataset.z65='1';
   // Hide truly empty legacy spacer blocks, but NEVER user forms, button or editable controls.
   for(const el of qa(':scope > *',content)){
    if(el===hub||el.querySelector('button,input,select,textarea,form,[contenteditable="true"]'))continue;
    if(el.textContent.trim().length<8&&el.getBoundingClientRect().height>220)el.classList.add('z65-empty-spacer');
   }
   // Search remains available; collapse other accordion groups for legibility.
   const groups=qa('.zavi-clean-settings-group',hub);
   for(let i=1;i<groups.length;i++)groups[i].open=false;
 }
}
function devices(content){
 // A truly loading devices endpoint must not be described as "no devices".
 // Show a small non-blocking hint only after sustained delay; existing Refresh works unchanged.
 const page=(content.textContent||'').slice(0,1200);
 if(!/دستگاه‌های حساب من|My account devices|زما د حساب وسایل/.test(page))return;
 if(!/در حال دریافت از سرور|Loading from server|له سرور څخه/.test(page))return;
 if(q('.z65-device-hint',content)||content.dataset.z65PendingDevice)return;
 content.dataset.z65PendingDevice='1';
 setTimeout(()=>{
  delete content.dataset.z65PendingDevice;
  if(!document.body.contains(content))return;
  const str=(content.textContent||'');
  if(!/در حال دریافت از سرور|Loading from server|له سرور څخه/.test(str))return;
  if(q('.z65-device-hint',content))return;
  const hint=document.createElement('p');hint.className='z65-device-hint';
  hint.textContent=labels[lang()].loading;
  const progress=qa('div,span',content).find(el=>el.children.length===0&&/در حال دریافت از سرور|Loading from server/.test(el.textContent||''));
  (progress||content.lastElementChild)?.after(hint);
 },10000);
}
let pending=false;
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{
 pending=false;
 const content=q('#content');if(!content)return;
 try{dashboard(content);compactSettings(content);devices(content)}catch(err){console.warn('ZAVI 65.65 usability patch',err)}
})}
let wantTop=false;
function routeClick(event){
 // Route changes should never preserve an old scroll offset into an unrelated Settings screen.
 const nav=event.target.closest?.('#sidebarLinks [data-go],#sidebarLinks2 [data-go],#mobileBottom [data-go],#side [data-go],[data-zrf-go],[data-z65-route]');
 if(!nav)return;
 wantTop=true;setTimeout(()=>{if(!wantTop)return;wantTop=false;
   for(const el of [document.scrollingElement,document.documentElement,document.body,q('#content'),q('.main')]){
    if(!el)continue;
    if(el===q('#content')&&el.scrollHeight<=el.clientHeight)continue;
    try{el.scrollTop=0}catch(_){}
   }
 },50);
}
function start(){
 const content=q('#content');if(!content)return;
 new MutationObserver(schedule).observe(content,{childList:true});
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-zavi-theme']});
 document.addEventListener('change',e=>{if(e.target?.id==='zaviTopLanguage')schedule()});
 document.addEventListener('click',event=>{
   const b=event.target.closest?.('[data-z65-route]');
   if(b){event.preventDefault();event.stopImmediatePropagation();keyNative(b.dataset.z65Route);routeClick(event);return}
   routeClick(event);
 },true);
 window.addEventListener('hashchange',()=>{setTimeout(()=>{try{window.scrollTo(0,0)}catch(_){};schedule()},0)});
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
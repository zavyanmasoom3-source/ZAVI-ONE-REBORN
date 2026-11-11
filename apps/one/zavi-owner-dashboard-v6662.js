/* ZAVI ONE V66.62 owner-approved dashboard: presentation-only,
   native accounting data and transaction handlers remain authoritative.
   Compact home, all sections visible, no trade guide, motion with opt-out. */
(()=>{'use strict';
const CONTENT='content';
const TEXT={
 fa:{welcome:'به ZAVI ONE خوش آمدید',title:'حساب‌های تجارت در یک نگاه',quick:'دسترسی سریع',sale:'فروش جدید',purchase:'خرید جدید',
 warehouse:'گدام',reports:'گزارش‌ها',receive:'دریافت پول',pay:'پرداخت پول',contacts:'مشتریان',barcode:'بارکد',
 summary:'خلاصهٔ حساب‌ها',money:'صندوق و حساب‌ها',charts:'فروش و اسناد',stock:'گدام و موجودی',details:'دیگر بخش‌های داشبورد',
 recent:'آخرین فعالیت‌ها',today:'امروز',month:'ماه',unavailable:'این بخش در تنظیمات غیرفعال است.'},
 ps:{welcome:'ZAVI ONE ته ښه راغلاست',title:'د سوداګرۍ حسابونه په یوه نظر',quick:'چټک لاسرسی',sale:'نوی پلور',purchase:'نوی پېرود',
 warehouse:'ګدام',reports:'راپورونه',receive:'پیسې ترلاسه کول',pay:'پیسې ورکول',contacts:'پېرودونکي',barcode:'بارکوډ',
 summary:'د حسابونو لنډیز',money:'صندوق او حسابونه',charts:'پلور او اسناد',stock:'ګدام او موجودي',details:'د ډشبورډ نورې برخې',
 recent:'وروستي فعالیتونه',today:'نن',month:'میاشت',unavailable:'دا برخه په تنظیماتو کې غیر فعاله ده.'},
 en:{welcome:'Welcome to ZAVI ONE',title:'Your accounts at a glance',quick:'Quick actions',sale:'New sale',purchase:'New purchase',
 warehouse:'Warehouse',reports:'Reports',receive:'Receive money',pay:'Pay money',contacts:'Customers',barcode:'Barcode',
 summary:'Account summary',money:'Cashbox & accounts',charts:'Sales & records',stock:'Warehouse & stock',details:'Other dashboard sections',
 recent:'Recent activity',today:'Today',month:'Month',unavailable:'This section is disabled in Settings.'}
};
const lang=()=>{const l=String(document.documentElement.lang||'fa-AF').toLowerCase();
 return l.startsWith('en')?'en':l.startsWith('ps')?'ps':'fa';};
const labels=()=>TEXT[lang()];
function node(tag,cls,txt){const el=document.createElement(tag);if(cls)el.className=cls;
 if(txt!==undefined)el.textContent=txt;return el;}
function section(name,title){
 const el=node('section','z66d-section z66d-'+name);
 el.dataset.z66DashSection=name;
 const h=node('h3','z66d-heading',title);el.append(h);return el;
}
function quickAction(label,icon,target,value){
 const el=node('button','z66d-action z66d-action-'+target);
 el.type='button';el.dataset.z66DashAction=target;
 // Native event delegation: never synthesize or post transactions in UI code.
 if(target==='sale'||target==='purchase'||target==='receive'||target==='pay')
   el.dataset.action={sale:'sale',purchase:'purchase',receive:'customer_payment',pay:'supplier_payment'}[target];
 else el.dataset.go=target==='barcode'?'products':value;
 el.innerHTML='<span class="z66d-action-icon" aria-hidden="true">'+icon+'</span>';
 el.append(node('span','z66d-action-label',label));
 return el;
}
function sourceHas(route){
 const nav=document.querySelector('#sidebarLinks [data-go="'+route+'"],#sidebarLinks2 [data-go="'+route+'"]');
 return !!nav&&!nav.disabled&&!nav.hidden;
}
// Approved: an actual, read-only invoice window from the tenant's native ledger.
// Its buttons use the application's existing data-detail/data-go handlers.
let invoiceKind='sale',invoiceQuery='';
const INV_LABELS={
 fa:{title:'نمایش فاکتورها',desc:'فروش و خرید · هجری شمسی و میلادی',sale:'فاکتور فروش',purchase:'فاکتور خرید',all:'مشاهده همه',search:'جستجوی شماره یا مشتری',empty:'در این ماه فاکتوری ثبت نشده است.',view:'دیدن فاکتور',amount:'مبلغ',date:'تاریخ'},
 ps:{title:'د بلونو ليدل',desc:'پلور او پېرود · لمریز او میلادي',sale:'د پلور بلونه',purchase:'د پېرود بلونه',all:'ټول وګورئ',search:'د بل يا پېرودونکي لټون',empty:'په دې میاشت کې بل نشته.',view:'بل وګورئ',amount:'مبلغ',date:'نېټه'},
 en:{title:'Invoices',desc:'Sales and purchases · two calendars',sale:'Sales invoices',purchase:'Purchase invoices',all:'View all',search:'Search invoice or customer',empty:'No invoices in this month.',view:'View invoice',amount:'Amount',date:'Date'}
};
function getInvoiceEntries(){
 if(typeof db==='undefined'||!Array.isArray(db.tx))return [];
 let range=null;
 try{if(typeof zaviDashboardSelectedSpan==='function')range=zaviDashboardSelectedSpan()}catch(_){}
 return db.tx.filter(t=>t&&!t.voided&&t.type===invoiceKind&&(!range||
  typeof t.date==='string'&&t.date.slice(0,10)>=range.start&&t.date.slice(0,10)<=range.end))
  .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
}
function addInvoiceCard(root){
 if(root.querySelector(':scope > .z66d-invoices'))return;
 const t=INV_LABELS[lang()],section=node('section','z66d-section z66d-invoices');
 section.dataset.z66DashSection='invoices';section.append(node('h3','z66d-heading',t.title));
 section.append(node('p','z66d-invoice-subtitle',t.desc));
 const tabs=node('div','z66d-invoice-tabs');
 for(const [kind,label] of [['sale',t.sale],['purchase',t.purchase]]){
  const button=node('button','z66d-invoice-tab',label);button.type='button';
  button.dataset.z66InvoiceKind=kind;button.setAttribute('aria-pressed',String(invoiceKind===kind));tabs.append(button);
 }
 section.append(tabs);
 const search=node('input','z66d-invoice-search');search.type='search';
 search.placeholder=t.search;search.value=invoiceQuery;search.setAttribute('aria-label',t.search);
 section.append(search);
 const list=node('div','z66d-invoice-list');section.append(list);
 const route=node('button','z66d-invoice-all',t.all);route.type='button';
 route.dataset.go=invoiceKind==='sale'?'sales':'purchases';section.append(route);
 const renderList=()=>{
  const q=invoiceQuery.toLocaleLowerCase();
  const matches=getInvoiceEntries().filter(item=>
    [item.code,item.customerName,typeof contactName==='function'?contactName(item.contactId):'']
      .some(v=>String(v||'').toLocaleLowerCase().includes(q))).slice(0,4);
  list.replaceChildren();
  if(!matches.length){list.append(node('p','z66d-invoice-empty',t.empty));return;}
  for(const item of matches){
   const button=node('button','z66d-invoice-entry');button.type='button';button.dataset.detail=String(item.id);
   const head=node('span','z66d-invoice-head');
   head.append(node('strong','z66d-invoice-number',String(item.code||item.id)));
   head.append(node('span','z66d-invoice-view',t.view));
   button.append(head);
   const partner=String(item.customerName||
    (typeof contactName==='function'?contactName(item.contactId):'')||'');
   if(partner)button.append(node('span','z66d-invoice-partner',partner));
   let dual='';try{dual=window.ZaviDualDate?.formatBoth?.(String(item.date||'').slice(0,10)+'T12:00:00Z')||''}catch(_){}
   if(!dual&&typeof fmtDate==='function')dual=fmtDate(item.date);
   button.append(node('span','z66d-invoice-date',dual));
   const value=typeof txTotal==='function'?txTotal(item):Number(item.total||0);
   const amount=typeof fmt==='function'?fmt(value):String(value);
   const iso=String(db.currency||'AFN');
   button.append(node('strong','z66d-invoice-amount',amount+' '+iso));
   list.append(button);
  }
 };
 tabs.addEventListener('click',e=>{
  const b=e.target.closest('button[data-z66-invoice-kind]');if(!b)return;
  invoiceKind=b.dataset.z66InvoiceKind;invoiceQuery='';search.value='';
  tabs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  route.dataset.go=invoiceKind==='sale'?'sales':'purchases';renderList();
 });
 search.addEventListener('input',()=>{invoiceQuery=search.value;renderList()});
 renderList();
 const anchor=root.querySelector(':scope > .z66d-charts')||root.querySelector(':scope > .z66d-summary');
 if(anchor)anchor.after(section);else root.append(section);
}
function paint(){
 const root=document.getElementById(CONTENT);
 if(!root)return;
 const hero=root.querySelector(':scope > .welcome');
 // Later cosmetic observers may run after original .stat-grid is moved into
 // the summary section. Restore the scoped theme class, never strip it.
 if(hero?.dataset.z66DashDone==='1'&&root.querySelector(':scope > .z66d-summary')){
   root.classList.add('z66d-root');
   addInvoiceCard(root);
   return;
 }
 const stats=root.querySelector(':scope > .stat-grid');
 if(!hero||!stats){
   root.classList.remove('z66d-root');
   return;
 }
 if(hero.dataset.z66DashDone==='1')return;
 const t=labels();
 hero.dataset.z66DashDone='1';
 root.classList.add('z66d-root');
 const title=hero.querySelector('h2'),eyebrow=hero.querySelector('.eyebrow'),sub=hero.querySelector('p');
 if(eyebrow)eyebrow.textContent=t.welcome;
 if(title)title.textContent=t.title;
 if(sub)sub.hidden=true;
 // Existing solar date stays authoritative; Gregorian only adds a small second date.
 const date=hero.querySelector('.zv-today');
 if(date&&!date.querySelector('.z66d-greg-date')){
   const d=node('small','z66d-greg-date');
   const dateNow=new Date();
   d.textContent=' · '+new Intl.DateTimeFormat(lang()==='en'?'en-GB':'en-GB',
      {day:'numeric',month:'short',year:'numeric'}).format(dateNow);
   date.append(d);
 }
 // A single top sale button is sufficient; don't delete the native action.
 const saleNative=hero.querySelector('[data-action="sale"]');
 if(saleNative){saleNative.classList.add('z66d-main-sale');saleNative.textContent=t.sale;}
 const access=node('nav','z66d-quick');
 access.setAttribute('aria-label',t.quick);
 const four=node('div','z66d-quick-four'),secondary=node('div','z66d-quick-second');
 const primary=[
  ['sale','＋',t.sale,'sales'],['purchase','▣',t.purchase,'purchases'],
  ['warehouse','▧',t.warehouse,'products'],['reports','▥',t.reports,'reports']];
 for(const [a,i,l,route] of primary)four.append(quickAction(l,i,a,route));
 for(const [a,i,l,route] of [
    ['receive','↙',t.receive,'money'],['pay','↗',t.pay,'money'],
    ['contacts','♙',t.contacts,'contacts'],['barcode','▤',t.barcode,'products']
 ])secondary.append(quickAction(l,i,a,route));
 access.append(four,secondary);
 hero.after(access);
 // One summary: reuse exactly the original, already-computed financial cards.
 const summary=section('summary',t.summary);
 stats.before(summary);summary.append(stats);
 const money=section('money',t.money);
 const moneyGrid=node('div','z66d-money-grid');
 const statNodes=[...stats.children];
 for(const stat of statNodes){
   const lbl=stat.querySelector('.stat-label')?.textContent||'';
   if(/موجودی حساب|صندوق نقدی|account balances|cashbox|د حسابونو|صندوق/.test(lbl)){
      moneyGrid.append(stat);
   }
 }
 if(moneyGrid.children.length){money.append(moneyGrid);summary.after(money);}
 else money.remove();
 // Keep the one real exchange-rate editor and original USD ledger and journal.
 const rate=root.querySelector(':scope > .zavi-usd-today-card');
 const shortLedger=root.querySelector(':scope > .zv-feature-row');
 if(rate){(money.isConnected?money:summary).after(rate);rate.classList.add('z66d-rate');}
 if(shortLedger){
   (rate||money.isConnected&&money||summary).after(shortLedger);
   shortLedger.classList.add('z66d-usd-journal');
 }
 // Charts and inventory are never recomputed here: move native DOM nodes.
 const donut=root.querySelector(':scope > .z6539-donut-card');
 const graph=root.querySelector(':scope > .layout-2');
 const stock=section('stock',t.stock);
 const charts=section('charts',t.charts);
 const chartGrid=node('div','z66d-chart-grid');
 const originalChart=graph?.querySelector(':scope > .card:first-child');
 const lowStock=graph?.querySelector(':scope > .card:nth-child(2)');
 if(originalChart)chartGrid.append(originalChart);
 if(donut)chartGrid.append(donut);
 if(chartGrid.children.length){charts.append(chartGrid);(shortLedger||rate||money.isConnected&&money||summary).after(charts);}
 const inventory=[...root.children].find(x=>x!==stock&&x!==graph&&
   /موجودی هوشمند|هوښیار موجودي|Smart stock|هوشمند گدام/i.test(x.textContent?.slice(0,220)||'') &&
   x.querySelector?.('[class*="stock"],[data-go="products"]'));
 if(inventory)stock.append(inventory);
 if(lowStock)stock.append(lowStock);
 if(stock.childElementCount>1)(charts.isConnected?charts:summary).after(stock);
 if(graph&&!graph.querySelector(':scope > .card'))graph.remove();
 // Keep customer statement and recent activity visible and clickable.
 const customers=[...root.children].find(x=>x.matches?.('.card')&&x.querySelector?.('[data-go="debtors"]')&&
   /حساب مشتریان|Customer accounts/i.test(x.textContent.slice(0,140)));
 const recent=[...root.children].find(x=>x.matches?.('section.card')&&/آخرین فعالیت‌ها|Recent activity/i.test(x.querySelector?.('.panel-head h3')?.textContent||''));
 if(customers)(stock.isConnected?stock:charts.isConnected?charts:summary).after(customers);
 if(recent)(customers||stock.isConnected&&stock||charts.isConnected&&charts||summary).after(recent);
 // Trade guide is *not* displayed. Existing routes remain available in quick actions
 // and in Settings. Keep the authentic low-stock/debt/sync alert panel.
 const extras=root.querySelector(':scope > #z649DashboardExtras');
 if(extras){
  const alert=extras.querySelector('.z644-alert-card');
  if(alert){
   alert.classList.add('z66d-alert');
   (recent||stock.isConnected&&stock||summary).after(alert);
  }
  extras.remove();
 }
 // Old quick-actions duplicate navigation; keep their legacy handlers available
 // while removing only redundant visible surfaces, not any accounting modules.
 root.querySelectorAll(':scope > .zavi-v37-actions,:scope > .zavi-reference-quick')
   .forEach(el=>{el.hidden=true;el.setAttribute('aria-hidden','true');});
 // Group remaining original widgets instead of discarding any. They remain
 // available in the normal scroll, including setup and backup warnings.
 root.querySelectorAll(':scope > .backup-reminder').forEach(el=>el.classList.add('z66d-warning'));
 const footer=root.querySelector(':scope > .tiny-note');
 if(footer)footer.classList.add('z66d-footnote');
 // Show all user-approved sections; don't require "more reports" to be clicked.
 root.classList.add('zrf-details-open');
 addInvoiceCard(root);
}
function handleActions(event){
 const button=event.target.closest?.('#content.z66d-root [data-z66-dash-action]');
 if(!button)return;
 const kind=button.dataset.z66DashAction;
 const route=button.dataset.go;
 if(route&&!sourceHas(route)){
   // Disable navigation to absent modules; never fabricate business data.
   event.preventDefault();
   event.stopImmediatePropagation();
   const native=window.toast;
   if(typeof native==='function')native(labels().unavailable);
   return;
 }
}
function start(){
 const content=document.getElementById(CONTENT);
 if(!content)return;
 // Load CSS after original V66.62 skins; only dashboard selectors apply.
 if(!document.getElementById('z66OwnerDashboardCss')){
   const style=document.createElement('link');style.id='z66OwnerDashboardCss';
   style.rel='stylesheet';style.href='./zavi-owner-dashboard-v6662.css?v=1';
   document.head.append(style);
 }
 let queued=false;
 const schedule=()=>{if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;try{paint()}catch(e){console.warn('ZAVI dashboard owner layout:',e);}});
 };
 new MutationObserver(schedule).observe(content,{childList:true,subtree:false});
 document.addEventListener('zavi:language-changed',schedule);
 document.addEventListener('click',handleActions,true);
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();
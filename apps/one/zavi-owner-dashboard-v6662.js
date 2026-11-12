/* ZAVI ONE V66.62 owner-approved dashboard: presentation-only,
   native accounting data and transaction handlers remain authoritative.
   Compact home, all sections visible, no trade guide, motion with opt-out. */
(()=>{'use strict';
// The legacy app can dynamically inject this module as well as referencing
// it in the entrypoint. Exactly one observer and click delegate may be active.
if(window.__z66OwnerDashboardStarted)return;
window.__z66OwnerDashboardStarted=true;
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

const EXTRA={
 fa:{invoice:'فاکتورها',more:'خدمات بیشتر',monthSales:'فروش ماه انتخاب‌شده',trend:'روند 12 ماه',calendar:'تقویم فروش',day:'فروش روز',docs:'اسناد',no:'در این بازه فروشی ثبت نشده است.',cashIn:'دریافت پول',cashOut:'پرداخت پول'},
 ps:{invoice:'بلونه',more:'نورې آسانتیاوې',monthSales:'د ټاکلې میاشتې پلور',trend:'د 12 میاشتو بهیر',calendar:'د پلور کلیزه',day:'د ورځې پلور',docs:'سندونه',no:'په دې موده کې پلور نشته.',cashIn:'پیسې ترلاسه کول',cashOut:'پیسې ورکول'},
 en:{invoice:'Invoices',more:'More tools',monthSales:'Sales in selected month',trend:'12-month trend',calendar:'Sales calendar',day:'Daily sales',docs:'Records',no:'No sales in this period.',cashIn:'Receive money',cashOut:'Pay money'}
};
const extras=()=>EXTRA[lang()];
const ICONS={
 sale:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h2l2.3 10h10.6l2-7H7"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>',
 purchase:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z M9 10V6a3 3 0 0 1 6 0v4"/></svg>',
 warehouse:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10 12 4l9 6v11H3V10Z M7 21v-9h10v9 M10 15h4"/></svg>',
 invoices:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h10l3 3v17l-3-2-3 2-3-2-4 2V2Z M9 9h7 M9 13h7 M9 17h4"/></svg>',
 reports:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16 M6 16v-5 M12 16V4 M18 16V9"/></svg>',
 contacts:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/></svg>',
 receive:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v15 M6 12l6 6 6-6 M4 21h16"/></svg>',
 barcode:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5v14 M6 5v14 M10 5v14 M13 5v14 M17 5v14 M21 5v14"/></svg>'
};
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
 else if(target!=='invoices')el.dataset.go=target==='barcode'?'products':value;
 el.innerHTML='<span class="z66d-action-icon" aria-hidden="true">'+(ICONS[target]||icon)+'</span>';
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
 const existing=root.querySelector(':scope > .z66d-invoices');
 if(existing?.dataset.z66Locale===lang())return;
 if(existing)existing.remove();
 const t=INV_LABELS[lang()],section=node('section','z66d-section z66d-invoices');
 section.dataset.z66Locale=lang();
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

/* Approved monthly chart/calendar: read-only, sourced from native ledger.
   Uses original Kabul Solar/Gregorian boundaries and native summary math.
   Never writes to db, rates, stock, invoices or permissions. */
// Calendar starts visible; a user may collapse it without losing their choice on re-render.
let calendarExpanded=true,calendarPickedDay=null;
function buildMonthOverview(){
 if(typeof zaviDashboardSelectedSpan!=='function'||typeof summary!=='function')return null;
 const span=zaviDashboardSelectedSpan();
 if(!span?.start||!span?.end)return null;
 const first=Date.parse(span.start+'T12:00:00Z'),last=Date.parse(span.end+'T12:00:00Z');
 const days=Math.round((last-first)/86400000)+1;
 if(!Number.isFinite(days)||days<28||days>31)return null;
 const t=extras(),panel=node('section','z66d-month-overview');
 panel.setAttribute('aria-label',t.monthSales);
 const top=node('div','z66d-month-header');
 const money=node('div','z66d-month-money');
 money.append(node('span','z66d-month-caption',t.monthSales));
 const net=Number(summary(span.start,span.end).sales||0);
 const formatted=typeof fmt==='function'?fmt(net):net.toLocaleString('en-US');
 money.append(node('strong','z66d-month-total',formatted+' '+String(db.currency||'AFN')));
 top.append(money);
 const number=db.tx.filter(tx=>tx&&!tx.voided&&tx.type==='sale'&&
   typeof tx.date==='string'&&tx.date.slice(0,10)>=span.start&&tx.date.slice(0,10)<=span.end).length;
 top.append(node('span','z66d-month-doc-count',String(number)+' '+t.docs));
 panel.append(top);
 // Seven actual time buckets in the selected month, including returns in net sales.
 const bucket=Array.from({length:7},(_,i)=>{
   const a=Math.floor(i*days/7),b=Math.floor((i+1)*days/7)-1;
   const start=new Date(first+a*86400000).toISOString().slice(0,10);
   const end=new Date(first+Math.max(a,b)*86400000).toISOString().slice(0,10);
   return {start,end,total:Number(summary(start,end).sales||0)};
 });
 const largest=Math.max(1,...bucket.map(x=>Math.max(0,x.total)));
 const graph=node('div','z66d-month-graph');
 const xmlns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(xmlns,'svg');
 svg.setAttribute('viewBox','0 0 320 148');
 svg.setAttribute('role','img');
 svg.setAttribute('aria-label',t.monthSales);
 for(const height of [20,52,84,116]){
   const line=document.createElementNS(xmlns,'line');
   line.setAttribute('x1','8');line.setAttribute('x2','312');
   line.setAttribute('y1',String(height));line.setAttribute('y2',String(height));
   line.setAttribute('class','z66d-graph-gridline');svg.append(line);
 }
 bucket.forEach((b,i)=>{
   const h=Math.max(2,Math.max(0,b.total)/largest*96);
   const bar=document.createElementNS(xmlns,'rect');
   bar.setAttribute('x',String(18+i*43));bar.setAttribute('y',String(116-h));
   bar.setAttribute('width','26');bar.setAttribute('height',String(h));bar.setAttribute('rx','6');
   bar.setAttribute('class','z66d-mini-bar'+(i===6?' z66d-mini-bar-last':''));
   bar.style.animationDelay=String(i*.045)+'s';
   const tip=document.createElementNS(xmlns,'title');
   tip.textContent=b.start+' — '+b.end+': '+
     (typeof fmt==='function'?fmt(b.total):String(b.total))+' '+String(db.currency||'AFN');
   bar.append(tip);svg.append(bar);
   const axis=document.createElementNS(xmlns,'text');
   axis.setAttribute('x',String(31+i*43));axis.setAttribute('y','138');
   axis.setAttribute('text-anchor','middle');axis.setAttribute('class','z66d-graph-week');
   axis.textContent=String(i+1);svg.append(axis);
 });
 graph.append(svg);panel.append(graph);
 if(!number)panel.append(node('p','z66d-month-empty',t.no));
 // Expandable seven-column calendar with actual current month length.
 const details=node('details','z66d-sales-calendar');
 details.open=calendarExpanded;
 details.addEventListener('toggle',()=>{calendarExpanded=details.open;});
 details.append(node('summary','z66d-calendar-label',t.calendar));
 const inner=node('div','z66d-calendar-inner');
 const grid=node('div','z66d-calendar-grid');
 const weekdays=lang()==='en'?['Sat','Sun','Mon','Tue','Wed','Thu','Fri']:
   ['ش','ی','د','س','چ','پ','ج'];
 for(const day of weekdays)grid.append(node('span','z66d-calendar-weekday',day));
 const startDay=(new Date(first).getUTCDay()+1)%7;
 for(let i=0;i<startDay;i++)grid.append(node('span','z66d-calendar-blank',''));
 const now=typeof nowISO==='function'?nowISO():new Date().toISOString().slice(0,10);
 let selected=calendarPickedDay&&calendarPickedDay>=span.start&&calendarPickedDay<=span.end?calendarPickedDay:(now>=span.start&&now<=span.end?now:span.start);
 const dayButtons=[];
 const status=node('p','z66d-calendar-status');status.setAttribute('aria-live','polite');
 const dual=iso=>{
  try{return window.ZaviDualDate?.formatBoth?.(iso+'T12:00:00Z')||iso}catch(_){return iso}
 };
 const updateDay=()=>{
  for(const b of dayButtons)b.setAttribute('aria-pressed',String(b.dataset.date===selected));
  const dSales=Number(summary(selected,selected).sales||0);
  status.textContent=dual(selected)+' · '+t.day+': '+
    (typeof fmt==='function'?fmt(dSales):dSales.toLocaleString('en-US'))+' '+String(db.currency||'AFN');
 };
 for(let i=0;i<days;i++){
  const iso=new Date(first+i*86400000).toISOString().slice(0,10);
  const button=node('button','z66d-calendar-day');
  button.type='button';button.dataset.date=iso;
  const date=new Date(iso+'T12:00:00Z');
  const solar=window.ZaviDualDate?.preferred?.()==='solar';
  const formatter=new Intl.DateTimeFormat(solar?'en-US-u-ca-persian-nu-latn':'en-US-u-nu-latn',
    {timeZone:'Asia/Kabul',day:'numeric'});
  button.textContent=formatter.format(date);
  button.setAttribute('aria-label',dual(iso));
  const hasSale=db.tx.some(tx=>tx&&!tx.voided&&tx.type==='sale'&&String(tx.date||'').slice(0,10)===iso);
  if(hasSale)button.classList.add('z66d-calendar-has-sale');
  if(iso===now)button.classList.add('z66d-calendar-today');
  button.addEventListener('click',()=>{selected=iso;calendarPickedDay=iso;updateDay()});
  grid.append(button);dayButtons.push(button);
 }
 inner.append(grid,status);details.append(inner);panel.append(details);updateDay();
 return panel;
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
 // A native render can recreate stats without replacing the hero, leaving
 // the old marker on an unstyled dashboard. Rebuild instead of returning.
 if(hero.dataset.z66DashDone==='1')hero.removeAttribute('data-z66-dash-done');
 const t=labels();
 hero.dataset.z66DashDone='1';
 root.classList.add('z66d-root');
 const rocket=node('span','z66d-rocket','🚀');
 rocket.setAttribute('aria-hidden','true');hero.append(rocket);
 const title=hero.querySelector('h2'),eyebrow=hero.querySelector('.eyebrow'),sub=hero.querySelector('p');
 if(eyebrow)eyebrow.textContent=t.welcome;
 if(title)title.textContent=t.title;
 if(sub)sub.hidden=true;
 // Existing solar date stays authoritative; Gregorian only adds a small second date.
 const date=hero.querySelector('.zv-today');
 // Native fmtDate already renders BOTH calendars; don't show Gregorian twice.
 if(date&&!date.querySelector('.z66d-greg-date')&&!date.textContent.includes(' · ')){
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
 const ex=extras();
 const primary=[
  ['sale','＋',t.sale,'sales'],['purchase','▣',t.purchase,'purchases'],
  ['warehouse','▧',t.warehouse,'products'],['invoices','▤',ex.invoice,'invoices']];
 for(const [a,i,l,route] of primary)four.append(quickAction(l,i,a,route));
 for(const [a,i,l,route] of [
    ['reports','▥',t.reports,'reports'],['receive','↙',t.receive,'money'],
    ['contacts','♙',t.contacts,'contacts'],['barcode','▤',t.barcode,'products']
 ])secondary.append(quickAction(l,i,a,route));
 const more=node('details','z66d-more-actions');
 more.append(node('summary','z66d-more-label',ex.more),secondary);
 access.append(four,more);
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
 if(moneyGrid.children.length){
   money.append(moneyGrid);
   const cashControls=node('div','z66d-money-controls');
   for(const [label,action] of [[extras().cashIn,'customer_payment'],[extras().cashOut,'supplier_payment']]){
      const btn=node('button','z66d-money-control',label);
      btn.type='button';btn.dataset.action=action;cashControls.append(btn);
   }
   money.append(cashControls);summary.after(money);
 }
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
 // Native month/year selectors stay visible above our per-month graphic.
 const monthFilters=originalChart?.querySelector('.z47-chart-header');
 if(monthFilters)charts.append(monthFilters);
 if(originalChart){
   const oldChart=originalChart.querySelector('.z47-chart-scroll');
   if(oldChart){
     const yearTrend=node('details','z66d-year-trend');
     yearTrend.append(node('summary','z66d-year-label',extras().trend));
     const arrows=originalChart.querySelector('.zavi-chart-mobile-controls');
     if(arrows)yearTrend.append(arrows);
     oldChart.before(yearTrend);yearTrend.append(oldChart);
   }
   const title=originalChart.querySelector('.panel-head h3');
   if(title)title.textContent=extras().trend;
   chartGrid.append(originalChart);
 }
 if(donut)chartGrid.append(donut);
 if(chartGrid.children.length){
   try{const overview=buildMonthOverview();if(overview)charts.append(overview);}catch(err){console.warn('ZAVI monthly chart:',err)}
   charts.append(chartGrid);(shortLedger||rate||money.isConnected&&money||summary).after(charts);
 }
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
 const extraWidgets=root.querySelector(':scope > #z649DashboardExtras');
 if(extraWidgets){
  const alert=extraWidgets.querySelector('.z644-alert-card');
  if(alert){
   alert.classList.add('z66d-alert');
   (recent||stock.isConnected&&stock||summary).after(alert);
  }
  extraWidgets.remove();
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
 if(kind==='invoices'){
   event.preventDefault();event.stopImmediatePropagation();
   const target=document.querySelector('#content.z66d-root .z66d-invoices');
   if(target){
    const noMotion=document.documentElement.dataset.z637NoMotion==='true'||
     matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({block:'start',behavior:noMotion?'auto':'smooth'});
    target.querySelector('.z66d-invoice-tab')?.focus({preventScroll:true});
   }
   return;
 }
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
   style.rel='stylesheet';style.href='./zavi-owner-dashboard-v6662.css?v=20261112-calendar-v3';
   document.head.append(style);
 }
 let queued=false;
 const schedule=()=>{if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;try{paint();window.__z66DashboardLastError='';}catch(e){window.__z66DashboardLastError=String(e?.stack||e);console.warn('ZAVI dashboard owner layout:',e);}});
 };
 new MutationObserver(schedule).observe(content,{childList:true,subtree:false});
 document.addEventListener('zavi:language-changed',schedule);
 document.addEventListener('click',handleActions,true);
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();
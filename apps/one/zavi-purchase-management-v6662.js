/* V66.62 approved PURCHASE MANAGER: an actual route, not a screenshot or dummy state.
 * Existing ledger, invoice, warehouse RPC, permissions, and theme stay authoritative.
 * This facade does not create independent financial records or inventory.
 */
(function(root){
 'use strict';
 const title=(fa,ps,en)=>{
   const l=(document.documentElement.lang||'fa').toLowerCase();
   return l.startsWith('en')?en:l.startsWith('ps')?ps:fa;
 };
 const esc=x=>String(x??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
 const qty=x=>Number(x||0).toLocaleString('en-US',{maximumFractionDigits:2});
 const action=(kind,icon,title,subtitle,extra='')=>
   '<button type="button" class="z66pm-action z66pm-action-'+kind+'" '+extra+
   '><span class="z66pm-action-icon" aria-hidden="true">'+icon+'</span>'+
   '<span class="z66pm-action-copy"><strong>'+esc(title)+'</strong><small>'+esc(subtitle)+'</small></span>'+
   '<span class="z66pm-chevron" aria-hidden="true">‹</span></button>';
 function supplierRows(){
   const balances=contactBalances(),suppliers=db.contacts
     .filter(c=>c.type==='supplier'||c.type==='both')
     .map(c=>({...c,payable:Number(balances[c.id]?.payable||0)}))
     .sort((a,b)=>b.payable-a.payable);
   return suppliers.length?suppliers.map(c=>
     '<div class="z66pm-supplier-row"><div><strong>'+esc(c.name)+
     '</strong><small>'+esc(c.phone||'')+'</small></div>'+
     '<div class="z66pm-supplier-tail"><b dir="ltr">'+qty(c.payable)+' '+esc(db.currency)+'</b>'+
     '<button type="button" class="btn tiny subtle" data-creditor-ledger="'+esc(c.id)+'">'+
     title('صورت‌حساب','د حساب تفصیل','Statement')+'</button></div></div>'
   ).join(''):'<p class="muted">'+title('هنوز عرضه‌کننده‌ای ثبت نشده است.','عرضه کوونکی نه دی ثبت شوی.','No supplier has been registered.')+'</p>';
 }
 function render(o){
   const selected=o.selected||[],cur=db.currency||'AFN';
   const purchasingTotal=selected.reduce((s,t)=>s+txTotal(t),0);
   const payable=Object.values(contactBalances()).reduce((s,c)=>s+Number(c.payable||0),0);
   const business=window.ZaviIndustryForms6529?.label?.(zaviBusinessTypeV638())||'تجارت عمومی';
   const invoiceCurrencies=Object.entries(o.purchTotals||{}).map(([currency,sum])=>
     '<span class="pill blue" dir="ltr">'+esc(currency)+' '+qty(sum)+'</span>'
   ).join('')||'<span class="muted">'+title('هنوز خریدی ثبت نشده است.','تر اوسه پېرود نشته.','No purchases yet.')+'</span>';
   const header='<div class="z66pm-hero"><div class="z66pm-heading">'+
      '<span class="z66pm-eyebrow">ZAVI ONE · V66.62</span>'+
      '<h2>'+title('مدیریت خرید','د پېرود مدیریت','Purchase management')+'</h2>'+
      '<p>'+title('خرید، واردات، دریافت گدام و حساب عرضه‌کنندگان','پېرود، واردات، ګدام او عرضه کوونکي',
        'Purchases, imports, warehouse receipts and supplier accounts')+'</p>'+
      '<span class="z66pm-trade">'+title('کسب‌وکار فعال: ','فعال کاروبار: ','Business: ')+esc(business)+'</span></div></div>';
   const buttons='<div class="z66pm-actions" aria-label="'+title('عملیات خرید','د پېرود چارې','Purchase actions')+'">'+
      action('new','＋',title('خرید جدید','نوی پېرود','New purchase'),
        title('فاکتور قطعی و پرداخت','وروستی بل او تادیه','Invoice and payment'),'data-action="purchase"')+
      action('foreign','🌐',title('خرید خارجی','بهرنی پېرود','Foreign purchase'),
        title('هر کشور، هر ارز، گمرک و مالیات','هر هېواد، اسعار، ګمرک او مالیه','All countries, currencies and import costs'),'data-z66pm-foreign="1"')+
      action('transit','🚚',title('سفارش‌های در راه','په لار کې فرمایشونه','Orders in transit'),
        title('ثبت سفارش، رسید به گدام و دریافت قسمی','فرمایش، ګدام ته رسېدل او قسمي ترلاسه کول','Order, receive and track partial arrivals'),'data-z66pm-view="orders"')+
      action('return','↩',title('برگشت خرید','د پېرود بېرته ستنول','Purchase return'),
        title('اصلاح موجودی و سند برگشت','موجودي او د ستنولو سند','Return document and stock correction'),'data-action="purchase_return"')+
      '</div>';
   const menu='<nav class="z66pm-menu" aria-label="'+title('بخش‌های خرید','د پېرود برخې','Purchase sections')+'">'+
      '<button type="button" class="z66pm-nav active" data-z66pm-view="invoices" aria-pressed="true">'+title('فاکتورها','بلونه','Invoices')+'</button>'+
      '<button type="button" class="z66pm-nav" data-z66pm-view="suppliers" aria-pressed="false">'+title('عرضه‌کنندگان','عرضه کوونکي','Suppliers')+'</button>'+
      '<button type="button" class="z66pm-nav" data-z66pm-view="orders" aria-pressed="false">'+title('در راه','په لار کې','In transit')+'</button>'+
      '</nav>';
   const metrics='<div class="z66pm-metrics">'+
      '<div class="z66pm-metric"><span>'+title('فاکتورهای خرید','د پېرود بلونه','Purchase invoices')+'</span><strong>'+qty(selected.length)+'</strong></div>'+
      '<div class="z66pm-metric"><span>'+title('مجموع ثبت‌شده','ټول ثبت شوي','Recorded purchases')+'</span><strong dir="ltr">'+qty(purchasingTotal)+' '+esc(cur)+'</strong></div>'+
      '<div class="z66pm-metric"><span>'+title('بدهی عرضه‌کنندگان','د عرضه کوونکو پور','Supplier payables')+'</span><strong dir="ltr">'+qty(payable)+' '+esc(cur)+'</strong></div>'+
      '</div>';
   const invoices='<section class="z66pm-screen" data-z66pm-pane="invoices">'+
      '<div class="z66pm-card">'+
      '<div class="z66pm-card-head"><h3>'+title('فاکتورهای خرید','د پېرود بلونه','Purchase invoices')+'</h3>'+
      '<span class="pill blue">'+qty(o.rows.length)+' '+title('رکورد','ریکارډ','records')+'</span></div>'+
      '<div class="table-bar"><div class="searchbox">'+icon('search')+
      '<input id="searchInput" placeholder="'+title('جستجوی فاکتور، کالا یا عرضه‌کننده','د بل، توکي یا عرضه کوونکي لټون','Search purchases or suppliers')+
      '" value="'+esc(search)+'"></div></div>'+
      recordsTable(o.visible)+window.ZaviPaging647.controls(o.result,'purchases')+'</div>'+
      '<div class="z66pm-card z66pm-currency"><h3>'+title('خرید بر اساس ارز اصلی','په اصلي اسعارو پېرود','Purchases by original currency')+
      '</h3><div class="z66pm-currency-pills">'+invoiceCurrencies+'</div></div></section>';
   const suppliers='<section class="z66pm-screen" data-z66pm-pane="suppliers" hidden>'+
      '<div class="z66pm-card"><div class="z66pm-card-head"><h3>'+title('حساب عرضه‌کنندگان','د عرضه کوونکو حسابونه','Supplier accounts')+'</h3></div>'+
      '<p class="z66pm-muted">'+title('مانده‌ها از دفتر واقعی فروشگاه محاسبه شده‌اند.','پاتې پیسې د پلورنځي د اصلي دفتر له مخې دي.',
      'Balances are derived from the existing store ledger.')+'</p>'+
      supplierRows()+'<div class="z66pm-inline-actions">'+
      '<button type="button" class="btn subtle" data-action="creditor_contact">'+title('افزودن عرضه‌کننده','عرضه کوونکی زیاتول','Add supplier')+'</button>'+
      '<button type="button" class="btn subtle" data-action="supplier_payment">'+title('پرداخت قرض عرضه‌کننده','عرضه کوونکي ته تادیه','Pay supplier')+'</button>'+
      '</div></div></section>';
   const orders='<section class="z66pm-screen" data-z66pm-pane="orders" hidden>'+
      '<div class="z66pm-card"><div class="z66pm-card-head"><h3>'+title('سفارش‌های در راه','په لار کې فرمایشونه','Orders in transit')+'</h3></div>'+
      '<p class="z66pm-muted">'+title('بعد از رسیدن کالا «رسید به گدام» را تأیید کنید. تا دریافت سروری، موجودی قابل فروش تغییر نمی‌کند.',
      'کله چې توکي راورسي، د ګدام رسېدنه تایید کړئ. له سروري تایید پرته موجودي نه بدلېږي.',
      'Confirm goods only after physical arrival. Sellable stock changes after server acknowledgement.')+'</p>'+
      '<div data-z66pm-transit-slot><span class="muted">'+title('در حال آماده‌سازی سفارش‌ها…','فرمایشونه چمتو کېږي…','Loading orders…')+'</span></div>'+
      '</div></section>';
   const lower='<div class="z66pm-bottom-tools">'+
     '<button type="button" class="btn subtle" data-go="products">▣ '+title('گدام و محصولات','ګدام او توکي','Warehouse & products')+'</button>'+
     '<button type="button" class="btn subtle" data-go="money">▤ '+title('حساب‌های پرداخت','د تادیې حسابونه','Payment accounts')+'</button>'+
     '<button type="button" class="btn subtle" data-go="reports">◫ '+title('گزارش خرید','د پېرود راپور','Purchase reports')+'</button>'+
     '</div>';
   return '<div class="z66pm-root" data-z66pm-version="real-66.62" dir="auto">'+
     header+buttons+metrics+menu+invoices+suppliers+orders+lower+'</div>';
 }
 let currentView='invoices',mountedRoot=null;
 function applyView(view){
   currentView=view;
   const root=document.querySelector('#content .z66pm-root');
   if(!root)return;
   for(const pane of root.querySelectorAll('[data-z66pm-pane]'))pane.hidden=pane.dataset.z66pmPane!==view;
   for(const item of root.querySelectorAll('[data-z66pm-view]')){
     const on=item.dataset.z66pmView===view;item.classList.toggle('active',on);item.setAttribute('aria-pressed',String(on));
   }
   const host=document.getElementById('content');
   const native=host?.querySelector('[data-zv-transit]');
   const slot=root.querySelector('[data-z66pm-transit-slot]');
   if(native&&slot&&!slot.contains(native)){slot.replaceChildren(native);}
   if(view==='orders'){
     if(!native){
       slot.replaceChildren();
       const p=document.createElement('p');
       p.className='z66pm-muted';
       p.textContent=title('لطفاً ورود مالک و اتصال به سرور سفارش‌ها را بررسی کنید.','د مالک ننوتل او سرور وګورئ.','Check owner sign-in and order server connection.');
       slot.append(p);
     }
     else{
       native.hidden=false;
       if(typeof native.querySelector('[data-zv-refresh]')?.click==='function')
         native.querySelector('[data-zv-refresh]').click();
     }
   }
 }
 function onMutations(){
   const root=document.querySelector('#content .z66pm-root');
   if(!root){mountedRoot=null;currentView='invoices';return;}
   if(root!==mountedRoot){mountedRoot=root;currentView='invoices';}
   const native=document.querySelector('#content > [data-zv-transit]');
   const slot=root.querySelector('[data-z66pm-transit-slot]');
   if(native&&slot){slot.replaceChildren(native);}
   if(slot?.querySelector('[data-zv-transit]'))slot.querySelector('[data-zv-transit]').hidden=currentView!=='orders';
 }
 function foreign(){
   if(typeof openOrder!=='function')return;
   openOrder('purchase');
   function configure(){
     const form=document.getElementById('dialogForm');
     if(!form||form.dataset.zaviPurchaseOnepage!=='true'||form.dataset.z66pmForeignConfigured==='1')return false;
     const cur=form.elements.namedItem('originalCurrency');
     const source=form.elements.namedItem('purchaseOrigin');
     const countryField=form.elements.namedItem('pCountry');
     // Initialize only when the native purchase enhancer has mounted its
     // country field; never overwrite currency or origin twice after a user
     // starts editing the live invoice.
     if(!cur||!source||!countryField)return;
     form.dataset.z66pmForeignConfigured='1';
     if(cur){
       if([...cur.options].some(o=>o.value==='USD'))cur.value='USD';
       cur.dispatchEvent(new Event('change',{bubbles:true}));
     }
     if(source){source.value='other';source.dispatchEvent(new Event('change',{bubbles:true}));}
     const country=form.elements.namedItem('pCountry');
     if(country){country.value='';country.placeholder=title('کشور مبدأ را وارد کنید','اصلي هېواد ولیکئ','Enter country of origin');}
     const advanced=form.querySelector('.z66-purchase-advanced');
     if(advanced)advanced.open=true;
     return true;
   }
   // The native purchase enhancer mounts asynchronously and can replace the
   // modal subtree. Only initialize the finished *real* one-page form, once,
   // before its first user edit. Never re-apply after a successful configure.
   const overlay=document.getElementById('overlay');
   const observer=new MutationObserver(()=>{
     if(configure()||!document.getElementById('dialogForm'))observer.disconnect();
   });
   if(overlay)observer.observe(overlay,{childList:true,subtree:true,
     attributes:true,attributeFilter:['data-zavi-purchase-onepage']});
   queueMicrotask(()=>{if(configure())observer.disconnect()});
   requestAnimationFrame(()=>{if(configure())observer.disconnect()});
   setTimeout(()=>{if(configure())observer.disconnect()},50);
 }
 document.addEventListener('click',e=>{
   if(e.target.closest('[data-z66pm-foreign]')){e.preventDefault();foreign();return;}
   const btn=e.target.closest('[data-z66pm-view]');
   if(btn){e.preventDefault();applyView(btn.dataset.z66pmView);return;}
 });
 function boot(){
   const host=document.getElementById('content');
   if(!host)return;
   new MutationObserver(onMutations).observe(host,{childList:true});
   onMutations();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
 root.ZaviPurchaseApproved6662=Object.freeze({render,view:applyView});
})(window);

/* ZAVI ONE V65.61 – image-inspired home and all-sections UI.
 * Pure presentation: original ledger, routes, permissions, syncing, printing and data storage unchanged.
 * All navigation calls are proxied to existing app controls; no fake financial data.
 */
(()=>{
'use strict';
const root=document.documentElement;
const I={
 fa:{brandSub:'سیستم حسابداری و مدیریت فروش',customer:'مشتریان',home:'خانه',search:'جستجوی سریع',placeholder:'محصول، مشتری، فاکتور یا بخش…',searchHelp:'برای پیدا کردن امکانات جستجو کنید',noResult:'نتیجه‌ای پیدا نشد',invoice:'ساختن فاکتور',invoiceSub:'فاکتور جدید',contacts:'دفترچه تماس',contactsSub:'مدیریت مشتریان',rate:'نرخ امروز دالر',rateSub:'افغانی (AFN)',noRate:'هنوز نرخ ثبت نشده',sections:'امکانات اصلی کسب‌وکار',all:'همه بخش‌ها',allSub:'تمام امکانات زاوی وان در یک جا',sell:'فروش',sellSub:'مدیریت فروش',buy:'خرید',buySub:'ثبت خریدها',stock:'گدام',stockSub:'مدیریت موجودی',repairs:'تعمیرات',repairsSub:'مدیریت تعمیرات',custom:'شخصی‌سازی سیستم من',customSub:'تنظیمات و سفارشی‌سازی',store:'تنظیم فروشگاه',storeSub:'مشخصات فروشگاه خود را تنظیم کنید',details:'نمایش معلومات و راپورهای بیشتر',hideDetails:'بستن راپورهای اضافی',close:'بستن'},
 ps:{brandSub:'د حسابدارۍ او پلور مدیریت',customer:'پېرودونکي',home:'کور',search:'چټک لټون',placeholder:'توکي، پېرودونکی، بل یا برخه…',searchHelp:'د برخو د موندلو لپاره ولټوئ',noResult:'پایله ونه موندل شوه',invoice:'نوی بل جوړول',invoiceSub:'نوی فاکتور',contacts:'اړیکې',contactsSub:'پېرودونکي',rate:'د نن ډالر نرخ',rateSub:'افغانۍ (AFN)',noRate:'نرخ نه دی ثبت',sections:'مهمې برخې',all:'ټولې برخې',allSub:'د زاوي وان ټول امکانات',sell:'پلور',sellSub:'پلور مدیریت',buy:'پېرود',buySub:'پېرودونه ثبت',stock:'ګدام',stockSub:'د موجودۍ مدیریت',repairs:'ترمیم',repairsSub:'د ترمیم مدیریت',custom:'زما تنظیمات',customSub:'بڼه او تنظیمات',store:'د دوکان تنظیمات',storeSub:'د دوکان معلومات',details:'نور راپورونه ښکاره کړه',hideDetails:'نور راپورونه وتړه',close:'بندول'},
 en:{brandSub:'Accounting & Sales Management',customer:'Customers',home:'Home',search:'Quick search',placeholder:'Product, customer, invoice or section…',searchHelp:'Search available modules',noResult:'No results',invoice:'Create invoice',invoiceSub:'New invoice',contacts:'Contacts',contactsSub:'Customer management',rate:"Today's USD rate",rateSub:'Afghani (AFN)',noRate:'Rate not set',sections:'Business essentials',all:'All sections',allSub:'Every ZAVI ONE feature in one place',sell:'Sales',sellSub:'Manage sales',buy:'Purchases',buySub:'Record purchases',stock:'Inventory',stockSub:'Stock management',repairs:'Repairs',repairsSub:'Repair management',custom:'My customizations',customSub:'Settings and design',store:'Store settings',storeSub:'Configure your store',details:'More dashboard reports',hideDetails:'Hide extra reports',close:'Close'}
};
function language(){const v=(document.querySelector('#zaviTopLanguage')?.value||root.lang||'fa').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'}
function has(id){return [...document.querySelectorAll('#sidebarLinks [data-go],#sidebarLinks2 [data-go]')].some(el=>el.dataset.go===id)}
function link(id){return [...document.querySelectorAll('#sidebarLinks [data-go],#sidebarLinks2 [data-go]')].find(el=>el.dataset.go===id)}
function action(id){const x=link(id);if(x){x.click();return} if(id==='settings'){document.querySelector('#side [data-go="settings"]')?.click()}}
function moduleButton(id,title,sub,ico,color){return '<button type="button" class="zrf-tile" data-zrf-go="'+id+'"><span class="zrf-tile-icon zrf-'+color+'" aria-hidden="true">'+ico+'</span><span class="zrf-tile-copy"><b>'+title+'</b><small>'+sub+'</small></span><span class="zrf-arrow" aria-hidden="true">‹</span></button>'}
const symbols={sale:'🛍',purchase:'🛒',products:'⬡',contacts:'♙',repairs:'⚙',settings:'☷',money:'▣',chart:'▥',journal:'▤'};
function originalSearch(query,results){
 const q=query.trim().toLocaleLowerCase();results.replaceChildren();
 if(!q){results.hidden=true;return}
 const links=[...document.querySelectorAll('#sidebarLinks [data-go],#sidebarLinks2 [data-go]')].filter(el=>!el.hidden&&!el.closest('[hidden]'));
 let rows=links.filter(el=>el.textContent.toLocaleLowerCase().includes(q)).slice(0,8).map(el=>({name:el.textContent.trim(),target:el.dataset.go}));
 // Search the current workspace cache only, without disclosing any financial amounts.
 try{
  if(typeof db!=='undefined'&&db){
   const products=Array.isArray(db.products)?db.products:[];
   const clients=Array.isArray(db.contacts)?db.contacts:[];
   for(const item of products.slice(0,2000)){if(rows.length>=8)break;if(String(item.name||'').toLocaleLowerCase().includes(q))rows.push({name:item.name,target:'products'})}
   for(const item of clients.slice(0,2000)){if(rows.length>=8)break;if(String(item.name||'').toLocaleLowerCase().includes(q))rows.push({name:item.name,target:'contacts'})}
  }
 }catch(_){}
 const t=I[language()];
 if(!rows.length){const e=document.createElement('p');e.className='zrf-result-empty';e.textContent=t.noResult;results.append(e)}
 rows.slice(0,8).forEach(row=>{const b=document.createElement('button');b.type='button';b.className='zrf-result';b.dataset.zrfGo=row.target;b.textContent=row.name;results.append(b)});
 results.hidden=false;
}
function updateHome(){
 const content=document.getElementById('content');if(!content)return;
 const native=!!content.querySelector(':scope > .zavi-native-home');
 document.body.classList.toggle('zavi-reference-dashboard-active',native);
 content.classList.toggle('zrf-dashboard',native);
}
function getSidebarEntries(){
 const options=[...document.querySelectorAll('#side .nav-btn')];
 return options.filter(el=>!el.hidden&&!el.closest('[hidden]')&&getComputedStyle(el).display!=='none');
}
function openAll(){
 document.getElementById('zrf-all')?.remove();const t=I[language()];
 const overlay=document.createElement('section');overlay.id='zrf-all';overlay.className='zrf-all-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',t.all);
 const box=document.createElement('div');box.className='zrf-all-panel';
 const heading=document.createElement('div');heading.className='zrf-all-brand';heading.innerHTML='<strong>ZAVI <span>ONE</span></strong><button type="button" class="zrf-close" data-zrf-close aria-label="'+t.close+'">✕</button>';
 const hero=document.createElement('div');hero.className='zrf-all-hero';hero.innerHTML='<b>'+t.all+'</b><small>'+t.allSub+'</small>';
 const grid=document.createElement('div');grid.className='zrf-all-grid';
 getSidebarEntries().forEach((original,i)=>{
  const label=original.textContent.trim().replace(/\s+/g,' ');if(!label)return;
  const b=document.createElement('button');b.type='button';b.className='zrf-all-item';
  b.dataset.zrfProxy=String(i);b.append(Object.assign(document.createElement('span'),{className:'zrf-all-icon',textContent:original.textContent.trim().startsWith('✦')?'✦':Object.hasOwn(symbols,original.dataset.go)?symbols[original.dataset.go]:'▦'}),Object.assign(document.createElement('span'),{className:'zrf-all-name',textContent:label}),Object.assign(document.createElement('span'),{className:'zrf-all-chevron',textContent:'‹'}));
  b.__original=original;grid.append(b);
 });
 if(!grid.children.length){
  // Brand-new offline account can have no enabled sidebar modules yet.
  // Show a truthful empty state rather than a completely blank panel.
  const empty=document.createElement('p');empty.className='zrf-all-empty';
  empty.setAttribute('role','status');
  empty.textContent=language()==='en'
   ? 'No modules are available yet. Finish your store setup, then reopen All sections.'
   : language()==='ps'
    ? 'لا برخې نه دي چمتو. لومړی د خپل دوکان تنظیمات بشپړ کړئ.'
    : 'هنوز بخشی فعال نیست. نخست مشخصات فروشگاه را تنظیم کنید و دوباره «همه بخش‌ها» را باز کنید.';
  grid.append(empty);
 }
 box.append(heading,hero,grid);overlay.append(box);document.body.append(overlay);document.body.classList.add('zrf-all-open');
 overlay.querySelector('[data-zrf-close]')?.focus();
}
function closeAll(){document.getElementById('zrf-all')?.remove();document.body.classList.remove('zrf-all-open')}
let scheduled=false;
function refresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;try{updateHome()}catch(e){console.warn('ZAVI reference UI:',e)}})}
function start(){
 const content=document.querySelector('#content');if(!content)return;
 const observer=new MutationObserver((records)=>{
  if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&n.classList?.contains('zrf-home'))))return;
  refresh();
 });observer.observe(content,{childList:true});refresh();
 document.addEventListener('input',e=>{if(e.target.classList?.contains('zrf-search'))originalSearch(e.target.value,e.target.nextElementSibling)});
 document.addEventListener('click',e=>{
  const more=e.target.closest('[data-go="more"]');
  if(more&&!e.target.closest('#zrf-all')){e.preventDefault();e.stopImmediatePropagation();openAll();return}
  const menu=e.target.closest('[data-zrf-menu]');if(menu){e.preventDefault();openAll();return}
  if(e.target.closest('[data-zrf-close]')||e.target.id==='zrf-all'){closeAll();return}
  const prox=e.target.closest('[data-zrf-proxy]');if(prox){const original=prox.__original;closeAll();original?.click();return}
  const link=e.target.closest('[data-zrf-go]');if(link){action(link.dataset.zrfGo==='phonebook'&&!has('phonebook')?'contacts':link.dataset.zrfGo);closeAll();return}
  if(e.target.closest('[data-zrf-invoice]')){const native=document.querySelector('[data-action="sale"]');if(native)native.click();else action('sales');return}
  if(e.target.closest('[data-zrf-focus]')){e.target.closest('.zrf-search-wrap')?.querySelector('input')?.focus();return}
  const dollar=e.target.closest('[data-zrf-dollar]');
  if(dollar){
    const c=document.querySelector('#content');c?.classList.add('zrf-details-open');
    const toggle=c?.querySelector('[data-zrf-details]');
    if(toggle){toggle.setAttribute('aria-expanded','true');toggle.textContent='▥ '+I[language()].hideDetails}
    const form=c?.querySelector('#usdRateDashboardForm');
    if(form){form.scrollIntoView({block:'center',behavior:'smooth'});form.querySelector('input')?.focus({preventScroll:true})}
    return;
  }
  const details=e.target.closest('[data-zrf-details]');if(details){
   const c=document.querySelector('#content');const on=c.classList.toggle('zrf-details-open');
   details.setAttribute('aria-expanded',String(on));details.textContent='▥ '+I[language()][on?'hideDetails':'details'];return
  }
  if(!e.target.closest('.zrf-search-wrap'))document.querySelector('.zrf-search-results')?.setAttribute('hidden','');
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

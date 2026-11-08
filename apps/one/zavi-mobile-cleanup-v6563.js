/* ZAVI ONE 65.63 – consolidated mobile cleanup, non-destructive.
   Existing transactions, offline keys, auth, staff roles, print and barcode logic untouched.
*/
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const translations={
 fa:{shortcuts:'عملیات سریع',newSale:'فروش جدید',newPurchase:'خرید جدید',receive:'دریافت وجه',pay:'پرداخت وجه',financial:'خلاصه حساب‌ها',help:'راهنما و آموزش',restore:'بخش‌های تکمیلی',noPermission:'این بخش برای حساب شما فعال نیست'},
 ps:{shortcuts:'چټک کارونه',newSale:'نوی پلور',newPurchase:'نوی پېرود',receive:'پیسې ترلاسه کول',pay:'پیسې ورکول',financial:'د حسابونو لنډیز',help:'لارښود',restore:'نورې برخې',noPermission:'دا برخه ستاسو لپاره فعاله نه ده'},
 en:{shortcuts:'Quick actions',newSale:'New sale',newPurchase:'New purchase',receive:'Receive payment',pay:'Make payment',financial:'Financial overview',help:'Help and guides',restore:'More sections',noPermission:'This feature is not enabled'}
};
function lang(){const l=($('#zaviTopLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return l.startsWith('en')?'en':l.startsWith('ps')?'ps':'fa'}
function isDash(root){return !!root?.classList.contains('zrf-dashboard')&&!!$(':scope > .zrf-home',root)}
function nativeAction(ids){
 // Routes and actions are delegated to existing application logic; no financial figures are modified.
 for(const id of ids){
  const selector='[data-action="'+id+'"],[data-go="'+id+'"]';
  const native=$$(selector).find(el=>!el.closest('.z63-quick-panel')&&!el.closest('.zrf-home'));
  if(native){native.click();return true}
 }
 return false;
}
function moveNativeStats(root,home){
 const native=$(':scope > .stat-grid',root);
 if(!native)return;
 let wrap=$('.z63-finance-wrap',home);
 if(!wrap){
  wrap=document.createElement('section');wrap.className='z63-finance-wrap';
  const title=document.createElement('h3');title.className='z63-finance-title';
  title.textContent=translations[lang()].financial;wrap.append(title);
  const tiles=$('.zrf-tiles',home);
  const banner=$('.zrf-store-banner',home);
  if(banner)banner.after(wrap);else if(tiles)tiles.after(wrap);else home.append(wrap);
 }
 native.classList.remove('zrf-legacy-dashboard');
 native.classList.add('z63-finance-grid');
 wrap.append(native);
}
function addShortcuts(home){
 const t=translations[lang()];
 const existing=$('.z63-quick-panel',home);
 if(existing){
  existing.setAttribute('aria-label',t.shortcuts);
  const heading=$(':scope > h3',existing);if(heading)heading.textContent=t.shortcuts;
  const names={sale:t.newSale,purchase:t.newPurchase,receive:t.receive,pay:t.pay};
  for(const [key,value] of Object.entries(names)){
   const label=$('[data-z63-quick="'+key+'"] span:last-child',existing);
   if(label&&label.textContent!==value)label.textContent=value;
  }
  return;
 }
 const el=document.createElement('section');el.className='z63-quick-panel';el.setAttribute('aria-label',t.shortcuts);
 const label=document.createElement('h3');label.textContent=t.shortcuts;el.append(label);
 const grid=document.createElement('div');grid.className='z63-quick-grid';
 const defs=[['sale',t.newSale,'🛒'],['purchase',t.newPurchase,'🛍'],['receive',t.receive,'↓'],['pay',t.pay,'↑']];
 for(const [key,text,ico] of defs){
  const b=document.createElement('button');b.type='button';b.className='z63-quick-tile z63-quick-'+key;
  b.dataset.z63Quick=key;
  const glyph=document.createElement('span');glyph.className='z63-quick-glyph';glyph.textContent=ico;
  const title=document.createElement('span');title.textContent=text;
  b.append(glyph,title);grid.append(b);
 }
 el.append(grid);
 const wrap=$('.z63-finance-wrap',home);
 const features=$('.zrf-tiles',home);
 if(wrap)wrap.before(el);else if(features)features.after(el);else home.append(el);
}
function organizeHome(content){
 const home=$(':scope > .zrf-home',content);if(!home)return;
 // Avoid recreating the view: move actual live statistic elements, preserving real business figures.
 moveNativeStats(content,home);
 addShortcuts(home);
 // Remove the toggle entirely. Extended analytics remain in Reports/other existing modules.
 const reportButton=$('[data-zrf-details]',home);if(reportButton)reportButton.remove();
 content.classList.remove('zrf-details-open');
 $$('.zrf-legacy-dashboard',content).forEach(el=>{
  if(el.matches('.zavi-reference-quick,.z649-dashboard-extras,.z6524-launch'))el.hidden=true;
 });
}
function organizePage(content){
 const settings=!!$('.zavi-clean-settings-hub',content)||$$('.settings-card',content).length>=4;
 content.classList.toggle('z63-settings',settings);
 content.classList.toggle('z63-cloud',!!$('#z20CloudPanel',content));
 content.classList.toggle('z63-debtors',!!$('.debt-cards,.debt-card',content));
 content.classList.toggle('z63-products',!!$('.z638-warehouse-scanner,.zavi-barcode-box',content)||!!$('#productCsvImport',content));
 if(settings){
  // Preserve all active settings, fonts, device transfers and permissions unchanged.
  $$('.zavi-clean-settings-group',content).forEach(el=>el.classList.add('z63-group'));
 }
 if(isDash(content))organizeHome(content);
}
function quickGo(key){
 const attempts={sale:['sale','sales'],purchase:['purchase','purchases'],receive:['customer_payment','payment_in','receipt','money'],pay:['supplier_payment','payment_out','payment','money']};
 if(nativeAction(attempts[key]||[]))return;
 const fallback={sale:'sales',purchase:'purchases',receive:'money',pay:'money'}[key];
 const nav=$$('[data-go]').find(e=>e.dataset.go===fallback&&!e.closest('.zrf-home,.z63-quick-panel'));
 if(nav)nav.click();
 if(key==='receive'||key==='pay'){
  const required=key==='receive'?'customer_payment':'supplier_payment';
  // Ledger route renders the native form action; trigger its original button.
  let clicked=false;
  const run=()=>{if(clicked)return;const c=$('#content');const original=c?.querySelector('[data-action="'+required+'"]');if(original){clicked=true;original.click()}};
  run();if(!clicked)requestAnimationFrame(run);
 }
}
let pend=false;
function schedule(){
 if(pend)return;pend=true;
 requestAnimationFrame(()=>{pend=false;try{const content=$('#content');if(content)organizePage(content)}catch(e){console.warn('ZAVI layout 65.63:',e)}})
}
function start(){
 const content=$('#content');if(!content)return;
 const obs=new MutationObserver(records=>{
  if(records.some(r=>r.type==='childList'&&r.target===content)){schedule();return}
  // Finances / device panels can be populated asynchronously.
  if(records.some(r=>r.addedNodes.length&&Array.from(r.addedNodes).some(n=>n.nodeType===1&&(n.matches?.('.settings-card,.z652-card,.z20-panel,.zrf-home')||n.querySelector?.('.z652-card,.z20-panel')))))schedule();
 });
 obs.observe(content,{childList:true,subtree:true});
 const themeObs=new MutationObserver(schedule);
 themeObs.observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-zavi-theme']});
 document.addEventListener('change',e=>{if(e.target?.id==='zaviTopLanguage')schedule()});
 document.addEventListener('click',e=>{
  const btn=e.target.closest?.('[data-z63-quick]');
  if(!btn)return;
  e.preventDefault();e.stopImmediatePropagation();
  quickGo(btn.dataset.z63Quick);
 },true);
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
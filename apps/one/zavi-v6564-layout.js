/* ZAVI ONE 65.64 — consolidate dashboard, real FX input and charts; maintain all finance/auth logic. */
(()=>{'use strict';
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>Array.from(p.querySelectorAll(s));
const T={
 fa:{charts:'راپورهای تصویری',rate:'نرخ امروز دالر',help:'راهنما در بخش تنظیمات موجود است.',settings:'تنظیمات سیستم'},
 ps:{charts:'د راپورونو چارټونه',rate:'د نن ډالر نرخ',help:'لارښود په تنظیماتو کې شته.',settings:'د سیسټم تنظیمات'},
 en:{charts:'Visual reports',rate:"Today's dollar rate",help:'Help is available under Settings.',settings:'System settings'}
};
function locale(){const n=($('#zaviTopLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return n.startsWith('en')?'en':n.startsWith('ps')?'ps':'fa'}
function rootDash(c){return c?.classList.contains('zrf-dashboard')&&!!$(':scope > .zrf-home',c)}
function moveQuick(c,home){
 const quick=$('.z63-quick-panel',home);
 if(!quick)return;
 const hero=$('.z62-hero',home);
 if(hero&&hero.nextElementSibling!==quick)hero.after(quick);
 quick.classList.add('z64-single-actions');
 // The original large quick-actions panels remain on their original routes,
 // but any dashboard clones are omitted to prevent duplicate actions.
 $$(':scope > .zavi-reference-quick,:scope > .z64-quick-source',c).forEach(e=>e.hidden=true);
}
function moveCharts(c,home){
 let section=$('.z64-charts',home);
 if(!section){
  section=document.createElement('section');section.className='z64-charts';
  const h=document.createElement('h3');h.className='z64-charts-heading';h.textContent=T[locale()].charts;
  const cards=document.createElement('div');cards.className='z64-charts-grid';
  section.append(h,cards);
  const finance=$('.z63-finance-wrap',home);
  if(finance)finance.after(section);else $('.zrf-tiles',home)?.after(section);
 }
 const grid=$('.z64-charts-grid',section);
 if(!grid)return;
 // Native canvas/SVG and calendar controls are preserved, not recreated.
 const donut=$(':scope > .z6539-donut-card',c);
 if(donut){
  donut.classList.remove('zrf-legacy-dashboard');
  donut.classList.add('z64-chart-card','z64-donut');
  grid.append(donut);
 }
 const layout=$$(':scope > .layout-2',c).find(el=>!!$(':scope > .card',el));
 if(layout){
  const monthly=$$(':scope > section,:scope > .card',layout).find(el=>{
   const h=$('h2,h3',el);return !!h&&/فروش ماهوار|Monthly sales|میاشتني پلور/i.test(h.textContent);
  })||$(':scope > section.card',layout);
  if(monthly){monthly.classList.add('z64-chart-card','z64-month');grid.append(monthly)}
  if(layout.children.length){
   layout.classList.remove('zrf-legacy-dashboard');
   layout.classList.add('z64-inventory-panels');
   section.after(layout);
  }else layout.remove();
 }
 const count=grid.children.length;
 section.hidden=count===0;
 // Make the entire live report legible on mobile (calendar selector remains functional).
}
function mergeRate(c,home){
 const shell=$('.zrf-usd-shell',home);
 if(!shell)return;
 const form=$('#usdRateDashboardForm',c);
 if(!form)return; // Rate feature may be disabled for this user/tenant.
 // Reuse the REAL input and save button. No cloned state or duplicate edit forms.
 const card=document.createElement('section');
 card.className='z64-rate-card';
 const title=document.createElement('h3');
 title.className='z64-rate-heading';
 title.textContent=T[locale()].rate;
 const icon=document.createElement('span');icon.className='z64-rate-icon';icon.setAttribute('aria-hidden','true');icon.textContent='$';
 const row=document.createElement('div');row.className='z64-rate-title';row.append(icon,title);
 const wrapper=document.createElement('div');wrapper.className='z64-rate-form';
 wrapper.append(form);
 card.append(row,wrapper);
 shell.replaceWith(card);
 // Source form is moved, not duplicated; its existing event handlers still save the same currency rate.
}
function compactHelp(c){
 // Guide sections are removed from the HOME layout only; Settings, charts and accounting remain.
 $$(':scope > .z649-dashboard-extras,:scope > .zavi-reference-quick,:scope > .z6524-launch',c)
 .forEach(el=>{el.hidden=true;el.classList.add('z64-hide-home')});
 $('.zrf-details-toggle',c)?.remove();
 // The old view is not reopened automatically; no extra full-height blank wrapper.
 c.classList.remove('zrf-details-open');
}
function renderHome(c){
 const home=$(':scope > .zrf-home',c);if(!home)return;
 moveQuick(c,home);moveCharts(c,home);mergeRate(c,home);compactHelp(c);
 const title=$('.z64-charts-heading',home);if(title)title.textContent=T[locale()].charts;
}
function organizeSettings(c){
 const hub=$('.zavi-clean-settings-hub',c);
 c.classList.toggle('z64-settings',!!hub);
 if(!hub)return;
 if(!hub.dataset.z64Ready){
  hub.dataset.z64Ready='1';
  // Keep original searchable details/categories; do not alter form values/permissions.
  const groups=$$('.zavi-clean-settings-group',hub);
  groups.forEach((group,i)=>{group.classList.add('z64-setting-section');if(i>0&&group.open)group.open=false});
  const search=$('#zaviCleanSettingsSearch',hub);
  if(search){search.setAttribute('enterkeyhint','search');search.setAttribute('autocomplete','off')}
 }
 // Existing settings patch updates localized labels and search results itself.
}
let pending=false;
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{
 pending=false;
 try{const c=$('#content');if(!c)return;
  organizeSettings(c);
  if(rootDash(c))renderHome(c);
 }catch(err){console.warn('[ZAVI 65.64 layout]',err)}
})}
function navHeight(){
 const bar=$('#mobileBottom');
 const h=bar&&getComputedStyle(bar).display!=='none'?Math.ceil(bar.getBoundingClientRect().height):0;
 document.documentElement.style.setProperty('--z64-bottom-nav',h+'px');
}
function start(){
 const c=$('#content');if(!c)return;
 // Main render() swaps content children. No subtree watch: avoid mutation/render feedback loops.
 new MutationObserver(schedule).observe(c,{childList:true});
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-zavi-theme']});
 if(window.ResizeObserver&&$('#mobileBottom'))new ResizeObserver(navHeight).observe($('#mobileBottom'));
 window.addEventListener('resize',navHeight,{passive:true});
 document.addEventListener('change',e=>{if(e.target?.id==='zaviTopLanguage')schedule()});
 navHeight();schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
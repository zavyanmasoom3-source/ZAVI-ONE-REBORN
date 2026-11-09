/* Approved ZAVI ONE home summary — only actual local ledger projections.
   Does NOT write, submit, change stock, query cloud, or clone action buttons.
   Counts are computed using the SAME summary()/totals()/txTotal() financial code
   that powers the native Reports route. A missing tenant means no projection. */
(()=>{'use strict';
const L={
 fa:{summary:'خلاصه حساب‌ها',net:'فروش خالص',profit:'سود خالص',receivable:'طلب از مشتریان',payable:'قرض‌های ما',
     sales:'فروش ۷ روز اخیر',purchases:'خرید ۷ روز اخیر',charts:'خلاصهٔ ۷ روز اخیر'},
 ps:{summary:'د حسابونو لنډیز',net:'خالص پلور',profit:'خالصه ګټه',receivable:'له پېرودونکو طلب',payable:'زموږ پورونه',
     sales:'د تېرو ۷ ورځو پلور',purchases:'د تېرو ۷ ورځو پېرود',charts:'د تېرو ۷ ورځو لنډیز'},
 en:{summary:'Accounts overview',net:'Net sales',profit:'Net profit',receivable:'Customer receivables',payable:'Our debts',
     sales:'Last 7 days sales',purchases:'Last 7 days purchases',charts:'Last seven days'}
};
const language=()=>{const l=(document.documentElement.lang||'fa-AF').toLowerCase();return l.startsWith('ps')?'ps':l.startsWith('en')?'en':'fa'};
const moneyFormat=value=>typeof currency==='function'?currency(value):String(value);
function dates(){
  const value=typeof nowISO==='function'?nowISO():new Date().toISOString().slice(0,10);
  const t=Date.parse(value+'T12:00:00Z');
  if(!Number.isFinite(t))return [];
  return Array.from({length:7},(_,i)=>new Date(t-(6-i)*86400000).toISOString().slice(0,10));
}
function values(days,kind){
  const ledger=typeof db==='object'&&Array.isArray(db?.tx)?db.tx:[];
  return days.map(date=>ledger.reduce((sum,t)=>{
    if(t.voided||t.date!==date)return sum;
    let sign=kind==='sale'?(t.type==='sale'?1:t.type==='sale_return'?-1:0):
      (t.type==='purchase'?1:t.type==='purchase_return'?-1:0);
    const total=sign&&typeof txTotal==='function'?Number(txTotal(t)):0;
    return sum+sign*(Number.isFinite(total)?total:0);
  },0));
}
function sparkline(numbers){
  const max=Math.max(1,...numbers.map(v=>Math.abs(v)));
  const points=numbers.map((n,i)=>[8+ (i*184/6),48-(Math.max(0,n)/max)*37]);
  const path=points.map(([x,y])=>x.toFixed(1)+','+y.toFixed(1)).join(' ');
  const fill='8,50 '+path+' 192,50';
  return {line:path,area:fill};
}
function text(tag,cl,value){
  const e=document.createElement(tag);e.className=cl;e.textContent=value;return e;
}
function makeStat(label,amount,index){
  const card=document.createElement('div');card.className='zav-new-stat';
  card.dataset.approvedStat=String(index);
  card.append(text('small','zav-new-stat-label',label),
              text('strong','zav-new-stat-value',moneyFormat(amount)));
  return card;
}
function makeChart(label,values,color){
  const card=document.createElement('div');card.className='zav-new-chart';
  const hasData=values.some(value=>Number(value)!==0);
  const p=hasData?sparkline(values):null;
  card.append(text('small','zav-new-chart-label',label));
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 200 55');svg.setAttribute('role','img');
  svg.setAttribute('aria-label',label);
  svg.setAttribute('preserveAspectRatio','none');
  if(hasData){
    const area=document.createElementNS(ns,'polygon');
    area.setAttribute('points',p.area);area.setAttribute('fill','currentColor');
    area.setAttribute('class','zav-new-chart-area');svg.append(area);
    const line=document.createElementNS(ns,'polyline');
    line.setAttribute('points',p.line);line.setAttribute('fill','none');
    line.setAttribute('stroke','currentColor');line.setAttribute('stroke-width','2.5');
    line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');
    svg.append(line);
  }else{
    const nothing=document.createElementNS(ns,'text');
    nothing.setAttribute('x','100');nothing.setAttribute('y','29');
    nothing.setAttribute('font-size','8');nothing.setAttribute('text-anchor','middle');
    nothing.setAttribute('fill','currentColor');nothing.setAttribute('opacity','.65');
    nothing.textContent=language()==='en'?'No transactions yet':
      language()==='ps'?'تر اوسه معامله نشته':'هنوز معامله‌ای ثبت نشده';
    svg.append(nothing);
  }
  svg.classList.add('zav-new-chart-svg');
  card.dataset.approvedChart=color;card.append(svg);
  return card;
}
function paint(){
  if(document.documentElement.classList.contains('zawi-locked'))return;
  const home=document.querySelector('#content > .zavi-native-home');
  if(!home||typeof summary!=='function'||typeof totals!=='function'||typeof currency!=='function')return;
  const state=summary(),accounts=totals();
  if(!state||!accounts||!Number.isFinite(state.sales)||!Number.isFinite(accounts.receivable))return;
  const t=L[language()];
  const block=home.querySelector('#zavApprovedHomeSummary');
  if(!block)return;
  const metrics=document.createElement('div');metrics.className='zav-new-stats';
  metrics.setAttribute('aria-label',t.summary);
  [
    [t.net,state.sales],
    [t.profit,state.profit],
    [t.receivable,accounts.receivable],
    [t.payable,accounts.payable]
  ].forEach(([label,amount],i)=>metrics.append(makeStat(label,amount,i)));
  const charts=document.createElement('div');charts.className='zav-new-charts';
  charts.setAttribute('aria-label',t.charts);
  const days=dates();
  if(days.length===7){
    charts.append(makeChart(t.sales,values(days,'sale'),'sales'),
                  makeChart(t.purchases,values(days,'purchase'),'purchase'));
  }
  const heading=document.createElement('h2');
  heading.className='zavi-native-section-title';heading.textContent=t.summary;
  block.replaceChildren(heading,metrics,charts);
}
let scheduled=false;
function queue(){
  if(scheduled)return;scheduled=true;
  queueMicrotask(()=>{scheduled=false;try{paint()}catch(err){
    console.warn('ZAVI approved home summary:',err?.message||err);
  }});
}
function start(){
  const root=document.getElementById('content');
  if(root)new MutationObserver(queue).observe(root,{childList:true,subtree:false});
  document.addEventListener('zavi:language-change',queue);
  document.addEventListener('zavi:language-changed',queue);
  document.addEventListener('zavi:theme-changed',queue);
  // The app's own render() replaces #content children when transactions change.
  queue();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

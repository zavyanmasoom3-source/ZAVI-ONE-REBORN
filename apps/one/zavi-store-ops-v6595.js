/* ZAVI ONE 65.95 operations toolkit.
 * Reads an optional CSV provided by the owner in this browser only.
 * Never updates ledgers, balances, inventory or debts without existing posting workflows.
 */
(()=>{'use strict';
const $=(s,p=document)=>p.querySelector(s);
const m=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e};
const language=()=>{const v=String($('#zaviTopLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'};
const dict={
 fa:{nav:'ابزارهای مدیریت روزانه',title:'مرکز کارهای روزمره ZAVI ONE',sub:'کنترل روزانه، هشدار موجودی، سررسید قرض‌ها و بررسی آفلاین. بدون تغییر به دفتر اصلی.',cash:'بستن صندوق روزانه',stock:'هشدار موجودی',debt:'قرض‌های سررسید',offline:'سلامت آفلاین',guide:'راهنمای حسابداری',close:'بستن',sales:'فروش نقدی امروز',purchase:'پرداخت خرید امروز',expenses:'مصارف نقدی امروز',returns:'برگشتی نقدی به مشتری',opening:'پول اول روز',count:'پول شمارش‌شده آخر روز',expected:'مانده مورد انتظار',difference:'تفاوت صندوق',calculate:'محاسبه و بررسی',export:'دریافت گزارش CSV',import:'انتخاب CSV صادرشده از سیستم',demo:'ستون‌ها: name,stock,min,expiry',debtHint:'ستون‌ها: customer,amount,due',low:'موجودی کم',past:'تاریخ گذشته',overdue:'قرض معوق',days:'روز',empty:'اطلاعاتی وارد نشده است.',privacy:'فایل‌ها فقط در همین دستگاه تحلیل می‌شوند. هیچ سند مالی ثبت یا تغییر داده نمی‌شود.',safety:'این گزارش راهنمای تطبیق است، نه سند حسابداری ثبت‌شده. برای اصلاح از بخش اصلی سیستم استفاده کنید.',online:'اتصال اینترنت',active:'متصل',inactive:'قطع',worker:'پشتیبانی آفلاین',managed:'سرویس‌ورکر فعال',unmanaged:'وضعیت سرویس‌ورکر نامشخص',storage:'فضای محلی (تقریبی)',sync:'معاملات ارسال‌نشده',unknown:'از این پنجره قابل تأیید نیست؛ از «دستگاه‌های من / همگام‌سازی» بررسی کنید.',manual:'بازکردن مدیریت اصلی',cashError:'اعداد معتبر و غیرمنفی وارد کنید.',hint:'برای تحلیل واقعی، خروجی CSV همان بخش را وارد کنید.',ai:'دستیار فعلی راهنمایی می‌کند؛ بدون تأیید سندی را تغییر نمی‌دهد.',advice:'گزارش‌های اصلی، حساب فروش، خرید، فاکتور و دستیار آفلاین همچنان همان بخش‌های موجود هستند.'},
 ps:{nav:'د ورځنیو چارو وسیلې',title:'د ZAVI ONE ورځنی مرکز',sub:'د صندوق حساب، د موجودي خبرتیا، پورونه او آفلاین حالت.',cash:'د ورځې صندوق',stock:'د ګدام خبرداری',debt:'د پور موده',offline:'آفلاین حالت',guide:'د حسابدارۍ لارښود',close:'بندول',sales:'نقد پلور',purchase:'د پېرود پیسې',expenses:'مصارف',returns:'بېرته ورکړې',opening:'د ورځې پیل پیسې',count:'د ورځې وروستۍ پیسې',expected:'تمه کېدونکی حساب',difference:'توپیر',calculate:'محاسبه',export:'د CSV راپور',import:'د سیستم CSV فایل',demo:'ستونونه: name,stock,min,expiry',debtHint:'ستونونه: customer,amount,due',low:'موجودي کمه ده',past:'نېټه تېره شوه',overdue:'پور تېر شوی',days:'ورځې',empty:'معلومات نشته.',privacy:'فایلونه یوازې ستاسو پر وسیله کتل کېږي. هیڅ سند نه بدلېږي.',safety:'دا راپور اصلي سند نه دی. بدلونونه د سیسټم په اصلي برخو کې وکړئ.',online:'انټرنیټ',active:'وصل دی',inactive:'قطع دی',worker:'آفلاین خدمت',managed:'فعال',unmanaged:'نامعلوم',storage:'ځايي حافظه',sync:'نه لېږل شوي معاملات',unknown:'د همغږۍ اصلي برخه وګورئ.',manual:'اصلي مدیریت ته تګ',cashError:'سم غیرمنفي شمېرې ولیکئ.',hint:'د اصلي معلوماتو لپاره د سیستم CSV راواخلئ.',ai:'اوسنی آفلاین مرستیال اسناد نه بدلوي.',advice:'د حسابدارۍ اصلي برخې خوندي دي.'},
 en:{nav:'Daily operations tools',title:'ZAVI ONE Daily Operations Hub',sub:'Cash closing, stock alerts, debt due dates and offline status — without changing your ledger.',cash:'Daily cash close',stock:'Stock alerts',debt:'Overdue debts',offline:'Offline readiness',guide:'Accounting guide',close:'Close',sales:'Today’s cash sales',purchase:'Cash purchases paid',expenses:'Cash expenses',returns:'Cash refunds to customers',opening:'Opening cash',count:'Counted closing cash',expected:'Expected closing cash',difference:'Cash difference',calculate:'Calculate',export:'Export CSV report',import:'Choose exported CSV',demo:'Columns: name,stock,min,expiry',debtHint:'Columns: customer,amount,due',low:'Low stock',past:'Expired date',overdue:'Overdue receivable',days:'days',empty:'No data imported.',privacy:'Files are analyzed only on this device. No financial records are posted or altered.',safety:'This is a reconciliation worksheet, not a posted accounting entry. Use the existing app workflows to adjust real records.',online:'Internet connection',active:'Online',inactive:'Offline',worker:'Offline service',managed:'Service worker active',unmanaged:'Service worker status unknown',storage:'Local storage (estimate)',sync:'Unsent transactions',unknown:'Not verifiable here; check My Devices / Sync in the original app.',manual:'Open main management',cashError:'Please enter valid, non-negative numbers.',hint:'Import the CSV exported from the original accounting system for actual analysis.',ai:'The existing offline assistant provides guidance but cannot post transactions.',advice:'Original sales, purchases, invoices and reports remain available.'}
};
const t=()=>dict[language()];
let root=null,tab='cash',rows=[],cashResult=null;
function number(value){const n=Number(String(value||'').trim().replaceAll(',',''));return Number.isFinite(n)&&n>=0?n:NaN}
function download(name,content){const a=m('a');const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2500)}
function parseCSV(raw){const cells=[],out=[];let quote=false,cell='',line=[];for(let i=0;i<raw.length;i++){const ch=raw[i];if(ch==='"'){if(quote&&raw[i+1]==='"'){cell+='"';i++}else quote=!quote}else if(ch===','&&!quote){line.push(cell);cell=''}else if((ch==='\n'||ch==='\r')&&!quote){if(ch==='\r'&&raw[i+1]==='\n')i++;line.push(cell);if(line.some(x=>x!==''))out.push(line);line=[];cell=''}else cell+=ch}if(quote)throw Error('Invalid CSV quotes');line.push(cell);if(line.some(x=>x!==''))out.push(line);if(out.length<2)return [];const header=out.shift().map(x=>x.trim().toLowerCase().replace(/^\ufeff/,''));return out.slice(0,10000).map(x=>Object.fromEntries(header.map((key,i)=>[key,(x[i]||'').trim()])))}
function section(body,element){body.replaceChildren(element)}
function cashUI(body){const w=t(),wrap=m('div','z195-form'),fields={};
 for(const id of ['opening','sales','purchase','expenses','returns','count']){const label=m('label','z195-label',w[id]);const input=m('input');input.type='number';input.min='0';input.step='0.01';input.inputMode='decimal';input.value='0';fields[id]=input;label.append(input);wrap.append(label)}
 const out=m('div','z195-results');
 wrap.append(m('p','z195-note',w.safety));
 wrap.append(m('button','z195-button',w.calculate));wrap.lastChild.type='button';wrap.lastChild.addEventListener('click',()=>{
   const nums=Object.fromEntries(Object.entries(fields).map(([k,input])=>[k,number(input.value)]));
   if(Object.values(nums).some(x=>!Number.isFinite(x))){out.textContent=w.cashError;return}
   const expected=nums.opening+nums.sales-nums.purchase-nums.expenses-nums.returns;
   const delta=nums.count-expected;
   cashResult={date:new Date().toISOString(),...nums,expected:Math.round(expected*100)/100,difference:Math.round(delta*100)/100};
   out.replaceChildren(m('p','',w.expected+': '+cashResult.expected.toFixed(2)),m('strong','',w.difference+': '+cashResult.difference.toFixed(2)));
 });wrap.append(out);
 const csv=m('button','',w.export);csv.type='button';csv.addEventListener('click',()=>{
   if(!cashResult)return;
   download('ZAVI_DAILY_CASH_RECONCILIATION.csv','\ufeff'+Object.keys(cashResult).join(',')+'\r\n'+Object.values(cashResult).join(',')+'\r\n');
 });wrap.append(csv);section(body,wrap)
}
function fileUI(body,type){
 const w=t(),wrap=m('div','z195-import');wrap.append(m('p','z195-note',w.privacy),m('p','',type==='stock'?w.demo:w.debtHint));
 const file=m('input');file.type='file';file.accept='.csv,text/csv';file.setAttribute('aria-label',w.import);
 const results=m('div','z195-cards');
 file.addEventListener('change',async()=>{
   try{
     const chosen=file.files?.[0];if(!chosen||chosen.size>5*1024*1024)throw Error('CSV must be under 5MB');
     rows=parseCSV(await chosen.text());results.replaceChildren();const issues=[];
     for(const r of rows){
       if(type==='stock'){
         const current=number(r.stock),min=number(r.min);
         if(Number.isFinite(current)&&Number.isFinite(min)&&current<=min)issues.push({name:r.name||'—',detail:w.low+': '+current+' / '+min});
         const d=Date.parse(r.expiry||'');
         if(Number.isFinite(d)&&d<Date.now())issues.push({name:r.name||'—',detail:w.past+': '+r.expiry});
       }else{
         const amount=number(r.amount),due=Date.parse(r.due||'');
         if(Number.isFinite(due)&&Number.isFinite(amount)&&amount>0&&due<Date.now())issues.push({name:r.customer||'—',detail:w.overdue+': '+amount+' • '+r.due});
       }
     }
     if(!issues.length)results.append(m('p','',w.empty));
     for(const item of issues.slice(0,300)){const box=m('article','z195-item');box.append(m('strong','',item.name),m('p','',item.detail));results.append(box)}
   }catch(error){results.replaceChildren(m('p','z195-error',error.message))}
 });wrap.append(file,results);section(body,wrap)
}
function offlineUI(body){
 const w=t(),host=m('div','z195-cards');
 const conn=m('article','z195-item');conn.append(m('strong','',w.online),m('p','',navigator.onLine?w.active:w.inactive));host.append(conn);
 const worker=m('article','z195-item');worker.append(m('strong','',w.worker),m('p','',navigator.serviceWorker?.controller?w.managed:w.unmanaged));host.append(worker);
 const local=m('article','z195-item');local.append(m('strong','',w.storage));
 const amount=m('p','',w.unknown);local.append(amount);host.append(local);
 navigator.storage?.estimate?.().then(x=>{if(host.isConnected)amount.textContent=x.usage?Math.round(x.usage/1048576)+' MB':w.unknown}).catch(()=>{});
 host.append(m('p','z195-note',w.sync+': '+w.unknown));
 host.append(m('p','z195-note',w.safety));section(body,host)
}
function guideUI(body){const w=t(),host=m('div','z195-cards');host.append(m('p','z195-note',w.ai),m('p','z195-note',w.advice));
 const btn=m('button','z195-button',w.manual);btn.type='button';btn.addEventListener('click',close);host.append(btn);section(body,host)
}
function render(){
 if(!root||root.hidden)return;const w=t();
 $('#z195-title').textContent=w.title;$('#z195-subtitle').textContent=w.sub;$('#z195-close').textContent=w.close;
 const nav=$('#z195-tabs');nav.replaceChildren();
 for(const key of ['cash','stock','debt','offline','guide']){const b=m('button',tab===key?'is-current':'',w[key]);b.type='button';b.setAttribute('aria-pressed',String(tab===key));b.addEventListener('click',()=>{tab=key;render()});nav.append(b)}
 const body=$('#z195-body');
 if(tab==='cash')cashUI(body);else if(tab==='stock'||tab==='debt')fileUI(body,tab);else if(tab==='offline')offlineUI(body);else guideUI(body)
}
function close(){if(root){root.hidden=true;rows=[];cashResult=null;document.body.classList.remove('z195-open')}}
function open(){if($('#appScreen')?.hidden)return;if(!root)build();root.hidden=false;document.body.classList.add('z195-open');render()}
function build(){
 root=m('div','z195-overlay');root.id='z195-hub';root.hidden=true;
 const panel=m('section','z195-shell');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','z195-title');
 const head=m('header','z195-header');const text=m('div');const h=m('h2');h.id='z195-title';const p=m('p');p.id='z195-subtitle';text.append(h,p);
 const closeButton=m('button');closeButton.id='z195-close';closeButton.type='button';closeButton.addEventListener('click',close);head.append(text,closeButton);
 const tabs=m('nav','z195-tabs');tabs.id='z195-tabs';const content=m('section','z195-body');content.id='z195-body';
 panel.append(head,tabs,content);root.append(panel);
 root.addEventListener('click',e=>{if(e.target===root)close()});
 document.body.append(root);
}
function install(){
 const holder=$('#appScreen #view')||$('#appScreen .workspace');
 if(!holder||$('#z195-launch'))return;
 const b=m('button','z195-launch',t().nav);b.id='z195-launch';b.type='button';b.addEventListener('click',open);
 const target=$('#appScreen .topbar')||holder;
 target.append(b)
}
function init(){
 install();let pending=false;
 new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;install()})}).observe(document.body,{childList:true,subtree:false});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root&&!root.hidden)close()});
 document.addEventListener('change',e=>{if(/language/i.test(e.target?.id||'')){const b=$('#z195-launch');if(b)b.textContent=t().nav;render()}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)close()})
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

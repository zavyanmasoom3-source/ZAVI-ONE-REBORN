/* ZAVI ONE ADMIN V53 V15 — additional READ-ONLY service desk.
   Uses authenticated in-memory workspace results; mutating actions delegate to
   the pre-existing validated admin flows. Never caches customer data or tokens. */
(() => {
 'use strict';
 const $ = (s, root=document) => root.querySelector(s);
 const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
 const nf = value => new Intl.NumberFormat('fa-AF',{maximumFractionDigits:0}).format(Number(value)||0);
 const faMonths=['حمل','ثور','جوزا','سرطان','اسد','سنبله','میزان','عقرب','قوس','جدی','دلو','حوت'];
 const fmt = (v, calendar='gregory') => {
  if(!v)return '—';const d=new Date(v);if(!Number.isFinite(d.getTime()))return '—';
  try {
   const p=Object.fromEntries(new Intl.DateTimeFormat('en-US-u-ca-'+(calendar==='persian'?'persian':'gregory'),{
    timeZone:'Asia/Kabul',day:'numeric',month:'numeric',year:'numeric'
   }).formatToParts(d).filter(x=>['year','month','day'].includes(x.type)).map(x=>[x.type,Number(x.value)]));
   const m=calendar==='persian'?faMonths[p.month-1]:(new Intl.DateTimeFormat('en-GB',{month:'long',timeZone:'Asia/Kabul'}).format(new Date(Date.UTC(2020,p.month-1,10))));
   return nf(p.day)+' '+m+' '+nf(p.year);
  }catch(_){return '—';}
 };
 const kabulDay=value=>{
  const d=new Date(value);if(!Number.isFinite(d.getTime()))return NaN;
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kabul',day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(d).filter(x=>['year','month','day'].includes(x.type)).map(x=>[x.type,Number(x.value)]));
  return Date.UTC(p.year,p.month-1,p.day)/86400000;
 };
 let filter='all',search='',open=false,serverResult='',sort='soon',focusBefore=null,forecastCustomer='',forecastPeriod='180';
 const api=()=>window.ZaviAdminAPI;
 const rows=()=>Array.isArray(api()?.getRows?.())?api().getRows():[];
 const days=r=>{
  if(r?.plan==='lifetime')return Infinity;
  const t=Date.parse(r?.expires_at||'');if(!Number.isFinite(t))return null;
  if(t<=Date.now())return 0;
  return Math.max(0,Math.round(kabulDay(t)-kabulDay(Date.now())));
 };
 const classify=r=>{
  if(r?.status==='suspended')return 'suspended';
  if(!r?.plan||r.plan==='none')return 'pending';
  if(r.plan==='lifetime')return 'active';
  const exp=Date.parse(r?.expires_at||'');
  if(!Number.isFinite(exp))return 'unknown';
  if(exp<=Date.now())return 'expired';
  return days(r)<=30?'due':'active';
 };
 const label={active:'فعال',due:'نزدیک ختم',expired:'پایان‌یافته',pending:'بدون اشتراک',suspended:'معلق',unknown:'نامشخص'};
 const plan=r=>({annual:'سالانه',semiannual:'شش‌ماهه',lifetime:'دایمی' })[r.plan]||'بدون اشتراک';
 const customerRows=()=>{
  const q=search.trim().toLocaleLowerCase();
  let result=rows().filter(r=>{
   const st=classify(r),d=days(r);
   const matches=!q||(String(r.workspace_name||'')+' '+String(r.owner_email||'')).toLocaleLowerCase().includes(q);
   let allowed=filter==='all'||st===filter;
   const m=/^due(1|3|7|15|30)$/.exec(filter);
   if(m)allowed=(st==='due'||st==='active')&&d!==null&&d>=0&&d<=Number(m[1]);
   return allowed&&matches;
  });
  result.sort((a,b)=>{
   if(sort==='name')return String(a.workspace_name||'').localeCompare(String(b.workspace_name||''),'fa');
   if(sort==='recent')return (Date.parse(b.last_paid_at||'')||0)-(Date.parse(a.last_paid_at||'')||0);
   const n=r=>(classify(r)==='expired'?-1:days(r)??99999);
   return n(a)-n(b);
  });
  return result;
 };
 const counter=()=>{const c={all:rows().length,active:0,due:0,expired:0,pending:0,suspended:0,unknown:0};rows().forEach(r=>c[classify(r)]++);return c};
 const futureRenewal=(r,period)=>{
  const length=Number(period);
  if(![180,365].includes(length))return null;
  const now=Date.now(),expiry=Date.parse(r?.expires_at||'');
  const base=(r?.status!=='suspended' && Number.isFinite(expiry) && expiry>now)?expiry:now;
  return new Date(base+length*86400000);
 };
 const timeline=()=>{
  return rows().filter(r=>r.status!=='suspended' && r.plan!=='lifetime' &&
    Number.isFinite(Date.parse(r.expires_at||'')) && Date.parse(r.expires_at)>Date.now() &&
    days(r)!==null && days(r)<=15).sort((a,b)=>days(a)-days(b)).slice(0,8);
 };
 const bulkFollowup=()=>customerRows().map(r=>[
   String(r.workspace_name||'مشتری'),label[classify(r)]||'نامشخص',
   days(r)===Infinity?'دایمی':days(r)===null?'—':nf(days(r))+' روز',
   fmt(r.expires_at,'persian')].join(' — ')).join('\n');
 const makeMessage=r=>{
  const d=days(r),name=String(r.workspace_name||'مشتری گرامی');
  let deadline;
  if(r.plan==='lifetime')deadline='اشتراک شما دایمی است.';
  else if(classify(r)==='expired')deadline='مدت اشتراک شما پایان یافته است.';
  else if(d!==null&&r.expires_at)deadline='از مدت اشتراک شما '+nf(d)+' روز باقی مانده و تاریخ پایان '+fmt(r.expires_at,'persian')+' است.';
  else deadline='برای بررسی وضعیت اشتراک لطفاً تماس بگیرید.';
  return 'سلام، '+name+'!\n'+deadline+'\nبرای تمدید یا پرسش، لطفاً با بخش پشتیبانی ZAVI ONE تماس بگیرید.\nبا احترام، مدیریت ZAVI ONE';
 };
 async function copyText(text){
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true}}catch(_){}
  const node=document.createElement('textarea');node.value=text;node.setAttribute('readonly','');node.style.position='fixed';node.style.top='-3000px';document.body.append(node);node.select();let ok=false;
  try{ok=document.execCommand('copy')}catch(_){}node.remove();return ok;
 }
 function safeCSV(v){let value=String(v??'');if(/^[\s\x00-\x1f]*[=+@\-]/u.test(value))value="'"+value;return '"'+value.replace(/"/g,'""')+'"'}
 function csvExport(){const out=[['فروشگاه','ایمیل','نوع اشتراک','وضعیت','روز باقی مانده','ختم شمسی','ختم میلادی','آخرین پرداخت شمسی','آخرین پرداخت میلادی']];
  for(const r of customerRows())out.push([r.workspace_name,r.owner_email,plan(r),label[classify(r)],days(r)===Infinity?'دایمی':days(r)??'',fmt(r.expires_at,'persian'),fmt(r.expires_at),fmt(r.last_paid_at,'persian'),fmt(r.last_paid_at)]);
  const data='\uFEFF'+out.map(r=>r.map(safeCSV).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ZAVI_ONE_ADMIN_Followup_'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }
 const filters=[['all','همه'],['due1','تا ۱ روز'],['due3','تا ۳ روز'],['due7','تا ۷ روز'],['due15','تا ۱۵ روز'],['due30','تا ۳۰ روز'],['expired','پایان‌یافته'],['pending','بدون اشتراک'],['suspended','معلق'],['active','فعال']];
 const primary=[['customers','👥','مشتریان','فهرست کامل'],['finance','▥','حسابداری','درآمد و مصارف'],['payments','🧾','سوابق پرداخت','تمدید و رسید'],['brand','⚙','مدیریت برند','تنظیمات دستگاه'],['account','🔐','کنترول حساب‌ها','بایگانی و بازیابی'],['support','💬','پیام‌های پشتیبانی','پیگیری درخواست'],['receipts','📃','رسیدهای مشتری','پیش‌نمایش رسید']];
 const rowHtml=r=>{
  const st=classify(r),d=days(r),id=esc(r.workspace_id||''),e=esc(r.owner_email||'');
  return `<tr><td><b>${esc(r.workspace_name||'—')}</b><small dir="ltr">${e||'ایمیل ثبت نشده'}</small></td><td><span class="zsvc-chip ${st}">${label[st]}</span><small>${plan(r)}</small></td><td>${d===Infinity?'دایمی':d===null?'—':nf(d)+' روز'}<small>${fmt(r.expires_at,'persian')}<br>${fmt(r.expires_at)}</small></td><td><div class="zsvc-actions"><button type="button" data-zsvc="renew" data-id="${id}" ${st==='suspended'?'title="نخست وضعیت حساب را بررسی کنید"':''}>مدیریت اشتراک</button><button type="button" data-zsvc="copy" data-id="${id}">کاپی پیام</button><button type="button" data-zsvc="email" data-id="${id}" ${!r.owner_email?'disabled':''}>ایمیل</button></div></td></tr>`;
 };
 function statusText(){return navigator.onLine===false?'انترنت دستگاه قطع است؛ مدیریت اشتراک و اطلاعات جدید فقط با اتصال سرور ممکن است.':'صفحه آنلاین است؛ برای اطمینان از سرور، «بررسی ارتباط سرور» را بزنید.'}
 function paintRows(){const panel=$('#zsvc-results');if(!panel)return;const data=customerRows();panel.innerHTML=`<div class="zsvc-results-head"><b>نتایج: ${nf(data.length)} مشتری</b><span>اطلاعات دریافت‌شده از آخرین نشست مدیریت؛ قبل از عملیات مالی تازه‌سازی کنید.</span></div><div class="zsvc-table-scroll"><table class="zsvc-table"><thead><tr><th>فروشگاه</th><th>اشتراک</th><th>تاریخ و مدت</th><th>خدمات سریع</th></tr></thead><tbody>${data.length?data.map(rowHtml).join(''):'<tr><td colspan="4" class="zsvc-empty">مشتری با این مشخصات یافت نشد.</td></tr>'}</tbody></table></div>`;}
 function updateForecast(){
  const target=$('#zsvcForecastResult');if(!target)return;
  const id=$('#zsvcForecastCustomer')?.value || '';
  const period=$('#zsvcForecastPeriod')?.value || '180';
  if(!id){target.textContent='مشتری و مدت را انتخاب کنید.';return;}
  const customer=rows().find(r=>String(r.workspace_id)===id);
  if(!customer){target.textContent='مشتری در فهرست فعلی یافت نشد.';return;}
  if(customer.plan==='lifetime'){
    target.textContent='برای اشتراک دایمی، تمدید عادی قابل برآورد نیست. از پنل اصلی مدیریت کنید.';return;
  }
  const candidate=futureRenewal(customer,period);
  if(!candidate){target.textContent='برآورد ممکن نیست.';return;}
  target.textContent='تاریخ تقریبی جدید: '+fmt(candidate,'persian')+' ('+fmt(candidate)+'). ثبت واقعی فقط پس از تأیید پرداخت در سرور.';
 }
 function render(){
  const root=$('#zaviServiceCenter');if(!root)return;
  const c=counter();
  root.innerHTML=`<section class="zsvc-page" lang="fa-AF" dir="rtl" role="dialog" aria-modal="true" aria-labelledby="zsvcTitle">
    <header class="zsvc-top"><div><div class="zsvc-overline">ZAVI ONE · ADMIN</div><h1 id="zsvcTitle">مرکز خدمات حرفه‌ای و پیگیری</h1><p>پیگیری اشتراک‌ها، ارتباط با مشتری و دسترسی سریع به خدمات مدیریتی</p></div><button type="button" class="zsvc-close" data-zsvc="close" aria-label="بستن مرکز خدمات">✕ بستن</button></header>
    <div class="zsvc-internet" role="status" aria-live="polite"><span id="zsvcNetwork">${esc(statusText())}</span><span id="zsvcServer">${esc(serverResult)}</span></div>
    <section class="zsvc-kpis" aria-label="خلاصه وضعیت">${[['همه',c.all],['فعال',c.active],['نزدیک ختم',c.due],['پایان‌یافته',c.expired],['بدون اشتراک',c.pending],['معلق',c.suspended]].map(([name,n])=>`<article><small>${name}</small><strong>${nf(n)}</strong></article>`).join('')}</section>
    <section class="zsvc-shortcuts"><h2>خدمات مدیریتی</h2><div class="zsvc-servicegrid">${primary.map(([key,icon,title,desc])=>`<button type="button" class="zsvc-shortcut" data-zsvc="go" data-to="${key}"><span>${icon}</span><b>${title}</b><small>${desc}</small></button>`).join('')}</div></section>
    <section class="zsvc-extra-grid" aria-label="خدمات تکمیلی">
      <div class="zsvc-extra-card"><div class="zsvc-line"><h2>تقویم پیگیری ۱۵ روز آینده</h2><span class="zsvc-muted">${nf(timeline().length)} مشتری نیازمند پیگیری</span></div>
      <div class="zsvc-timeline">${timeline().length?timeline().map(r=>`<div><span class="zsvc-time-count">${nf(days(r))} روز</span><b>${esc(r.workspace_name||'—')}</b><small>${fmt(r.expires_at,'persian')}</small></div>`).join(''):'<p class="zsvc-muted">در میان اطلاعات موجود، اشتراک فعالِ رو به ختم طی ۱۵ روز آینده یافت نشد.</p>'}</div>
      </div><div class="zsvc-extra-card"><h2>برآورد تمدید اشتراک</h2><p class="zsvc-muted">برای پیش‌بینی پایان اشتراک پس از تمدید. این محاسبه هیچ پرداختی ثبت نمی‌کند و تاریخ قطعی را سرور تعیین می‌کند.</p>
        <label class="zsvc-label">انتخاب مشتری<select id="zsvcForecastCustomer"><option value="">یک مشتری انتخاب کنید</option>${rows().map(r=>`<option value="${esc(r.workspace_id||'')}" ${forecastCustomer===String(r.workspace_id)?'selected':''}>${esc(r.workspace_name||'—')}</option>`).join('')}</select></label>
        <label class="zsvc-label">مدت تمدید<select id="zsvcForecastPeriod"><option value="180" ${forecastPeriod==='180'?'selected':''}>۱۸۰ روز</option><option value="365" ${forecastPeriod==='365'?'selected':''}>۳۶۵ روز</option></select></label>
        <div id="zsvcForecastResult" class="zsvc-forecast" role="status">مشتری و مدت را انتخاب کنید.</div>
      </div>
    </section>
    <section class="zsvc-follow"><div class="zsvc-line"><div><h2>مرکز پیگیری و تمدید</h2><p>جستجو و گزارش‌گیری از اطلاعاتی که قبلاً با مجوز مدیر از سرور دریافت شده است.</p></div><div class="zsvc-tools"><button type="button" data-zsvc="reload">↻ تازه‌سازی</button><button type="button" data-zsvc="health">⌁ بررسی ارتباط سرور</button><button type="button" data-zsvc="export">↓ CSV</button><button type="button" data-zsvc="bulkcopy">☷ کاپی فهرست پیگیری</button><button type="button" data-zsvc="print">⎙ چاپ</button></div></div>
    <div class="zsvc-controls"><label>جستجو<input id="zsvcSearch" type="search" placeholder="نام فروشگاه یا ایمیل" value="${esc(search)}" autocomplete="off"></label><label>ترتیب<select id="zsvcSort"><option value="soon" ${sort==='soon'?'selected':''}>نزدیک‌ترین تاریخ پایان</option><option value="name" ${sort==='name'?'selected':''}>نام فروشگاه</option><option value="recent" ${sort==='recent'?'selected':''}>آخرین پرداخت</option></select></label></div>
    <div class="zsvc-filters" role="group" aria-label="فیلتر اشتراک">${filters.map(([key,title])=>`<button type="button" class="${key===filter?'on':''}" data-zsvc="filter" data-filter="${key}" aria-pressed="${key===filter}">${title}</button>`).join('')}</div><div id="zsvc-results"></div>
    <p class="zsvc-foot">هیچ پیام یا ایمیل به‌طور خودکار ارسال نمی‌شود. تمدید و تغییر وضعیت فقط توسط توابع مجاز سرور انجام می‌شود. اطلاعات مشتری در کش عمومی ذخیره نمی‌شود.</p></section>
    <section class="zsvc-help"><details><summary>راهنمای خدمات، امنیت و کار آفلاین</summary><p>بخش جدید برای گزارش‌گیری و پیگیری است؛ تمدید اشتراک همچنان از بخش اصلی و با تأیید سرور اجرا می‌شود. وضعیت آفلاین به معنی امکان مدیریت پرداخت یا دستگاه بدون اینترنت نیست. پس از تغییر دامنه، داده‌های ذخیره‌شده در دامنه قبلی خودکار انتقال پیدا نمی‌کند. در حالت نمایشی هیچ عملیات واقعی انجام نمی‌شود.</p></details></section>
  </section>`;
  paintRows();updateForecast();
 }
 function openDesk(){if(!['live','demo'].includes(api()?.getMode?.()))return;
  if(open)return;open=true;serverResult='';focusBefore=document.activeElement;
  const div=document.createElement('div');div.id='zaviServiceCenter';document.body.append(div);document.body.classList.add('zsvc-open');document.body.classList.remove('mobile-drawer');render();$('#zaviServiceCenter .zsvc-close')?.focus();
 }
 function closeDesk(){const div=$('#zaviServiceCenter');open=false;div?.remove();document.body.classList.remove('zsvc-open');if(focusBefore?.isConnected)focusBefore.focus();}
 function navTo(name){closeDesk();if(['overview','customers','payments','finance','brand','settings'].includes(name)){$(`button[data-page="${name}"]`)?.click();return;}
  if(name==='account'){const el=$('#z24NavOpen');if(el&&!el.hidden){el.click()}else api()?.notify?.('کنترول حساب‌ها فقط برای حساب مدیر تأییدشده فعال می‌شود.',true);return;}
  if(name==='support')window.ZaviAdminSupport?.open?.();if(name==='receipts')window.ZaviAdminSupport?.receipts?.();
 }
 async function serverHealth(){if(navigator.onLine===false){serverResult='آفلاین: اتصال سرور ممکن نیست.';render();return;}
  serverResult='در حال بررسی نشست مدیر...';render();
  try{if(api()?.getMode?.()!=='live'){serverResult='حالت نمایشی: به سرور درخواست ارسال نشد.';render();return;}
   const profile=await api().request('/auth/v1/user',{method:'GET'});
   serverResult=profile?.id?'✔ سرور و نشست مدیر پاسخ معتبر دادند.':'پاسخ سرور دریافت شد اما هویت معتبر تأیید نشد.';
  }catch(err){serverResult='✕ بررسی سرور موفق نبود: '+String(err?.message||'خطای اتصال').slice(0,110)}
  if(open)render();
 }
 function get(id){return rows().find(r=>String(r.workspace_id)===id)}
 async function clicked(e){const b=e.target.closest('button[data-zsvc]');if(!b||!open)return;const cmd=b.dataset.zsvc,id=b.dataset.id;
  if(cmd==='close'){closeDesk();return}if(cmd==='go'){navTo(b.dataset.to);return}
  if(cmd==='filter'){filter=b.dataset.filter;render();return}
  if(cmd==='reload'){$('#refreshBtn')?.click();serverResult='درخواست تازه‌سازی فهرست به سرور ارسال شد.';render();return}
  if(cmd==='health'){await serverHealth();return}
  if(cmd==='export'){csvExport();return}if(cmd==='bulkcopy'){const list=bulkFollowup();if(!list){api()?.notify?.('مشتری برای پیگیری انتخاب نشده است.',true);return;}const ok=await copyText(list);api()?.notify?.(ok?'فهرست پیگیری کاپی شد. هیچ پیامی خودکار ارسال نشده است.':'کاپی فهرست موفق نشد.',!ok);return}if(cmd==='print'){window.print();return}
  if(cmd==='renew'){const r=get(id);if(!r)return;closeDesk();if(api()?.getMode?.()==='live')document.dispatchEvent(new CustomEvent('zavi-admin-open-renew',{detail:{workspace_id:r.workspace_id}}));else api()?.notify?.('در حالت نمایشی عملیات واقعی غیرفعال است.',true);return}
  if(cmd==='copy'){const r=get(id);if(!r)return;const ok=await copyText(makeMessage(r));api()?.notify?.(ok?'متن یادآوری کاپی شد. هیچ پیامی ارسال نشده است.':'کاپی خودکار در این مرورگر مجاز نیست؛ از گزینه ایمیل یا مرورگر دیگر استفاده کنید.',!ok);return}
  if(cmd==='email'){const r=get(id),email=String(r?.owner_email||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return api()?.notify?.('ایمیل مشتری معتبر نیست.',true);
   const link='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent('یادآوری اشتراک ZAVI ONE')+'&body='+encodeURIComponent(makeMessage(r));window.location.href=link;
  }
 }
 function updateOfflineBanner(){
  const hint=$('#zaviAdminNetworkNotice');if(hint)hint.hidden=navigator.onLine!==false;
 }
 function install(){
  const n=$('button[data-page="customers"]');if(!n)return;
  // Notice is informational; it does not falsely grant offline billing access.
  const notice=document.createElement('div');notice.id='zaviAdminNetworkNotice';notice.hidden=true;
  notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  notice.textContent='اتصال اینترنت قطع است. صفحه ذخیره‌شده قابل بازشدن است، اما مدیریت مشتریان، پرداخت‌ها و دستگاه‌ها به سرور نیاز دارد.';
  document.body.append(notice);updateOfflineBanner();
  const btn=document.createElement('button');btn.type='button';btn.id='zaviServiceOpen';btn.className='nav-item';btn.innerHTML='<span>✧</span> مرکز خدمات حرفه‌ای و پیگیری';n.after(btn);btn.addEventListener('click',openDesk);
  const top=$('.top-actions');if(top){const quick=document.createElement('button');quick.type='button';quick.id='zaviServiceQuick';quick.className='icon-btn';quick.setAttribute('title','مرکز خدمات حرفه‌ای و پیگیری');quick.setAttribute('aria-label','مرکز خدمات حرفه‌ای و پیگیری');quick.textContent='✧';top.prepend(quick);quick.addEventListener('click',openDesk)}
  document.addEventListener('click',e=>{if(e.target.closest('#zaviServiceCenter'))clicked(e)});
  document.addEventListener('input',e=>{if(e.target?.id==='zsvcSearch'){search=e.target.value;paintRows()}});
  document.addEventListener('change',e=>{if(e.target?.id==='zsvcSort'){sort=e.target.value;paintRows()}if(e.target?.id==='zsvcForecastCustomer'){forecastCustomer=e.target.value;updateForecast()}if(e.target?.id==='zsvcForecastPeriod'){forecastPeriod=e.target.value;updateForecast()}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){e.preventDefault();closeDesk()}});
  document.addEventListener('zavi-admin-data-updated',()=>{if(open)render()});
  document.addEventListener('click',e=>{if(open&&(e.target?.id==='logoutBtn'||e.target?.dataset?.logout))closeDesk()});
  window.addEventListener('online',()=>{updateOfflineBanner();const n=$('#zsvcNetwork');if(n)n.textContent=statusText()});
  window.addEventListener('offline',()=>{updateOfflineBanner();const n=$('#zsvcNetwork');if(n)n.textContent=statusText()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

/* ZAVI ONE V65.24 — lightweight, on-demand health centre. Financial records are never edited here
   except for an owner-confirmed explanatory journal note, via the application's existing commit(). */
(()=>{'use strict';
const S=()=>window.ZaviSmartCare6524,el=(sel,node=document)=>node.querySelector(sel);
const lang=()=>{const l=document.documentElement.lang||'fa-AF';return l==='en'?'en':l.startsWith('ps')?'ps':'fa';};
const L={
 fa:{start:'مرکز سلامت و کمک',refresh:'بررسی دوباره',files:'آماده‌سازی فایل‌های آفلاین',backup:'گرفتن بک‌آپ',settings:'تنظیمات',reports:'راپورها',daily:'خلاصه امروز',save:'ثبت خلاصه تأییدشده در روزنامچه',note:'گزارش روزانه فقط یک یادداشت حسابرسی‌نشده است؛ اسناد مالی پاک یا قفل نمی‌شوند.',help:'راهنمای مشکلات',checks:'یافته‌های فعلی',zero:'در بررسی محلی مورد قطعی پیدا نشد. وضعیت سرور جدا بررسی شود.',noaccess:'برای مشاهده ارقام باید مالکِ همین فروشگاه وارد شود.',close:'بستن',industry:'راهنمای تجارت',manual:'ارسال واتساپ فقط با تأیید خودتان انجام شود.',copy:'کاپی خلاصه روزانه',stock:'گدام',debt:'قرضداران',missing:'بررسی محلی کامل نشد؛ هرگز اطلاعات سایت را پاک نکنید.',guide:'راهنمای آفلاین از داده‌های همین دستگاه است، نه مدل زبانی خودترمیم‌کننده.'},
 ps:{start:'د روغتیا او مرستې مرکز',refresh:'بیا ارزونه',files:'د آفلاین فایلونو چمتو کول',backup:'شاتړ نسخه',settings:'ترتیبات',reports:'راپورونه',daily:'د نن ورځې لنډیز',save:'په ورځپاڼه کې تایید شوی لنډیز ثبتول',note:'دا یوازې د ورځې یادښت دی؛ مالي اسناد نه حذف کېږي او نه تړل کېږي.',help:'د ستونزو لارښود',checks:'اوسنۍ پایلې',zero:'په محلي کتنه کې ستونزه ونه موندل شوه. سرور جلا وازمویئ.',noaccess:'د حساب لپاره باید د همدې پلورنځي مالک ننوتی وي.',close:'تړل',industry:'د سوداګرۍ لارښود',manual:'واټساپ پیغام یوازې ستاسو په تایید ولېږئ.',copy:'د ورځې لنډیز کاپي',stock:'زېرمه',debt:'پوروال',missing:'محلي کتنه بشپړه نه شوه؛ د وېبپاڼې معلومات مه پاکوئ.',guide:'آفلاین لارښود په همدغې وسیلې معلومات کاروي، نه خپلواک ژبنی ماډل.'},
 en:{start:'Health & Help Centre',refresh:'Check again',files:'Prepare offline files',backup:'Backup',settings:'Settings',reports:'Reports',daily:'Today’s summary',save:'Save owner-confirmed journal note',note:'The daily close is a journal note, not an audited close; transactions are not deleted or locked.',help:'Troubleshooting guide',checks:'Current findings',zero:'No confirmed local issue. Server status needs separate verification.',noaccess:'Sign in as this shop’s authorized owner to see account data.',close:'Close',industry:'Business guidance',manual:'WhatsApp reminders require your own approval.',copy:'Copy daily summary',stock:'Inventory',debt:'Customer debts',missing:'Local check could not complete. Do not clear site storage.',guide:'Offline troubleshooting uses local rules, not a self-healing language model.'}
};
const t=key=>L[lang()][key]||L.fa[key];
const names={en:{AUTH:['Owner sign-in required','Sign in with the owner account for this shop.'],STORAGE:['Device storage issue','Make an encrypted backup; do not clear site storage.'],SHELL:['Offline files not ready','While online, use Prepare offline files.'],LEASE:['Offline permit not valid','Check device authorization and subscription.'],CONFLICT:['Sync conflict detected','Stop new entries; preserve all device data and contact support.'],PENDING:['Unsynced operations','Connect and sync, then confirm status before transferring devices.'],NETWORK:['No internet','Use offline only on an authorized device with a valid permit.'],BACKUP:['No verified recent backup','Download an encrypted backup and separately test restoring it.'],DATA:['Critical record issue','Inspect the data-audit report before any correction.'],DATA_HIGH:['Records need review','Inspect the record issues with the shop owner.'],LOW_STOCK:['Products running low','Check reorder levels and quantities in Inventory.'],DEBT_DUE:['Customer debts due','Check amounts and dates in Customer debts before sharing reminders.']},
ps:{AUTH:['د مالک ننوتل اړین دي','د همدې پلورنځي د مالک حساب ته ننوځئ.'],STORAGE:['د وسیلې حافظه ستونزه لري','شاتړ نسخه واخلئ؛ د وېبپاڼې معلومات مه پاکوئ.'],SHELL:['آفلاین فایلونه چمتو نه دي','د انټرنېټ په شتون کې آفلاین فایلونه چمتو کړئ.'],LEASE:['آفلاین اجازه سمه نه ده','د وسیلې اجازه او ګډون وګورئ.'],CONFLICT:['په همغږۍ کې ټکر شته','نوي مالي ثبتونه ودروئ او معلومات وساتئ.'],PENDING:['نه دي همغږي شوي عملیات','له انټرنېټ سره همغږي او بیا حالت تایید کړئ.'],NETWORK:['انټرنېټ نشته','یوازې له معتبرې اجازې سره آفلاین کار وکړئ.'],BACKUP:['تازه شاتړ نسخه نه ده تایید شوې','کوډ شوې شاتړ نسخه واخلئ او بیا رغونه وازمویئ.'],DATA:['د معلوماتو جدي ستونزه','مخکې له بدلون د اسنادو راپور وګورئ.'],DATA_HIGH:['اسناد څېړنې ته اړتیا لري','د پلورنځي له مالک سره اسناد وڅېړئ.'],LOW_STOCK:['د توکو زېرمه کمه ده','د زېرمو مقدار او د بیا فرمایش حد وګورئ.'],DEBT_DUE:['د مشتریانو پورونه رسېدلي دي','د خبرتیا مخکې اندازه او نېټه وګورئ.']}};
function localizedFinding(f){const v=names[lang()]?.[f.code];if(!v)return f;const count=/^\d+/.exec(f.title||'')?.[0];return {...f,title:(count?count+' ':'')+v[0],advice:v[1]};}
let pane=null,lastReport=null,lastCtx=null,dialogOpen=false;
const text=v=>S().safe(v),safeNum=v=>S().format(v);
function initial(){if(pane)return;
 const wrap=document.createElement('div');wrap.id='z6524Care';wrap.className='z6524-shade';wrap.hidden=true;
 wrap.innerHTML='<section class="z6524-panel" role="dialog" aria-modal="true" aria-labelledby="z6524Heading" tabindex="-1"><header class="z6524-head"><div><b id="z6524Heading">ZAVI ONE</b><small>ZAVI SMART CARE · V65.24</small></div><button class="z6524-close" data-care-close type="button" aria-label="Close">×</button></header><div class="z6524-body" id="z6524Body"></div></section>';
 document.body.appendChild(wrap);pane=wrap;
 wrap.addEventListener('click',e=>{if(e.target===wrap||e.target.closest('[data-care-close]'))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!wrap.hidden)close()});
 wrap.addEventListener('click',async e=>{
  const b=e.target.closest('[data-care-action]');if(!b)return;e.preventDefault();if(b.disabled)return;
  const action=b.dataset.careAction;
  if(action==='refresh')await refresh();
  else if(action==='prepare'){b.disabled=true;try{if(window.zaviAutoOffline?.prepare)await window.zaviAutoOffline.prepare();else if(window.zaviOfflineShell?.prepare)await window.zaviOfflineShell.prepare();}catch(_){}finally{b.disabled=false;await refresh();}}
  else if(action==='backup'){close();const btn=document.querySelector('[data-action="backup"]');if(btn&&document.documentElement.classList.contains('zawi-locked')===false)btn.click();else window.zaviCareGo?.('settings');}
  else if(action==='settings'||action==='reports'||action==='products'||action==='debtors'){close();window.zaviCareGo?.(action);}
  else if(action==='save'){if(!lastCtx?.authorized)return;const ok=window.zaviCareConfirmDaily?.();if(ok)await refresh();}
  else if(action==='copy'){const preview=S().dailyPreview(lastCtx||{});if(preview.authorized){try{await navigator.clipboard.writeText(preview.printable)}catch(_){const ta=document.createElement('textarea');ta.value=preview.printable;pane.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}}}
 });
 const obs=new MutationObserver(()=>{if(document.documentElement.classList.contains('zawi-locked'))close()});obs.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 window.addEventListener('storage',e=>{if(/z20_workspace_id|auth_session|zavi_v34_tenant/.test(e.key||'')){lastCtx=null;lastReport=null;close();}});
}
function button(action,label,extra=''){return `<button type="button" class="btn subtle z6524-action" data-care-action="${action}" ${extra}>${text(label)}</button>`;}
function levelStyle(l){return l==='critical'?'danger':l==='warn'?'warning':'info'}
function serviceMetrics(ctx){const h=ctx.health||{},flags=ctx.flags||{},r=lastReport||{},lst=[];
 const item=(label,v)=>lst.push(`<div class="z6524-metric"><span>${text(label)}</span><b>${text(v)}</b></div>`);
 item('فایل‌های آفلاین',h.shell_ready===true?'✓':h.shell_ready===false?'⚠':'—');item('مجوز آفلاین',h.lease_valid===true?'✓':h.lease_valid===false?'⚠':'—');
 item('تغییرات ارسال‌نشده',flags.pending===true?'⚠':flags.pending===false?'✓':'—');item('بک‌آپ',flags.backupAt?new Date(flags.backupAt).toLocaleDateString():'—');
 item('محصول کم‌موجود',r.metrics?.lowStock==null?'—':String(r.metrics.lowStock));item('قرض سررسید',r.metrics?.dueDebts==null?'—':String(r.metrics.dueDebts));
 return lst.join('');}
function paint(){const core=S();if(!pane||!core)return;const body=el('#z6524Body',pane);const ctx=lastCtx||{};lastReport=core.diagnose(ctx);el('#z6524Heading',pane).textContent=t('start');
 if(!lastReport.authorized){body.innerHTML=`<p>${text(t('noaccess'))}</p>${button('refresh',t('refresh'))}`;return;}
 const findings=lastReport.issues.map(localizedFinding).map(f=>`<article class="z6524-finding" data-level="${levelStyle(f.level)}"><b>${text(f.title)}</b><p>${text(f.advice)}</p></article>`).join('')||`<div class="z6524-ok">${text(t('zero'))}</div>`;
 const daily=core.dailyPreview(ctx),profile=ctx.businessPlan||{};
 const dailyUI=daily.authorized?`<div class="z6524-totals"><span>فروش <b>${safeNum(daily.sales)} ${text(daily.currency)}</b></span><span>خرید <b>${safeNum(daily.purchases)}</b></span><span>مصارف <b>${safeNum(daily.expenses)}</b></span><span>مفاد تقریبی <b>${safeNum(daily.profit)}</b></span><span>صندوق <b>${safeNum(daily.cash)}</b></span><span>طلب‌ها <b>${safeNum(daily.receivable)}</b></span></div>${button('copy',t('copy'))}${button('save',t('save'),ctx.dailyClosed?'disabled title="Already recorded"':'')}<p class="z6524-small">${text(ctx.dailyClosed?'خلاصه امروز قبلاً در روزنامچه ثبت شده است.':t('note'))}</p>`:'<p>—</p>';
 body.innerHTML=`<section class="z6524-intro"><h3>${text(t('checks'))}</h3><p>${text(t('guide'))}</p><div class="z6524-metrics">${serviceMetrics(ctx)}</div>${button('refresh',t('refresh'))}${button('prepare',t('files'))}${button('settings',t('settings'))}</section><section><h3>${text(t('help'))}</h3><div class="z6524-findings">${findings}</div><div class="z6524-actions">${button('backup',t('backup'))}${button('products',t('stock'))}${button('debtors',t('debt'))}</div><p class="z6524-small">${text(t('manual'))}</p></section><section><h3>${text(t('daily'))}</h3>${dailyUI}</section><section><h3>${text(t('industry'))}</h3><p><b>${text(profile.label||'تجارت عمومی')}</b> — ${text(profile.focus||'راهنمای امکانات فعال را بررسی کنید.')}</p><div class="z6524-actions">${(profile.steps||[]).filter(x=>x.available).slice(0,4).map(x=>button(x.id==='products'?'products':x.id==='debtors'?'debtors':'reports',x.label)).join('')}</div></section><footer class="z6524-disclaimer">${text(core.tr('warn',lang()))}</footer>`;
}
async function refresh(){
 if(document.documentElement.classList.contains('zawi-locked'))return;
 const current=window.zaviCareContext?.();if(!current){el('#z6524Body',pane).textContent=t('missing');return;}
 if(current.authorized&&window.zaviOfflineHealth?.run){try{current.health=await Promise.race([window.zaviOfflineHealth.run(),new Promise(resolve=>setTimeout(()=>resolve({}),6000))]);}catch(_){current.health={}}}
 lastCtx=current;paint();
}
function close(){if(!pane)return;pane.hidden=true;dialogOpen=false;lastCtx=null;lastReport=null;document.body.classList.remove('z6524-open')}
async function open(){initial();if(document.documentElement.classList.contains('zawi-locked'))return;pane.hidden=false;dialogOpen=true;document.body.classList.add('z6524-open');el('#z6524Body',pane).textContent='در حال بررسی اطلاعات همین دستگاه…';pane.querySelector('.z6524-panel').focus();await refresh()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-z6524-open]');if(!b)return;e.preventDefault();open()});
window.ZaviCareUI6524={open,close,refresh};
})();

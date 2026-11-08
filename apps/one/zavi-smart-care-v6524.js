/* ZAVI ONE V65.24 — tenant-bound, safe offline care; zero automatic financial mutations.
   These are deterministic diagnostics and contextual instructions, not an offline language model. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ZaviSmartCare6524=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
const normalize=x=>String(x||'').normalize('NFKC').toLowerCase().replace(/[ي]/g,'ی').replace(/[ك]/g,'ک');
const number=x=>Number.isFinite(Number(x))?Number(x):0;
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=x=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(number(x));
const messages={
 fa:{title:'مرکز سلامت و کمک ZAVI ONE',ready:'آماده',unknown:'تأیید نشده',blocked:'نیازمند اقدام',offline:'وضعیت آفلاین',backup:'نسخه پشتیبان',sync:'همگام‌سازی',stock:'موجودی',debt:'قرضداران',records:'کنترل اسناد',action:'راه‌حل',assistant:'راهنمای آفلاین',daily:'بستن روزانه (با تأیید مالک)',business:'راهنمای نوع تجارت',warn:'این ابزار صرفاً موارد قابل مشاهده در همین دستگاه را بررسی می‌کند؛ بررسی سمت سرور و بازیابی واقعی جداگانه لازم است.'},
 ps:{title:'د ZAVI ONE د روغتیا او مرستې مرکز',ready:'چمتو',unknown:'نه دی تایید شوی',blocked:'اقدام ته اړتیا لري',offline:'آفلاین حالت',backup:'شاتړ نسخه',sync:'همغږي',stock:'زېرمه',debt:'پوروال',records:'د سندونو څېړنه',action:'د حل لاره',assistant:'آفلاین لارښود',daily:'د ورځې حساب تړل (د مالک په تایید)',business:'د سوداګرۍ لارښود',warn:'دا برخه یوازې د همدې وسیلې معلومات ارزوي؛ د سرور او بېرته راګرځولو جلا ازموینه اړینه ده.'},
 en:{title:'ZAVI ONE Health & Help',ready:'Ready',unknown:'Not verified',blocked:'Action required',offline:'Offline status',backup:'Backup',sync:'Sync',stock:'Inventory',debt:'Customer debts',records:'Record checks',action:'Next step',assistant:'Offline guide',daily:'Daily close (owner approval)',business:'Business guidance',warn:'Local checks only. Server-side verification and actual recovery testing are separate.'}
};
const tr=(key,lang)=>messages[lang]?.[key]||messages.fa[key]||key;
const note=(code,level,title,advice)=>({code,level,title,advice});
function diagnose(data){
 const s=data&&typeof data==='object'?data:{},health=s.health||{},audit=s.audit||{},flags=s.flags||{},issues=[];
 const authorized=s.authorized===true;
 if(!authorized)return {authorized:false,issues:[note('AUTH','warn','حساب مالک تأیید نشده','با حساب مالک همان فروشگاه وارد شوید و قفل را باز کنید.')],status:'unknown',metrics:{}};
 if(flags.storageOk===false||health.localstorage_ok===false)issues.push(note('STORAGE','critical','حافظه دستگاه مشکل دارد','از اطلاعات فعلی پشتیبان بگیرید؛ قبل از بررسی مشکل، حافظه سایت را پاک نکنید.'));
 if(health.shell_ready===false)issues.push(note('SHELL','warn','فایل‌های آفلاین کامل نیست','با اینترنت دکمه آماده‌سازی دوباره فایل‌ها را بزنید.'));
 if(health.lease_valid===false)issues.push(note('LEASE','warn','مجوز آفلاین معتبر نیست','وضعیت اشتراک و دستگاه اصلی را بررسی و در صورت نیاز مجوز امن دریافت کنید.'));
 if(flags.conflict===true||health.sync_conflict===true)issues.push(note('CONFLICT','critical','تعارض همگام‌سازی ثبت شده','فروش و خرید تازه را متوقف کنید. هیچ داده یا کش را پاک نکنید؛ گزارش و بک‌آپ را برای بررسی نگه دارید.'));
 if(flags.pending===true||health.pending_changes===true)issues.push(note('PENDING','warn','عملیات محلی هنوز همگام نشده','با اینترنت و حساب مالک همگام‌سازی کنید؛ تا پایان تأیید، دستگاه را منتقل نکنید.'));
 if(flags.online===false)issues.push(note('NETWORK','info','اینترنت قطع است','فقط اگر مجوز و فایل‌های آفلاین معتبرند، در همان دستگاه آفلاین کار کنید.'));
 if(!flags.backupAt||Date.now()-Number(flags.backupAt)>7*86400000)issues.push(note('BACKUP','warn','پشتیبان تازه قابل تأیید نیست','از تنظیمات پشتیبان رمزدار بگیرید و بازیابی آن را در محیط جدا آزمایش کنید.'));
 if(audit.status==='invalid'||(audit.severityCounts?.critical||0)>0)issues.push(note('DATA','critical','اشکال ساختار یا شناسه‌های حسابداری','بدون ویرایش خودکار، گزارش خطا را با مالک بررسی کنید و پیش از تغییر پشتیبان بگیرید.'));
 else if((audit.severityCounts?.high||0)>0)issues.push(note('DATA_HIGH','warn','موارد نیازمند بررسی در اسناد','گزارش کنترل اطلاعات را باز و موارد را یکی‌یکی بررسی کنید.'));
 const alerts=s.alerts||{};if(Array.isArray(alerts.lowStock)&&alerts.lowStock.length)issues.push(note('LOW_STOCK','info',`${alerts.lowStock.length} محصول کم‌موجود است`,'در گدام مقدار و حد سفارش محصول را بررسی کنید؛ سفارش خرید خودکار ثبت نمی‌شود.'));
 if(Array.isArray(alerts.dueDebts)&&alerts.dueDebts.length)issues.push(note('DEBT_DUE','info',`${alerts.dueDebts.length} قرض سررسید شده است`,'در حساب قرضداران مبلغ و تاریخ را بررسی کنید و با تأیید مالک یادآوری بفرستید.'));
 const severe=issues.some(x=>x.level==='critical');return {authorized:true,issues,status:severe?'critical':issues.length?'attention':'healthy',metrics:{lowStock:Array.isArray(alerts.lowStock)?alerts.lowStock.length:null,dueDebts:Array.isArray(alerts.dueDebts)?alerts.dueDebts.length:null,pending:!!flags.pending,lease:health.lease_valid===true,shell:health.shell_ready===true,cloudVerified:flags.cloudVerified===true,backupAt:number(flags.backupAt)||null}};
}
function dailyPreview(data){
 if(!data?.authorized)return {authorized:false};
 const summary=data.todaySummary||{},today=String(data.today||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(today))return {authorized:false};
 const entry={date:today,currency:String(data.currency||'AFN'),sales:number(summary.sales),salesCount:number(summary.salesCount),purchases:number(summary.purchases),expenses:number(summary.expenses),cogs:number(summary.cogs),profit:number(summary.profit),cash:number(data.cash),receivable:number(data.receivable),payable:number(data.payable),recordCount:number(data.recordCount),computedAt:new Date().toISOString()};
 return {authorized:true,...entry,printable:`ZAVI ONE | ${today}\nفروش: ${format(entry.sales)} ${entry.currency}\nخرید: ${format(entry.purchases)} ${entry.currency}\nمصارف: ${format(entry.expenses)} ${entry.currency}\nمفاد تخمینی: ${format(entry.profit)} ${entry.currency}\nصندوق‌ها: ${format(entry.cash)} ${entry.currency}\nطلب مشتریان: ${format(entry.receivable)} ${entry.currency}\nقرض ما: ${format(entry.payable)} ${entry.currency}\nاین گزارش محلی و قبل از مصالحه بانکی است.`};
}
function answer(question,report,lang='fa'){
 const q=normalize(question),a=report?.issues||[],found=code=>a.find(x=>x.code===code);
 if(!q)return null;
 if(/(?:مشکل|عیب|خراب|سلامت|diagnos|problem|error|ستونز|ستونزه|روغتیا)/.test(q)){
  if(!report?.authorized)return 'برای بررسی مشکلات فروشگاه اول حساب مجاز را باز کنید.';
  return a.length?'بررسی محلی این موارد را پیدا کرد:\n'+a.slice(0,5).map(x=>'• '+x.title+' — '+x.advice).join('\n'):'در بررسی محلی فعلاً مشکل تأییدشده دیده نشد؛ این نتیجه جایگزین آزمون سرور نیست.';
 }
 if(/(?:آفلاین|offline|بې انټرنېټ|افلاین|مجوز دستگاه)/.test(q)){
  if(!report?.authorized)return 'برای بررسی مجوز آفلاین باید وارد حساب مالک مجاز شوید.';
  return [found('CONFLICT'),found('PENDING'),found('SHELL'),found('LEASE')].filter(Boolean).map(x=>x.title+'؛ '+x.advice).join('\n')||'فایل و مجوز آفلاینِ این دستگاه در بررسی محلی مشکلی نشان نداده‌اند. قطع اینترنت و ثبت آزمایشی را جداگانه آزمایش کنید.';
 }
 if(/(?:پشتیبان|backup|بکاپ|شاتړ)/.test(q))return found('BACKUP')?.advice||'پشتیبان منظم و آزمایش بازیابی را ادامه دهید؛ فایل پشتیبان را در محل امن خارج از دستگاه نگهداری کنید.';
 if(/(?:قرض|پور|debt|یادآوری)/.test(q)&&found('DEBT_DUE'))return found('DEBT_DUE').title+'؛ '+found('DEBT_DUE').advice;
 if(/(?:موجودی|گدام|stock|inventory|زېرمه)/.test(q)&&found('LOW_STOCK'))return found('LOW_STOCK').title+'؛ '+found('LOW_STOCK').advice;
 if(/(?:بستن روز|روزنامه|daily close|day close|د ورځې)/.test(q))return '«مرکز سلامت و کمک → گزارش روزانه» را باز کنید. اول پیش‌نمایش را ببینید و اگر ارقام درست بود مالک دکمه ثبت در روزنامچه را بزند. این ثبت، معاملات قبلی را قفل یا حذف نمی‌کند.';
 if(/(?:فاکتور اشتباه|تقلب|دستکاری|حذف فاکتور|duplicate|تکراری|fraud|audit)/.test(q))return '«کنترل اسناد» خطاهای ساختاری و فاکتورهای تکراری را بررسی می‌کند. این هشدار به‌تنهایی دلیل تقلب نیست؛ اسناد باید دستی و با سابقه بررسی شوند.';
 return null;
}
return Object.freeze({diagnose,dailyPreview,answer,tr,safe,format});
});

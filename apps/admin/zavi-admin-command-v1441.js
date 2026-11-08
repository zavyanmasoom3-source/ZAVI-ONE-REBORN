/* ZAVI ONE ADMIN 1.4.41 — private owner control centre, 2026-10-27.
 * Additive feature. No existing routes, financial records, subscriptions or auth are modified.
 * WhatsApp links are prepared manually; NEVER claim delivery from a wa.me URL.
 */
(()=>{'use strict';
const $=(s,p=document)=>p.querySelector(s);
const mk=(tag,cl,text)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(text!==undefined)e.textContent=String(text);return e};
const locale=()=>{const v=String($('#zaviAdminLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'};
const dict={
fa:{nav:'مرکز مدیریت و پیام‌ها',title:'مرکز پیشرفته ZAVI ONE',description:'پیام مستقیم، پشتیبانی، اشتراک‌ها، سلامت و امنیت؛ فقط مالک مرکزی.',messages:'پیام‌های مستقیم',support:'پشتیبانی',health:'سلامت سیستم',billing:'درآمد و پرداخت',audit:'تاریخچه مدیریت',releases:'انتشار و پشتیبان',close:'بستن',search:'جستجوی مشتری',subject:'نوع پیام',select:'انتخاب مشتری',preview:'متن آماده و قابل ویرایش',open:'بازکردن واتساپ',copy:'کاپی پیام',mark:'ثبت تأیید دستی ارسال',sentNote:'واتساپ باز شد؛ ارسال را خودتان تأیید کنید. سپس در صورت ارسال، دکمه ثبت را بزنید.',noContact:'شماره واتساپ با رضایت مشتری موجود نیست.',marketing:'برای پیام تبلیغاتی رضایت جداگانه مشتری لازم است.',confirm:'قبل از بازکردن واتساپ، مخاطب و متن را بررسی کردم.',duplicate:'این پیام در همین نشست ثبت شده است؛ لطفاً تکرار را بررسی کنید.',session:'سوابق این بخش فعلاً فقط در نشست فعلی ذخیره می‌شود؛ برای تاریخچه پایدار، ارتقای امن دیتابیس ضروری است.',refresh:'تازه‌سازی',empty:'موردی پیدا نشد.',loading:'دریافت اطلاعات از سرور...',error:'اطلاعات دریافت نشد. اتصال و دسترسی مالک را بررسی کنید.',owner:'این بخش مخصوص مالک اصلی سیستم است.',workspace:'فروشگاه',expires:'ختم اشتراک',remaining:'روز باقی‌مانده',active:'مشتری فعال',expired:'منقضی',trial:'آزمایشی',receipts:'رسیدهای پرداخت',supportReply:'پاسخ به درخواست',sendReply:'ثبت پاسخ در سرور',closeTicket:'بستن درخواست بعد از پاسخ',auditDesc:'ثبت فعالیت‌های حساس در سرور؛ داده‌ها فقط قابل مشاهده‌اند.',healthDesc:'وضعیت اشتراک، دستگاه‌های آفلاین و همگام‌سازی بر اساس پاسخ سرور.',backupDesc:'نسخه پشتیبان محرمانه با رمزگذاری و آزمایش بازیابی باید قبل از انتشار کنترل شود.',releaseDesc:'نسخه‌ها ابتدا به گروه آزمایشی و سپس برای همه مشتریان منتشر شوند. انتشار خودکار از این صفحه انجام نمی‌شود.',download:'دریافت گزارش همین نشست',ticket:'درخواست مشتری',summary:'خلاصه',unaudited:'ارقام آزمایشی/مرور؛ با گزارش مالی تأییدشده تطبیق کنید.',optin:'شماره بدون رضایت',manual:'ارسال دستی',note:'یادداشت',openPortal:'بازکردن صفحه انتشار در GitHub',validation:'تأیید ارسال واقعی را فقط بعد از انجام در واتساپ ثبت کنید.',copied:'متن کاپی شد.',logSaved:'تأیید در نشست ثبت شد.',noRecords:'هنوز سابقه‌ای در این نشست نیست.',date:'تاریخ',total:'مجموع',safe:'بدون تغییر به دیتابیس اصلی',export:'خروجی CSV'},
ps:{nav:'د مدیریت او پیغامونو مرکز',title:'د ZAVI ONE د مدیریت مرکز',description:'مستقیم پیغامونه، ملاتړ، ګډون، امنیت او روغتیا یوازې د مرکزي مالک لپاره.',messages:'مستقیم پیغامونه',support:'ملاتړ',health:'د سیسټم حالت',billing:'عواید او تادیات',audit:'د مدیریت تاریخچه',releases:'خپرول او شاتړ',close:'بندول',search:'د پېرودونکي لټون',subject:'د پیغام ډول',select:'پېرودونکی',preview:'چمتو پیغام',open:'واټساپ پرانیستل',copy:'کاپي پیغام',mark:'د لېږلو تایید ثبت',sentNote:'واټساپ پرانیستل شو؛ پخپله یې ولېږئ او بیا ثبت کړئ.',noContact:'د اجازې سره د واټساپ شمېره نشته.',marketing:'د اعلان لپاره جلا اجازه پکار ده.',confirm:'شمېره او متن مې کتلي دي.',duplicate:'دغه پیغام په دې ناسته کې ثبت شوی.',session:'تاریخچه یوازې په دې ناسته کې ده؛ د دوام لپاره امن ډیټابېس اپډېټ پکار دی.',refresh:'نوي کول',empty:'څه ونه موندل شول.',loading:'له سرور معلومات اخیستل کېږي...',error:'معلومات ترلاسه نه شول.',owner:'یوازې اصلي مالک',workspace:'دوکان',expires:'د پای نېټه',remaining:'پاتې ورځې',active:'فعال',expired:'ختم شوی',trial:'آزمایښتي',receipts:'د تادیې رسیدونه',supportReply:'ځواب',sendReply:'ځواب ثبتول',closeTicket:'د ځواب وروسته تړل',auditDesc:'په سرور کې د مدیریت حساس تاریخچه.',healthDesc:'د ګډون او همغږۍ حالت.',backupDesc:'خوندي شاتړ او بیا راګرځول وازمایئ.',releaseDesc:'لومړی آزمایښتي خپرول او بیا ټولو ته.',download:'د ناستې راپور',ticket:'د پیرودونکي غوښتنه',summary:'لنډیز',unaudited:'دقیق ارقام له تایید شوي راپور سره پرتله کړئ.',optin:'د اجازې پرته',manual:'لاسي',note:'یادښت',openPortal:'په GitHub کې خپرونه',validation:'یوازې له اصلي لېږلو وروسته ثبت کړئ.',copied:'پیغام کاپي شو.',logSaved:'په ناسته کې ثبت شو.',noRecords:'تاریخچه نشته.',date:'نېټه',total:'ټول',safe:'اصلي ډیټابېس ته بدلون نشته',export:'CSV'},
en:{nav:'Communications & control',title:'ZAVI ONE Owner Control Center',description:'Direct messages, support, billing, health and security — central owner only.',messages:'Direct messages',support:'Support tickets',health:'System health',billing:'Revenue & payments',audit:'Admin audit',releases:'Release & backup',close:'Close',search:'Find customer',subject:'Message type',select:'Select customer',preview:'Review and edit message',open:'Open WhatsApp',copy:'Copy message',mark:'Manually confirm sent',sentNote:'WhatsApp opened. Send it yourself, then mark sent only if delivered from your account.',noContact:'No consented WhatsApp contact available.',marketing:'Marketing messages require separate marketing opt-in.',confirm:'I reviewed the recipient and message.',duplicate:'This message was already recorded in this session.',session:'Message log is session-only until the secure backend migration is deployed.',refresh:'Refresh',empty:'No results.',loading:'Loading from server...',error:'Could not load. Check connection and owner permissions.',owner:'Central owner access only.',workspace:'Store',expires:'Expiry',remaining:'days remaining',active:'Active',expired:'Expired',trial:'Trial',receipts:'Payment receipts',supportReply:'Reply to ticket',sendReply:'Save reply on server',closeTicket:'Close ticket after replying',auditDesc:'View server activity logs without changing customer accounts.',healthDesc:'Subscription, device and synchronization status from server.',backupDesc:'Verify an encrypted database backup and test restoring it before going live.',releaseDesc:'Release to a test group first, then promote. No automatic deployment from this screen.',download:'Download session report',ticket:'Customer ticket',summary:'Summary',unaudited:'Preliminary overview, reconcile with verified accounting report.',optin:'Without consent',manual:'Manual',note:'Note',openPortal:'View GitHub releases',validation:'Only mark sent after manually confirming actual send in WhatsApp.',copied:'Message copied.',logSaved:'Recorded in current session.',noRecords:'No session history yet.',date:'Date',total:'Total',safe:'Production data not changed',export:'CSV'}
};
const t=()=>dict[locale()];
const templates={
welcome:{fa:'خوش آمدید به ZAVI ONE! از اعتماد شما سپاسگزاریم. در صورت نیاز به راهنمایی با مدیریت تماس بگیرید.',ps:'ZAVI ONE ته ښه راغلاست! د لارښوونې لپاره له مدیریت سره اړیکه ونیسئ.',en:'Welcome to ZAVI ONE! Thank you for joining. Contact our team if you need help.'},
expiry:{fa:'سلام {name}، از اشتراک شما {days} روز باقی مانده است. تاریخ پایان: {date}. لطفاً برای تمدید با مدیریت تماس بگیرید.',ps:'سلام {name}، ستاسو د ګډون {days} ورځې پاتې دي. پای نېټه: {date}. د نوي کولو لپاره اړیکه ونیسئ.',en:'Hello {name}, your subscription has {days} days left (expires {date}). Please contact us to renew.'},
expired:{fa:'سلام {name}، اعتبار ZAVI ONE شما در تاریخ {date} پایان یافته است. برای تمدید با مدیریت تماس بگیرید.',ps:'سلام {name}، ستاسو د ZAVI ONE ګډون په {date} پای ته رسېدلی دی.',en:'Hello {name}, your ZAVI ONE subscription expired on {date}. Contact us to renew.'},
congrats7:{fa:'تبریک {name}! اشتراک ZAVI ONE شما به مدت ۷ روز تمدید شد. از همراهی شما سپاسگزاریم. 🎉',ps:'مبارک {name}! ستاسو ګډون د ۷ ورځو لپاره نوی شو. 🎉',en:'Congratulations {name}! Your ZAVI ONE subscription has been renewed for 7 days. 🎉'},
congrats180:{fa:'تبریک {name}! اشتراک ZAVI ONE شما به مدت ۱۸۰ روز تمدید شد. موفق باشید! 🎉',ps:'مبارک {name}! ستاسو ګډون د ۱۸۰ ورځو لپاره نوی شو. 🎉',en:'Congratulations {name}! Your subscription is renewed for 180 days. 🎉'},
congrats365:{fa:'تبریک {name}! اشتراک ZAVI ONE شما به مدت ۳۶۵ روز تمدید شد. از اعتماد شما سپاسگزاریم! 🎉',ps:'مبارک {name}! ستاسو ګډون د ۳۶۵ ورځو لپاره نوی شو. 🎉',en:'Congratulations {name}! Your ZAVI ONE subscription is renewed for 365 days. 🎉'},
receipt:{fa:'سلام {name}، پرداخت اشتراک شما ثبت شده است. برای دریافت رسید رسمی به مدیریت پیام دهید.',ps:'سلام {name}، ستاسو تادیه ثبت شوه. د رسید لپاره له مدیریت سره اړیکه ونیسئ.',en:'Hello {name}, your subscription payment has been recorded. Contact us for the official receipt.'},
update:{fa:'سلام {name}، نسخه تازه ZAVI ONE آماده است. قبل از نصب، معاملات آفلاین را همگام‌سازی و نسخه پشتیبان تهیه کنید.',ps:'سلام {name}، د ZAVI ONE نوې نسخه چمتو ده. مخکې له نصب شاتړ واخلئ.',en:'Hello {name}, a new ZAVI ONE version is available. Sync offline transactions and back up data before updating.'},
support:{fa:'سلام {name}، درخواست پشتیبانی شما دریافت شد. مدیریت پس از بررسی پاسخ خواهد داد.',ps:'سلام {name}، ستاسو د ملاتړ غوښتنه ترلاسه شوه.',en:'Hello {name}, we received your support request and will respond after review.'},
followup:{fa:'سلام {name}، آیا مشکل شما برطرف شده است؟ در صورت نیاز، پیام دهید تا پیگیری کنیم.',ps:'سلام {name}، آیا ستاسو ستونزه حل شوې ده؟',en:'Hello {name}, has your issue been resolved? We can follow up if needed.'},
security:{fa:'سلام {name}، برای امنیت حساب، رمز خصوصی و کدهای ورود خود را با هیچ‌کس شریک نکنید؛ مدیریت هرگز رمز شما را درخواست نمی‌کند.',ps:'سلام {name}، خپل رمز او کوډ هېچا سره مه شریکوئ.',en:'Hello {name}, never share your private password or sign-in codes. Our team will never request your password.'},
thanks:{fa:'سلام {name}، از اعتماد شما به ZAVI ONE سپاسگزاریم. موفقیت کسب‌وکار شما آرزوی ماست.',ps:'سلام {name}، پر ZAVI ONE ستاسو له باور څخه مننه.',en:'Hello {name}, thank you for trusting ZAVI ONE. Wishing your business continued success.'},
marketing:{fa:'سلام {name}، خبر ویژه از ZAVI ONE: [متن پیشنهاد را با اطلاعات تأییدشده تکمیل کنید].',ps:'سلام {name}، له ZAVI ONE څخه ځانګړی خبر: [تایید شوی متن].',en:'Hello {name}, news from ZAVI ONE: [enter verified offer details].'}
};
const tname={fa:{welcome:'خوشامدگویی',expiry:'یادآوری تمدید',expired:'اعتبار تمام‌شده',congrats7:'تبریکی ۷ روزه',congrats180:'تبریکی ۱۸۰ روزه',congrats365:'تبریکی ۳۶۵ روزه',receipt:'رسید پرداخت',update:'اطلاعیه آپدیت',support:'دریافت پشتیبانی',followup:'پیگیری مشکل',security:'هشدار امنیت',thanks:'تشکر از مشتری',marketing:'پیشنهاد تبلیغاتی'},ps:{welcome:'ښه راغلاست',expiry:'د نوي کولو یادونه',expired:'ختم شوی ګډون',congrats7:'۷ ورځو مبارکي',congrats180:'۱۸۰ ورځو مبارکي',congrats365:'۳۶۵ ورځو مبارکي',receipt:'د تادیې رسید',update:'د اپډېټ خبر',support:'ملاتړ',followup:'تعقیب',security:'امنیت',thanks:'مننه',marketing:'اعلان'},en:{welcome:'Welcome',expiry:'Renewal reminder',expired:'Expired',congrats7:'7-day congratulations',congrats180:'180-day congratulations',congrats365:'365-day congratulations',receipt:'Payment receipt',update:'Update notice',support:'Support received',followup:'Support follow-up',security:'Security reminder',thanks:'Thank you',marketing:'Marketing offer'}};
const state={root:null,tab:'messages',customers:[],contacts:[],selected:null,template:'expiry',text:'',search:'',confirmed:false,opened:false,log:[],serverHistory:[],tickets:[],lastError:'',busy:false};
const isOwner=()=>window.ZaviAdminAPI?.getMode?.()==='live'&&$('#appScreen')&&!$('#appScreen').hidden;
function portalRpc(name,body={}){if(!isOwner())return Promise.reject(Error(t().owner));return window.ZaviAdminAPI.request('/rest/v1/rpc/'+name,{method:'POST',body})}
function expiry(r){if(!r?.expires_at)return null;const d=new Date(r.expires_at);return Number.isFinite(d.getTime())?d:null}
function days(r){const d=expiry(r);return d?Math.ceil((d.getTime()-Date.now())/86400000):null}
function phoneFor(r){const email=String(r?.owner_email||'').toLowerCase().trim();const c=state.contacts.find(x=>x.contact_opt_in===true && String(x.account_email||'').trim().toLowerCase()===email);const raw=String(c?.whatsapp_e164||c?.phone_e164||'').replace(/[\s()\-]/g,'');return /^\+[1-9][0-9]{5,14}$/.test(raw)?{value:raw,marketing:c.marketing_opt_in===true}:null}
function record(){return state.customers.find(r=>String(r.workspace_id)===String(state.selected))}
function getMessage(r){const v=templates[state.template]?.[locale()]||'';const d=expiry(r);const date=d?d.toLocaleDateString(locale()==='en'?'en-GB':'fa-IR',{timeZone:'Asia/Kabul',year:'numeric',month:'short',day:'numeric'}):'—';return v.replaceAll('{name}',String(r?.workspace_name||'—')).replaceAll('{days}',String(Math.max(0,days(r)??0))).replaceAll('{date}',date)+'\n\nZAVI ONE'}
function guardNumber(){const p=phoneFor(record());return p&&(state.template!=='marketing'||p.marketing)?p:null}
function msgStatus(s){const el=$('#z141-status',state.root);if(el){el.hidden=!s;el.textContent=s}}
function makeButton(label,handler,cls='',disabled=false){const b=mk('button',cls,label);b.type='button';b.disabled=disabled;b.addEventListener('click',handler);return b}
function show(tab){state.tab=tab;render()}
function readCustomerRows(){return (window.ZaviAdminAPI?.getRows?.()||[]).filter(r=>r.workspace_id)}
async function refresh(){
 if(!isOwner())return msgStatus(t().owner);
 state.busy=true;render();
 try{
  const [contacts,tickets,history]=await Promise.allSettled([
   portalRpc('zavi_admin_registration_contacts'),
   portalRpc('zavi_admin_support_list'),
   portalRpc('zavi_admin_message_history_v6595',{p_limit:75})
  ]);
  state.customers=readCustomerRows();
  state.contacts=contacts.status==='fulfilled'&&Array.isArray(contacts.value)?contacts.value.filter(c=>c.contact_opt_in===true):[];
  state.tickets=tickets.status==='fulfilled'&&Array.isArray(tickets.value)?tickets.value:[];
  state.serverHistory=history.status==='fulfilled'&&Array.isArray(history.value)?history.value:[];
  state.lastError=contacts.status==='rejected'?t().error:'';
 }catch(e){state.lastError=t().error}
 finally{state.busy=false;render()}
}
function csv(name,lines){const s='\ufeff'+lines.map(r=>r.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([s],{type:'text/csv;charset=utf-8'}));const a=mk('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2500)}
function messageUI(body){
 const w=t();
 const row=mk('div','z141-grid');
 const choose=mk('select');choose.setAttribute('aria-label',w.select);
 choose.append(new Option(w.select,''));
 state.customers.filter(r=>(r.workspace_name+' '+r.owner_email).toLowerCase().includes(state.search.toLowerCase())).forEach(r=>choose.append(new Option((r.workspace_name||'—')+' — '+(r.owner_email||''),String(r.workspace_id))));
 choose.value=state.selected||'';choose.addEventListener('change',()=>{state.selected=choose.value;state.confirmed=false;state.opened=false;state.text=getMessage(record());render()});
 const search=mk('input');search.placeholder=w.search;search.type='search';search.value=state.search;search.addEventListener('input',()=>{state.search=search.value;const start=search.selectionStart;const fresh=$('#z141-body');if(fresh)messageUI(fresh);const input=$('#z141-search');input?.focus();input?.setSelectionRange(start,start)});
 search.id='z141-search';
 const template=mk('select');template.setAttribute('aria-label',w.subject);
 Object.keys(templates).forEach(id=>template.append(new Option(tname[locale()][id],id)));
 template.value=state.template;template.addEventListener('change',()=>{state.template=template.value;state.text=getMessage(record());state.confirmed=false;state.opened=false;render()});
 row.append(search,choose,template);
 const desc=mk('p','z141-tip',w.session);const form=mk('div','z141-column');
 const rec=record(),p=phoneFor(rec);const textArea=mk('textarea');textArea.rows=7;textArea.value=state.text||getMessage(rec);textArea.setAttribute('aria-label',w.preview);textArea.maxLength=1600;
 textArea.addEventListener('input',()=>{state.text=textArea.value;state.confirmed=false;$('#z141-ack').checked=false});
 const ack=mk('label','z141-ack');const tick=mk('input');tick.type='checkbox';tick.id='z141-ack';tick.checked=state.confirmed;tick.addEventListener('change',()=>{state.confirmed=tick.checked;render()});ack.append(tick,mk('span','',w.confirm));
 const actions=mk('div','z141-actions');
 const allowed=!!rec&&!!p&&!!guardNumber();
 actions.append(makeButton(w.open,()=>{
  if(!state.confirmed||!allowed)return;
  const url='https://wa.me/'+p.value.slice(1)+'?text='+encodeURIComponent(state.text||getMessage(rec));
  state.opened=true;window.open(url,'_blank','noopener,noreferrer');msgStatus(w.sentNote);
 },'z141-primary',!(state.confirmed&&allowed)));
 actions.append(makeButton(w.copy,async()=>{try{await navigator.clipboard.writeText(state.text||getMessage(rec));msgStatus(w.copied)}catch(_){msgStatus(w.error)}},'',!rec));
 actions.append(makeButton(w.mark,()=>{
   if(!state.opened||!state.confirmed)return;
   const key=[rec.workspace_id,state.template,new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kabul'})].join('|');
   if(state.log.some(x=>x.key===key))return msgStatus(w.duplicate);
   const log={key,when:new Date().toISOString(),workspace:rec.workspace_name,workspace_id:rec.workspace_id,kind:state.template,status:'manually-confirmed-in-session'};
   state.log.unshift(log);state.opened=false;state.confirmed=false;render();msgStatus(w.logSaved+' · '+w.session);
   // Backend logging is optional until the staged, owner-checked migration is installed.
   portalRpc('zavi_admin_message_mark_v6595',{p_workspace_id:rec.workspace_id,p_template_key:state.template,p_state:'owner_confirmed_sent',p_note:''}).then(res=>{
     if(res?.recorded){log.status='owner-confirmed-on-server';msgStatus(w.logSaved)}
   }).catch(()=>msgStatus(w.logSaved+' · '+w.session));
 },'',!state.opened));
 actions.append(makeButton(w.export,()=>csv('ZAVI_ADMIN_MESSAGE_SESSION.csv',[['date','workspace','template','status'],...state.log.map(x=>[x.when,x.workspace,x.kind,x.status])]),'',!state.log.length));
 const warning=mk('p','z141-warning',!rec?w.select:!p?w.noContact:!guardNumber()?w.marketing:w.validation);
 form.append(row,desc,textArea,ack,warning,actions);
 const history=mk('div','z141-history');
 history.append(mk('h3','',w.manual+' · '+w.total+': '+state.log.length));
 if(!state.log.length && !state.serverHistory.length)history.append(mk('p','',w.noRecords));
 state.log.slice(0,12).forEach(x=>history.append(mk('div','z141-logrow',x.workspace+' • '+(tname[locale()][x.kind]||x.kind)+' • '+new Date(x.when).toLocaleString())));
 state.serverHistory.slice(0,45).forEach(x=>history.append(mk('div','z141-logrow',(x.workspace_name||'—')+' • '+(tname[locale()][x.template_key]||x.template_key)+' • '+(x.state||'')+' • '+(x.occurred_at||''))));
 body.replaceChildren(form,history);
}
async function supportUI(body){
 const w=t();body.replaceChildren(mk('p','z141-tip',w.supportReply));
 if(!state.tickets.length)return body.append(mk('p','z141-empty',w.empty));
 const list=mk('div','z141-cards');
 state.tickets.slice(0,60).forEach(ticket=>{
  const item=mk('article','z141-item');
  item.append(mk('strong','',ticket.subject||w.ticket),mk('p','',ticket.body||''),mk('small','',ticket.status||''));
  if(ticket.reply)item.append(mk('p','',ticket.reply));
  if(ticket.status!=='closed'){
    const input=mk('textarea');input.rows=3;input.maxLength=2000;input.placeholder=w.supportReply;
    const end=mk('label','z141-ack');const chk=mk('input');chk.type='checkbox';end.append(chk,mk('span','',w.closeTicket));
    const send=makeButton(w.sendReply,async()=>{
      const v=input.value.trim();if(v.length<5||v.length>2000)return;
      if(!isOwner())return msgStatus(w.owner);
      send.disabled=true;
      try{await portalRpc('zavi_admin_support_reply',{p_ticket_id:ticket.id,p_reply:v,p_close:chk.checked});msgStatus(w.safe);await refresh()}catch(_){msgStatus(w.error);send.disabled=false}
    },'z141-primary');
    item.append(input,end,send)
  }
  list.append(item);
 });body.append(list)
}
function overviewUI(body,mode){
 const w=t(),row=mk('div','z141-cards'),num=v=>Number.isFinite(v)?v.toLocaleString():'—';
 const make=(title,value,caption)=>{const item=mk('article','z141-item');item.append(mk('small','',title),mk('strong','z141-value',value),mk('p','',caption||''));row.append(item)};
 const customers=state.customers,now=Date.now();
 make(w.total,num(customers.length),w.workspace);
 make(w.active,num(customers.filter(r=>r.status==='active'||r.plan==='lifetime').length),w.summary);
 make(w.expired,num(customers.filter(r=>expiry(r)?.getTime()<now).length),w.expires);
 make(w.trial,num(customers.filter(r=>r.plan==='trial').length),w.trial);
 body.replaceChildren(row,mk('p','z141-tip',mode==='health'?w.healthDesc:mode==='billing'?w.unaudited:w.auditDesc));
 if(mode==='billing'){
  const select=mk('select');select.append(new Option(w.select,''));
  customers.forEach(r=>select.append(new Option(r.workspace_name||r.owner_email,r.workspace_id)));
  const receipt=mk('div','z141-cards');
  select.addEventListener('change',async()=>{receipt.replaceChildren(mk('p','',w.loading));try{const res=await portalRpc('zavi_admin_receipts',{p_workspace_id:select.value});receipt.replaceChildren();(Array.isArray(res)?res:[]).forEach(x=>{const card=mk('div','z141-item');card.append(mk('strong','',x.receipt_number||w.receipts),mk('p','',String(x.paid_amount??'')+' '+String(x.currency||'')),mk('small','',String(x.paid_at||'')));receipt.append(card)});if(!receipt.childElementCount)receipt.append(mk('p','',w.empty))}catch(_){receipt.replaceChildren(mk('p','',w.error))}});
  body.append(select,receipt);
  const live=mk('div','z141-cards');live.append(mk('p','',w.loading));body.append(live);
  portalRpc('zavi_admin_finance_snapshot').then(snap=>{
    if(!live.isConnected||state.tab!=='billing')return;
    live.replaceChildren();
    // Explicit allow-list prevents leaking unexpected PII returned in nested server objects.
    for(const k of ['total_revenue','active_customers','expired_customers','collected_afn','collected_usd','subscriptions_count']){
      if(typeof snap?.[k]==='number' || typeof snap?.[k]==='string'){
        const p=mk('article','z141-item');p.append(mk('small','',k.replaceAll('_',' ')),mk('strong','z141-value',snap[k]));live.append(p)
      }
    }
    if(!live.childElementCount)live.append(mk('p','z141-tip',w.unaudited))
  }).catch(()=>live.replaceChildren(mk('p','z141-tip',w.unaudited)));
 }else if(mode==='audit'){
  const audit=mk('div','z141-cards');
  body.append(audit);
  portalRpc('zavi_admin_v241_audit',{p_limit:40}).then(items=>{if(!body.isConnected||state.tab!=='audit')return;audit.replaceChildren();const list=Array.isArray(items)?items:Array.isArray(items?.events)?items.events:[];list.forEach(x=>audit.append(mk('div','z141-item',(x.action||x.event_type||'Event')+' · '+(x.occurred_at||x.created_at||''))));if(!audit.childElementCount)audit.append(mk('p','',w.empty))}).catch(()=>audit.append(mk('p','',w.error)));
 }else if(mode==='health'){
  const selector=mk('select');selector.append(new Option(w.select,''));
  state.customers.forEach(x=>selector.append(new Option(x.workspace_name||x.owner_email,x.workspace_id)));
  const detail=mk('article','z141-item',w.sync+' · '+w.unknown);
  selector.addEventListener('change',async()=>{
    if(!selector.value)return;
    detail.textContent=w.loading;
    try{
      const stat=await portalRpc('zavi_admin_v6570_offline_status',{p_workspace_id:selector.value});
      // Print only primitive, known explanatory indicators returned by the existing server function.
      const out=mk('div');
      for(const key of ['workspace_id','offline_allowed','unsent_count','pending_operations','last_sync_at','device_count']){
        if(stat && Object.prototype.hasOwnProperty.call(stat,key)){
          const v=stat[key];if(['string','number','boolean'].includes(typeof v))out.append(mk('p','',key+': '+String(v)))
        }
      }
      detail.replaceChildren(out);
      if(!out.childElementCount)detail.append(mk('p','',w.unknown));
    }catch(_){detail.textContent=w.error}
  });
  body.append(selector,detail,mk('p','z141-tip',w.safe));
 }
}
function releaseUI(body){
 const w=t();body.replaceChildren(mk('p','z141-tip',w.backupDesc),mk('p','z141-tip',w.releaseDesc));
 const link=mk('a','z141-link',w.openPortal);link.href='https://github.com/zavyanmasoom6-glitch/Zavione/releases';link.target='_blank';link.rel='noopener noreferrer';body.append(link);
}
function render(){
 if(!state.root||state.root.hidden)return;
 const w=t();
 $('#z141-heading').textContent=w.title;$('#z141-desc').textContent=w.description;$('#z141-close').textContent=w.close;$('#z141-refresh').textContent=w.refresh;
 const menu=$('#z141-tabs');menu.replaceChildren();
 for(const tab of ['messages','support','health','billing','audit','releases']){
  const b=makeButton(w[tab],()=>show(tab),'z141-tab'+(state.tab===tab?' is-current':''));b.setAttribute('aria-pressed',String(state.tab===tab));menu.append(b);
 }
 const body=$('#z141-body');body.replaceChildren();
 if(state.busy){body.append(mk('p','',w.loading));return}
 if(state.tab==='messages')messageUI(body);
 else if(state.tab==='support')supportUI(body);
 else if(state.tab==='releases')releaseUI(body);
 else overviewUI(body,state.tab);
 if(state.lastError)msgStatus(state.lastError)
}
function close(){
 if(!state.root)return;state.root.hidden=true;state.contacts=[];state.customers=[];state.tickets=[];state.text='';state.confirmed=false;state.opened=false;document.body.classList.remove('z141-open')
}
function open(){
 if(!isOwner()){window.ZaviAdminAPI?.notify?.(t().owner,true);return}
 if(!state.root)build();
 state.root.hidden=false;document.body.classList.add('z141-open');state.tab='messages';state.search='';state.selected=null;state.text='';state.log=[];state.lastError='';render();refresh();
}
function build(){
 const outer=mk('div','z141-overlay');outer.id='z141-center';outer.hidden=true;
 const modal=mk('section','z141-shell');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','z141-heading');
 const header=mk('header','z141-head');const titles=mk('div');const h=mk('h2');h.id='z141-heading';const p=mk('p');p.id='z141-desc';titles.append(h,p);
 const controls=mk('div','z141-headcontrols');
 const reload=makeButton(t().refresh,refresh);reload.id='z141-refresh';
 const cancel=makeButton(t().close,close);cancel.id='z141-close';
 controls.append(reload,cancel);header.append(titles,controls);
 const menu=mk('nav','z141-tabs');menu.id='z141-tabs';menu.setAttribute('aria-label','ZAVI ONE ADMIN tools');
 const status=mk('p','z141-status');status.id='z141-status';status.hidden=true;status.setAttribute('role','status');
 const body=mk('section','z141-body');body.id='z141-body';
 modal.append(header,menu,status,body);outer.append(modal);
 outer.addEventListener('click',e=>{if(e.target===outer)close()});
 document.body.append(outer);state.root=outer;
}
function install(){
 const nav=$('#appScreen .sidebar .nav');
 if(!nav||$('#z141-menu'))return;
 const b=mk('button','nav-item z141-entry',t().nav);b.id='z141-menu';b.type='button';b.addEventListener('click',open);
 nav.append(b)
}
function init(){
 install();
 let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;install()})}).observe(document.body,{childList:true,subtree:false});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.root&&!state.root.hidden)close()});
 document.addEventListener('change',e=>{if(e.target?.id==='zaviAdminLanguage'){const b=$('#z141-menu');if(b)b.textContent=t().nav;if(state.root&&!state.root.hidden)render()}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)close()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

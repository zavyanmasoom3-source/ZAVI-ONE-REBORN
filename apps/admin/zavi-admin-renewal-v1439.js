/* ZAVI ONE ADMIN 1.4.39 — renewal reminder with WhatsApp message and PNG card.
 * No background messaging, no customer changes, no private-key exposure.
 * Contact details are loaded only via server-guarded owner registration RPC.
 */
(()=>{'use strict';
const q=(s,p=document)=>p.querySelector(s);
const messages={
 fa:{nav:'یادآوری تمدید',title:'یادآوری تمدید اشتراک مشتریان',subtitle:'زمان باقی‌مانده را ببینید، پیام را بازبینی کنید و کارت تصویر بسازید.',search:'جستجوی فروشگاه یا ایمیل',urgent:'پایان‌یافته و ۳۰ روز یا کمتر',all:'همه اشتراک‌های مدت‌دار',refresh:'تازه‌سازی',close:'بستن',expired:'اعتبار پایان یافته',days:'روز باقی‌مانده',today:'امروز پایان می‌یابد',date:'تاریخ پایان به وقت افغانستان',send:'بازکردن واتساپ با پیام',download:'دریافت عکس تمدید',share:'اشتراک عکس و پیام',copy:'کاپی پیام',noContact:'شماره واتساپ با رضایت مشتری ثبت نشده است.',denied:'این گزینه فقط در حساب واقعی مالک مرکزی فعال است.',noRecords:'مشتری نزدیک به ختم اعتبار پیدا نشد.',sent:'واتساپ باز شد. ارسال نهایی را خودتان تأیید کنید.',saved:'عکس ساخته شد؛ برای ارسال عکس آن را در گفتگوی واتساپ پیوست کنید.',copied:'متن کاپی شد.',error:'دریافت شماره‌های مشتریان ممکن نشد؛ دوباره تلاش کنید.',life:'اشتراک دائمی',noExpiry:'بدون تاریخ پایان',greeting:'سلام و احترام',msgExpired:'اعتبار اشتراک ZAVI ONE شما پایان یافته است.',msgRemain:'از اشتراک ZAVI ONE شما فقط {n} روز باقی مانده است.',msgToday:'اعتبار اشتراک ZAVI ONE شما امروز پایان می‌یابد.',msgEnd:'تاریخ پایان اعتبار',msgAction:'برای تمدید، لطفاً به مدیریت ZAVI ONE پیام بدهید. سپاس از شما.',media:'کارت یادآوری تمدید',copyThen:'متن و عکس را دستی در گفتگوی واتساپ پیوست کنید.',timeNote:'محاسبه تاریخ با زمان افغانستان (Asia/Kabul) انجام می‌شود.'},
 ps:{nav:'د نوي کولو یادونه',title:'د ګډون نوي کولو یادونه',subtitle:'پاتې ورځې او انځور وګورئ، بیا پیغام په خپله واستوئ.',search:'دوکان یا برېښنالیک',urgent:'ختم شوي یا ۳۰ ورځې او لږ',all:'ټول مهالوېش لرونکي ګډونونه',refresh:'نوي کول',close:'بندول',expired:'ګډون پای ته رسېدلی',days:'پاتې ورځې',today:'نن پای ته رسېږي',date:'د افغانستان د وخت له مخې پای نېټه',send:'واټساپ د پیغام سره خلاصول',download:'انځور ښکته کول',share:'انځور او پیغام شریکول',copy:'پیغام کاپي کول',noContact:'د اجازې سره د واټساپ شمېره نه ده ثبت شوې.',denied:'یوازې اصلي مرکزي مدیر دا برخه کارولی شي.',noRecords:'نږدې پای ته رسېدونکی ګډون ونه موندل شو.',sent:'واټساپ پرانیستل شو. استول خپله تایید کړئ.',saved:'انځور جوړ شو؛ په واټساپ کې یې پخپله ورزیات کړئ.',copied:'پیغام کاپي شو.',error:'د اړیکو ترلاسه کول بریالي نه شول.',life:'دایمي ګډون',noExpiry:'د پای نېټه نشته',greeting:'سلام او درناوی',msgExpired:'ستاسې د ZAVI ONE ګډون پای ته رسېدلی دی.',msgRemain:'ستاسې د ZAVI ONE ګډون {n} ورځې پاتې دي.',msgToday:'ستاسې د ZAVI ONE ګډون نن پای ته رسېږي.',msgEnd:'د ګډون پای نېټه',msgAction:'مهرباني وکړئ د نوي کولو لپاره له ZAVI ONE ادارې سره اړیکه ونیسئ.',media:'د نوي کولو انځور',copyThen:'پیغام او انځور په خپله د واټساپ خبرو ته ورزیات کړئ.',timeNote:'ورځې د افغانستان له وخت سره سم دي.'},
 en:{nav:'Renewal reminders',title:'Customer renewal reminders',subtitle:'Review remaining days, prepare a message and create an image card.',search:'Search store or email',urgent:'Expired or 30 days or less',all:'All time-limited subscriptions',refresh:'Refresh',close:'Close',expired:'Subscription expired',days:'days remaining',today:'Expires today',date:'Expiry date (Afghanistan time)',send:'Open WhatsApp with message',download:'Save renewal image',share:'Share image and message',copy:'Copy message',noContact:'No consented WhatsApp number available for this customer.',denied:'Only the signed-in central owner can use this feature.',noRecords:'No subscriptions approaching expiry were found.',sent:'WhatsApp opened. Confirm the send yourself.',saved:'Image saved. Attach it to the WhatsApp chat manually.',copied:'Message copied.',error:'Could not load customer contact records. Try again.',life:'Lifetime',noExpiry:'No expiry',greeting:'Hello',msgExpired:'Your ZAVI ONE subscription has expired.',msgRemain:'Only {n} days remain on your ZAVI ONE subscription.',msgToday:'Your ZAVI ONE subscription expires today.',msgEnd:'Expiry date',msgAction:'Please contact ZAVI ONE administration to renew your subscription. Thank you.',media:'Renewal reminder image',copyThen:'Manually attach the message and image in WhatsApp.',timeNote:'Expiry is calculated in the Asia/Kabul time zone.'}
};
const dateFormat=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kabul',year:'numeric',month:'long',day:'numeric'});
const dayFormat=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kabul',year:'numeric',month:'2-digit',day:'2-digit'});
const mobile=()=>window.innerWidth<700;
const language=()=>{const raw=String(q('#zaviAdminLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return raw.startsWith('ps')?'ps':raw.startsWith('en')?'en':'fa'};
const tr=()=>messages[language()];
const localNumber=n=>language()==='fa'?String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[+d]):String(n);
const current=()=>window.ZaviAdminAPI?.getMode?.()==='live' && !!q('#appScreen') && !q('#appScreen').hidden;
function civil(value){const d=new Date(value);if(!Number.isFinite(d.getTime()))return null;const p={};dayFormat.formatToParts(d).forEach(x=>{if(['year','month','day'].includes(x.type))p[x.type]=+x.value});return Date.UTC(p.year,p.month-1,p.day)/86400000}
function expiry(record){
 if(!record||['lifetime','none'].includes(record.plan))return null;
 const ms=Date.parse(record.expires_at||'');if(!Number.isFinite(ms))return null;
 const days=Math.max(0,Math.round(civil(ms)-civil(Date.now())));
 return {days,expired:ms<=Date.now(),date:dateFormat.format(ms),timestamp:ms};
}
function validNumber(raw){
 const str=String(raw||'').trim().replace(/[\s()-]/g,'');
 return /^\+[1-9][0-9]{5,14}$/.test(str)?str:null;
}
function getContact(record,list){
 const email=String(record.owner_email||'').toLowerCase().trim();
 if(!email)return null;
 const found=list.find(c=>c.contact_opt_in===true && String(c.account_email||'').toLowerCase().trim()===email);
 if(!found)return null;
 return validNumber(found.whatsapp_e164)||validNumber(found.phone_e164);
}
function reminderText(record){
 const x=expiry(record),w=tr();if(!x)return '';
 const status=x.expired?w.msgExpired:x.days===0?w.msgToday:w.msgRemain.replace('{n}',localNumber(x.days));
 return [w.greeting+'، '+record.workspace_name,'',status,w.msgEnd+': '+x.date,w.msgAction,'ZAVI ONE'].join('\n');
}
const state={panel:null,rows:[],contacts:[],active:null,loading:false,filter:'urgent',term:''};
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function notice(msg){const x=q('#z139-status');if(x){x.textContent=msg;x.hidden=false}}
function drawCanvas(record){
 const x=expiry(record);if(!x)throw Error('No expiry');
 const w=tr(),canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1200;
 const c=canvas.getContext('2d');if(!c)throw Error('Canvas unavailable');
 const gr=c.createLinearGradient(0,0,1200,1200);gr.addColorStop(0,'#091e51');gr.addColorStop(.54,'#164bb2');gr.addColorStop(1,'#02a1bc');c.fillStyle=gr;c.fillRect(0,0,1200,1200);
 c.globalAlpha=.12;c.fillStyle='#b7eeff';c.beginPath();c.arc(980,180,330,0,Math.PI*2);c.fill();c.beginPath();c.arc(140,1030,290,0,Math.PI*2);c.fill();c.globalAlpha=1;
 c.fillStyle='#ffffff';c.textAlign='center';c.direction='ltr';c.font='bold 74px system-ui,sans-serif';c.fillText('ZAVI ONE',600,170);
 c.fillStyle='#bdeeff';c.font='32px system-ui,sans-serif';c.fillText('SUBSCRIPTION REMINDER',600,224);
 c.fillStyle='#ffffff';c.font='bold 58px system-ui,sans-serif';
 let name=String(record.workspace_name||'').trim();if(name.length>30)name=name.slice(0,29)+'…';
 c.fillText(name,600,330,1030);
 c.fillStyle='rgba(2,16,48,.5)';c.beginPath();c.roundRect(135,400,930,450,48);c.fill();
 c.textAlign='center';c.direction=language()==='en'?'ltr':'rtl';
 c.fillStyle='#d7f5ff';c.font='bold 42px system-ui,sans-serif';c.fillText(x.expired?w.expired:x.days===0?w.today:w.days,600,502,800);
 c.fillStyle=x.expired?'#ffbac1':'#fff';c.font='bold 230px system-ui,sans-serif';c.fillText(x.expired?'0':localNumber(x.days),600,736,850);
 c.fillStyle='#fff';c.font='38px system-ui,sans-serif';c.fillText(w.date,600,930,1100);
 c.font='bold 45px system-ui,sans-serif';c.fillText(x.date,600,997,1090);
 c.fillStyle='#d4eeff';c.font='26px system-ui,sans-serif';c.fillText('ZAVI ONE  •  '+new Date().toLocaleDateString('en-GB',{timeZone:'Asia/Kabul'}),600,1115,1100);
 return canvas;
}
function makeBlob(record){return new Promise((resolve,reject)=>{try{drawCanvas(record).toBlob(b=>b?resolve(b):reject(Error('PNG unavailable')),'image/png')}catch(e){reject(e)}})}
async function savePNG(record){const blob=await makeBlob(record),name='ZAVI_ONE_RENEWAL_'+String(record.workspace_id||'customer').replace(/[^a-z0-9-]/gi,'').slice(0,40)+'.png';const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2500);notice(tr().saved)}
async function share(record){
 const file=new File([await makeBlob(record)],'ZAVI_ONE_Renewal.png',{type:'image/png'}),text=reminderText(record);
 if(typeof navigator.share==='function'&&navigator.canShare?.({files:[file]})){
  try{await navigator.share({files:[file],text,title:'ZAVI ONE'});return}catch(e){if(e?.name==='AbortError')return}
 }
 await savePNG(record);
 try{await navigator.clipboard.writeText(text);notice(tr().copyThen)}catch(_){}
}
async function copy(record){const v=reminderText(record);try{await navigator.clipboard.writeText(v);notice(tr().copied)}catch(_){notice(tr().error)}}
function openWhatsapp(record){
 const num=getContact(record,state.contacts);
 if(!num)return notice(tr().noContact);
 const dest='https://wa.me/'+num.slice(1)+'?text='+encodeURIComponent(reminderText(record));
 const handle=window.open(dest,'_blank','noopener,noreferrer');
 if(!handle)location.href=dest;
 notice(tr().sent+' '+tr().copyThen);
}
function tile(record){
 const x=expiry(record),w=tr();if(!x)return null;
 const card=el('article','z139-card'),header=el('div','z139-cardhead');
 const title=el('div','z139-identity');title.append(el('strong','',record.workspace_name||'—'),el('small','',record.owner_email||''));
 const badge=el('span','z139-count '+(x.expired?'z139-expired':x.days<=7?'z139-critical':'z139-soon'),x.expired?w.expired:x.days===0?w.today:localNumber(x.days)+' '+w.days);
 header.append(title,badge);card.append(header);
 card.append(el('p','z139-expiry',w.date+': '+x.date));
 const contact=getContact(record,state.contacts);
 if(!contact)card.append(el('small','z139-nophone',w.noContact));
 const actions=el('div','z139-actions');
 function add(label,action,kind,disabled=false){const b=el('button',kind,label);b.type='button';b.disabled=disabled;b.addEventListener('click',()=>{state.active=record;action()});actions.append(b)}
 add(w.send,()=>openWhatsapp(record),'z139-primary',!contact);
 add(w.download,()=>savePNG(record).catch(()=>notice(w.error)),'');
 add(w.share,()=>share(record).catch(()=>notice(w.error)),'');
 add(w.copy,()=>copy(record),'');
 card.append(actions);return card;
}
function render(){
 if(!state.panel||state.panel.hidden)return;
 const w=tr();q('#z139-heading').textContent=w.title;q('#z139-subtitle').textContent=w.subtitle;
 q('#z139-close').textContent=w.close;q('#z139-refresh').textContent=w.refresh;
 q('#z139-query').placeholder=w.search;
 q('#z139-urgent').textContent=w.urgent;q('#z139-all').textContent=w.all;
 q('#z139-urgent').setAttribute('aria-pressed',String(state.filter==='urgent'));
 q('#z139-all').setAttribute('aria-pressed',String(state.filter==='all'));
 const records=state.rows.filter(r=>{
   const x=expiry(r);if(!x)return false;
   if(state.filter==='urgent'&&!x.expired&&x.days>30)return false;
   const search=state.term.toLowerCase();
   return !search||[r.workspace_name,r.owner_email].some(v=>String(v||'').toLowerCase().includes(search));
 }).sort((a,b)=>expiry(a).timestamp-expiry(b).timestamp);
 const list=q('#z139-list');list.replaceChildren();
 if(!records.length)list.append(el('p','z139-empty',w.noRecords));
 else {const frag=document.createDocumentFragment();records.forEach(r=>frag.append(tile(r)));list.append(frag)}
 q('#z139-time-note').textContent=w.timeNote;
}
async function load(){
 const api=window.ZaviAdminAPI;
 if(!current()||!api){notice(tr().denied);return}
 if(state.loading)return;state.loading=true;
 q('#z139-refresh').disabled=true;
 try{
  // Client does not trust row data to authorize admin actions. RPC enforces owner on server.
  const result=await api.request('/rest/v1/rpc/zavi_admin_registration_contacts',{method:'POST',body:{}});
  if(!Array.isArray(result))throw Error('Invalid response');
  state.contacts=result.filter(x=>x?.contact_opt_in===true);
  state.rows=(api.getRows?.()||[]).filter(r=>r.workspace_id);
  q('#z139-status').hidden=true;
  render();
 }catch(e){state.contacts=[];state.rows=[];notice(tr().error)}
 finally{state.loading=false;q('#z139-refresh').disabled=false}
}
function close(){if(state.panel){state.panel.hidden=true;state.active=null;state.contacts=[];state.rows=[];document.body.classList.remove('z139-dialog-open')}}
function create(){
 if(state.panel)return;
 const outer=el('div','z139-backdrop');outer.id='z139-dialog';outer.hidden=true;
 outer.setAttribute('role','presentation');
 const section=el('section','z139-panel');section.setAttribute('role','dialog');section.setAttribute('aria-modal','true');section.setAttribute('aria-labelledby','z139-heading');
 const head=el('header','z139-head');const headText=el('div');
 headText.append(el('h2','',''));headText.firstChild.id='z139-heading';
 const subtitle=el('p','','');subtitle.id='z139-subtitle';headText.append(subtitle);
 const closeBtn=el('button','z139-close');closeBtn.id='z139-close';closeBtn.type='button';closeBtn.addEventListener('click',close);
 head.append(headText,closeBtn);
 const controls=el('div','z139-controls');
 const search=el('input','');search.type='search';search.id='z139-query';search.autocomplete='off';search.addEventListener('input',()=>{state.term=search.value.trim();render()});
 const urgent=el('button','');urgent.id='z139-urgent';urgent.type='button';urgent.addEventListener('click',()=>{state.filter='urgent';render()});
 const all=el('button','');all.id='z139-all';all.type='button';all.addEventListener('click',()=>{state.filter='all';render()});
 const refresh=el('button','');refresh.id='z139-refresh';refresh.type='button';refresh.addEventListener('click',load);
 controls.append(search,urgent,all,refresh);
 const noticeEl=el('p','z139-status');noticeEl.id='z139-status';noticeEl.hidden=true;noticeEl.setAttribute('role','status');
 const list=el('div','z139-list');list.id='z139-list';
 const foot=el('small','z139-time');foot.id='z139-time-note';
 section.append(head,controls,noticeEl,list,foot);outer.append(section);document.body.append(outer);
 outer.addEventListener('click',e=>{if(e.target===outer)close()});
 state.panel=outer;
}
function open(){
 if(!current()){window.ZaviAdminAPI?.notify?.(tr().denied,true);return}
 create();state.panel.hidden=false;document.body.classList.remove('mobile-drawer');document.body.classList.add('z139-dialog-open');
 state.term='';state.filter='urgent';q('#z139-query').value='';render();load();
}
function install(){
 const nav=q('#appScreen .sidebar .nav');
 if(!nav||q('#z139-nav'))return;
 const btn=el('button','nav-item z139-entry');btn.id='z139-nav';btn.type='button';btn.append(el('span','', '◷'),el('b','',tr().nav));
 btn.addEventListener('click',open);
 const existing=q('[data-page="customers"]',nav);if(existing)existing.after(btn);else nav.append(btn);
}
function start(){
 install();
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;install()})}).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.panel&&!state.panel.hidden)close()});
 document.addEventListener('change',e=>{if(e.target?.id==='zaviAdminLanguage'){const b=q('#z139-nav b');if(b)b.textContent=tr().nav;render()}});
 document.addEventListener('zavi-payment-saved',()=>{if(state.panel&&!state.panel.hidden){notice(tr().timeNote);state.contacts=[];state.rows=[];load()}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.panel&&!state.panel.hidden)close()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

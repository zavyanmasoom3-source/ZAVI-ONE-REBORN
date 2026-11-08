/* ADMIN 1.4.40 — manual 7 / 180 / 365 day renewal congratulations.
 * IMPORTANT: does not extend subscriptions. Message is initiated and sent by the owner only.
 * Reads contacts from the existing owner-only RPC at the moment of sending.
 */
(()=>{'use strict';
const $=(s,p=document)=>p.querySelector(s);
const txt={
 fa:{button:'🎉 پیام تبریکی تمدید',title:'تبریکی تمدید اشتراک',hint:'پس از ثبت موفق تمدید در مدیریت، مدت واقعی را انتخاب کنید.',length:'مدت تمدید ثبت‌شده',seven:'۷ روز',half:'۱۸۰ روز',year:'۳۶۵ روز',confirm:'تأیید می‌کنم که تمدید این مشتری در سیستم ثبت شده و مدت بالا درست است.',send:'بازکردن واتساپ',copy:'کاپی متن تبریکی',cancel:'انصراف',loading:'بررسی شماره واتساپ مشتری...',optin:'شماره واتساپ این مشتری با رضایت ثبت نشده است.',locked:'فقط حساب مالک مرکزی اجازه دارد.',need:'اول تأیید کنید که تمدید ثبت شده است.',sent:'واتساپ باز شد؛ شما ارسال را تأیید کنید.',copyOK:'پیام تبریکی کاپی شد.',error:'شماره مشتری دریافت نشد. دوباره کوشش کنید.',greeting:'سلام و احترام',headline:'تبریک! اشتراک حسابداری ZAVI ONE شما با موفقیت برای {days} روز تمدید شد. 🎉',wish:'امیدواریم این دوره برای کسب‌وکار شما پر از موفقیت و پیشرفت باشد.',thanks:'از اعتماد شما به ZAVI ONE صمیمانه سپاسگزاریم.',signature:'با احترام، مدیریت مرکزی ZAVI ONE',note:'واتساپ پیام را خودکار نمی‌فرستد. لطفاً متن و مخاطب را بررسی و ارسال را تأیید کنید.'},
 ps:{button:'🎉 د نوي کولو مبارکي',title:'د ګډون نوي کولو مبارکي',hint:'په مدیریت کې د نوي کولو تر ثبتېدو وروسته سمې ورځې وټاکئ.',length:'ثبت شوې موده',seven:'۷ ورځې',half:'۱۸۰ ورځې',year:'۳۶۵ ورځې',confirm:'تاییدوم چې د دغه پېرودونکي ګډون نوي شوی او دا موده سمه ده.',send:'واټساپ پرانیستل',copy:'د مبارکۍ پیغام کاپي',cancel:'بېرته',loading:'د واټساپ شمېره کتل کېږي...',optin:'د اجازې سره د واټساپ شمېره نشته.',locked:'یوازې اصلي مدیر دې برخې ته لاسرسی لري.',need:'لومړی ثبت شوی نوی کول تایید کړئ.',sent:'واټساپ پرانیستل شو؛ پیغام په خپله ولېږئ.',copyOK:'پیغام کاپي شو.',error:'د پېرودونکي شمېره ترلاسه نه شوه.',greeting:'سلام او درناوی',headline:'مبارک! ستاسو د ZAVI ONE حسابدارۍ ګډون د {days} ورځو لپاره بریالی نوی شو. 🎉',wish:'ستاسو سوداګرۍ ته د لا بریاوو هیله کوو.',thanks:'پر ZAVI ONE له باور څخه مننه.',signature:'د ZAVI ONE مرکزي مدیریت',note:'واټساپ پخپله پیغام نه لېږي. شمېره او متن وګورئ او پخپله یې واستوئ.'},
 en:{button:'🎉 Send renewal congratulations',title:'Congratulations on renewal',hint:'After renewal is recorded in ADMIN, select the actual confirmed duration.',length:'Confirmed renewal period',seven:'7 days',half:'180 days',year:'365 days',confirm:'I confirm this customer’s renewal was recorded in the system for the selected duration.',send:'Open WhatsApp',copy:'Copy congratulation',cancel:'Cancel',loading:'Checking customer WhatsApp number...',optin:'No WhatsApp number recorded with customer consent.',locked:'Only the central owner may use this feature.',need:'Confirm the renewal was recorded first.',sent:'WhatsApp opened; review and send the message yourself.',copyOK:'Congratulations copied.',error:'Unable to retrieve the customer’s contact.',greeting:'Hello',headline:'Congratulations! Your ZAVI ONE accounting subscription was successfully renewed for {days} days. 🎉',wish:'Wishing your business continued growth and success.',thanks:'Thank you for trusting ZAVI ONE.',signature:'ZAVI ONE Central Administration',note:'WhatsApp does not send automatically. Review recipient and text and tap Send yourself.'}
};
const lang=()=>{const v=String($('#zaviAdminLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'};
const t=()=>txt[lang()];
const nd=(x)=>lang()==='fa'?String(x).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[+d]):String(x);
const isOwner=()=>window.ZaviAdminAPI?.getMode?.()==='live' && !!$('#appScreen') && !$('#appScreen').hidden;
let active=null,layer=null,busy=false,approvedPhone=null,contactReq=0;
function e(tag,cls,label){const n=document.createElement(tag);if(cls)n.className=cls;if(label!==undefined)n.textContent=label;return n}
function getRow(card){
 const name=card.querySelector('.z139-identity strong')?.textContent?.trim();
 const mail=card.querySelector('.z139-identity small')?.textContent?.trim()?.toLowerCase();
 if(!name||!mail||!isOwner())return null;
 return (window.ZaviAdminAPI?.getRows?.()||[]).find(r=>String(r.workspace_name||'').trim()===name&&String(r.owner_email||'').trim().toLowerCase()===mail)||null;
}
function message(){
 const w=t();const days=Number($('#z140-duration')?.value||0);if(!active||![7,180,365].includes(days))return '';
 return [w.greeting+'، '+String(active.workspace_name||'').trim(),'',
 w.headline.replace('{days}',nd(days)),w.wish,w.thanks,'',w.signature].join('\n');
}
function info(msg){const n=$('#z140-info');if(n){n.textContent=msg;n.hidden=!msg}}
function canCopy(){return !!$('#z140-confirm')?.checked&&isOwner()&&!busy}
function canSend(){return canCopy()&&!!approvedPhone}
function render(){
 if(!layer||layer.hidden||!active)return;
 const w=t(),m=message();
 $('#z140-title').textContent=w.title;$('#z140-hint').textContent=w.hint;
 $('#z140-customer').textContent=active.workspace_name||'—';
 $('#z140-label').textContent=w.length;
 $('#z140-duration option[value="7"]').textContent=w.seven;
 $('#z140-duration option[value="180"]').textContent=w.half;
 $('#z140-duration option[value="365"]').textContent=w.year;
 $('#z140-check-text').textContent=w.confirm;
 $('#z140-msg').value=m;
 $('#z140-send').textContent=w.send;
 $('#z140-copy').textContent=w.copy;
 $('#z140-close').textContent=w.cancel;
 $('#z140-note').textContent=w.note;
 $('#z140-send').disabled=!canSend();
 $('#z140-copy').disabled=!canCopy();
}
function close(){if(layer){contactReq++;approvedPhone=null;layer.hidden=true;active=null;$('#z140-confirm').checked=false;$('#z140-msg').value='';info('')}}
function make(){
 if(layer)return;
 layer=e('div','z140-backdrop');layer.id='z140-modal';layer.hidden=true;
 const panel=e('section','z140-panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','z140-title');
 panel.innerHTML='<header class="z140-header"><div><h2 id="z140-title"></h2><p id="z140-hint"></p></div><button type="button" id="z140-close"></button></header><div id="z140-customer" class="z140-customer"></div><label class="z140-label"><span id="z140-label"></span><select id="z140-duration"><option value="7"></option><option value="180"></option><option value="365"></option></select></label><textarea id="z140-msg" rows="7" aria-label="پیام تبریکی" maxlength="1400"></textarea><label class="z140-ack"><input id="z140-confirm" type="checkbox"><span id="z140-check-text"></span></label><p id="z140-info" role="status" hidden></p><p id="z140-note"></p><footer><button type="button" id="z140-copy"></button><button type="button" id="z140-send" class="z140-primary"></button></footer>';
 layer.append(panel);document.body.append(layer);
 $('#z140-close').addEventListener('click',close);
 layer.addEventListener('click',ev=>{if(ev.target===layer)close()});
 $('#z140-confirm').addEventListener('change',render);
 $('#z140-duration').addEventListener('change',render);
 $('#z140-copy').addEventListener('click',async()=>{
  if(!canCopy())return info(t().need);
  try{await navigator.clipboard.writeText($('#z140-msg').value);info(t().copyOK)}catch(_){info(t().error)}
 });
 $('#z140-send').addEventListener('click',send);
}
function send(){
 if(!active||!canSend())return info(approvedPhone?t().need:t().optin);
 const outbound=$('#z140-msg').value.trim();
 if(!outbound||outbound.length>1400)return;
 // Contact already fetched via owner-only RPC while dialog was opened.
 // Opening wa.me happens synchronously from this real user click.
 const url='https://wa.me/'+approvedPhone.slice(1)+'?text='+encodeURIComponent(outbound);
 const win=window.open(url,'_blank','noopener,noreferrer');
 if(!win)location.href=url;
 info(t().sent);
}

function open(card){
 if(!isOwner())return;
 const row=getRow(card);
 if(!row)return;
 make();active=row;approvedPhone=null;const stamp=++contactReq;
 layer.hidden=false;$('#z140-duration').value='365';$('#z140-confirm').checked=false;info(t().loading);render();
 $('#z140-duration').focus({preventScroll:true});
 // Prefetch contact, but never send until owner checks the box and clicks.
 const api=window.ZaviAdminAPI;
 Promise.resolve(api.request('/rest/v1/rpc/zavi_admin_registration_contacts',{method:'POST',body:{}})).then(rows=>{
  if(stamp!==contactReq||active!==row||layer.hidden||!isOwner())return;
  const found=Array.isArray(rows)?rows.find(x=>x.contact_opt_in===true&&String(x.account_email||'').trim().toLowerCase()===String(row.owner_email||'').trim().toLowerCase()):null;
  const phone=String(found?.whatsapp_e164||found?.phone_e164||'').trim().split(' ').join('').split('(').join('').split(')').join('').split('-').join('');
  approvedPhone=phone.startsWith('+')&&/^[1-9][0-9]{5,14}$/.test(phone.slice(1))?phone:null;
  info(approvedPhone?'':t().optin);render();
 }).catch(()=>{if(stamp===contactReq){approvedPhone=null;info(t().error);render()}});
}

function attach(){
 const list=$('#z139-list');
 if(!list||!isOwner())return;
 for(const card of list.querySelectorAll('.z139-card')){
  if(card.querySelector('.z140-trigger'))continue;
  const b=e('button','z140-trigger',t().button);b.type='button';
  b.addEventListener('click',()=>open(card));
  const buttons=card.querySelector('.z139-actions');
  if(buttons)buttons.append(b);
 }
}
function init(){
 let pending=false;
 new MutationObserver(()=>{
  if(pending)return;pending=true;queueMicrotask(()=>{pending=false;attach()});
 }).observe(document.body,{subtree:true,childList:true});
 attach();
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&layer&&!layer.hidden)close()});
 document.addEventListener('change',ev=>{if(ev.target?.id==='zaviAdminLanguage'){document.querySelectorAll('.z140-trigger').forEach(b=>b.textContent=t().button);render()}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)close()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

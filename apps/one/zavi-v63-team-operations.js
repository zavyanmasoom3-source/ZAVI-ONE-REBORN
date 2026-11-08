/* ZAVI ONE V63.4 — actual owner-scoped, read-only listing and revocation of viewer memberships.
 * The live DB schema currently only accepts role='viewer'. No seller/admin roles are
 * exposed here until every write API enforces granular permissions server-side.
 * This file NEVER stores colleagues' UIDs or auth tokens persistently.
 */
(()=>{'use strict';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(fa,ps,en)=>document.documentElement.lang==='en'?en:document.documentElement.lang==='ps-AF'?ps:fa;
const uuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v||'');
const owner=()=>{const i=window.zaviCloudRestoreInfo?.()||{},s=window.zaviCloudGetAuthSession?.();return i.role==='owner'&&uuid(i.workspace)&&uuid(s?.user?.id)&&s?.access_token?{ws:i.workspace,uid:s.user.id,token:s.access_token}:null};
let opened=false,loaded=false,rows=[],busy=false,last=0,err='',scope='',previousFocus=null,refreshAfterBusy=false,query='';
let accessReady=false,accessError='',permissions={};
const allow=()=>!!owner();
function close(){opened=false;scope='';rows=[];loaded=false;last=0;query='';accessReady=false;accessError='';permissions={};$('#z62TeamDialog')?.remove();if(previousFocus?.isConnected)previousFocus.focus();previousFocus=null;}
function nav(){const button=$('#z63TeamMenu');if(button){button.hidden=!allow();button.setAttribute('aria-hidden',String(!allow()));button.setAttribute('aria-label',text('مدیریت همکاران و اجازه‌های خرید و فروش','د همکارانو د پېر او پلور اجازه','Manage colleague permissions'));}if(opened&&!allow())close();}
function dialog(){let d=$('#z62TeamDialog');if(d)return d;
 d=document.createElement('div');d.id='z62TeamDialog';d.className='z62-backdrop';
 d.innerHTML='<section class="z62-dialog" role="dialog" aria-modal="true" aria-labelledby="z62DialogTitle">'
 +'<div class="z62-head"><h2 id="z62DialogTitle">👥 '+text('مدیریت همکاران','د همکارانو اداره','Manage colleagues')+'</h2><button type="button" data-z62-close aria-label="'+text('بستن','تړل','Close')+'">✕</button></div>'
 +'<div class="z62-body"><div class="z62-total"><span>'+text('حساب‌های دارای دسترسی','د لاسرسي لرونکي حسابونه','Authorized accounts')+'</span><strong id="z62Count" aria-label="'+text('تعداد همکاران','د همکارانو شمېر','Colleague count')+'">—</strong></div>'
 +'<p class="z62-note">'+text('این تعداد از دیتابیس واقعی است، نه وضعیت آنلاین. سه اختیار زیر فقط وقتی SQL امن سرور فعال و تأیید شود کار می‌کنند.','دا شمېر له ډیټابېس دی، نه آنلاین. درې اجازه‌ګانې د خوندي سرور له فعالېدو وروسته کار کوي.','Live database count, not online presence. Three permissions require the approved server migration.')+'</p>'
 +'<form id="z62Add"><label for="z62Uid">'+text('شناسه حساب همکار (UID)','د همکار UID','Colleague account UID')+'</label>'
 +'<div class="z62-form"><input type="text" id="z62Uid" dir="ltr" maxlength="36" autocomplete="off" spellcheck="false" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required>'
 +'<button type="submit">'+text('افزودن دسترسی مشاهده','د کتلو لاسرسی زیاتول','Grant view-only access')+'</button></div></form>'
 +'<p class="z62-note">'+text('برای هر همکار حساب جدا لازم است. پیش‌فرض: خرید خاموش، فروش خاموش و سرمایه/مفاد پنهان.','هر همکار ځانته حساب غواړي. پېر او پلور بند دي، سرمایه او ګټه پټه ده.','Separate account required. Default: buying off, selling off, capital/profit hidden.')+'</p>'
 +'<div class="z62-headrow"><label for="z62Search">'+text('جست‌وجوی همکار','د همکار پلټنه','Find colleague')+'</label><button type="button" data-z62-history>'+text('تاریخچه دسترسی','د لاسرسي تاریخ','Access history')+'</button><button type="button" data-z62-refresh>'+text('تازه‌سازی','تازه کول','Refresh')+'</button></div>'
 +'<input id="z62Search" type="search" autocomplete="off" spellcheck="false" maxlength="80" placeholder="'+text('جست‌وجو با UID','د UID پلټنه','Search by UID')+'">'
 +'<p class="z62-note z648-permission-note" id="z648BackendState"></p><p class="z62-note" id="z62LastUpdate"></p><div role="status" aria-live="polite" id="z62Status"></div><div id="z62History" aria-live="polite" hidden></div><div id="z62List" aria-live="polite"></div>'
 +'</div></section>';
 document.body.append(d);return d;
}
function dateLabel(v){if(!v||!Number.isFinite(Date.parse(v)))return text('زمان ثبت نامشخص','د ثبت وخت ناپېژندل شوی','Date unavailable');try{return new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':document.documentElement.lang==='ps-AF'?'ps-AF':'fa-AF',{year:'numeric',month:'short',day:'numeric'}).format(new Date(v));}catch(_){return String(v).slice(0,10);}}
function render(){if(!opened||!allow())return;const d=dialog();
 d.querySelector('#z62Count').textContent=loaded?String(rows.length):'—';
 const status=d.querySelector('#z62Status');status.textContent=err||(!loaded?text('در حال دریافت اطلاعات...','معلومات رااخیستل کېږي...','Loading authorized members...'):'');status.className=err?'z62-error':'';
 d.querySelector('#z648BackendState').textContent=accessError||(!accessReady?text('اجازه‌های خرید و فروش هنوز در سرور فعال/تأیید نشده است.','د پېر او پلور اجازې لا په سرور کې نه دي فعالې','Purchase and sale permissions are not active/verified on the server.'):text('✓ سرور اجازه‌ها را از دیتابیس واقعی تأیید کرد.','✓ سرور د همکار اجازې تایید کړې','✓ Permissions verified by server.'));
 d.querySelector('#z62LastUpdate').textContent=last&&loaded?text('آخرین دریافت موفق: ','وروستی بریالی ترلاسه کول: ','Last successful refresh: ')+new Date(last).toLocaleTimeString():'';
 const filtered=rows.filter(r=>r.member_uid.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>String(a.added_at||'').localeCompare(String(b.added_at||'')));
 d.querySelector('#z62List').innerHTML=filtered.map((r,i)=>'<div class="z62-member"><div class="z650-member-main"><b>'+text('همکار','همکار','Colleague')+' '+(i+1)+'</b><small dir="ltr">'+esc(r.member_uid)+'</small><span class="z62-member-date">'+text('افزوده‌شده: ','زیات شوی: ','Added: ')+esc(dateLabel(r.added_at))+'</span>'+permissionMarkup(r.member_uid)+'</div><button type="button" data-z62-remove="'+esc(r.member_uid)+'" aria-label="'+text('لغو دسترسی','لاسرسی ختمول','Revoke access')+'">'+text('لغو دسترسی','لاسرسی ختمول','Revoke access')+'</button></div>').join('')
 ||(loaded?'<p class="z62-note">'+(query?text('همکاری با این شناسه پیدا نشد.','په دې UID همکار نشته.','No matching colleague.'):text('هنوز همکاری ثبت نشده است.','تر اوسه همکار نشته.','No colleagues yet.'))+'</p>':'');
}
function permissionMarkup(uid){const p=permissions[uid]||{};const disabled=accessReady?'':'disabled title="ابتدا SQL سرور باید به صورت امن فعال و آزمایش شود"';
 const option=(id,label,checked)=>'<label><input type="checkbox" data-z648-opt="'+id+'" '+(checked?'checked ':'')+disabled+'>'+label+'</label>';
 return '<div class="z648-owner-flags" data-z648-member="'+esc(uid)+'">'
  +option('can_sell',text('اجازه فروش','د پلور اجازه','Allow sales'),p.can_sell===true)
  +option('can_buy',text('اجازه خرید','د پېر اجازه','Allow purchases'),p.can_buy===true)
  +option('hide_capital_profit',text('پنهان کردن سرمایه و مفاد','پانګه او ګټه پټول','Hide capital and profit'),p.hide_capital_profit!==false)
  +'<button type="button" data-z648-save="'+esc(uid)+'" '+disabled+'>'+text('ذخیره سه اختیار همین همکار','د همدې همکار درې اجازې خوندي کړئ','Save this colleague’s three permissions')+'</button></div>';
}
async function loadPermissions(scopeKey){try{
 const o=owner();if(!o||scopeKey!==o.uid+'|'+o.ws)return;
 const data=await api('POST','/rest/v1/rpc/zavi_v648_owner_staff_list',{p_workspace:o.ws});
 const current=owner();if(!current||scopeKey!==current.uid+'|'+current.ws)return;
 if(!Array.isArray(data))throw Error('پاسخ اجازه‌های سرور معتبر نیست.');
 permissions=Object.fromEntries(data.filter(r=>uuid(r?.member_uid)).map(r=>[r.member_uid.toLowerCase(),r]));
 accessReady=true;accessError='';
 }catch(e){accessReady=false;permissions={};accessError=text('اجازه‌های خرید و فروش در سرور فعال نشده‌اند؛ تا فعال‌سازی امن قابل ذخیره نیستند.','اجازې په سرور کې فعاله نه دي؛ تر خوندي فعالولو پورې نه خوندي کېږي.','Permissions are not yet active on the server; saving is disabled until secure activation.');
 }render();}
async function savePermissions(uid){const o=owner();if(!o||!accessReady||!uuid(uid)||!rows.some(r=>r.member_uid.toLowerCase()===uid.toLowerCase()))throw Error('اجازه مالک یا دیتابیس آماده نیست.');
 const parent=[...document.querySelectorAll('[data-z648-member]')].find(el=>el.dataset.z648Member===uid);if(!parent)throw Error('پنجره تنظیمات همکار پیدا نشد.');
 const values=Object.fromEntries([...parent.querySelectorAll('[data-z648-opt]')].map(x=>[x.dataset.z648Opt,x.checked]));
 if(!window.confirm(text('اختیارات خرید، فروش و پنهان‌کردن سرمایه/مفاد برای همین همکار در سرور ذخیره شوند؟','د همدې همکار د پېر، پلور او پټې پانګې اجازې په سرور کې خوندي شي؟','Save sale, purchase and capital/profit visibility permissions for this colleague?')))return;
 const scopeKey=o.uid+'|'+o.ws;
 const row=await api('POST','/rest/v1/rpc/zavi_v648_owner_set_staff',{
  p_workspace:o.ws,p_member:uid,p_can_sell:values.can_sell===true,
  p_can_buy:values.can_buy===true,p_hide_capital_profit:values.hide_capital_profit===true});
 const current=owner();if(!current||scopeKey!==current.uid+'|'+current.ws)return;
 if(row?.member_uid?.toLowerCase()!==uid.toLowerCase())throw Error('سرور ذخیره اجازه را تایید نکرد.');
 await loadPermissions(scopeKey);err='';render();
}
async function api(method,path,body){const o=owner(),cfg=window.zaviCloudGetPublicConfig?.()||window.ZAVI_CLOUD_DEFAULTS;
 if(!o||!cfg?.url||!cfg?.key)throw Error(text('ورود مالک و اتصال به سرور ضروری است.','د مالک ننوتل او سرور اړین دي.','Owner login and server are required.'));
 const base=new URL(cfg.url);if(base.protocol!=='https:'&&base.hostname!=='localhost'&&base.hostname!=='127.0.0.1')throw Error(text('آدرس سرور باید HTTPS باشد.','سرور باید HTTPS وي.','HTTPS backend required.'));
 if(typeof window.zaviCloudRefreshAuthSession==='function')await window.zaviCloudRefreshAuthSession();
 const now=owner();if(!now||now.uid!==o.uid||now.ws!==o.ws)throw Error(text('حساب یا فروشگاه تغییر کرده است؛ دوباره باز کنید.','حساب بدل شو، بیا خلاص کړئ.','Account or workspace changed. Reopen.'));
 const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),15000);
 try{const endpoint=base.href.replace(/\/$/,'')+path;const response=await fetch(endpoint,{method,headers:{apikey:cfg.key,Authorization:'Bearer '+now.token,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),signal:ctl.signal,cache:'no-store'});
 const data=await response.json().catch(()=>null);if(!response.ok)throw Error(data?.message||data?.error||('HTTP '+response.status));return data;
 }finally{clearTimeout(timeout);}
}
async function load(force=false){const o=owner();if(!opened||!o||(!force&&last&&Date.now()-last<15000))return;
 if(busy){if(force)refreshAfterBusy=true;return;}
 const key=o.uid+'|'+o.ws;busy=true;
 try{const data=await api('GET','/rest/v1/zavi_workspace_members?select=member_uid,role,added_at&workspace_id=eq.'+encodeURIComponent(o.ws)+'&order=added_at.asc');
 const now=owner();if(!opened||!now||key!==now.uid+'|'+now.ws)return;
 if(!Array.isArray(data))throw Error(text('پاسخ دیتابیس معتبر نیست.','د ډیټابېس ځواب سم نه دی.','Invalid database response.'));
 rows=[...new Map(data.filter(r=>r&&r.role==='viewer'&&uuid(r.member_uid)).map(r=>[r.member_uid.toLowerCase(),r])).values()];loaded=true;err='';last=Date.now();
 await loadPermissions(key);
 }catch(e){loaded=false;rows=[];last=0;accessReady=false;permissions={};err=e?.name==='AbortError'?text('زمان دریافت به پایان رسید؛ دوباره تلاش کنید.','د ترلاسه کولو وخت ختم شو.','Request timed out; retry.'):e.message||String(e);
 }finally{busy=false;render();if(refreshAfterBusy){refreshAfterBusy=false;last=0;queueMicrotask(()=>load(true));}}
}
async function history(){
 const o=owner(),panel=$('#z62History');if(!o||!panel)return;
 panel.hidden=false;panel.textContent=text('در حال دریافت تاریخچه از سرور...','له سرور څخه تاریخ رااخلي...','Loading server access history...');
 const scoped=o.ws+'|'+o.uid;
 try{
  const records=await api('POST','/rest/v1/rpc/zavi_v636_member_history',{p_workspace:o.ws,p_limit:50});
  const current=owner();if(!opened||!current||scoped!==current.ws+'|'+current.uid)return;
  if(!Array.isArray(records))throw Error('Unexpected response');
  panel.innerHTML=records.length?records.map(r=>'<div class="z62-member"><div><b>'+text(r.action==='grant_view'?'دسترسی داده شد':'دسترسی لغو شد',r.action==='grant_view'?'لاسرسی ورکړل شو':'لاسرسی لرې شو',r.action==='grant_view'?'Viewer access granted':'Viewer access revoked')+'</b><small dir="ltr">'+esc(r.member_uid)+'</small><span class="z62-member-date">'+esc(dateLabel(r.happened_at))+'</span></div></div>').join(''):'<p class="z62-note">'+text('هنوز تاریخچه‌ای ثبت نشده است.','تر اوسه تاریخ نشته.','No audit events yet.')+'</p>';
 }catch(e){
  const current=owner();if(!opened||!current||scoped!==current.ws+'|'+current.uid)return;
  panel.textContent=text('تاریخچه در دیتابیس فعلی فعال نیست یا مجوز آن تأیید نشده است.','د لاسرسي تاریخ په سرور کې فعال نه دی.','Access history is unavailable or not authorized by the server.');
 }
}
async function add(uid){const o=owner();if(!o||!uuid(uid)||uid.toLowerCase()===o.uid.toLowerCase())throw Error(text('UID معتبر همکار را وارد کنید.','سم UID ولیکئ.','Enter a valid colleague UID.'));
 if(rows.some(r=>r.member_uid.toLowerCase()===uid.toLowerCase()))throw Error(text('این همکار قبلاً دسترسی دارد.','دا همکار مخکې لاسرسی لري.','Colleague is already authorized.'));
 const result=await api('POST','/rest/v1/zavi_workspace_members',{workspace_id:o.ws,member_uid:uid.toLowerCase(),role:'viewer'});
 if(!Array.isArray(result)||!result.some(r=>r.member_uid?.toLowerCase()===uid.toLowerCase()))throw Error(text('ثبت همکار از سرور تأیید نشد.','له سرور څخه تایید نشو.','Server did not confirm access.'));
 const input=$('#z62Uid');if(input)input.value='';last=0;await load(true);
}
async function remove(uid){const o=owner();if(!o||!rows.some(r=>r.member_uid===uid))return;
 if(!window.confirm(text('دسترسی مشاهده این همکار لغو شود؟ تاریخچه مالی حذف نمی‌شود.','د لیدلو اجازه لرې شي؟ مالي تاریخ نه پاکېږي.','Revoke this colleague’s view access? Financial history stays intact.')))return;
 const result=await api('DELETE','/rest/v1/zavi_workspace_members?workspace_id=eq.'+encodeURIComponent(o.ws)+'&member_uid=eq.'+encodeURIComponent(uid)+'&select=member_uid');
 if(!Array.isArray(result)||!result.some(r=>r.member_uid===uid))throw Error(text('لغو دسترسی تأیید نشد.','لاسرسی نه دی تایید شوی.','Revocation not confirmed.'));
 last=0;await load(true);
}
function openDialog(){const o=owner();if(!o){window.alert(text('ابتدا با حساب مالک وارد شوید و فروشگاه را انتخاب کنید.','لومړی د مالک حساب ته ننوځئ.','Sign in as owner and choose your store.'));return;}
 previousFocus=document.activeElement;opened=true;scope=o.uid+'|'+o.ws;rows=[];loaded=false;err='';query='';accessReady=false;permissions={};render();$('#z62Uid')?.focus();load(true);
}
document.addEventListener('click',e=>{const el=e.target;if(!(el instanceof Element))return;
 if(el.closest('#z63TeamMenu')){e.preventDefault();openDialog();return;}
 if(el.closest('[data-z62-close]')||el.id==='z62TeamDialog'){e.preventDefault();close();return;}
 if(el.closest('[data-z62-history]')){e.preventDefault();history();return;}
 if(el.closest('[data-z62-refresh]')){e.preventDefault();last=0;load(true);return;}
 const saveBtn=el.closest('[data-z648-save]');if(saveBtn){e.preventDefault();saveBtn.disabled=true;savePermissions(saveBtn.dataset.z648Save).catch(ex=>{err=ex.message;render()}).finally(()=>{if(saveBtn.isConnected)saveBtn.disabled=false;});return;}
 const b=el.closest('[data-z62-remove]');if(b){e.preventDefault();b.disabled=true;remove(b.dataset.z62Remove).catch(ex=>{err=ex.message;render()}).finally(()=>{if(b.isConnected)b.disabled=false;});}
});
document.addEventListener('input',e=>{if(e.target?.id==='z62Search'){query=e.target.value.trim();render();}});
document.addEventListener('submit',e=>{if(e.target?.id!=='z62Add')return;e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;add($('#z62Uid')?.value.trim()||'').catch(ex=>{err=ex.message;render()}).finally(()=>{if(b.isConnected)b.disabled=false;});});
document.addEventListener('keydown',e=>{if(!opened)return;if(e.key==='Escape'){e.preventDefault();close();return;}
 if(e.key!=='Tab')return;const dialog=$('#z62TeamDialog');if(!dialog)return;
 const elements=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')].filter(x=>x.getClientRects().length);
 if(!elements.length)return;const first=elements[0],lastElement=elements[elements.length-1];
 if(e.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){e.preventDefault();lastElement.focus();}
 else if(!e.shiftKey&&(document.activeElement===lastElement||!dialog.contains(document.activeElement))){e.preventDefault();first.focus();}
});
window.addEventListener('load',nav);nav();
setInterval(()=>{if(document.visibilityState==='hidden')return;nav();if(opened){const o=owner();if(!o||scope!==o.uid+'|'+o.ws)close();else if(document.visibilityState==='visible')load();}},15000);
window.addEventListener('online',()=>{if(opened)load(true)});
document.addEventListener('visibilitychange',()=>{if(opened&&document.visibilityState==='visible')load(true)});
})();

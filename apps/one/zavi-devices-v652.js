/* ZAVI ONE V65.2 — owner device panel + offline-transfer guard.
 * Backend functions must be deployed; no client-provided data is used as an auth decision.
 * A browser device ID is an identifier, not a hardware-bound authentication factor.
 */
(function(root,factory){'use strict';const core=factory();if(typeof module==='object'&&module.exports)module.exports=core;if(root?.document)core.mount(root);})(typeof window!=='undefined'?window:null,function(){'use strict';
const dictionary={
 title:['دستگاه‌های حساب من','زما د حساب وسیلې','My account devices'],
 desc:['فهرست دستگاه‌های ثبت‌شده در همین فروشگاه. گزارش همگام‌سازی هر دستگاه ممکن است قدیمی باشد.','د دې دوکان ثبت شوې وسیلې؛ د همغږۍ معلومات ښايي زاړه وي.','Registered devices for this business. Sync reports may be outdated.'],
 refresh:['تازه‌سازی دستگاه‌ها','وسیلې تازه کول','Refresh devices'],
 audit:['تاریخچه امنیتی','د امنیت پېښو تاریخچه','Security history'],
 noCloud:['ابتدا با حساب مالک وارد فروشگاه ابری شوید.','لومړی د مالک له کلاوډ حساب سره ننوځئ.','Sign in as the cloud workspace owner first.'],
 loading:['در حال دریافت از سرور...','له سروره معلومات اخلو...','Loading from server…'],
 unavailable:['سرویس دستگاه‌ها در سرور فعلی یافت نشد. آدرس پروژه سرور مرکزی و نسخه سایت را بررسی کنید.','د وسیلو خدمت پر اوسني سرور ونه موندل شو؛ د پروژې پته او د وېب نسخه وګورئ.','Device service not found on the configured server. Check the سرور مرکزی project URL and web release.'],
 none:['دستگاهی ثبت نشده است.','وسیله نه ده ثبت شوې.','No devices registered.'],
 active:['فعال','فعال','Active'], revoked:['لغوشده','لغوه شوې','Revoked'],pending:['در انتظار','په تمه','Pending'],
 primary:['دستگاه اصلی','اصلي وسیله','Primary device'], secondary:['دستگاه فرعی','فرعي وسیله','Secondary device'],current:['همین دستگاه','همدا وسیله','This device'],
 lastSync:['آخرین همگام‌سازی گزارش‌شده','وروستۍ راپور شوې همغږي','Last reported sync'],
 lastSeen:['آخرین فعالیت','وروستۍ کړنه','Last activity'],
 unconfirmed:['نامعلوم / گزارش‌نشده','نامعلوم / نه دی راپور شوی','Unknown / not reported'],
 unsynced:['معاملات ارسال‌نشده (گزارش دستگاه)','نه لېږل شوې معاملې (د وسیلې راپور)','Unsent transactions (device report)'],
 revoke:['لغو دسترسی دستگاه','د وسیلې لاسرسی لغوه کول','Revoke device registration'],
 revokeWarning:['لغو ثبت دستگاه، نشست جیمیل/ایمیل را به‌طور خودکار پایان نمی‌دهد و داده‌های آفلاین دستگاه را پاک نمی‌کند. برای دستگاه گم‌شده، نشست‌ها را هم از بخش امنیت حساب پایان دهید.','د وسیلې ثبت لغوه کول د ایمیل ناسته نه ختموي او محلي معلومات نه پاکوي. ورک شوي وسیلې لپاره ناستې هم بندې کړئ.','Revoking device registration does not automatically end email login sessions or erase offline data. For a lost device, revoke sessions in account security too.'],
 rejected:['دستگاه گزارش معاملات ارسال‌نشده دارد؛ ابتدا روی همان دستگاه همگام‌سازی کنید.','وسیله نه لېږل شوې معاملې لري؛ لومړی يې همغږي کړئ.','Device reports pending transactions. Sync that device first.'],
 confirmRevoke:['آیا ثبت این دستگاه واقعاً لغو شود؟ ممکن است کارکرد آفلاین آن متوقف شود.','د دې وسیلې ثبت لغوه شي؟ آفلاین کار يې بندېدای شي.','Revoke this device registration? Offline access may stop.'],
 success:['درخواست توسط سرور تأیید شد.','سرور غوښتنه تایید کړه.','Server confirmed the request.'],
 transferPending:['دستگاه قبلی معاملات ارسال‌نشده دارد. انتقال را انجام ندهید؛ ابتدا روی دستگاه قبلی همگام‌سازی کنید و دوباره بررسی نمایید.','مخکینۍ وسیله نه لېږل شوې معاملې لري. لومړی يې همغږي کړئ.','Previous device reports unsynced transactions. Sync on that device before transferring.'],
 transferUnknown:['دستگاه قبلی هنوز گزارش تازه ندارد. اگر آن را دارید، با اینترنت همگام‌سازی کنید و سپس همین دکمه انتقال را روی دستگاه جدید بزنید. اگر دستگاه قبلی در دسترس نیست، برای بررسی نسخه پشتیبان از مسیر بازیابی امن اقدام کنید؛ فاکتورهای آفلاینِ ارسال‌نشده از راه دور قابل دریافت نیستند.','د پخوانۍ وسیلې تازه راپور نشته. که لاسرسی ورته لرئ، له انټرنېټ سره یې همغږې کړئ او بیا په نوې وسیله همدا د لېږد تڼۍ کېکاږئ. که لاسرسی نه وي، د بیکاپ خوندي بیا رغونه وکاروئ.','The previous device has no recent status report. If available, sync it online and press the same transfer button again on the new device. If unavailable, use supervised backup recovery; unsent offline transactions cannot be retrieved remotely.'],
 serverUnavailable:['بررسی وضعیت دستگاه قبلی از سرور ممکن نشد. انتقال ایمن انجام نمی‌شود.','د مخکینۍ وسیلې حالت نه شي کتل کېدای؛ لېږد نه کېږي.','Cannot verify previous-device status with the server; transfer blocked.'],
 eventsEmpty:['رویداد امنیتی ثبت نشده است.','امنیتي پېښې نشته.','No recorded security events.'],
 event_registered:['ثبت دستگاه جدید','نوی وسیله ثبت شوه','New device registered'],event_activated:['فعال‌شدن دستگاه','وسیله فعاله شوه','Device activated'],event_revoked:['لغو دسترسی دستگاه','د وسیلې لاسرسی لغوه شو','Device revoked'],event_transferred:['انتقال دستگاه اصلی','اصلي وسیله ولېږدول شوه','Primary device transferred'],event_staff:['تغییر اختیارات همکار','د همکار اجازه بدله شوه','Staff permissions changed'],
 securityNote:['IP در صورت ارسال توسط سرور ثبت می‌شود و برای اثبات هویت دستگاه کافی نیست.','IP که سرور ولېږي ثبتېږي، خو د وسیلې د هویت بشپړ ثبوت نه دی.','IP is recorded when provided by the server and is not proof of device identity.'],
 checkin:['گزارش وضعیت این دستگاه','د دې وسیلې د حالت راپور','Report this device status'],
 localPending:['این دستگاه تغییرات آفلاین ارسال‌نشده یا تعارض ابری دارد؛ ابتدا همگام‌سازی یا پشتیبان تهیه کنید.','دا وسیله ناهمغږي بدلونونه لري؛ لومړی همغږي یا بیکاپ جوړ کړئ.','This device has pending offline changes or a sync conflict. Sync or back up before transferring.'],
 unknownPending:['اطلاعات دستگاه قبلی که آفلاین است از راه دور قابل بررسی قطعی نیست.','د آفلاین پخوانۍ وسیلې معلومات په ډاډ نه شي کتل کېدای.','Offline devices cannot be fully inspected remotely.']
};
function locale(lang){return lang==='en'?2:lang==='ps-AF'?1:0}
function t(k,lang){return dictionary[k]?.[locale(lang)]||k}
const latin=s=>String(s??'').replace(/[۰-۹]/g,ch=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch))).replace(/[٠-٩]/g,ch=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(ch)));
function isFresh(last,now=Date.now(),minutes=15){const n=Date.parse(last||'');return Number.isFinite(n)&&n<=now+60000&&now-n<=minutes*60000;}
function classifyOtherDevices(devices,ownId,now=Date.now()){
 const previous=(Array.isArray(devices)?devices:[]).filter(d=>d?.status==='active'&&d?.device_id!==ownId);
 if(previous.some(d=>Number(d.reported_pending_count)>0))return {status:'pending',devices:previous};
 if(previous.some(d=>!isFresh(d.last_report_at,now)||!d.last_sync_at||!Number.isFinite(Date.parse(d.last_sync_at))||Date.parse(d.last_sync_at)>now+60000||d.reported_pending_count===null||d.reported_pending_count===undefined))return {status:'unknown',devices:previous};
 return {status:'clear',devices:previous};
}
function date(v,lang){if(!v)return '—';const d=new Date(v);if(!Number.isFinite(d.getTime()))return '—';return latin(new Intl.DateTimeFormat(lang==='en'?'en-GB':lang==='ps-AF'?'en-GB':'en-GB',{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Kabul'}).format(d));}
function escape(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function mount(w){
 let serverRows=[],events=[],state='idle',busy=false,currentScope='',lastCheckin=0,checkinFlight=null,lastTransferBlocked=null;
 const $=s=>w.document.querySelector(s);const lang=()=>w.zaviPublicLanguage?.()||w.document.documentElement.lang||'fa-AF';
 const ctx=()=>w.zaviCloudRestoreInfo?.()||{}; const auth=()=>w.zaviCloudGetAuthSession?.()||{};
 const own=()=>!!(ctx().workspace&&ctx().role==='owner'&&auth().user?.id&&auth().access_token);
 const deviceId=()=>w.zaviDeviceActivation?.getDeviceId?.()||'';
 const scope=()=>String(auth().user?.id||'')+'|'+String(ctx().workspace||'');
 async function rpc(name,args){if(!own())throw Error(t('noCloud',lang()));const first=auth().user.id;const cfg=w.zaviCloudGetPublicConfig?.();if(!cfg?.url||!cfg?.key)throw Error(t('unavailable',lang()));
 const u=new URL(cfg.url);if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))throw Error('HTTPS required');
 await w.zaviCloudRefreshAuthSession?.();const fresh=auth();if(fresh.user?.id!==first||!fresh.access_token)throw Error(t('noCloud',lang()));
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const r=await fetch(u.href.replace(/\/$/,'')+'/rest/v1/rpc/'+name,{method:'POST',cache:'no-store',headers:{apikey:cfg.key,Authorization:'Bearer '+fresh.access_token,'Content-Type':'application/json'},body:JSON.stringify(args||{}),signal:controller.signal});const body=await r.json().catch(()=>null);if(!r.ok)throw Error(body?.message||'HTTP '+r.status);return body;}finally{clearTimeout(timer)}
 }
 function settingsHTML(){const l=lang();return `<section id="z652DevicePanel" class="card z652-card" aria-label="${escape(t('title',l))}"><header class="z652-title"><div><h3>📱 ${escape(t('title',l))}</h3><p>${escape(t('desc',l))}</p></div><div class="z652-actions"><button type="button" class="btn subtle" data-z652="refresh">${escape(t('refresh',l))}</button><button type="button" class="btn subtle" data-z652="checkin">${escape(t('checkin',l))}</button></div></header><div id="z652Status" class="z652-status" role="status" aria-live="polite">${escape(t('loading',l))}</div><div id="z652Devices" class="z652-devices"></div><details class="z652-audit"><summary>${escape(t('audit',l))}</summary><p>${escape(t('securityNote',l))}</p><div id="z652Events"></div></details><p class="z652-warning">${escape(t('revokeWarning',l))}</p></section>`}
 function report(message,error=false){const el=$('#z652Status');if(el){el.textContent=message;el.classList.toggle('z652-error',error)}}
 function render(){const el=$('#z652Devices'),ev=$('#z652Events'),l=lang();if(!el)return;
 if(!own()){el.textContent='';if(ev)ev.textContent='';report(t('noCloud',l));return}
 if(state!=='loaded'){el.textContent='';if(ev)ev.textContent='';return}
 if(!serverRows.length){el.textContent=t('none',l);}else{
  el.innerHTML=serverRows.map(d=>{const me=d.device_id===deviceId(),count=d.reported_pending_count;
   const canRevoke=d.status!=='revoked'&&!me;return `<article class="z652-item"><div class="z652-device-head"><strong>${escape(d.device_name||d.device_model||d.device_id||'—')}</strong><span class="z652-tag ${me?'z652-current':''}">${escape(d.status==='active'?t('primary',l):t('secondary',l))}${me?' · '+escape(t('current',l)):''} · ${escape(t(d.status||'pending',l))}</span></div><div class="z652-meta">${escape(d.device_model||'')}<span>${escape(t('lastSeen',l))}: ${escape(date(d.last_seen_at,l))}</span><span>${escape(t('lastSync',l))}: ${escape(date(d.last_sync_at,l))}</span><span>${escape(t('unsynced',l))}: ${count===null||count===undefined?'—':escape(latin(count))}</span>${isFresh(d.last_report_at)?'':`<em>${escape(t('unconfirmed',l))}</em>`}</div>${canRevoke?`<button class="btn danger tiny" type="button" data-z652-revoke="${escape(d.device_id)}">${escape(t('revoke',l))}</button>`:''}</article>`}).join('');
 }
 if(ev){ev.innerHTML=!events.length?`<p>${escape(t('eventsEmpty',l))}</p>`:events.map(x=>`<div class="z652-event"><b>${escape(({device_registered:t('event_registered',l),device_activated:t('event_activated',l),device_revoked:t('event_revoked',l),device_primary_replaced:t('event_transferred',l),staff_permissions_changed:t('event_staff',l)})[x.kind]||x.kind)}</b><time dir="ltr">${escape(date(x.at,l))}</time><small>${escape(x.device_model||x.device_id||'')} ${escape(x.ip_address||'')}</small></div>`).join('')}
 }
 async function refresh(){if(busy)return;busy=true;const initial=scope();report(t('loading',lang()));try{
 const ws=ctx().workspace;const [d,a]=await Promise.all([rpc('zavi_v652_owner_devices',{p_workspace:ws}),rpc('zavi_v652_owner_security_events',{p_workspace:ws,p_limit:50})]);
 if(scope()!==initial)return;if(!Array.isArray(d)||!Array.isArray(a))throw Error('Unexpected server response');serverRows=d;events=a;state='loaded';report('✓ '+t('success',lang()));render();
 }catch(e){state='failed';serverRows=[];events=[];report((/PGRST202|Could not find|404|schema cache/i.test(e.message)?t('unavailable',lang()):e.message),true);render()}finally{busy=false}}
 async function checkin(){
 if(checkinFlight)return checkinFlight;
 checkinFlight=checkinInternal();try{return await checkinFlight}finally{checkinFlight=null}
 }
 async function checkinInternal(){if(!own())throw Error(t('noCloud',lang()));const stat=w.zaviCloudDeviceSyncStatus?.()||ctx();const ws=ctx().workspace;
 if(stat.workspace!==ws||stat.role!=='owner')throw Error(t('noCloud',lang()));
 const count=stat.pending||stat.conflict?1:0;const id=deviceId();if(!id)throw Error('Device ID unavailable');
 const resp=await rpc('zavi_v652_owner_device_checkin',{p_workspace:ws,p_device_id:id,p_model:(w.navigator.userAgentData?.platform||w.navigator.platform||'Browser').slice(0,120),p_pending_count:count,p_synced:!count&&!!stat.last_sync_successful});
 lastCheckin=Date.now();return resp;
 }
 async function guardedTransfer(ws,newDeviceId,options={}){if(!own()||ctx().workspace!==ws)throw Error(t('noCloud',lang()));
 lastTransferBlocked=null;
 function blocked(code,message){lastTransferBlocked={code,message};if(!options.silent)w.alert(message);return false}
 const local=w.zaviCloudDeviceSyncStatus?.();
 if(local&&local.workspace===ws&&(local.pending||local.conflict)){return blocked('local_pending',t('localPending',lang()))}
 let devices;
 try{devices=await rpc('zavi_v652_owner_devices',{p_workspace:ws});if(!Array.isArray(devices))throw Error('Invalid response');}
 catch(e){return blocked('server_unavailable',t('serverUnavailable',lang())+'\n'+e.message)}
 const check=classifyOtherDevices(devices,newDeviceId);
 if(check.status==='pending')return blocked('previous_pending',t('transferPending',lang()));
 if(check.status==='unknown'){
  // V65.11: unverified old-device state is not proof of zero unsent invoices.
  // Do not override by typing TRANSFER: require a verified sync or supervised recovery.
  return blocked('previous_stale',t('transferUnknown',lang()));
 }
 return true;
 }
 async function revoke(id){if(!own())return;const d=serverRows.find(x=>x.device_id===id);if(!d||id===deviceId())return;
 if(Number(d.reported_pending_count)>0){w.alert(t('rejected',lang()));return}
 if(d.reported_pending_count===null||d.reported_pending_count===undefined||!isFresh(d.last_report_at)){w.alert(t('unknownPending',lang()));return}
 if(!w.confirm(t('confirmRevoke',lang())+'\n'+t('revokeWarning',lang())))return;
 try{await rpc('zavi_v652_owner_revoke_device',{p_workspace:ctx().workspace,p_device_id:id});await refresh()}catch(e){report(e.message,true)}
 }
 w.document.addEventListener('click',e=>{const el=e.target.closest('[data-z652],[data-z652-revoke]');if(!el)return;const panel=el.closest('#z652DevicePanel');if(!panel)return;e.preventDefault();if(el.dataset.z652Revoke){revoke(el.dataset.z652Revoke);return}if(el.dataset.z652==='refresh')refresh();if(el.dataset.z652==='checkin')checkin().then(refresh).catch(e=>report(e.message,true));});
 
 // V65.20: A verified cloud download is a successful sync too. Previous versions
 // reported success only after pushing a *new* invoice, so a healthy old device
 // stayed stale and blocked safe owner-initiated transfers. Do not fake a clean
 // report: cloud.js emits this only after confirming no pending/conflict.
 function checkinWhenSynced(delay=650){
  const start=scope();
  if(!own()||!w.navigator.onLine||Date.now()-lastCheckin<60000)return;
  w.setTimeout(()=>{
    const s=w.zaviCloudDeviceSyncStatus?.();
    if(own()&&w.navigator.onLine&&scope()===start&&s?.last_sync_successful===true&&!s.pending&&!s.conflict){
      checkin().catch(()=>{});
    }
  },delay);
 }
 w.addEventListener('zavi-cloud-sync-confirmed',e=>{
  if(e.detail?.workspace===ctx().workspace)checkinWhenSynced(180);
 });
 w.addEventListener('online',()=>checkinWhenSynced(2200));
 w.addEventListener('focus',()=>checkinWhenSynced(900));
 w.document.addEventListener('visibilitychange',()=>{if(w.document.visibilityState==='visible')checkinWhenSynced(950)});
 w.setInterval(()=>checkinWhenSynced(600),4*60*1000);
w.addEventListener('zavi-cloud-workspace-selected',()=>{const now=scope();if(now!==currentScope){currentScope=now;serverRows=[];events=[];state='idle'}if(own()&&w.navigator.onLine){setTimeout(()=>{if(own()&&scope()===now&&Date.now()-lastCheckin>60000)checkin().catch(()=>{});},1800)}});
 w.addEventListener('zavi-cloud-logged-out',()=>{currentScope='';serverRows=[];events=[];state='idle';render()});
 w.document.addEventListener('zavi:language-changed',()=>{if($('#z652DevicePanel')){render()}});
 // Explicit render hook: avoids a page-wide MutationObserver on every DOM change.
 function onSettingsRendered(){const el=$('#z652DevicePanel');if(!el)return;
  const now=scope();if(now!==currentScope){currentScope=now;state='idle';serverRows=[];events=[]}
  if(own()&&state==='idle')refresh();else render();
 }
 w.ZaviDevices652={settingsHTML,onSettingsRendered,refresh,checkin,guardTransfer:guardedTransfer,lastTransferBlock:()=>lastTransferBlocked};
 }
 return {t,latin,isFresh,classifyOtherDevices,mount};
});

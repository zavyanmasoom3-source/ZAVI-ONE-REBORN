/* ZAVI ONE V65.82: simple 7-day cloud/offline information, with no local grant bypass. */
(()=>{'use strict';
 const q=(s,p=document)=>p?.querySelector?.(s)||null;
 const card=()=>q('[data-zavi-auto-offline-card]');
 const ctx=()=>window.zaviCloudRestoreInfo?.()||{};
 const text={
  fa:{title:'مجوز آفلاین',trial:'مجوز آزمایشی ۷روزه',ready:'آفلاین آماده است',signed:'مجوز فعال است؛ فایل‌های آفلاین در حال آماده‌سازی‌اند',pending:'مجوز پس از ورود ابری خودکار فعال می‌شود',connection:'برای گرفتن مجوز، یک‌بار اینترنت را وصل کنید',inactive:'مجوز آفلاین هنوز فعال نشده است',end:'پایان اعتبار',retry:'دریافت دوباره مجوز',help:'راهنمای رفع مشکل',tools:'تنظیمات فنی',processing:'در حال بررسی حساب و مجوز…'},
  en:{title:'Offline permission',trial:'7-day trial offline permission',ready:'Offline is ready',signed:'Permission active; preparing offline files',pending:'Permission activates automatically after cloud sign-in',connection:'Connect once to obtain the signed permission',inactive:'Offline permission is not active yet',end:'Valid until',retry:'Refresh offline permission',help:'Fix offline problem',tools:'Technical options',processing:'Checking cloud permission…'},
  ps:{title:'آفلاین جواز',trial:'د ۷ ورځو آفلاین جواز',ready:'آفلاین چمتو دی',signed:'جواز فعال دی؛ آفلاین فایلونه چمتو کېږي',pending:'له کلاوډ ننوتلو وروسته جواز په خپله فعالېږي',connection:'د جواز لپاره یو ځل انټرنټ وصل کړئ',inactive:'آفلاین جواز لا فعال نه دی',end:'د اعتبار پای',retry:'جواز بیا ترلاسه کړئ',help:'د ستونزې لارښود',tools:'تخنیکي تنظیمات',processing:'د کلاوډ جواز کتل کېږي…'}
 };
 const lang=()=>{let v=(q('#zaviTopLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'};
 const tr=()=>text[lang()];
 let policy=null,policyWs='',lastCheck=0,checking=false,lastError='',paintJob=null,lastPaint=0;
 function date(exp){try{return new Intl.DateTimeFormat(lang()==='en'?'en-GB':lang()==='ps'?'ps-AF':'fa-AF',{timeZone:'Asia/Kabul',year:'numeric',month:'long',day:'numeric'}).format(new Date(exp*1000))}catch{return '—'}}
 async function fetchPolicy(force=false){
  const c=ctx(),ws=c.workspace,now=Date.now();
  if(!ws||!window.navigator.onLine||c.role!=='owner')return;
  if(checking||(!force&&ws===policyWs&&now-lastCheck<120000))return;
  const a=window.zaviCloudGetAuthSession?.(),cfg=window.zaviCloudGetPublicConfig?.();
  if(!a?.access_token||!cfg?.url||!cfg?.key)return;
  if(policyWs!==ws)policy=null;
  policyWs=ws;lastCheck=now;checking=true;
  try{
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
   let response;try{response=await fetch(cfg.url.replace(/\/$/,'')+'/rest/v1/rpc/zavi_my_offline_policy',{
    method:'POST',headers:{'apikey':cfg.key,'authorization':'Bearer '+a.access_token,'content-type':'application/json'},
    body:JSON.stringify({p_workspace_id:ws}),signal:controller.signal})}finally{clearTimeout(timeout)}
   if(!response.ok)throw Error('SERVER_'+response.status);
   const raw=await response.json(),row=Array.isArray(raw)?raw[0]:raw;
   if(ctx().workspace!==ws)return;
   policy=row&&typeof row==='object'?row:null;lastError='';
   // A renewed seven-day trial must not keep showing an older 180/365-day lease.
   // Ask the server to replace it with an ES256 lease bounded by the CURRENT policy.
   // Never change expiry or can_write locally.
   if(policy?.is_enabled===true&&Number(policy.offline_days)===7){
    const signed=window.zaviSecureOfflineLicense;
    const cached=await signed?.cached?.(ws).catch(()=>null);
    const expiry=Number(cached?.claims?.exp||0)*1000;
    const limit=Math.min(
      Number.isFinite(Date.parse(policy.expires_at))?Date.parse(policy.expires_at):Infinity,
      Date.now()+7*86400000
    );
    if(ctx().workspace===ws&&(!expiry||expiry>limit+60000)){
     await window.ZaviAutoLease?.refresh?.();
    }
   }
  }catch(e){lastError=String(e?.message||'UNAVAILABLE');if(policyWs!==ws)policy=null}
  finally{checking=false;schedule()}
 }
 async function paint(){
  const node=card(),c=ctx(),now=Date.now();if(!node||!c.workspace)return;
  const t=tr(),retry=q('[data-zavi-auto-retry]',node),help=q('[data-zavi-health-check]',node),summary=q('.z46-technical-options summary',node);
  if(retry&&retry.textContent!==t.retry)retry.textContent=t.retry;
  if(help&&help.textContent!==t.help)help.textContent=t.help;
  if(summary&&summary.textContent!==t.tools)summary.textContent=t.tools;
  let line=q('#z82-offline-overview',node);
  if(!line){line=document.createElement('div');line.id='z82-offline-overview';line.className='z82-simple-status';line.setAttribute('role','status');line.setAttribute('aria-live','polite');
   const after=q('.z46-shell-status',node);if(after)after.insertAdjacentElement('afterend',line);else node.prepend(line)}
  const samePolicy=policyWs===c.workspace&&policy&&policy.is_enabled===true;
  const trial=!!(samePolicy&&Number(policy.offline_days)===7);
  const verified=await window.zaviSecureOfflineLicense?.cached?.(c.workspace).catch(()=>null);
  const valid=verified?.claims?.exp*1000>now&&verified?.claims?.sub===window.zaviCloudGetAuthSession?.()?.user?.id;
  const fullReady=window.zaviAutoOffline?.status?.()?.ready===true;
  const parts=[trial?t.trial:t.title];
  if(valid)parts.push(fullReady?t.ready:t.signed);
  else if(!navigator.onLine)parts.push(t.connection);
  else parts.push(t.pending);
  if(valid)parts.push(t.end+': '+date(verified.claims.exp));
  // Never call policy status "ready" based on an unverified device or unsigned value.
  const kind=valid?(fullReady?'ready':'signed'):'pending';
  const fingerprint=parts.join(' · ');
  if(line.dataset.text===fingerprint && line.dataset.kind===kind)return;
  line.dataset.text=fingerprint;
  line.replaceChildren();
  const strong=document.createElement('strong');strong.textContent=parts[0];line.append(strong);
  const small=document.createElement('span');small.textContent=parts.slice(1).join(' · ');line.append(small);
  line.dataset.kind=kind;
  // Card labels stay clear even when the subscription plan is semiannual/annual.
 }
 function schedule(){if(paintJob)clearTimeout(paintJob);paintJob=setTimeout(()=>{paintJob=null;paint().catch(()=>{})},160)}
 async function refresh(){
  await fetchPolicy(true);
  // Refresh the signed lease from the server first. No local flag is granted.
  await window.ZaviAutoLease?.refresh?.();
  await window.zaviAutoOffline?.prepare?.();
  schedule();
 }
 const events=['online','offline','focus','zavi-offline-lease-ready','zavi-cloud-session-changed','zavi-cloud-workspace-selected','zavi-subscription-updated','zavi-admin-trial-granted','zavi-auto-offline-status'];
 for(const event of events)window.addEventListener(event,()=>{if(event==='online'||event==='focus'||event==='zavi-subscription-updated'||event==='zavi-admin-trial-granted')fetchPolicy(true);schedule()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){fetchPolicy(true);schedule()}});
 document.addEventListener('change',e=>{if(e.target?.id==='zaviTopLanguage')schedule()});
 // The existing retry action still works; pre-refresh its ES256 lease to handle seven-day extensions.
 window.ZaviTrial7Offline=Object.freeze({refresh,policy:()=>policy&&({...policy})});
 function start(){fetchPolicy(true);schedule();const root=q('#content')||document.body;
  new MutationObserver(()=>{const now=Date.now();if(now-lastPaint>1500){lastPaint=now;schedule()}}).observe(root,{childList:true,subtree:true});
  setInterval(()=>{if(!document.hidden){fetchPolicy();schedule()}},30000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* ZAVI ONE Stage 4 — real owner-only cheque register and server-confirmed settlement.
 * This module never changes local financial balances itself.
 * A queued offline request is not a cleared cheque until the server replies and
 * the server workspace revision is reloaded.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const validUuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
 const isAmount=s=>typeof s==='string'&&/^(?:0|[1-9]\d{0,13})(?:\.\d{1,2})?$/.test(s)&&Number(s)>0;
 const validRate=s=>typeof s==='string'&&/^(?:0|[1-9]\d{0,8})(?:\.\d{1,6})?$/.test(s)&&Number(s)>0;
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const sameDate=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const [year,month,day]=s.split('-').map(Number);
  if(year<1900||year>2200)return false;
  const d=new Date(Date.UTC(year,month-1,day));return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;} ;
 const queueKey=(uid,ws)=>'zavi_stage4_cheque_intents_'+uid+'_'+ws;
 const labels={
  'fa-AF':{title:'چک‌ها',intro:'دریافتی، پرداختی و تسویهٔ تأییدشده از سرور',received:'دریافتی',issued:'پرداختی',
   reload:'تازه‌سازی',register:'ثبت چک در انتظار',number:'شماره چک',bank:'نام بانک',contact:'طرف حساب',
   amount:'مبلغ چک',currency:'ارز',issue:'تاریخ صدور',due:'سررسید',save:'ثبت در سرور',
   pending:'در انتظار',deposited:'به بانک سپرده‌شده',partially_cleared:'تسویهٔ قسمتی',
   cleared:'تسویه‌شده',bounced:'برگشت‌خورده',cancelled:'لغوشده',settle:'تسویه',
   deposit:'سپردن به بانک',bounce:'برگشت چک',cancel:'لغو چک',account:'حساب دریافت/پرداخت',
   rate:'نرخ تبدیل به ارز فروشگاه',part:'مبلغ این تسویه',send:'تأیید تسویه',
   empty:'چکی برای نمایش ثبت نشده است.',notOwner:'با حساب مالک فروشگاه وارد شوید.',
   wait:'در حال ارتباط با سرور…',offline:'آفلاین: تسویه فقط در صف امن ذخیره می‌شود؛ پول ثبت نمی‌شود.',
   remote:'تسویه تنها پس از تأیید سرور ثبت می‌شود.',queued:'عملیات در صف امن است؛ هنوز سند حسابداری ثبت نشده.',
   queue:'صف عملیات ارسال‌نشده',retry:'ارسال دوباره',blocked:'ابتدا تغییرات آفلاین فروشگاه را همگام‌سازی و تعارض‌ها را حل کنید.',
   unready:'سرویس تسویهٔ چک هنوز در سرور فعال نیست؛ هیچ پرداختی ثبت نشد.',
   confirm:'این اقدام در صورت تأیید سرور روی حساب‌ها اثر می‌گذارد. ادامه می‌دهید؟',
   done:'سرور عملیات را تأیید کرد؛ دریافت تازهٔ دفتر حساب انجام می‌شود.',
   failed:'درخواست تأیید نشد؛ وضعیت صف و سرور را بررسی کنید.'},
  'ps-AF':{title:'چکونه',intro:'ترلاسه شوي، ورکړل شوي او د سرور تایید شوې تصفیه',received:'ترلاسه شوي',issued:'ورکړل شوي',
   reload:'تازه کول',register:'د انتظار چک ثبتول',number:'د چک شمېره',bank:'بانک',contact:'حساب لرونکی',
   amount:'د چک پیسې',currency:'اسعار',issue:'د صادرېدو نېټه',due:'د ورکړې نېټه',save:'په سرور کې ثبت',
   pending:'انتظار',deposited:'بانک ته وسپارل شو',partially_cleared:'یوه برخه تصفیه',cleared:'تصفیه شو',
   bounced:'بېرته راغی',cancelled:'لغوه شو',settle:'تصفیه',deposit:'بانک ته سپارل',
   bounce:'بېرته ګرځول',cancel:'لغوه کول',account:'بانکي/نغدي حساب',rate:'د تبادلې نرخ',
   part:'د دې تصفیې مبلغ',send:'تصفیه تاییدول',empty:'چکونه نشته.',notOwner:'د دوکان مالک حساب ته ننوځئ.',
   wait:'له سرور سره نښلوو…',offline:'آفلاین: یوازې د تصفیې غوښتنه ساتل کېږي؛ پیسې نه ثبتېږي.',
   remote:'یوازې د سرور له تایید وروسته پیسې ثبتېږي.',queued:'غوښتنه په کتار کې ده؛ حساب نه دی بدل شوی.',
   queue:'نااستول شوې غوښتنې',retry:'بیا لېږل',blocked:'لومړی د دوکان نه لېږل شوي بدلونونه همغږي کړئ.',
   unready:'په سرور کې د چک تصفیه نه ده فعاله؛ پیسې نه دي ثبت شوي.',
   confirm:'د سرور په تایید سره حساب بدلېږي. دوام ورکوئ؟',
   done:'سرور تصفیه تایید کړه؛ حساب تازه کېږي.',failed:'سرور غوښتنه تایید نه کړه.'},
  en:{title:'Cheques',intro:'Received, issued and server-confirmed settlements',received:'Received',issued:'Issued',
   reload:'Refresh',register:'Register pending cheque',number:'Cheque number',bank:'Bank',contact:'Counterparty',
   amount:'Face amount',currency:'Currency',issue:'Issue date',due:'Due date',save:'Register on server',
   pending:'Pending',deposited:'Deposited',partially_cleared:'Partially cleared',cleared:'Cleared',
   bounced:'Bounced',cancelled:'Cancelled',settle:'Settle',deposit:'Deposit',
   bounce:'Bounce',cancel:'Cancel',account:'Cash/bank account',rate:'Rate into business currency',
   part:'Amount to settle',send:'Confirm settlement',empty:'No cheques registered.',
   notOwner:'Sign in as the business owner.',wait:'Contacting the server…',
   offline:'Offline: settlement intent is queued, no accounting entry is posted.',
   remote:'Only the server can post a confirmed financial settlement.',
   queued:'Intent is safely queued; this is not a posted payment.',
   queue:'Unsent operations',retry:'Retry queued operations',
   blocked:'First sync pending workspace changes and resolve any conflict.',
   unready:'The cheque settlement RPC is not deployed on this server; no payment was posted.',
   confirm:'This action changes balances only after server approval. Continue?',
   done:'Server confirmed; reloading the accounting ledger.',failed:'Not confirmed. Review queue and server.'}
 };
 const language=w=>{
  const code=String(w.zaviPublicLanguage?.()||w.document.documentElement.lang||'fa-AF');
  return code.startsWith('en')?'en':code.startsWith('ps')?'ps-AF':'fa-AF';
 };
 function safeQueue(storage,uid,ws){
  if(!uid||!validUuid(ws))return [];
  try{
   const items=JSON.parse(storage.getItem(queueKey(uid,ws))||'[]');
   return Array.isArray(items)?items.filter(x=>x&&x.uid===uid&&x.workspace===ws&&
      validUuid(x.id)&&validUuid(x.cheque)&&['deposit','settle','bounce','cancel'].includes(x.kind)).slice(0,100):[];
  }catch(_){return []}
 }
 function saveQueue(storage,uid,ws,items){
  if(items.length>100)throw Error('QUEUE_CAPACITY_EXCEEDED');
  storage.setItem(queueKey(uid,ws),JSON.stringify(items));
  if(!Array.isArray(JSON.parse(storage.getItem(queueKey(uid,ws))||'null')))
   throw Error('QUEUE_STORAGE_UNAVAILABLE');
 }
 function validateRegistration(f){
  const amount=String(f.amount||'').trim();
  if(!validUuid(f.workspace)||!['received','issued'].includes(f.direction)||
   !/^[A-Za-z0-9]{3}$/.test(f.currency)||!isAmount(amount)||
   !String(f.cheque_number||'').trim()||String(f.cheque_number).length>100||
   !String(f.bank_name||'').trim()||String(f.bank_name).length>150||
   !String(f.counterparty_id||'').trim()||
   !sameDate(f.issue_date)||!sameDate(f.due_date)||f.due_date<f.issue_date)
   throw Error('INVALID_CHEQUE_REGISTRATION');
  return {...f,amount:Number(amount),status:'pending'};
 }
 function validateOperation(f){
  if(!validUuid(f.workspace)||!validUuid(f.cheque)||!validUuid(f.id)||
     !['settle','deposit','bounce','cancel'].includes(f.kind))
   throw Error('INVALID_CHEQUE_OPERATION');
  if(f.kind==='settle'){
   if(!isAmount(String(f.amount||''))||!/^[a-zA-Z0-9_:-]{1,90}$/.test(f.account||'')||
     (f.rate!==null&&!validRate(String(f.rate))))throw Error('INVALID_SETTLEMENT');
  }else if(f.amount!==null||f.account!==null||f.rate!==null)throw Error('INVALID_OPERATION_EXTRAS');
  return f;
 }
 function mount(w){
  let context=null,rows=[],busy=false,registering=false,queueBusy=false,serverReady=false,lastScope='',lastError='',lastLoaded=0;
  const el=()=>w.document.getElementById('zaviStage4Cheques');
  const scope=()=>{
   const state=w.zaviCloudRestoreInfo?.()||{},uid=w.zaviCloudGetAuthSession?.()?.user?.id||'';
   return {uid,workspace:state.workspace,role:state.role,pending:!!state.pending,conflict:!!state.conflict,
    key:uid+'|'+state.workspace};
  };
  const owner=s=>s&&s.uid&&validUuid(s.workspace)&&s.role==='owner';
  const tr=()=>labels[language(w)];
  const opts=(items,selected)=>items.map(([id,name])=>'<option value="'+escape(id)+'"'+(id===selected?' selected':'')+'>'+escape(name)+'</option>').join('');
  function setMessage(msg){lastError=String(msg||'');const message=el()?.querySelector('[data-cheque-message]');
   if(message)message.textContent=lastError;}
  function pendingRows(s){return safeQueue(w.localStorage,s.uid,s.workspace)}
  function render(){
   const host=el(),s=scope(),t=tr();if(!host)return;
   host.lang=language(w);host.dir=language(w)==='en'?'ltr':'rtl';
   if(!owner(s)){host.innerHTML='<h3>'+escape(t.title)+'</h3><p>'+escape(t.notOwner)+'</p>';return}
   const local=context&&context.workspace===s.workspace?context:null;
   const contacts=(local?.contacts||[]).map(c=>[String(c.id),String(c.name||c.id)]);
   const accounts=(local?.accounts||[]).map(a=>[String(a.id),String(a.name||a.id)]);
   const currentCurrency=String(local?.currency||'AFN');
   const sourceCurrencies=w.ZaviCreditors6528?.currencies?.(currentCurrency)||
     [['AFN','AFN'],['USD','USD'],['PKR','PKR'],['EUR','EUR'],['CNY','CNY']];
   const currencies=[...new Map(sourceCurrencies.filter(x=>Array.isArray(x)&&
     /^[A-Z]{3}$/.test(String(x[0]))).map(([code,title])=>[code,String(title)])).entries()];
   const offline=w.navigator.onLine===false;
   const blocked=s.pending||s.conflict;
   const today=new Date().toISOString().slice(0,10);
   const q=pendingRows(s);
   const data=rows.filter(x=>x.workspace_id===s.workspace);
   const cards=data.map(d=>{
    const remaining=Number(d.amount)-Number(d.settled_amount||0);
    const closed=['cleared','bounced','cancelled'].includes(d.status);
    return '<article class="zavi-cheque-row" data-cheque-id="'+escape(d.id)+'">'+
      '<div class="zavi-cheque-row-head"><strong>'+escape(d.cheque_number)+'</strong><span>'+
        escape(t[d.status]||d.status)+'</span></div>'+
      '<p>'+escape(d.bank_name)+' · '+escape(d.direction==='received'?t.received:t.issued)+
        ' · '+escape(d.currency)+' '+escape(d.amount)+' · '+escape(d.due_date||'')+'</p>'+
      '<small>'+escape(contacts.find(c=>c[0]===d.counterparty_id)?.[1]||d.counterparty_id||'')+'</small>'+
      (closed?'':'<div class="zavi-cheque-actions">'+
       '<button class="btn tiny" type="button" data-cheque-action="settle" data-id="'+escape(d.id)+'">'+escape(t.settle)+'</button>'+
       (d.status==='pending'?'<button class="btn subtle tiny" type="button" data-cheque-action="deposit" data-id="'+escape(d.id)+'">'+escape(t.deposit)+'</button>':'')+
       '<button class="btn subtle tiny" type="button" data-cheque-action="bounce" data-id="'+escape(d.id)+'">'+escape(t.bounce)+'</button>'+
       (d.status==='pending'?'<button class="btn subtle tiny" type="button" data-cheque-action="cancel" data-id="'+escape(d.id)+'">'+escape(t.cancel)+'</button>':'')+
       '</div>')+
      '<div class="zavi-cheque-settle" data-cheque-settle="'+escape(d.id)+'" hidden>'+
        '<label>'+escape(t.part)+'<input name="amount" type="number" min="0.01" step="0.01" max="'+escape(remaining.toFixed(2))+'" value="'+escape(Math.max(0,remaining).toFixed(2))+'" required></label>'+
        '<label>'+escape(t.account)+'<select name="account" required>'+opts(accounts)+'</select></label>'+
        (d.currency!==currentCurrency?'<label>'+escape(t.rate)+'<input name="rate" type="number" min="0.000001" step="0.000001" required></label>':'')+
        '<button class="btn primary" type="button" data-cheque-action="confirm-settle" data-id="'+escape(d.id)+'">'+escape(t.send)+'</button>'+
      '</div></article>';
   }).join('');
   host.innerHTML='<div class="zavi-cheque-heading"><div><h3>'+escape(t.title)+'</h3><p>'+escape(t.intro)+'</p></div>'+
     '<button class="btn subtle" type="button" data-cheque-action="refresh">'+escape(t.reload)+'</button></div>'+
     '<p class="zavi-cheque-notice">'+escape(offline?t.offline:blocked?t.blocked:t.remote)+'</p>'+
     '<p role="status" aria-live="polite" data-cheque-message>'+escape(lastError)+'</p>'+
     '<details class="zavi-cheque-entry"><summary>'+escape(t.register)+'</summary><form data-cheque-register>'+
     '<label>'+escape(t.received)+' / '+escape(t.issued)+'<select name="direction" required><option value="received">'+escape(t.received)+'</option><option value="issued">'+escape(t.issued)+'</option></select></label>'+
     '<label>'+escape(t.number)+'<input name="cheque_number" maxlength="100" required></label>'+
     '<label>'+escape(t.bank)+'<input name="bank_name" maxlength="150" required></label>'+
     '<label>'+escape(t.contact)+'<select name="counterparty_id" required>'+opts(contacts)+'</select></label>'+
     '<label>'+escape(t.amount)+'<input name="amount" type="number" step="0.01" min="0.01" required></label>'+
     '<label>'+escape(t.currency)+'<select name="currency" required>'+opts(currencies,currentCurrency)+'</select></label>'+
     '<label>'+escape(t.issue)+'<input name="issue_date" type="date" value="'+escape(today)+'" required></label>'+
     '<label>'+escape(t.due)+'<input name="due_date" type="date" value="'+escape(today)+'" required></label>'+
     '<button class="btn primary" type="submit"'+(offline||blocked||!serverReady?' disabled':'')+'>'+escape(t.save)+'</button>'+
     '</form></details><div class="zavi-cheque-list">'+(cards||'<p>'+escape(t.empty)+'</p>')+'</div>'+
     '<div class="zavi-cheque-queue"><strong>'+escape(t.queue)+': '+q.length+'</strong>'+
     (q.length?'<button class="btn subtle" type="button" data-cheque-action="retry">'+escape(t.retry)+'</button>':'')+
     (q.length?'<p>'+escape(t.queued)+'</p>':'')+'</div>';
  }
  async function api(path,body,method='POST',prefer=''){
   const before=scope();if(!owner(before))throw Error(tr().notOwner);
   const session=await w.zaviCloudRefreshAuthSession?.()||w.zaviCloudGetAuthSession?.();
   if(!session?.access_token||session.user?.id!==before.uid||scope().key!==before.key)throw Error('OWNER_SESSION_CHANGED');
   const cfg=w.zaviCloudGetPublicConfig?.();
   if(!cfg?.url||!cfg?.key||!/^https:\/\//.test(cfg.url))throw Error('CLOUD_CONFIG_UNAVAILABLE');
   const abort=new AbortController();const timeout=w.setTimeout(()=>abort.abort(),16000);
   try{
    const r=await w.fetch(cfg.url.replace(/\/$/,'')+'/rest/v1/'+path,{
      method,cache:'no-store',headers:{apikey:cfg.key,Authorization:'Bearer '+session.access_token,
       'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},
      body:body===null?undefined:JSON.stringify(body),signal:abort.signal
    });
    const data=await r.json().catch(()=>null);
    if(!r.ok){const err=new Error(data?.message||data?.error||'HTTP '+r.status);
      err.status=r.status;throw err}
    return data;
   }finally{w.clearTimeout(timeout)}
  }
  async function refresh(){
   const s=scope();if(busy||!owner(s)||w.navigator.onLine===false)return;
   busy=true;setMessage(tr().wait);
   try{
    const data=await api('zavi_cheques?select=id,workspace_id,direction,cheque_number,bank_name,counterparty_id,currency,amount,settled_amount,status,due_date,created_at&workspace_id=eq.'+
      encodeURIComponent(s.workspace)+'&order=created_at.desc&limit=150',null,'GET');
    if(scope().key!==s.key)return;
    rows=Array.isArray(data)?data:[];serverReady=true;lastLoaded=Date.now();setMessage('');render();
   }catch(e){if(scope().key===s.key){serverReady=false;setMessage(e.status===400||e.status===404?tr().unready:e.message);render()}}
   finally{busy=false}
  }
  async function register(form){
   const s=scope();
   if(!owner(s)||s.pending||s.conflict||w.navigator.onLine===false)throw Error(tr().blocked);
   if(!serverReady)throw Error(tr().unready);
   const f=new FormData(form);
   const proposed=validateRegistration({
    workspace:s.workspace,direction:String(f.get('direction')||''),
    cheque_number:String(f.get('cheque_number')||'').trim(),
    bank_name:String(f.get('bank_name')||'').trim(),
    counterparty_id:String(f.get('counterparty_id')||''),
    amount:String(f.get('amount')||''),
    currency:String(f.get('currency')||'').toUpperCase(),
    issue_date:String(f.get('issue_date')||''),due_date:String(f.get('due_date')||'')
   });
   // Server status is deliberately pending. Registration does NOT move cash.
   await api('zavi_cheques',Object.assign({},proposed,{workspace_id:proposed.workspace,
     workspace:undefined}), 'POST','return=representation');
   if(scope().key===s.key){setMessage(tr().done);await refresh()}
  }
  function newIntent(row,kind,form){
   const s=scope(),t=tr();
   if(!owner(s))throw Error(t.notOwner);
   if(!validUuid(row?.id)||!['deposit','settle','bounce','cancel'].includes(kind))throw Error('INVALID_SELECTION');
   const id=w.crypto?.randomUUID?.();if(!validUuid(id))throw Error('SECURE_OPERATION_ID_UNAVAILABLE');
   let amount=null,account=null,rate=null;
   if(kind==='settle'){
    amount=String(form?.querySelector('[name="amount"]')?.value||'');
    account=String(form?.querySelector('[name="account"]')?.value||'');
    const fx=form?.querySelector('[name="rate"]');
    rate=fx?String(fx.value||''):null;
   }
   return validateOperation({id,uid:s.uid,workspace:s.workspace,cheque:row.id,
    kind,amount,account,rate,created_at:new Date().toISOString()});
  }
  async function enqueue(row,kind,form){
   const s=scope(),q=pendingRows(s);if(q.length>=100)throw Error('QUEUE_CAPACITY_EXCEEDED');
   const intent=newIntent(row,kind,form);
   if(q.some(x=>x.cheque===intent.cheque))throw Error('CHEQUE_ALREADY_QUEUED');
   if(!w.confirm(tr().confirm))return;
   saveQueue(w.localStorage,s.uid,s.workspace,[...q,intent]);
   setMessage(tr().queued);render();
   if(w.navigator.onLine!==false)await flush();
  }
  async function flush(){
   const s=scope();
   if(queueBusy||!owner(s)||w.navigator.onLine===false||s.pending||s.conflict)return;
   const queue=pendingRows(s);if(!queue.length)return;
   queueBusy=true;setMessage(tr().wait);
   let confirmedRevision=0,stoppedOnError=false;
   try{
    for(const intent of queue){
     if(scope().key!==s.key||scope().pending||scope().conflict||w.navigator.onLine===false)break;
     try{
      const args={p_workspace:intent.workspace,p_cheque:intent.cheque,p_operation:intent.id,
       p_kind:intent.kind,p_amount:intent.amount===null?null:Number(intent.amount),
       p_account:intent.account,p_exchange_rate:intent.rate===null?null:Number(intent.rate)};
      const response=await api('rpc/zavi_stage4_cheque_apply',args);
      if(!response||response.ok!==true||response.operation_id!==intent.id)throw Error('SERVER_CONFIRMATION_MISMATCH');
      // Remove ONLY the server-confirmed idempotent intent.
      const left=pendingRows(s).filter(x=>x.id!==intent.id);
      saveQueue(w.localStorage,s.uid,s.workspace,left);
      confirmedRevision=Math.max(confirmedRevision,Number(response.ledger_revision)||0);
      if(scope().key===s.key){
       setMessage(tr().done);
       w.dispatchEvent(new CustomEvent('zavi-cheque-settlement-confirmed',{detail:{
         workspace_id:s.workspace,operation_id:intent.id,revision:response.ledger_revision}}));
      }
     }catch(e){
      if(scope().key===s.key)setMessage(e.status===404||/PGRST202/.test(e.message)?
        tr().unready:tr().failed+' '+e.message);
      stoppedOnError=true;
      break; // Keep original operation UUID for safe retry, even if ACK was lost.
     }
    }
    if(scope().key===s.key&&w.navigator.onLine!==false){
     if(confirmedRevision){
      try{await w.zaviCloudReconcileServer?.(confirmedRevision)}
      catch(_){setMessage('SERVER_LEDGER_RECONCILIATION_PENDING')}
     }
     // A failed or ambiguous ACK must remain visible to the owner. An
     // automatic background reload must not erase the rejection message.
     if(!stoppedOnError)await refresh();
    }
   }finally{queueBusy=false;if(scope().key===s.key)render()}
  }
  function attach(data){
   context=data;
   const s=scope();const host=w.document.getElementById('content');
   if(!host)return;
   let node=el();
   if(!node){node=w.document.createElement('section');node.id='zaviStage4Cheques';
     node.className='card zavi-cheque-module';host.append(node)}
   if(lastScope!==s.key){rows=[];serverReady=false;lastScope=s.key;lastError='';lastLoaded=0}
   render();
   if(owner(s)&&w.navigator.onLine!==false&&Date.now()-lastLoaded>60000)
    void refresh();
  }
  w.document.addEventListener('submit',e=>{
   const form=e.target.closest('[data-cheque-register]');if(!form)return;
   e.preventDefault();if(busy||queueBusy||registering)return;
   registering=true; // Prevent repeated registrations on double-click.
   register(form).catch(err=>setMessage(err.message)).finally(()=>{registering=false;render()});
  });
  w.document.addEventListener('click',e=>{
   const btn=e.target.closest('[data-cheque-action]');if(!btn||!btn.closest('#zaviStage4Cheques'))return;
   const action=btn.dataset.chequeAction;
   if(action==='refresh'){void refresh();return}
   if(action==='retry'){void flush();return}
   const row=rows.find(x=>x.id===btn.dataset.id&&x.workspace_id===scope().workspace);
   if(!row)return;
   if(action==='settle'){const form=el()?.querySelector('[data-cheque-settle="'+row.id+'"]');
     if(form)form.hidden=!form.hidden;return}
   if(action==='confirm-settle'){
    const form=el()?.querySelector('[data-cheque-settle="'+row.id+'"]');
    void enqueue(row,'settle',form).catch(err=>setMessage(err.message));return;
   }
   if(['deposit','cancel','bounce'].includes(action)){
    void enqueue(row,action,null).catch(err=>setMessage(err.message));
   }
  });
  w.addEventListener('online',()=>w.setTimeout(()=>flush().catch(()=>{}),1800));
  w.addEventListener('zavi-cloud-sync-confirmed',()=>w.setTimeout(()=>flush().catch(()=>{}),650));
  w.addEventListener('zavi-cloud-workspace-selected',()=>{rows=[];serverReady=false;lastScope='';lastError=''});
  w.addEventListener('zavi-cloud-logged-out',()=>{rows=[];serverReady=false;lastScope='';lastError=''});
  w.setInterval(()=>{if(el()&&w.navigator.onLine!==false)void flush().catch(()=>{})},45000);
  w.ZaviChequeStage4=Object.freeze({mount:attach,refresh,flush});
  // Original V66.62 uses the historic go()/render() path, not the discarded
  // PDF navigation bridge. Add the cheques module ONLY when Money is visible.
  // This does not change the original HTML/CSS, financial ledger or RPC rules.
  function legacyState(){
   try{
    const current=typeof db!=='undefined'&&db?db:null;
    return {
     workspace:w.zaviCloudRestoreInfo?.()?.workspace||'',
     contacts:Array.isArray(current?.contacts)?current.contacts:[],
     accounts:Array.isArray(current?.accounts)?current.accounts:[],
     currency:typeof current?.currency==='string'?current.currency:'AFN'
    };
   }catch(_){return {workspace:'',contacts:[],accounts:[],currency:'AFN'}}
  }
  function reconcileLegacyMoney(){
   const host=w.document.getElementById('content');
   if(!host||w.document.documentElement.classList.contains('zawi-locked'))return;
   let currentPage='';
   try{currentPage=typeof page==='string'?page:''}catch(_){}
   if(currentPage!=='money')return;
   if(host.querySelector(':scope > #zaviStage4Cheques'))return;
   attach(legacyState());
  }
  function watchLegacyMoney(){
   const host=w.document.getElementById('content');
   if(!host)return;
   let scheduled=false;
   const queue=()=>{
    if(scheduled)return;scheduled=true;
    w.queueMicrotask(()=>{scheduled=false;reconcileLegacyMoney()});
   };
   new w.MutationObserver(queue).observe(host,{childList:true,subtree:false});
   w.document.addEventListener('zavi:page-rendered',queue);
   queue();
  }
  if(w.document.readyState==='loading')
   w.document.addEventListener('DOMContentLoaded',watchLegacyMoney,{once:true});
  else watchLegacyMoney();
 }
 return Object.freeze({mount,validateRegistration,validateOperation,queueKey,safeQueue,saveQueue});
});

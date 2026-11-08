/* ZAVI ONE warehouse transfer. Server-only, owner-only, exactly-once retries.
 * Does not touch existing invoices, customers, ledger or local product quantities.
 * RPC remains unavailable until reviewed staged database migrations are deployed.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.ZaviWarehouseTransfersV1=api;
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const utf={
  fa:{title:'انتقال کالا بین گدام‌ها',source:'گدام مبدأ',dest:'گدام مقصد',product:'کالا',qty:'تعداد',reference:'یادداشت (اختیاری)',post:'ثبت انتقال در سرور',wait:'در حال ثبت در سرور…',done:'انتقال در سرور تأیید شد.',unsafe:'نتیجه انتقال هنوز قطعی نیست. برای جلوگیری از ثبت دوباره، همان عملیات را دوباره بررسی کنید.',retry:'بررسی و تلاش دوباره',disabled:'انتقال کالا پس از نصب و آزمون محافظ موجودی در سرور فعال می‌شود.',need:'برای انتقال، دو گدام فعال و یک کالا لازم است.',only:'این بخش فقط برای مالک حساب ابری فعال است.',invalid:'معلومات انتقال نامعتبر است.',offline:'برای انتقال باید اینترنت فعال باشد. انتقال بدون تأیید سرور ثبت نمی‌شود.',saving:'تأیید سرور لازم است؛ موجودی فعلاً تغییر نکرد.',conflict:'موجودی مبدأ کافی نیست یا انتقال مجاز نیست.',readonly:'فاکتورهای قدیمی و موجودی حسابداری تغییر داده نمی‌شوند.'},
  ps:{title:'د ګدامونو ترمنځ د توکو لېږد',source:'لومړی ګدام',dest:'دویم ګدام',product:'توکی',qty:'اندازه',reference:'یادښت (اختیاري)',post:'په سرور کې ثبتول',wait:'په سرور کې ثبتېږي…',done:'لېږد په سرور کې تایید شو.',unsafe:'د لېږد پایله لا تایید نه ده؛ هماغه عملیات بیا وګورئ.',retry:'بیا کتل او هڅه کول',disabled:'لېږد د سرور له تایید او ازموینې وروسته فعالیږي.',need:'دوه فعال ګدامونه او یو توکی پکار دي.',only:'یوازې د کلاوډ مالک اجازه لري.',invalid:'ناسم معلومات.',offline:'انټرنیټ ته اړتیا ده. بې له تایید څخه لېږد نه ثبتېږي.',saving:'تر سرور تایید پورې موجودي نه بدلېږي.',conflict:'کافي موجودي نشته یا لېږد مجاز نه دی.',readonly:'پخواني رسیدونه نه بدلېږي.'},
  en:{title:'Transfer stock between warehouses',source:'Source warehouse',dest:'Destination warehouse',product:'Product',qty:'Quantity',reference:'Reference (optional)',post:'Post transfer on server',wait:'Waiting for server…',done:'Server confirmed the transfer.',unsafe:'Outcome is not confirmed. Retry the SAME operation, never create a duplicate.',retry:'Verify and retry',disabled:'Transfers require the tested server stock guard and RPC.',need:'Two active warehouses and a product are required.',only:'Cloud owner access only.',invalid:'Invalid transfer details.',offline:'Internet required. No transfer is recorded without server confirmation.',saving:'Existing invoices and stock are unchanged until server confirmation.',conflict:'Insufficient source stock or unauthorized transfer.',readonly:'Existing invoices and accounting balances are not modified.'}
 };
 const L=()=>{let language=String(root?.document?.documentElement?.lang||'fa-AF').toLowerCase();return utf[language.startsWith('ps')?'ps':language.startsWith('en')?'en':'fa']};
 const numeric=value=>String(value??'').trim().replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace('٫','.');
 function quantity(value){
  let s=numeric(value);
  if(!/^(?:0|[1-9][0-9]{0,11})(?:\.[0-9]{1,4})?$/.test(s))throw Error('INVALID_QUANTITY');
  if(s.replace(/[.0]/g,'').length===0)throw Error('INVALID_QUANTITY');
  return s;
 }
 function operation(data){
  if(!data||!/^[0-9a-f-]{36}$/i.test(data.id||'')||!data.workspace_id||!data.from_warehouse_id||!data.to_warehouse_id||!data.product_ref||data.from_warehouse_id===data.to_warehouse_id)throw Error('INVALID_TRANSFER');
  return Object.freeze({...data,p_quantity:quantity(data.p_quantity)});
 }
 function matches(item,row){
  if(!row||row.id!==item.id||row.workspace_id!==item.workspace_id||
     row.from_warehouse_id!==item.from_warehouse_id||row.to_warehouse_id!==item.to_warehouse_id||
     row.product_ref!==item.product_ref||String(row.reference||'')!==String(item.reference||''))return false;
  const units=value=>{const [whole,part='']=quantity(value).split('.');return BigInt(whole)*10000n+BigInt(part.padEnd(4,'0'))};
  try{return units(row.quantity)===units(item.p_quantity)}catch{return false}
 }
 function sameIdentity(a,b){return !!a&&!!b&&a.user===b.user&&a.workspace===b.workspace&&a.url===b.url&&a.key===b.key}
 function identity(){
  const info=root?.zaviCloudRestoreInfo?.(),session=root?.zaviCloudGetAuthSession?.(),cfg=root?.zaviCloudGetPublicConfig?.();
  if(info?.role!=='owner'||!info.workspace||!session?.user?.id||!cfg?.url||!/^https:\/\/[a-z0-9.-]+$/i.test(cfg.url)||!cfg.key)return null;
  if(typeof root.zaviCloudCanEdit==='function'&&!root.zaviCloudCanEdit())return null;
  return {workspace:info.workspace,user:session.user.id,url:cfg.url,key:cfg.key};
 }
 const key=x=>'zavi_pending_transfer_v1_'+x.user+'_'+x.workspace;
 function pending(x){
  try{const v=JSON.parse(root.localStorage.getItem(key(x))||'null');return v&&v.workspace_id===x.workspace?operation(v):null}catch{return null}
 }
 function clear(x){root.localStorage.removeItem(key(x));}
 function persist(x,item){
  const str=JSON.stringify(operation(item));root.localStorage.setItem(key(x),str);
  if(root.localStorage.getItem(key(x))!==str)throw Error('PENDING_OPERATION_NOT_DURABLE');
 }
 function products(){
  try{
   const dbLocal=typeof db!=='undefined'?db:root?.zaviWarehouseData;
   return Array.isArray(dbLocal?.products)?dbLocal.products.filter(p=>p&&typeof p.id==='string'&&p.id.length<=160).map(p=>({id:p.id,name:String(p.name||p.id).slice(0,100)})):[];
  }catch{return []}
 }
 const el=(tag,klass,t)=>{const n=root.document.createElement(tag);if(klass)n.className=klass;if(t!==undefined)n.textContent=t;return n};
 function selectField(title,name,options){
  const label=el('label','',title),select=el('select','');select.name=name;select.required=true;select.setAttribute('aria-label',title);
  for(const option of options){const node=el('option','',option.label);node.value=option.value;select.appendChild(node)}
  label.appendChild(select);return label;
 }
 function status(node,text){if(node){const n=node.querySelector('[data-zv-transfer-status]');if(n)n.textContent=text}}
 function paint(box,warehouses){
  const host=box?.querySelector('.zv-wh-transfer');if(!host)return;
  const id=identity(),t=L();host.replaceChildren();
  const h=el('h4','',t.title);host.appendChild(h);
  if(!id){host.appendChild(el('p','zv-wh-note',t.only));return}
  const last=pending(id);
  if(last){
   host.appendChild(el('p','zv-wh-note',t.unsafe));
   const summary=el('p','',last.product_ref+' · '+last.p_quantity);
   const button=el('button','btn subtle',t.retry);button.type='button';button.dataset.zvRetryTransfer='1';
   host.append(summary,button,el('p','zv-wh-transfer-status',''));host.lastElementChild.dataset.zvTransferStatus='';
   return;
  }
  const active=Array.isArray(warehouses)?warehouses.filter(w=>w.is_active&&w.workspace_id===id.workspace):[];
  const items=products();
  if(active.length<2||!items.length){host.appendChild(el('p','zv-wh-note',t.need));return}
  const form=el('form','zv-wh-transfer-form');form.setAttribute('data-zv-transfer-form','');
  const wh=active.map(w=>({value:w.id,label:w.name+' · '+w.code}));
  const p=items.map(x=>({value:x.id,label:x.name}));
  form.append(selectField(t.source,'from',wh),selectField(t.dest,'to',wh),selectField(t.product,'product',p));
  const qty=el('input','');qty.name='quantity';qty.setAttribute('inputmode','decimal');qty.required=true;qty.setAttribute('aria-label',t.qty);qty.placeholder='0.0000';
  const qtyLabel=el('label','',t.qty);qtyLabel.appendChild(qty);
  const reference=el('input','');reference.name='reference';reference.maxLength=150;reference.setAttribute('aria-label',t.reference);
  const referenceLabel=el('label','',t.reference);referenceLabel.appendChild(reference);
  const submit=el('button','btn primary',t.post);submit.type='submit';
  form.append(qtyLabel,referenceLabel,submit);
  host.append(form,el('p','zv-wh-note',t.readonly));
  const stat=el('p','zv-wh-transfer-status','');stat.dataset.zvTransferStatus='';stat.setAttribute('role','status');host.appendChild(stat);
  const dest=form.elements.to;
  if(active.length>1)dest.selectedIndex=1;
 }
 function mount(box,warehouses){paint(box,warehouses)}
 let sending=false;
 async function call(x,path,method,data){
  const latest=identity();
  if(!sameIdentity(latest,x))throw Error('SESSION_CHANGED');
  const auth=await root.zaviCloudRefreshAuthSession?.();
  if(!auth?.access_token||!sameIdentity(identity(),x))throw Error('SESSION_CHANGED');
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),16000);
  try{
   const response=await root.fetch(x.url+path,{method,headers:{apikey:x.key,Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined,signal:ctrl.signal});
   const json=await response.json().catch(()=>null);
   if(!sameIdentity(identity(),x))throw Error('SESSION_CHANGED');
   if(!response.ok){const error=new Error(String(json?.message||json?.error||'HTTP '+response.status));error.code=response.status;error.missingRpc=path==='/rest/v1/rpc/zavi_warehouse_post_movement'&&(response.status===404||json?.code==='PGRST202');throw error}
   return json;
  }finally{clearTimeout(timer)}
 }
 async function reconcile(x,item){
  const path='/rest/v1/zavi_warehouse_movements?select=id,workspace_id,from_warehouse_id,to_warehouse_id,product_ref,quantity,reference&workspace_id=eq.'+encodeURIComponent(x.workspace)+'&id=eq.'+encodeURIComponent(item.id)+'&limit=1';
  const found=await call(x,path,'GET');
  if(!Array.isArray(found))throw Error('INVALID_SERVER_RESPONSE');
  if(!found.length)return false;
  if(found.length!==1||!matches(item,found[0]))throw Error('TRANSFER_CONTENT_MISMATCH');
  return true
 }
 async function submit(box,item,x){
  if(sending)return;sending=true;const host=box.querySelector('.zv-wh-transfer'),t=L();
  host?.querySelectorAll('input,select,button').forEach(n=>n.disabled=true);status(host,t.wait);
  try{
   if(root.navigator?.onLine===false){status(host,t.offline);return}
   if(await reconcile(x,item)){clear(x);status(host,t.done);await root.ZaviWarehouseV1?.refresh(box);return}
   const result=await call(x,'/rest/v1/rpc/zavi_warehouse_post_movement','POST',{
    p_operation_id:item.id,p_workspace_id:item.workspace_id,p_from_warehouse_id:item.from_warehouse_id,
    p_to_warehouse_id:item.to_warehouse_id,p_product_ref:item.product_ref,
    p_quantity:item.p_quantity,p_reference:item.reference||null
   });
   if(result!==item.id)throw Error('SERVER_CONFIRMATION_MISMATCH');
   clear(x);status(host,t.done);await root.ZaviWarehouseV1?.refresh(box);
  }catch(e){
   if(e.missingRpc){// Function is definitely missing, no transfer was made.
    clear(x);status(host,t.disabled);
   }else status(host,t.unsafe+' ('+String(e.message||'').slice(0,140)+')');
  }finally{
   sending=false;
   host?.querySelectorAll('input,select,button').forEach(n=>n.disabled=false);
   // Do not create a new transfer if an uncertain pending operation remains.
   if(!sameIdentity(identity(),x))paint(box,[]);
   else if(pending(x))paint(box,[]);
  }
 }
 if(root?.document){
  root.document.addEventListener('submit',event=>{
   const f=event.target;if(!f.matches?.('[data-zv-transfer-form]'))return;
   event.preventDefault();event.stopPropagation();
   const box=f.closest('#zaviWarehouseManagerV1'),id=identity();if(!box||!id)return;
   try{
    if(pending(id)){status(box.querySelector('.zv-wh-transfer'),L().unsafe);return}
    const sources=[...box.querySelectorAll('.zv-wh-row [data-wh-toggle]')].map(n=>n.dataset.whToggle);
    const from=f.elements.from.value,to=f.elements.to.value,product=f.elements.product.value;
    if(!sources.includes(from)||!sources.includes(to)||!products().some(p=>p.id===product)||from===to)throw Error('INVALID_TRANSFER');
    const item=operation({id:root.crypto.randomUUID(),workspace_id:id.workspace,from_warehouse_id:from,to_warehouse_id:to,product_ref:product,p_quantity:f.elements.quantity.value,reference:f.elements.reference.value.trim().slice(0,150)});
    persist(id,item);void submit(box,item,id);
   }catch(e){status(box.querySelector('.zv-wh-transfer'),L().invalid+' '+String(e.message||''))}
  });
  root.document.addEventListener('click',e=>{
   if(!e.target.closest?.('[data-zv-retry-transfer]'))return;
   const box=e.target.closest('#zaviWarehouseManagerV1'),id=identity();if(!box||!id)return;
   const item=pending(id);if(item)void submit(box,item,id);
  });
 }
 return Object.freeze({quantity,operation,matches,mount,pending});
});

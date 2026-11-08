/* ZAVI ONE V47 — offline-safe general business settings.
 * Owner-scoped queues; never insert anonymous cloud rows. Idempotent batch/service
 * IDs prevent duplicate server inserts after a lost response. No service_role key.
 */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // The standalone business-settings page must use the SAME user-selected
 // public سرور مرکزی project as cloud.js. Never silently write to a default
 // server after the owner switched their workspace to another backend.
 let selected=null;try{selected=JSON.parse(localStorage.getItem('z20_cloud_settings')||'null')}catch(_){}
 const config=(selected?.url&&selected?.key)?selected:(window.ZAVI_CLOUD_DEFAULTS||{});
 if(/service_role|sb_secret_/i.test(config.key||''))throw Error('Secret API keys are not permitted in this browser');

 const names={sales:'فروش',purchases:'خرید',products:'محصولات و گدام',contacts:'مشتریان',debtors:'قرضداری',expenses:'مصارف',reports:'گزارش‌ها',journal:'روزنامچه',pharmacy:'دواخانه',services:'خدمات',barcode:'بارکد',employees:'کارمندان',payroll:'معاشات',banking:'حساب‌های بانکی',multi_warehouse:'چند گدام',batch_tracking:'مدیریت بچ',expiry_tracking:'تاریخ انقضا',tax:'مالیات',orders:'سفارشات'};
 let session=null,uid='',ws='',current={},batchRows=[],serviceRows=[],busy=false,flushing=false;
 const draftKey=()=>`zavi_v47_business_draft_${uid}_${ws}`;
 const snapshotKey=()=>`zavi_v47_business_snapshot_${uid}_${ws}`;
 const queueKey=()=>`zavi_v47_business_queue_${uid}_${ws}`;
 // V45 caches are accepted when upgrading; they must belong to the same owner/workspace.
 const oldDraftKey=()=>`zavi_v45_business_draft_${uid}_${ws}`;
 const oldSnapshotKey=()=>`zavi_v45_business_snapshot_${uid}_${ws}`;
 function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}}
 function save(k,v){localStorage.setItem(k,JSON.stringify(v))} // fail loudly on quota errors
 function msg(t,bad=false){$('status').textContent=t;$('status').className='status '+(bad?'bad':'good')}
 function identity(){
  session=read('z20_auth_session_persistent_v23_1')||read('z20_auth_session');
  try{session=session||JSON.parse(sessionStorage.getItem('z20_auth_session')||'null')}catch(_){}
  ws=read('z20_workspace_id')||'';uid=session?.user?.id||'';
  return !!(session?.access_token&&uid&&ws&&/^https:\/\//.test(config.url||'')&&config.key);
 }
 // ISO currency codes are stable identifiers. Never send translated option text to PostgREST.
 const isIsoCurrency=v=>/^[A-Z]{3}$/.test(String(v||''));
 const validatedCurrency=v=>{const code=String(v||'').trim().toUpperCase();if(!isIsoCurrency(code))throw Error('واحد پول نامعتبر است. یک کد سه‌حرفی مانند AFN یا USD انتخاب کنید و دوباره ذخیره نمایید.');return code};
 const online=()=>navigator.onLine!==false;
 function owner(){const item=read('z20_workspace_offline_metadata_v31_'+ws);return !!(item&&item.owner_uid===uid&&item.id===ws&&item.user_uid===uid)}
 async function authorized(){
  if(!identity())throw Error('ابتدا فروشگاه خود را در سیستم اصلی باز کنید.');
  if(!owner())throw Error('فقط مالک این فروشگاه اجازه ثبت تنظیمات دارد.');
  // Offline editing in the ancillary management page must use the same
  // verified ES256 owner/workspace/device-bound lease as the main accounting UI.
  const lease=await window.zaviSecureOfflineLicense?.cached(ws);
  if(!lease?.claims?.can_write)throw Error('مجوز آفلاین معتبر نیست؛ هنگام اتصال وارد برنامه اصلی شوید تا اشتراک و دستگاه خودکار بررسی شود.');
}

 async function refresh(){
  if(!session?.refresh_token)throw Error('برای ادامه دوباره وارد حساب شوید.');
  const r=await fetch(config.url.replace(/\/$/,'')+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
  const result=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(result?.error_description||'نشست ورود پایان یافته است.');
  session={...session,...result,expires_at:result.expires_at||(Math.floor(Date.now()/1000)+Number(result.expires_in||3600))};
  save('z20_auth_session_persistent_v23_1',session);
  try{sessionStorage.setItem('z20_auth_session',JSON.stringify(session))}catch(_){}
 }
 async function request(table,method='GET',body=null,once=false,upsert=false){
  if(!online())throw Error('اتصال اینترنت موجود نیست.');
  if(session?.expires_at&&Date.now()/1000>Number(session.expires_at)-90)await refresh();
  const params='workspace_id=eq.'+encodeURIComponent(ws)+(upsert?'&on_conflict=id':'');
  const url=config.url.replace(/\/$/,'')+'/rest/v1/'+table+'?'+params;
  const headers={apikey:config.key,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json',Prefer:upsert?'resolution=merge-duplicates,return=representation':'return=representation'};
  const r=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined});
  if(r.status===401&&!once){await refresh();return request(table,method,body,true,upsert)}
  const result=await r.json().catch(()=>[]);
  if(!r.ok){const detail=String(result?.message||result?.hint||'');if(/zavi_v25_currency_len|currency_code.*check|check constraint.*currency/i.test(detail))throw Error('کد واحد پول معتبر نیست. واحد پول را به AFN، USD یا یک ارز سه‌حرفی استاندارد تغییر بدهید و دوباره ذخیره کنید.');throw Error(detail||`HTTP ${r.status}`)}
  return result;
 }
 function formData(){const features={...current};document.querySelectorAll('[data-key]').forEach(el=>features[el.dataset.key]=el.checked);return {
  business_type:$('type').value,display_name:$('name').value.trim()||null,locale:$('locale').value,currency_code:validatedCurrency($('currency').value),features
 }}
 const industrySettingsV638={
  general:['sales','purchases','products','contacts','reports'],supermarket:['sales','purchases','products','barcode','expiry_tracking'],
  pharmacy:['sales','purchases','products','barcode','pharmacy','batch_tracking','expiry_tracking'],
  laboratory:['services','orders','products','reports'],gold:['sales','purchases','products','reports'],
  wholesale:['sales','purchases','products','orders','multi_warehouse'],distribution:['sales','purchases','products','orders','multi_warehouse'],
  clothing:['sales','purchases','products','barcode'],footwear:['sales','purchases','products','barcode'],
  bookstore:['sales','purchases','products','barcode'],cosmetics:['sales','purchases','products','barcode','batch_tracking','expiry_tracking'],
  electronics:['sales','purchases','products','barcode'],mobile:['sales','purchases','products','barcode'],
  furniture:['sales','purchases','products','orders'],hardware:['sales','purchases','products','barcode'],
  construction:['sales','purchases','products','multi_warehouse'],exchange:['contacts','banking','reports'],contractor:['sales','purchases','orders','reports','multi_warehouse'],services:['services','orders','contacts'],
  company:['sales','purchases','products','banking','reports']
};
 function featureSearch(){const q=String($('z645FeatureSearch')?.value||'').trim().toLocaleLowerCase();document.querySelectorAll('#features .switch').forEach(el=>{el.hidden=!!q&&!el.textContent.toLocaleLowerCase().includes(q)})}
 function renderFeatures(){
  const type=$('type').value,recommended=industrySettingsV638[type]||industrySettingsV638.general;
  const entries=Object.entries(names).sort(([a],[b])=>Number(recommended.includes(b))-Number(recommended.includes(a)));
  $('features').innerHTML='<div class="z638-feature-note">پیشنهادها مخصوص تجارت انتخاب‌شده‌اند؛ هیچ تنظیم قبلی بدون ذخیره توسط مالک حذف نمی‌شود. نشان‌دادن گزینه به معنی آماده‌بودن ماژول تخصصی نیست.</div>'+
   entries.map(([k,n])=>`<label class="switch ${recommended.includes(k)?'z638-feature-recommended':''}"><input type="checkbox" data-key="${k}" ${current[k]===true||(current[k]===undefined&&recommended.includes(k))?'checked':''}>${n}${recommended.includes(k)?'<small>پیشنهادی</small>':''}</label>`).join('');featureSearch()
 }
 function renderContextV638(){
  const type=$('type').value,showAll=!!$('z638AllModules')?.checked;
  const pharmacy=showAll||['pharmacy','cosmetics'].includes(type)||current.pharmacy===true||current.batch_tracking===true||batchRows.length>0;
  const services=showAll||['services','laboratory'].includes(type)||current.services===true||serviceRows.length>0;
  const p=$('z638PharmacySection'),s=$('z638ServicesSection');if(p)p.hidden=!pharmacy;if(s)s.hidden=!services;
 }
 function renderExtras(){
  $('batches').innerHTML=batchRows.map(x=>{const days=Math.ceil((Date.parse((x.expires_on||'')+'T00:00:00Z')-Date.now())/86400000);return `<tr><td>${esc(x.product_ref)}</td><td>${esc(x.batch_number)}</td><td data-no-translate>${esc(window.ZaviDualDate?.formatBoth?.(x.expires_on+'T12:00:00Z')||x.expires_on)}</td><td>${esc(x.quantity)}</td><td style="color:${days<=0?'#b22':days<=60?'#b76a08':'#188450'}">${x._pending?'منتظر ارسال':days<=0?'منقضی':days<=60?'نزدیک انقضا':'معتبر'}</td></tr>`}).join('')||'<tr><td colspan="5">هنوز بچی ثبت نشده است</td></tr>';
  $('services').innerHTML=serviceRows.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.unit_price)}</td><td>${x._pending?'منتظر ارسال':x.is_active?'فعال':'غیرفعال'}</td></tr>`).join('')||'<tr><td colspan="3">هنوز خدمتی ثبت نشده است</td></tr>';
 }
 function pendingOps(){const stored=read(queueKey());return Array.isArray(stored)?stored.filter(x=>x?.owner_uid===uid&&x?.workspace_id===ws):[]}
 function overlays(){
  const ops=pendingOps();
  for(const op of ops){if(op.kind==='batch'&&!batchRows.some(x=>x.id===op.id))batchRows.push({...op.record,_pending:true});
   if(op.kind==='service'&&!serviceRows.some(x=>x.id===op.id))serviceRows.push({...op.record,_pending:true});}
 }
 function restore(s){if(!s)return;const savedType=String(s.business_type||'general');if(![...$('type').options].some(o=>o.value===savedType)){const custom=document.createElement('option');custom.value=savedType;custom.textContent='نوع ذخیره‌شده: '+savedType;$('type').append(custom)}$('type').value=savedType;$('name').value=s.display_name||'';$('locale').value=window.zaviPublicLanguage?.()||s.locale||'fa-AF';const restoredCurrency=String(s.currency_code||'AFN').toUpperCase();
  if(isIsoCurrency(restoredCurrency)&&![...$('currency').options].some(o=>o.value===restoredCurrency)){$('currency').add(new Option(restoredCurrency,restoredCurrency));}
  $('currency').value=isIsoCurrency(restoredCurrency)?restoredCurrency:'AFN';current=s.features||{};batchRows=[...(s.batches||[])];serviceRows=[...(s.services||[])];overlays();renderFeatures();renderExtras();renderContextV638()}
 function snapshot(){return {...formData(),batches:batchRows.filter(x=>!x._pending),services:serviceRows.filter(x=>!x._pending)}}
 function getCached(){const snap=read(snapshotKey())||read(oldSnapshotKey());return snap?.owner_uid===uid&&snap?.workspace_id===ws?snap:null}
 function getDraft(){const draft=read(draftKey())||read(oldDraftKey());return draft?.owner_uid===uid&&draft?.workspace_id===ws&&draft.pending?draft:null}
 async function stage(){await authorized();const data=snapshot();const draft={owner_uid:uid,workspace_id:ws,pending:true,updated_at:new Date().toISOString(),data};save(draftKey(),draft);save('zavi_v638_business_type_'+uid+'_'+ws,String(data.business_type||'general'));return data}
 async function upsert(table,record){const existing=await request(table);return existing.length?request(table,'PATCH',record):request(table,'POST',{workspace_id:ws,...record})}
 async function flushProfile(){
  const draft=getDraft();if(!draft)return;
  await upsert('zavi_v25_business_profiles',{business_type:draft.data.business_type,display_name:draft.data.display_name,locale:draft.data.locale,currency_code:validatedCurrency(draft.data.currency_code)});
  await upsert('zavi_v25_feature_settings',{features:draft.data.features});
  save(draftKey(),{...draft,pending:false});
  // remove old draft to avoid an old V45 pending snapshot reappearing
  try{localStorage.removeItem(oldDraftKey())}catch(_){}
 }
 async function flushQueue(){
  if(flushing||!online())return;
  flushing=true;
  try{
   for(const op of pendingOps()){
    if(!identity()||op.owner_uid!==uid||op.workspace_id!==ws||!owner())throw Error('حساب تغییر کرده یا مالک تأیید نشده است.');
    const table=op.kind==='batch'?'zavi_v25_pharmacy_batches':op.kind==='service'?'zavi_v25_services':null;
    if(!table)throw Error('عملیات آفلاین شناسایی نشد.');
    // idempotent upsert with a stable UUID: on retry no duplicate batch/service
    await request(table,'POST',{...op.record,workspace_id:ws,id:op.id},false,true);
    const rest=pendingOps().filter(x=>x.id!==op.id);
    save(queueKey(),rest);
   }
  }finally{flushing=false}
 }
 async function appendLocal(kind,record){
  await authorized();
  const id=crypto.randomUUID();const op={id,kind,record:{...record,id,workspace_id:ws},owner_uid:uid,workspace_id:ws,queued_at:new Date().toISOString()};
  const all=pendingOps();save(queueKey(),[...all,op]); // must persist before claiming success
  if(kind==='batch')batchRows.push({...op.record,_pending:true});else serviceRows.push({...op.record,_pending:true});
  renderExtras();renderContextV638();msg('✅ در دستگاه محفوظ شد؛ پس از وصل‌شدن اینترنت، خودکار ارسال می‌شود.');
  if(online())setTimeout(()=>load(),150);
 }
 async function load(){if(busy)return;busy=true;
  try{
   if(!identity())throw Error('ابتدا از سیستم اصلی وارد حساب و فروشگاه شوید.');
   if(!owner())throw Error('تنظیمات عمومی فقط برای مالک فروشگاه باز است.');
   const cached=getCached(),draft=getDraft();
   if(cached)restore(cached.data);
   if(draft)restore({...cached?.data,...draft.data});
   // First-time business setup may have queued operations but no cloud snapshot yet.
   overlays();renderExtras();
   if(!online()){msg('📴 تنظیمات محلی محفوظ است؛ ارسال پس از اتصال انجام می‌شود.');return;}
   try{
    await flushProfile();await flushQueue();
    const [p,f,b,s]=await Promise.all([request('zavi_v25_business_profiles'),request('zavi_v25_feature_settings'),request('zavi_v25_pharmacy_batches'),request('zavi_v25_services')]);
    const data={business_type:p[0]?.business_type||'general',display_name:p[0]?.display_name||'',locale:p[0]?.locale||'fa-AF',currency_code:p[0]?.currency_code||'AFN',features:f[0]?.features||{},batches:b,services:s};
    save(snapshotKey(),{owner_uid:uid,workspace_id:ws,data});save('zavi_v638_business_type_'+uid+'_'+ws,String(data.business_type||'general'));restore(data);
    msg(pendingOps().length?'چند مورد هنوز در صف ارسال است.':'✅ تنظیمات آماده است.');
   }catch(e){
    msg('اتصال موقتاً برقرار نیست؛ معلومات ذخیره‌شده محفوظ است. '+(e?.message||''),true);
   }
  }catch(e){msg('مدیریت عمومی: '+(e?.message||e),true)}finally{busy=false}
 }
 async function saveSettings(){try{await stage();msg('✅ تنظیمات در دستگاه محفوظ شد.');if(online())await load()}catch(e){msg('ذخیره تنظیمات ناموفق بود: '+(e?.message||e),true)}}
 $('z645FeatureSearch')?.addEventListener('input',featureSearch);
 $('z645Recommended')?.addEventListener('click',()=>{
  if(!owner()){msg('فقط مالک می‌تواند امکانات را تغییر دهد.',true);return}
  const recommended=new Set(industrySettingsV638[$('type').value]||industrySettingsV638.general);
  document.querySelectorAll('#features [data-key]').forEach(el=>{el.checked=recommended.has(el.dataset.key)});
  msg('پیشنهادها انتخاب شدند؛ برای ذخیره، دکمه «ذخیره بخش‌های انتخابی» را بزنید. هیچ معلوماتی حذف نشده است.');
 });
 $('z645ResetDraft')?.addEventListener('click',()=>{
  const saved=getCached()?.data||{};current={...(saved.features||{})};renderFeatures();msg('انتخاب‌ها به آخرین تنظیمات تأییدشده برگشتند.');
 });
 $('type').onchange=()=>{renderFeatures();renderContextV638()};$('z638AllModules').onchange=renderContextV638;$('reload').onclick=load;
 $('saveProfile').onclick=saveSettings;$('saveFeatures').onclick=saveSettings;
 $('saveBatch').onclick=async()=>{try{
  const product_ref=$('product').value.trim(),batch_number=$('batch').value.trim(),expires_on=$('expiry').value;
  if(!product_ref||!batch_number||!expires_on)throw Error('کد محصول، شماره بچ و تاریخ انقضا ضروری است.');
  const quantity=Number($('qty').value);if(!Number.isFinite(quantity)||quantity<0)throw Error('تعداد معتبر وارد کنید.');
  await appendLocal('batch',{product_ref,batch_number,expires_on,quantity,purchase_price:$('buy').value===''?null:Number($('buy').value),sale_price:$('sell').value===''?null:Number($('sell').value)});
  $('product').value='';$('batch').value='';
 }catch(e){msg(e.message||String(e),true)}};
 $('saveService').onclick=async()=>{try{
  const name=$('serviceName').value.trim(),unit_price=Number($('servicePrice').value||0);
  if(!name)throw Error('نام خدمت ضروری است.');if(!Number.isFinite(unit_price)||unit_price<0)throw Error('قیمت خدمت معتبر نیست.');
  await appendLocal('service',{name,unit_price,currency_code:validatedCurrency($('currency').value),is_active:true});$('serviceName').value='';
 }catch(e){msg(e.message||String(e),true)}};
 window.zaviCloudGetAuthSession=()=>session;window.zaviCloudRestoreInfo=()=>({workspace:ws,role:owner()?'owner':'viewer'});
 renderFeatures();renderExtras();load();
 window.addEventListener('online',()=>setTimeout(load,1000));
 window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&online())setTimeout(load,650)});
})();

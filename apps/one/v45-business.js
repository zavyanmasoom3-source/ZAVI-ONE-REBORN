/* ZAVI ONE V45 — business settings with scoped local drafts + سرور مرکزی JWT refresh.
   Offline drafts never bypass server RLS; never alter sale/ledger permissions. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const config=window.ZAVI_CLOUD_DEFAULTS||{};
 const names={sales:'فروش',purchases:'خرید',products:'محصولات و گدام',contacts:'مشتریان',debtors:'قرضداری',expenses:'مصارف',reports:'گزارش‌ها',journal:'روزنامچه',pharmacy:'دواخانه',services:'خدمات',barcode:'بارکد',employees:'کارمندان',payroll:'معاشات',banking:'حساب‌های بانکی',multi_warehouse:'چند گدام',batch_tracking:'مدیریت بچ',expiry_tracking:'تاریخ انقضا',tax:'مالیات',orders:'سفارشات'};
 let session=null,uid='',ws='',current={},batchRows=[],serviceRows=[],busy=false;
 const draftKey=()=>`zavi_v45_business_draft_${uid}_${ws}`;
 const snapshotKey=()=>`zavi_v45_business_snapshot_${uid}_${ws}`;
 function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}}
 function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
 function msg(t,bad=false){$('status').textContent=t;$('status').className='status '+(bad?'bad':'good')}
 function identity(){
  session=read('z20_auth_session_persistent_v23_1')||read('z20_auth_session');
  try{session=session||JSON.parse(sessionStorage.getItem('z20_auth_session')||'null')}catch(_){}
  ws=read('z20_workspace_id')||'';uid=session?.user?.id||'';
  return !!(session?.access_token&&uid&&ws&&/^https:\/\//.test(config.url||'')&&config.key);
 }
 const online=()=>navigator.onLine!==false;
 async function refresh(){
  if(!session?.refresh_token)throw Error('برای ادامه دوباره وارد حساب شوید.');
  const r=await fetch(config.url.replace(/\/$/,'')+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
  const result=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(result?.error_description||'نشست ورود پایان یافته است.');
  session={...session,...result,expires_at:result.expires_at||(Math.floor(Date.now()/1000)+Number(result.expires_in||3600))};
  save('z20_auth_session_persistent_v23_1',session);
  try{sessionStorage.setItem('z20_auth_session',JSON.stringify(session))}catch(_){}
 }
 async function request(table,method='GET',body=null,once=false){
  if(!online())throw Error('offline');
  if(session?.expires_at && Date.now()/1000>Number(session.expires_at)-90)await refresh();
  const url=config.url.replace(/\/$/,'')+'/rest/v1/'+table+'?workspace_id=eq.'+encodeURIComponent(ws);
  const headers={'apikey':config.key,'Authorization':'Bearer '+session.access_token,'Content-Type':'application/json','Prefer':'return=representation'};
  const r=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined});
  if(r.status===401&&!once){await refresh();return request(table,method,body,true)}
  const result=await r.json().catch(()=>[]);
  if(!r.ok)throw Error(result?.message||result?.hint||`HTTP ${r.status}`);
  return result;
 }
 function formData(){const features={...current};document.querySelectorAll('[data-key]').forEach(el=>features[el.dataset.key]=el.checked);return {
  business_type:$('type').value,display_name:$('name').value.trim()||null,locale:$('locale').value,currency_code:$('currency').value,features
 }}
 function renderFeatures(){const type=$('type').value;const defaults=type==='pharmacy'?['pharmacy','batch_tracking','expiry_tracking']:type==='services'?['services']:[];
  $('features').innerHTML=Object.entries(names).map(([k,n])=>`<label class="switch"><input type="checkbox" data-key="${k}" ${current[k]===true||(current[k]===undefined&&defaults.includes(k))?'checked':''}>${n}</label>`).join('')}
 function renderExtras(){
  $('batches').innerHTML=batchRows.map(x=>{const days=Math.ceil((Date.parse(x.expires_on+'T00:00:00Z')-Date.now())/86400000);return `<tr><td>${esc(x.product_ref)}</td><td>${esc(x.batch_number)}</td><td>${esc(x.expires_on)}</td><td>${esc(x.quantity)}</td><td style="color:${days<=0?'#b22':days<=60?'#b76a08':'#188450'}">${days<=0?'منقضی':days<=60?'نزدیک انقضا':'معتبر'}</td></tr>`}).join('')||'<tr><td colspan="5">هنوز بچی ثبت نشده است</td></tr>';
  $('services').innerHTML=serviceRows.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.unit_price)}</td><td>${x.is_active?'فعال':'غیرفعال'}</td></tr>`).join('')||'<tr><td colspan="3">هنوز خدمتی ثبت نشده است</td></tr>';
 }
 function restore(s){if(!s)return;$('type').value=s.business_type||'general';$('name').value=s.display_name||'';$('locale').value=s.locale||'fa-AF';$('currency').value=s.currency_code||'AFN';current=s.features||{};batchRows=s.batches||[];serviceRows=s.services||[];renderFeatures();renderExtras()}
 function snapshot(){return {...formData(),batches:batchRows,services:serviceRows}}
 function stage(){if(!identity())throw Error('فروشگاه انتخاب نشده است.');const data=snapshot();save(draftKey(),{owner_uid:uid,workspace_id:ws,pending:true,updated_at:new Date().toISOString(),data});return data}
 async function upsert(table,record){
  // Allow RLS to verify owner and workspace. Never bypass server with secret role keys.
  const existing=await request(table);
  if(existing.length)return request(table,'PATCH',record);
  return request(table,'POST',{workspace_id:ws,...record});
 }
 async function flush(){
  const draft=read(draftKey());if(!draft?.pending||draft.owner_uid!==uid||draft.workspace_id!==ws)return;
  await upsert('zavi_v25_business_profiles',{business_type:draft.data.business_type,display_name:draft.data.display_name,locale:draft.data.locale,currency_code:draft.data.currency_code});
  await upsert('zavi_v25_feature_settings',{features:draft.data.features});
  save(draftKey(),{...draft,pending:false});
 }
 async function load(){if(busy)return;busy=true;
  try{
   if(!identity())throw Error('نخست از سیستم اصلی وارد حساب و فروشگاه شوید.');
   const draft=read(draftKey());const snap=read(snapshotKey());
   if(snap?.owner_uid===uid&&snap?.workspace_id===ws)restore(snap.data);
   if(draft?.owner_uid===uid&&draft?.workspace_id===ws&&draft.pending)restore({...snap?.data,...draft.data});
   if(!online()){msg(draft?.pending?'تنظیمات محلی محفوظ شد؛ منتظر همگام‌سازی.':'تنظیمات محلی آماده است.');return}
   if(draft?.pending){try{await flush()}catch(e){msg('تنظیمات محلی محفوظ است؛ همگام‌سازی انجام نشد: '+e.message,true);return}}
   const [p,f,b,s]=await Promise.all([request('zavi_v25_business_profiles'),request('zavi_v25_feature_settings'),request('zavi_v25_pharmacy_batches'),request('zavi_v25_services')]);
   const x={business_type:p[0]?.business_type||'general',display_name:p[0]?.display_name||'',locale:p[0]?.locale||'fa-AF',currency_code:p[0]?.currency_code||'AFN',features:f[0]?.features||{},batches:b,services:s};
   save(snapshotKey(),{owner_uid:uid,workspace_id:ws,data:x});restore(x);msg('تنظیمات آماده است.');
  }catch(e){msg('تنظیمات ابری بارگذاری نشد: '+(e?.message||e),true)}finally{busy=false}
 }
 async function saveSettings(){
  try{stage();msg('تنظیمات در دستگاه ذخیره شد.');if(online())await load()}
  catch(e){msg('ذخیره محلی انجام نشد: '+(e.message||e),true)}
 }
 async function onlineOnly(fn){if(!identity())return msg('حساب فروشگاه انتخاب نشده است.',true);if(!online())return msg('ثبت بچ و خدمات به اتصال اینترنت نیاز دارد.',true);try{await fn();await load()}catch(e){msg('ذخیره انجام نشد: '+(e.message||e),true)}}
 $('type').onchange=renderFeatures;$('reload').onclick=load;
 $('saveProfile').onclick=saveSettings;$('saveFeatures').onclick=saveSettings;
 $('saveBatch').onclick=()=>onlineOnly(()=>{
  if(!$('product').value.trim()||!$('batch').value.trim()||!$('expiry').value)throw Error('کد محصول، بچ و تاریخ انقضا ضروری است.');
  return request('zavi_v25_pharmacy_batches','POST',{workspace_id:ws,product_ref:$('product').value.trim(),batch_number:$('batch').value.trim(),expires_on:$('expiry').value,quantity:Number($('qty').value),purchase_price:$('buy').value===''?null:Number($('buy').value),sale_price:$('sell').value===''?null:Number($('sell').value)});
 });
 $('saveService').onclick=()=>onlineOnly(()=>{
  if(!$('serviceName').value.trim())throw Error('نام خدمت ضروری است.');
  return request('zavi_v25_services','POST',{workspace_id:ws,name:$('serviceName').value.trim(),unit_price:Number($('servicePrice').value||0),currency_code:$('currency').value});
 });
 renderFeatures();renderExtras();load();window.addEventListener('online',()=>setTimeout(load,1400));
})();

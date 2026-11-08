/* Server-backed warehouse catalog for the original owner, no synthetic local stock. */
(function(){'use strict';
var ID='zaviWarehouseManagerV1', rows=[], stockRows=[], historyRows=[], stockNote='', historyNote='', activeWorkspace='', requestNo=0, busy=false;
function tr(fa,ps,en){var l=document.documentElement.lang||'fa-AF';return l==='en'?en:l.indexOf('ps')===0?ps:fa}
function owner(){
 var s=window.zaviCloudRestoreInfo&&window.zaviCloudRestoreInfo(),c=window.zaviCloudGetPublicConfig&&window.zaviCloudGetPublicConfig();
 if(!s||s.role!=='owner'||!s.workspace||!c||!/^https:\/\/[a-z0-9.-]+$/i.test(c.url||'')||!c.key)return null;
 return {id:s.workspace,url:c.url,key:c.key}
}
async function rest(path,method,body){
 var c=owner();if(!c)throw Error(tr('حساب مالک ابری فعال نیست.','د مالک کلاوډ حساب فعال نه دی.','Cloud owner account is not active.'));
 var a=window.zaviCloudRefreshAuthSession&&await window.zaviCloudRefreshAuthSession();
 if(!a||!a.access_token||owner()?.id!==c.id)throw Error(tr('نشست حساب تغییر کرد.','د حساب ناسته بدله شوه.','Account session changed.'));
 var h={apikey:c.key,Authorization:'Bearer '+a.access_token};
 if(body) {h['Content-Type']='application/json';h.Prefer='return=representation'}
 var response=await fetch(c.url+path,{method:method||'GET',headers:h,body:body?JSON.stringify(body):undefined});
 var data;try{data=await response.json()}catch(e){}
 if(!response.ok)throw Error(response.status===401||response.status===403?tr('دسترسی گدام تأیید نشد.','د ګدام لاسرسی رد شو.','Warehouse access denied.'):response.status===409?tr('کود گدام تکراری است.','د ګدام کوډ تکراري دی.','Warehouse code already exists.'):(data&&data.message)||tr('خطای سرور.','د سرور تېروتنه.','Server error.'));
 if(owner()?.id!==c.id)throw Error(tr('فروشگاه تغییر کرد.','پلورنځی بدل شو.','Store changed.'));
 return data
}
function panel(){
 return '<section class="card zv-wh-manager" id="'+ID+'"><header class="zv-wh-head"><h3>'+tr('گدام‌های مستقل','جلا ګدامونه','Separate warehouses')+'</h3><button type="button" class="btn subtle" data-wh-refresh>'+tr('تازه‌سازی','نوی کول','Refresh')+'</button></header>'+
 '<p class="zv-wh-note">'+tr('گدام‌ها روی سرور ثبت می‌شوند؛ موجودی فاکتورهای قبلی هنوز جداگانه است.','ګدامونه په سرور کې ثبتېږي؛ د پخوانیو رسیدونو موجودي لا بېله ده.','Warehouses are stored on the server; existing invoice stock is still separate.')+'</p>'+
 '<div class="zv-wh-status" role="status" aria-live="polite"></div><form data-wh-add class="zv-wh-form"><label>'+tr('نام گدام','د ګدام نوم','Warehouse name')+'<input name="warehouse_name" maxlength="90" required autocomplete="off"></label><label>'+tr('کود گدام','د ګدام کوډ','Warehouse code')+'<input name="warehouse_code" maxlength="32" required dir="ltr" autocomplete="off"></label><button class="btn primary" type="submit">'+tr('افزودن گدام','ګدام زیاتول','Add warehouse')+'</button></form><div class="zv-wh-list"></div><div class="zv-wh-stock" aria-label="'+tr('موجودی مستقل گدام','د ګدام جلا موجودي','Separate warehouse stock')+'"></div><div class="zv-wh-transfer"></div><div class="zv-wh-history"></div></section>'
}
function message(box,msg){var el=box.querySelector('.zv-wh-status');if(el)el.textContent=msg}
function element(tag,className,text){var e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e}
function draw(box){
 var el=box.querySelector('.zv-wh-list');if(!el)return;el.replaceChildren();
 if(!rows.length){el.appendChild(element('p','zv-wh-note',tr('هنوز گدامی ثبت نشده است.','تر اوسه ګدام نشته.','No warehouses yet.')));return}
 rows.forEach(function(w){
  var row=element('div','zv-wh-row'),name=element('strong','',w.name),code=element('small','',w.code),status=element('span','',w.is_active?tr('فعال','فعال','Active'):tr('غیرفعال','غیرفعال','Inactive')),button=element('button','btn tiny subtle',w.is_active?tr('غیرفعال‌سازی','غیرفعالول','Deactivate'):tr('فعال‌سازی','فعالول','Activate'));
  button.type='button';button.dataset.whToggle=w.id;button.dataset.whState=String(!w.is_active);var edit=element('button','btn tiny subtle',tr('ویرایش','سمون','Edit'));edit.type='button';edit.dataset.whEdit=w.id;
  row.append(name,code,status,edit,button);el.appendChild(row)
 })
}
function drawStock(box){
 var area=box.querySelector('.zv-wh-stock');if(!area)return;area.replaceChildren();
 area.appendChild(element('h4','',tr('موجودی هر گدام (ثبت‌شده در سرور)','د هر ګدام موجودي (په سرور کې ثبت شوې)','Inventory by warehouse (server records)')));
 if(stockNote)area.appendChild(element('p','zv-wh-note',stockNote));
 if(!rows.length)return;
 var activeIds=new Set(rows.map(function(w){return w.id}));
 var listed=stockRows.filter(function(r){return activeIds.has(r.warehouse_id)});
 if(!listed.length&&!stockNote)area.appendChild(element('p','zv-wh-note',tr('هنوز حرکت موجودی در دیتابیس ثبت نشده است.','تر اوسه د موجودۍ حرکت نه دی ثبت شوی.','No stock movements recorded in the database.')));
 listed.forEach(function(r){
  var warehouse=rows.find(function(w){return w.id===r.warehouse_id});
  var entry=element('div','zv-wh-stock-row');
  entry.appendChild(element('strong','',warehouse?warehouse.name:'—'));
  entry.appendChild(element('span','',r.product_ref));
  var value=element('b','',String(r.quantity));
  if(Number(r.quantity)<0)value.classList.add('zv-wh-negative');
  entry.appendChild(value);area.appendChild(entry)
 })
}
function drawHistory(box){
 var area=box.querySelector('.zv-wh-history');if(!area)return;area.replaceChildren();
 area.appendChild(element('h4','',tr('تاریخچه ورود، خروج و انتقال','د راتګ، وتلو او لېږد تاریخچه','Movement history')));
 if(historyNote)area.appendChild(element('p','zv-wh-note',historyNote));
 if(!historyRows.length){if(!historyNote)area.appendChild(element('p','zv-wh-note',tr('تا حال حرکت موجودی ثبت نشده است.','تر اوسه د موجودۍ حرکت نشته.','No stock movements recorded yet.')));return}
 const byId=new Map(rows.map(w=>[w.id,w.name]));
 for(const item of historyRows){
  const from=byId.get(item.from_warehouse_id)||tr('بیرون','بهر','Outside');
  const to=byId.get(item.to_warehouse_id)||tr('بیرون','بهر','Outside');
  const entry=element('div','zv-wh-stock-row');
  const label=element('span','',from+' → '+to);
  const product=element('strong','',item.product_ref);
  const amount=element('b','',String(item.quantity));
  entry.append(product,label,amount);
  if(item.reference)entry.title=String(item.reference).slice(0,150);
  area.appendChild(entry);
 }
}
function showEdit(box,id){
 const row=box.querySelector('[data-wh-edit="'+id+'"]')?.closest('.zv-wh-row');
 const record=rows.find(w=>w.id===id);
 if(!row||!record||row.querySelector('[data-wh-edit-form]'))return;
 const form=element('form','zv-wh-edit-form');form.setAttribute('data-wh-edit-form','');form.dataset.warehouseId=id;
 const name=element('input','');name.name='name';name.maxLength=90;name.required=true;name.value=record.name;name.setAttribute('aria-label',tr('نام گدام','د ګدام نوم','Warehouse name'));
 const code=element('input','');code.name='code';code.maxLength=32;code.required=true;code.dir='ltr';code.value=record.code;code.setAttribute('aria-label',tr('کود گدام','د ګدام کوډ','Warehouse code'));
 const save=element('button','btn primary',tr('ذخیره','ساتل','Save'));save.type='submit';
 const cancel=element('button','btn subtle',tr('لغو','لغوه','Cancel'));cancel.type='button';cancel.setAttribute('data-wh-cancel','');
 form.append(name,code,save,cancel);row.appendChild(form);name.focus();
}
async function refresh(box){
 box=box||document.getElementById(ID);if(!box)return;
 var ticket=++requestNo,c=owner(),form=box.querySelector('[data-wh-add]');
 if(!c){rows=[];stockRows=[];historyRows=[];stockNote='';historyNote='';activeWorkspace='';if(form)form.hidden=true;draw(box);drawStock(box);drawHistory(box);window.ZaviWarehouseTransfersV1?.mount(box,[]);message(box,tr('برای افزودن گدام، وارد حساب ابری مالک شوید.','د ګدام لپاره د مالک کلاوډ حساب ته ننوځئ.','Sign in as cloud owner to manage warehouses.'));return}
 activeWorkspace=c.id;stockRows=[];historyRows=[];stockNote='';historyNote='';if(form)form.hidden=false;message(box,tr('دریافت از سرور…','له سرور څخه ترلاسه کېږي…','Loading from server…'));
 try{
  var data=await rest('/rest/v1/zavi_warehouses?select=id,name,code,is_active,workspace_id&workspace_id=eq.'+encodeURIComponent(c.id)+'&order=created_at.asc','GET');
  if(ticket!==requestNo||!box.isConnected||activeWorkspace!==c.id)return;
  rows=Array.isArray(data)?data.filter(w=>w&&w.workspace_id===c.id):[];draw(box);window.ZaviWarehouseTransfersV1?.mount(box,rows);
  try {
   var stock=await rest('/rest/v1/zavi_warehouse_stock_summary?select=warehouse_id,product_ref,quantity,workspace_id&workspace_id=eq.'+encodeURIComponent(c.id)+'&order=warehouse_id,product_ref&limit=201','GET');
   if(ticket!==requestNo||!box.isConnected||activeWorkspace!==c.id)return;
   stockRows=Array.isArray(stock)?stock.slice(0,200).filter(function(x){return x.workspace_id===c.id}):[];
   if(Array.isArray(stock)&&stock.length>200)stockNote=tr('فقط ۲۰۰ مورد نخست نشان داده شده؛ برای دیدن همه موارد گزارش کامل لازم است.','یوازې لومړي ۲۰۰ توکي ښودل کېږي.','Showing first 200 rows only; use the full report for more.');
  }catch(stockError){
   if(ticket!==requestNo||!box.isConnected||activeWorkspace!==c.id)return;
   stockRows=[];stockNote=tr('موجودی دریافت نشد: ','موجودي ترلاسه نه شوه: ','Stock unavailable: ')+stockError.message;
  }
  // Stock is a separate read model; render it immediately, even if audit-history is slow.
  drawStock(box);
  try{
    const movements=await rest('/rest/v1/zavi_warehouse_movements?select=id,from_warehouse_id,to_warehouse_id,product_ref,quantity,reference,created_at,workspace_id&workspace_id=eq.'+encodeURIComponent(c.id)+'&order=created_at.desc&limit=30','GET');
    if(ticket!==requestNo||!box.isConnected||activeWorkspace!==c.id)return;
    historyRows=Array.isArray(movements)?movements.filter(m=>m.workspace_id===c.id):[];
   }catch(historyError){if(ticket!==requestNo||!box.isConnected||activeWorkspace!==c.id)return;historyRows=[];historyNote=tr('تاریخچه دریافت نشد: ','تاریخچه ترلاسه نه شوه: ','History unavailable: ')+historyError.message;}
  if(ticket!==requestNo||!box.isConnected||activeWorkspace!==c.id)return;
  drawStock(box);drawHistory(box);message(box,stockNote?tr('گدام‌ها دریافت شدند؛ وضعیت موجودی را بررسی کنید.','ګدامونه ترلاسه شول؛ د موجودۍ حالت وګورئ.','Warehouses loaded; check stock status.'):tr('از دیتابیس دریافت شد.','له ډیټابېس څخه ترلاسه شول.','Loaded from database.'))
 }catch(e){if(ticket!==requestNo||!box.isConnected)return;rows=[];stockRows=[];historyRows=[];stockNote=tr('موجودی قابل تأیید نیست.','موجودي نه ده تایید شوې.','Stock cannot be verified.');historyNote='';draw(box);drawStock(box);drawHistory(box);window.ZaviWarehouseTransfersV1?.mount(box,[]);message(box,e.message)}
}
async function mutate(box,path,method,data){
 if(busy||!box)return false;busy=true;box.querySelectorAll('input,button').forEach(function(x){x.disabled=true});
 try{var result=await rest(path,method,data);if((method==='PATCH'||method==='POST')&&(!Array.isArray(result)||result.length!==1))throw Error(tr('سرور تغییر را تأیید نکرد.','سرور بدلون تایید نه کړ.','Server did not confirm the update.'));await refresh(box);return true}
 catch(e){message(box,e.message);return false}
 finally{busy=false;box.querySelectorAll('input,button').forEach(function(x){x.disabled=false})}
}
document.addEventListener('submit',function(e){
 var form=e.target;
 if(form.matches?.('[data-wh-edit-form]')){
  e.preventDefault();
  const box=form.closest('#'+ID),id=form.dataset.warehouseId,c=owner();
  if(!box||!c||c.id!==activeWorkspace||!rows.find(w=>w.id===id))return;
  const name=form.elements.name.value.trim(),code=form.elements.code.value.trim().toUpperCase();
  if(!name||name.length>90||!/^[A-Z0-9_-]{1,32}$/.test(code)){message(box,tr('نام یا کود نامعتبر است.','نوم یا کوډ ناسم دی.','Invalid name or code.'));return;}
  void mutate(box,'/rest/v1/zavi_warehouses?id=eq.'+encodeURIComponent(id)+'&workspace_id=eq.'+encodeURIComponent(c.id),'PATCH',{name,code});
  return;
 }
 if(!form.matches||!form.matches('[data-wh-add]'))return;e.preventDefault();
 var box=form.closest('#'+ID),c=owner();if(!box||!c)return;
 var name=form.elements.warehouse_name.value.trim(),code=form.elements.warehouse_code.value.trim().toUpperCase();
 if(!name||name.length>90||!/^[A-Z0-9_-]{1,32}$/.test(code)){message(box,tr('نام یا کود نامعتبر است.','نوم یا کوډ ناسم دی.','Invalid name or code.'));return}
 mutate(box,'/rest/v1/zavi_warehouses','POST',{workspace_id:c.id,name:name,code:code}).then(function(ok){if(ok&&box.isConnected)form.reset()})
});
document.addEventListener('click',function(e){
 var button=e.target.closest&&e.target.closest('[data-wh-refresh],[data-wh-toggle],[data-wh-edit],[data-wh-cancel]');if(!button)return;
 var box=button.closest('#'+ID);if(!box)return;
 if(button.hasAttribute('data-wh-refresh')){refresh(box);return}
 if(button.hasAttribute('data-wh-cancel')){button.closest('[data-wh-edit-form]')?.remove();return}
 if(button.hasAttribute('data-wh-edit')){if(owner()?.id===activeWorkspace)showEdit(box,button.dataset.whEdit);return}
 var id=button.dataset.whToggle,record=rows.find(function(x){return x.id===id});
 if(!record||!owner()||owner().id!==activeWorkspace)return;
 mutate(box,'/rest/v1/zavi_warehouses?id=eq.'+encodeURIComponent(id)+'&workspace_id=eq.'+encodeURIComponent(activeWorkspace),'PATCH',{is_active:button.dataset.whState==='true'})
});
window.ZaviWarehouseV1={panel:panel,afterRender:function(){refresh()},refresh:refresh};
})();
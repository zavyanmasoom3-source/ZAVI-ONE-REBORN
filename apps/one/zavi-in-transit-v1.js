/* ZAVI ONE in-transit orders — cloud-owner-only integration.
 * Existing local invoices, local product balances and legacy stock are NEVER
 * mutated by this panel. This is not a substitute for atomic sales settlement.
 * A pending RPC is durably retained until a server-confirmed outcome.
 */
(function(root,factory){
  'use strict';
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document){root.ZaviInTransitV1=api;api.boot();}
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const langs={
    fa:{heading:'سفارش‌های در راه',sub:'تا دریافت و تأیید سرور، این کالا به موجودی قابل فروش اضافه نمی‌شود.',login:'برای دیدن سفارش‌ها با حساب مالک ابری وارد شوید.',loading:'در حال دریافت اطلاعات واقعی سرور…',reload:'تازه‌سازی',new:'ثبت سفارش در راه',supplier:'تأمین‌کننده',country:'کشور مبدأ',tracking:'شماره پیگیری',arrival:'تاریخ احتمالی رسیدن (میلادی)',warehouse:'گدام مقصد',currency:'ارز فاکتور (ISO)',rate:'نرخ یک واحد ارز به پول اصلی',freight:'هزینه باربری',customs:'گمرک',other:'سایر مصارف',state:'وضعیت',product:'کالا',qty:'تعداد سفارش',price:'قیمت واحد در ارز اصلی',add:'افزودن ردیف',submit:'ثبت در سرور',receive:'دریافت مرحله‌ای',receiving:'تعداد واقعاً رسیده',note:'یادداشت دریافت',confirm:'ثبت دریافت',pending:'نتیجه یک عملیات هنوز قطعی نیست. فقط همان شناسه و معلومات را دوباره بفرستید.',retry:'بررسی و تکرار همان عملیات',empty:'سفارشی ثبت نشده است.',nothing:'اول یک محصول و گدام فعال ثبت کنید.',ok:'تأیید سرور ثبت شد.',error:'سرور نتیجه را تأیید نکرد؛ موجودی محلی تغییر نکرد.',noStock:'موجودی فاکتورهای محلی و موجودی گدام سروری هنوز یکی نشده‌اند؛ دریافت این بخش به معنی اجازه فروش در دفتر قدیمی نیست.',ordered:'سفارش‌شده',draft:'پیش‌نویس',shipped:'ارسال‌شده',partial:'دریافت قسمی',received:'رسیده',cancelled:'لغوشده',remaining:'باقی',noConnection:'برای ثبت و دریافت اینترنت و تأیید سرور لازم است.'},
    ps:{heading:'په لار کې فرمایشونه',sub:'تر سروري تایید او ترلاسه کولو پورې توکي د پلور لپاره نه زیاتېږي.',login:'د کلاوډ مالک حساب ته ننوځئ.',loading:'له سرور څخه کره معلومات رااخلو…',reload:'تازه کول',new:'د لارې فرمایش ثبتول',supplier:'عرضه کوونکی',country:'اصلي هېواد',tracking:'د تعقیب شمېره',arrival:'د راتګ اټکلي نېټه (میلادي)',warehouse:'هدف ګدام',currency:'د رسید اسعار',rate:'د یوې پیسې نرخ په اصلي اسعارو',freight:'د لېږد لګښت',customs:'ګمرک',other:'نور لګښتونه',state:'حالت',product:'توکی',qty:'غوښتل شوې اندازه',price:'د واحد بیه',add:'بل قطار',submit:'سرور ته ثبتول',receive:'په پړاوونو ترلاسه کول',receiving:'واقعاً رسېدلی مقدار',note:'د ترلاسه کولو یادښت',confirm:'ترلاسه کول ثبتول',pending:'د عملیاتو پایله لا څرګنده نه ده؛ په هماغه پېژند سره یې بیا هڅه وکړئ.',retry:'هماغه عملیات بیا وګورئ',empty:'فرمایش نشته.',nothing:'لومړی توکی او فعال ګدام جوړ کړئ.',ok:'سرور تایید کړ.',error:'سرور تایید ورنه کړ؛ محلي موجودي بدله نه شوه.',noStock:'د سرور او پخواني رسید موجودي لا یوځای شوې نه ده.',ordered:'فرمایش شوی',draft:'مسوده',shipped:'استول شوی',partial:'یوه برخه رسېدلې',received:'رسېدلی',cancelled:'لغوه',remaining:'پاتې',noConnection:'انټرنېټ او د سرور تایید ته اړتیا ده.'},
    en:{heading:'Orders in transit',sub:'Ordered goods do not become sellable stock until the server confirms physical receipt.',login:'Sign in as cloud owner to view orders.',loading:'Loading actual server records…',reload:'Refresh',new:'Create in-transit order',supplier:'Supplier',country:'Origin country',tracking:'Tracking number',arrival:'Expected arrival (Gregorian)',warehouse:'Destination warehouse',currency:'Invoice currency (ISO)',rate:'Rate: 1 invoice unit in base currency',freight:'Freight',customs:'Customs',other:'Other costs',state:'Status',product:'Product',qty:'Ordered quantity',price:'Unit price (invoice currency)',add:'Add line',submit:'Create on server',receive:'Receive in stages',receiving:'Physically received quantity',note:'Receipt note',confirm:'Confirm receipt',pending:'An operation has an uncertain outcome. Retry exactly the SAME identifier and payload.',retry:'Verify / retry same operation',empty:'No orders recorded.',nothing:'Register an active warehouse and product first.',ok:'Server confirmed.',error:'No server confirmation; local stock was NOT updated.',noStock:'Legacy invoice stock and the server warehouse ledger are not reconciled. Receipt here does not authorize legacy sales.',ordered:'Ordered',draft:'Draft',shipped:'Shipped',partial:'Partially received',received:'Received',cancelled:'Cancelled',remaining:'Remaining',noConnection:'Internet and server confirmation are required.'}
  };
  const L=()=>{const lang=(root.document?.documentElement?.lang||'fa').toLowerCase();return langs[lang.startsWith('ps')?'ps':lang.startsWith('en')?'en':'fa']};
  const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const digits=x=>String(x??'').trim().replace(/[۰-۹]/g,x=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[٠-٩]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(x))).replace('٫','.');
  function decimal(value,scale=4,allowZero=false){
    const raw=digits(value);
    if(!new RegExp('^(?:0|[1-9]\\d{0,11})(?:\\.\\d{1,'+scale+'})?$').test(raw))throw Error('Invalid non-negative decimal');
    if(!allowZero&&!/[1-9]/.test(raw))throw Error('Quantity must be positive');
    return raw;
  }
  function units(value,scale=4,allowZero=false){
    const [whole,frac='']=decimal(value,scale,allowZero).split('.');
    return BigInt(whole)*10n**BigInt(scale)+BigInt(frac.padEnd(scale,'0'));
  }
  function uuid(){
    if(!root.crypto?.getRandomValues)throw Error('Secure random UUID unavailable');
    const x=root.crypto.getRandomValues(new Uint8Array(16));
    x[6]=x[6]&15|64;x[8]=x[8]&63|128;
    const h=Array.from(x,b=>b.toString(16).padStart(2,'0')).join('');
    return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
  }
  function createParams(data){
    if(!data||!UUID.test(data.p_order_id)||!UUID.test(data.p_workspace_id)||!UUID.test(data.p_destination_warehouse_id))throw Error('Missing order/warehouse ID');
    const supplier=String(data.p_supplier_name||'').trim(),country=String(data.p_country_name||'').trim(),currency=String(data.p_currency_code||'').trim().toUpperCase();
    if(!supplier||supplier.length>120||!country||country.length>80||!/^[A-Z]{3}$/.test(currency))throw Error('Invalid supplier, origin or currency');
    if(!['draft','ordered','shipped'].includes(data.p_status))throw Error('Invalid order status');
    const rate=decimal(data.p_exchange_rate,8),freight=decimal(data.p_freight_original||'0',4,true),
          customs=decimal(data.p_customs_original||'0',4,true),other=decimal(data.p_other_costs_original||'0',4,true);
    const tracking=String(data.p_tracking_number||'').trim(),notes=String(data.p_notes||'').trim();
    if(tracking.length>120||notes.length>1200||data.p_expected_date&&!/^\d{4}-\d\d-\d\d$/.test(data.p_expected_date))throw Error('Invalid tracking, date or notes');
    if(!Array.isArray(data.p_lines)||!data.p_lines.length||data.p_lines.length>200)throw Error('Order lines required');
    let total=0n;const ids=new Set();
    const lines=data.p_lines.map(l=>{
      if(!UUID.test(l.id)||ids.has(l.id)||!String(l.product_ref||'').trim()||String(l.product_ref).length>160)throw Error('Unmapped or repeated product');
      ids.add(l.id);
      const qty=decimal(l.ordered_qty),price=decimal(l.unit_price_original,4,true),name=String(l.product_name||'').trim(),sku=String(l.sku||'').trim();
      if(!name||name.length>160||sku.length>100)throw Error('Invalid product name');
      total+=units(qty)*units(price,4,true);
      return {id:l.id,product_ref:l.product_ref,product_name:name,sku,ordered_qty:qty,unit_price_original:price};
    });
    const orderTotal=total/100000000n+'.'+(total%100000000n).toString().padStart(8,'0');
    return {p_order_id:data.p_order_id,p_workspace_id:data.p_workspace_id,p_destination_warehouse_id:data.p_destination_warehouse_id,
      p_supplier_name:supplier,p_country_name:country,p_currency_code:currency,p_exchange_rate:rate,p_purchase_total_original:orderTotal,
      p_freight_original:freight,p_customs_original:customs,p_other_costs_original:other,p_tracking_number:tracking||null,
      p_carrier:null,p_expected_date:data.p_expected_date||null,p_status:data.p_status,p_notes:notes||null,p_lines:lines};
  }
  function receiveParams(data,remaining){
    if(!data||!UUID.test(data.p_receipt_id)||!UUID.test(data.p_order_id)||!UUID.test(data.p_line_id))throw Error('Invalid receipt identity');
    const qty=decimal(data.p_quantity),available=units(remaining,4,true);
    if(units(qty)>available)throw Error('Over-receipt is blocked until discrepancy workflow is audited');
    if(!String(data.p_product_ref||'').trim()||String(data.p_product_ref).length>160)throw Error('Unmapped product');
    const note=String(data.p_note||'').trim();if(note.length>500)throw Error('Receipt note too long');
    return {p_receipt_id:data.p_receipt_id,p_order_id:data.p_order_id,p_line_id:data.p_line_id,p_quantity:qty,p_product_ref:data.p_product_ref,p_note:note||null};
  }
  const owner=()=>{
    const s=root.zaviCloudRestoreInfo?.(),c=root.zaviCloudGetPublicConfig?.(),a=root.zaviCloudGetAuthSession?.();
    if(s?.role!=='owner'||!s.workspace||!UUID.test(s.workspace)||!a?.user?.id||!UUID.test(a.user.id)||
       !c?.url||!/^https:\/\/[a-z0-9.-]+$/i.test(c.url)||!c.key||
       (typeof root.zaviCloudCanEdit==='function'&&!root.zaviCloudCanEdit()))return null;
    return {workspace:s.workspace,user:a.user.id,url:c.url,key:c.key};
  };
  const storageKey=i=>'zavi-in-transit-pending-v1:'+i.user+':'+i.workspace;
  function savePending(id,job){const data=JSON.stringify(job);root.localStorage.setItem(storageKey(id),data);if(root.localStorage.getItem(storageKey(id))!==data)throw Error('Cannot save pending operation');}
  function getPending(id){try{const job=JSON.parse(root.localStorage.getItem(storageKey(id))||'null');return job&&job.workspace===id.workspace&&['zavi_v671_create_in_transit','zavi_v671_receive_in_transit'].includes(job.rpc)?job:null}catch{return null}}
  async function rest(id,path,method='GET',body){
    if(!root.navigator?.onLine)throw Error(L().noConnection);
    const refreshed=await root.zaviCloudRefreshAuthSession?.();
    if(!refreshed?.access_token||owner()?.workspace!==id.workspace||owner()?.user!==id.user)throw Error(L().login);
    const headers={apikey:id.key,Authorization:'Bearer '+refreshed.access_token};
    if(body!==undefined)headers['Content-Type']='application/json';
    const response=await root.fetch(id.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
    let result;try{result=await response.json()}catch{result={}}
    if(!response.ok)throw Error(result?.message||'Server error '+response.status);
    if(owner()?.workspace!==id.workspace||owner()?.user!==id.user)throw Error('Account changed during request');
    return result;
  }
  async function post(id,job){
    if(getPending(id)&&JSON.stringify(getPending(id))!==JSON.stringify(job))throw Error(L().pending);
    savePending(id,job); // persist BEFORE network so a timeout cannot duplicate an operation
    const result=await rest(id,'/rest/v1/rpc/'+job.rpc,'POST',job.params);
    if(!result||result.success!==true)throw Error(L().error);
    root.localStorage.removeItem(storageKey(id));
    return result;
  }
  function localProducts(){
    try{
      const d=typeof db!=='undefined'?db:root.zaviWarehouseData;
      return Array.isArray(d?.products)?d.products.filter(x=>x&&typeof x.id==='string'&&x.id.length<=160&&x.name).map(x=>({id:x.id,name:x.name,sku:x.sku||''})):[];
    }catch{return []}
  }
  function field(name,label,attributes=''){return '<label>'+escape(label)+'<input name="'+name+'" '+attributes+'></label>'}
  const STATUS=()=>({draft:L().draft,ordered:L().ordered,shipped:L().shipped,partially_received:L().partial,received:L().received,cancelled:L().cancelled});
  function markup(){
    const t=L();
    return '<section class="card zv-transit" data-zv-transit><header class="zv-transit-head"><h3>'+escape(t.heading)+'</h3><button type="button" class="btn subtle" data-zv-refresh>'+escape(t.reload)+'</button></header><p>'+escape(t.sub)+'</p><p class="zv-transit-hint">'+escape(t.noStock)+'</p><div role="status" aria-live="polite" data-zv-status></div><div data-zv-content></div></section>';
  }
  function render(host,warehouseRows,orders,lines){
    const t=L(),products=localProducts(),active=warehouseRows.filter(x=>x.is_active);
    const productsOptions=products.map(x=>'<option value="'+escape(x.id)+'">'+escape(x.name)+(x.sku?' · '+escape(x.sku):'')+'</option>').join('');
    const warehouseOptions=active.map(x=>'<option value="'+escape(x.id)+'">'+escape(x.name)+'</option>').join('');
    let html='';
    if(active.length&&products.length){
      html+='<details class="zv-transit-form"><summary>'+escape(t.new)+'</summary><form data-zv-create><div class="zv-transit-fields">'+
        field('supplier',t.supplier,'required maxlength="120"')+field('country',t.country,'required maxlength="80"')+
        field('tracking',t.tracking,'maxlength="120" dir="ltr"')+field('eta',t.arrival,'type="date"')+
        '<label>'+escape(t.warehouse)+'<select name="warehouse" required>'+warehouseOptions+'</select></label>'+
        field('currency',t.currency,'required maxlength="3" value="AFN" dir="ltr" pattern="[A-Za-z]{3}"')+
        field('rate',t.rate,'required inputmode="decimal" value="1"')+
        field('freight',t.freight,'inputmode="decimal" value="0"')+
        field('customs',t.customs,'inputmode="decimal" value="0"')+
        field('other',t.other,'inputmode="decimal" value="0"')+
        '<label>'+escape(t.state)+'<select name="state"><option value="ordered">'+escape(t.ordered)+'</option><option value="draft">'+escape(t.draft)+'</option><option value="shipped">'+escape(t.shipped)+'</option></select></label></div>'+
        '<div data-zv-lines></div><button type="button" class="btn subtle" data-zv-add-line>'+escape(t.add)+'</button> '+
        '<button class="btn primary" type="submit">'+escape(t.submit)+'</button></form></details>';
    }else html+='<p>'+escape(t.nothing)+'</p>';
    html+='<div class="zv-transit-orders">';
    if(!orders.length)html+='<p>'+escape(t.empty)+'</p>';
    for(const order of orders){
      const itemLines=lines.filter(x=>x.order_id===order.id);
      html+='<article class="zv-transit-order"><h4>'+escape(order.supplier_name)+' · '+escape(order.country_name)+'</h4><p>'+
        escape(order.tracking_number||'—')+' · '+escape(order.expected_date||'—')+' · <strong>'+escape(STATUS()[order.status]||order.status)+'</strong></p>';
      for(const l of itemLines){
        const remaining=(units(l.ordered_qty,4,true)-units(l.received_qty,4,true));
        const restQty=remaining>0n?(remaining/10000n)+'.'+String(remaining%10000n).padStart(4,'0'):'0';
        html+='<div class="zv-transit-line"><span>'+escape(l.product_name)+' — '+escape(t.remaining)+': '+escape(restQty)+'</span>';
        if(remaining>0n&&!['cancelled','received'].includes(order.status)&&l.product_ref&&products.some(p=>p.id===l.product_ref)){
          html+='<form data-zv-receive data-order="'+escape(order.id)+'" data-line="'+escape(l.id)+'" data-product="'+escape(l.product_ref)+'" data-remaining="'+escape(restQty)+'">'+
            '<label>'+escape(t.receiving)+'<input name="quantity" required inputmode="decimal" value="'+escape(restQty)+'"></label>'+
            '<label>'+escape(t.note)+'<input name="note" maxlength="500"></label>'+
            '<button class="btn subtle" type="submit">'+escape(t.confirm)+'</button></form>';
        }
        html+='</div>';
      }
      html+='</article>';
    }
    html+='</div>';
    host.querySelector('[data-zv-content]').innerHTML=html;
    const add=host.querySelector('[data-zv-add-line]'),linesRoot=host.querySelector('[data-zv-lines]');
    function addLine(){linesRoot?.insertAdjacentHTML('beforeend','<div class="zv-transit-line" data-zv-line>'+
      '<label>'+escape(t.product)+'<select name="product" required>'+productsOptions+'</select></label>'+
      field('qty',t.qty,'required inputmode="decimal" value="1"')+
      field('price',t.price,'required inputmode="decimal" value="0"')+
      '<button type="button" class="btn tiny subtle" data-zv-remove-line aria-label="Remove line">×</button></div>')}
    if(add){add.addEventListener('click',addLine);addLine();}
  }
  let currentSeq=0,loading=false;
  function message(host,msg){const s=host?.querySelector('[data-zv-status]');if(s)s.textContent=msg;}
  async function refresh(host){
    const seq=++currentSeq,id=owner();if(!host?.isConnected)return;
    if(!id){host.querySelector('[data-zv-content]').replaceChildren();message(host,L().login);return}
    if(getPending(id)){host.querySelector('[data-zv-content]').innerHTML='<button type="button" class="btn primary" data-zv-retry>'+escape(L().retry)+'</button>';message(host,L().pending);return}
    message(host,L().loading);
    try{
      const workspace='workspace_id=eq.'+encodeURIComponent(id.workspace);
      const [warehouses,orders,lines]=await Promise.all([
        rest(id,'/rest/v1/zavi_warehouses?select=id,name,is_active,workspace_id&'+workspace+'&order=name'),
        rest(id,'/rest/v1/zavi_in_transit_orders?select=id,workspace_id,destination_warehouse_id,supplier_name,country_name,currency_code,exchange_rate,tracking_number,expected_date,status,created_at&'+workspace+'&order=created_at.desc&limit=100'),
        rest(id,'/rest/v1/zavi_in_transit_lines?select=id,order_id,workspace_id,product_ref,product_name,ordered_qty,received_qty&'+workspace+'&limit=1000')
      ]);
      if(seq!==currentSeq||!host.isConnected||owner()?.workspace!==id.workspace)return;
      if(![warehouses,orders,lines].every(Array.isArray))throw Error('Unexpected server response');
      render(host,warehouses.filter(x=>x.workspace_id===id.workspace),orders.filter(x=>x.workspace_id===id.workspace),lines.filter(x=>x.workspace_id===id.workspace));
      message(host,'');
    }catch(e){if(seq===currentSeq)message(host,e.message||L().error)}
  }
  async function submitCreate(form,host){
    const id=owner();if(!id)throw Error(L().login);
    const f=form.elements,products=localProducts();
    const lines=[...form.querySelectorAll('[data-zv-line]')].map(el=>{
      const p=products.find(x=>x.id===el.querySelector('[name=product]').value);
      if(!p)throw Error('Product no longer exists');
      return {id:uuid(),product_ref:p.id,product_name:p.name,sku:p.sku,ordered_qty:el.querySelector('[name=qty]').value,unit_price_original:el.querySelector('[name=price]').value};
    });
    const params=createParams({p_order_id:uuid(),p_workspace_id:id.workspace,p_destination_warehouse_id:f.warehouse.value,
      p_supplier_name:f.supplier.value,p_country_name:f.country.value,p_currency_code:f.currency.value,
      p_exchange_rate:f.rate.value,p_freight_original:f.freight.value,p_customs_original:f.customs.value,
      p_other_costs_original:f.other.value,p_tracking_number:f.tracking.value,p_expected_date:f.eta.value,
      p_status:f.state.value,p_lines:lines});
    const job={workspace:id.workspace,rpc:'zavi_v671_create_in_transit',params};
    return post(id,job);
  }
  async function submitReceipt(form){
    const id=owner();if(!id)throw Error(L().login);
    const params=receiveParams({p_receipt_id:uuid(),p_order_id:form.dataset.order,p_line_id:form.dataset.line,
      p_product_ref:form.dataset.product,p_quantity:form.elements.quantity.value,p_note:form.elements.note.value},form.dataset.remaining);
    return post(id,{workspace:id.workspace,rpc:'zavi_v671_receive_in_transit',params});
  }
  async function retry(){
    const id=owner(),job=id&&getPending(id);if(!job)throw Error(L().pending);
    return post(id,job);
  }
  function mount(){
    const content=root.document?.querySelector('.zui-order-page[data-module="purchases"]');
    if(!content||content.querySelector('[data-zv-transit]'))return;
    content.insertAdjacentHTML('beforeend',markup());
    const heading=content.querySelector('.zui-section-heading');
    if(heading&&!heading.querySelector('[data-zv-open]'))heading.insertAdjacentHTML('beforeend','<button type="button" class="btn subtle zv-transit-launch" data-zv-open>'+escape(L().heading)+'</button>');
    refresh(content.querySelector('[data-zv-transit]'));
  }
  function boot(){
    root.document.addEventListener('DOMContentLoaded',()=>{
      const slot=root.document.getElementById('content')||root.document.body;
      if(root.MutationObserver){new root.MutationObserver(()=>mount()).observe(slot,{childList:true,subtree:false})}
      mount();
    });
    root.document.addEventListener('click',e=>{
      if(e.target.closest?.('[data-zv-open]')){e.preventDefault();root.document.querySelector('[data-zv-transit]')?.scrollIntoView({block:'start',behavior:'smooth'});return}
      const host=e.target.closest?.('[data-zv-transit]');if(!host)return;
      if(e.target.closest('[data-zv-refresh]'))refresh(host);
      if(e.target.closest('[data-zv-remove-line]')){const all=host.querySelectorAll('[data-zv-line]');if(all.length>1)e.target.closest('[data-zv-line]').remove()}
      if(e.target.closest('[data-zv-retry]')&&!loading){loading=true;retry().then(()=>{message(host,L().ok);refresh(host)}).catch(err=>message(host,err.message||L().error)).finally(()=>loading=false)}
    });
    root.document.addEventListener('submit',e=>{
      const form=e.target;if(!form?.matches?.('[data-zv-create], [data-zv-receive]'))return;
      e.preventDefault();const host=form.closest('[data-zv-transit]');
      if(loading)return;loading=true;
      const button=form.querySelector('[type=submit]');if(button)button.disabled=true;
      const work=form.matches('[data-zv-create]')?submitCreate(form,host):submitReceipt(form);
      work.then(()=>{message(host,L().ok);refresh(host)}).catch(err=>message(host,err.message||L().error))
        .finally(()=>{loading=false;if(button?.isConnected)button.disabled=false});
    },true);
  }
  return Object.freeze({decimal,units,createParams,receiveParams,markup,boot,mount});
});

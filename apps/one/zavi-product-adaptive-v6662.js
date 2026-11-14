/* Owner-approved V66.62 adaptive product editor. Native save/ledger untouched.
 * Owner-selected workspace trade is read, never inferred or automatically changed.
 */
(()=>{'use strict';
const preset={
 general:'عمومی|مواد خوراکی|پوشاک|وسایل برقی|لوازم خانه|خدمات|سایر',
 supermarket:'برنج و آرد|روغن|نوشیدنی|لبنیات|شیرینی و بسکویت|مواد شوینده|مواد منجمد',
 pharmacy:'دواهای نسخه‌ای|دواهای آزاد|ویتامین‌ها|وسایل طبی|محصولات صحی|لوازم طفل',
 mobile:'موبایل نو|موبایل دست‌دوم|تبلت|قطعات موبایل|لوازم جانبی|تعمیرات',
 accessories:'پوش و قاب موبایل|گلس محافظ|محافظ لنز|چارجر و آداپتور|کیبل شارژ|پاوربانک|هدفون و ایرپاد|هندزفری|هولدر موبایل|لوازم آیپد|قطعات موبایل',
 wholesale:'مواد عمده|کارتن و بسته|مواد اولیه|اجناس وارداتی|کالاهای صادراتی',
 clothing:'لباس مردانه|لباس زنانه|لباس طفلانه|لباس زمستانی|لباس ورزشی|اکسسوری',
 services:'تعمیرات|نصب و راه‌اندازی|خدمات تخنیکی|سرویس دوره‌ای|اجرت کار|مشاوره',
 construction:'سمنت|آهن و سیخ‌گول|ریگ و جغل|رنگ|کاشی و سرامیک|لوله و اتصالات',
 company:'اجناس وارداتی|اجناس صادراتی|مواد اولیه|تجهیزات|خدمات تجارتی',
 exchange:'خرید ارز|فروش ارز|حواله داخلی|حواله خارجی|کارمزد خدمات',
 contractor:'مصالح پروژه|اجرت کارگران|ماشین‌آلات|خدمات انجنیری|قراردادها',
 gold:'لاکت طلا|سیت (ست) طلا|انگشتر|دستبند|گردنبند|گوشواره|چوری|زنجیر|سکه و شمش|طلای دست‌دوم',
 bookstore:'کتاب درسی|کتاب عمومی|کتاب دینی|کتاب کودک|لوازم مکتب|دفتر و قلم',
 footwear:'کفش مردانه|کفش زنانه|کفش طفلانه|کفش ورزشی|لوازم ورزشی',
 cosmetics:'آرایش صورت|مراقبت پوست|مراقبت مو|عطر و خوشبوکننده|وسایل آرایشی',
 electronics:'تلویزیون|یخچال و فریزر|کمپیوتر|وسایل آشپزخانه|وسایل صوتی',
 furniture:'مبل و سوفه|میز و چوکی|تخت و الماری|فرش و پرده|دکوراسیون',
 hardware:'ابزار دستی|ابزار برقی|پیچ و مهره|رنگ و چسب|ابزار برش|تجهیزات ایمنی',
 laboratory:'آزمایش خون|آزمایش ادرار|بیوشیمی|هورمون‌ها|میکروبیولوژی|نمونه‌گیری',
 distribution:'مواد خوراکی|نوشیدنی‌ها|مواد بهداشتی|اجناس عمده|اقلام نمایندگی|سفارش توزیع',
 food:'برنج|روغن|آرد|حبوبات|خشکبار|مواد منجمد|مواد بسته‌بندی',
 restaurant:'غذای اصلی|نوشیدنی|پیش‌غذا|دسر|سفارش بیرون‌بر',
 automotive:'پرزه‌جات|روغن موتر|تایر|باطری|لوازم تزئینی|وسایل ترمیم',
 agriculture:'تخم بذری|کود|خوراک حیوانات|محصولات زراعتی|لوازم زراعت'
};
const esc=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr=(fa,ps,en)=>{const l=document.documentElement.lang||'fa-AF';return l.startsWith('en')?en:l.startsWith('ps')?ps:fa};
const active=()=>window.zaviActiveIndustry?.()||'general';
const identity=()=>{const info=window.zaviCloudRestoreInfo?.(),auth=window.zaviCloudGetAuthSession?.();
 return info?.workspace&&auth?.user?.id?auth.user.id+'_'+info.workspace:'';};
const categoryKey=(type)=>'zavi-product-custom-categories-v6662_'+identity()+'_'+type;
const readCustom=type=>{if(!identity())return [];try{const v=JSON.parse(localStorage.getItem(categoryKey(type))||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.length<=100).slice(0,80):[]}catch(_){return []}};
function enhance(form){
 if(form.dataset.z66ProductReady||!form.querySelector('[name="openingQty"]')||
    !form.querySelector('[name="category"]')||!form.querySelector('[name="salePrice"]')||
    !form.closest('.modal'))return;
 const title=form.closest('.modal')?.querySelector('.modal-head h3')?.textContent||'';
 if(!/ثبت محصول|ویرایش محصول|new product|edit product/i.test(title))return;
 form.dataset.z66ProductReady='true';
 const trade=form.dataset.z66ProductNativeTrade||active(),category=form.elements.namedItem('category');
 const nativeCategory=category.closest('.field');
 if(!nativeCategory)return;
 form.classList.add('z66-product-editor');
 form.dataset.z66ProductTrade=trade;
 const datalist=form.querySelector('#zawiCategoryOptions');
 const cats=[...(preset[trade]||preset.general).split('|'),...readCustom(trade)];
 const original=String(category.value||'').trim();
 if(original&&!cats.includes(original))cats.unshift(original);
 const options=[...new Set(cats)];
 if(datalist)datalist.innerHTML=options.map(x=>'<option value="'+esc(x)+'"></option>').join('');
 const mini=document.createElement('div');mini.className='z66-category-tools';
 mini.innerHTML='<details class="z66-category-choices"><summary>'+esc(tr('تمام دسته‌بندی‌های این کسب‌وکار','د دې سوداګرۍ ټولې کټګورۍ','All categories for this trade'))+'</summary>'+
 '<div class="z66-category-chipset">'+options.map(x=>'<button type="button" data-z66-cat="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div></details>'+
 '<details class="z66-category-new-fold"><summary>'+esc(tr('افزودن دسته‌بندی','نوې کټګوري زیاتول','Add category'))+'</summary>'+
 '<div class="z66-category-add"><input type="text" maxlength="100" placeholder="'+esc(tr('دسته‌بندی تازه','نوې کټګوري','New category'))+'"><button type="button" data-z66-category-add>'+esc(tr('افزودن دسته','کټګوري زیاتول','Add category'))+'</button></div></details>';
 nativeCategory.append(mini);
 mini.querySelectorAll('[data-z66-cat]').forEach(b=>b.addEventListener('click',()=>{
  category.value=b.dataset.z66Cat;
  category.dispatchEvent(new Event('change',{bubbles:true}));
 }));
 mini.querySelector('[data-z66-category-add]').addEventListener('click',()=>{
  const input=mini.querySelector('.z66-category-add input'),name=input.value.trim();
  if(!name||name.length>100||!identity())return status('برای ساخت دسته، نام معتبر و حساب فروشگاه فعال لازم است.');
  if(!options.includes(name)){
   try{localStorage.setItem(categoryKey(trade),JSON.stringify([...readCustom(trade),name]));}
   catch(_){return status('ذخیره دسته‌بندی در این دستگاه ممکن نیست.')}
   options.push(name);
   if(datalist)datalist.append(new Option('',name));
   const btn=document.createElement('button');btn.type='button';btn.dataset.z66Cat=name;btn.textContent=name;
   btn.addEventListener('click',()=>{category.value=name;category.dispatchEvent(new Event('change',{bubbles:true}))});
   mini.querySelector('.z66-category-chipset').append(btn);
  }
  category.value=name;input.value='';category.dispatchEvent(new Event('change',{bubbles:true}));
 });
 // An owner-scoped durable code: catalog code and camera input are the ORIGINAL
 // sku field, so native collision detection, sales and barcode lookup still work.
 const sku=form.elements.namedItem('sku');
 if(!/ویرایش|edit/i.test(title)&&sku&&!sku.value&&crypto?.randomUUID){
  sku.value='ZV-'+crypto.randomUUID().replace(/-/g,'').slice(0,12).toUpperCase();
  sku.dispatchEvent(new Event('input',{bubbles:true}));
 }
 const container=form.querySelector('.z629-industry');
 if(container&&['gold','mobile','accessories'].includes(trade))container.open=true;
 const notice=document.createElement('div');notice.className='z66-product-status';
 notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 mini.after(notice);
 const status=s=>{notice.textContent=s;notice.hidden=!s};
 status('');
 if(trade==='gold'&&container){
  const kind=container.querySelector('[data-z629-key="jewelryKind"]');
  const locket=container.querySelector('[data-z629-key="locketType"]')?.closest('.z629-field');
  const pieces=container.querySelector('[data-z629-key="setPieces"]')?.closest('.z629-field');
  const pieceInput=pieces?.querySelector('input');
  const specials=['گردنبند','گوشواره','انگشتر','دستبند','لاکت','زنجیر'];
  if(pieces&&pieceInput){
   const wrap=document.createElement('div');wrap.className='z66-set-pieces';
   for(const part of specials){
    const label=document.createElement('label'),check=document.createElement('input');
    check.type='checkbox';check.value=part;check.checked=pieceInput.value.split(/[،,]/).map(x=>x.trim()).includes(part);
    const span=document.createElement('span');span.textContent=part;label.append(check,span);wrap.append(label);
    check.addEventListener('change',()=>{
      pieceInput.value=[...wrap.querySelectorAll('input:checked')].map(x=>x.value).join('، ');
      pieceInput.dispatchEvent(new Event('input',{bubbles:true}));
    });
   }
   pieces.append(wrap);
  }
  function syncJewelry(){
   const selected=category.value.trim();
   const type=selected==='سیت (ست) طلا'?'سیت (ست) طلا':selected==='لاکت طلا'?'لاکت طلا':selected;
   if(kind&&[...kind.options].some(o=>o.value===type))kind.value=type;
   if(locket)locket.hidden=type!=='لاکت طلا';
   if(pieces)pieces.hidden=type!=='سیت (ست) طلا';
  }
  category.addEventListener('change',syncJewelry);
  syncJewelry();
 }
 const editor=container?.querySelector('[data-z66-color-editor]');
 if(editor){
  const hidden=container.querySelector('[data-z629-key="colorVariants"]');
  const opening=form.elements.namedItem('openingQty');
  const extras=form.elements.namedItem('barcodes');
  if(hidden&&opening&&extras){
   let oldVariants=[];try{const a=JSON.parse(hidden.value||'[]');if(Array.isArray(a))oldVariants=a}catch(_){}
   const priorBarcodes=new Set(oldVariants.map(x=>String(x.barcode||'').trim()).filter(Boolean));
   // Existing manual codes are kept. Color barcodes are moved into the native
   // barcodes textarea only at validation/submit; they retain a single source.
   editor.innerHTML='<div class="z66-variant-head"><b>'+esc(tr('رنگ‌ها و تعداد هر رنگ','رنګونه او د هر رنګ شمېر','Colours and quantities'))+'</b>'+
   '<button type="button" data-z66-add-color>+ '+esc(tr('افزودن رنگ','رنګ زیاتول','Add colour'))+'</button></div>'+
   '<div class="z66-variant-rows"></div><p class="z66-variant-note">'+esc(tr('موجودی هر رنگ از دفتر فاکتورها محاسبه می‌شود؛ برای تفکیک گدام، گدام را انتخاب کنید.','د هر رنګ موجودي د رسیدونو له دفتره حسابېږي؛ د ګدام لپاره ګدام وټاکئ.','Colour stock follows the invoice journal; select a warehouse to track each bin.'))+'</p>';
   const list=editor.querySelector('.z66-variant-rows');let rowNo=0;
   const isEditing=/ویرایش|edit/i.test(title);let variantsTouched=false;
   function row(data={}){
    if(list.children.length>=20)return status('حداکثر ۲۰ رنگ برای هر محصول مجاز است.');
    const ix=++rowNo,box=document.createElement('div');box.className='z66-variant-row';
    const id='z66-colour-barcode-'+ix;
    box.innerHTML='<label>'+esc(tr('رنگ','رنګ','Colour'))+'<input data-z66-color maxlength="60" list="z66Colours" value="'+esc(data.color||'')+'" placeholder="'+esc(tr('مثلاً سیاه','لکه تور','e.g. black'))+'"></label>'+
     '<label>'+esc(tr('تعداد','شمېر','Quantity'))+'<input data-z66-qty type="number" min="0" step="0.001" value="'+esc(data.qty??0)+'"></label>'+
     '<label>'+esc(tr('بارکد این رنگ','د دې رنګ بارکوډ','Colour barcode'))+'<input id="'+id+'" data-z66-barcode dir="ltr" maxlength="70" value="'+esc(data.barcode||'')+'"></label>'+
     '<button type="button" class="z66-variant-camera" data-zavi-camera-open="'+id+'">▣ '+esc(tr('اسکن دوربین','کمره سکین','Scan'))+'</button>'+
     '<button type="button" class="z66-variant-delete">'+esc(tr('حذف رنگ','رنګ لرې کول','Remove'))+'</button>';
    box.querySelector('.z66-variant-delete').onclick=()=>{variantsTouched=true;box.remove();sync()};
    box.addEventListener('input',()=>{variantsTouched=true;sync()});list.append(box);sync();
   }
   const data=document.createElement('datalist');data.id='z66Colours';
   ['سیاه','سفید','شفاف','آبی','سرخ','سبز','صورتی','طلایی','بنفش','نقره‌ای'].forEach(v=>data.append(new Option('',v)));
   editor.append(data);
   const extract=()=>[...list.children].map(x=>({
    color:x.querySelector('[data-z66-color]').value.trim(),
    qty:x.querySelector('[data-z66-qty]').value.trim(),
    barcode:x.querySelector('[data-z66-barcode]').value.trim()
   }));
   function sync(){
    const entries=extract().filter(x=>x.color||x.barcode||x.qty);
    hidden.value=JSON.stringify(entries);
    if((!isEditing||variantsTouched)&&entries.length&&
       !entries.some(x=>!x.color||!Number.isFinite(Number(x.qty))||Number(x.qty)<0))
      opening.value=String(entries.reduce((a,x)=>a+Number(x.qty),0));
   }
   oldVariants.forEach(row);
   editor.querySelector('[data-z66-add-color]').onclick=()=>{variantsTouched=true;row({color:'',qty:'0',barcode:''})};
   form.addEventListener('submit',e=>{
    const all=extract(),activeRows=all.filter(x=>x.color||x.barcode||Number(x.qty)!==0);
    if(!all.length)return;
    try{
     if(activeRows.length!==all.length||!activeRows.length)throw Error('رنگ و تعداد هر ردیف را تکمیل کنید.');
     const used=new Set(),barcodes=new Set();
     for(const x of all){
      const norm=x.color.toLocaleLowerCase(),qty=Number(x.qty);
      if(!x.color||used.has(norm)||!Number.isFinite(qty)||qty<0||
        Math.round(qty*1000)/1000!==qty)throw Error('رنگ تکراری یا تعداد نامعتبر است.');
      if(x.barcode&&(x.barcode.length>70||!/^[a-zA-Z0-9_.-]+$/.test(x.barcode)))throw Error('بارکد رنگ نامعتبر است.');
      if(x.barcode&&barcodes.has(x.barcode.toLocaleLowerCase()))throw Error('بارکد تکراری در رنگ‌ها است.');
      used.add(norm);if(x.barcode)barcodes.add(x.barcode.toLocaleLowerCase());
     }
     const sum=all.reduce((a,x)=>a+Number(x.qty),0);
     if(sum<=0)throw Error('مجموع تعداد رنگ‌ها باید مثبت باشد.');
     // Keep the native product stock_adjust accounting path authoritative.
     if(!isEditing||variantsTouched)opening.value=String(sum);
     hidden.value=JSON.stringify(all);
     const manually=String(extras.value||'').split(/[,;\n]+/).map(x=>x.trim())
       .filter(x=>x&&!priorBarcodes.has(x));
     const combined=[...new Set([...manually,...all.map(x=>x.barcode).filter(Boolean)])];
     if(combined.length>20)throw Error('مجموع بارکدها نباید بیشتر از ۲۰ باشد.');
     extras.value=combined.join('\n');
     extras.dispatchEvent(new Event('input',{bubbles:true}));
    }catch(error){
     e.preventDefault();e.stopImmediatePropagation();
     container.open=true;status(error.message||String(error));
     editor.scrollIntoView({block:'nearest'});
    }
   },true);
   // A variant allocation is metadata; don't confuse it with independent
   // warehouse stock. Existing ledger transactions remain authoritative.
  }
 }
 const photo=form.querySelector('#zaviProductPhotoInput');
 if(photo){
   const label=photo.closest('label');
   if(label){
    const camera=document.createElement('label');
    camera.className='btn subtle z66-photo-camera';
    camera.textContent=tr('📷 گرفتن عکس','📷 انځور واخلئ','📷 Take photo');
    const file=document.createElement('input');
    file.type='file';file.accept='image/jpeg,image/png,image/webp';
    file.setAttribute('capture','environment');file.hidden=true;
    file.onchange=()=>{
      if(!file.files?.length)return;
      try{const transfer=new DataTransfer();transfer.items.add(file.files[0]);
        photo.files=transfer.files;photo.dispatchEvent(new Event('change',{bubbles:true}));}
      catch(_){status(tr('دوربین این دستگاه فایل را به فرم منتقل نکرد؛ از انتخاب عکس استفاده کنید.','د دې وسیلې کمرې فایل ونه لېږداوه.','Camera transfer unavailable; use Choose photo.'))}
      file.value='';
    };
    camera.append(file);label.after(camera);
   }
 }
 enhanceApprovedRegistration(form,trade,title);
}

/* V66.62 owner-approved product editor: draft trade, SKU, primary barcode and
 * explicit HID modes. All prices, collisions, inventory and saves are delegated
 * to the native form. Selecting a trade NEVER changes shop Settings. */
function enhanceApprovedRegistration(form,trade,title){
 const sku=form.elements.namedItem('sku');
 const extras=form.elements.namedItem('barcodes');
 const currency=form.elements.namedItem('productPriceCurrency');
 const rate=form.elements.namedItem('productManualUsdRate');
 const sale=form.elements.namedItem('salePrice'),buy=form.elements.namedItem('purchasePrice');
 const edit=form.dataset.z66ProductEditing==='true';
 if(!sku||!extras||!currency||!rate||form.querySelector('.z66-registration-trade'))return;
 const doc=document;
 const T=(fa,ps,en)=>tr(fa,ps,en);
 // Native schema has 21 product trades; the older industry kit only has 20
 // and treats 'accessories' as general. Prefer native business labels.
 const label=(key)=>window.ZaviIndustryForms6529?.label?.(key)||
    window.ZaviIndustryKit6525?.profile?.(key)?.label||key;
 const types=[...(window.ZaviIndustryForms6529?.approvedTypes||
    window.ZaviIndustryForms6529?.types||Object.keys(preset))];
 // Existing saved products and an already selected legacy shop keep their
 // original schema even if it is outside the 21 owner-approved choices.
 if(trade&&!types.includes(trade))types.push(trade);
 const wrap=doc.createElement('div');wrap.className='z66-registration-trade field full';
 const heading=doc.createElement('label');heading.textContent=T('نوع کسب‌وکار این محصول','د توکي د سوداګرۍ ډول','Product business type');
 const selector=doc.createElement('select');selector.dataset.z66RegistrationIndustry='true';
 for(const type of types){const o=new Option(label(type),type);selector.append(o);}
 selector.value=trade;selector.disabled=edit;
 const hint=doc.createElement('small');hint.className='field-hint';
 hint.textContent=edit?
  T('صنف این محصول ثبت شده و برای حفاظت از سابقه قابل تغییر نیست.',
    'د ثبت شوي توکي صنف د سابقې د ساتنې لپاره نه بدلېږي.',
    'Business type is locked for an existing product to preserve its history.'):
  T('فقط همین فورم تغییر می‌کند؛ کسب‌وکار اصلی فروشگاه خودکار تغییر نمی‌کند.',
    'یوازې دا فورم بدلېږي؛ د پلورنځي اصلي سوداګري په خپله نه بدلېږي.',
    'Changes this product draft only; shop business stays unchanged.');
 wrap.append(heading,selector,hint);
 const grid=form.querySelector('.form-grid');
 grid?.prepend(wrap);
 selector.addEventListener('change',()=>{
  if(edit)return;
  const selected=selector.value;
  if(!types.includes(selected)||!window.openEntity)return;
  // The original native form binds the industry once at construction. Reopen
  // with an explicit one-product draft override; never change owner settings.
  const draft={};
  for(const key of ['name','sku','barcodes','purchasePrice','salePrice',
    'productPriceCurrency','productManualUsdRate','openingQty','reorder']){
   const field=form.elements.namedItem(key);if(field)draft[key]=field.value;
  }
  window.zaviProductDraftTrade=selected;
  window.openEntity('product');
  const newer=doc.getElementById('dialogForm');
  if(!newer||newer===form)return;
  for(const [key,value] of Object.entries(draft)){
   const field=newer.elements.namedItem(key);
   if(field){field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));}
  }
 });
 // The original SKU is the catalog lookup ID. Leave it visible and native:
 // extra barcodes remain the same product, not duplicate inventory rows.
 const skuField=sku.closest('.field');
 if(skuField){
  const note=doc.createElement('div');note.className='z66-reg-segment field full';
  const row=doc.createElement('div');row.className='z66-reg-heading';
  const title=doc.createElement('strong');title.textContent=T('کُد محصول / SKU','د توکي کوډ','Product code / SKU');
  const autoBtn=doc.createElement('button'),manualBtn=doc.createElement('button');
  for(const b of [autoBtn,manualBtn])b.type='button';
  autoBtn.textContent=T('خودکار','اتومات','Auto');manualBtn.textContent=T('دستی','لاسي','Manual');
  row.append(title,autoBtn,manualBtn);
  const msg=doc.createElement('small');msg.className='field-hint';
  msg.textContent=T('کُد محصول یکتا است و برای فروش و خرید قابل جستجو می‌ماند.',
    'د توکي ځانګړی کوډ په پېر او پلور کې لټول کېږي.',
    'The unique SKU remains searchable in native purchase and sale.');
  note.append(row,msg);skuField.after(note);
  let generated=!edit;
  function fresh(prefix){
    const uuid=window.crypto?.randomUUID?.();
    if(uuid)return prefix+'-'+uuid.replace(/-/g,'').slice(0,12).toUpperCase();
    const bytes=new Uint8Array(8);
    if(window.crypto?.getRandomValues){window.crypto.getRandomValues(bytes);
     return prefix+'-'+Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();}
    return '';
  }
  function setAuto(on){
    generated=on;sku.readOnly=on;autoBtn.setAttribute('aria-pressed',String(on));
    manualBtn.setAttribute('aria-pressed',String(!on));
    if(on && (!sku.value||!sku.value.trim()||!edit)){
      const code=fresh('ZV'+String(trade).slice(0,3).toUpperCase());
      if(code){sku.value=code;sku.dispatchEvent(new Event('input',{bubbles:true}));}
    }
    if(!on){sku.readOnly=false;sku.focus({preventScroll:true});}
  }
  autoBtn.addEventListener('click',()=>setAuto(true));
  manualBtn.addEventListener('click',()=>setAuto(false));
  setAuto(!edit);
  // New product can optionally retain the existing auto-assigned ZV UUID.
  // Manual editing of a SKU requires the explicit Manual choice.
 }
 const barcodeBox=form.querySelector('.zavi-barcode-box');
 const camera=barcodeBox?.querySelector('[data-zavi-camera-open="fld_sku"]');
 if(barcodeBox&&camera){
  const section=doc.createElement('div');section.className='z66-registration-scanner field full';
  const heading=doc.createElement('div');heading.className='z66-reg-heading';
  const strong=doc.createElement('strong');strong.textContent=T('بارکد اصلی','لومړی بارکوډ','Primary barcode');
  const autoBtn=doc.createElement('button'),manualBtn=doc.createElement('button');
  for(const b of [autoBtn,manualBtn])b.type='button';
  autoBtn.textContent=T('خودکار','اتومات','Auto');manualBtn.textContent=T('دستی','لاسي','Manual');
  heading.append(strong,autoBtn,manualBtn);section.append(heading);
  const methods=doc.createElement('div');methods.className='z66-reg-methods';
  const input=doc.createElement('input');input.type='text';input.maxLength=70;
  input.id='z66ProductPrimaryBarcode';input.dir='ltr';input.autocomplete='off';
  input.placeholder=T('بارکد را اسکن یا بنویسید','بارکوډ سکن یا ولیکئ','Scan or type barcode');
  const hint=doc.createElement('small');hint.className='field-hint';
  hint.setAttribute('role','status');
  const nativeBarcodes=()=>String(extras.value||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
  let originalCodes=nativeBarcodes();
  let previous=originalCodes[0]||'';
  input.value=previous;
  let auto=!edit&&!previous;
  let mode='camera';
  function freshBarcode(){
    const rand=window.crypto?.randomUUID?.()?.replace(/-/g,'').slice(0,12).toUpperCase();
    if(rand)return 'BC-'+String(trade).slice(0,3).toUpperCase()+'-'+rand;
    const a=new Uint8Array(7);
    if(window.crypto?.getRandomValues){window.crypto.getRandomValues(a);
     return 'BC-'+Array.from(a,x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();}
    return '';
  }
  function sync(){
    const code=String(input.value||'').trim();
    const rest=nativeBarcodes().filter(c=>c.toLocaleLowerCase()!==previous.toLocaleLowerCase()&&c.toLocaleLowerCase()!==code.toLocaleLowerCase());
    const normalized=[...(code?[code]:[]),...rest];
    if(normalized.length>20)hint.textContent=T('حداکثر ۲۰ بارکد مجاز است.','تر ۲۰ بارکوډونو اجازه شته.','Maximum 20 barcodes.');
    else hint.textContent=T('بارکد اصلی و اضافی در خرید و فروش همین محصول شناسایی می‌شوند.',
      'لومړی او نور بارکوډونه د همدې توکي لپاره کار کوي.',
      'All barcodes resolve to this one product in sales and purchases.');
    previous=code;
    const next=normalized.join('\n');
    if(extras.value!==next){extras.value=next;extras.dispatchEvent(new Event('input',{bubbles:true}));}
  }
  function chooseAuto(on){
    auto=on;autoBtn.setAttribute('aria-pressed',String(on));
    manualBtn.setAttribute('aria-pressed',String(!on));
    input.readOnly=on; // Camera still writes programmatically and triggers input.
    if(on){const b=freshBarcode();if(b){input.value=b;sync();}}
    else{input.readOnly=false;input.focus({preventScroll:true});}
  }
  autoBtn.addEventListener('click',()=>chooseAuto(true));
  manualBtn.addEventListener('click',()=>chooseAuto(false));
  const methodNames=[
    ['camera','📷',T('دوربین','کمره','Camera')],
    ['manual','⌨',T('تایپی','لاسي','Type')],
    ['usb','USB','USB'],
    ['bluetooth','ᛒ','Bluetooth']
  ];
  for(const [key,icon,name] of methodNames){
    const button=doc.createElement('button');button.type='button';
    button.className='z66-reg-method';button.dataset.z66ScanMode=key;
    button.textContent=icon+' '+name;
    button.addEventListener('click',()=>{
      mode=key;
      // A keyboard-wedge HID device cannot type into a readonly generated
      // field. Selecting typing/USB/Bluetooth explicitly makes it editable.
      if(key!=='camera'&&auto){
        auto=false;
        autoBtn.setAttribute('aria-pressed','false');
        manualBtn.setAttribute('aria-pressed','true');
        input.readOnly=false;
        input.value='';
        sync();
      }
      methods.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));
      camera.hidden=key!=='camera';
      input.inputMode=key==='usb'||key==='bluetooth'?'none':'text';
      if(key!=='camera')input.focus({preventScroll:true});
    });
    button.setAttribute('aria-pressed',String(key==='camera'));
    methods.append(button);
  }
  camera.dataset.zaviCameraOpen=input.id;
  camera.textContent=T('📷 اسکن بارکد با دوربین','📷 د کمرې له لارې سکن','📷 Scan using camera');
  section.append(methods,input,hint);
  barcodeBox.parentElement?.insertBefore(section,barcodeBox);
  if(auto)chooseAuto(true);
  else{autoBtn.setAttribute('aria-pressed','false');manualBtn.setAttribute('aria-pressed','true');}
  input.addEventListener('input',()=>{
    // An explicit camera/HID scan takes precedence over an auto-generated code.
    if(auto){auto=false;autoBtn.setAttribute('aria-pressed','false');
      manualBtn.setAttribute('aria-pressed','true');input.readOnly=false;}
    sync();
  });
  input.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&!(event.key==='Tab'&&['usb','bluetooth'].includes(mode)))return;
    event.preventDefault();event.stopPropagation();sync();
    if(['usb','bluetooth'].includes(mode))queueMicrotask(()=>input.focus({preventScroll:true}));
  },true);
  // Capture validation only; native barcode owner check is authoritative.
  form.addEventListener('submit',event=>{
    sync();
    if(!input.value.trim()){event.preventDefault();event.stopImmediatePropagation();
      status(T('بارکد اصلی را دستی وارد کنید یا حالت خودکار را انتخاب کنید.',
        'بارکوډ ولیکئ یا اتومات وټاکئ.','Enter a primary barcode or choose Auto.'));
    }
  },true);
 }

 const warehouseSelect=form.elements.namedItem('variantWarehouseId');
 const whField=warehouseSelect?.closest('.field');
 if(whField&&!whField.querySelector('.z66-product-create-warehouse')){
  const widget=doc.createElement('div');widget.className='z66-product-create-warehouse';
  const toggle=doc.createElement('button');toggle.type='button';toggle.className='btn subtle';
  toggle.textContent=T('＋ افزودن گدام','＋ ګدام زیاتول','＋ Add warehouse');
  const group=doc.createElement('div');group.className='z66-create-wh-fields';group.hidden=true;
  const name=doc.createElement('input');name.type='text';name.maxLength=90;
  name.placeholder=T('نام گدام جدید','د ګدام نوم','Warehouse name');
  const code=doc.createElement('input');code.type='text';code.maxLength=32;code.dir='ltr';
  code.placeholder=T('کُد گدام (اختیاری، خودکار)','د ګدام کوډ (اختیاري)','Code (optional, automatic)');
  const submit=doc.createElement('button');submit.type='button';submit.className='btn primary';
  submit.textContent=T('ذخیره گدام','ګدام ساتل','Save warehouse');
  const note=doc.createElement('small');note.className='field-hint';note.setAttribute('role','status');
  group.append(name,code,submit,note);widget.append(toggle,group);whField.append(widget);
  toggle.addEventListener('click',()=>{group.hidden=!group.hidden;if(!group.hidden)name.focus({preventScroll:true});});
  submit.addEventListener('click',async()=>{
   if(submit.disabled)return;submit.disabled=true;
   note.textContent=T('در حال ثبت سروری…','په سرور کې ثبتېږي…','Saving on server…');
   try{
    const created=await window.ZaviWarehouseV1?.create?.({name:name.value,code:code.value});
    if(!created?.id)throw Error(T('خدمت گدام در دسترس نیست.','د ګدام خدمت نشته.','Warehouse service unavailable.'));
    if(![...warehouseSelect.options].some(x=>x.value===created.id))
     warehouseSelect.append(new Option(created.name,created.id));
    warehouseSelect.value=created.id;warehouseSelect.dispatchEvent(new Event('change',{bubbles:true}));
    group.hidden=true;name.value='';code.value='';note.textContent='';
    status(T('گدام روی سرور ثبت و برای این محصول انتخاب شد.',
      'ګدام په سرور کې ثبت او د دې توکي لپاره وټاکل شو.',
      'Warehouse saved on server and selected for this product.'));
   }catch(err){note.textContent=String(err?.message||err);}
   finally{submit.disabled=false;}
  });
 }

 // Exact rate is authored by the owner, not silently taken from live internet.
 const rateField=rate.closest('.field');
 const priceNote=doc.createElement('div');priceNote.className='z66-product-fx-preview field full';
 priceNote.setAttribute('role','status');
 (rateField||currency.closest('.field'))?.after(priceNote);
 function drawPrice(){
  const usd=currency.value==='USD';
  if(rateField)rateField.hidden=!usd;
  const rateNumber=usd?Number(rate.value):1;
  const base=currency.options[0]?.value||'AFN';
  if(usd&&base!=='USD'&&!(rateNumber>0)){
    priceNote.textContent=T('برای قیمت USD، نرخ دستی را وارد کنید.',
      'د USD لپاره لاسي نرخ ولیکئ.','Enter a manual USD exchange rate.');
  }else{
    const val=Number(sale.value);
    priceNote.textContent=T('قیمت فروش در پول اصلی: ','په اصلي پیسو د خرڅلاو بیه: ','Sale price in base currency: ')+
      (Number.isFinite(val)?(val*(usd&&base!=='USD'?rateNumber:1)).toLocaleString('en-US',{maximumFractionDigits:2})+' '+base:'—');
  }
 }
 for(const field of [currency,rate,sale,buy])field.addEventListener('input',drawPrice);
 currency.addEventListener('change',drawPrice);drawPrice();
}

function init(){
 const overlay=document.getElementById('overlay');if(!overlay)return;
 const apply=()=>{const form=overlay.querySelector('#dialogForm');
  if(form)try{enhance(form);window.ZaviProductAdaptiveError=''}
  catch(err){window.ZaviProductAdaptiveError=String(err?.message||err);
    console.warn('ZAVI adaptive product form:',window.ZaviProductAdaptiveError)}
 };
 new MutationObserver(apply).observe(overlay,{childList:true});
 apply();
}
window.ZaviProductCategories6662=Object.freeze({profiles:[...(window.ZaviIndustryForms6529?.approvedTypes||Object.keys(preset))],categories:t=>(preset[t]||preset.general).split('|')});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
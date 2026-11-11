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
 distribution:'مواد خوراکی|نوشیدنی‌ها|مواد بهداشتی|اجناس عمده|اقلام نمایندگی|سفارش توزیع'
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
 const trade=active(),category=form.elements.namedItem('category');
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
 mini.innerHTML='<small>'+esc(tr('پیشنهادهای مخصوص کسب‌وکار انتخاب‌شده','د ټاکلې سوداګرۍ ځانګړې کټګورۍ','Categories for the selected trade'))+'</small>'+
 '<div class="z66-category-chipset">'+options.slice(0,9).map(x=>'<button type="button" data-z66-cat="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div>'+
 '<div class="z66-category-add"><input type="text" maxlength="100" placeholder="'+esc(tr('دسته‌بندی تازه','نوې کټګوري','New category'))+'"><button type="button" data-z66-category-add>'+esc(tr('افزودن دسته','کټګوري زیاتول','Add category'))+'</button></div>';
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
   '<div class="z66-variant-rows"></div><p class="z66-variant-note">'+esc(tr('تعداد و بارکد هر رنگ ثبت می‌شود؛ موجودی حسابداری هنوز برای کل محصول محاسبه می‌شود.','د هر رنګ شمېر ثبتېږي؛ حسابداري موجودي لا هم د ټول توکي لپاره ده.','Colour quantities are recorded, but accounting stock remains product-level.'))+'</p>';
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
     if(combined.length>16)throw Error('مجموع بارکدها نباید بیشتر از ۱۶ باشد.');
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
window.ZaviProductCategories6662=Object.freeze({profiles:Object.keys(preset),categories:t=>(preset[t]||preset.general).split('|')});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
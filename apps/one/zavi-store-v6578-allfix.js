/* ZAVI ONE 65.78 — fixes for customer-reported mobile/profile/translation/layout defects.
 * UI-only: does not modify sale, accounting, membership, offline license or RLS. */
(()=>{'use strict';
const q=(s,p=document)=>p.querySelector(s),all=(s,p=document)=>[...p.querySelectorAll(s)];
const locale=()=>{const picker=q('#zaviTopLanguage');const l=(picker?.value||document.documentElement.lang||'fa-AF').toLowerCase();return l.startsWith('en')?'en':l.startsWith('ps')?'ps':'fa'};
const k='zavi_v6576_personal_user_profile_';
function validId(x){return typeof x==='string'&&/^[0-9a-zA-Z_-]{8,128}$/.test(x)}
function profile(){
 try{
  const ctx=window.zaviCloudRestoreInfo?.()||{},uid=window.zaviCloudGetAuthSession?.()?.user?.id||'';
  const w=ctx.workspace||'',local=localStorage.getItem('zavi_v6577_local_profile_id');
  const primary=validId(uid)&&validId(w)?k+uid+'_'+w:null;
  const fallback=validId(local)?k+local+'_'+(validId(w)?w:'device'):null;
  // Never fall back to another signed-in user's stored profile.
  const keys=primary?[primary]:[fallback].filter(Boolean);
  for(const key of keys){const obj=JSON.parse(localStorage.getItem(key)||'null');
   if(obj?.version!==1||typeof obj.name!=='string'||typeof obj.photo!=='string')continue;
   if(obj.name.length>50||obj.photo.length>110000)continue;
   if(obj.photo&&!/^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(obj.photo))continue;
   return {name:obj.name.replace(/[\x00-\x1f<>]/g,'').trim(),photo:obj.photo,key};
  }
 }catch(_){}
 return null;
}
let prev='';
function headerProfile(){
 const top=q('.topbar');if(!top)return;
 const obj=profile(),name=obj?.name;
 const existing=q('#z78-user');
 if(!name){existing?.remove();prev='';return}
 const stamp=obj.key+'|'+name+'|'+obj.photo.length;
 if(existing&&stamp===prev)return;
 prev=stamp;let b=existing;
 if(!b){b=document.createElement('span');b.id='z78-user';b.setAttribute('aria-label','Personal profile');top.append(b)}
 b.replaceChildren();b.title=name;
 const avatar=document.createElement('span');avatar.className='z78-user-photo';
 if(obj.photo){const im=document.createElement('img');im.src=obj.photo;im.alt='';im.decoding='async';avatar.append(im)}
 else avatar.textContent=Array.from(name)[0]||'👤';
 const label=document.createElement('span');label.className='z78-user-name';label.textContent=name;
 b.append(avatar,label);
 // Do not erase the company name, icon or hidden official store identifier.
}
const dictionary={
 'تنظیمات اصلی و امنیت':'Basic settings and security',
 'بخش‌های مهم در بالا قرار دارند. تنظیمات پیشرفته در پایین صفحه است.':'Important settings are at the top. Advanced options are below.',
 'بخش پیشنهادی 11':'11 recommended sections',
 'بخش غیرضروری 3':'3 optional sections',
 'فعال‌سازی مخصوص تجارت':'Business-specific configuration',
 'کارهای روزمره مخصوص صنف':'Industry-specific daily operations',
 'مدیریت همکاران (افزودن و حذف)':'Manage colleagues (add or remove)',
 'تنظیمات و پشتیبان‌گیری':'Settings and backup',
 'معلومات فروشگاه، حساب‌ها و حفظ اطلاعات':'Store details, accounts and data protection',
 'فونت نوشته‌های سیستم':'System font',
 'نوع فونت':'Font choice',
 'امنیت و ورود':'Security and sign-in',
 'اطلاعات فروشگاه':'Store information',
 'معلومات فروشگاه':'Store information',
 'تنظیمات و امنیت':'Settings and security',
 'تنظیمات پیشرفته':'Advanced settings',
 'تغییر نوع تجارت':'Change business type',
 'مدیریت عمومی':'General management',
 'گدام':'Inventory',
 'محصول و گدام':'Products & inventory',
 'اسکن بارکد گدام':'Scan inventory barcode',
 'جست‌وجو بدون تغییر موجودی':'Search without changing stock',
 'بارکد را اسکن کنید یا بنویسید':'Scan or enter a barcode',
 'بارکد را اسکن یا تایپ کنید.':'Scan or type a barcode.',
 'دوربین':'Camera',
 'موجودی':'Stock',
 'قیمت فروش':'Sale price',
 'تعداد انواع محصول':'Product types',
 'قیمت‌ها به:':'Prices in:',
 'جستجوی نام، بارکد اصلی یا اضافی، دسته‌بندی':'Search name, primary or extra barcode, category',
 'محصول جدید':'New product',
 'اصلاح موجودی':'Adjust stock',
 'وارد کردن محصولات':'Import products',
 'نمونه CSV':'CSV template',
 'مجموع موجودی':'Total stock',
 'قرضدار 5':'5 debtors',
 '۵ قرضدار':'5 debtors',
 'آخرین دریافت:':'Latest receipt:',
 'گزارش وضعیت این دستگاه':'Report this device status',
 'دستگاه‌های حساب من':'My account devices',
 'تازه‌سازی دستگاه‌ها':'Refresh devices',
 'در حال دریافت از سرور...':'Loading from server…',
 'در حال دریافت از سرور…':'Loading from server…',
 'فاکتور و چاپ':'Invoices and printing',
 'معلومات قبلی حفظ می‌شوند.':'Existing data is preserved.',
 'حسابداری و گدام':'Accounting and inventory',
 'ذخیره تنظیمات':'Save settings',
 'حفظ تنظیمات':'Save settings',
 'ذخیره طرح فاکتور':'Save invoice design',
 'تنظیمات چاپ':'Print settings',
 'عملیات روزمره':'Daily operations',
 'معلومات مشتری':'Customer information',
 'نام مشتری':'Customer name',
 'شماره تماس مشتری':'Customer phone',
 'قفل فوری برنامه':'Lock app now',
 'نصب برنامه':'Install app',
 'همگام‌سازی':'Sync',
 'تاریخچه امنیتی':'Security history',
 'تغییر رمز خصوصی':'Change private PIN',
 'تغییر نام فروشگاه':'Change store name',
 'وضعیت اشتراک':'Subscription status',
 'حساب قرضداران':'Customer debts',
 'آرشیف':'Archive',
 'پشتو':'Pashto',
 'دری':'Dari'
};
const placeholders={
 'بارکد را اسکن کنید یا بنویسید':'Scan or enter barcode',
 'جستجوی نام، بارکد اصلی یا اضافی، دسته‌بندی':'Search by name, barcode or category',
 'جستجو: نام، بارکد اصلی یا اضافی، دسته‌بندی':'Search name, barcode or category',
 'نام جدید فروشگاه':'New store name'
};
const shouldTranslate=(node)=>{
 const parent=node.parentElement;if(!parent)return false;
 if(parent.closest('textarea,[contenteditable],option,select,.z76-profile-card,#z78-user,.product-card,.customer-card,.debt-card,[data-customer-id],[data-product-id],[data-transaction-id],.z652-item'))return false;
 const root=parent.closest('#content,#overlay');if(!root)return false;
 // Only static UI contexts: never change customer/ledger names, receipts or entered notes.
 return !!parent.closest('button,label,h1,h2,h3,h4,.z638-scanner-head,.z638-warehouse-result,.settings-card,.z76-settings-group,summary,.z652-title,.z652-status,.form-section-title');
};
function i18n(){
 const en=locale()==='en';
 const roots=[q('#content'),q('#overlay')].filter(Boolean);
 for(const root of roots){
  for(const input of all('input[placeholder]',root)){const original=input.dataset.z78OriginalPlaceholder||input.getAttribute('placeholder');if(!input.dataset.z78OriginalPlaceholder)input.dataset.z78OriginalPlaceholder=original;
   const next=en&&placeholders[original]?placeholders[original]:original;
   if(input.placeholder!==next)input.placeholder=next;
  }
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
   if(!shouldTranslate(node))continue;
   const src=node.__z78Source||node.textContent;const clean=String(src).trim();if(!clean)continue;
   if(!Object.prototype.hasOwnProperty.call(dictionary,clean))continue;
   if(!node.__z78Source)node.__z78Source=src;
   const next=en?dictionary[clean]:src;
   if(node.textContent!==next)node.textContent=next;
  }
 }
}
let activeMenu=null;
function allSections(){
 const phrase=/^(?:All sections|همه بخش‌ها|ټولې برخې)$/i;
 const headers=all('h1,h2,h3,strong,div,span').filter(n=>n.childElementCount===0&&phrase.test(n.textContent.trim()));
 let best=null;
 for(const h of headers){
  if(!h.getBoundingClientRect().width)continue;
  let el=h.parentElement;
  for(let i=0;el&&i<6;i++,el=el.parentElement){
   if(el===document.body||el===q('#content')||el.id==='app')break;
   if(el.querySelectorAll('button,[data-go],a').length>=6&&el.querySelectorAll('button,[data-go],a').length<=85){best=el;break}
  }
  if(best)break;
 }
 if(activeMenu&&activeMenu!==best){activeMenu.classList.remove('z78-full-menu');activeMenu=null}
 if(best&&!best.classList.contains('z78-full-menu')){best.classList.add('z78-full-menu');activeMenu=best}
}
function shrinkDevices(){
 for(const card of all('.z652-card')){
  if(card.dataset.z78Done)return;card.dataset.z78Done='1';
  card.classList.add('z78-device-compact');
 }
}
let pending=false;
function run(){pending=false;try{headerProfile();allSections();shrinkDevices();i18n()}catch(e){console.warn('V65.78 UI-only render:',e)}}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(run)}
function start(){
 const main=q('#content');if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true});
 const overlay=q('#overlay');if(overlay)new MutationObserver(schedule).observe(overlay,{childList:true,subtree:true});
 q('#zaviTopLanguage')?.addEventListener('change',schedule);
 window.addEventListener('storage',e=>{if(e.key?.startsWith(k))schedule()});
 window.addEventListener('zavi-profile-saved',schedule);
 ['zavi-cloud-session-changed','zavi-cloud-workspace-selected','zavi-business-updated'].forEach(e=>window.addEventListener(e,schedule));
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
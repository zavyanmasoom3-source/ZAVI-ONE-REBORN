/* ZAVI ONE v19 - Customer phonebook using the EXISTING tenant-scoped db.contacts.
   Adds no new independent localStorage keys, tables, or permissions.
   Saving uses core commit() -> local backup + cloud sync, including offline changes.
*/
(()=>{'use strict';
let searchTerm='';let editId=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=(fa,en,ps)=>{const lang=window.zaviPublicLanguage?.()||'fa-AF';return lang==='en'?en:lang==='ps-AF'?ps:fa;};
const readablePhone=phone=>String(phone||'').trim().replace(/[^0-9+() .\-]/g,'');
const dialPhone=phone=>readablePhone(phone).replace(/[^0-9+]/g,'');
const whatsAppPhone=phone=>{let raw=String(phone||'').trim(),n=dialPhone(raw);if(n.startsWith('+'))n=n.slice(1);else if(n.startsWith('00'))n=n.slice(2);else if(/^07\d{8}$/.test(n))n='93'+n.slice(1);else if(/^7\d{8}$/.test(n))n='93'+n;else return '';return /^\d{8,15}$/.test(n)?n:'';};
function contacts(){return (Array.isArray(db.contacts)?db.contacts:[]).filter(c=>c.type==='customer'||c.type==='both'||!c.type);}
function view(){
 const arr=contacts().filter(c=>[c.name,c.phone,c.note].join(' ').toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase())).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
 const rows=arr.map(c=>{
  const phone=readablePhone(c.phone),tel=dialPhone(phone),wa=whatsAppPhone(c.whatsappPhone||c.phone);
  return `<article class="zavi-phone-card"><div class="zavi-phone-main"><div class="zavi-phone-avatar">${esc((c.name||'?').slice(0,1))}</div><div><strong data-customer-content>${esc(c.name)}</strong><div class="zavi-phone-number" dir="ltr" data-customer-content>${esc(phone||'—')}</div>${c.note?`<small data-customer-content>${esc(c.note)}</small>`:''}</div></div><div class="zavi-phone-actions">${tel?`<a class="btn tiny" href="tel:${esc(tel)}">☎ ${label('تماس','Call','زنګ')}</a>`:''}${wa?`<a class="btn tiny" target="_blank" rel="noopener noreferrer" href="https://wa.me/${encodeURIComponent(wa)}">${label('واتساپ','WhatsApp','واټس‌اپ')}</a>`:''}<button class="btn tiny subtle" type="button" data-phonebook-edit="${esc(c.id)}">${label('ویرایش','Edit','سمول')}</button></div></article>`;
 }).join('');
 const desc=label('شماره‌های مشتریان در حساب همان فروشگاه ذخیره می‌شوند.','Customer numbers are saved in the same store account.','د پېرودونکو شمېرې د همدې دوکان په حساب کې ساتل کېږي.');
 return `<div class="page-head"><div><h2>${label('دفترچه تماس مشتریان','Customer contacts','د پېرودونکو اړیکې')}</h2><p>${desc}</p></div></div>
 <section class="card zavi-phonebook"><form id="zaviPhonebookForm" autocomplete="off"><div class="zavi-phonebook-head"><h3>${label('ثبت شماره مشتریان','Save customer phone numbers','د پېرودونکو شمېرې ثبتول')}</h3><span class="pill blue">${contacts().length} ${label('شماره','contacts','اړیکې')}</span></div>
 <div class="zavi-phone-form"><label>${label('نام مشتری','Customer name','د پېرودونکي نوم')} <b>*</b><input name="name" required maxlength="100" autocomplete="off" placeholder="${label('نام مشتری','Customer name','د پېرودونکي نوم')}"></label>
 <label>${label('شماره تماس','Phone number','د اړیکې شمېره')} <b>*</b><input name="phone" required inputmode="tel" type="tel" dir="ltr" maxlength="40" autocomplete="tel" placeholder="0700 123 456"></label>
 <label>${label('واتساپ (اختیاری)','WhatsApp number (optional)','د واټس اپ شمېره (اختیاري)')}<input name="whatsappPhone" inputmode="tel" type="tel" dir="ltr" maxlength="40" placeholder="+93 700 123 456"></label>
 <label>${label('یادداشت (اختیاری)','Notes (optional)','یادښت (اختیاري)')}<input name="note" maxlength="450" placeholder="${label('یادداشت','Notes','یادښت')}"></label>
 <button type="submit" class="btn primary">＋ ${editId?label('ذخیره تغییرات','Save changes','بدلونونه خوندي کړئ'):label('ذخیره تماس','Save contact','اړیکه خوندي کړئ')}</button></div></form>
 <div class="zavi-phonebook-head"><h3>${label('فهرست تماس‌ها','Contacts directory','د اړیکو لړلیک')}</h3><button type="button" class="btn tiny subtle" data-action="export_contacts">${label('دانلود CSV','Export CSV','CSV ښکته کول')}</button></div>
 <div class="zavi-phone-search"><label>${label('جستجوی تماس','Search contacts','اړیکې ولټوئ')} <input type="search" id="zaviPhoneSearch" value="${esc(searchTerm)}" placeholder="${label('جستجو بر اساس نام یا شماره','Search by name or number','په نوم یا شمېره لټون')}"></label></div>
 <div id="zaviPhoneResults" class="zavi-phone-grid">${rows||`<p class="muted">${label('شماره‌ای ثبت نشده است.','No contacts saved yet.','تر اوسه اړیکې نه دي ثبت شوي.')}</p>`}</div></section>`;
}
window.zaviPhonebookRender=view;
function notify(fa,en,ps){if(typeof toast==='function')toast(label(fa,en,ps));}
function submit(e){if(e.target.id!=='zaviPhonebookForm')return;e.preventDefault();
 const f=e.target.elements;
 const name=String(f.namedItem('name').value||'').trim();
 const phone=readablePhone(f.namedItem('phone').value);const whatsappPhone=readablePhone(f.namedItem('whatsappPhone').value);
 const note=String(f.namedItem('note').value||'').trim();
 if(!name){notify('نام مشتری الزامی است.','Customer name is required.','د پېرودونکي نوم اړین دی.');return;}
 if(!/^[+()0-9 .\-]{7,40}$/.test(phone)||dialPhone(phone).replace(/\D/g,'').length<7){notify('شماره تماس معتبر وارد کنید.','Enter a valid phone number.','سمه د اړیکې شمېره ولیکئ.');return;}
 if(contacts().some(c=>c.id!==editId&&dialPhone(c.phone).replace(/\D/g,'')===dialPhone(phone).replace(/\D/g,''))){notify('این شماره قبلاً ثبت شده است.','This number is already saved.','دا شمېره مخکې ثبت شوې ده.');return;}
 if(whatsappPhone && (!/^[+()0-9 .\-]{7,40}$/.test(whatsappPhone)||dialPhone(whatsappPhone).replace(/\D/g,'').length<7)){notify('شماره واتساپ معتبر وارد کنید.','Enter a valid WhatsApp number.','د واټس اپ سمه شمېره ولیکئ.');return;}
 if(typeof commit!=='function'||typeof newId!=='function'){notify('ثبت اطلاعات در دسترس نیست.','Saving is unavailable.','د معلوماتو ساتل نشته.');return;}
 const changed=editId;
 if(commit(next=>{if(changed){const item=next.contacts.find(c=>c.id===changed);if(item)Object.assign(item,{name,phone,whatsappPhone,note});}else next.contacts.push({id:newId('c'),name,phone,whatsappPhone,note,type:'customer',openingReceivable:0,openingPayable:0,reminderDate:''})})){editId=null;notify('تماس با موفقیت ذخیره شد.','Contact saved successfully.','اړیکه په بریالیتوب ثبت شوه.');if(typeof render==='function')render();}
}
document.addEventListener('submit',submit,true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-phonebook-edit]');if(!b)return;e.preventDefault();const item=contacts().find(c=>c.id===b.dataset.phonebookEdit);if(!item)return;editId=item.id;
 const form=document.getElementById('zaviPhonebookForm');if(!form)return;for(const key of ['name','phone','whatsappPhone','note']){const field=form.elements.namedItem(key);if(field)field.value=item[key]||'';}form.scrollIntoView({block:'start',behavior:'smooth'});form.elements.namedItem('name')?.focus();});
document.addEventListener('input',e=>{if(e.target.id!=='zaviPhoneSearch')return;
 searchTerm=e.target.value;const focus=e.target,position=focus.selectionStart;
 const root=document.getElementById('zaviPhoneResults');
 if(!root)return;
 // Update results only to preserve input focus and keyboard behavior.
 const tmp=document.createElement('div');tmp.innerHTML=view();root.innerHTML=tmp.querySelector('#zaviPhoneResults')?.innerHTML||'';
 try{focus.setSelectionRange(position,position)}catch(_){ }
});
})();

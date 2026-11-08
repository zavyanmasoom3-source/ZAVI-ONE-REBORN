/* ZAVI ONE 65.25: guided, searchable, accessible trade-type selection.
   Only prepares draft inputs; Save requires the existing authenticated owner flow. */
(()=>{'use strict';
 function start(){
  const kit=window.ZaviIndustryKit6525;
  const select=document.getElementById('type'),target=document.getElementById('z6525BusinessChooser');
  if(!kit||!select||!target)return;
  const safe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const available=[...select.options].map(x=>x.value);
  // Cards replace the oversized native dropdown. If JS is unavailable, original select remains.
  if(select.parentElement)select.parentElement.hidden=true;
  target.innerHTML=`<div class="z6525-picker-heading"><h2>✦ کسب‌وکار خود را انتخاب کنید</h2><p>نوع تجارت را انتخاب کنید؛ مسیرهای کاری و گزینه‌های پیشنهادی همان صنف آماده می‌شوند. برای ذخیره نهایی، دکمه پایین را بزنید.</p><label>جستجوی نوع تجارت<input id="z6525BusinessSearch" type="search" placeholder="مثل زرگری، دواخانه، موبایل، مواد غذایی ..." autocomplete="off" aria-label="جستجوی کسب‌وکار"></label></div><div id="z6525BusinessGrid" class="z6525-business-grid" role="group" aria-label="صنف‌های کسب‌وکار"></div><div id="z6525BusinessPreview" class="z6525-business-preview" aria-live="polite"></div><button id="z6525BusinessSave" class="z6525-business-save" type="button">ذخیره و آماده‌سازی کسب‌وکار انتخاب‌شده</button>`;
  const search=target.querySelector('#z6525BusinessSearch'),grid=target.querySelector('#z6525BusinessGrid'),preview=target.querySelector('#z6525BusinessPreview');
  function renderChoices(){const q=search.value.trim().toLocaleLowerCase();grid.innerHTML=kit.types.filter(x=>available.includes(x)&&(!q||kit.profile(x).label.toLocaleLowerCase().includes(q)||x.includes(q))).map(x=>{const p=kit.profile(x);return `<button type="button" class="z6525-type-choice ${select.value===x?'is-selected':''}" data-business="${safe(x)}" aria-pressed="${select.value===x}"><span class="z6525-choice-icon">${p.icon}</span><strong>${safe(p.label)}</strong><small>${safe(p.intro)}</small></button>`;}).join('')||'<p>صنفی با این نام یافت نشد.</p>'}
  function previewSelection(){const p=kit.profile(select.value);preview.innerHTML=`<h3>${p.icon} کارهای روزمره ${safe(p.label)}</h3><ol>${p.steps.map(x=>`<li>${safe(x)}</li>`).join('')}</ol><p><b>فورم اختصاصی:</b> ${p.fields.map(x=>safe(x.label)).join('، ')}</p><small>فورم تخصصی در داشبورد برنامه اصلی فعال می‌شود. این تنظیمات به‌تنهایی سند مالی یا سند طبی ایجاد نمی‌کنند.</small>`;renderChoices()}
  grid.addEventListener('click',e=>{const button=e.target.closest('[data-business]');if(!button)return;select.value=button.dataset.business;select.dispatchEvent(new Event('change',{bubbles:true}));});
  search.addEventListener('input',renderChoices);
  select.addEventListener('change',()=>{
   // Suggest modules in the draft (never auto-write owner permissions / accounting).
   const apply=document.getElementById('z645Recommended');if(apply)apply.click();
   previewSelection();
  });
  target.querySelector('#z6525BusinessSave').addEventListener('click',()=>document.getElementById('saveProfile')?.click());
  previewSelection();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

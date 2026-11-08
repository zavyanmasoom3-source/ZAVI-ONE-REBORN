/* ZAVI ONE ADMIN V64.3: local release metadata viewer, not a deploy manager.
   No سرور مرکزی writes, no credentials, no service-role access. */
(function(win){'use strict';if(!win?.document)return;const doc=win.document;
 function init(){const app=doc.getElementById('appScreen'),bar=app?.querySelector('.top-actions');if(!bar||doc.getElementById('z643UpdateOpen'))return;
  const btn=doc.createElement('button');btn.id='z643UpdateOpen';btn.type='button';btn.className='icon-btn z643-update-open';btn.textContent='نسخه سیستم';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','z643UpdatePanel');bar.insertBefore(btn,bar.firstChild);
  const panel=doc.createElement('section');panel.id='z643UpdatePanel';panel.className='z643-update-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','مرکز بررسی نسخه ADMIN');panel.setAttribute('aria-modal','false');panel.hidden=true;
  const title=doc.createElement('h3');title.textContent='ZAVI UPDATE CENTER';const desc=doc.createElement('p');desc.textContent='این بخش فقط معلومات نسخه فعلی فایل‌ها را می‌خواند؛ انتشار، نصب یا تغییر اشتراک انجام نمی‌دهد.';
  const status=doc.createElement('p');status.id='z643UpdateStatus';status.setAttribute('role','status');status.textContent='برای دیدن معلومات نسخه، پنجره را باز کنید.';
  const close=doc.createElement('button');close.type='button';close.className='button ghost';close.textContent='بستن';
  panel.append(title,desc,status,close);app.append(panel);
  async function show(){if(app.hidden)return;panel.hidden=false;btn.setAttribute('aria-expanded','true');status.textContent='در حال بررسی فایل محلی نسخه...';close.focus();
   try{const res=await win.fetch('./zavi-release.json',{cache:'no-store',credentials:'same-origin'});if(!res.ok)throw Error('not available');const raw=await res.json();if(panel.hidden)return;
    const v=String(raw.staging_version||raw.version||'نامعلوم').slice(0,40);
    status.textContent='نسخه فایل ADMIN: '+v+' — '+(raw.production_deployed===true?'این فایل ادعای انتشار دارد؛ وضعیت سرور را مستقل بررسی کنید.':'نسخه آزمایشی؛ انتشار عمومی تأیید نشده است.')+' بک‌آپ دیتابیس و بازیابی باید جداگانه تأیید شوند.';
   }catch(_){if(!panel.hidden)status.textContent='فایل وضعیت نسخه در دسترس نیست. این وضعیت به معنی خرابی حساب‌ها نیست.';}}
  function hide(){panel.hidden=true;btn.setAttribute('aria-expanded','false');btn.focus();}
  btn.addEventListener('click',()=>panel.hidden?show():hide());close.addEventListener('click',hide);
  doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)hide();});
  new MutationObserver(()=>{if(app.hidden){panel.hidden=true;btn.setAttribute('aria-expanded','false');}}).observe(app,{attributes:true,attributeFilter:['hidden']});
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window!=='undefined'?window:null);

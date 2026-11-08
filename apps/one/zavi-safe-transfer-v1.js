/* REBORN v1: safe, explicit migration guide. NEVER clears/rekeys accounting storage. */
(() => {
  'use strict';
  if (window.ZaviSafeTransferV1) return;
  const L = {
    'fa-AF': {
      title: 'انتقال امن از APK قبلی', description: 'معلومات حسابداری را با فایل پشتیبان منتقل کنید؛ نصب این نسخه، برنامه قدیمی را آپدیت نمی‌کند.',
      steps: '۱. در برنامه قدیمی از بخش پشتیبان یک فایل تازه دریافت کنید. ۲. در این برنامه با حساب همان مالک وارد شوید. ۳. فایل را بررسی و بازیابی کنید.',
      old: 'برنامه قبلی را پاک نکنید؛ نخست تعداد فاکتورها، موجودی و صندوق را در نصب جدید مقایسه کنید.',
      export: 'پشتیبان رمزدار این دستگاه', import: 'انتخاب فایل برای انتقال',
      local: 'تنها برای آزمایش آفلاین و بدون اتصال به حساب وارد کنم',
      owner: 'حساب مالک متصل است؛ فایل پشتیبان باید مربوط به همین فروشگاه باشد.',
      guest: 'حساب فروشگاه متصل نیست. برای انتقال اصلی، نخست با حساب مالک وارد شوید.',
      colleague: 'فقط مالک فروشگاه اجازه بازیابی کامل دارد.',
      blocked: 'برای واردکردن اطلاعات واقعی، نخست حساب مالک را متصل کنید؛ گزینهٔ آزمایش محلی برای اطلاعات اصلی توصیه نمی‌شود.',
      confirm: 'در حالت محلی، اطلاعات به حساب ابری وصل نمی‌شود و ممکن است پس از ورود به حساب دیده نشود. فقط در صورت داشتن فایل پشتیبان دیگر ادامه دهید.',
      invalid: 'فایل باید JSON یا ZAVIBAK و حداکثر ۲۵ مگابایت باشد.',
      checking: 'فایل برای بررسی امنیتی به ابزار بازیابی سپرده شد؛ نتیجه را در پیام برنامه ببینید.',
      unavailable: 'ابزار پشتیبان در این صفحه آماده نیست.'
    },
    'ps-AF': {
      title: 'له پخواني APK څخه خوندي لېږد', description: 'د حسابدارۍ معلومات د بیک اپ له لارې ولېږدوئ؛ دا نصب پخوانی APK نه تازه کوي.',
      steps: '۱. په پخواني اپ کې بیک اپ واخلئ. ۲. په نوي اپ کې د هماغه مالک حساب ته ننوځئ. ۳. فایل وګورئ او بېرته یې راوګرځوئ.',
      old: 'پخوانی اپ مه پاکوئ؛ لومړی بیلونه، موجودي او نغدې پیسې پرتله کړئ.',
      export: 'د دې وسیلې خوندي بیک اپ', import: 'د لېږد فایل غوره کړئ',
      local: 'یوازې د آفلاین ازموینې لپاره پرته له حسابه راوګرځوئ',
      owner: 'د مالک حساب وصل دی؛ بیک اپ باید د همدې دوکان وي.',
      guest: 'د دوکان حساب نه دی وصل شوی؛ لومړی د مالک حساب ته ننوځئ.',
      colleague: 'یوازې مالک ټول معلومات بېرته راوګرځولی شي.',
      blocked: 'د اصلي معلوماتو لپاره لومړی د مالک حساب وصل کړئ.',
      confirm: 'محلي راوګرځول له کلاوډ سره نه نښلي. یوازې که بله خوندي کاپي لرئ دوام ورکړئ.',
      invalid: 'فایل باید JSON یا ZAVIBAK او تر ۲۵MB کوچنی وي.',
      checking: 'فایل د امنیتي ارزونې لپاره وسپارل شو؛ پایله په اپ کې وګورئ.',
      unavailable: 'د بیک اپ وسیله چمتو نه ده.'
    },
    'en': {
      title: 'Safe transfer from the older APK', description: 'Move accounting records with a verified backup file. This install does not update the old APK.',
      steps: '1. Export a fresh backup in your old app. 2. Sign in as the same business owner here. 3. Select and verify the backup.',
      old: 'Keep the old app installed. Verify invoices, inventory and cash in the new installation before retiring it.',
      export: 'Encrypted backup of this device', import: 'Choose backup file',
      local: 'Local offline test only, without cloud account',
      owner: 'Owner account connected. The file must belong to this workspace.',
      guest: 'Business account is not connected. Sign in as the owner for a real migration.',
      colleague: 'Only the business owner may restore all records.',
      blocked: 'Connect the business owner account first; local testing is not recommended for real records.',
      confirm: 'Local restoration is not attached to a cloud business. It may become invisible after sign-in. Continue only with another verified backup.',
      invalid: 'Use JSON or ZAVIBAK, no larger than 25 MB.',
      checking: 'Backup sent to the existing verified-restore process; review its result in the app.',
      unavailable: 'Backup tools are not available on this screen.'
    }
  };
  const $ = sel => document.querySelector(sel);
  const lang = () => L[document.documentElement.lang] || L['fa-AF'];
  const role = () => {
    try {
      if (!window.zaviTenantIsBound?.()) return 'unbound';
      const s = window.zaviCloudRestoreInfo?.() || {};
      const user = window.zaviCloudGetAuthSession?.()?.user?.id;
      return s.role === 'owner' && !!user && !!s.workspace ? 'owner' : 'colleague';
    } catch (_) { return 'colleague'; }
  };
  function message(root, txt) {
    const el = root.querySelector('[data-zavi-transfer-status]');
    if (el) el.textContent=txt;
  }
  function permitted(root) {
    const t=lang();
    const level=role();
    if (level==='owner') return true;
    if (level==='colleague') {message(root,t.colleague);return false;}
    if (!root.querySelector('[data-zavi-transfer-local]')?.checked) {
      message(root,t.blocked);return false;
    }
    if (!window.confirm(t.confirm)) {message(root,t.blocked);return false;}
    return true;
  }
  function create() {
    const card=document.createElement('section');
    card.id='zavi-safe-transfer-v1';
    card.className='zavi-safe-transfer-v1';
    card.setAttribute('aria-label','Safe APK transfer');
    card.innerHTML='<h3 data-zavi-transfer-title></h3><p data-zavi-transfer-description></p>'+
      '<p class="zavi-safe-transfer-steps" data-zavi-transfer-steps></p>'+
      '<p data-zavi-transfer-old></p>'+
      '<p class="zavi-safe-transfer-state" data-zavi-transfer-owner></p>'+
      '<label class="zavi-safe-transfer-local"><input type="checkbox" data-zavi-transfer-local><span data-zavi-transfer-local-label></span></label>'+
      '<div class="zavi-safe-transfer-actions">'+
      '<button type="button" data-zavi-transfer-export></button>'+
      '<button type="button" data-zavi-transfer-import></button></div>'+
      '<input type="file" data-zavi-transfer-file accept=".json,.zavibak,application/json" hidden>'+
      '<p role="status" aria-live="polite" data-zavi-transfer-status></p>';
    card.addEventListener('click', event => {
      const t=lang();
      if (event.target.closest('[data-zavi-transfer-export]')) {
        if (typeof window.backupSecure !== 'function') {message(card,t.unavailable);return;}
        try { const p=window.backupSecure();if(p?.catch)p.catch(()=>message(card,t.unavailable)); }
        catch (_) { message(card,t.unavailable); }
      } else if(event.target.closest('[data-zavi-transfer-import]')) {
        if (!permitted(card)) return;
        card.querySelector('[data-zavi-transfer-file]').click();
      }
    });
    card.querySelector('[data-zavi-transfer-file]').addEventListener('change', event=>{
      const input=event.currentTarget;
      const file=input.files?.[0];
      input.value='';
      if (!file) return;
      const t=lang();
      if (!permitted(card)) return;
      if (!/\.(?:json|zavibak)$/i.test(file.name||'') || file.size>25*1024*1024 || file.size<2) {
        message(card,t.invalid);return;
      }
      if (typeof window.importBackup!=='function') {message(card,t.unavailable);return;}
      // Actual hash, scope, tenant identity, confirmations and local storage
      // validation remain in the canonical importBackup(FileReader) implementation.
      try {
        window.importBackup(file);
        message(card,t.checking);
      } catch (_) { message(card,t.unavailable); }
    });
    return card;
  }
  function render(card) {
    const t=lang(),level=role();
    const assign=(field,value)=>{
      const el=card.querySelector('[data-zavi-transfer-'+field+']');
      if(el)el.textContent=value;
    };
    assign('title',t.title);assign('description',t.description);
    assign('steps',t.steps);assign('old',t.old);
    assign('owner',level==='owner'?t.owner:level==='colleague'?t.colleague:t.guest);
    assign('local-label',t.local);
    assign('export',t.export);assign('import',t.import);
    const local=card.querySelector('[data-zavi-transfer-local]')?.closest('label');
    if(local)local.hidden=level!=='unbound';
  }
  function attach() {
    const host=$('#content'); if(!host)return;
    const settings=document.body.dataset.zaviPage==='settings' ||
      host.classList.contains('zpdf-settings') ||
      host.querySelector('[data-module="settings"]')!==null;
    if(!settings) return;
    let card=host.querySelector('#zavi-safe-transfer-v1');
    if(!card){card=create();host.appendChild(card);}
    render(card);
  }
  let queued=false;
  function schedule() {
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;attach();});
  }
  function boot(){
    const host=$('#content');
    if(host)new MutationObserver(schedule).observe(host,{childList:true,subtree:false});
    document.addEventListener('zavi:page',schedule);
    document.addEventListener('zavi:language-change',schedule);
    document.addEventListener('click',schedule,true);
    schedule();
  }
  window.ZaviSafeTransferV1=Object.freeze({status:role,open:attach});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();

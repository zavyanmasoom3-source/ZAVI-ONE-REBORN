/* ZAVI ONE v65.48: one-time WhatsApp intake ONLY when user clicks CREATE CLOUD ACCOUNT.
   No contact form on login, cloud sync, dashboard, or app restart.
   Contact is sent inside Supabase auth signup metadata; server trigger records it once. */
(()=>{'use strict';
 const locale=()=>{
  const val=String(document.querySelector('#zaviSettingsLanguage,#zaviTopLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();
  return val.startsWith('en')?'en':val.startsWith('ps')?'ps':'fa';
 };
 const lang={
 fa:{heading:'ثبت یک‌باره شماره واتساپ',intro:'این شماره فقط هنگام ایجاد حساب ابری جدید گرفته می‌شود. در ورودهای بعدی دیگر پرسیده نمی‌شود.',country:'کشور و کُد تماس',number:'شماره واتساپ',ack:'موافقم شماره واتساپ من برای پشتیبانی و ارتباط مربوط به حساب، در اختیار مدیریت مرکزی ZAVI ONE قرار گیرد.',note:'شماره شما به همکاران فروشگاه یا مشتریان دیگر نمایش داده نمی‌شود. پیام واتساپ را مدیر به‌صورت دستی ارسال می‌کند.',go:'ثبت شماره و ایجاد حساب',cancel:'انصراف',required:'شماره واتساپ معتبر را وارد کنید.',privacy:'برای ادامه، اطلاع‌رسانی درباره کاربرد شماره را تأیید کنید.',badCountry:'کد کشور انتخاب نشده است.',closed:'ثبت‌نام لغو شد.'},
 ps:{heading:'د واټساپ شمېره یو ځل ثبت کړئ',intro:'دا شمېره یوازې د نوي کلاوډ حساب د جوړولو پر وخت اخېستل کېږي، بیا نه غوښتل کېږي.',country:'هېواد او نړیوال کوډ',number:'د واټساپ شمېره',ack:'زه موافق یم چې د حساب د ملاتړ لپاره زما د واټساپ شمېره یوازې له مرکزي ادارې سره شریکه شي.',note:'نور پېرودونکي او د دوکان همکاران دا شمېره نه شي لیدلی. د ادارې پیغامونه په لاس استول کېږي.',go:'شمېره ثبت او حساب جوړ کړئ',cancel:'بېرته',required:'سمه واټساپ شمېره ولیکئ.',privacy:'د شمېره د کارونې خبرتیا تایید کړئ.',badCountry:'هېواد وټاکئ.',closed:'نوم‌لیکنه لغوه شوه.'},
 en:{heading:'Add WhatsApp once at signup',intro:'Your WhatsApp is requested only when creating a new cloud account—not at future logins.',country:'Country and dial code',number:'WhatsApp number',ack:'I agree to share my WhatsApp number with ZAVI ONE central administration for account support and communication.',note:'Store colleagues and other customers cannot access this number. The administrator initiates WhatsApp chats manually.',go:'Save WhatsApp & create account',cancel:'Cancel',required:'Enter a valid WhatsApp number.',privacy:'Acknowledge how your number will be used.',badCountry:'Select a country.',closed:'Signup cancelled.'}
 };
 const esc=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let countries=null,pending=null;
 async function loadCountries(){
  if(countries)return countries;
  const r=await fetch('./zavi-country-dials-v6547.json',{cache:'force-cache'});
  if(!r.ok)throw Error('Country dial code list unavailable');
  const list=await r.json();
  if(!Array.isArray(list)||list.length<200)throw Error('Incomplete country dial codes');
  countries=list.filter(v=>Array.isArray(v)&&/^[A-Z]{2}$/.test(v[0])&&/^[0-9]{1,5}$/.test(v[1]));
  return countries;
 }
 const digits=x=>String(x||'').replace(/[۰-۹]/g,x=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[٠-٩]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(x)));
 function e164(value,iso){
  const code=countries?.find(x=>x[0]===iso)?.[1];
  if(!code)return null;
  let s=digits(value).trim().replace(/[\s().\u200e\u200f-]/g,'');
  if(/^00/.test(s))s='+'+s.slice(2);
  if(!s.startsWith('+'))s='+'+code+s.replace(/^0+/,'');
  return /^\+[1-9][0-9]{5,14}$/.test(s)?s:null;
 }
 async function collect(){
  if(pending)return pending;
  pending=(async()=>{
   await loadCountries();
   const t=lang[locale()],old=document.getElementById('zavi-signup-once-v6548');
   if(old)old.remove();
   const host=document.createElement('div');
   host.id='zavi-signup-once-v6548';
   host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');
   host.setAttribute('aria-label',t.heading);
   const displayNames=typeof Intl.DisplayNames==='function'?new Intl.DisplayNames([locale()==='en'?'en':locale()==='ps'?'ps-AF':'fa-AF'],{type:'region'}):null;
   let options=countries.map(v=>{
    let name=v[0];try{name=displayNames?.of(v[0])||v[0]}catch(_){}
    return '<option value="'+esc(v[0])+'">'+esc(name)+' (+'+v[1]+')</option>';
   }).join('');
   host.innerHTML='<form class="zavi-signup-once-card" novalidate><header><h2>'+esc(t.heading)+'</h2><button type="button" data-close aria-label="'+esc(t.cancel)+'">✕</button></header><p>'+esc(t.intro)+'</p><label>'+esc(t.country)+'<select name="country" required>'+options+'</select></label><label>'+esc(t.number)+'<input name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" maxlength="26" required dir="ltr" placeholder="+93700123456"></label><label class="zavi-signup-once-ack"><input name="ack" type="checkbox" required><span>'+esc(t.ack)+'</span></label><p class="zavi-signup-once-note">'+esc(t.note)+'</p><p class="zavi-signup-once-error" role="alert" hidden></p><footer><button type="button" data-close>'+esc(t.cancel)+'</button><button type="submit" class="zavi-signup-once-submit">'+esc(t.go)+'</button></footer></form>';
   document.body.appendChild(host);
   const form=host.querySelector('form'),country=form.elements.country,num=form.elements.whatsapp,consent=form.elements.ack,error=host.querySelector('.zavi-signup-once-error');
   country.value='AF';
   function showError(msg){error.hidden=false;error.textContent=msg;num.setAttribute('aria-invalid','true')}
   return await new Promise((resolve,reject)=>{
    let closed=false;
    const finish=(value,reason)=>{
     if(closed)return;closed=true;
     document.removeEventListener('keydown',escapeClose,true);
     host.remove();value?resolve(value):reject(Error(reason||t.closed));
    };
    const escapeClose=e=>{if(e.key==='Escape'){e.stopPropagation();finish(null,t.closed)}};
    document.addEventListener('keydown',escapeClose,true);
    host.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>finish(null,t.closed)));
    form.addEventListener('submit',e=>{
     e.preventDefault();error.hidden=true;num.removeAttribute('aria-invalid');
     const wa=e164(num.value,country.value);
     if(!wa)return showError(t.required);
     if(!consent.checked)return showError(t.privacy);
     const data={whatsapp_e164:wa,phone_e164:wa,country_iso:country.value,contact_opt_in:true};
     finish(data);
    });
    setTimeout(()=>num.focus({preventScroll:true}),50);
   });
  })();
  try{return await pending}finally{pending=null}
 }
 const st=document.createElement('style');st.id='zavi-signup-once-style-v6548';
 st.textContent='#zavi-signup-once-v6548{position:fixed;inset:0;z-index:2147483000;background:rgba(4,15,34,.87);display:flex;align-items:center;justify-content:center;padding:env(safe-area-inset-top,0px) 12px env(safe-area-inset-bottom,0px);color:#19334d;direction:rtl}#zavi-signup-once-v6548 .zavi-signup-once-card{width:min(500px,100%);max-height:calc(100dvh - 28px);overflow-y:auto;overscroll-behavior:contain;background:#fff;border-radius:20px;padding:20px;box-shadow:0 20px 60px #0009;display:grid;gap:14px}#zavi-signup-once-v6548 header,#zavi-signup-once-v6548 footer{display:flex;justify-content:space-between;align-items:center;gap:10px}#zavi-signup-once-v6548 h2{font-size:19px;color:#153b67;margin:0;line-height:1.55}#zavi-signup-once-v6548 p{font-size:13px;color:#345c76;margin:0;line-height:1.75}#zavi-signup-once-v6548 label{font-size:14px;font-weight:700;display:grid;gap:6px;color:#17344a}#zavi-signup-once-v6548 input[type=tel],#zavi-signup-once-v6548 select{width:100%;max-width:100%;height:47px;background:#fff;color:#122e48;border:1px solid #8baec8;border-radius:10px;padding:8px 12px;box-sizing:border-box;font-size:15px}#zavi-signup-once-v6548 .zavi-signup-once-ack{display:flex;align-items:flex-start;gap:10px;font-weight:600;line-height:1.8;font-size:13px}#zavi-signup-once-v6548 input[type=checkbox]{width:20px;height:20px;min-width:20px;margin-top:3px;accent-color:#0a84b6}#zavi-signup-once-v6548 button{min-height:43px;border:1px solid #b3cde1;padding:8px 12px;border-radius:10px;background:#f4f9ff;color:#174766;font-weight:750;cursor:pointer}#zavi-signup-once-v6548 .zavi-signup-once-submit{background:linear-gradient(110deg,#126fb7,#17a1c4);color:#fff;border-color:#1493b1;flex:1}#zavi-signup-once-v6548 .zavi-signup-once-error{color:#c52c38;font-weight:700}#zavi-signup-once-v6548 header button{min-width:43px}@media(max-width:500px){#zavi-signup-once-v6548 .zavi-signup-once-card{padding:15px}#zavi-signup-once-v6548 footer{flex-wrap:wrap}}';
 (document.head||document.documentElement).appendChild(st);
 window.ZaviSignupOnceV6548=Object.freeze({collect});
})();
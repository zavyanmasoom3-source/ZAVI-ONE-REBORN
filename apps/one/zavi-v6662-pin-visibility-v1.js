/* 66.62 original PIN field: small functional eye, no global skin changes. */
(()=>{
'use strict';
const INPUT='zawiPinOne';
const LOGIN_CSS="\n/* Approved compact V66.62 login only. App screens, auth logic and recovery are untouched. */\n#zawiPrivateGate.zavi66-approved-login{\n --z66-text:#183451;--z66-muted:#5e748d;--z66-edge:#dbe5f1;--z66-field:#fff;\n --z66-card:#fff;--z66-bg:#f4f7fc;\n background:var(--z66-bg)!important;overflow:auto!important;\n padding:clamp(12px,3dvh,24px) 12px!important;align-items:center!important;justify-content:center!important}\n#zawiPrivateGate.zavi66-approved-login::before{display:none!important}\n#zawiPrivateGate.zavi66-approved-login .zawi-auth-card{\n box-sizing:border-box!important;width:min(94vw,390px)!important;max-width:390px!important;\n min-width:0!important;max-height:calc(100dvh - 26px)!important;overflow-y:auto!important;\n padding:19px 21px 16px!important;margin:0 auto!important;border-radius:20px!important;\n background:var(--z66-card)!important;border:1px solid var(--z66-edge)!important;\n box-shadow:0 16px 45px #1f416421!important;direction:inherit!important;\n animation:none!important;color:var(--z66-text)!important}\n#zawiPrivateGate.zavi66-approved-login .zawi-brand-latin{display:none!important}\n#zawiPrivateGate.zavi66-approved-login .zavi-auth-language{\n display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:7px!important;\n margin:0 0 12px!important;width:100%!important;color:var(--z66-muted)!important;font-size:12px!important}\n#zawiPrivateGate.zavi66-approved-login .zavi-auth-language label{color:var(--z66-muted)!important}\n#zawiPrivateGate.zavi66-approved-login #zaviGateLanguage{\n min-height:38px!important;max-width:145px!important;padding:5px 12px!important;\n background:var(--z66-field)!important;border:1px solid var(--z66-edge)!important;\n border-radius:10px!important;color:var(--z66-text)!important;font:700 12px inherit!important}\n#zawiPrivateGate.zavi66-approved-login .zawi-lock-emblem{\n width:60px!important;height:60px!important;border-radius:50%!important;\n margin:2px auto 5px!important;box-shadow:none!important;\n background:transparent!important;border:1px solid var(--z66-edge)!important}\n#zawiPrivateGate.zavi66-approved-login .zawi-lock-emblem img{border-radius:50%!important}\n#zawiPrivateGate.zavi66-approved-login .zavi-gate-eyebrow{\n margin:2px 0 8px!important;text-align:center!important;font-size:11px!important;\n color:var(--z66-muted)!important;font-weight:600!important}\n#zawiPrivateGate.zavi66-approved-login #zawiGateTitle{\n font:800 clamp(18px,4.5vw,21px)/1.4 inherit!important;\n color:var(--z66-text)!important;text-align:center!important;\n margin:7px 0 4px!important;letter-spacing:normal!important}\n#zawiPrivateGate.zavi66-approved-login #zawiGateHelp{\n font-size:12px!important;line-height:1.7!important;color:var(--z66-muted)!important;\n text-align:center!important;margin:0 0 16px!important;max-width:none!important}\n#zawiPrivateGate.zavi66-approved-login .zawi-pin-field{\n position:relative!important;margin:8px 0 10px!important;text-align:start!important}\n#zawiPrivateGate.zavi66-approved-login .zawi-pin-field label{\n display:block!important;font-size:12px!important;line-height:1.55!important;\n color:var(--z66-text)!important;text-align:start!important;margin:0 0 6px!important}\n#zawiPrivateGate.zavi66-approved-login :is(#zawiPinOne,#zawiPinRepeat){\n box-sizing:border-box!important;width:100%!important;min-height:48px!important;height:48px!important;\n padding:9px 12px!important;border:1px solid var(--z66-edge)!important;border-radius:12px!important;\n background:var(--z66-field)!important;color:var(--z66-text)!important;\n font-size:18px!important;box-shadow:none!important;letter-spacing:2px!important}\n#zawiPrivateGate.zavi66-approved-login #zawiPinOne{padding-inline-end:53px!important}\n#zawiPrivateGate.zavi66-approved-login :is(#zawiPinOne,#zawiPinRepeat):focus{\n border-color:#178dcc!important;outline:3px solid #38afd338!important;outline-offset:0!important}\n#zawiPrivateGate.zavi66-approved-login #z639PinProgress,\n#zawiPrivateGate.zavi66-approved-login #z639PinStatus{display:none!important}\n#zawiPrivateGate.zavi66-approved-login #zavi66PinHint{\n display:block!important;margin:5px 1px 0!important;color:var(--z66-muted)!important;\n font-size:11px!important;font-weight:400!important;line-height:1.4!important}\n#zawiPrivateGate.zavi66-approved-login [data-zds-password-toggle=\"zawiPinOne\"]{\n position:absolute!important;inset-inline-end:5px!important;bottom:auto!important;top:22px!important;\n width:42px!important;height:42px!important;min-height:42px!important;\n display:grid!important;place-items:center!important;padding:5px!important;cursor:pointer!important;\n color:var(--z66-muted)!important;background:transparent!important;border:none!important;\n border-radius:10px!important;box-shadow:none!important}\n#zawiPrivateGate.zavi66-approved-login [data-zds-password-toggle=\"zawiPinOne\"] svg{\n display:block;width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.7;\n stroke-linecap:round;stroke-linejoin:round}\n#zawiPrivateGate.zavi66-approved-login [data-zds-password-toggle=\"zawiPinOne\"] .zavi66-eye-slash{display:none}\n#zawiPrivateGate.zavi66-approved-login [data-zds-password-toggle=\"zawiPinOne\"].zavi66-revealed .zavi66-eye-slash{display:block}\n#zawiPrivateGate.zavi66-approved-login #zawiPinError{\n font-size:12px!important;line-height:1.5!important;color:#b32738!important;margin:5px 0!important}\n#zawiPrivateGate.zavi66-approved-login #zawiPinSubmit{\n display:block!important;width:100%!important;min-height:47px!important;\n margin:15px 0 0!important;padding:10px 12px!important;border:none!important;\n border-radius:12px!important;background:linear-gradient(105deg,#2860e2,#12b2d1)!important;\n box-shadow:none!important;color:#fff!important;font:750 14px inherit!important;\n transform:none!important}\n#zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn{\n display:block!important;width:auto!important;max-width:100%!important;min-height:37px!important;\n padding:7px 10px!important;margin:9px auto 0!important;font:600 12px inherit!important;\n background:transparent!important;border:0!important;border-radius:8px!important;\n box-shadow:none!important;color:#2869a4!important}\n#zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn:focus-visible{outline:2px solid #12a9bc!important}\nhtml[data-zavi-theme=\"dark\"] #zawiPrivateGate.zavi66-approved-login,\nhtml[data-zavi-appearance=\"dark\"] #zawiPrivateGate.zavi66-approved-login{\n --z66-text:#f0f5ff;--z66-muted:#c1d0e9;--z66-edge:#48688e;\n --z66-field:#172b4c;--z66-card:#15274a;--z66-bg:#08182d}\nhtml[data-zavi-theme=\"dark\"] #zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn,\nhtml[data-zavi-appearance=\"dark\"] #zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn{color:#88daff!important}\nhtml[data-zavi-theme=\"glass\"] #zawiPrivateGate.zavi66-approved-login,\nhtml[data-zavi-appearance=\"glass\"] #zawiPrivateGate.zavi66-approved-login{\n --z66-text:#f1f8ff;--z66-muted:#d4e5ff;--z66-edge:#7198c4;\n --z66-field:#184571;--z66-card:#1a4479;--z66-bg:#11305f}\nhtml[data-zavi-theme=\"glass\"] #zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn,\nhtml[data-zavi-appearance=\"glass\"] #zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn{color:#a0e9ff!important}\n@media(max-width:380px){\n #zawiPrivateGate.zavi66-approved-login .zawi-auth-card{padding:14px 15px!important;width:min(94vw,365px)!important}\n #zawiPrivateGate.zavi66-approved-login .zawi-lock-emblem{width:52px!important;height:52px!important}\n}\n@media(prefers-reduced-motion:reduce){#zawiPrivateGate.zavi66-approved-login *{transition:none!important;animation:none!important}}\n";

const LABELS={
 'fa-AF':{show:'نمایش رمز',hide:'پنهان‌کردن رمز'},
 'ps-AF':{show:'پټنوم ښکاره کړئ',hide:'پټنوم پټ کړئ'},
 en:{show:'Show password',hide:'Hide password'}
};
function labels(){
 const l=(document.documentElement.lang||'fa-AF').toLowerCase();
 return l.startsWith('ps')?LABELS['ps-AF']:l.startsWith('en')?LABELS.en:LABELS['fa-AF'];
}

const COPY={
 'fa-AF':{
  title:'ورود به ZAVI ONE',tag:'حسابداری امن و آسان',
  help:'رمز خصوصی خود را وارد کنید.',newHelp:'یک رمز خصوصی ۶ تا ۱۲ رقمی بسازید.',
  pin:'رمز ورود',newPin:'رمز جدید',repeat:'تکرار رمز جدید',
  open:'بازکردن سیستم',create:'ایجاد رمز و ورود',forgot:'رمز را فراموش کرده‌اید؟',
  language:'زبان',hint:'۶ تا ۱۲ رقم',newHint:'۶ تا ۱۲ رقم؛ سپس رمز را تکرار کنید.'
 },
 'ps-AF':{
  title:'ZAVI ONE ته ننوتل',tag:'خوندي او اسانه حسابداري',
  help:'خپل شخصي رمز دننه کړئ.',newHelp:'له ۶ تر ۱۲ شمېرو نوی شخصي رمز جوړ کړئ.',
  pin:'د ننوتلو رمز',newPin:'نوی رمز',repeat:'نوی رمز بیا ولیکئ',
  open:'سیستم پرانیستل',create:'رمز جوړول او ننوتل',forgot:'رمز مو هېر شوی؟',
  language:'ژبه',hint:'۶ تر ۱۲ شمېرې',newHint:'۶ تر ۱۲ شمېرې؛ بیا یې تکرار کړئ.'
 },
 en:{
  title:'Sign in to ZAVI ONE',tag:'Secure and simple accounting',
  help:'Enter your private PIN.',newHelp:'Create a private PIN with 6 to 12 digits.',
  pin:'Private PIN',newPin:'New PIN',repeat:'Confirm new PIN',
  open:'Open accounting',create:'Create PIN and enter',forgot:'Forgot your PIN?',
  language:'Language',hint:'6–12 digits',newHint:'6–12 digits, then confirm your PIN.'
 }
};
function getLanguage(){
 const s=String(document.documentElement.lang||'fa-AF').toLowerCase();
 return s.startsWith('en')?'en':s.startsWith('ps')?'ps-AF':'fa-AF';
}
function setText(el,value){
 if(el&&el.textContent!==value)el.textContent=value;
}
function renderApprovedLogin(){
 const gate=document.getElementById('zawiPrivateGate');
 if(!gate||!gate.classList.contains('zavi66-approved-login'))return;
 const dict=COPY[getLanguage()];
 const setup=!!document.getElementById('zawiPinRepeat')?.required;
 setText(document.getElementById('zawiGateTitle'),dict.title);
 setText(gate.querySelector('.zavi-gate-eyebrow'),dict.tag);
 setText(document.getElementById('zawiGateHelp'),setup?dict.newHelp:dict.help);
 setText(document.getElementById('zawiPinLabel'),setup?dict.newPin:dict.pin);
 setText(gate.querySelector('#zawiPinRepeatRow label'),dict.repeat);
 setText(document.getElementById('zawiPinSubmit'),setup?dict.create:dict.open);
 setText(document.getElementById('zawiForgotPinBtn'),dict.forgot);
 setText(gate.querySelector('[data-zavi-lang-label]'),dict.language);
 setText(document.getElementById('zavi66PinHint'),setup?dict.newHint:dict.hint);
 const picker=document.getElementById('zaviGateLanguage');
 if(picker&&picker.value!==getLanguage())picker.value=getLanguage();
 gate.dir=getLanguage()==='en'?'ltr':'rtl';
}
function setupApprovedLogin(){
 const gate=document.getElementById('zawiPrivateGate');
 const card=gate?.querySelector('.zawi-auth-card');
 const row=gate?.querySelector('.zawi-pin-field');
 if(!card||!row||gate.classList.contains('zavi66-approved-login'))return;
 gate.classList.add('zavi66-approved-login');
 const style=document.createElement('style');
 style.id='zavi66ApprovedLoginCss';
 style.textContent=LOGIN_CSS;
 document.head.append(style);
 const picker=gate.querySelector('.zavi-auth-language');
 if(picker&&picker!==card.firstElementChild)card.insertBefore(picker,card.firstElementChild);
 const hint=document.createElement('small');
 hint.id='zavi66PinHint';row.append(hint);
 let queued=false;
 const schedule=()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;renderApprovedLogin()});
 };
 gate.addEventListener('change',e=>{
  if(e.target.id!=='zaviGateLanguage')return;
  const value=e.target.value;
  if(!['fa-AF','ps-AF','en'].includes(value))return;
  if(window.ZaviLocaleV22?.set)window.ZaviLocaleV22.set(value);
  else if(window.zaviPublicSetLang)window.zaviPublicSetLang(value);
  else{
   document.documentElement.lang=value;
   document.documentElement.dir=value==='en'?'ltr':'rtl';
  }
  schedule();
 });
 document.addEventListener('zavi:language-change',schedule);
 document.addEventListener('zavi:language-changed',schedule);
 document.addEventListener('zavi-v24-pin-reset-success',schedule);
 new MutationObserver(schedule).observe(document.documentElement,{
  attributes:true,attributeFilter:['lang','dir','class']});
 const monitored=['zawiGateHelp','zawiPinLabel','zawiPinSubmit','zawiForgotPinBtn'];
 const watcher=new MutationObserver(schedule);
 for(const id of monitored){
  const node=document.getElementById(id);
  if(node)watcher.observe(node,{childList:true,characterData:true,subtree:true});
 }
 renderApprovedLogin();
}

function init(){
 setupApprovedLogin();
 const field=document.getElementById(INPUT);
 const parent=field?.closest('.zawi-pin-field');
 if(!parent||parent.querySelector('[data-zds-password-toggle]'))return;
 const button=document.createElement('button');
 button.type='button';
 button.dataset.zdsPasswordToggle=INPUT;
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path class="zavi66-eye-slash" d="M3 3l18 18"/></svg>';
 button.setAttribute('aria-controls',INPUT);
 button.setAttribute('aria-pressed','false');
 button.title=labels().show;
 // Only the input row changes; no legacy theme colors or card sizes modified.
 parent.style.position='relative';
 button.style.cssText='position:absolute;inset-inline-end:7px;bottom:5px;width:40px;height:40px;min-height:40px;border:0;border-radius:10px;background:transparent;color:inherit;font:600 18px system-ui;cursor:pointer;z-index:2';
 field.style.paddingInlineEnd='50px';
 function update(){
  const visible=field.type==='text';
  button.setAttribute('aria-pressed',String(visible));
  button.classList.toggle('zavi66-revealed',visible);
  const words=labels();
  const label=visible?words.hide:words.show;
  button.setAttribute('aria-label',label);
  button.title=label;
 }
 button.addEventListener('click',event=>{
  // Historic V66.62 has a document-wide click delegate; don't let it
  // interpret this eye toggle as a second form/security action.
  event.preventDefault();event.stopPropagation();
  field.type=field.type==='password'?'text':'password';
  update();
 });
 parent.append(button);
 document.addEventListener('zavi:language-change',update);
 document.addEventListener('zavi:language-changed',update);
 const observer=new MutationObserver(update);
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();

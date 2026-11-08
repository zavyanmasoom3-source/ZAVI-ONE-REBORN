/* ZAVI ONE 65.46 — optional native fingerprint unlock; PIN remains available.
   Fingerprint is checked by Android BiometricPrompt; this code never sees biometric data. */
(()=>{'use strict';
const key='zavi_biometric_v6546_enabled',pinKey='zawi_store_personal_pin_v1';
const strings={
 fa:{title:'🔐 ورود و قفل برنامه',desc:'ورود با رمز PIN همیشه فعال است. برای ورود سریع می‌توانید اثر انگشت گوشی را هم فعال کنید.',pin:'رمز PIN (همیشه فعال)',finger:'اثر انگشت گوشی',off:'خاموش — فقط رمز PIN',on:'روشن — رمز PIN یا اثر انگشت',enroll:'فعال‌کردن اثر انگشت',disable:'غیرفعال‌کردن اثر انگشت',unlock:'🔓 بازکردن با اثر انگشت',unsupported:'در این دستگاه اثر انگشت ثبت نشده یا پشتیبانی نمی‌شود.',failed:'تأیید اثر انگشت موفق نبود؛ با رمز PIN وارد شوید.',tryPin:'می‌توانید با رمز PIN وارد شوید.',loading:'در حال بررسی امنیت دستگاه…'},
 ps:{title:'🔐 د ننوتلو او قلف تنظیمات',desc:'د PIN کوډ تل فعال دی. د ګوتې نښه د چټک ننوتلو لپاره هم فعالولی شئ.',pin:'PIN کوډ (تل فعال)',finger:'د ګوتې نښه',off:'بند — یوازې PIN',on:'فعال — PIN یا د ګوتې نښه',enroll:'د ګوتې نښه فعاله کړئ',disable:'د ګوتې نښه بنده کړئ',unlock:'🔓 د ګوتې په نښه پرانیستل',unsupported:'په دې وسیله کې د ګوتې نښه نشته یا ملاتړ نه کېږي.',failed:'د ګوتې نښه ونه پېژندل شوه؛ PIN وکاروئ.',tryPin:'د PIN په وسیله ننوځئ.',loading:'د وسیلې امنیت کتل کېږي…'},
 en:{title:'🔐 App access & lock',desc:'PIN remains available. You can optionally unlock with your device fingerprint.',pin:'PIN code (always available)',finger:'Device fingerprint',off:'Off — PIN only',on:'On — PIN or fingerprint',enroll:'Enable fingerprint',disable:'Disable fingerprint',unlock:'🔓 Unlock with fingerprint',unsupported:'Fingerprint is unavailable or not enrolled on this device.',failed:'Fingerprint could not be verified. Use your PIN.',tryPin:'You can always enter your PIN.',loading:'Checking device security…'}
};
function locale(){const v=String(document.querySelector('#zaviSettingsLanguage,#zaviGateLanguage,[name="language"]')?.value||document.documentElement.lang||'fa').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'}
const word=()=>strings[locale()];
const bridge=()=>!!window.ZaviAndroidBiometric?.postMessage;
let status={available:false,enabled:false},busy=false,pending=false,lastStatus=0,layout=null,gateButton=null;
function configured(){try{return !!JSON.parse(localStorage.getItem(pinKey)||'null')?.hash}catch(_){return false}}
function pinSignature(){try{return String(JSON.parse(localStorage.getItem(pinKey)||'null')?.hash||'')}catch(_){return ''}}
function send(op){if(!bridge())return false;try{window.ZaviAndroidBiometric.postMessage(JSON.stringify({op,pinSig:pinSignature()}));return true}catch(_){return false}}
function update(){
 const t=word(),card=document.getElementById('zavi-biometric-preferences-v6546');
 if(card){
  card.querySelector('.zbm-title').textContent=t.title;
  card.querySelector('.zbm-desc').textContent=t.desc;
  card.querySelector('.zbm-pin').textContent=t.pin;
  card.querySelector('.zbm-caption').textContent=!status.available?t.unsupported:(status.enabled?t.on:t.off);
  const action=card.querySelector('.zbm-toggle');
  action.textContent=status.enabled?t.disable:t.enroll;
  action.disabled=busy||!status.available;
 }
 const g=document.getElementById('zavi-biometric-gate-v6546');
 if(g){g.hidden=!(status.enabled&&status.available&&configured()&&bridge());g.textContent=t.unlock;g.disabled=busy;}
}
function setup(){
 if(!bridge())return;
 const gate=document.getElementById('zawiPrivateGate');
 if(gate&&!document.getElementById('zavi-biometric-gate-v6546')){
  gateButton=document.createElement('button');
  gateButton.id='zavi-biometric-gate-v6546';gateButton.type='button';
  gateButton.className='zawi-pin-btn zavi-biometric-gate-action';gateButton.hidden=true;
  const form=gate.querySelector('#zawiPinForm');
  if(form)form.insertAdjacentElement('afterend',gateButton);
  gateButton.addEventListener('click',()=>{
   if(!document.documentElement.classList.contains('zawi-locked')||!configured()||!status.enabled)return;
   pending=true;busy=true;update();send('authenticate');
  });
 }
 const pin=document.getElementById('zawiChangePin');
 const security=pin?.closest('.settings-card');
 if(security&&!document.getElementById('zavi-biometric-preferences-v6546')){
  const e=document.createElement('div');
  e.id='zavi-biometric-preferences-v6546';
  e.className='zbm-options';
  e.innerHTML='<h4 class="zbm-title"></h4><p class="zbm-desc"></p><div class="zbm-pin"></div><div class="zbm-caption" role="status"></div><button class="btn subtle zbm-toggle" type="button"></button>';
  security.appendChild(e);
  e.querySelector('.zbm-toggle').addEventListener('click',()=>{
   if(document.documentElement.classList.contains('zawi-locked'))return;
   busy=true;update();send(status.enabled?'disable':'enable');
  });
 }
 update();
 if(Date.now()-lastStatus>10000){send('status');lastStatus=Date.now()}
}
function style(){
 if(document.getElementById('zavi-biometric-v6546-style'))return;
 const st=document.createElement('style');st.id='zavi-biometric-v6546-style';
 st.textContent='.zavi-biometric-gate-action{margin:12px auto 0;display:block;width:100%;max-width:350px;background:#0e876a!important;color:#fff!important}.zavi-biometric-gate-action[hidden]{display:none!important}.zbm-options{border-top:1px solid var(--line,#c8d6e4);margin-top:16px;padding-top:16px}.zbm-title{font-size:15px;font-weight:800;margin:0 0 9px}.zbm-desc{font-size:13px;line-height:1.8;margin:0 0 12px}.zbm-pin{font-weight:700;font-size:13px;margin:7px 0}.zbm-caption{font-size:13px;opacity:.83;margin:10px 0}.zbm-toggle{min-height:40px}';
 document.head.appendChild(st);
}
window.addEventListener('zavi:native-biometric',event=>{
 let data=event.detail;try{if(typeof data==='string')data=JSON.parse(data)}catch(_){return}
 if(!data||typeof data!=='object')return;
 busy=false;
 if(data.op==='status'||data.op==='enabled'||data.op==='disabled'){
  status={available:data.available===true,enabled:data.enabled===true};
  try{localStorage.setItem(key,status.enabled?'1':'0')}catch(_){}
 }else if(data.op==='authenticated'){
  // Native BiometricPrompt is the authority for this alternative UI unlock.
  if(pending&&data.success===true&&status.enabled&&document.documentElement.classList.contains('zawi-locked')){
   document.documentElement.classList.remove('zawi-locked');
   const p=document.getElementById('zawiPinOne');if(p)p.value='';
   // Re-arm the application's own inactivity locking timer via an ordinary user event.
   document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}));
  }else if(pending&&data.success!==true){
   const err=document.getElementById('zawiPinError');if(err)err.textContent=word().failed;
  }
  pending=false;
 }
 update();
});
document.addEventListener('zavi-pin-changed',()=>{status.enabled=false;pending=false;send('disable');update()});
document.addEventListener('zavi-v24-pin-reset-success',()=>{status.enabled=false;pending=false;send('disable');update()});
document.addEventListener('change',e=>{if(e.target.matches('#zaviSettingsLanguage,#zaviGateLanguage'))update()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{style();setup();new MutationObserver(()=>{if(document.querySelector('#zawiChangePin')&&!document.getElementById('zavi-biometric-preferences-v6546'))setup()}).observe(document.getElementById('content')||document.body,{childList:true,subtree:true})},{once:true});
else{style();setup();new MutationObserver(()=>{if(document.querySelector('#zawiChangePin')&&!document.getElementById('zavi-biometric-preferences-v6546'))setup()}).observe(document.getElementById('content')||document.body,{childList:true,subtree:true})}
})();

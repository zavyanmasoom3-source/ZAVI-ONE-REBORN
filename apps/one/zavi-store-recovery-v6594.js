/* ZAVI ONE 65.94: presentation-only simplification of the private password/recovery.
 * Existing sign-in, online ownership verification, permissions, approval and reset handlers
 * are never replaced or bypassed.
 */
(()=>{'use strict';
const lang=()=>{const s=String(document.querySelector('#zaviTopLanguage,#zaviSettingsLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return s.startsWith('en')?'en':s.startsWith('ps')?'ps':'fa'};
const copy={
 fa:{forgot:'فراموشی رمز؟',back:'بازگشت به ورود',reset:'درخواست بازیابی',check:'بررسی پاسخ',finish:'ساخت رمز جدید',title:'بازیابی آسان رمز خصوصی',guide:'۱. به حساب ابری وارد شوید.  ۲. دوکان را انتخاب و درخواست بفرستید.  ۳. پس از تأیید مدیریت، رمز تازه بسازید.',sub:'برای امنیت، تأیید مالک توسط مدیریت الزامی است.'},
 ps:{forgot:'رمز مو هېر شوی؟',back:'ننوتلو ته ستنېدل',reset:'د بېرته ترلاسه کولو غوښتنه',check:'ځواب کتل',finish:'نوی رمز جوړول',title:'د شخصي رمز بېرته ترلاسه کول',guide:'۱. کلاوډ حساب ته ننوځئ.  ۲. خپل دوکان وټاکئ او غوښتنه واستوئ.  ۳. له تایید وروسته نوی رمز جوړ کړئ.',sub:'د امنیت لپاره د مالک تایید اړین دی.'},
 en:{forgot:'Forgot private password?',back:'Back to sign in',reset:'Request recovery',check:'Check approval',finish:'Create new password',title:'Recover private password',guide:'1. Sign in to your cloud account.  2. Select your shop and request recovery.  3. After admin approval, create a new password.',sub:'Owner verification by administration is required for security.'}
};
const dict=()=>copy[lang()];
const txt=(el)=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
function findNodes(re){const items=[];document.querySelectorAll('button,a,[role=button],label,h1,h2,h3,p,small,span').forEach(n=>{if(n.closest('#z139-dialog,#z140-modal'))return;const s=txt(n);if(s.length>140||!s||!re.test(s))return;items.push(n)});return items}
function ancestorFor(node,markers,max=8){
 let p=node;
 for(let i=0;i<max&&p;i++,p=p.parentElement){
  if(['BODY','HTML'].includes(p.tagName))break;
  const s=txt(p);
  if(markers.every(m=>m.test(s)) && s.length<9000)return p;
 }
 return null;
}
function textOnly(node,s){
 if(!node||txt(node)===s)return;
 const children=[...node.childNodes].filter(x=>x.nodeType===3&&x.textContent.trim());
 if(children.length===1)children[0].textContent=s;
 else if(node.children.length===0)node.textContent=s;
 // Avoid replacing buttons/labels that have functional nested DOM.
}
function login(){
 const candidate=findNodes(/(?:رمز خصوصی را فراموش|رمز خصوصی.*فراموش|forgot.*private|شخصي.*رمز)/i).find(x=>/فراموش|forgot|هېر/i.test(txt(x)));
 if(!candidate)return;
 textOnly(candidate,dict().forgot);
 const text=txt(candidate),loginSignal=document.querySelector('input[type="password"]');
 if(!loginSignal)return;
 let parent=ancestorFor(candidate,[/(ورود به ZAVI ONE|بازکردن سیستم حسابداری|SECURE ACCOUNTING|رمز ورود)/i],8);
 if(!parent){
  // Only style a small wrapper with a password input; avoid the whole app screen.
  parent=loginSignal.closest('form')||loginSignal.parentElement?.parentElement?.parentElement;
 }
 if(parent && parent.tagName!=='BODY'&&parent.tagName!=='HTML')parent.classList.add('z94-login-card');
}
function recovery(){
 const matches=findNodes(/(?:ارسال درخواست به مدیریت|مدیریت.*درخواست|Request recovery|د مدیریت.*غوښتنه)/i);
 let host=null;
 for(const n of matches){
  host=ancestorFor(n,[/(رمز حساب آنلاین|د حساب رمز|cloud account password|رمز سرور مرکزی)/i,/(بررسی پاسخ مدیریت|تأیید و ساخت رمز|Check approval|manager|پاسخ مدیریت)/i],8);
  if(host)break;
 }
 if(!host)return;
 host.classList.add('z94-recovery-card');
 if(!host.querySelector('.z94-recovery-steps')){
  const guide=document.createElement('div');guide.className='z94-recovery-steps';guide.setAttribute('role','note');
  const h=document.createElement('strong');h.textContent=dict().title;
  const desc=document.createElement('p');desc.textContent=dict().guide;
  const warning=document.createElement('small');warning.textContent=dict().sub;
  guide.append(h,desc,warning);
  const first=host.querySelector('h1,h2,h3')||host.firstElementChild;
  if(first)first.before(guide);else host.prepend(guide);
 }
 // Relabel actionable original controls; do not alter IDs, URLs, events or credential flow.
 const rename=[
  [/ارسال درخواست به مدیریت|send recovery request|د مدیریت.*غوښتنه/i,dict().reset],
  [/بررسی پاسخ مدیریت|check.*response|check approval/i,dict().check],
  [/تأیید و ساخت رمز تازه|confirm.*new password/i,dict().finish],
  [/برگشت به قفل برنامه|return to.*lock|back to.*sign/i,dict().back]
 ];
 host.querySelectorAll('button').forEach(b=>{const s=txt(b);for(const [re,val] of rename){if(re.test(s)&&s.length<100){textOnly(b,val);break}}});
}
let queued=false;
function update(){queued=false;try{login();recovery()}catch(_){}}
function schedule(){if(!queued){queued=true;requestAnimationFrame(update)}}
function init(){
 update();
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('change',e=>{if(/Language|language/.test(e.target?.id||''))schedule()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

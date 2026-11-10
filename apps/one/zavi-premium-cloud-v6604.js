/* ZAVI ONE / ADMIN premium cloud-first UI. Real auth stays in cloud.js and app.js. */
(()=>{'use strict';
if(window.ZaviPremiumCloud704)return;
const ADMIN=!!document.getElementById('authScreen');
const words={
fa:{headline:'مدیریت هوشمند کسب‌وکار',sub:'یک شروع مطمئن. تجربه‌ای متفاوت.',intro:'برای ورود به حسابداری، ابتدا حساب ابری خود را فعال کنید.',sign:'ورود به حساب',up:'ساخت حساب',out:'خروج از حساب',account:'حساب من',hint:'ایمیل Gmail یا ایمیل شخصی و رمز حساب ZAVI ONE را وارد کنید.',owner:'مدیریت مرکزی فقط برای مالک اصلی',ownerHint:'ساخت حساب مدیر در این بخش مجاز نیست؛ ورود تنها با حساب تأییدشده سرور امکان دارد.',motion:'کاهش انیمیشن',privacy:'حفاظت از داده‌های مالی با مجوزهای سمت سرور'},
ps:{headline:'ستاسې کاروبار، مسلکي مدیریت',sub:'خوندي پیل، نوې تجربه.',intro:'مخکې له حسابدارۍ خپل کلاوډ حساب فعال کړئ.',sign:'حساب ته ننوتل',up:'نوی حساب جوړول',out:'له حسابه وتل',account:'زما حساب',hint:'خپل Gmail یا برېښنالیک او د ZAVI ONE حساب رمز ولیکئ.',owner:'مرکزي اداره یوازې د اصلي مالک لپاره',ownerHint:'د مدیر حساب دلته نه جوړېږي. د سرور تایید اړین دی.',motion:'حرکتونه کمول',privacy:'ستاسې مالي معلومات د سرور له خوا خوندي کېږي'},
en:{headline:'Your business. Beautifully managed.',sub:'A secure start. A better experience.',intro:'Connect your verified cloud account before entering the workspace.',sign:'Sign in',up:'Create account',out:'Sign out',account:'My account',hint:'Enter your Gmail or email address and ZAVI ONE account password.',owner:'Central administration is owner-only',ownerHint:'Admin self-registration is disabled. Only a server-verified owner can sign in.',motion:'Reduce motion',privacy:'Financial data protected by server-side access controls'}
};
let root=null,accountBtn=null,statusObserver=null;
const $=(s,p=document)=>p.querySelector(s);
function l(){let v=$('#zaviGateLanguage,#zaviAdminAuthLanguage,#zaviTopLanguage')?.value||document.documentElement.lang||'fa';return String(v).startsWith('ps')?'ps':String(v).startsWith('en')?'en':'fa'}
function d(){return words[l()]}
function preferences(){try{return JSON.parse(localStorage.getItem('zavi_premium704_prefs')||'{}')}catch(_){return {}}}
function applyMotion(){document.documentElement.dataset.z704Motion=preferences().reduce?'reduced':'full'}
function setMotion(v){try{localStorage.setItem('zavi_premium704_prefs',JSON.stringify({reduce:v}))}catch(_){}applyMotion()}
function session(){return window.zaviCloudGetAuthSession?.()}
function signed(){return !!session()?.access_token&&!!session()?.user?.id}
function add(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function build(){
 if(root)return root;
 root=add('div','z704-welcome');root.id='z704-welcome';root.hidden=true;root.dir='rtl';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
 root.innerHTML='<div class="z704-aura" aria-hidden="true"><i></i><i></i><i></i></div><section class="z704-shell"><div class="z704-hero"><div class="z704-brand"><div class="z704-logo">Z<span>1</span></div><b>ZAVI ONE</b><small>PREMIUM ACCOUNTING</small></div><div class="z704-visual" aria-hidden="true"><div class="z704-orbit a"></div><div class="z704-orbit b"></div><div class="z704-crystal">Z1</div></div><div class="z704-tagline">ZAVI ONE · CLOUD</div><h1 id="z704-headline"></h1><p id="z704-intro"></p><small id="z704-privacy"></small></div><div class="z704-access"><div class="z704-form-brand"><div class="z704-logo small">Z<span>1</span></div><b>ZAVI ONE</b></div><p id="z704-sub"></p><div class="z704-choices"><button data-z704="login" type="button"></button><button data-z704="signup" type="button"></button></div><div id="z704-cloud"></div><p id="z704-info" role="status" aria-live="polite"></p><div class="z704-footer"><label><input id="z704-less" type="checkbox"><span id="z704-motion-label"></span></label><select id="z704-lang" aria-label="Language"><option value="fa-AF">دری</option><option value="ps-AF">پښتو</option><option value="en">English</option></select></div></div></section>';
 document.body.append(root);
 root.querySelectorAll('[data-z704]').forEach(b=>b.addEventListener('click',()=>authorize(b.dataset.z704)));
 $('#z704-less',root).addEventListener('change',e=>setMotion(e.target.checked));
 $('#z704-lang',root).addEventListener('change',e=>{
  const next=e.target.value,orig=$('#zaviGateLanguage,#zaviAdminAuthLanguage,#zaviTopLanguage');
  if(orig){orig.value=next;orig.dispatchEvent(new Event('change',{bubbles:true}))}
  document.documentElement.lang=next;document.documentElement.dir=next==='en'?'ltr':'rtl';translate();
 });
 return root;
}
function translate(){
 if(!root)return;
 const x=d();
 for(const [id,v] of [['#z704-headline',x.headline],['#z704-intro',x.intro],['#z704-privacy',x.privacy],['#z704-sub',x.sub],['#z704-motion-label',x.motion]]){
   const n=$(id,root);if(n)n.textContent=v;
 }
 const a=$('[data-z704=login]',root),b=$('[data-z704=signup]',root);
 if(a)a.textContent=x.sign;if(b)b.textContent=x.up;
 root.dir=l()==='en'?'ltr':'rtl';
 $('#z704-lang',root).value=l()==='en'?'en':l()==='ps'?'ps-AF':'fa-AF';
 $('#z704-less',root).checked=!!preferences().reduce;
 if(!root.hidden)fillCloud();
}
function fillCloud(){
 if(!root||root.hidden)return;
 const fn=window.zaviCloudPanel;if(typeof fn!=='function')return;
 const slot=$('#z704-cloud',root);
 const email=$('#z20Email',slot)?.value||'',password=$('#z20Password',slot)?.value||'';
 slot.innerHTML=fn(); // Existing cloud module escapes account details and retains the real auth handlers.
 const a=$('#z20Email',slot),b=$('#z20Password',slot);
 if(a){a.value=email;a.placeholder='name@gmail.com';a.setAttribute('aria-label',d().hint)}
 if(b){b.value=password;b.autocomplete='current-password'}
 // Surface the ORIGINAL server auth errors/confirmation messages in the new UI.
 if(statusObserver){statusObserver.disconnect();statusObserver=null}
 const status=$('#z20CloudStatus',slot);
 if(status&&typeof MutationObserver!=='undefined'){
   statusObserver=new MutationObserver(()=>{
     const info=$('#z704-info',root);
     if(info)info.textContent=status.textContent||d().hint;
   });
   statusObserver.observe(status,{childList:true,characterData:true,subtree:true});
 }
 // Hidden native action controls are called by our large accessible buttons.
 slot.querySelectorAll('[data-z20-cloud="login"],[data-z20-cloud="signup"]').forEach(n=>n.tabIndex=-1);
}
function authorize(which){
 if(!root)return;
 const email=$('#z20Email',root),pass=$('#z20Password',root);
 if(!email?.value.trim()||!pass?.value){$('#z704-info',root).textContent=d().hint;return}
 const real=root.querySelector('[data-z20-cloud="'+which+'"]');
 if(real)real.click();else $('#z704-info',root).textContent=d().intro;
}
function hide(){if(statusObserver){statusObserver.disconnect();statusObserver=null}if(root){root.remove();root=null}document.documentElement.classList.remove('z704-cloud-first')}
function show(){
 build();root.hidden=false;document.documentElement.classList.add('z704-cloud-first');
 translate();$('#z704-info',root).textContent=d().hint;
}
function accountMenu(){
 if(ADMIN)return;
 const bar=$('.topbar');if(!bar)return;
 if(!accountBtn){accountBtn=add('button','z704-account');accountBtn.id='z704-account';accountBtn.type='button';bar.append(accountBtn);
 accountBtn.addEventListener('click',()=>{
  if(!signed()){window.zaviCloudPanel?.();return}
  let old=$('#z704-account-pop');if(old){old.remove();return}
  const pop=add('div','z704-account-pop'),email=add('p','',session()?.user?.email||'');
  pop.id='z704-account-pop';
  const out=add('button','z704-out',d().out);out.type='button';out.dataset.z20Cloud='logout';
  pop.append(add('b','',d().account),email,out);bar.append(pop);
 });}
 accountBtn.textContent=signed()?d().account:'☁ '+d().sign;
}
function onCloud(){
 if(ADMIN)return;
 // Restore the original in-app cloud panel. Never show a mandatory cloud-first gate.
 hide();accountMenu();
}
function adminAuth(){
 const screen=$('#authScreen');if(!screen)return;
 screen.classList.add('z704-admin-login');
 const card=$('.auth-card',screen);
 const old=$('#z704-owner-note',card||screen);
 if(old){const labels=old.querySelectorAll('b,p');if(labels[0])labels[0].textContent=d().owner;if(labels[1])labels[1].textContent=d().ownerHint}
 if(card&&!old){
  const note=add('div','z704-owner-note');note.id='z704-owner-note';
  note.append(add('b','',d().owner),add('p','',d().ownerHint));card.prepend(note);
 }
 const logout=$('#logoutBtn');if(logout)logout.title=d().out;
}
function start(){
 applyMotion();
 if(ADMIN){adminAuth();document.addEventListener('change',e=>{if(e.target.matches?.('.zavi-language-picker'))adminAuth()});return}
 if(typeof window.zaviCloudPanel!=='function'||typeof window.zaviCloudGetAuthSession!=='function'){
  setTimeout(start,140);return;
 }
 window.addEventListener('zavi-cloud-session-changed',onCloud);
 window.addEventListener('zavi-cloud-logged-out',onCloud);
 document.addEventListener('change',e=>{if(e.target.matches?.('.zavi-language-picker'))translate()});
 onCloud();
}
window.ZaviPremiumCloud704=Object.freeze({refresh:onCloud,version:'66.04'});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
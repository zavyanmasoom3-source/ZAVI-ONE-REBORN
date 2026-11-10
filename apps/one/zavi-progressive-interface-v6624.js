/* ZAVI progressive disclosure: keep all original modules and actions intact.
   Optional enhancement for cards explicitly marked as advanced. */
(()=>{'use strict';
const KEY='zavi.advancedSectionsVisible';
function read(){try{return localStorage.getItem(KEY)==='true'}catch(_){return false}}
function mount(){
 const root=document.querySelector('#content');
 if(!root||!root.querySelector('#zaviSettingsLanguage'))return;
 const language=document.querySelector('#zaviSettingsLanguage');
 if(!root.contains(language)||!language.getClientRects().length)return;
 const card=language.closest('.settings-card');
 if(!card||card.querySelector('#zavi-advanced-preference'))return;
 const label=document.createElement('label');
 label.id='zavi-advanced-preference';label.className='zavi-advanced-preference';
 const name=document.createElement('span');name.textContent='ابزارهای پیشرفته';
 const input=document.createElement('input');input.type='checkbox';input.checked=read();
 input.setAttribute('aria-label','ابزارهای پیشرفته');
 input.addEventListener('change',()=>{
  try{localStorage.setItem(KEY,String(input.checked))}catch(_){}
  document.documentElement.classList.toggle('zavi-advanced-visible',input.checked);
 });
 label.append(name,input);card.append(label);
}
function apply(){
 document.documentElement.classList.toggle('zavi-advanced-visible',read());
 mount();
}
const style=document.createElement('style');
style.textContent=`
.zavi-advanced-preference{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:12px 0;padding:12px;border:1px solid currentColor;border-radius:12px;opacity:.95;min-width:0;box-sizing:border-box;writing-mode:horizontal-tb}
.zavi-advanced-preference input{width:22px;height:22px;flex:none}
@media(max-width:600px){.zavi-advanced-preference{font-size:14px;line-height:1.5}}
`;
(document.head||document.documentElement).append(style);
let pending=false;
new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;apply()})}}).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
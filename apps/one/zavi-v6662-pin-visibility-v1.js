/* 66.62 original PIN field: small functional eye, no global skin changes. */
(()=>{
'use strict';
const INPUT='zawiPinOne';
const LABELS={
 'fa-AF':{show:'نمایش رمز',hide:'پنهان‌کردن رمز'},
 'ps-AF':{show:'پټنوم ښکاره کړئ',hide:'پټنوم پټ کړئ'},
 en:{show:'Show password',hide:'Hide password'}
};
function labels(){
 const l=(document.documentElement.lang||'fa-AF').toLowerCase();
 return l.startsWith('ps')?LABELS['ps-AF']:l.startsWith('en')?LABELS.en:LABELS['fa-AF'];
}
function init(){
 const field=document.getElementById(INPUT);
 const parent=field?.closest('.zawi-pin-field');
 if(!parent||parent.querySelector('[data-zds-password-toggle]'))return;
 const button=document.createElement('button');
 button.type='button';
 button.dataset.zdsPasswordToggle=INPUT;
 button.textContent='◉';
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

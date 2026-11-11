/* ZAVI ONE: display Western digits across Dari, Pashto and English.
 * Presentation ONLY. Never rewrites financial input values, IDs, persistent data,
 * editable controls or access/session tokens. Batched, mutation-targeted updates. */
(()=>{'use strict';
 const DIGITS=/[\u06f0-\u06f9\u0660-\u0669]/g;
 const HAS_DIGIT=/[\u06f0-\u06f9\u0660-\u0669]/;
 const english=x=>String(x).replace(DIGITS,ch=>{
  const p=ch.codePointAt(0);return String(p>=0x6f0?p-0x6f0:p-0x660);
 });
 const skip=el=>!!el?.closest?.('script,style,noscript,textarea,code,pre,[contenteditable=""],[contenteditable="true"],[data-keep-original-digits]');
 const scheduled=new Set();let scheduledFrame=false;
 function normalize(node){
  if(!node)return;
  if(node.nodeType===3){
   if(!HAS_DIGIT.test(node.nodeValue||''))return;
   if(skip(node.parentElement))return;
   const next=english(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next;
   return;
  }
  if(node.nodeType!==1||skip(node))return;
  // Numeric field values are intentionally untouched. Placeholders are display only.
  if(node.matches('input')&&node.hasAttribute('placeholder')){
   const v=node.getAttribute('placeholder'),next=english(v);if(v!==next)node.setAttribute('placeholder',next);
  }
  // Option labels are user-visible; underlying option values remain unchanged.
  if(node.matches('script,style,textarea,input'))return;
  const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
  let t,n=0;while((t=walker.nextNode())&&n++<16000){
   if(!skip(t.parentElement)&&HAS_DIGIT.test(t.nodeValue||'')){
    const next=english(t.nodeValue);if(next!==t.nodeValue)t.nodeValue=next;
   }
  }
 }
 function flush(){scheduledFrame=false;const queue=[...scheduled];scheduled.clear();for(const node of queue)normalize(node)}
 function queue(node){if(scheduled.size>500){scheduled.clear();scheduled.add(document.body)}else scheduled.add(node);if(!scheduledFrame){scheduledFrame=true;requestAnimationFrame(flush)}}
 function englishNumericField(el){
  return !!el?.matches?.('input[type="number"],input[type="tel"],input[inputmode="numeric"],input[inputmode="decimal"]');
 }
 // Only *new user input* is constrained: never rewrite stored ledger balances,
 // account IDs, PIN hashes, phone numbers or data loaded from older backups.
 function blockNonLatinNumericInput(){
  document.addEventListener('beforeinput',event=>{
   if(!englishNumericField(event.target)||event.isComposing||!event.data)return;
   if(HAS_DIGIT.test(event.data))event.preventDefault();
  },true);
  document.addEventListener('paste',event=>{
   if(!englishNumericField(event.target))return;
   const content=event.clipboardData?.getData('text')||'';
   if(HAS_DIGIT.test(content))event.preventDefault();
  },true);
 }
 function normalizeEditableNumber(event){
  const target=event.target;
  if(!target?.matches?.('input,textarea')||target.disabled||target.readOnly)return;
  // Never rewrite account passwords or PINs behind the user's back.
  if(target.matches('[type="password"],[type="hidden"],[data-keep-original-digits]'))return;
  if(!HAS_DIGIT.test(target.value||''))return;
  const current=target.value,next=english(current);
  if(next===current)return;
  let pos=null,stop=null;
  try{pos=target.selectionStart;stop=target.selectionEnd}catch(_){}
  target.value=next;
  if(pos!==null&&stop!==null)try{target.setSelectionRange(pos,stop)}catch(_){}
 }
 function start(){
  if(!document.body)return;
  blockNonLatinNumericInput();
  queue(document.body);
  // User-visible editable numerals become ASCII on input; no stored history is migrated.
  document.addEventListener('input',normalizeEditableNumber,true);
  window.addEventListener('beforeprint',()=>normalize(document.body));
  const observer=new MutationObserver(records=>{
   for(const r of records){if(r.type==='characterData')queue(r.target);else for(const n of r.addedNodes)queue(n)}
  });
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  window.ZaviEnglishDigitsV645={english};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

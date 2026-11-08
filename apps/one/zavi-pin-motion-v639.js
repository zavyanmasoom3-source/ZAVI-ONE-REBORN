/* Decorative PIN feedback only — does not read, change, persist or transmit credentials. */
(()=>{'use strict';
 function setup(){
  const field=document.getElementById('zawiPinOne'),form=document.getElementById('zawiPinForm');
  const gate=document.getElementById('zawiPrivateGate'),error=document.getElementById('zawiPinError');
  if(!field||!form||!gate||!error||document.getElementById('z639PinProgress'))return;
  const meter=document.createElement('div');meter.id='z639PinProgress';meter.className='z639-pin-progress';
  meter.setAttribute('aria-hidden','true');
  for(let i=0;i<12;i++){const dot=document.createElement('span');dot.className='z639-pin-dot';meter.append(dot)}
  field.insertAdjacentElement('afterend',meter);
  const status=document.createElement('div');status.id='z639PinStatus';status.className='z639-pin-status';
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  meter.insertAdjacentElement('afterend',status);
  const clean=val=>String(val||'').replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/\D/g,'');
  function update(){const length=Math.min(12,clean(field.value).length);meter.querySelectorAll('span').forEach((dot,i)=>dot.classList.toggle('filled',i<length));
   meter.dataset.complete=String(length>=6);status.textContent=length===0?'رمز ۶ تا ۱۲ رقمی':length<6?'برای ادامه حداقل ۶ رقم لازم است.':'رمز آماده بررسی است.';}
  field.addEventListener('input',update);
  const observer=new MutationObserver(()=>{const message=(error.textContent||'').trim();
   if(message&&!/در حال بررسی/.test(message)&&document.documentElement.classList.contains('zawi-locked')){
    gate.classList.remove('z639-pin-invalid');void gate.offsetWidth;gate.classList.add('z639-pin-invalid');
   }});
  observer.observe(error,{childList:true,subtree:true,characterData:true});
  new MutationObserver(()=>{if(!document.documentElement.classList.contains('zawi-locked')){
    gate.classList.remove('z639-pin-invalid');meter.querySelectorAll('span').forEach(x=>x.classList.remove('filled'));
   }else{update();}}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();

/* ZAVI ONE local WhatsApp message centre restored from 66.75. Never auto-send. */
(() => {
 'use strict';
 if(window.ZaviMessageCenterV6720)return;
 const PREFIX='zavi_message_queue_v6720:';
 const fa='۰۱۲۳۴۵۶۷۸۹', ar='٠١٢٣٤٥٦٧٨٩';
 const tr={statement:'سلام {name} عزیز، مانده حساب شما {amount} است. لطفاً در صورت پرداخت اطلاع بدهید.',
  invoice:'سلام {name} عزیز، فاکتور شما به مبلغ {amount} ثبت شد. تشکر از خرید شما.',
  reminder:'سلام {name} عزیز، یادآوری حساب شما در ZAVI ONE: مبلغ باقی‌مانده {amount}.',
  friendship:'سلام {name} عزیز، امیدواریم صحت‌مند و موفق باشید. از اعتماد شما سپاسگزاریم.',
  payment:'سلام {name} عزیز، پرداخت {amount} شما دریافت شد. تشکر.',
  renewal:'تبریک! اشتراک ZAVI ONE شما با موفقیت تمدید شد. از اعتماد شما تشکر.',
  receipt:'سلام {name} عزیز، رسید حساب شما به مبلغ {amount} آماده است.',
  warning:'سلام {name} عزیز، لطفاً حساب {amount} را بررسی کنید و در صورت نیاز با ما تماس بگیرید.'};
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const phone=v=>{
  let x=String(v||'').trim().replace(/[۰-۹]/g,c=>String(fa.indexOf(c))).replace(/[٠-٩]/g,c=>String(ar.indexOf(c))).replace(/[\s().-]/g,'');
  if(x.startsWith('+'))x=x.slice(1);
  else if(/^0\d{9}$/.test(x))x='93'+x.slice(1);
  return /^[1-9]\d{7,14}$/.test(x)?x:'';
 };
 const scope=()=>{
  try{return PREFIX+(typeof KEY==='string'&&KEY?KEY:'unbound')}catch(_){return PREFIX+'unbound'}
 };
 const read=()=>{
  try{const value=JSON.parse(localStorage.getItem(scope())||'[]');return Array.isArray(value)?value.filter(x=>x&&typeof x.text==='string').slice(-30):[];}
  catch(_){return []}
 };
 const write=value=>{
  try{localStorage.setItem(scope(),JSON.stringify(value.slice(-30)));return true}
  catch(_){window.toast?.('ثبت محلی پیام موفق نشد. فضای حافظه را بررسی کنید.');return false;}
 };
 const message=(kind,name,amount)=>{
  return (tr[kind]||tr.statement).replace(/\{name\}/g,name||'مشتری').replace(/\{amount\}/g,amount||'۰');
 };
 const link=(p,text)=>'https://wa.me/'+p+'?text='+encodeURIComponent(text);
 function open(){
  if(typeof window.showModal!=='function'){window.alert('صفحهٔ پیام‌ها هنوز آماده نیست.');return;}
  const options=[['statement','صورت‌حساب'],['invoice','فاکتور'],['reminder','یادآوری پرداخت'],['friendship','پیام دوستانه'],['payment','تأیید پرداخت'],['renewal','تمدید اشتراک'],['receipt','رسید'],['warning','یادآوری حساب']];
  const body='<section id="zaviMessageCenter6720"><p class="tiny-note">ارسال خودکار وجود ندارد. پیام فقط پس از تأیید شما در واتساپ باز می‌شود.</p><div class="z6720-grid"><label>نام مشتری<input id="z6720Name" maxlength="80" placeholder="نام مشتری"></label><label>شمارهٔ واتساپ<input id="z6720Phone" dir="ltr" inputmode="tel" maxlength="24" placeholder="+93 700 000 000"></label><label>نوع پیام<select id="z6720Type">'+options.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('')+'</select></label><label>مبلغ / مانده<input id="z6720Amount" maxlength="50" placeholder="AFN 0"></label><label class="z6720-full">متن پیام<textarea id="z6720Text" maxlength="3500" rows="5"></textarea></label></div><div class="z6720-actions"><button type="button" class="btn primary" data-z6720="queue">ذخیره در صف</button><button type="button" class="btn subtle" data-z6720="preview">بازکردن واتساپ</button></div><p id="z6720Error" role="status"></p><div id="z6720List" class="z6720-list"></div></section>';
  window.showModal('مرکز پیام مستقیم',body,'',false);
  const $=id=>document.getElementById(id);
  function paint(){if($('z6720Text'))$('z6720Text').value=message($('z6720Type').value,$('z6720Name').value.trim(),$('z6720Amount').value.trim())}
  function showQueue(){
   const rows=read();
   $('z6720List').innerHTML=rows.length?rows.map((x,i)=>{
     const num=phone(x.phone),href=num?link(num,x.text):'';
     return '<article class="z6720-item"><div><b>'+escape(x.name)+'</b><small>'+escape(x.phone)+' · '+escape(x.created||'')+'</small><p>'+escape(x.text).slice(0,120)+'</p></div><div class="z6720-actions">'+
      (href?'<a class="btn tiny" href="'+escape(href)+'" target="_blank" rel="noopener noreferrer">واتساپ</a>':'')+
      '<button type="button" class="btn tiny subtle" data-z6720-delete="'+i+'">حذف</button></div></article>';
    }).join(''):'<p class="tiny-note">پیامی در صف نیست.</p>';
  }
  for(const id of ['z6720Type','z6720Name','z6720Amount'])$(id)?.addEventListener('change',paint);
  $('z6720Type')?.addEventListener('input',paint);paint();showQueue();
  $('zaviMessageCenter6720')?.addEventListener('click',ev=>{
    const b=ev.target.closest('[data-z6720]'),del=ev.target.closest('[data-z6720-delete]');
    if(del){const rows=read();rows.splice(Number(del.dataset.z6720Delete),1);if(write(rows))showQueue();return;}
    if(!b)return;
    const num=phone($('z6720Phone').value);
    if(!num){$('z6720Error').textContent='شمارهٔ واتساپ معتبر وارد کنید.';return;}
    const item={name:$('z6720Name').value.trim()||'مشتری',phone:num,
     text:$('z6720Text').value.trim()||message($('z6720Type').value,$('z6720Name').value,$('z6720Amount').value),
     kind:$('z6720Type').value,created:new Date().toLocaleDateString('fa-AF')};
    if(!item.text){$('z6720Error').textContent='متن پیام را وارد کنید.';return;}
    $('z6720Error').textContent='';
    if(b.dataset.z6720==='queue'){const rows=read();rows.push(item);if(write(rows))showQueue();}
    else window.open(link(num,item.text),'_blank','noopener,noreferrer');
  });
 }
 function inject(){
  const root=document.getElementById('content');if(!root||root.querySelector('#zavi-open-message-center'))return;
  let active;try{active=typeof page==='string'?page:document.body.dataset.zaviPage}catch(_){active=''}
  if(!['settings','contacts','debtors'].includes(active))return;
  const host=root.querySelector('.page-head,.zui-section-heading,header');if(!host)return;
  const button=document.createElement('button');button.id='zavi-open-message-center';button.type='button';
  button.className='btn subtle';button.textContent='✉ پیام واتساپ';button.addEventListener('click',open);host.appendChild(button);
 }
 window.ZaviMessageCenterV6720=Object.freeze({open,phone,link,message,read});
 const root=document.getElementById('content');
 if(root)new MutationObserver(inject).observe(root,{childList:true,subtree:true});
 document.addEventListener('click',()=>setTimeout(inject,0),true);
 document.addEventListener('zavi:page',inject);inject();
})();
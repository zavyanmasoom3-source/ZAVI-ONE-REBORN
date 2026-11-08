/* ZAVI ONE WhatsApp sharing. Short Dari messages; this only prepares links.
 * It never sends messages or changes accounting records.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.ZaviWhatsappV1=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const fa='۰۱۲۳۴۵۶۷۸۹', ar='٠١٢٣٤٥٦٧٨٩';
 function digits(value){
  let s=String(value??'').trim().replace(/[۰-۹]/g,c=>String(fa.indexOf(c))).replace(/[٠-٩]/g,c=>String(ar.indexOf(c)));
  s=s.replace(/[\s().-]/g,'');
  if(s.startsWith('+'))s=s.slice(1);
  else if(s.startsWith('00'))s=s.slice(2);
  else if(/^0[0-9]{9}$/.test(s))s='93'+s.slice(1);
  return /^[1-9][0-9]{7,14}$/.test(s)?s:'';
 }
 function links(phone,message){
  const recipient=digits(phone),encoded=encodeURIComponent(String(message??'').slice(0,3500));
  return Object.freeze({
   recipient,valid:!!recipient,
   personal:recipient?'https://wa.me/'+recipient+'?text='+encoded:'https://wa.me/?text='+encoded,
   business:recipient?'https://api.whatsapp.com/send?phone='+recipient+'&text='+encoded:'https://api.whatsapp.com/send?text='+encoded
  });
 }
 function invoice(data){
  const d=data||{};
  return [d.storeName||'فروشگاه','فاکتور: '+(d.code||''),'مشتری: '+(d.customer||''),'تاریخ: '+(d.date||''),
    'مبلغ: '+(d.total||''),'پرداخت: '+(d.paid||''),'مانده: '+(d.balance||''),'تشکر از خرید شما.'].join('\n');
 }
 function statement(data){
  const d=data||{};
  return ['سلام '+(d.customer||'')+' عزیز،','مانده حساب شما نزد '+(d.storeName||'فروشگاه')+' تا '+(d.date||'')+': '+(d.balance||'')+'.',
    ...(d.reminderDate?['تاریخ وعده: '+d.reminderDate]:[]),'اگر پرداخت کرده‌اید، لطفاً اطلاع بدهید. تشکر.'].join('\n');
 }
 return Object.freeze({digits,links,invoice,statement});
});

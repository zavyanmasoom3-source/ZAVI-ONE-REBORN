/* V66.62 concise Dari copy: presentation only, no transaction changes. */
(function(){
'use strict';
var changes=[
 ['اسکن بارکد گدام','اسکن بارکد'],
 ['با دوربین، بارکدخوان USB / Bluetooth یا نوشتن کود، محصول و قیمت واقعی همان گدام را ببینید.','بارکد را اسکن یا وارد کنید.'],
 ['برای نمایش نام، موجودی و قیمت محصول، بارکد آن را اسکن کنید.','بارکد محصول را وارد کنید.'],
 ['خرید از چین (RMB)','خرید خارجی (RMB)'],
 ['خرید از چین یا دیگر کشورها به USD، RMB یا AFN با نرخ دستی؛ ثبت معادل در پول اصلی حسابداری','خرید داخلی و خارجی با ارز دلخواه.'],
 ['هر فاکتور 15 ردیف در نسخه چاپی جا دارد و اگر تعداد محصولها بیشتر باشد، ردیف‌های اضافی چاپ می‌شوند. در فروش قرضی، واردکردن مشتری ضروری است.','برای فروش قرضی، مشتری را انتخاب کنید.'],
 ['رمز خصوصی خود را وارد کنید تا حساب مشتریان و فروشگاه باز شود.','رمز ورود را وارد کنید.']
];
var busy=false;
function apply(){
 if(busy)return;busy=true;
 try{
  var root=document.getElementById('content')||document.body;
  var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  var n,count=0;
  while((n=walker.nextNode())&&count<15000){
   count++;
   if(!n.parentElement||n.parentElement.closest('script,style,textarea,input,[contenteditable="true"]'))continue;
   var t=n.nodeValue,trim=t.trim();
   for(var i=0;i<changes.length;i++){
    if(trim===changes[i][0]){n.nodeValue=t.replace(changes[i][0],changes[i][1]);break;}
   }
  }
 }finally{busy=false;}
}
var pending=false;
function schedule(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;apply();});}
function start(){schedule();new MutationObserver(schedule).observe(document.getElementById('content')||document.body,{subtree:true,childList:true,characterData:false});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
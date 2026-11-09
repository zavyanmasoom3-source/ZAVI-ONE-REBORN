/* Approved UI route affordances only. Never invoke a navigation handler,
   touch storage, read private records, or toggle permissions. */
(()=>{'use strict';
 const app=document.currentScript?.dataset.zaviApprovedApp==='admin'?'admin':'one';
 function refresh(){
   let dashboard=false;
   if(app==='admin'){
     dashboard=!document.getElementById('appScreen')?.hidden &&
       document.querySelector('#appScreen .nav-item.selected')?.dataset.page==='overview';
   }else{
     const main=document.getElementById('content');
     dashboard=(typeof page==='string'&&page==='dashboard') ||
       !!main?.classList.contains('zrf-dashboard') ||
       !!main?.querySelector('.zui-dashboard-page');
   }
   document.body.classList.toggle('zavi-approved-dashboard',!!dashboard);
 }
 let queued=false;
 function schedule(){
   if(queued)return;
   queued=true;
   queueMicrotask(()=>{queued=false;refresh()});
 }
 function start(){
   const main=document.getElementById(app==='admin'?'view':'content');
   if(main)new MutationObserver(schedule).observe(main,{attributes:true,attributeFilter:['class'],childList:true});
   const nav=document.querySelector(app==='admin'?'#appScreen .nav':'#mobileBottom');
   if(nav)new MutationObserver(schedule).observe(nav,{subtree:true,attributes:true,attributeFilter:['class','aria-current'],childList:true});
   if(app==='admin'){
     const shell=document.getElementById('appScreen');
     if(shell)new MutationObserver(schedule).observe(shell,{attributes:true,attributeFilter:['hidden']});
   }
   document.addEventListener('click',event=>{
     if(event.target.closest?.('[data-go],[data-page],[data-nav]'))schedule();
   });
   schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

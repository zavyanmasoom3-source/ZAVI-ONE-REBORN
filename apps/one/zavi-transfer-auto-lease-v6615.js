/* ZAVI ONE: refresh signed offline lease immediately after successful owner transfer.
   Never mints permissions locally; server remains the authority. */
(()=>{'use strict';
 if(window.__zaviTransferAutoLeaseInstalled)return;
 window.__zaviTransferAutoLeaseInstalled=true;
 let active=false;
 async function refresh(){
  if(active||navigator.onLine===false)return;
  active=true;
  try{
   for(let i=0;i<8;i++){
    if(window.ZaviAutoLease?.refresh){await window.ZaviAutoLease.refresh();break}
    await new Promise(resolve=>setTimeout(resolve,350));
   }
   await Promise.resolve(window.zaviAutoOffline?.prepare?.()).catch(()=>{});
  }finally{active=false}
 }
 function wrap(){
  const obj=window.zaviDeviceActivation;
  if(!obj||obj.__autoLeaseWrapped||typeof obj.replacePrimary!=='function')return;
  const original=obj.replacePrimary;
  obj.replacePrimary=async function(...args){
   const result=await original.apply(this,args);
   if(result===true||result==='DEVICE_REPLACED'||result==='DEVICE_ACTIVATED'||result==='DEVICE_ALREADY_ACTIVE'||result?.success===true){
    await refresh();
   }
   return result;
  };
  obj.__autoLeaseWrapped=true;
 }
 wrap();
 let attempts=0;
 const timer=setInterval(()=>{wrap();if(++attempts>120||window.zaviDeviceActivation?.__autoLeaseWrapped)clearInterval(timer)},500);
 for(const evt of ['zavi-device-transfer-complete','zavi-device-activated','zavi-cloud-owner-ready']){
  window.addEventListener(evt,()=>{void refresh()});
 }
})();
/* ZAVI ONE offline barcode camera: native BarcodeDetector or bundled ZXing.
 * No CDN, cloud queries or writes. Existing catalog/invoice validation is authoritative.
 */
(()=>{'use strict';
const dict={
 fa:{start:'اسکن بارکد',close:'بستن دوربین',ready:'بارکد را مقابل دوربین بگیرید.',unavailable:'اسکن دوربینی پشتیبانی نمی‌شود؛ بارکد را دستی وارد کنید.',secure:'دوربین به HTTPS یا اپ نصب‌شده نیاز دارد.',denied:'اجازه دوربین داده نشد؛ بارکد را دستی وارد کنید.',retry:'دوربین متوقف شد. دوباره کوشش کنید.'},
 ps:{start:'د بارکوډ سکن',close:'کمره بندول',ready:'بارکوډ د کمرې مخې ته ونیسئ.',unavailable:'د کمرې سکن نشته؛ کوډ په لاس ولیکئ.',secure:'کمره HTTPS یا نصب شوی اپ غواړي.',denied:'د کمرې اجازه نشته؛ کوډ په لاس ولیکئ.',retry:'کمره بنده شوه. بیا هڅه وکړئ.'},
 en:{start:'Scan barcode',close:'Close camera',ready:'Point the camera at the barcode.',unavailable:'Camera scanning unavailable; enter the barcode manually.',secure:'Camera requires HTTPS or an installed app.',denied:'Camera permission denied; enter the code manually.',retry:'Camera stopped. Please try again.'}
};
const ids=new Set(['zaviBarcodeScan','zaviWarehouseScan','fld_sku']);
const messages=()=>{const l=(document.documentElement.lang||'fa-AF').toLowerCase();return dict[l.startsWith('en')?'en':l.startsWith('ps')?'ps':'fa']};
function notify(value){if(typeof window.toast==='function')window.toast(value);else window.alert(value)}
let state=null,serial=0,frame=0;
function stop(){
 ++serial;
 if(frame)cancelAnimationFrame(frame);frame=0;
 const s=state;state=null;
 if(!s)return;
 try{s.cancel?.()}catch(_){}
 try{s.stream?.getTracks().forEach(t=>t.stop())}catch(_){}
 try{if(s.video){s.video.pause();s.video.srcObject=null}}catch(_){}
 try{s.panel?.remove()}catch(_){}
}
function deliver(value,token){
 if(!state||token!==serial)return;
 const clean=String(value??'').trim();
 if(!clean||clean.length>70||/[\x00-\x1f\x7f]/.test(clean))return;
 const {id,input}=state;
 if(!input.isConnected){stop();return}
 stop();input.value=clean;
 input.dispatchEvent(new Event('input',{bubbles:true}));
 input.dispatchEvent(new Event('change',{bubbles:true}));
 if(id!=='fld_sku')input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
 input.focus({preventScroll:true});
}
function panel(s){
 const box=document.createElement('section');box.id='zaviCameraPanel';box.className='zavi-camera-panel';box.setAttribute('role','region');box.setAttribute('aria-label',messages().start);
 const button=document.createElement('button');button.type='button';button.className='btn subtle';button.textContent=messages().close;button.addEventListener('click',stop);
 const video=document.createElement('video');video.id='zaviCameraVideo';video.autoplay=true;video.muted=true;video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('aria-label',messages().ready);
 const note=document.createElement('p');note.className='field-hint';note.setAttribute('role','status');note.textContent=messages().ready;
 box.append(button,video,note);
 const host=s.input.closest('.zavi-barcode-box')||s.input.closest('.field')||s.input.parentElement;
 host.append(box);s.panel=box;s.video=video;
}
async function fallback(s,token){
 if(!window.ZaviZXingV6591?.start){stop();notify(messages().unavailable);return}
 try{
  s.cancel=await window.ZaviZXingV6591.start(s.stream,s.video,value=>deliver(value,token));
  if(state!==s||serial!==token){try{s.cancel?.()}catch(_){}}
 }catch(err){if(state===s&&serial===token){stop();notify(messages().retry)}}
}
async function loop(token){
 const s=state;if(!s||serial!==token||!s.detector)return;
 if(!s.panel.isConnected||!s.input.isConnected){stop();return}
 if(!s.checking&&s.video.readyState>=2&&performance.now()-(s.lastFrame||0)>175){
  s.lastFrame=performance.now();s.checking=true;
  try{
   const codes=await s.detector.detect(s.video);
   if(state!==s||serial!==token)return;
   if(Array.isArray(codes))for(const found of codes){if(found?.rawValue){deliver(found.rawValue,token);return}}
   s.failures=0;
  }catch(_){
   s.failures++;
   if(s.failures>=10){s.detector=null;void fallback(s,token);return}
  }finally{s.checking=false}
 }
 if(state===s&&s.detector)frame=requestAnimationFrame(()=>loop(token));
}
async function start(id='zaviBarcodeScan'){
 if(!ids.has(id))return;
 const input=document.getElementById(id);if(!input){notify(messages().unavailable);return}
 stop();
 if(!window.isSecureContext){notify(messages().secure);return}
 if(!navigator.mediaDevices?.getUserMedia){notify(messages().unavailable);return}
 const token=serial,s={id,input,panel:null,video:null,stream:null,cancel:null,detector:null,checking:false,failures:0,lastFrame:0};
 state=s;panel(s);
 try{
  // IMPORTANT for Safari: invoke getUserMedia immediately in the user click, before any await.
  const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
  if(state!==s||token!==serial||!input.isConnected){stream.getTracks().forEach(t=>t.stop());return}
  s.stream=stream;s.video.srcObject=stream;
  try{await s.video.play()}catch(_){}
  if(state!==s||token!==serial)return;
  if(typeof window.BarcodeDetector==='function'){
   try{
    const preferred=['ean_13','ean_8','code_128','qr_code','upc_a','code_39'];
    const available=typeof window.BarcodeDetector.getSupportedFormats==='function'?await window.BarcodeDetector.getSupportedFormats():preferred;
    const formats=preferred.filter(x=>available.includes(x));
    if(formats.length)s.detector=new window.BarcodeDetector({formats});
   }catch(_){s.detector=null}
  }
  if(state!==s||token!==serial)return;
  if(s.detector)frame=requestAnimationFrame(()=>loop(token));
  else await fallback(s,token);
 }catch(error){
  if(state!==s||token!==serial)return;
  stop();
  notify(['NotAllowedError','PermissionDeniedError','SecurityError'].includes(error?.name)?messages().denied:messages().retry);
 }
}
document.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-zavi-camera-open]');
 if(button){e.preventDefault();void start(button.getAttribute('data-zavi-camera-open')||'zaviBarcodeScan');return}
 if(state&&(e.target.closest?.('#closeModal,#cancelModal')||e.target.id==='backdrop'))stop()
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
window.addEventListener('pagehide',stop);
const observer=new MutationObserver(()=>{if(state&&(!state.panel?.isConnected||!state.input?.isConnected))stop()});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.ZaviCameraScan={start,stop};
})();

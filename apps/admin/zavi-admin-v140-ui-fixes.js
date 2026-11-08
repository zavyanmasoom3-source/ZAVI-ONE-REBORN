/* ZAVI ONE ADMIN 1.4.0 QA — addon for original v1.3 APK (no module removal).
   Owner-only server contacts next to email; 50–115% view scale; accessible renewal prompts.
   Does not run any billing or delete action on its own. */
(()=>{'use strict';
  const STORAGE='zavi_admin_ui_scale_v140';
  let size=100, contacts=[], contactState='idle', inflight=null, lastFetch=0, updating=false, watcher;
  const langs={
    fa:{size:'📏 اندازه نمایش',help:'اندازه تمام صفحه مدیریت را از ۵۰٪ تا ۱۱۵٪ تنظیم کنید. این انتخاب در دستگاه شما می‌ماند.',smaller:'کوچک‌تر',larger:'بزرگ‌تر',reset:'اندازه عادی',wa:'پیام واتساپ',phone:'واتساپ',receipt:'شماره رسید به‌طور خودکار ساخته شد؛ فقط پس از دریافت واقعی پول تمدید را تأیید کنید.',renew:'💳 برای تمدید، مدت، مبلغ و دریافت واقعی پول را بررسی کنید. شماره رسید خودکار درج می‌شود.',fetch:'شماره‌های مجاز هنگام ورود مدیریت دریافت می‌شوند.',unavailable:'شماره واتساپ این حساب هنوز ثبت نشده است.'},
    ps:{size:'📏 د ښودنې اندازه',help:'د مدیریت د سکرین اندازه له ۵۰٪ تر ۱۱۵٪ بدله کړئ.',smaller:'کوچنی',larger:'لوی',reset:'عادي اندازه',wa:'واټساپ پیغام',phone:'واټساپ',receipt:'د رسید شمېره جوړه شوه. یوازې د پیسو تر ترلاسه کولو وروسته ګډون وغځوئ.',renew:'💳 د تمدید لپاره موده، پیسې او رسید وګورئ.',fetch:'ثبت شوې اړیکې د ادارې له سرور څخه اخیستل کېږي.',unavailable:'دې حساب ته د واټساپ شمېره لا نه ده ثبت شوې.'},
    en:{size:'📏 Display size',help:'Adjust the entire ADMIN display between 50% and 115%; saved on this device.',smaller:'Smaller',larger:'Larger',reset:'Reset to normal',wa:'Message on WhatsApp',phone:'WhatsApp',receipt:'Receipt reference generated. Confirm renewal only after receiving the actual payment.',renew:'💳 Review duration, amount and payment before renewal. The reference is filled automatically.',fetch:'Consented numbers are loaded from the protected central server.',unavailable:'No WhatsApp number registered for this account.'}
  };
  const language=()=>{const v=String(document.querySelector('#zaviAdminLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'};
  const t=()=>langs[language()];
  const clamp=x=>Math.min(115,Math.max(50,Math.round(Number(x)/5)*5));
  const valid=x=>/^\+[1-9][0-9]{5,14}$/.test(String(x||''))?String(x):'';
  const esc=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  try{const raw=localStorage.getItem(STORAGE);if(raw!==null&&Number.isFinite(+raw))size=clamp(raw)}catch(_){/* no storage */}
  function applySize(){
    document.documentElement.style.zoom=String(size/100);
    document.documentElement.dataset.zaviAdminSize=String(size);
    document.documentElement.style.setProperty('--zavi-admin-reciprocal-scale',String(100/size));
  }
  function setSize(next){size=clamp(next);try{localStorage.setItem(STORAGE,String(size))}catch(_){/* no storage */}applySize();updateSlider();return size}
  function addStyles(){if(document.querySelector('#zavi140Styles'))return;
    const st=document.createElement('style');st.id='zavi140Styles';
    st.textContent=`
#zavi140Size{border:1px solid #7caed047!important;padding:15px!important;margin-top:16px!important;border-radius:13px;background:rgba(28,133,184,.055);max-width:100%;box-sizing:border-box;direction:inherit}
#zavi140Size *{box-sizing:border-box}#zavi140Size h3{font-size:17px!important;line-height:1.8;margin:0 0 5px!important;color:inherit}#zavi140Size p{font-size:13px!important;line-height:1.8;margin:0 0 12px;opacity:.85}
#zavi140Size .z140SliderRow{display:flex;gap:12px;align-items:center;justify-content:space-between}#zavi140Size input[type=range]{display:block;flex:1;min-width:20px;max-width:100%;accent-color:#14a1c2;min-height:36px}#zavi140Size output{font-size:17px;font-weight:850;min-width:70px;direction:ltr;text-align:center;color:inherit}
#zavi140Size .z140ScaleRange{display:flex;justify-content:space-between;direction:ltr;opacity:.75;font-size:12px}#zavi140Size .z140ScaleBtns{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
#zavi140Size button{cursor:pointer;min-height:42px!important;font:700 13px/1.6 Tahoma,Arial,sans-serif;border-radius:10px!important;border:1px solid #78a4c5!important;background:rgba(28,125,178,.12)!important;color:inherit!important;padding:8px 12px!important}
.zavi140Wa{display:inline-flex!important;align-items:center;gap:6px;min-height:38px!important;padding:7px 10px!important;border-radius:9px;background:#087962!important;color:#fff!important;font:700 12px/1.5 Tahoma,Arial,sans-serif;text-decoration:none!important;direction:rtl;box-sizing:border-box}
.zavi140Phone{display:flex!important;align-items:center;gap:9px;flex-wrap:wrap;padding:4px 0;margin-top:6px!important;color:inherit;font-size:12px;min-height:36px}
.zavi140Phone .zavi140E164{direction:ltr;unicode-bidi:isolate;font-family:Arial,sans-serif;font-weight:800;overflow-wrap:anywhere}
.zavi140RenewInfo{border:1px solid #2cbb9957;border-radius:9px;padding:10px 12px;margin-top:12px;font-size:13px;line-height:1.9;background:rgba(17,133,91,.09);color:inherit}
#modalBg:not([hidden]){overflow-y:auto!important;overscroll-behavior:contain!important;padding:env(safe-area-inset-top,6px) 10px env(safe-area-inset-bottom,8px)!important}
#modalBg:not([hidden]) .modal-card{max-width:min(720px,100%)!important;max-height:calc(100dvh - 16px)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;box-sizing:border-box!important}
#z24Root .v24-actions{gap:9px!important}#z24Root .v24-btn{min-height:42px!important;line-height:1.7!important}
@media(max-width:700px){#zavi140Size{padding:12px!important}#zavi140Size .z140ScaleBtns button{flex:1 1 auto}#view .data-table td:first-child{min-width:160px}}
@media print{html{zoom:1!important}#zavi140Size,.zavi140Wa{display:none!important}}
`;
    (document.head||document.documentElement).appendChild(st);
  }
  function mountSize(){
    const target=document.querySelector('#view .zavi-theme-settings');
    if(!target||target.querySelector('#zavi140Size'))return;
    const div=document.createElement('div');div.id='zavi140Size';
    div.innerHTML='<h3 class="z140Title"></h3><p class="z140Info"></p><div class="z140SliderRow"><input type="range" id="zavi140Range" min="50" max="115" step="5" aria-label="Display scale 50 to 115 percent"><output id="zavi140Output" for="zavi140Range"></output></div><div class="z140ScaleRange"><span>50%</span><span>115%</span></div><div class="z140ScaleBtns"><button type="button" data-scale="down"></button><button type="button" data-scale="up"></button><button type="button" data-scale="reset"></button></div>';
    target.append(div);
    div.querySelector('input').addEventListener('input',e=>setSize(e.target.value));
    div.querySelector('[data-scale="down"]').addEventListener('click',()=>setSize(size-5));
    div.querySelector('[data-scale="up"]').addEventListener('click',()=>setSize(size+5));
    div.querySelector('[data-scale="reset"]').addEventListener('click',()=>setSize(100));
    updateSlider();
  }
  function updateSlider(){const root=document.querySelector('#zavi140Size');if(!root)return;const words=t();
    root.querySelector('.z140Title').textContent=words.size;
    root.querySelector('.z140Info').textContent=words.help;
    root.querySelector('input').value=String(size);
    root.querySelector('output').textContent=size+'%';
    root.querySelector('[data-scale="down"]').textContent='− '+words.smaller;
    root.querySelector('[data-scale="up"]').textContent='+ '+words.larger;
    root.querySelector('[data-scale="reset"]').textContent='↺ '+words.reset;
    root.querySelector('[data-scale="down"]').disabled=size<=50;
    root.querySelector('[data-scale="up"]').disabled=size>=115;
  }
  // Browser WebView links are handled externally by native Android; never auto-send messages.
  function contactMap(){return new Map(contacts.map(c=>[String(c.account_email||'').toLowerCase().trim(),valid(c.whatsapp_e164)]))}
  function decorateCustomerRows(){
    if(!contacts.length)return;
    const byEmail=contactMap();
    const matches=[...document.querySelectorAll('#view .data-table tbody tr,#z24Root .v24-table tbody tr')];
    for(const row of matches){
      const td=row.querySelector('td:first-child');const small=td?.querySelector('small');
      if(!td||!small)continue;
      const email=small.textContent.trim().toLowerCase();
      const number=byEmail.get(email);
      if(!number || td.querySelector('.zavi140Phone'))continue;
      const bar=document.createElement('div');bar.className='zavi140Phone';bar.setAttribute('aria-label',t().phone+' '+number);
      const label=document.createElement('span');label.className='zavi140E164';label.textContent=number;
      const link=document.createElement('a');link.className='zavi140Wa';link.href='https://wa.me/'+number.slice(1);link.rel='noopener';link.textContent='💬 '+t().wa;link.setAttribute('aria-label',t().wa+' '+email);
      bar.append(label,link);small.insertAdjacentElement('afterend',bar);
    }
  }
  function renewModal(){
    const modal=document.getElementById('modalBg');if(!modal||modal.hidden)return;
    const field=document.getElementById('paymentReceipt');if(!field)return;
    if(!field.value.trim()){
      const rand=(window.crypto?.randomUUID?.()||String(Math.random()).slice(2)).replace(/-/g,'').slice(0,8).toUpperCase();
      field.value='ZAVI-'+new Date().toISOString().replace(/[-:T.Z]/g,'').slice(0,14)+'-'+rand;
    }
    const body=document.getElementById('modalBody');if(body&&!body.querySelector('.zavi140RenewInfo')){
      const p=document.createElement('p');p.className='zavi140RenewInfo';p.textContent=t().renew;
      const action=body.querySelector('.modal-actions');if(action)action.before(p);else body.append(p);
    }
  }
  async function refreshContacts(force=false){
    const api=window.ZaviAdminAPI;if(api?.getMode?.()!=='live')return;
    if(inflight)return inflight;
    if(!force && contactState==='ready' && Date.now()-lastFetch<120000)return;
    contactState='loading';
    inflight=(async()=>{
      try{
        const data=await api.request('/rest/v1/rpc/zavi_admin_registration_contacts',{method:'POST',body:{}});
        if(!Array.isArray(data))throw Error('Contacts endpoint returned no list');
        contacts=data.filter(c=>c?.contact_opt_in===true && valid(c.whatsapp_e164))
          .map(c=>({account_email:String(c.account_email||''),whatsapp_e164:valid(c.whatsapp_e164)}));
        contactState='ready';lastFetch=Date.now();decorateCustomerRows();
      }catch(e){contactState='error';console.warn('[ZAVI ADMIN] Owner-only WhatsApp list unavailable');}
      finally{inflight=null}
    })();return inflight;
  }
  function update(){if(updating)return;updating=true;queueMicrotask(()=>{updating=false;mountSize();renewModal();decorateCustomerRows();})}
  function start(){addStyles();applySize();
    const root=document.getElementById('appScreen');
    watcher=new MutationObserver(update);
    if(root)watcher.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    update();
    document.addEventListener('zavi-admin-data-updated',()=>{refreshContacts(true).catch(()=>{})});
    document.addEventListener('click',e=>{
      if(e.target.closest('[data-page="customers"],[data-page="settings"],#z24NavOpen')){setTimeout(()=>{update();refreshContacts().catch(()=>{})},0)}
      if(e.target.closest('#renewConfirm'))renewModal();
    },true);
    document.addEventListener('change',e=>{if(e.target.id==='zaviAdminLanguage'){updateSlider();update()}});
    window.addEventListener('storage',e=>{if(e.key===STORAGE && e.newValue!==null && Number.isFinite(+e.newValue)){size=clamp(e.newValue);applySize();updateSlider()}});
    if(window.ZaviAdminAPI?.getMode?.()==='live')refreshContacts().catch(()=>{});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

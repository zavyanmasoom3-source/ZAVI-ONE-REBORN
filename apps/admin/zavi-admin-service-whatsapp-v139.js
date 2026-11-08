/* ZAVI ONE ADMIN v1.3.9 — additive contact list in existing Professional Services.
 * Preserves original admin UI, subscription and service tools unmodified.
 * Contacts are read only from the owner-authorized server RPC; none stored locally.
 */
(()=>{
  'use strict';
  const DIAL = /^\+[1-9][0-9]{5,14}$/;
  const rpcPath='/rest/v1/rpc/zavi_admin_registration_contacts';
  const originalRootId='zaviServiceCenter';
  const cardId='zaviServiceWhatsAppContactsV139';
  const T={
    fa:{title:'📱 واتساپ مشتریان',description:'شماره‌های ثبت‌نام ابری جدید که مشتری با اطلاع خود ثبت کرده است. این شماره‌ها فقط برای مدیر اصلی نمایش داده می‌شوند.',search:'جستجو با ایمیل یا شماره',reload:'↻ تازه‌سازی شماره‌ها',loading:'در حال دریافت شماره‌های مجاز از سرور…',empty:'هنوز شماره واتساپ ثبت‌شده‌ای برای حساب‌های جدید موجود نیست.',unavailable:'اتصال سرور یا صلاحیت مدیر را بررسی کنید. شماره‌ها فقط با ورود مجاز قابل مشاهده هستند.',demo:'شماره‌های واقعی در حالت نمایشی نمایش داده نمی‌شوند.',message:'💬 پیام واتساپ',call:'☎ تماس',counter:'مشتری با شماره واتساپ',old:'شماره حساب‌های قدیمی بدون ثبت‌نام واتساپ موجود نیست.'},
    ps:{title:'📱 د مشتریانو واټساپ',description:'د نویو کلاوډ حسابونو شمېرې چې مشتریانو په خپله خوښه ثبت کړې؛ یوازې مرکزي مدیر یې لیدلی شي.',search:'په ایمیل یا شمېره لټون',reload:'↻ تازه کول',loading:'له خوندي سرور څخه شمېرې ترلاسه کېږي…',empty:'تر اوسه د نویو حسابونو واټساپ شمېره نه ده ثبت شوې.',unavailable:'انټرنټ او د مرکزي مدیر اجازه وګورئ.',demo:'په آزمایښتي حالت کې شمېرې نه ښکاري.',message:'💬 واټساپ پیغام',call:'☎ زنګ',counter:'د واټساپ لرونکي مشتریان',old:'زاړه حسابونه چې شمېره یې نه ده ثبت کړې، نه ښکاري.'},
    en:{title:'📱 Customer WhatsApp',description:'Numbers provided with notice during new cloud-account registration. Visible only to the central administrator.',search:'Search email or WhatsApp number',reload:'↻ Refresh contacts',loading:'Loading authorized contacts from server…',empty:'No WhatsApp numbers recorded for new signups yet.',unavailable:'Check the server connection and central administrator permissions.',demo:'Real contact details are not shown in demo mode.',message:'💬 Message on WhatsApp',call:'☎ Call',counter:'Customers with WhatsApp',old:'Older accounts with no submitted WhatsApp number will not appear.'}
  };
  function language(){const raw=String(document.getElementById('zaviAdminLanguage')?.value||document.documentElement.lang||'fa').toLowerCase();return raw.startsWith('en')?'en':raw.startsWith('ps')?'ps':'fa'}
  const tr=()=>T[language()];
  const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validNumber=x=>DIAL.test(String(x||''))?String(x):'';
  const whatsappLink=num=>'https://wa.me/'+num.slice(1);
  let root=null,rootObserver=null,items=[],status='new',search='',pending=false,generation=0;
  function css(){
    if(document.getElementById('zaviServiceWhatsAppCSS139'))return;
    const s=document.createElement('style');s.id='zaviServiceWhatsAppCSS139';
    s.textContent=`
#${cardId}{margin:14px 0;padding:16px;border:1px solid #b9d7e9;border-radius:16px;background:rgba(48,137,191,.075);color:inherit;direction:inherit;max-width:100%;box-sizing:border-box}
#${cardId} .zsvc-wh-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
#${cardId} h2{font-size:18px;font-weight:850;margin:0;line-height:1.7;color:inherit}
#${cardId} .zsvc-wh-desc{font-size:13px;line-height:1.8;margin:8px 0 12px;opacity:.8}
#${cardId} .zsvc-wh-search{box-sizing:border-box;width:100%;min-height:43px;border:1px solid #8aadc8;border-radius:10px;background:var(--card,#fff);color:var(--text,#203951);font-size:14px;padding:9px 12px}
#${cardId} .zsvc-wh-status{font-size:13px;line-height:1.7;padding:11px 0}
#${cardId} .zsvc-wh-count{font-size:12px;opacity:.8;font-weight:700}
#${cardId} .zsvc-wh-refresh{border:1px solid #8cb4ce;border-radius:10px;padding:8px 12px;background:rgba(58,156,211,.13);color:inherit;font-size:13px;min-height:40px;font-weight:750;cursor:pointer}
#${cardId} .zsvc-wh-list{display:grid;gap:9px;margin-top:10px}
#${cardId} .zsvc-wh-item{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;border:1px solid rgba(90,150,190,.26);border-radius:12px;padding:12px;background:rgba(134,176,200,.06)}
#${cardId} .zsvc-wh-item b{font-size:14px;display:block;overflow-wrap:anywhere}
#${cardId} .zsvc-wh-number{display:block;font-size:13px;font-weight:650;unicode-bidi:isolate;direction:ltr;text-align:start;margin-top:4px}
#${cardId} .zsvc-wh-buttons{display:flex;gap:8px;flex-wrap:wrap}
#${cardId} .zsvc-wh-buttons a, #${originalRootId} .zsvc-wh-quick{display:inline-flex!important;align-items:center;justify-content:center;min-height:37px;padding:7px 12px;border-radius:9px;text-decoration:none!important;font-size:13px;font-weight:750;border:0;color:#fff!important;background:#087d68}
#${cardId} .zsvc-wh-buttons .zsvc-wh-call{background:#286ca6}
#${originalRootId} .zsvc-wh-quick{margin:3px 2px}
@media(max-width:600px){#${cardId}{padding:12px}#${cardId} .zsvc-wh-buttons{width:100%}}
@media print{#${cardId}{display:none!important}}
`;
    document.head.appendChild(s);
  }
  function decorateRows(){
    if(!root||!items.length)return;
    const byEmail=new Map(items.map(c=>[String(c.account_email||'').toLowerCase(),validNumber(c.whatsapp_e164)]));
    root.querySelectorAll('#zsvc-results tbody tr').forEach(row=>{
      const email=String(row.querySelector('td:first-child small')?.textContent||'').trim().toLowerCase();
      const wa=byEmail.get(email);
      const actions=row.querySelector('.zsvc-actions');
      if(!wa||!actions||actions.querySelector('.zsvc-wh-quick'))return;
      const a=document.createElement('a');a.className='zsvc-wh-quick';a.textContent='💬 WhatsApp';a.href=whatsappLink(wa);a.rel='noopener';a.setAttribute('aria-label','Send WhatsApp to '+email);actions.appendChild(a);
    });
  }
  function paint(){
    const card=root?.querySelector('#'+cardId);if(!card)return;
    const t=tr();
    card.querySelector('.zsvc-wh-title').textContent=t.title;
    card.querySelector('.zsvc-wh-desc').textContent=t.description;
    const input=card.querySelector('.zsvc-wh-search');input.placeholder=t.search;
    const refresh=card.querySelector('.zsvc-wh-refresh');refresh.textContent=t.reload;
    const list=card.querySelector('.zsvc-wh-list');
    const visible=items.filter(c=>String(c.account_email+' '+c.whatsapp_e164+' '+c.phone_e164).toLowerCase().includes(search));
    const signature=[language(),status,search,items.length,visible.map(c=>c.whatsapp_e164).join('|')].join('~');
    if(list.dataset.signature===signature)return;
    list.dataset.signature=signature;
    card.querySelector('.zsvc-wh-count').textContent=status==='ready'?`${visible.length} ${t.counter}`:'';
    if(status!=='ready'){
      const message=status==='loading'?t.loading:status==='demo'?t.demo:status==='error'?t.unavailable:t.empty;
      list.textContent=message;return;
    }
    if(!visible.length){list.textContent=t.empty;return;}
    const fragment=document.createDocumentFragment();
    for(const c of visible){
      const wa=validNumber(c.whatsapp_e164),tel=validNumber(c.phone_e164);if(!wa)continue;
      const article=document.createElement('article');article.className='zsvc-wh-item';
      article.innerHTML=`<div><b>${safe(c.account_email||'—')}</b><span class="zsvc-wh-number" dir="ltr">${safe(wa)}</span></div><div class="zsvc-wh-buttons"></div>`;
      const buttons=article.querySelector('.zsvc-wh-buttons');
      const waButton=document.createElement('a');waButton.textContent=t.message;waButton.href=whatsappLink(wa);waButton.rel='noopener';
      buttons.appendChild(waButton);
      if(tel){const call=document.createElement('a');call.className='zsvc-wh-call';call.href='tel:'+tel;call.textContent=t.call;buttons.appendChild(call)}
      fragment.appendChild(article);
    }
    list.replaceChildren(fragment);decorateRows();
  }
  async function load(force=false){
    if(!root||pending||(!force&&status==='ready'))return;
    const api=window.ZaviAdminAPI;
    if(!api||api.getMode?.()!=='live'){items=[];status='demo';paint();return;}
    const epoch=generation;pending=true;status='loading';paint();
    try{
      const data=await api.request(rpcPath,{method:'POST',body:{}});
      if(!Array.isArray(data))throw Error('Protected RPC returned no list');
      if(!root||epoch!==generation)return;
      items=data.filter(x=>x&&x.contact_opt_in===true&&validNumber(x.whatsapp_e164))
        .map(x=>({account_email:String(x.account_email||''),whatsapp_e164:validNumber(x.whatsapp_e164),phone_e164:validNumber(x.phone_e164)}));
      status='ready';
    }catch(err){
      if(root&&epoch===generation){items=[];status='error';console.warn('Protected contact list unavailable',String(err?.message||''));}
    }finally{pending=false;if(root&&epoch===generation){paint();decorateRows();}}
  }
  function install(){
    const page=root?.querySelector('.zsvc-page');if(!page)return;
    let card=page.querySelector('#'+cardId);
    if(!card){
      card=document.createElement('section');card.id=cardId;card.setAttribute('aria-label',tr().title);
      card.innerHTML='<div class="zsvc-wh-head"><h2 class="zsvc-wh-title"></h2><button class="zsvc-wh-refresh" type="button"></button></div><p class="zsvc-wh-desc"></p><input type="search" class="zsvc-wh-search" autocomplete="off"><div class="zsvc-wh-count"></div><div class="zsvc-wh-list" role="status" aria-live="polite"></div>';
      const anchor=page.querySelector('.zsvc-shortcuts');
      if(anchor)anchor.insertAdjacentElement('afterend',card);else page.appendChild(card);
      const input=card.querySelector('input');input.value=search;
      input.addEventListener('input',e=>{search=e.target.value.trim().toLowerCase();paint();});
      card.querySelector('button').addEventListener('click',()=>load(true));
    }
    paint();decorateRows();
  }
  function recheck(){
    const next=document.getElementById(originalRootId);
    if(next!==root){
      if(rootObserver)rootObserver.disconnect();rootObserver=null;
      root=next;items=[];status='new';search='';pending=false;generation++;
      if(root){rootObserver=new MutationObserver(()=>{if(root?.querySelector('.zsvc-page')){install();}});
        rootObserver.observe(root,{childList:true,subtree:false});
        install();load();}
    }
  }
  function init(){css();new MutationObserver(recheck).observe(document.body,{childList:true,subtree:false});recheck();}
  document.addEventListener('change',e=>{if(e.target?.id==='zaviAdminLanguage')paint()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

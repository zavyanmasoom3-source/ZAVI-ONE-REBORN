/* Reference V3: rearrange existing authorized route buttons; no fake screen or mutation. */
(()=>{'use strict';
 const app=document.currentScript?.dataset.zaviReferenceApp==='admin'?'admin':'one';
 const words={
 fa:{overview:'داشبورد',customers:'مشتریان',payments:'اشتراک و تمدید',
  devices:'دستگاه‌ها',support:'ارتباط و پیام‌ها',activity:'تاریخچه عملیات',
  security:'امنیت و دسترسی',settings:'تنظیمات',finance:'حسابداری درآمد',
  health:'وضعیت سیستم',brand:'مدیریت برند',more:'ابزارهای بیشتر'},
 ps:{overview:'ډشبورډ',customers:'پېرودونکي',payments:'ګډون او تمدید',
  devices:'وسیلې',support:'اړیکې او پیغامونه',activity:'د عملیاتو تاریخچه',
  security:'امنیت او لاسرسی',settings:'تنظیمات',finance:'د عاید حسابداري',
  health:'د سیسټم حالت',brand:'د برانډ مدیریت',more:'نور وسایل'},
 en:{overview:'Dashboard',customers:'Customers',payments:'Subscriptions',
  devices:'Devices',support:'Messages & support',activity:'Activity history',
  security:'Security & access',settings:'Settings',finance:'Revenue accounting',
  health:'System status',brand:'Brand management',more:'More tools'}
 };
 const lang=()=>{const v=(document.documentElement.lang||'fa').toLowerCase();
  return v.startsWith('en')?'en':v.startsWith('ps')?'ps':'fa'};
 function admin(){
  const nav=document.querySelector('#appScreen .sidebar .nav');
  if(!nav||nav.dataset.zaviRefReady)return;
  nav.dataset.zaviRefReady='true';
  const nodes=new Map([...nav.querySelectorAll(':scope > [data-page]')]
    .map(b=>[b.dataset.page,b]));
  for(const p of ['overview','customers','payments','devices','support','activity','security','settings'])
   if(nodes.has(p))nav.append(nodes.get(p));
  const more=document.createElement('details');more.className='zavi-ref-more';
  const heading=document.createElement('summary');more.append(heading);
  for(const p of ['finance','health','brand'])if(nodes.has(p))more.append(nodes.get(p));
  if(more.querySelector('.nav-item'))nav.append(more);
  // Older extensions may add extra sidebar entries (some after DOMContentLoaded).
  // Move their original live buttons into the collapsed area; never delete the
  // buttons or their original listeners. This is only presentation.
  const primarySet=new Set(['overview','customers','payments','devices',
    'support','activity','security','settings']);
  function compactLegacy(){
   for(const button of [...nav.children]){
    if(button===more || !button.classList?.contains('nav-item'))continue;
    if(button.dataset.page && primarySet.has(button.dataset.page))continue;
    more.append(button);
   }
  }
  compactLegacy();
  new MutationObserver(compactLegacy).observe(nav,{childList:true});
  function translate(){
   const dict=words[lang()];heading.textContent=dict.more;
   for(const [key,button] of nodes){
    const value=dict[key];if(!value)continue;
    const node=[...button.childNodes].filter(n=>n.nodeType===3).pop();
    if(node)node.textContent=' '+value;
    button.setAttribute('aria-label',value);
   }
  }
  function selected(){if(more.querySelector('.nav-item.selected'))more.open=true}
  translate();selected();
  new MutationObserver(selected).observe(nav,{attributes:true,subtree:true,attributeFilter:['class']});
  new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('zavi:language-change',translate);
 }
 function one(){
  const nav=document.getElementById('mobileBottom');
  if(nav)nav.setAttribute('aria-label',lang()==='en'?'Main navigation':'ناوبری اصلی');
 }
 const init=()=>app==='admin'?admin():one();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();

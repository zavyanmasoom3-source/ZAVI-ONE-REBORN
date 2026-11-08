/* ZAVI ONE / ADMIN 65.45 — Settings-only size slider (50–115%). No floating control. */
(()=>{'use strict';
const KEY='zavi_display_percent_v6545', OLD='zavi_display_scale_v6544', MIN=50,MAX=115,STEP=5;
const words={
 fa:{title:'اندازه نمایش',help:'اندازه نوشته‌ها و بخش‌های سیستم را به دلخواه تنظیم کنید.',less:'کوچک‌تر',more:'بزرگ‌تر',reset:'اندازه عادی (۱۰۰٪)',close:'بستن تنظیم اندازه',open:'بازکردن تنظیم اندازه',slider:'تغییر اندازه نمایش'},
 ps:{title:'د ښودنې اندازه',help:'د لیکنو او د سیسټم برخو اندازه په خپله خوښه بدله کړئ.',less:'کوچنی',more:'لوی',reset:'عادي اندازه (۱۰۰٪)',close:'د اندازې تنظیم بندول',open:'د اندازې تنظیم پرانیستل',slider:'د ښودنې اندازه بدلول'},
 en:{title:'Display size',help:'Adjust the size of text and interface controls.',less:'Smaller',more:'Larger',reset:'Normal size (100%)',close:'Close display size settings',open:'Open display size settings',slider:'Adjust display size'}
};
const clamp=n=>Math.min(MAX,Math.max(MIN,Math.round(Number(n)/STEP)*STEP));
const safe=n=>Number.isFinite(Number(n))?clamp(n):100;
let percent=100,open=true,langMemo='',scheduled=false;
try{
 const saved=localStorage.getItem(KEY);
 if(saved!==null&&Number.isFinite(Number(saved))) percent=safe(saved);
 else{
  const old=localStorage.getItem(OLD);
  if(old==='small')percent=85;
  if(old==='medium')percent=100;
  if(old==='large')percent=115;
 }
}catch(_){}
function language(){
 const selected=document.querySelector('#zaviSettingsLanguage,#zaviGateLanguage,[name="language"]');
 const raw=String(selected?.value||document.documentElement.lang||'fa').trim().toLowerCase();
 return raw.startsWith('en')?'en':raw.startsWith('ps')?'ps':'fa';
}
function apply(){
 document.documentElement.style.zoom=String(percent/100);
 document.documentElement.dataset.zaviDisplayPercent=String(percent);
}
function save(n){
 percent=safe(n);try{localStorage.setItem(KEY,String(percent))}catch(_){}
 apply();update();
 return percent;
}
function injectCSS(){
 if(document.getElementById('zavi-display-settings-style-v6545'))return;
 const st=document.createElement('style');st.id='zavi-display-settings-style-v6545';
 st.textContent=String.raw`
/* Hide v65.44 overlay even if an old offline cache injects it */
#zavi-display-control{display:none!important}
#zavi-display-settings-v6545{position:relative;box-sizing:border-box;width:100%;max-width:100%;grid-column:1/-1;min-width:0;direction:inherit;text-align:start;border:1px solid #9bbcd3;border-radius:15px;background:#f4f9fd;color:#18334f;padding:14px 15px;margin:12px 0;font:inherit;box-shadow:none}
#zavi-display-settings-v6545 *{box-sizing:border-box}
#zavi-display-settings-v6545 .zds-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
#zavi-display-settings-v6545 .zds-title{font-size:15px;font-weight:800;color:inherit;margin:0}
#zavi-display-settings-v6545 .zds-close{min-height:35px;min-width:60px;padding:5px 11px;border:1px solid #90aec6;border-radius:9px;color:#153f5e;background:#fff;font-size:13px;font-weight:650;cursor:pointer}
#zavi-display-settings-v6545 .zds-content[hidden]{display:none!important}
#zavi-display-settings-v6545 .zds-help{font-size:13px;line-height:1.8;margin:12px 0 9px;color:inherit}
#zavi-display-settings-v6545 .zds-range-line{display:flex;gap:10px;align-items:center;min-width:0}
#zavi-display-settings-v6545 .zds-slider{display:block;flex:1 1 auto;min-width:20px;width:100%;accent-color:#1579b6;height:28px;cursor:pointer}
#zavi-display-settings-v6545 .zds-value{min-width:72px;text-align:center;direction:ltr;unicode-bidi:isolate;font-size:17px;font-weight:800}
#zavi-display-settings-v6545 .zds-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px}
#zavi-display-settings-v6545 .zds-action{border:1px solid #acc6d9;background:#fff;color:#163c5f;border-radius:10px;padding:7px 12px;min-height:38px;font-size:13px;cursor:pointer;line-height:1.6}
#zavi-display-settings-v6545 .zds-action:disabled{opacity:.4;cursor:default}
#zavi-display-settings-v6545 .zds-ticks{display:flex;justify-content:space-between;font-size:12px;direction:ltr;opacity:.75}
html[data-theme="dark"] #zavi-display-settings-v6545,
body.dark #zavi-display-settings-v6545,
html.dark #zavi-display-settings-v6545,
body[data-theme="dark"] #zavi-display-settings-v6545{background:#18314c;color:#f0f7ff;border-color:#497396}
html[data-theme="dark"] #zavi-display-settings-v6545 button,
body.dark #zavi-display-settings-v6545 button,
html.dark #zavi-display-settings-v6545 button,
body[data-theme="dark"] #zavi-display-settings-v6545 button{background:#234765;color:#fff;border-color:#5a89ad}
@media print{html{zoom:1!important}#zavi-display-settings-v6545,#zavi-display-control{display:none!important}}
`;
 (document.head||document.documentElement).appendChild(st);
}
function update(){
 const p=document.getElementById('zavi-display-settings-v6545');if(!p)return;
 const t=words[language()];
 p.querySelector('.zds-title').textContent=t.title;
 p.querySelector('.zds-help').textContent=t.help;
 const close=p.querySelector('.zds-close');close.textContent=open?t.close:t.open;
 close.setAttribute('aria-expanded',String(open));
 const content=p.querySelector('.zds-content');content.hidden=!open;
 p.querySelector('.zds-value').textContent=percent+'%';
 const slider=p.querySelector('.zds-slider');slider.value=String(percent);slider.setAttribute('aria-label',t.slider);
 const less=p.querySelector('[data-zds="less"]'),more=p.querySelector('[data-zds="more"]');
 less.textContent='− '+t.less;less.disabled=percent<=MIN;
 more.textContent='+ '+t.more;more.disabled=percent>=MAX;
 p.querySelector('[data-zds="reset"]').textContent=t.reset;
 langMemo=language();
}
function mount(){
 injectCSS();
 const obsolete=document.getElementById('zavi-display-control');if(obsolete)obsolete.remove();
 let target=null,mode='';
 const field=document.querySelector('#zaviSettingsLanguage')?.closest('.field');
 if(field&&field.parentElement){target=field;mode='one';}
 else if(document.querySelector('.zavi-theme-settings')){target=document.querySelector('.zavi-theme-settings');mode='admin';}
 if(!target)return;
 if(document.getElementById('zavi-display-settings-v6545')){if(langMemo!==language())update();return;}
 const panel=document.createElement('section');
 panel.id='zavi-display-settings-v6545';
 if(mode==='admin')panel.classList.add('panel');
 panel.setAttribute('aria-label',words[language()].title);
 panel.innerHTML='<div class="zds-head"><h3 class="zds-title"></h3><button type="button" class="zds-close" aria-controls="zds-controls" aria-expanded="true"></button></div><div class="zds-content" id="zds-controls"><p class="zds-help"></p><div class="zds-range-line"><input class="zds-slider" type="range" min="50" max="115" step="5" value="100"><output class="zds-value" for="zds-range">100%</output></div><div class="zds-ticks"><span>50%</span><span>115%</span></div><div class="zds-actions"><button type="button" class="zds-action" data-zds="less"></button><button type="button" class="zds-action" data-zds="more"></button><button type="button" class="zds-action" data-zds="reset"></button></div></div>';
 if(mode==='one')target.parentElement.insertBefore(panel,target);
 else target.insertAdjacentElement('afterend',panel);
 panel.querySelector('.zds-slider').addEventListener('input',e=>save(e.target.value));
 panel.querySelector('[data-zds="less"]').addEventListener('click',()=>save(percent-STEP));
 panel.querySelector('[data-zds="more"]').addEventListener('click',()=>save(percent+STEP));
 panel.querySelector('[data-zds="reset"]').addEventListener('click',()=>save(100));
 panel.querySelector('.zds-close').addEventListener('click',()=>{open=!open;update()});
 update();
}
function schedule(){if(scheduled)return;scheduled=true;Promise.resolve().then(()=>{scheduled=false;mount()})}
apply();
window.ZaviDisplayScale=Object.freeze({get:()=>percent,set:save,limits:[MIN,MAX]});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mount();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})},{once:true});
else{mount();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})}
document.addEventListener('change',e=>{if(e.target.matches('#zaviSettingsLanguage,[name="language"]'))update()});
window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue!==null){percent=safe(e.newValue);apply();update()}});
})();
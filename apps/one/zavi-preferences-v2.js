/* ZAVI appearance and language controls v2. Does not touch financial data, auth, or navigation. */
(()=>{'use strict';
const app=document.currentScript?.dataset.zaviApp||'one';
const langKey=app==='admin'?'zavi_admin_language_v18':'zavi_public_language_v11';
const translations={
'fa-AF':{title:'نمایش و زبان',theme:'ظاهر برنامه',language:'زبان',light:'روشن',dark:'تاریک',glass:'شیشه‌ای',dari:'دری',pashto:'پشتو',english:'English'},
'ps-AF':{title:'بڼه او ژبه',theme:'د اپ بڼه',language:'ژبه',light:'روښانه',dark:'تیاره',glass:'ښیښه‌یي',dari:'دري',pashto:'پښتو',english:'English'},
'en':{title:'Appearance and language',theme:'Theme',language:'Language',light:'Light',dark:'Dark',glass:'Glass',dari:'Dari',pashto:'Pashto',english:'English'}};
const safeRead=(k,d)=>{try{return localStorage.getItem(k)||d}catch{return d}};
const safeWrite=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
function setLanguage(l){if(!translations[l])return;safeWrite(langKey,l);document.documentElement.lang=l;document.documentElement.dir=l==='en'?'ltr':'rtl';document.documentElement.dataset.zaviLang=l;refresh();document.dispatchEvent(new CustomEvent('zavi:language-change',{detail:{language:l}}))}
function setAppearance(t){if(!['light','dark','glass'].includes(t))return;safeWrite('zavi_ui_appearance_v2',t);safeWrite('zavi_theme_preference_v29',t);document.documentElement.dataset.zaviTheme=t;document.documentElement.dataset.zaviAppearance=t;window.ZaviThemeV29?.set?.(t);refresh();document.dispatchEvent(new CustomEvent('zavi:appearance-change',{detail:{appearance:t}}))}
/* Keep the existing ONE appearance card in sync with the three-mode shared
   picker. Never replace its navigation, storage, finance or event handlers. */
function syncNativeAppearance(){
 if(app!=='one')return;
 const picker=document.querySelector('#content .zavi-theme-settings .zavi-theme-picker');
 if(!picker)return;
 const lang=document.documentElement.lang in translations?document.documentElement.lang:'fa-AF';
 const labels=translations[lang];
 const current=window.ZaviThemeV29?.get?.()||
   safeRead('zavi_ui_appearance_v2',safeRead('zavi_theme_preference_v29','dark'));
 const title=picker.closest('.zavi-theme-settings')?.querySelector('h3');
 if(title)title.textContent=labels.theme;
 picker.setAttribute('aria-label',labels.theme);
 for(const [mode,sign] of [['light','☀'],['dark','☾'],['glass','◈']]){
   let button=picker.querySelector('[data-zavi-theme-choice="'+mode+'"]');
   if(!button){
     button=document.createElement('button');
     button.type='button';
     button.className='zavi-theme-choice';
     button.dataset.zaviThemeChoice=mode;
     picker.append(button);
   }
   button.textContent=sign+' '+labels[mode];
   button.setAttribute('aria-pressed',String(current===mode));
 }
}
function refresh(){syncNativeAppearance();let root=document.getElementById('zavi-ui-preferences-v2');if(!root)return;root.classList.toggle('zui-hide-duplicate-theme',app==='one'&&!!document.querySelector('#content .zavi-theme-settings .zavi-theme-picker'));let l=document.documentElement.lang in translations?document.documentElement.lang:'fa-AF',t=translations[l];root.querySelector('[data-zui-title]').textContent=t.title;root.querySelector('[data-zui-theme-label]').textContent=t.theme;root.querySelector('[data-zui-language-label]').textContent=t.language;root.querySelectorAll('[data-zui-theme]').forEach(b=>{b.textContent=t[b.dataset.zuiTheme];b.setAttribute('aria-pressed',String((safeRead('zavi_ui_appearance_v2','dark'))===b.dataset.zuiTheme))});root.querySelectorAll('[data-zui-language]').forEach(b=>{b.textContent=t[b.dataset.zuiLanguage==='fa-AF'?'dari':b.dataset.zuiLanguage==='ps-AF'?'pashto':'english'];b.setAttribute('aria-pressed',String(l===b.dataset.zuiLanguage))})}
function create(){let root=document.createElement('section');root.id='zavi-ui-preferences-v2';root.className='zui-preferences';root.setAttribute('aria-label','Appearance and language');root.innerHTML='<h3 data-zui-title></h3><div class="zui-pref-row zui-pref-theme-row"><span data-zui-theme-label></span><div class="zui-pref-buttons"><button type="button" data-zui-theme="light"></button><button type="button" data-zui-theme="dark"></button><button type="button" data-zui-theme="glass"></button></div></div><div class="zui-pref-row"><span data-zui-language-label></span><div class="zui-pref-buttons"><button type="button" data-zui-language="fa-AF"></button><button type="button" data-zui-language="ps-AF"></button><button type="button" data-zui-language="en"></button></div></div>';const info=document.createElement('p');info.className='zui-build-info';info.textContent='Build: loading…';root.appendChild(info);fetch('./zavi-build-info.json',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{info.textContent='Version: '+String(data.version||'unknown')+' · Commit: '+String(data.commit||'unknown').slice(0,12)}).catch(()=>{info.textContent='Version information unavailable'});root.addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;if(b.dataset.zuiTheme)setAppearance(b.dataset.zuiTheme);if(b.dataset.zuiLanguage)setLanguage(b.dataset.zuiLanguage)});return root}
function attach(){let host=app==='admin'?document.querySelector('#view'):document.querySelector('#content');if(!host)return;let settings=app==='admin'?document.querySelector('#appScreen .nav-item.selected')?.dataset.page==='settings':(typeof page==='string'&&page==='settings');if(!settings){document.getElementById('zavi-ui-preferences-v2')?.remove();return}let root=document.getElementById('zavi-ui-preferences-v2');if(!root){root=create();host.prepend(root)}refresh()}
let scheduled=false;function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;attach()})}
function boot(){let appearance=safeRead('zavi_ui_appearance_v2',safeRead('zavi_theme_preference_v29','dark'));setAppearance(['light','dark','glass'].includes(appearance)?appearance:'dark');let host=app==='admin'?document.querySelector('#view'):document.querySelector('#content');if(host){new MutationObserver(queue).observe(host,{childList:true,subtree:false})}queue()}
document.addEventListener('zavi:theme-changed',refresh);
document.addEventListener('zavi:language-change',refresh);
document.addEventListener('change',e=>{
 if(e.target?.id==='zaviSettingsLanguage')requestAnimationFrame(refresh);
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

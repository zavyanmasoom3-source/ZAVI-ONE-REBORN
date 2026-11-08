/* ZAVI ONE V19 / ADMIN V18: read-only Afghan Solar Hijri + Gregorian presentation.
 * Calendar mode is a browser preference, NEVER rewrite stored accounting dates. */
(()=>{'use strict';
const KEY='zavi_calendar_display_preference_v19';
const lang=()=>{const get=window.zaviPublicLanguage?.()||window.ZaviAdminLanguage?.get?.();if(get)return get;try{return localStorage.getItem('zavi_public_language_v11')||localStorage.getItem('zavi_admin_language_v18')||'fa-AF'}catch(_){return 'fa-AF'}};
const t=(fa,ps,en)=>{const v=lang();return v==='en'?en:v==='ps-AF'?ps:fa};
const timeZone='Asia/Kabul';
function displayDate(dt,kind){try{
 const l=lang();
 if(kind==='solar')return new Intl.DateTimeFormat(l==='en'?'en-US-u-ca-persian':(l==='ps-AF'?'ps-AF-u-ca-persian':'fa-AF-u-ca-persian'),{day:'numeric',month:'long',year:'numeric',timeZone}).format(dt);
 return new Intl.DateTimeFormat(l==='en'?'en-GB':(l==='ps-AF'?'ps-AF':'fa-AF'),{day:'numeric',month:'long',year:'numeric',timeZone,calendar:'gregory'}).format(dt);
}catch(_){return dt.toLocaleDateString('en-GB')}}
function mode(){try{return ['both','solar','gregorian'].includes(localStorage.getItem(KEY))?localStorage.getItem(KEY):'both'}catch(_){return 'both'}}
function dateHTML(now){const items=[];
 if(mode()!=='gregorian')items.push(`<span class="zavi-date-part"><b>${t('هجری شمسی','لمریز هجري','Solar Hijri')}</b><span dir="auto">${displayDate(now,'solar')}</span></span>`);
 if(mode()!=='solar')items.push(`<span class="zavi-date-part"><b>${t('میلادی','میلادي','Gregorian')}</b><span dir="auto">${displayDate(now,'gregorian')}</span></span>`);
 return items.join('');
}
const modes=[['both','هر دو','دواړه','Both'],['solar','هجری شمسی','لمریز هجري','Solar Hijri'],['gregorian','میلادی','میلادي','Gregorian']];
const preferenceUI=()=>`<section class="card zavi-date-settings" id="zaviDateSettings"><div class="zavi-date-settings-text"><h3>${t('نمایش تاریخ','د نېټې ښودنه','Date display')}</h3><p>${t('انتخاب نوع تاریخ فقط نمایش را تغییر می‌دهد؛ اطلاعات و معاملات دست‌نخورده می‌مانند.','دا ټاکنه یوازې نېټه ښيي؛ د معاملاتو معلومات نه بدلوي.','Display preference only. Stored transactions and subscription dates are not modified.')}</p></div><label for="zaviDateMode">${t('نوع تقویم','د جنتري ډول','Calendar')}<select id="zaviDateMode">${modes.map(o=>`<option value="${o[0]}" ${mode()===o[0]?'selected':''}>${t(o[1],o[2],o[3])}</option>`).join('')}</select></label></section>`;
function paint(){const now=new Date();let chip=document.getElementById('zaviDateBanner');
 if(!chip){const header=document.querySelector('.topbar,.admin-topbar,.topbar-actions,.app-header,header');if(header){chip=document.createElement('div');chip.id='zaviDateBanner';chip.className='zavi-date-chip';chip.setAttribute('aria-label','Calendar');header.appendChild(chip)}}
 if(chip){const target=dateHTML(now);if(chip.innerHTML!==target)chip.innerHTML=target;}
 let settingsRoot=document.getElementById('content');
 // The accounting app rebuilds settings via innerHTML. Insert once per render.
 if(settingsRoot && /\bsettings\b/.test(window.page||'') && !document.getElementById('zaviDateSettings')) settingsRoot.insertAdjacentHTML('afterbegin',preferenceUI());
 // Fallback: the admin settings panel may be a dynamic subtree.
 const settingsPage=document.querySelector('[data-page="settings"].active,[data-view="settings"].active,#adminSettingsPane');
 if(!settingsRoot&&settingsPage&&!settingsPage.querySelector('#zaviDateSettings'))settingsPage.insertAdjacentHTML('afterbegin',preferenceUI());
 if(document.getElementById('zaviDateSettings')){const select=document.getElementById('zaviDateMode');if(select&&select.value!==mode())select.value=mode()}
}
let pending=false;function schedule(){if(pending)return;pending=true;setTimeout(()=>{pending=false;paint()},120)}
window.ZaviDualDate={format:displayDate,mode,refresh:schedule};
document.addEventListener('change',e=>{if(e.target.id==='zaviDateMode'){if(!['both','solar','gregorian'].includes(e.target.value))return;try{localStorage.setItem(KEY,e.target.value)}catch(_){} schedule()}else if(e.target.matches('.zavi-language-picker,#zaviSettingsLanguage,#zaviAdminLanguage,#zaviAdminAuthLanguage'))schedule()});
function init(){paint();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});setInterval(schedule,60000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* Presentation-only dual calendar V21; all stored timestamps, ledgers and license periods remain unchanged. */
(()=>{'use strict';
const KEY='zavi_calendar_display_preference_v19';const ZONE='Asia/Kabul';
const months={fa:['حمل','ثور','جوزا','سرطان','اسد','سنبله','میزان','عقرب','قوس','جدی','دلو','حوت'],ps:['وری','غویی','غبرګولی','چنګاښ','زمری','وږی','تله','لړم','لیندۍ','مرغومی','سلواغه','کب'],en:['Hamal','Sawr','Jawza','Saratan','Asad','Sonbola','Mizan','Aqrab','Qaws','Jadi','Dalwa','Hoot']};
const lang=()=>window.ZaviLocaleV21?.get?.()||'fa-AF';
const t=(fa,ps,en)=>lang()==='en'?en:lang()==='ps-AF'?ps:fa;
const fmtDigits=s=>lang()==='en'?String(s):String(s).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[+d]);
function pieces(d,calendar){const dt=d instanceof Date?d:new Date(d);if(!Number.isFinite(dt.getTime()))return null;
 const parts=new Intl.DateTimeFormat('en-US-u-nu-latn'+(calendar==='solar'?'-ca-persian':''),{year:'numeric',month:'numeric',day:'numeric',timeZone:ZONE}).formatToParts(dt);
 const out={};for(const p of parts)if(['year','month','day'].includes(p.type))out[p.type]=+p.value.replace(/[^0-9]/g,'');return out.year&&out.month&&out.day?out:null}
function renderDate(d,calendar){try{let p=pieces(d,calendar);if(!p)return '—';if(calendar==='solar'){
 let m=(lang()==='en'?months.en:lang()==='ps-AF'?months.ps:months.fa)[p.month-1];
 return lang()==='en'?`${p.day} ${m} ${p.year}`:`${fmtDigits(p.day)} ${m} ${fmtDigits(p.year)}`}
 const loc=lang()==='en'?'en-GB':lang()==='ps-AF'?'ps-AF':'fa-AF';
 return new Intl.DateTimeFormat(loc,{year:'numeric',month:'long',day:'numeric',calendar:'gregory',timeZone:ZONE}).format(new Date(d));
 }catch(e){return '—'}}
function mode(){try{const a=localStorage.getItem(KEY);return ['solar','gregorian','both'].includes(a)?a:'both'}catch(_){return 'both'}}
const modes=[['both','هر دو تقویم','دواړه جنتري','Both calendars'],['solar','هجری شمسی','لمریز هجري','Solar Hijri'],['gregorian','میلادی','میلادي','Gregorian']];
const card=()=>`<section class="card zavi-date-settings" id="zaviDateSettings" data-no-translate><div><h3>${t('تنظیم نمایش تاریخ','د نېټې د ښودلو تنظیم','Date display settings')}</h3><p>${t('فقط ظاهر تاریخ تغییر می‌کند؛ اطلاعات مالی تغییر نمی‌کنند.','یوازې د نېټې ښودنه بدلېږي؛ مالي معلومات نه بدلېږي.','Display only. Financial dates and stored transactions are not changed.')}</p></div><label>${t('نوع تقویم','د جنتري ډول','Calendar type')}<select id="zaviDateMode">${modes.map(m=>`<option value="${m[0]}" ${m[0]===mode()?'selected':''}>${t(m[1],m[2],m[3])}</option>`).join('')}</select></label></section>`;
function paint(){if(!document.body)return;let el=document.getElementById('zaviDateBanner');
 if(!el){const header=document.querySelector('.topbar,.admin-topbar,.topbar-actions,.app-header,header');if(header){el=document.createElement('div');el.id='zaviDateBanner';el.className='zavi-date-chip';el.setAttribute('data-no-translate','');header.appendChild(el)}}
 if(el){const now=new Date();const html=[];
 if(mode()!=='gregorian')html.push(`<span class="zavi-date-part"><b>${t('هجری شمسی','لمریز هجري','Solar Hijri')}</b><span dir="auto">${renderDate(now,'solar')}</span></span>`);
 if(mode()!=='solar')html.push(`<span class="zavi-date-part"><b>${t('میلادی','میلادي','Gregorian')}</b><span dir="auto">${renderDate(now,'gregorian')}</span></span>`);
 if(el.innerHTML!==html.join(''))el.innerHTML=html.join('')}
 const settingsRoot=document.getElementById('content');
 if(settingsRoot?.querySelector('#zaviSettingsLanguage')&&!document.getElementById('zaviDateSettings'))settingsRoot.insertAdjacentHTML('afterbegin',card());
 const pane=document.querySelector('#adminSettingsPane,[data-view="settings"].active')||(document.querySelector('.nav-item[data-page="settings"].selected')?document.getElementById('view'):null);
 if(!settingsRoot&&pane&&!pane.querySelector('#zaviDateSettings'))pane.insertAdjacentHTML('afterbegin',card());
 const paneSelect=document.getElementById('zaviDateMode');if(paneSelect && paneSelect.value!==mode())paneSelect.value=mode();
}
let timeout;function schedule(){if(timeout)return;timeout=setTimeout(()=>{timeout=null;paint()},160)}
window.ZaviDualDate={format:renderDate,mode,refresh:schedule,formatParts:pieces};
document.addEventListener('change',e=>{if(e.target?.id==='zaviDateMode'){if(!['both','solar','gregorian'].includes(e.target.value))return;try{localStorage.setItem(KEY,e.target.value)}catch(_){}schedule()}},true);
document.addEventListener('zavi:language-changed',schedule);
function init(){paint();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});setInterval(schedule,60000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

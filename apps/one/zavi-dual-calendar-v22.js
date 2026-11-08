/* Presentation-only dual calendar V22; all stored timestamps, ledgers and license periods remain unchanged. */
(()=>{'use strict';
const KEY='zavi_calendar_display_preference_v19';const ZONE='Asia/Kabul';
const months={fa:['حمل','ثور','جوزا','سرطان','اسد','سنبله','میزان','عقرب','قوس','جدی','دلو','حوت'],ps:['وری','غویی','غبرګولی','چنګاښ','زمری','وږی','تله','لړم','لیندۍ','مرغومی','سلواغه','کب'],en:['Hamal','Sawr','Jawza','Saratan','Asad','Sonbola','Mizan','Aqrab','Qaws','Jadi','Dalwa','Hoot']};
const gregorianMonths={fa:['جنوری','فبروری','مارچ','اپریل','می','جون','جولای','آگست','سپتمبر','اکتوبر','نومبر','دسمبر'],ps:['جنوري','فبروري','مارچ','اپرېل','مې','جون','جولای','اګست','سپتمبر','اکتوبر','نومبر','دسمبر']};
const lang=()=>(window.ZaviLocaleV22||window.ZaviLocaleV22)?.get?.()||'fa-AF';
const t=(fa,ps,en)=>lang()==='en'?en:lang()==='ps-AF'?ps:fa;
const fmtDigits=s=>lang()==='en'?String(s):String(s).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[+d]);
function pieces(d,calendar){if(d==null||d===''||d===false||d===0||d==='0')return null;const dt=d instanceof Date?d:new Date(d);if(!Number.isFinite(dt.getTime())||dt.getTime()===0)return null;
 const parts=new Intl.DateTimeFormat('en-US-u-nu-latn'+(calendar==='solar'?'-ca-persian':''),{year:'numeric',month:'numeric',day:'numeric',timeZone:ZONE}).formatToParts(dt);
 const out={};for(const p of parts)if(['year','month','day'].includes(p.type))out[p.type]=+p.value.replace(/[^0-9]/g,'');return out.year&&out.month&&out.day?out:null}
function renderDate(d,calendar){try{let p=pieces(d,calendar);if(!p)return '—';if(calendar==='solar'){
 let m=(lang()==='en'?months.en:lang()==='ps-AF'?months.ps:months.fa)[p.month-1];
 return lang()==='en'?`${p.day} ${m} ${p.year}`:`${fmtDigits(p.day)} ${m} ${fmtDigits(p.year)}`}
 if(lang()==='en')return new Intl.DateTimeFormat('en-GB',{year:'numeric',month:'long',day:'numeric',calendar:'gregory',timeZone:ZONE}).format(new Date(d));
 const key=lang()==='ps-AF'?'ps':'fa';
 return `${fmtDigits(p.day)} ${gregorianMonths[key][p.month-1]} ${fmtDigits(p.year)}`;
 }catch(e){return '—'}}
function mode(){return 'both'} // Release requirement: dates always show BOTH calendar systems.
const modes=[['both','هر دو تقویم','دواړه جنتري','Both calendars'],['solar','هجری شمسی','لمریز هجري','Solar Hijri'],['gregorian','میلادی','میلادي','Gregorian']];
const card=()=>`<section class="card zavi-date-settings" id="zaviDateSettings" data-no-translate><div><h3>${t('تقویم هجری شمسی و میلادی','لمریزه هجري او میلادي جنتري','Solar Hijri and Gregorian calendars')}</h3><p>${t('تاریخ‌ها به هر دو تقویم نمایش داده می‌شوند.','نېټې په دواړو جنتریو کې ښودل کېږي.','Dates are shown in both calendars.')}</p></div></section>`;
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
 const footer=document.getElementById('footerDate');if(footer){const text=bothText(new Date());if(footer.textContent!==text)footer.textContent=text;}
 dateInputPreview();
}
let timeout;function schedule(){if(timeout)return;timeout=setTimeout(()=>{timeout=null;paint()},160)}
function bothText(value){const s=renderDate(value,'solar'),g=renderDate(value,'gregorian');return s==='—'||g==='—'?'—':`${s} · ${g}`}
function bothHTML(value){const s=renderDate(value,'solar'),g=renderDate(value,'gregorian');if(s==='—'||g==='—')return '—';return `<span class="zavi-dual-inline" data-no-translate><span><small>${t('هجری شمسی:','لمریز هجري:','Solar Hijri:')}</small> ${s}</span><span aria-hidden="true">·</span><span><small>${t('میلادی:','میلادي:','Gregorian:')}</small> ${g}</span></span>`}
function solarInputToDate(raw){
 const text=String(raw||'').replace(/[۰-۹٠-٩]/g,c=>{const fa='۰۱۲۳۴۵۶۷۸۹'.indexOf(c);return String(fa>=0?fa:'٠١٢٣٤٥٦٧٨٩'.indexOf(c))}).trim();
 const m=/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/.exec(text);
 if(!m)return null;const y=+m[1],month=+m[2],day=+m[3];if(y<1250||y>1600||month<1||month>12||day<1||day>31)return null;
 // Kabul civil dates: resolve 1 Hamal near 20 March and then verify the selected solar date.
 let start=null;for(let n=-5;n<=5;n++){const test=new Date(Date.UTC(y+621,2,20+n,12));const part=pieces(test,'solar');if(part?.year===y&&part?.month===1&&part?.day===1){start=test;break}}
 if(!start)return null;
 const offset=(month<=6?(month-1)*31:186+(month-7)*30)+day-1;
 const date=new Date(start.getTime()+offset*86400000),check=pieces(date,'solar');
 return check?.year===y&&check?.month===month&&check?.day===day?date:null;
}
function dateInputPreview(){for(const input of document.querySelectorAll('input[type="date"],input[name="date"],#fromDate,#toDate')){
 if(input.type==='hidden'||input.type==='number')continue;
 let box=input.nextElementSibling;if(!box?.classList.contains('zavi-date-preview')){box=document.createElement('small');box.className='zavi-date-preview';box.setAttribute('data-no-translate','');input.insertAdjacentElement('afterend',box)}
 const value=input.value,solarInput=input.type!=='date'&&/^(\d{4}|[۰-۹]{4})[\/-]/.test(value);
 const parsed=solarInput?solarInputToDate(value):(value?new Date(value+'T12:00:00Z'):null);
 const translated=parsed&&Number.isFinite(parsed.getTime())?bothText(parsed):t('تاریخ انتخاب‌شده:','ټاکل شوې نېټه:','Selected date:')+' —';
 if(box.textContent!==translated)box.textContent=translated;
 }}

window.ZaviDualDate={format:renderDate,formatBoth:bothText,formatHTML:bothHTML,mode,refresh:schedule,formatParts:pieces,timezone:ZONE};
document.addEventListener('change',e=>{if(e.target?.matches?.('input[type=date],input[name=date],#fromDate,#toDate'))schedule()},true);
document.addEventListener('input',e=>{if(e.target?.matches?.('input[type=date],input[name=date],#fromDate,#toDate'))schedule()},true);
document.addEventListener('zavi:language-changed',schedule);
function init(){paint();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});setInterval(schedule,60000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

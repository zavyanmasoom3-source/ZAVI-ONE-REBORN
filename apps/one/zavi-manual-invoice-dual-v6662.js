/* ZAVI ONE V66.62: print both Afghan Solar Hijri and Gregorian
   dates in the existing manual invoice, without changing saved fields. */
(()=>{'use strict';
 const F='input[name="date"]';
 const ascii=s=>String(s||'').replace(/[۰-۹٠-٩]/g,c=>{
  const n=c.charCodeAt(0);return String(n>=1776?n-1776:n-1632);
 });
 const parts=date=>{
  const out={};const fmt=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',
    {year:'numeric',month:'numeric',day:'numeric',timeZone:'Asia/Kabul'});
  for(const p of fmt.formatToParts(date))if(['year','month','day'].includes(p.type))out[p.type]=+p.value;
  return out;
 };
 const solarToDate=raw=>{
  const normalized=ascii(raw).trim();
  let m=/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/.exec(normalized);
  if(!m)return null;
  const y=+m[1],mo=+m[2],day=+m[3];
  if(y>=1900&&y<=2200){const iso=y+'-'+String(mo).padStart(2,'0')+'-'+String(day).padStart(2,'0');
   const dt=new Date(iso+'T12:00:00Z');return Number.isFinite(dt.getTime())?dt:null;}
  if(y<1250||y>1600||mo<1||mo>12||day<1||day>31)return null;
  let start=null;
  for(let delta=-6;delta<=6;delta++){
   const v=new Date(Date.UTC(y+621,2,20+delta,12));const p=parts(v);
   if(p.year===y&&p.month===1&&p.day===1){start=v;break;}
  }
  if(!start)return null;
  const offset=(mo<=6?(mo-1)*31:186+(mo-7)*30)+day-1;
  const target=new Date(start.getTime()+offset*86400000),check=parts(target);
  return check.year===y&&check.month===mo&&check.day===day?target:null;
 };
 const copy=()=>{
  const l=String(document.documentElement.lang||'fa-AF').toLowerCase();
  return l.startsWith('en')?'Solar Hijri and Gregorian':
   l.startsWith('ps')?'لمريز هجري او میلادي':'هجری شمسی افغانستان و میلادی';
 };
 function update(){
  const input=document.querySelector(F);if(!input)return;
  let preview=document.getElementById('z66ManualDualDates');
  if(!preview){
   preview=document.createElement('div');
   preview.id='z66ManualDualDates';preview.className='z66-manual-two-dates';
   preview.setAttribute('role','note');
   input.closest('.inputline')?.insertAdjacentElement('afterend',preview);
  }
  const converted=solarToDate(input.value);
  let date=converted?window.ZaviDualDate?.formatBoth?.(converted):'';
  if(!date&&converted){
   const greg=new Intl.DateTimeFormat('en-GB-u-nu-latn',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kabul'}).format(converted);
   const sol=parts(converted);date=String(sol.day)+'/'+String(sol.month)+'/'+String(sol.year)+' · '+greg;
  }
  preview.textContent=copy()+': '+(date||'—');
  input.setAttribute('aria-describedby',preview.id);
 }
 function start(){
  const input=document.querySelector(F);if(!input)return;
  // No migration or mutation of the stored invoice date.
  input.addEventListener('input',update);
  input.addEventListener('change',update);
  document.addEventListener('zavi:calendar-changed',update);
  document.addEventListener('zavi:language-changed',update);
  document.addEventListener('beforeinput',e=>{
   if(e.target===input&&/[\u0660-\u0669\u06f0-\u06f9]/.test(e.data||''))e.preventDefault();
  },true);
  document.addEventListener('paste',e=>{
   if(e.target===input&&/[\u0660-\u0669\u06f0-\u06f9]/.test(e.clipboardData?.getData('text')||''))e.preventDefault();
  },true);
  window.addEventListener('pageshow',update);
  update();setTimeout(update,450);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
/* ZAVI ONE 65.62 — dashboard layout and contrast hotfix.
   DOM only; native business logic, route handlers, permissions and storage untouched. */
(()=>{
"use strict";
const copy={
 fa:{welcome:"به ZAVI ONE خوش آمدید",title:"مدیریت تجارت شما",date:"امروز",sale:"ثبت فروش",reports:"راپورهای بیشتر",hideReports:"بستن راپورهای بیشتر"},
 ps:{welcome:"ZAVI ONE ته ښه راغلاست",title:"ستاسو د کاروبار مدیریت",date:"نن",sale:"پلور ثبتول",reports:"نور راپورونه",hideReports:"نور راپورونه بندول"},
 en:{welcome:"Welcome to ZAVI ONE",title:"Your business dashboard",date:"Today",sale:"New sale",reports:"More reports",hideReports:"Hide reports"}
};
function lang(){const v=(document.querySelector("#zaviTopLanguage")?.value||document.documentElement.lang||"fa").toLowerCase();return v.startsWith("en")?"en":v.startsWith("ps")?"ps":"fa"}
function localeDate(){
 const native=document.querySelector("#content > .welcome .zv-today");
 if(native&&native.textContent.trim())return native.textContent.trim();
 const l=lang();try{return new Intl.DateTimeFormat(l==="ps"?"ps-AF":l==="en"?"en-GB":"fa-AF",{year:"numeric",month:"long",day:"numeric"}).format(new Date())}catch(_){return new Date().toLocaleDateString()}
}
function ensure(){
 const content=document.getElementById("content");
 if(!content||!content.classList.contains("zrf-dashboard"))return;
 const home=content.querySelector(":scope > .zrf-home");
 if(!home)return;
 const tr=copy[lang()];
 const native=content.querySelector(":scope > .welcome");
 let hero=home.querySelector(".z62-hero");
 if(!hero){
  hero=document.createElement("section");
  hero.className="z62-hero";
  hero.setAttribute("aria-label",tr.welcome);
  const left=document.createElement("div");left.className="z62-hero-copy";
  const eyebrow=document.createElement("div");eyebrow.className="z62-eyebrow";
  const title=document.createElement("h2");title.className="z62-title";
  const sub=document.createElement("p");sub.className="z62-subtitle";
  left.append(eyebrow,title,sub);
  const tools=document.createElement("div");tools.className="z62-hero-tools";
  const date=document.createElement("span");date.className="z62-date";
  const sale=document.createElement("button");sale.type="button";
  sale.className="z62-sale";sale.dataset.z62NewSale="1";
  const ico=document.createElement("span");ico.setAttribute("aria-hidden","true");ico.textContent="+";
  const label=document.createElement("span");label.className="z62-sale-label";sale.append(ico,label);
  tools.append(date,sale);hero.append(left,tools);home.prepend(hero);
 }
 const eyebrow=hero.querySelector(".z62-eyebrow");
 const title=hero.querySelector(".z62-title");
 const subtitle=hero.querySelector(".z62-subtitle");
 // Use actual trade-specific wording from the current workspace; don't fake shop data.
 eyebrow.textContent=tr.welcome;
 title.textContent=native?.querySelector("h2")?.textContent?.trim()||tr.title;
 subtitle.textContent=native?.querySelector("p")?.textContent?.trim()||"";
 hero.querySelector(".z62-date").textContent=localeDate();
 hero.querySelector(".z62-sale-label").textContent=tr.sale;
 // Always leave accounting options available via their original screens.
 const btn=home.querySelector("[data-zrf-details]");
 if(btn)btn.textContent=(content.classList.contains("zrf-details-open")?tr.hideReports:tr.reports);
 // Never display the health launcher on the dashboard, even when full reports are expanded.
 content.querySelectorAll(".z6524-launch,[aria-label='ZAVI SMART CARE']").forEach(x=>{x.hidden=true;x.setAttribute("aria-hidden","true")});
 // The rate remains editable from its original form when selected.
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{ensure()}catch(e){console.warn("ZAVI dashboard layout:",e)}})}
function newSale(){
 // Delegate to the application's existing transaction initiation, not a new fake invoice.
 const dashboard=document.querySelector("#content");
 const native=dashboard?.querySelector(".welcome [data-action='sale'],.zavi-reference-quick [data-action='sale']");
 if(native){native.click();return}
 const existing=document.querySelector("#topSaleBtn");
 if(existing){existing.click();return}
 document.querySelector("#sidebarLinks [data-go='sales'],#mobileBottom [data-go='sales']")?.click();
}
function start(){
 const content=document.querySelector("#content");if(!content)return;
 const obs=new MutationObserver(schedule);obs.observe(content,{childList:true,subtree:false});
 const themeObs=new MutationObserver(schedule);themeObs.observe(document.documentElement,{attributes:true,attributeFilter:["lang","data-zavi-theme"]});
 document.addEventListener("change",event=>{if(event.target?.id==="zaviTopLanguage")schedule()});
 document.addEventListener("click",event=>{
  const btn=event.target.closest?.("[data-z62-new-sale]");
  if(!btn)return;
  event.preventDefault();event.stopImmediatePropagation();newSale();
 },true);
 schedule();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
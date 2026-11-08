/* ZAVI ONE: safe dashboard quick actions matching the approved visual reference.
   Dynamically attaches ONLY to the existing dashboard. No fake figures, no local data changes. */
(function(){
 "use strict";
 const getContent=()=>document.getElementById("content");
 function install(){
   const root=getContent();
   if(!root||!root.querySelector(".welcome")||root.querySelector(".zavi-reference-quick"))return;
   const section=document.createElement("nav");
   section.className="zavi-reference-quick";
   section.setAttribute("aria-label","دسترسی سریع بخش‌های موجود");
   section.innerHTML=[
     '<button type="button" class="btn zrq-sale" data-action="sale">🛒 <span>فروش جدید</span></button>',
     '<button type="button" class="btn zrq-buy" data-go="purchases">🧺 <span>خرید جدید</span></button>',
     '<button type="button" class="btn zrq-product" data-go="products">📦 <span>محصولات</span></button>',
     '<button type="button" class="btn zrq-stock" data-go="products" title="بارکد و اسکنر در بخش گدام/محصولات">▥ <span>بارکد / گدام</span></button>'
   ].join("");
   const chart=root.querySelector(".layout-2");
   if(chart)chart.insertAdjacentElement("beforebegin",section);
   else root.querySelector(".stat-grid")?.insertAdjacentElement("afterend",section);
 }
 function addThemeToolbar(){
   const actions=document.querySelector(".topbar .topbar-actions");
   if(!actions||actions.querySelector(".zavi-ref-top-tools"))return;
   const el=document.createElement("div");
   el.className="zavi-ref-top-tools";
   el.setAttribute("aria-label","تغییر ظاهر");
   el.innerHTML='<button type="button" data-zavi-theme-choice="light" title="حالت روشن">☀️</button>'+
   '<button type="button" data-zavi-theme-choice="dark" title="حالت تیره">🌙</button>';
   actions.prepend(el);
 }
 function start(){addThemeToolbar();
   const root=getContent();if(!root)return;
   let queued=false;
   const obs=new MutationObserver(()=>{
     if(queued)return;
     queued=true;
     queueMicrotask(()=>{queued=false;try{install()}catch(e){console.warn("visual quick actions:",e)}});
   });
   obs.observe(root,{childList:true});
   install();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
 else start();
})();

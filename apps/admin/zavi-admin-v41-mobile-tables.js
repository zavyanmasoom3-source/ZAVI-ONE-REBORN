/* ZAVI ONE ADMIN V41 table usability. UI annotations only — NO API/data mutations. */
(()=>{'use strict';
 const target=document.getElementById('view');if(!target)return;
 let scheduled=false;
 const update=()=>{
  scheduled=false;
  target.querySelectorAll('.table-scroll > table.data-table').forEach(table=>{
   const heads=[...table.querySelectorAll('thead tr:first-child th')].map(th=>(th.textContent||'').replace(/\s+/g,' ').trim());
   if(heads.length<2)return;
   table.setAttribute('data-zavi-mobile-cards','1');
   table.querySelectorAll('tbody tr').forEach(row=>{
    const cells=[...row.children].filter(el=>el.matches('td'));
    if(cells.length<2||cells.some(td=>td.colSpan>1))return;
    cells.forEach((cell,idx)=>{cell.setAttribute('data-zavi-label',heads[idx]||'');});
   });
  });
 };
 const request=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(update)};
 new MutationObserver(request).observe(target,{childList:true,subtree:true,characterData:true});
 document.addEventListener('zavi:languagechange',request);document.addEventListener('zavi:localechange',request);
 document.addEventListener('DOMContentLoaded',request);request();
})();

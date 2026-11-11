/* Owner-approved V66.62 SALES MANAGEMENT. Presentation only:
   original buttons, archived invoices, manual PDFs, search and ledger unchanged. */
(()=>{'use strict';
  const root=document.getElementById('content');
  if(!root)return;
  let active=false,scheduled=false;
  const addClass=(el,cls)=>{if(el)el.classList.add(cls);};
  function refresh(){
    const head=root.querySelector(':scope > .page-head');
    const title=head?.querySelector('h2')?.textContent?.trim()||'';
    const stats=root.querySelector(':scope > .stat-grid');
    const table=[...root.children].find(el=>el.matches?.('section.card')&&
      el.querySelector('.table-bar #searchInput'));
    // Explicitly restrict to SALES. Purchase management and invoice editing
    // retain their own original layout and handlers.
    if(!head||!stats||!table||!(/مدیریت فروش|Sales management|د پلور مدیریت/i.test(title))){
      root.classList.remove('z66sales-root','z66sales-arrive');
      active=false;
      return;
    }
    const first=!active;active=true;
    root.classList.add('z66sales-root');
    root.classList.toggle('z66sales-arrive',first);
    addClass(head,'z66sales-hero');
    addClass(stats,'z66sales-stats');
    addClass(table,'z66sales-table');
    const cards=[...root.children].filter(el=>el.matches?.('section.card'));
    const stored=cards.find(el=>/فاکتورهای ذخیره‌شده|Saved invoices|خوندي شوي بلونه/i
      .test(el.querySelector('.panel-head h3')?.textContent||''));
    const manual=cards.find(el=>/فاکتورهای دستی|Manual invoices|لاسي بلونه/i
      .test(el.querySelector('.panel-head h3')?.textContent||''));
    addClass(stored,'z66sales-stored');
    addClass(manual,'z66sales-manual');
    const actions=head.querySelector('.action-group');
    if(actions){
      actions.classList.add('z66sales-actions');
      const sale=actions.querySelector('[data-action="sale"]');
      const ret=actions.querySelector('[data-action="sale_return"]');
      addClass(sale,'z66sales-new-sale');
      addClass(ret,'z66sales-return-sale');
    }
    const search=table.querySelector('#searchInput');
    if(search)search.setAttribute('aria-label',search.placeholder||
       'جستجوی فاکتور فروش، محصول یا مشتری');
    // Real recordsTable() remains mounted. Compact empty UI only in no-data
    // states, never hide actual records, per-invoice tools or pagination.
    table.classList.toggle('z66sales-empty',!table.querySelector('table tbody tr'));
    // Prevent an animated route entrance on every search keystroke.
    root.querySelectorAll(':scope > .z66sales-table, :scope > .z66sales-stored, :scope > .z66sales-manual')
      .forEach(el=>el.style.setProperty('--z66sales-delay','0ms'));
  }
  function schedule(){
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;try{refresh()}catch(error){
      console.warn('ZAVI sales visual layout:',error?.message||error);
    }});
  }
  if(!document.getElementById('z66SalesCss')){
    const css=document.createElement('link');
    css.id='z66SalesCss';css.rel='stylesheet';
    css.href='./zavi-owner-sales-management-v6662.css?v=1';
    document.head.append(css);
  }
  new MutationObserver(schedule).observe(root,{childList:true,subtree:false});
  document.addEventListener('zavi:language-changed',schedule);
  document.addEventListener('zavi:language-change',schedule);
  schedule();
})();
/* ZAVI ONE workflow organization: move LIVE form controls, never clone/replace
 * financial elements, validation callbacks or the submit handler. */
(() => {
  'use strict';
  const labels={
    fa:{accounts:'حساب‌ها',transactions:'تراکنش‌ها',more:'بیشتر',summary:'خلاصه',details:'جزئیات',output:'خروجی',warehouses:'گدام‌ها',movements:'حرکت موجودی',
      products:'محصولات',labels:'لیبل',customer:'مشتری',payment:'پرداخت',specs:'مشخصات',
      required:'این فیلد ضروری است.',positive:'قیمت هر واحد باید بیشتر از صفر باشد.',badNumber:'یک عدد معتبر وارد کنید.',badFormat:'فرمت این فیلد معتبر نیست.',continue:'ادامه'},
    ps:{accounts:'حسابونه',transactions:'معاملې',more:'نور',summary:'لنډیز',details:'جزئیات',output:'وتنه',warehouses:'ګدامونه',movements:'د موجودۍ حرکت',
      products:'توکي',labels:'لېبل',customer:'پېرودونکی',payment:'تادیه',specs:'معلومات',
      required:'دا برخه اړینه ده.',positive:'د هر واحد بیه باید له صفر څخه لوړه وي.',badNumber:'سمه شمېره ولیکئ.',badFormat:'د دې برخې بڼه سمه نه ده.',continue:'بل ګام'},
    en:{accounts:'Accounts',transactions:'Transactions',more:'More',summary:'Summary',details:'Details',output:'Export',warehouses:'Warehouses',movements:'Stock movements',
      products:'Products',labels:'Labels',customer:'Customer',payment:'Payment',specs:'Details',
      required:'This field is required.',positive:'Unit price must be greater than zero.',badNumber:'Enter a valid number.',badFormat:'Invalid field format.',continue:'Continue'}
  };
  const lang=()=>{
    const l=(document.documentElement.lang||'fa').toLowerCase();
    return l.startsWith('ps')?'ps':l.startsWith('en')?'en':'fa';
  };
  const tr=key=>labels[lang()][key]||key;
  const isElement=el=>el&&el.nodeType===1;
  function createTabs(host,kind,groups,reference){
    if(!host||host.querySelector('[data-zavi-flow="'+kind+'"]'))return null;
    if(groups.some(group=>!group.length))return null;
    const layout=document.createElement('div');
    layout.className='zavi-flow-layout';
    layout.dataset.zaviFlow=kind;
    const bar=document.createElement('div');bar.className='zavi-flow-tabs';
    bar.setAttribute('role','tablist');
    const panes=[];
    function activate(index,focus=false){
      panes.forEach((pane,i)=>{
        const active=i===index;
        pane.hidden=!active;
        const tab=bar.children[i];
        tab.setAttribute('aria-selected',String(active));
        // Checked prior stages are visual state only, never proof of a sale.
        if(kind==='order'){
          tab.classList.toggle('zavi-flow-completed',i<index);
          if(active)tab.setAttribute('aria-current','step');
          else tab.removeAttribute('aria-current');
        }
        tab.tabIndex=active?0:-1;
        if(active&&focus)tab.focus();
      });
      layout.dataset.activeTab=String(index);
    }
    groups.forEach((group,i)=>{
      const tab=document.createElement('button');
      tab.type='button';tab.className='zavi-flow-tab';
      tab.id='zavi-'+kind+'-tab-'+i;
      tab.setAttribute('role','tab');
      tab.setAttribute('aria-controls','zavi-'+kind+'-panel-'+i);
      tab.dataset.zaviFlowLabel=reference[i];
      tab.textContent=tr(reference[i]);
      const pane=document.createElement('section');
      pane.className='zavi-flow-panel';pane.id='zavi-'+kind+'-panel-'+i;
      pane.setAttribute('role','tabpanel');
      pane.setAttribute('aria-labelledby',tab.id);
      pane.hidden=i!==0;panes.push(pane);
      group.forEach(node=>pane.append(node));
      tab.addEventListener('click',()=>activate(i));
      bar.append(tab);layout.append(pane);
    });
    bar.addEventListener('keydown',event=>{
      if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
      event.preventDefault();
      const current=Number(layout.dataset.activeTab||0);
      const dir=document.documentElement.dir==='rtl'?-1:1;
      const next=event.key==='Home'?0:event.key==='End'?panes.length-1:
        (current+(event.key==='ArrowRight'?dir:-dir)+panes.length)%panes.length;
      activate(next,true);
    });
    layout.prepend(bar);
    host.append(layout);
    activate(0);
    layout.zaviActivate=activate;
    return layout;
  }
  function enhanceMoney(root){
    if(root.querySelector('[data-zavi-flow="money"]'))return;
    const accounts=root.querySelector(':scope > .accounts-grid');
    const movements=root.querySelector(':scope > section.card');
    const actions=root.querySelector(':scope > .action-group');
    if(!accounts||!movements||!actions||!root.querySelector(':scope > .page-head'))return;
    createTabs(root,'money',[[accounts],[movements],[actions]],['accounts','transactions','more']);
  }
  function enhanceReports(root){
    if(root.querySelector('[data-zavi-flow="reports"]'))return;
    const metrics=root.querySelector(':scope > .report-grid');
    const split=root.querySelector(':scope > .layout-2');
    if(!metrics||!split||split.children.length<2)return;
    const filter=[...root.children].find(el=>el.querySelector?.('.filterbar'));
    if(!filter)return;
    const extras=[];
    for(const el of [...root.children]){
      if(el===filter||el===metrics||el===split||el.matches('.page-head,.tiny-note'))continue;
      extras.push(el);
    }
    const stock=split.children[0],exports=split.children[1];
    const result=createTabs(root,'reports',
      [[...extras,metrics],[stock],[exports]],['summary','details','output']);
    if(result)split.remove();
  }
  function enhanceProducts(root){
    // Actual V66.62 renderProducts() writes directly into #content. The old
    // '.zui-phase2-content' selector never existed in that entrypoint; it
    // silently suppressed every owner-approved product/warehouse tab.
    const main=root.querySelector('.zui-phase2-content')||root;
    if(main.querySelector('[data-zavi-flow="products"]'))return;
    const scanner=main.querySelector(':scope > .z638-warehouse-scanner');
    if(!scanner)return; // Only the real products route has this scanner.
    let manager=main.querySelector(':scope > .zv-wh-manager');
    if(!manager&&typeof window.ZaviWarehouseV1?.panel==='function'){
      // Mount the native authenticated warehouse manager, never an unconnected
      // imitation. Keep its original submit, RLS and stock transfer handlers.
      scanner.insertAdjacentHTML('afterend',window.ZaviWarehouseV1.panel());
      manager=main.querySelector(':scope > .zv-wh-manager');
      if(manager)window.ZaviWarehouseV1.afterRender?.();
    }
    const listing=[...main.children].find(el=>el.matches?.('section.card')&&
      el!==manager&&el!==scanner);
    if(!manager||!listing)return;
    const existing=[...main.children];
    const originalHeader=existing.find(el=>el.matches?.('.page-head'));
    const products=existing.filter(el=>el!==manager&&el!==originalHeader);
    if(!products.includes(listing))return;
    // Keep all four REAL stock metrics available without making the product
    // screen a wall of summary cards on a small Android phone.
    const metrics=products.find(el=>el.matches?.('.report-grid'));
    if(metrics){
      const folded=document.createElement('details');
      folded.className='zavi-products-overview';
      const title=document.createElement('summary');
      title.textContent=lang()==='en'?'Warehouse overview':lang()==='ps'?'د ګدام لنډیز':'خلاصه گدام';
      folded.append(title,metrics);
      products.splice(products.indexOf(metrics),1,folded);
    }
    // Keep the REAL scanner and its live camera/USB/Bluetooth listeners.
    // Only its visibility changes; no extra stock logic or fake scanner.
    const compactScanner=document.createElement('details');
    compactScanner.className='zavi-products-scanner-details';
    const scannerTitle=document.createElement('summary');
    scannerTitle.textContent=lang()==='en'?'Scan barcode':lang()==='ps'?'بارکوډ سکین':'اسکن بارکد';
    compactScanner.append(scannerTitle,scanner);
    products.splice(products.indexOf(scanner),1,compactScanner);
    const snapshot=document.createElement('section');
    snapshot.className='card zavi-stock-history-projection';
    snapshot.setAttribute('role','region');
    snapshot.setAttribute('aria-live','polite');
    // A read-only projection of the *already authenticated* server history;
    // no fake stock records or independent, unconfirmed quantities are created.
    const heading=document.createElement('strong');heading.className='zavi-history-title';
    heading.textContent='';snapshot.append(heading);
    const history=document.createElement('div');history.className='zavi-history-rows';
    snapshot.append(history);
    function refreshHistory(){
      heading.textContent=tr('movements');
      const native=manager.querySelector('.zv-wh-history');
      history.replaceChildren();
      if(native){
        // Server widget creates its entries with textContent. Clone only the
        // existing read-only report, not forms/privileged action handlers.
        for(const child of native.children){
          if(child.matches('button,a,form,input'))continue;
          history.append(child.cloneNode(true));
        }
      }
      if(!history.childElementCount){
        const message=document.createElement('p');message.className='zds-muted';
        message.textContent=lang()==='en'?'No confirmed stock movement data loaded.':
          lang()==='ps'?'د موجودۍ د حرکت تایید شوي معلومات نشته.':
          'هنوز حرکت موجودی تأییدشده دریافت نشده است.';
        history.append(message);
      }
    }
    refreshHistory();
    const native=manager.querySelector('.zv-wh-history');
    if(native)new MutationObserver(refreshHistory).observe(native,{childList:true,subtree:true});
    // Compact actual, authenticated warehouse modules without re-creating
    // forms or event handlers. Their original parent remains #warehouseManager.
    function foldWarehouse(selector,fa,ps,en,cls){
      const element=manager.querySelector(':scope > '+selector);
      if(!element||element.closest('details'))return null;
      const fold=document.createElement('details');fold.className='zavi-warehouse-fold '+cls;
      const title=document.createElement('summary');
      title.textContent=lang()==='en'?en:lang()==='ps'?ps:fa;
      element.replaceWith(fold);fold.append(title,element);return fold;
    }
    const warehouseAdd=foldWarehouse('[data-wh-add]','افزودن گدام','ګدام زیاتول','Add warehouse','zavi-warehouse-add-fold');
    foldWarehouse('.zv-wh-stock','موجودی مستقل هر گدام','د ګدام خپلواک موجودي','Warehouse stock','zavi-warehouse-stock-fold');
    const warehouseTransfer=foldWarehouse('.zv-wh-transfer','انتقال بین گدام‌ها','د ګدامونو ترمنځ لېږد','Transfer stock','zavi-warehouse-transfer-fold');
    foldWarehouse('.zv-wh-history','تاریخچه حرکت‌ها','د موجودۍ تاریخچه','Movement history','zavi-warehouse-history-fold');
    // Three movement choices guide the owner to existing REAL transfer,
    // purchase-receipt and stock-adjustment workflows. No speculative stock
    // write is generated in the products page.
    const movementActions=document.createElement('nav');
    movementActions.className='zavi-stock-movement-actions';
    movementActions.setAttribute('aria-label',tr('movements'));
    const movementButtons=[
      ['transfer','انتقال گدام','د ګدام لېږد','Transfer'],
      ['receive','دریافت کالا','توکي ترلاسه کول','Receive goods'],
      ['adjust','اصلاح موجودی','موجودي اصلاح کول','Adjust stock']
    ];
    for(const [key,fa,ps,en] of movementButtons){
      const b=document.createElement('button');b.type='button';
      b.className='btn subtle zavi-stock-movement-action';
      b.dataset.zaviStockAction=key;
      b.textContent=lang()==='en'?en:lang()==='ps'?ps:fa;
      movementActions.append(b);
    }
    const movementHint=document.createElement('p');
    movementHint.className='zavi-stock-movement-hint';
    movementHint.textContent=lang()==='en'?
      'Transfer between warehouses, confirm physical delivery of in-transit orders, or correct stock with a real accounting document.':
      lang()==='ps'?'لېږد، د رښتینو توکو ترلاسه کول یا د سند له لارې د موجودۍ اصلاح.':
      'انتقال بین گدام‌ها، دریافت واقعی سفارش در راه و اصلاح موجودی با سند جداگانه.';
    // The fourth tab launches the existing printable Code128/EAN-13 modal.
    const labelsPanel=document.createElement('section');
    labelsPanel.className='card zavi-products-label-panel';
    const printLabel=document.createElement('button');
    printLabel.type='button';printLabel.className='btn primary';
    printLabel.dataset.action='barcode_label';
    printLabel.textContent=lang()==='en'?'Print label':lang()==='ps'?'لېبل چاپ':'چاپ لیبل';
    labelsPanel.append(printLabel);
    const layout=createTabs(main,'products',[products,[manager],[movementActions,movementHint,snapshot],[labelsPanel]],
      ['products','warehouses','movements','labels']);
    if(!layout)return;
    layout.querySelectorAll('[role="tab"]')[2].addEventListener('click',refreshHistory);
    movementActions.addEventListener('click',event=>{
      const action=event.target.closest('[data-zavi-stock-action]')?.dataset.zaviStockAction;
      if(!action)return;
      if(action==='transfer'){
        layout.zaviActivate(1);
        if(warehouseTransfer)warehouseTransfer.open=true;
        (warehouseTransfer||manager).scrollIntoView({block:'nearest',behavior:'auto'});
      }else if(action==='receive'){
        // Receipt is controlled by the in-transit purchase service, with owner
        // identity, physical confirmation, exactly-once RPC and server stock.
        if(typeof go==='function')go('purchases');
        requestAnimationFrame(()=>{
          document.querySelector('[data-z66pm-view="orders"]')?.click();
          document.querySelector('[data-zv-transit]')?.scrollIntoView({block:'nearest',behavior:'auto'});
        });
      }else if(action==='adjust'){
        // Delegated native data-action opens the real stock_adjust ledger form.
        const native=document.querySelector('#content [data-action="stock_adjust"]');
        if(native)native.click();
      }
    });
    if(originalHeader){
      // Leave the real Product action visible; move secondary native
      // controls into a small opt-in menu instead of deleting handlers.
      const group=originalHeader.querySelector('.action-group');
      if(group&&!group.querySelector('.zavi-products-more-actions')){
        const primary=group.querySelector('[data-action="product"]');
        const others=[...group.children].filter(el=>el!==primary);
        if(primary&&others.length){
          const more=document.createElement('details');more.className='zavi-products-more-actions';
          const label=document.createElement('summary');
          label.textContent=lang()==='en'?'More':lang()==='ps'?'نور':'بیشتر';
          more.append(label);
          for(const item of others)more.append(item);
          group.append(more);
        }
      }
      if(main.firstElementChild!==originalHeader)main.prepend(originalHeader);
    }
  }

  /* Approved native product form: three actual steps, one original ledger save.
     No clones: all real business fields, barcode input listeners, warehouse
     selector and camera/photo handlers are moved with their DOM nodes. */
  function enhanceProductEditor(){
    const form=document.querySelector('#dialogForm.z66-product-editor');
    if(!form||form.dataset.zaviProductThreeStep==='true')return;
    if(!form.querySelector('.z66-registration-trade')||
       !form.querySelector('.z66-registration-scanner'))return;
    const grid=form.querySelector(':scope > .form-grid');
    if(!grid||!grid.children.length)return;
    const labels3={
      fa:['مشخصات','قیمت و گدام','بیشتر','بعدی'],
      ps:['معلومات','بیه او ګدام','نور','بل ګام'],
      en:['Details','Price & warehouse','More','Next']
    }[lang()];
    const wrapper=document.createElement('div');wrapper.className='zavi-product-three-step';
    wrapper.dataset.zaviProductFlow='true';
    const tabs=document.createElement('div');tabs.className='zavi-product-step-tabs';
    tabs.setAttribute('role','tablist');
    const panes=[];
    for(let i=0;i<3;i++){
      const tab=document.createElement('button');tab.type='button';tab.className='zavi-product-step-tab';
      tab.setAttribute('role','tab');tab.dataset.zaviProductStep=String(i);
      tab.id='zavi-product-step-'+i;tab.textContent=labels3[i];
      tab.setAttribute('aria-controls','zavi-product-step-panel-'+i);
      tabs.append(tab);
      const pane=document.createElement('section');
      pane.className='zavi-product-step-panel';
      pane.id='zavi-product-step-panel-'+i;
      pane.setAttribute('role','tabpanel');pane.setAttribute('aria-labelledby',tab.id);
      panes.push(pane);
    }
    const basicNames=['name','sku','category'];
    const stockNames=['salePrice','purchasePrice','productPriceCurrency',
      'productManualUsdRate','variantWarehouseId','openingQty','reorder'];
    function stepOf(node){
      if(node.matches('.z66-registration-trade,.z66-registration-scanner,.z66-reg-segment,.zavi-barcode-box')||
         node.querySelector('[id="zaviBarcodeProductNotice"]')||
         basicNames.some(n=>node.querySelector('[name="'+n+'"]')))return 0;
      if(node.matches('.z66-product-fx-preview')||
         stockNames.some(n=>node.querySelector('[name="'+n+'"]')))return 1;
      return 2;
    }
    const oldChildren=[...grid.children];
    if(!oldChildren.some(node=>node.querySelector('[name="openingQty"]')))return;
    if(!oldChildren.some(node=>node.querySelector('[name="name"]')))return;
    for(const node of oldChildren)panes[stepOf(node)].append(node);
    function activate(i,focus=false){
      panes.forEach((pane,j)=>{
        pane.hidden=i!==j;
        const tab=tabs.children[j];
        tab.tabIndex=i===j?0:-1;
        tab.setAttribute('aria-selected',String(i===j));
        if(i===j&&focus)tab.focus({preventScroll:true});
      });
      wrapper.dataset.activeStep=String(i);
    }
    [...tabs.children].forEach((tab,i)=>tab.addEventListener('click',()=>activate(i)));
    tabs.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();
      const now=Number(wrapper.dataset.activeStep||0);
      const direction=document.documentElement.dir==='rtl'?-1:1;
      const next=e.key==='Home'?0:e.key==='End'?2:
        (now+(e.key==='ArrowRight'?direction:-direction)+3)%3;
      activate(next,true);
    });
    [0,1].forEach(i=>{
      const next=document.createElement('button');next.type='button';
      next.className='btn subtle zavi-product-step-next';
      next.textContent=labels3[3];
      next.addEventListener('click',()=>{
        const bad=[...panes[i].querySelectorAll('input,select,textarea')]
          .find(el=>el.willValidate&&!el.checkValidity());
        if(bad){bad.reportValidity();return;}
        activate(i+1,true);
      });
      panes[i].append(next);
    });
    wrapper.append(tabs,...panes);
    grid.append(wrapper);
    // Reveal the actual tab holding invalid native form data before browser
    // tries to focus a hidden required input. Never bypass save validation.
    form.addEventListener('invalid',e=>{
      const pane=e.target.closest('.zavi-product-step-panel');
      if(pane){const i=panes.indexOf(pane);if(i>=0)activate(i);}
    },true);
    // Optional extras remain available but do not overwhelm the first screen.
    for(const [selector,fa,ps,en] of [
      ['[name="barcodes"]','بارکدهای اضافی','نور بارکوډونه','Additional barcodes'],
      ['#zaviProductPhotoInput','عکس محصول','د توکي انځور','Product photo']
    ]){
      const el=panes[2].querySelector(selector)?.closest('.field');
      if(!el||el.closest('.zavi-product-optional'))continue;
      const fold=document.createElement('details');
      fold.className='zavi-product-optional';
      const summary=document.createElement('summary');
      summary.textContent=lang()==='en'?en:lang()==='ps'?ps:fa;
      el.replaceWith(fold);fold.append(summary,el);
    }
    form.dataset.zaviProductThreeStep='true';
    activate(0);
  }

  /* Approved 66.62 sale: single continuous page. Move ORIGINAL live controls only.
     Purchase retains three tabs. No extra accounting or hidden submit handler. */
  function enhanceSaleSinglePage(body,form,heading,general,products,payment){
    const layout=document.createElement('div');
    layout.className='z66-sale-single';
    layout.dataset.zaviSaleOnepage='66.62';
    const section=(key,label)=>{
      const node=document.createElement('section');
      node.className='z66-sale-section z66-sale-'+key;
      const title=document.createElement('h3');
      title.dataset.z66SaleLabel=key;
      title.textContent=label;
      node.append(title);layout.append(node);return node;
    };
    const customer=section('customer','مشتری و تاریخ');
    const barcode=section('barcode','فروش با بارکد');
    const goods=section('products','محصولات فاکتور');
    const pay=section('payment','پرداخت');
    const advanced=document.createElement('details');
    advanced.className='z66-sale-advanced';
    const summary=document.createElement('summary');
    summary.dataset.z66SaleLabel='more';
    summary.textContent='گزینه‌های بیشتر';
    advanced.append(summary);
    for(const n of general)customer.append(n);
    const barcodeBox=products.find(n=>n.matches?.('.zavi-barcode-box'));
    if(barcodeBox){
      barcode.append(barcodeBox);
      const hint=barcodeBox.querySelector('details.z645-barcode-help');
      if(hint)hint.open=false;
    }
    for(const n of products){
      if(n===barcodeBox)continue;
      if(n.matches?.('.z629-line-note,.zawi-inline-tip')){
        const help=document.createElement('details');
        help.className='z66-sale-help';
        const t=document.createElement('summary');
        t.textContent='راهنمای محصول';
        help.append(t,n);
        advanced.append(help);
      }else goods.append(n);
    }
    const extra=payment.find(n=>n.classList?.contains('zavi-flow-payment-fields'));
    if(extra)for(const field of [...extra.children])advanced.append(field);
    const note=body.querySelector('[name="note"]');
    const noteField=note?.closest('.field');
    if(noteField)advanced.append(noteField);
    for(const n of payment){
      if(n===extra)continue;
      if(n.matches?.('.tiny-note'))advanced.append(n);
      else if(n.classList?.contains('form-grid')&&!n.children.length)continue;
      else pay.append(n);
    }
    // The real paid input remains in the original form; presets only set it.
    // During DOM reorganization, nodes are momentarily detached from <form>.
    // Resolve from the live payment section, not form.elements before attachment.
    const paid=pay.querySelector('[name="paid"]');
    const modes=document.createElement('div');
    modes.className='z66-sale-paymodes';modes.setAttribute('role','group');
    modes.setAttribute('aria-label','نوع پرداخت');
    for(const [key,label] of [['cash','نقدی'],['credit','قرضی'],['partial','قسطی']]){
      const button=document.createElement('button');button.type='button';
      button.className='z66-sale-paymode';button.dataset.z66Payment=key;
      button.dataset.z66SaleLabel='mode-'+key;
      button.setAttribute('aria-pressed',String(key==='partial'));
      button.textContent=label;
      // Bind directly: native invoice click delegates may stop bubbling.
      button.addEventListener('click',event=>{
        event.preventDefault();setPayment(key);
      });
      modes.append(button);
    }
    const total=pay.querySelector('.totals');
    if(total)total.after(modes);else pay.prepend(modes);
    const methodNote=document.createElement('p');methodNote.className='z66-sale-payhint';
    methodNote.dataset.z66SaleLabel='payhint';
    methodNote.textContent='مبلغ دریافتی و باقی‌مانده در فاکتور ثبت می‌شود.';
    modes.after(methodNote);
    pay.append(advanced);
    body.append(layout);
    form.dataset.zaviSaleOnepage='true';
    function setPayment(mode){
      modes.dataset.z66LastPaymentMode=mode;
      const buttons=[...modes.querySelectorAll('[data-z66-payment]')];
      for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.z66Payment===mode));
      if(!paid||mode==='partial')return;
      if(mode==='credit')paid.value='0';
      else{
        const lines=[...goods.querySelectorAll('#orderItems .order-line')];
        try{
          const decimal=window.ZaviDecimal;
          const subtotal=decimal.sumLineTotals(lines.map(r=>({
            qty:r.querySelector('[data-field="qty"]').value||'0',
            price:r.querySelector('[data-field="price"]').value||'0'
          })));
          const discount=form.elements.namedItem('discount')?.value||'0';
          const value=decimal.roundMoney(Math.max(0,subtotal-decimal.roundMoney(discount)));
          modes.dataset.z66CashCalculated=String(value);
          paid.value=String(value);
        }catch(error){
          modes.dataset.z66PaymentCalcError=String(error?.message||error);
          return;
        }
      }
      paid.dispatchEvent(new Event('input',{bubbles:true}));
    }
    const scan=barcode.querySelector('#zaviBarcodeScan');
    const rows=goods.querySelector('#orderItems');
    // Original scanner focuses an existing match; additionally increment qty
    // on a repeated exact barcode. Unknown/ambiguous codes use native errors.
    if(scan&&rows){
      scan.addEventListener('keydown',event=>{
        if(event.key!=='Enter'||!String(scan.value||'').trim())return;
        const catalog=typeof db!=='undefined'?db.products:null;
        const lookup=window.ZaviBarcodeV641?.lookup;
        if(!Array.isArray(catalog)||typeof lookup!=='function')return;
        const found=lookup(catalog,scan.value.trim());
        if(found.length!==1)return;
        // The native V66.62 colour scanner must own the barcode event. This
        // legacy quick-sale shortcut matches only by product ID and would
        // incorrectly increment a black row when a white barcode is scanned.
        const variant=window.ZaviVariantInventory6662;
        if(variant&&(variant.tracked(found[0])||variant.rows(found[0]).length))return;
        const row=[...rows.querySelectorAll('.order-line')]
          .find(r=>r.dataset.scanProductId===found[0].id);
        if(!row)return;
        const qty=row.querySelector('[data-field="qty"]');
        if(!qty)return;
        const value=Number(qty.value);
        if(!Number.isFinite(value)||value<=0)return;
        event.preventDefault();event.stopImmediatePropagation();
        qty.value=String(value+1);
        qty.dispatchEvent(new Event('input',{bubbles:true}));
        scan.value='';scan.dispatchEvent(new Event('input',{bubbles:true}));
        qty.focus();
      },true);
    }
    // Native product-row nodes are never cloned. Their edit handlers and
    // per-business fields remain attached to the original #orderItems.
    const observeRows=()=>{
      if(!rows)return;
      for(const r of rows.querySelectorAll('.order-row')){
        if(r.dataset.z66Labeled)return;
        for(const [field,key] of [
          ['productName','item-name'],['qty','qty'],['price','unit-price']]){
          const input=r.querySelector('[data-field="'+field+'"]');
          if(!input||input.closest('.z66-sale-input'))continue;
          const wrapper=document.createElement('label');
          wrapper.className='z66-sale-input z66-sale-'+key;
          const caption=document.createElement('span');
          caption.dataset.z66SaleLabel=key;
          caption.textContent=key==='item-name'?'نام محصول':key==='qty'?'تعداد':'فی واحد';
          input.before(wrapper);wrapper.append(caption,input);
        }
        r.dataset.z66Labeled='true';
      }
    };
    observeRows();
    if(rows)new MutationObserver(observeRows).observe(rows,{childList:true});
    // Keep the original native submit and all price/stock/permission checks.
    return layout;
  }


  /* Approved V66.62 PURCHASE: one compact sheet, native accounting fields.
     No cloning inputs, no new transaction/stock logic, no currency shortcuts. */
  function enhancePurchaseSinglePage(body,form,general,products,payment){
    const layout=document.createElement('div');
    layout.className='z66-purchase-onepage';
    layout.dataset.zaviPurchaseOnepage='66.62';
    const create=(name,title)=>{
      const el=document.createElement('section');
      el.className='z66-purchase-section z66-purchase-'+name;
      el.dataset.z66PurchaseSection=name;
      const h=document.createElement('h3');
      h.dataset.z66PurchaseLabel=name;
      h.textContent=title;
      el.append(h);layout.append(el);
      return el;
    };
    const supplier=create('supplier','تاریخ و عرضه‌کننده');
    const currency=create('currency','پول خرید');
    const scan=create('barcode','بارکد محصول');
    const goods=create('products','محصولات خرید');
    const pay=create('payment','مجموع و پرداخت');
    const advanced=document.createElement('details');
    advanced.className='z66-purchase-advanced';
    const sum=document.createElement('summary');
    sum.dataset.z66PurchaseLabel='more';
    sum.textContent='جزئیات بیشتر';
    advanced.append(sum);
    // First native form-grid: keep date and contact fields exactly as-is.
    // Move the preexisting currency group below supplier; never discard FX.
    const firstGrid=general.find(el=>el.matches?.('.form-grid'));
    if(firstGrid)supplier.append(firstGrid);
    for(const n of general){
      if(n===firstGrid)continue;
      if(n.matches?.('.form-section-title'))continue;
      if(n.matches?.('.form-grid')){
        if(n.querySelector('[name="originalCurrency"]'))currency.append(n);
        else advanced.append(n);
      }else if(n.matches?.('.tiny-note,.z629-line-note'))advanced.append(n);
      else currency.append(n);
    }
    const fxGrid=currency.querySelector('.form-grid');
    if(fxGrid){
      const fields=[...fxGrid.children];
      const account=fields.find(n=>n.querySelector?.('[name="purchaseOrigin"]'));
      if(account)advanced.append(account);
      // Preserve exchange-rate input and real AFN converted preview in
      // the visible currency section; foreign buying must never hide FX.
      for(const n of fields){
        if(n.isConnected&&n.parentElement!==fxGrid)continue;
      }
    }
    const barcodeBox=products.find(el=>el.matches?.('.zavi-barcode-box'));
    if(barcodeBox){
      scan.append(barcodeBox);
      const help=barcodeBox.querySelector('details.z645-barcode-help');
      if(help)help.open=false;
    }
    for(const n of products){
      if(n===barcodeBox)continue;
      if(n.matches?.('.z629-line-note,.zawi-inline-tip')){
        const disclosure=document.createElement('details');
        disclosure.className='z66-purchase-help';
        const title=document.createElement('summary');
        title.dataset.z66PurchaseLabel='help';
        title.textContent='راهنمای محصول';
        disclosure.append(title,n);advanced.append(disclosure);
      }else if(n.matches?.('.form-section-title')){
        // The permanent section title already describes the product list.
        n.hidden=true;goods.append(n);
      }else goods.append(n);
    }
    const fields=payment.find(n=>n.matches?.('.zavi-flow-payment-fields'));
    if(fields){
      for(const el of [...fields.children]){
        if(el.querySelector?.('[name="accountId"]'))pay.append(el);
        else advanced.append(el);
      }
    }
    const paid=payment.find(n=>n.matches?.('.form-grid')&&n.querySelector('[name="paid"]'));
    if(paid){
      const note=paid.querySelector('[name="note"]')?.closest('.field');
      if(note)advanced.append(note);
    }
    for(const n of payment){
      if(n===fields)continue;
      if(n.matches?.('.tiny-note'))advanced.append(n);
      else if(n.matches?.('.form-grid')&&!n.children.length)continue;
      else pay.append(n);
    }
    const shipping=body.querySelector('[name="shippingOriginal"]');
    const shippingField=shipping?.closest('.field');
    if(shippingField)advanced.append(shippingField);
    pay.append(advanced);
    // Native form elements must be connected before extension reads them.
    body.append(layout);
    window.ZaviPurchaseUpgrade6662?.mount?.(form,layout,advanced,supplier,pay);
    form.dataset.zaviPurchaseOnepage='true';
    form.dataset.zaviPurchaseV6662='approved';
    // Label actual original line inputs (not copies), including later added
    // products, so typed unit price & quantity remain visible on a phone.
    const rows=goods.querySelector('#orderItems');
    const labelRows=()=>{
      if(!rows)return;
      for(const row of rows.querySelectorAll('.order-row')){
        if(row.dataset.z66PurchaseLabeled)continue;
        for(const [field,key,caption] of [
          ['productName','name','نام محصول'],
          ['qty','qty','تعداد'],
          ['price','price','فی واحد']]){
          const input=row.querySelector('[data-field="'+field+'"]');
          if(!input||input.closest('.z66-purchase-input'))continue;
          const wrapper=document.createElement('label');
          wrapper.className='z66-purchase-input z66-purchase-input-'+key;
          const label=document.createElement('span');
          label.dataset.z66PurchaseLabel=key;
          label.textContent=caption;
          input.before(wrapper);wrapper.append(label,input);
        }
        row.dataset.z66PurchaseLabeled='true';
      }
    };
    labelRows();
    if(rows)new MutationObserver(labelRows).observe(rows,{childList:true});
    return layout;
  }

  function enhanceOrderForm(){
    const form=document.getElementById('dialogForm');
    if(!form||form.dataset.zaviFlowDone)return;
    const body=form.querySelector(':scope > .modal-body');
    // The authentic V66.62 restored invoice has NO .zui-invoice-form marker.
    // Identify the NEW SALE by native modal title + real order fields.
    // Never restyle sale returns or purchases when the original marker is absent.
    if(!body||!body.querySelector('#orderItems'))return;
    const headingMarker=body.querySelector('.zui-invoice-form');
    const modalTitle=form.closest('.modal')?.querySelector('.modal-head h3')?.textContent||'';
    const purchaseField=body.querySelector('[name="originalCurrency"]');
    const isNewSale=!purchaseField &&
      (/فاکتور فروش جدید|new sale|نوی پلور/i.test(modalTitle) ||
       headingMarker?.dataset.module==='sales');
    const isNewPurchase=!!purchaseField &&
      /فاکتور خرید جدید|new purchase|نوی پېرود/i.test(modalTitle);
    if(!headingMarker&&!isNewSale&&!isNewPurchase)return;
    const children=[...body.children];
    const itemIndex=children.findIndex(el=>el.id==='orderItems');
    const totalsIndex=children.findIndex(el=>el.matches?.('.totals'));
    if(itemIndex<0||totalsIndex<itemIndex)return;
    let productIndex=-1;
    for(let i=0;i<itemIndex;i++)if(children[i].matches?.('.form-section-title'))productIndex=i;
    if(productIndex<0||productIndex>=totalsIndex)return;
    const isPurchase=!!purchaseField || headingMarker?.dataset.module==='purchases';
    const heading=headingMarker;
    const general=children.filter((el,i)=>i<productIndex&&el!==heading);
    const products=children.slice(productIndex,totalsIndex);
    const payment=children.slice(totalsIndex);
    if(!general.length||!products.length||!payment.length)return;
    // Move the existing account and discount fields without recreating inputs.
    const extraPayment=document.createElement('div');
    extraPayment.className='form-grid zavi-flow-payment-fields';
    for(const name of ['accountId','discount']){
      const input=body.querySelector('[name="'+name+'"]');
      const field=input?.closest('.field');
      if(field)extraPayment.append(field);
    }
    if(extraPayment.childElementCount)payment.unshift(extraPayment);
    if(isNewPurchase)enhancePurchaseSinglePage(body,form,general,products,payment);
    else if(isPurchase)createTabs(body,'order',[general,products,payment],
      ['specs','products','payment']);
    else enhanceSaleSinglePage(body,form,heading,general,products,payment);
    if(heading && body.firstElementChild!==heading)body.prepend(heading);
    const flow=body.querySelector('[data-zavi-flow="order"]');
    if(!flow&&!body.querySelector('[data-zavi-sale-onepage]')&&
       !body.querySelector('[data-zavi-purchase-onepage]'))return;
    // Purchases retain the existing three-step flow. Sales are ONE page.
    if(flow)[...flow.querySelectorAll(':scope > .zavi-flow-panel')].slice(0,2).forEach((pane,index)=>{
      const next=document.createElement('button');
      next.type='button';next.className='zavi-reference-continue';
      next.dataset.zaviReferenceNext=String(index+1);
      next.textContent=tr('continue')+' ‹';
      next.addEventListener('click',()=>{
        const invalid=[...pane.querySelectorAll('input,select,textarea')]
          .find(field=>!field.disabled && field.willValidate && !field.checkValidity());
        if(invalid){
          window.ZaviDesignSystemV1?.setFieldError(invalid,invalid.validationMessage||tr('required'));
          invalid.focus({preventScroll:true});invalid.scrollIntoView({block:'nearest'});return;
        }
        flow.zaviActivate(index+1,true);
      });
      pane.append(next);
    });
    form.dataset.zaviFlowDone='true';
    function fail(field,message){
      const panel=field.closest('.zavi-flow-panel');
      const flow=body.querySelector('[data-zavi-flow="order"]');
      if(flow){const idx=[...flow.querySelectorAll('.zavi-flow-panel')].indexOf(panel);
        if(idx>=0)flow.zaviActivate(idx);}
      const details=field.closest('details');
      if(details)details.open=true;
      window.ZaviDesignSystemV1?.setFieldError(field,message);
      field.focus({preventScroll:true});
      field.scrollIntoView({block:'nearest',behavior:'auto'});
    }
    // HTML5 validity errors must open their containing tab before focusing.
    form.addEventListener('invalid',event=>{
      const field=event.target;
      if(!isElement(field))return;
      const message=field.validity?.valueMissing?tr('required'):
        field.validationMessage||tr('required');
      fail(field,message);
    },true);
    form.addEventListener('input',event=>{
      const field=event.target;
      if(isElement(field)&&field.matches('input,select,textarea')&&field.validity?.valid)
        window.ZaviDesignSystemV1?.setFieldError(field,'');
    },true);
    // Avoid recording a positive-quantity but zero-price financial sale/purchase.
    // Leave all existing business validations and the original save handler intact.
    form.addEventListener('submit',event=>{
      const rows=[...body.querySelectorAll('#orderItems .order-line')];
      for(const row of rows){
        const price=row.querySelector('[data-field="price"]');
        if(!price)continue;
        if(!Number.isFinite(Number(price.value))||Number(price.value)<=0){
          event.preventDefault();
          event.stopImmediatePropagation();
          fail(price,tr('positive'));
          return;
        }
      }
    },true);
  }
  function refreshLabels(){
    const purchaseLabels={
      fa:{supplier:'تاریخ و عرضه‌کننده',currency:'پول خرید',barcode:'بارکد محصول',
        products:'محصولات خرید',payment:'مجموع و پرداخت',more:'جزئیات بیشتر',
        help:'راهنمای محصول',name:'نام محصول',qty:'تعداد',price:'فی واحد'},
      ps:{supplier:'نېټه او عرضه کوونکی',currency:'د پېرود پیسې',barcode:'د توکي بارکوډ',
        products:'د پېرود توکي',payment:'ټول او تادیه',more:'نور جزئیات',
        help:'د توکي لارښود',name:'د توکي نوم',qty:'شمېر',price:'د یوه بیه'},
      en:{supplier:'Date & supplier',currency:'Purchase currency',barcode:'Product barcode',
        products:'Purchased items',payment:'Total & payment',more:'More details',
        help:'Product help',name:'Product',qty:'Quantity',price:'Unit price'}
    }[lang()];
    document.querySelectorAll('[data-z66-purchase-label]').forEach(el=>{
      const key=el.dataset.z66PurchaseLabel;
      if(purchaseLabels[key]&&el.textContent!==purchaseLabels[key])
        el.textContent=purchaseLabels[key];
    });
    const saleLabels={
      fa:{customer:'مشتری و تاریخ',barcode:'فروش با بارکد',products:'محصولات فاکتور',payment:'پرداخت',
        more:'گزینه‌های بیشتر', 'mode-cash':'نقدی','mode-credit':'قرضی','mode-partial':'قسطی',
        payhint:'پرداخت نقدی، قرضی یا قسمتی؛ فقط مبلغ واقعی دریافتی ثبت می‌شود.',
        'item-name':'نام محصول',qty:'تعداد','unit-price':'فی واحد'},
      ps:{customer:'پېرودونکی او نېټه',barcode:'د بارکوډ پلور',products:'د بل توکي',payment:'تادیه',
        more:'نور انتخابونه','mode-cash':'نغدې','mode-credit':'پور','mode-partial':'قسطونه',
        payhint:'یوازې رښتیا ترلاسه شوې پیسې ثبتېږي.',
        'item-name':'د توکي نوم',qty:'شمېر','unit-price':'د یوه بیه'},
      en:{customer:'Customer & date',barcode:'Barcode sale',products:'Invoice items',payment:'Payment',
        more:'More options','mode-cash':'Cash','mode-credit':'Credit','mode-partial':'Partial',
        payhint:'Only actual money received is recorded; remainder is tracked.',
        'item-name':'Product',qty:'Quantity','unit-price':'Unit price'}
    }[lang()];
    document.querySelectorAll('[data-z66-sale-label]').forEach(el=>{
      const key=el.dataset.z66SaleLabel;
      if(saleLabels[key]&&el.textContent!==saleLabels[key])el.textContent=saleLabels[key];
    });
    document.querySelectorAll('[data-zavi-flow-label]').forEach(el=>{
      el.textContent=tr(el.dataset.zaviFlowLabel);
    document.querySelectorAll('[data-zavi-reference-next]').forEach(b=>{
      b.textContent=tr('continue')+' ‹';
    });
    });
    const quick={
      fa:{sales:'ثبت فروش',purchases:'ثبت خرید',debtors:'حساب مشتریان',products:'گدام'},
      ps:{sales:'پلور ثبتول',purchases:'پېرود ثبتول',debtors:'د پېرودونکو حسابونه',products:'ګدام'},
      en:{sales:'New sale',purchases:'New purchase',debtors:'Customer accounts',products:'Warehouse'}
    }[lang()];
    document.querySelectorAll('[data-zavi-fast-action]').forEach(el=>{
      const span=el.querySelector('span');
      if(span && quick[el.dataset.zaviFastAction])
        span.textContent=quick[el.dataset.zaviFastAction];
    });
  }
  function update(){
    const root=document.getElementById('content');
    if(root){
      enhanceMoney(root);
      enhanceReports(root);
      enhanceProducts(root);
    }
    enhanceOrderForm();
    enhanceProductEditor();
    refreshLabels();
  }
  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;try{update()}catch(err){
      console.warn('ZAVI compact workflow:',err?.message||err);
    }});
  }
  function init(){
    const main=document.getElementById('content'),overlay=document.getElementById('overlay');
    if(main)new MutationObserver(schedule).observe(main,{childList:true});
    if(overlay)new MutationObserver(schedule).observe(overlay,{childList:true});
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('[data-zavi-journal-tab]');
      if(!button)return;
      const next=button.dataset.zaviJournalTab;
      if(!['transactions','notes','inventory'].includes(next)||typeof z659JournalTab==='undefined')return;
      z659JournalTab=next;
      z659JournalPage=0;
      if(typeof render==='function')render();
    });
    document.addEventListener('zavi:language-change',schedule);
    document.addEventListener('zavi:language-changed',schedule);
    // Field-local HTML5 error messages for every actual accounting modal.
    // Form submission remains controlled by the original handlers and server.
    document.addEventListener('invalid',event=>{
      const field=event.target;
      if(!isElement(field)||!field.matches('input,select,textarea')||
         !field.closest('#dialogForm'))return;
      const v=field.validity;
      const reason=v?.valueMissing?'required':(v?.badInput||v?.rangeOverflow||
        v?.rangeUnderflow||v?.stepMismatch)?'badNumber':'badFormat';
      window.ZaviDesignSystemV1?.setFieldError(field,tr(reason));
    },true);
    document.addEventListener('input',event=>{
      const field=event.target;
      if(isElement(field)&&field.closest('#dialogForm')&&field.matches('input,select,textarea')&&field.validity?.valid)
        window.ZaviDesignSystemV1?.setFieldError(field,'');
    },true);
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

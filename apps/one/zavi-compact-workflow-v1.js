/* ZAVI ONE workflow organization: move LIVE form controls, never clone/replace
 * financial elements, validation callbacks or the submit handler. */
(() => {
  'use strict';
  const labels={
    fa:{accounts:'حساب‌ها',transactions:'تراکنش‌ها',more:'بیشتر',summary:'خلاصه',details:'جزئیات',output:'خروجی',warehouses:'گدام‌ها',movements:'حرکت موجودی',
      products:'محصولات',customer:'مشتری',payment:'پرداخت',specs:'مشخصات',
      required:'این فیلد ضروری است.',positive:'قیمت هر واحد باید بیشتر از صفر باشد.',badNumber:'یک عدد معتبر وارد کنید.',badFormat:'فرمت این فیلد معتبر نیست.',continue:'ادامه'},
    ps:{accounts:'حسابونه',transactions:'معاملې',more:'نور',summary:'لنډیز',details:'جزئیات',output:'وتنه',warehouses:'ګدامونه',movements:'د موجودۍ حرکت',
      products:'توکي',customer:'پېرودونکی',payment:'تادیه',specs:'معلومات',
      required:'دا برخه اړینه ده.',positive:'د هر واحد بیه باید له صفر څخه لوړه وي.',badNumber:'سمه شمېره ولیکئ.',badFormat:'د دې برخې بڼه سمه نه ده.',continue:'بل ګام'},
    en:{accounts:'Accounts',transactions:'Transactions',more:'More',summary:'Summary',details:'Details',output:'Export',warehouses:'Warehouses',movements:'Stock movements',
      products:'Products',customer:'Customer',payment:'Payment',specs:'Details',
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
    const main=root.querySelector('.zui-phase2-content');
    if(!main||main.querySelector('[data-zavi-flow="products"]'))return;
    const manager=main.querySelector(':scope > .zv-wh-manager');
    const scanner=main.querySelector(':scope > .z638-warehouse-scanner');
    const listing=[...main.children].find(el=>el.matches?.('section.card')&&
      el!==manager&&el!==scanner);
    if(!manager||!scanner||!listing)return;
    const existing=[...main.children];
    const originalHeader=existing.find(el=>el.matches?.('.page-head'));
    const products=existing.filter(el=>el!==manager&&el!==originalHeader);
    if(!products.includes(listing))return;
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
    // Keep warehouse management in its original server-backed DOM. The third
    // tab is read-only and never makes writes on its own.
    const layout=createTabs(main,'products',[products,[manager],[snapshot]],
      ['products','warehouses','movements']);
    if(!layout)return;
    layout.querySelectorAll('[role="tab"]')[2].addEventListener('click',refreshHistory);
    if(originalHeader && main.firstElementChild!==originalHeader)main.prepend(originalHeader);
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
    const paid=form.elements.namedItem('paid');
    const modes=document.createElement('div');
    modes.className='z66-sale-paymodes';modes.setAttribute('role','group');
    modes.setAttribute('aria-label','نوع پرداخت');
    for(const [key,label] of [['cash','نقدی'],['credit','قرضی'],['partial','قسطی']]){
      const button=document.createElement('button');button.type='button';
      button.className='z66-sale-paymode';button.dataset.z66Payment=key;
      button.dataset.z66SaleLabel='mode-'+key;
      button.setAttribute('aria-pressed',String(key==='partial'));
      button.textContent=label;
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
          paid.value=String(value);
        }catch(_){return}
      }
      paid.dispatchEvent(new Event('input',{bubbles:true}));
    }
    modes.addEventListener('click',event=>{
      const b=event.target.closest('[data-z66-payment]');
      if(b)setPayment(b.dataset.z66Payment);
    });
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
    if(!headingMarker&&!isNewSale)return;
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
    if(isPurchase)createTabs(body,'order',[general,products,payment],
      ['specs','products','payment']);
    else enhanceSaleSinglePage(body,form,heading,general,products,payment);
    if(heading && body.firstElementChild!==heading)body.prepend(heading);
    const flow=body.querySelector('[data-zavi-flow="order"]');
    if(!flow&&!body.querySelector('[data-zavi-sale-onepage]'))return;
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

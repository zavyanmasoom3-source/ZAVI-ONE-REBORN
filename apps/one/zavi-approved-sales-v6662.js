/* Approved sales screen adaptation — real ZAVI ONE routes and native save handler.
 * Reference: owner-provided seven sales/receipt/barcode screenshots, 2026-11-09.
 * No mock totals, no new financial persistence, no server-side auth claims.
 */
(() => {
  'use strict';
  const I18N={
    fa:{heading:'مدیریت فروش',subtitle:'فاکتورها و معاملات شما',newSale:'ثبت فروش جدید',
      today:'فروش امروز',count:'تعداد فاکتور',records:'فاکتورهای فروش',manual:'فاکتورهای دستی',
      archive:'فاکتورهای ذخیره‌شده',allStats:'آمار کلی',more:'بیشتر',guide:'راهنمای بیشتر',items:'محصولات فاکتور',addToSale:'افزودن محصول به فروش',customer:'مشتری',
      cashCustomer:'مشتری نقدی',selectCustomer:'انتخاب مشتری ثبت‌شده',
      payment:'روش پرداخت',cash:'نقدی',bank:'بانکی / حواله',credit:'قرض / پرداخت بعدی',
      received:'مبلغ دریافت‌شده',currency:'ارز فاکتور',preview:'پیش‌نمایش فاکتور',
      close:'بستن پیش‌نمایش',receipt:'پیش‌نمایش رسید',item:'محصول',qty:'تعداد',
      unit:'قیمت واحد',quantity:'تعداد',lineTotal:'جمع محصول',calcInvoice:'محاسبه فاکتور',total:'مبلغ نهایی فاکتور',balance:'باقی‌مانده مشتری',
      nameRequired:'محصول را از گدام انتخاب کنید.',qtyRequired:'تعداد باید بیشتر از صفر باشد.',
      priceRequired:'قیمت واحد باید بیشتر از صفر باشد.',bankRequired:'یک حساب بانکی یا حواله معتبر لازم است.',overpaid:'مبلغ دریافت‌شده نمی‌تواند از کل بیشتر باشد.',creditName:'برای فروش قرضی، نام مشتری را وارد کنید.',
      stock:'موجودی کافی نیست.',noItems:'حداقل یک محصول لازم است.',notSaved:'پیش‌نمایش است؛ هنوز هیچ معامله‌ای ثبت نشده است.'},
    ps:{heading:'د پلور مدیریت',subtitle:'ستاسې بلونه او معاملې',newSale:'نوی پلور ثبتول',
      today:'د نن پلور',count:'د بلونو شمېر',records:'د پلور بلونه',manual:'لاسي بلونه',
      archive:'ساتل شوي بلونه',allStats:'ټولې شمېرې',more:'نور',guide:'نورې لارښوونې',items:'د بل توکي',addToSale:'پلور ته توکی زیاتول',customer:'پېرودونکی',
      cashCustomer:'نغدي پېرودونکی',selectCustomer:'ثبت شوی پېرودونکی وټاکئ',
      payment:'د تادیې ډول',cash:'نغدي',bank:'بانک / حواله',credit:'پور / وروسته تادیه',
      received:'ترلاسه شوې پیسې',currency:'د بل اسعار',preview:'د بل مخکتنه',
      close:'مخکتنه بندول',receipt:'د رسید مخکتنه',item:'توکی',qty:'شمېر',
      unit:'د واحد بیه',quantity:'شمېر',lineTotal:'د توکي ټول',calcInvoice:'د بل حساب',total:'د بل وروستۍ اندازه',balance:'د پېرودونکي پاتې',
      nameRequired:'توکی له ګدامه وټاکئ.',qtyRequired:'شمېر باید له صفر څخه لوړ وي.',
      priceRequired:'د واحد بیه باید له صفر څخه لوړه وي.',bankRequired:'د بانک یا حوالې معتبر حساب اړین دی.',overpaid:'ترلاسه شوې پیسې له ټول مبلغ څخه ډېرې نشي.',creditName:'د پور پلور لپاره د پېرودونکي نوم ولیکئ.',
      stock:'موجودي کمه ده.',noItems:'لږ تر لږه یو توکی اړین دی.',notSaved:'دا مخکتنه ده؛ معامله لا نه ده ثبت شوې.'},
    en:{heading:'Sales management',subtitle:'Your invoices and transactions',newSale:'New sale',
      today:'Sales today',count:'Invoice count',records:'Sales invoices',manual:'Manual invoices',
      archive:'Saved invoices',allStats:'All-time totals',more:'More',guide:'More guidance',items:'Invoice products',addToSale:'Add a product to sale',customer:'Customer',
      cashCustomer:'Cash customer',selectCustomer:'Choose an existing customer',
      payment:'Payment method',cash:'Cash',bank:'Bank / remittance',credit:'Credit / pay later',
      received:'Amount received',currency:'Invoice currency',preview:'Invoice preview',
      close:'Close preview',receipt:'Receipt preview',item:'Product',qty:'Quantity',
      unit:'Unit price',quantity:'Quantity',lineTotal:'Line total',calcInvoice:'Invoice calculation',total:'Invoice final amount',balance:'Customer balance',
      nameRequired:'Select a product from the warehouse.',qtyRequired:'Quantity must be greater than zero.',
      priceRequired:'Unit price must be greater than zero.',bankRequired:'A valid bank or remittance account is required.',overpaid:'Received amount cannot exceed total.',creditName:'A customer name is required for credit sales.',
      stock:'Not enough inventory.',noItems:'At least one product is required.',notSaved:'Preview only; no transaction has been saved.'}
  };
  const lang=()=>{
    // The app's real locale controller is authoritative. document.lang alone
    // can be transient during a genuine runtime language switch.
    const l=String(window.zaviPublicLanguage?.()||
      window.ZaviLocaleV22?.get?.()||
      document.documentElement.lang||'fa-AF').toLowerCase();
    return l.startsWith('en')?'en':l.startsWith('ps')?'ps':'fa';
  };
  const tr=k=>I18N[lang()][k]||k;
  const mk=(tag,className,text)=>{
    const el=document.createElement(tag);
    if(className)el.className=className;
    if(text!==undefined)el.textContent=String(text);
    return el;
  };
  const nativeCurrency=n=>{
    try{return typeof currency==='function'?currency(n):String(n)+' '+(db.currency||'AFN')}
    catch(_){return String(n)+' '+(db.currency||'AFN')}
  };
  const safeNum=n=>Number.isFinite(Number(n))?Number(n):0;
  const currentRows=()=>[...document.querySelectorAll('#orderItems .order-line')];
  function salesStats(){
    if(typeof db==='undefined'||!Array.isArray(db.tx))return {today:0,count:0};
    const today=typeof nowISO==='function'?nowISO():new Date().toISOString().slice(0,10);
    const valid=db.tx.filter(t=>!t.voided&&t.type==='sale');
    const returns=db.tx.filter(t=>!t.voided&&t.type==='sale_return'&&t.date===today);
    const amount=t=>typeof txTotal==='function'?txTotal(t):0;
    return {today:valid.filter(t=>t.date===today).reduce((a,t)=>a+amount(t),0)-
      returns.reduce((a,t)=>a+amount(t),0),count:valid.length};
  }
  function salesPage(){
    const root=document.querySelector('#content .zui-order-page[data-module="sales"]');
    if(!root||root.dataset.zsalApproved)return;
    const content=document.getElementById('content');
    const listing=root.querySelector(':scope > section.card');
    const extras=[...content.children].filter(x=>x!==root&&x.matches?.('section.card'));
    if(!listing||extras.length<2)return;
    root.dataset.zsalApproved='true';
    root.classList.add('zsal-approved-page');
    const h=root.querySelector('.page-head h2'),sub=root.querySelector('.page-head p');
    if(h)h.textContent=tr('heading');if(sub)sub.textContent=tr('subtitle');
    const first=root.querySelector('.page-head [data-action="sale"]');
    if(first)first.textContent='＋  '+tr('newSale');
    const secondary=root.querySelector('.page-head [data-action="sale_return"]');
    if(secondary){
      const extra=mk('details','zsal-sale-more');
      const caption=mk('summary','',tr('more'));extra.append(caption);
      secondary.parentNode.insertBefore(extra,secondary);
      extra.append(secondary);
    }
    const original=root.querySelector(':scope > .stat-grid');
    if(original){
      const stats=salesStats(),wrap=mk('div','zsal-stat-pair');
      const a=mk('article','zsal-stat'),b=mk('article','zsal-stat');
      a.append(mk('span','',tr('today')),mk('strong','',nativeCurrency(stats.today)));
      b.append(mk('span','',tr('count')),mk('strong','',String(stats.count)));
      wrap.append(a,b);root.insertBefore(wrap,original);
      const details=mk('details','zsal-allstats');
      details.append(mk('summary','',tr('allStats')),original);
      root.insertBefore(details,listing);
    }
    const tabs=mk('div','zsal-list-tabs'),panels=mk('div','zsal-list-panels');
    tabs.setAttribute('role','tablist');
    const p1=mk('section','zsal-list-panel'),p2=mk('section','zsal-list-panel');
    p1.setAttribute('role','tabpanel');p2.setAttribute('role','tabpanel');
    p1.id='zsal-invoices-panel';p2.id='zsal-manual-panel';
    p1.append(listing,extras[0]);p2.append(extras[1]);panels.append(p1,p2);
    function activate(idx){
      p1.hidden=idx!==0;p2.hidden=idx!==1;
      for(const [i,b] of [...tabs.children].entries()){
        b.setAttribute('aria-selected',String(i===idx));b.tabIndex=i===idx?0:-1;
      }
    }
    for(const [idx,label] of [[0,tr('records')],[1,tr('manual')]]){
      const b=mk('button','zsal-list-tab',label);b.type='button';
      b.setAttribute('role','tab');b.setAttribute('aria-controls',idx?'zsal-manual-panel':'zsal-invoices-panel');
      b.addEventListener('click',()=>activate(idx));tabs.append(b);
    }
    root.append(tabs,panels);activate(0);
    const search=root.querySelector('#searchInput');
    if(search)search.placeholder=lang()==='en'?'Search invoices or customers…':
      lang()==='ps'?'بل یا پېرودونکی ولټوئ…':'جستجوی فاکتور یا مشتری…';
  }
  function orderTotals(form){
    const rows=currentRows().map(row=>({
      qty:row.querySelector('[data-field="qty"]')?.value||'0',
      price:row.querySelector('[data-field="price"]')?.value||'0'
    }));
    if(!window.ZaviDecimal)throw Error('Decimal module is unavailable');
    return window.ZaviDecimal.invoiceTotals(rows,form.elements.discount?.value||'0',
      '0',form.elements.paid?.value||'0');
  }
  function error(field,msg){
    window.ZaviDesignSystemV1?.setFieldError(field,msg);
    const panel=field.closest('.zavi-flow-panel'),flow=field.closest('[data-zavi-flow="order"]');
    if(panel&&flow?.zaviActivate){
      flow.zaviActivate([...flow.querySelectorAll(':scope > .zavi-flow-panel')].indexOf(panel));
    }
    field.focus({preventScroll:true});field.scrollIntoView({block:'nearest'});
  }
  function validatePreview(form){
    const rows=currentRows();
    if(!rows.length)throw Error(tr('noItems'));
    const byProduct=new Map();
    for(const row of rows){
      const name=row.querySelector('[data-field="productName"]');
      const qty=row.querySelector('[data-field="qty"]');
      const price=row.querySelector('[data-field="price"]');
      if(!name.value.trim()){error(name,tr('nameRequired'));return null}
      if(!(safeNum(qty.value)>0)){error(qty,tr('qtyRequired'));return null}
      if(!(safeNum(price.value)>0)){error(price,tr('priceRequired'));return null}
      if(typeof findNamedProduct==='function'){
        const sku=row.querySelector('[data-field="productSku"]')?.value||'';
        const product=findNamedProduct(name.value,sku);
        if(!product){error(name,tr('nameRequired'));return null}
        byProduct.set(product.id,(byProduct.get(product.id)||0)+safeNum(qty.value));
      }
    }
    if(typeof stockOf==='function'){
      for(const [id,qty] of byProduct){
        if(qty>stockOf(id)+.00001){
          const row=rows.find(row=>findNamedProduct(row.querySelector('[data-field="productName"]').value,
            row.querySelector('[data-field="productSku"]')?.value||'')?.id===id);
          error(row.querySelector('[data-field="qty"]'),tr('stock'));return null;
        }
      }
    }
    const totals=orderTotals(form);
    if(totals.paid>totals.total){error(form.elements.paid,tr('overpaid'));return null}
    if(totals.total-totals.paid>0.009&&!form.elements.freeContactName.value.trim()){
      error(form.elements.freeContactName,tr('creditName'));return null;
    }
    if(totals.total<=0)return null;
    return totals;
  }
  function saleModal(){
    const modal=document.querySelector('#overlay .modal');
    if(!modal||!modal.querySelector('.zui-invoice-form[data-module="sales"]'))return;
    if(modal.dataset.zaviOrderKind!=='sale')return;
    const form=modal.querySelector('#dialogForm');
    const flow=form?.querySelector('[data-zavi-flow="order"]');
    if(!flow)return;
    const panels=[...flow.querySelectorAll(':scope > .zavi-flow-panel')];
    if(panels.length!==3)return;
    if(!form.dataset.zsalApproved){
      modal.classList.add('zsal-approved-modal');
      const title=modal.querySelector('.modal-head h3');
      if(title)title.textContent=tr('newSale');
      const productPane=panels[0],customerPane=panels[1],paymentPane=panels[2];
      // The owner's approved screenshots are a SINGLE vertically scrolling
      // invoice, not three mutually hidden panels. Preserve every existing
      // native form field and original accounting listener, but show the
      // original groups in the photographic order: date/customer, items, pay.
      flow.classList.add('zsal-vertical');
      const tabBar=flow.querySelector(':scope > .zavi-flow-tabs');
      if(tabBar)tabBar.hidden=true;
      flow.insertBefore(customerPane,productPane);
      for(const pane of [customerPane,productPane,paymentPane]){
        pane.hidden=false;
        pane.setAttribute('role','region');
        pane.removeAttribute('aria-labelledby');
      }
      flow.zaviActivate=index=>{
        const target=[...flow.querySelectorAll(':scope > .zavi-flow-panel')][index];
        if(target)target.scrollIntoView({block:'nearest',behavior:'auto'});
      };
      const heading=productPane.querySelector('.form-section-title');
      if(heading)heading.textContent=tr('items');
      const barcodeBox=productPane.querySelector('.zavi-barcode-box');
      const scanLabel=barcodeBox?.querySelector('label[for="zaviBarcodeScan"]');
      if(scanLabel)scanLabel.textContent=tr('addToSale');
      // Long prototype guidance stays available under one compact disclosure.
      // Do not delete existing barcode or product-validation elements.
      const guidance=mk('details','zsal-guide');
      guidance.append(mk('summary','',tr('guide')));
      let found=0;
      for(const hint of productPane.querySelectorAll('.z629-line-note,.zawi-inline-tip')){
        guidance.append(hint);found++;
      }
      if(found)productPane.append(guidance);
      const pickerWrap=mk('div','zsal-customer-select');
      const lbl=mk('label','',tr('selectCustomer')),picker=mk('select');
      // HTMLSelectElement.type is read-only in strict mode.
      picker.setAttribute('aria-label',tr('selectCustomer'));
      const option=(id,name)=>{
        const item=mk('option','',name);item.value=id;return item;
      };
      picker.append(option('',tr('cashCustomer')));
      if(typeof db!=='undefined')for(const c of db.contacts.filter(x=>x.type==='customer'||x.type==='both')){
        picker.append(option(c.id,c.name));
      }
      picker.addEventListener('change',()=>{
        const c=db.contacts.find(x=>x.id===picker.value);
        const name=form.elements.freeContactName,phone=form.elements.freeContactPhone;
        if(!name||!phone)return;
        name.value=c?.name||'';phone.value=c?.phone||'';
        name.dispatchEvent(new Event('change',{bubbles:true}));
      });
      lbl.append(picker);pickerWrap.append(lbl);
      const dateField=customerPane.querySelector('input[name="date"]')?.closest('.field');
      if(dateField){
        customerPane.prepend(dateField);
        dateField.after(pickerWrap);
        const dateNote=mk('small','zsal-dual-date');
        dateField.append(dateNote);
        const refreshDate=()=>{
          try{
            const value=form.elements.date.value;
            // The native Afghanistan picker stores an actual Solar-Hijri
            // input such as ۱۴۰۵/۰۸/۱۸. Convert through ZAVI's validated
            // calendar function before rendering a dual Gregorian/Solar line.
            const iso=typeof readDate==='function'?readDate(value):value;
            dateNote.textContent=window.ZaviDesignSystemV1?.formatDualDate(iso,{
              language:lang()==='fa'?'fa-AF':lang()==='ps'?'ps-AF':'en',
              timezone:'Asia/Kabul'
            })||'';
          }catch(_){dateNote.textContent='';}
        };
        form.elements.date.addEventListener('input',refreshDate);
        form.elements.date.addEventListener('change',refreshDate);
        refreshDate();
      }else customerPane.prepend(pickerWrap);
      // Scanner input and camera remain the original native controls. The
      // old flex toolbar CSS otherwise stacks/overlaps them on mobile.
      const actions=barcodeBox?.querySelector('.zavi-barcode-actions');
      if(actions&&!actions.querySelector('.zsal-scan-field')){
        const nativeScan=actions.querySelector('#zaviBarcodeScan');
        const nativeCamera=actions.querySelector('[data-zavi-camera-open="zaviBarcodeScan"]');
        if(nativeScan&&nativeCamera){
          actions.classList.remove('zavi-barcode-actions');
          actions.classList.add('zsal-scan-actions');
          const scanField=mk('div','zsal-scan-field');
          scanField.append(nativeScan,nativeCamera);actions.prepend(scanField);
        }
      }
      const payBox=mk('fieldset','zsal-payment');
      payBox.append(mk('legend','',tr('payment')));
      const group=mk('div','zsal-payment-options');
      const modes=[['cash','cash'],['bank','bank'],['credit','credit']];
      for(const [value,key] of modes){
        const label=mk('label','zsal-payment-option');
        const input=mk('input');input.type='radio';input.name='zsalMode';input.value=value;
        if(value==='cash')input.checked=true;
        label.append(input,mk('span','',tr(key)));group.append(label);
      }
      payBox.append(group);
      const info=mk('p','zsal-currency-note',tr('currency')+': '+String(db.currency||'AFN'));
      paymentPane.prepend(info);
      paymentPane.prepend(mk('h3','zsal-payment-heading',tr('calcInvoice')));
      const totals=paymentPane.querySelector(':scope > .totals');
      // Visual order follows the owner's receipt screenshots, with native
      // discount and account controls kept in the same original form.
      if(totals)totals.after(payBox);
      else paymentPane.append(payBox);
      const account=form.elements.accountId,paid=form.elements.paid;
      const modesByName=()=>[...payBox.querySelectorAll('input[name=zsalMode]')];
      const chosenMode=()=>modesByName().find(x=>x.checked)?.value||'cash';
      const setMode=which=>{const target=modesByName().find(x=>x.value===which);
        if(target)target.checked=true;};
      const accountMatching=which=>{
        if(!account)return null;
        const options=[...account.options];
        const byIds=which==='bank'?['a_bank','a_hawala']:['a_cash'];
        const exact=byIds.map(id=>options.find(o=>o.value===id)).find(Boolean);
        if(exact)return exact;
        return options.find(o=>which==='bank'
          ?/bank|بانک|حواله|hawala|remittance|بانکي|حواله/i.test(o.textContent)
          :/cash|نقد|صندوق|نغدي/i.test(o.textContent))||null;
      };
      const currentInvoiceTotal=()=>{
        const rows=currentRows().map(r=>({
          qty:r.querySelector('[data-field="qty"]').value||'0',
          price:r.querySelector('[data-field="price"]').value||'0'
        }));
        return window.ZaviDecimal.invoiceTotals(
          rows,form.elements.discount?.value||'0','0','0').total;
      };
      let fromMode=false;
      const setPaid=value=>{
        if(!paid)return;
        const next=String(value);
        if(paid.value===next)return;
        fromMode=true;paid.value=next;
        paid.dispatchEvent(new Event('input',{bubbles:true}));fromMode=false;
      };
      const syncFullPayment=()=>{
        if(chosenMode()==='credit')return;
        try{setPaid(currentInvoiceTotal())}catch(_){setPaid('0')}
      };
      payBox.addEventListener('change',e=>{
        const input=e.target;if(!input.matches('input[name=zsalMode]'))return;
        const next=input.value;
        if(next==='bank'||next==='cash'){
          const match=accountMatching(next);
          if(!match){
            // Never silently mark a cashbox transaction as bank transfer.
            setMode('credit');setPaid('0');
            if(account)window.ZaviDesignSystemV1?.setFieldError(account,tr('bankRequired'));
            return;
          }
          account.value=match.value;
          window.ZaviDesignSystemV1?.setFieldError(account,'');
          syncFullPayment();
        }else if(next==='credit')setPaid('0');
      });
      form.addEventListener('input',e=>{
        if(e.target===paid){
          if(fromMode)return;
          try{
            const amount=window.ZaviDecimal.roundMoney(paid.value||'0');
            if(amount<currentInvoiceTotal())setMode('credit');
          }catch(_){setMode('credit')}
          return;
        }
        if(e.target.matches?.('[data-field="qty"],[data-field="price"],input[name="discount"]'))
          queueMicrotask(()=>{syncFullPayment();schedule()});
      });
      form.addEventListener('change',e=>{
        if(e.target===account){
          const cash=accountMatching('cash'),bank=accountMatching('bank');
          if(e.target.value===bank?.value)setMode('bank');
          else if(e.target.value===cash?.value)setMode('cash');
        }
        if(e.target.matches?.('[data-field="productName"]'))
          queueMicrotask(syncFullPayment);
      });
      productPane.querySelector('#zaviBarcodeScan')?.addEventListener('keydown',e=>{
        if(e.key==='Enter')queueMicrotask(()=>{syncFullPayment();schedule()});
      });
      productPane.querySelector('#orderItems')?.addEventListener('click',e=>{
        if(e.target.closest?.('.remove-line'))queueMicrotask(syncFullPayment);
      });
      // Bootstrap once, without reassigning actual accounting values on every paint.
      syncFullPayment();
      const foot=form.querySelector('.modal-foot'),button=mk('button','btn zsal-preview-button',tr('preview'));
      button.type='button';button.setAttribute('aria-expanded','false');
      const receipt=mk('section','zsal-receipt');receipt.hidden=true;
      receipt.setAttribute('role','region');receipt.setAttribute('aria-live','polite');
      form.querySelector('.modal-body').append(receipt);
      if(foot){const submit=foot.querySelector('button[type=submit]');foot.insertBefore(button,submit||null)}
      button.addEventListener('click',()=>{
        if(!receipt.hidden){receipt.hidden=true;button.setAttribute('aria-expanded','false');button.textContent=tr('preview');return}
        try{
          const totals=validatePreview(form);if(!totals)return;
          receipt.replaceChildren(mk('h3','',tr('receipt')),
            mk('p','',tr('notSaved')),
            mk('p','',tr('customer')+': '+(form.elements.freeContactName.value.trim()||tr('cashCustomer'))),
            mk('p','',tr('currency')+': '+db.currency));
          const table=mk('table','zsal-receipt-table');
          const thead=mk('thead'),head=mk('tr');
          [tr('item'),tr('qty'),tr('unit')].forEach(x=>head.append(mk('th','',x)));
          thead.append(head);table.append(thead);
          const tbody=mk('tbody');
          for(const row of currentRows()){
            const trEl=mk('tr');
            [row.querySelector('[data-field="productName"]').value,
              row.querySelector('[data-field="qty"]').value,
              row.querySelector('[data-field="price"]').value].forEach(v=>trEl.append(mk('td','',v)));
            tbody.append(trEl);
          }
          table.append(tbody);receipt.append(table,
            mk('strong','',tr('total')+': '+nativeCurrency(totals.total)),
            mk('p','',tr('received')+': '+nativeCurrency(totals.paid)),
            mk('p','',tr('balance')+': '+nativeCurrency(Math.max(0,totals.total-totals.paid))));
          receipt.hidden=false;button.textContent=tr('close');button.setAttribute('aria-expanded','true');
          receipt.scrollIntoView({block:'nearest'});
        }catch(e){const note=mk('p','zsal-error',e.message||tr('noItems'));receipt.replaceChildren(note);receipt.hidden=false}
      });
      form.dataset.zsalApproved='true';
    }
    for(const [i,row] of currentRows().entries()){
      if(row.dataset.zsalApproved)continue;
      row.dataset.zsalApproved='true';
      const caption=mk('div','zsal-line-title',tr('item')+' '+(i+1));
      row.prepend(caption);
      const rowGrid=row.querySelector('.order-row');
      for(const [field,cls,label] of [
        ['qty','zsal-qty-label','quantity'],['price','zsal-price-label','unit']
      ]){
        const input=rowGrid?.querySelector('[data-field="'+field+'"]');
        if(!input)continue;
        input.id='zsal-'+field+'-'+String(row.dataset.line||i);
        const labelNode=mk('label','zsal-field-label '+cls,tr(label));
        labelNode.htmlFor=input.id;rowGrid.insertBefore(labelNode,input);
      }
      const subtotal=mk('div','zsal-line-subtotal');
      subtotal.append(mk('span','',tr('lineTotal')),mk('strong','',nativeCurrency(0)));
      row.append(subtotal);
      const name=row.querySelector('[data-field="productName"]');
      if(name)name.placeholder=lang()==='en'?'Product name or scan barcode':
        lang()==='ps'?'د توکي نوم یا بارکوډ':'نام محصول یا اسکن بارکد';
    }
  }
  function refreshLabels(){
    // Language switches must repaint new controls, without replacing native inputs.
    const set=(el,value)=>{
      if(el&&el.textContent!==value)el.textContent=value;
    };
    const root=document.querySelector('#content .zsal-approved-page');
    if(root){
      set(root.querySelector('.page-head h2'),tr('heading'));
      set(root.querySelector('.page-head p'),tr('subtitle'));
      set(root.querySelector('.page-head [data-action="sale"]'),'＋  '+tr('newSale'));
      const cards=root.querySelectorAll('.zsal-stat');
      if(cards.length===2){set(cards[0].querySelector('span'),tr('today'));set(cards[1].querySelector('span'),tr('count'))}
      set(root.querySelector('.zsal-allstats summary'),tr('allStats'));
      set(root.querySelector('.zsal-sale-more summary'),tr('more'));
      for(const [i,tab] of [...root.querySelectorAll('.zsal-list-tab')].entries())
        set(tab,tr(i===0?'records':'manual'));
    }
    const modal=document.querySelector('#overlay .zsal-approved-modal');
    if(!modal)return;
    set(modal.querySelector('.modal-head h3'),tr('newSale'));
    set(modal.querySelector('.zsal-guide summary'),tr('guide'));
    set(modal.querySelector('.zavi-flow-panel .form-section-title'),tr('items'));
    set(modal.querySelector('.zavi-barcode-box label[for="zaviBarcodeScan"]'),tr('addToSale'));
    const label=modal.querySelector('.zsal-customer-select label');
    if(label?.firstChild?.nodeType===3)set(label.firstChild,tr('selectCustomer'));
    set(modal.querySelector('.zsal-customer-select option[value=""]'),tr('cashCustomer'));
    set(modal.querySelector('.zsal-payment legend'),tr('payment'));
    for(const [i,k] of ['cash','bank','credit'].entries())
      set(modal.querySelectorAll('.zsal-payment-option span')[i],tr(k));
    set(modal.querySelector('.zsal-currency-note'),tr('currency')+': '+String(db.currency||'AFN'));
    const dual=modal.querySelector('.zsal-dual-date');
    if(dual){
      try{
        const next=window.ZaviDesignSystemV1?.formatDualDate(
          (typeof readDate==='function'?readDate(
            modal.querySelector('#dialogForm').elements.date.value):
            modal.querySelector('#dialogForm').elements.date.value),{
            language:lang()==='fa'?'fa-AF':lang()==='ps'?'ps-AF':'en',timezone:'Asia/Kabul'
          })||'';
        if(dual.textContent!==next)dual.textContent=next;
      }catch(_){if(dual.textContent)dual.textContent='';}
    }
    const btn=modal.querySelector('.zsal-preview-button');
    if(btn)set(btn,btn.getAttribute('aria-expanded')==='true'?tr('close'):tr('preview'));
    set(modal.querySelector('.zsal-payment-heading'),tr('calcInvoice'));
    for(const [i,row] of [...modal.querySelectorAll('.order-line')].entries()){
      set(row.querySelector('.zsal-line-title'),tr('item')+' '+(i+1));
      set(row.querySelector('.zsal-qty-label'),tr('quantity'));
      set(row.querySelector('.zsal-price-label'),tr('unit'));
      set(row.querySelector('.zsal-line-subtotal span'),tr('lineTotal'));
      const subtotal=row.querySelector('.zsal-line-subtotal strong');
      if(subtotal){
        let amount=0;
        try{
          amount=window.ZaviDecimal.invoiceTotals([{
            qty:row.querySelector('[data-field="qty"]')?.value||'0',
            price:row.querySelector('[data-field="price"]')?.value||'0'
          }],'0','0','0').total;
        }catch(_){amount=0}
        set(subtotal,nativeCurrency(amount));
      }
    }
  }
  let queued=false;
  function schedule(){
    if(queued)return;queued=true;
    queueMicrotask(()=>{queued=false;
      try{salesPage();saleModal();refreshLabels();
        document.body.classList.toggle('zsal-on-sales',
          !!document.querySelector('#content .zui-order-page[data-module="sales"]'));
      }catch(e){console.warn('Approved sales UI:',e?.message||e)}
    });
  }
  function start(){
    const content=document.getElementById('content'),overlay=document.getElementById('overlay');
    if(content)new MutationObserver(schedule).observe(content,{childList:true});
    if(overlay)new MutationObserver(schedule).observe(overlay,{childList:true,subtree:true});
    document.addEventListener('zavi:language-change',schedule);
    document.addEventListener('zavi:language-changed',schedule);
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

/* Approved sales screen adaptation — real ZAVI ONE routes and native save handler.
 * Reference: owner-provided seven sales/receipt/barcode screenshots, 2026-11-09.
 * No mock totals, no new financial persistence, no server-side auth claims.
 */
(() => {
  'use strict';
  const I18N={
    fa:{heading:'مدیریت فروش',subtitle:'فاکتورها و معاملات شما',newSale:'ثبت فروش جدید',
      today:'فروش امروز',count:'تعداد فاکتور',records:'فاکتورهای فروش',manual:'فاکتورهای دستی',
      archive:'فاکتورهای ذخیره‌شده',allStats:'آمار کلی',customer:'مشتری',
      cashCustomer:'مشتری نقدی',selectCustomer:'انتخاب مشتری ثبت‌شده',
      payment:'روش پرداخت',cash:'نقدی',bank:'بانکی / حواله',credit:'قرض / پرداخت بعدی',
      received:'مبلغ دریافت‌شده',currency:'ارز فاکتور',preview:'پیش‌نمایش فاکتور',
      close:'بستن پیش‌نمایش',receipt:'پیش‌نمایش رسید',item:'محصول',qty:'تعداد',
      unit:'قیمت واحد',total:'مبلغ نهایی فاکتور',balance:'باقی‌مانده مشتری',
      nameRequired:'محصول را از گدام انتخاب کنید.',qtyRequired:'تعداد باید بیشتر از صفر باشد.',
      priceRequired:'قیمت واحد باید بیشتر از صفر باشد.',overpaid:'مبلغ دریافت‌شده نمی‌تواند از کل بیشتر باشد.',creditName:'برای فروش قرضی، نام مشتری را وارد کنید.',
      stock:'موجودی کافی نیست.',noItems:'حداقل یک محصول لازم است.',notSaved:'پیش‌نمایش است؛ هنوز هیچ معامله‌ای ثبت نشده است.'},
    ps:{heading:'د پلور مدیریت',subtitle:'ستاسې بلونه او معاملې',newSale:'نوی پلور ثبتول',
      today:'د نن پلور',count:'د بلونو شمېر',records:'د پلور بلونه',manual:'لاسي بلونه',
      archive:'ساتل شوي بلونه',allStats:'ټولې شمېرې',customer:'پېرودونکی',
      cashCustomer:'نغدي پېرودونکی',selectCustomer:'ثبت شوی پېرودونکی وټاکئ',
      payment:'د تادیې ډول',cash:'نغدي',bank:'بانک / حواله',credit:'پور / وروسته تادیه',
      received:'ترلاسه شوې پیسې',currency:'د بل اسعار',preview:'د بل مخکتنه',
      close:'مخکتنه بندول',receipt:'د رسید مخکتنه',item:'توکی',qty:'شمېر',
      unit:'د واحد بیه',total:'د بل وروستۍ اندازه',balance:'د پېرودونکي پاتې',
      nameRequired:'توکی له ګدامه وټاکئ.',qtyRequired:'شمېر باید له صفر څخه لوړ وي.',
      priceRequired:'د واحد بیه باید له صفر څخه لوړه وي.',overpaid:'ترلاسه شوې پیسې له ټول مبلغ څخه ډېرې نشي.',creditName:'د پور پلور لپاره د پېرودونکي نوم ولیکئ.',
      stock:'موجودي کمه ده.',noItems:'لږ تر لږه یو توکی اړین دی.',notSaved:'دا مخکتنه ده؛ معامله لا نه ده ثبت شوې.'},
    en:{heading:'Sales management',subtitle:'Your invoices and transactions',newSale:'New sale',
      today:'Sales today',count:'Invoice count',records:'Sales invoices',manual:'Manual invoices',
      archive:'Saved invoices',allStats:'All-time totals',customer:'Customer',
      cashCustomer:'Cash customer',selectCustomer:'Choose an existing customer',
      payment:'Payment method',cash:'Cash',bank:'Bank / remittance',credit:'Credit / pay later',
      received:'Amount received',currency:'Invoice currency',preview:'Invoice preview',
      close:'Close preview',receipt:'Receipt preview',item:'Product',qty:'Quantity',
      unit:'Unit price',total:'Invoice final amount',balance:'Customer balance',
      nameRequired:'Select a product from the warehouse.',qtyRequired:'Quantity must be greater than zero.',
      priceRequired:'Unit price must be greater than zero.',overpaid:'Received amount cannot exceed total.',creditName:'A customer name is required for credit sales.',
      stock:'Not enough inventory.',noItems:'At least one product is required.',notSaved:'Preview only; no transaction has been saved.'}
  };
  const lang=()=>{
    const l=(document.documentElement.lang||'fa').toLowerCase();
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
      const customerPane=panels[1],paymentPane=panels[2];
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
      customerPane.prepend(pickerWrap);
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
      paymentPane.prepend(info);paymentPane.prepend(payBox);
      payBox.addEventListener('change',e=>{
        const input=e.target;if(!input.matches('input[name=zsalMode]'))return;
        const paid=form.elements.paid,account=form.elements.accountId;
        if(input.value==='credit')paid.value='0';
        else {
          try{
            const rows=currentRows().map(r=>({
              qty:r.querySelector('[data-field="qty"]').value||'0',
              price:r.querySelector('[data-field="price"]').value||'0'
            }));
            paid.value=String(window.ZaviDecimal.invoiceTotals(
              rows,form.elements.discount?.value||'0','0','0').total);
          }catch(_){paid.value='0';}
          if(input.value==='bank'&&account){
            const bank=[...account.options].find(o=>/bank|بانک|بانکی|بانک/iu.test(o.textContent)||/bank/i.test(o.value));
            if(bank)account.value=bank.value;
          }
        }
        paid.dispatchEvent(new Event('input',{bubbles:true}));
      });
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
      for(const [i,tab] of [...root.querySelectorAll('.zsal-list-tab')].entries())
        set(tab,tr(i===0?'records':'manual'));
    }
    const modal=document.querySelector('#overlay .zsal-approved-modal');
    if(!modal)return;
    set(modal.querySelector('.modal-head h3'),tr('newSale'));
    const label=modal.querySelector('.zsal-customer-select label');
    if(label?.firstChild?.nodeType===3)set(label.firstChild,tr('selectCustomer'));
    set(modal.querySelector('.zsal-customer-select option[value=""]'),tr('cashCustomer'));
    set(modal.querySelector('.zsal-payment legend'),tr('payment'));
    for(const [i,k] of ['cash','bank','credit'].entries())
      set(modal.querySelectorAll('.zsal-payment-option span')[i],tr(k));
    set(modal.querySelector('.zsal-currency-note'),tr('currency')+': '+String(db.currency||'AFN'));
    const btn=modal.querySelector('.zsal-preview-button');
    if(btn)set(btn,btn.getAttribute('aria-expanded')==='true'?tr('close'):tr('preview'));
    for(const [i,row] of [...modal.querySelectorAll('.order-line')].entries()){
      set(row.querySelector('.zsal-line-title'),tr('item')+' '+(i+1));
    }
  }
  let queued=false;
  function schedule(){
    if(queued)return;queued=true;
    queueMicrotask(()=>{queued=false;
      try{salesPage();saleModal();refreshLabels()}catch(e){console.warn('Approved sales UI:',e?.message||e)}
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

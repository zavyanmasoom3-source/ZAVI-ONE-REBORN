/* ZAVI ONE workflow organization: move LIVE form controls, never clone/replace
 * financial elements, validation callbacks or the submit handler. */
(() => {
  'use strict';
  const labels={
    fa:{accounts:'حساب‌ها',transactions:'تراکنش‌ها',more:'بیشتر',summary:'خلاصه',details:'جزئیات',output:'خروجی',
      products:'محصولات',customer:'مشتری',payment:'پرداخت',specs:'مشخصات',
      required:'این فیلد ضروری است.',positive:'قیمت هر واحد باید بیشتر از صفر باشد.',badNumber:'یک عدد معتبر وارد کنید.',badFormat:'فرمت این فیلد معتبر نیست.'},
    ps:{accounts:'حسابونه',transactions:'معاملې',more:'نور',summary:'لنډیز',details:'جزئیات',output:'وتنه',
      products:'توکي',customer:'پېرودونکی',payment:'تادیه',specs:'معلومات',
      required:'دا برخه اړینه ده.',positive:'د هر واحد بیه باید له صفر څخه لوړه وي.',badNumber:'سمه شمېره ولیکئ.',badFormat:'د دې برخې بڼه سمه نه ده.'},
    en:{accounts:'Accounts',transactions:'Transactions',more:'More',summary:'Summary',details:'Details',output:'Export',
      products:'Products',customer:'Customer',payment:'Payment',specs:'Details',
      required:'This field is required.',positive:'Unit price must be greater than zero.',badNumber:'Enter a valid number.',badFormat:'Invalid field format.'}
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
  function enhanceOrderForm(){
    const form=document.getElementById('dialogForm');
    if(!form||form.dataset.zaviFlowDone)return;
    const body=form.querySelector(':scope > .modal-body');
    if(!body||!body.querySelector('.zui-invoice-form')||!body.querySelector('#orderItems'))return;
    const children=[...body.children];
    const itemIndex=children.findIndex(el=>el.id==='orderItems');
    const totalsIndex=children.findIndex(el=>el.matches?.('.totals'));
    if(itemIndex<0||totalsIndex<itemIndex)return;
    let productIndex=-1;
    for(let i=0;i<itemIndex;i++)if(children[i].matches?.('.form-section-title'))productIndex=i;
    if(productIndex<0||productIndex>=totalsIndex)return;
    const isPurchase=body.querySelector('.zui-invoice-form')?.dataset.module==='purchases';
    const heading=body.querySelector('.zui-invoice-form');
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
    if(isPurchase)createTabs(body,'order', [general,products,payment],
      ['specs','products','payment']);
    else createTabs(body,'order',[products,general,payment],
      ['products','customer','payment']);
    if(heading && body.firstElementChild!==heading)body.prepend(heading);
    if(!body.querySelector('[data-zavi-flow="order"]'))return;
    form.dataset.zaviFlowDone='true';
    function fail(field,message){
      const panel=field.closest('.zavi-flow-panel');
      const flow=body.querySelector('[data-zavi-flow="order"]');
      const idx=[...flow.querySelectorAll('.zavi-flow-panel')].indexOf(panel);
      if(idx>=0)flow.zaviActivate(idx);
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
    document.querySelectorAll('[data-zavi-flow-label]').forEach(el=>{
      el.textContent=tr(el.dataset.zaviFlowLabel);
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

/* ZAVI ONE V66.62 — approved four-mode BARCODE selector for the real single-page SALE.
 * UI enhancement only. Barcode ownership, pricing, stock, customer, server and
 * native submit validation stay in the original invoice implementation.
 * USB / Bluetooth: standard HID keyboard wedge; no false pairing claims.
 */
(()=>{
  'use strict';
  const text={
    fa:{camera:'دوربین',manual:'دستی',usb:'USB',bluetooth:'Bluetooth',
      auto:'افزودن خودکار پس از اسکن',focus:'فعال‌کردن فیلد اسکنر',
      'hint-camera':'دوربین را باز کنید یا بارکد را دستی وارد کنید.',
      'hint-manual':'کد را تایپ کنید و Enter یا افزودن بارکد را بزنید.',
      'hint-usb':'اسکنر USB/OTG را وصل کنید؛ بعد از فعال‌کردن فیلد، Enter یا Tab پذیرفته می‌شود.',
      'hint-bluetooth':'اسکنر Bluetooth HID را در تنظیمات دستگاه جفت کنید؛ Enter یا Tab پذیرفته می‌شود.',
      'hint-confirm':'بارکد خوانده شد؛ برای افزودن محصول دکمهٔ افزودن بارکد را بزنید.'},
    ps:{camera:'کمره',manual:'لاسي',usb:'USB',bluetooth:'Bluetooth',
      auto:'له سکن وروسته په خپله زیاتول',focus:'د سکنر ډګر فعالول',
      'hint-camera':'کمره پرانیزئ یا بارکوډ په لاس ولیکئ.',
      'hint-manual':'کوډ ولیکئ او Enter یا د زیاتولو تڼۍ ووهئ.',
      'hint-usb':'USB/OTG سکنر ونښلوئ؛ په دې ډګر کې Enter یا Tab کار کوي.',
      'hint-bluetooth':'Bluetooth HID سکنر د وسیلې له تنظیماتو ونښلوئ؛ Enter یا Tab کار کوي.',
      'hint-confirm':'بارکوډ چمتو دی؛ د توکي زیاتولو تڼۍ ووهئ.'},
    en:{camera:'Camera',manual:'Manual',usb:'USB',bluetooth:'Bluetooth',
      auto:'Auto-add after scan',focus:'Focus scanner input',
      'hint-camera':'Open camera or type a barcode manually.',
      'hint-manual':'Type the code, then Enter or Add barcode.',
      'hint-usb':'Connect a USB/OTG HID scanner, focus the input; Enter or Tab suffix is supported.',
      'hint-bluetooth':'Pair a Bluetooth HID scanner in device settings; Enter or Tab suffix is supported.',
      'hint-confirm':'Barcode captured. Press Add barcode to add this product.'}
  };
  const locale=()=>{
    const l=(document.documentElement.lang||'fa').toLowerCase();
    return l.startsWith('en')?'en':l.startsWith('ps')?'ps':'fa';
  };
  function refresh(){
    const words=text[locale()];
    document.querySelectorAll('#dialogForm[data-zavi-sale-onepage="true"] [data-z66-scanner-text]')
      .forEach(el=>{
        const value=words[el.dataset.z66ScannerText];
        if(value&&el.textContent!==value)el.textContent=value;
      });
  }
  function enhance(){
    // This form is dynamically constructed by the ORIGINAL app. Do not
    // enhance purchase, sale_return, staff POS, or any unsaved other modal.
    const form=document.querySelector('#dialogForm[data-zavi-sale-onepage="true"]');
    const box=form?.querySelector('.z66-sale-barcode .zavi-barcode-box');
    const input=box?.querySelector('#zaviBarcodeScan');
    const actions=box?.querySelector('.zavi-barcode-actions');
    if(!input||!actions||box.dataset.z66ScanReady)return;
    box.dataset.z66ScanReady='true';
    const modes=document.createElement('div');
    modes.className='z66-sale-scan-modes';
    modes.setAttribute('role','group');
    modes.setAttribute('aria-label','Barcode input method');
    const status=document.createElement('p');
    status.className='z66-sale-scan-hint';
    status.setAttribute('role','status');
    const focus=document.createElement('button');
    focus.type='button';focus.className='btn subtle z66-sale-scan-focus';
    focus.dataset.z66ScannerText='focus';
    focus.addEventListener('click',()=>input.focus({preventScroll:true}));
    const checkLabel=document.createElement('label');
    checkLabel.className='z66-sale-autoadd';
    const check=document.createElement('input');
    check.type='checkbox';check.checked=true;
    check.setAttribute('aria-label','Automatically add registered barcode after scan');
    const caption=document.createElement('span');
    caption.dataset.z66ScannerText='auto';
    checkLabel.append(check,caption);
    const originalInputmode=input.getAttribute('inputmode')||'text';
    function choose(mode){
      if(!['camera','manual','usb','bluetooth'].includes(mode))return;
      box.dataset.z66ScanMode=mode;
      input.setAttribute('inputmode',mode==='usb'||mode==='bluetooth'?'none':originalInputmode);
      [...modes.children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.z66ScannerMode===mode)));
      status.dataset.z66ScannerText='hint-'+mode;
      refresh();
      if(mode!=='camera')input.focus({preventScroll:true});
    }
    for(const [mode,icon] of [['camera','📷'],['manual','⌨'],['usb','USB'],['bluetooth','ᛒ']]){
      const button=document.createElement('button');button.type='button';
      button.className='z66-sale-scan-choice';
      button.dataset.z66ScannerMode=mode;
      const glyph=document.createElement('span');
      glyph.className='z66-sale-scan-icon';glyph.textContent=icon;
      const label=document.createElement('span');
      label.dataset.z66ScannerText=mode;
      button.append(glyph,label);
      button.addEventListener('click',()=>choose(mode));
      modes.append(button);
    }
    box.insertBefore(modes,actions);
    actions.after(status,focus,checkLabel);
    check.addEventListener('change',()=>{
      if(!check.checked)status.dataset.z66ScannerText='hint-confirm';
      else status.dataset.z66ScannerText='hint-'+box.dataset.z66ScanMode;
      refresh();
    });
    // Keep native Add button, original barcode input and camera click handler.
    choose('camera');
  }
  // Capture ONLY the existing sale barcode field. A HID scanner is a keyboard
  // and some models send Tab rather than Enter. Re-dispatch the SAME native
  // Enter path once; never create order rows or write any ledger directly.
  document.addEventListener('keydown',event=>{
    const input=event.target;
    if(input?.id!=='zaviBarcodeScan')return;
    const box=input.closest('#dialogForm[data-zavi-sale-onepage="true"] .zavi-barcode-box');
    if(!box||box.dataset.z66ScanReady!=='true')return;
    const auto=box.querySelector('.z66-sale-autoadd input')?.checked!==false;
    const mode=box.dataset.z66ScanMode;
    if(event.key==='Tab'&&(mode==='usb'||mode==='bluetooth')&&String(input.value||'').trim()){
      event.preventDefault();event.stopImmediatePropagation();
      if(auto)input.dispatchEvent(new KeyboardEvent('keydown',{
        key:'Enter',bubbles:true,cancelable:true
      }));
      else{box.querySelector('.z66-sale-scan-hint').dataset.z66ScannerText='hint-confirm';refresh();}
      return;
    }
    // Off means a camera/HID scan merely fills the native preview. The native
    // Add button remains available. Manual typed Enter remains usable.
    if(event.key==='Enter'&&!auto&&mode!=='manual'&&box.dataset.z66ConfirmClick!=='true'){
      event.preventDefault();event.stopImmediatePropagation();
      box.querySelector('.z66-sale-scan-hint').dataset.z66ScannerText='hint-confirm';
      refresh();
    }
  },true);
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('#dialogForm[data-zavi-sale-onepage="true"] #z659BarcodeConfirm');
    if(!button)return;
    const box=button.closest('.zavi-barcode-box');
    if(!box||box.dataset.z66ScanReady!=='true')return;
    box.dataset.z66ConfirmClick='true';
    queueMicrotask(()=>{if(box.isConnected)delete box.dataset.z66ConfirmClick;});
  },true);
  let scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    queueMicrotask(()=>{scheduled=false;enhance();refresh();});
  }
  function init(){
    const overlay=document.getElementById('overlay');
    if(overlay)new MutationObserver(schedule).observe(overlay,{childList:true,subtree:true});
    document.addEventListener('zavi:language-change',schedule);
    document.addEventListener('zavi:language-changed',schedule);
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
/* ZAVI shared UI design contract — presentation and input helpers only.
 * NO account state, backend, network, auth or financial transactions.
 * The current app's translation dictionaries and styles remain authoritative.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  root.ZaviDesignSystemV1 = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const monthsEn = Object.freeze([
    'Hamal', 'Sawr', 'Jawza', 'Saratan', 'Asad', 'Sonbola',
    'Mizan', 'Aqrab', 'Qaws', 'Jadi', 'Dalw', 'Hoot'
  ]);
  // Intl language packs for ps-AF may ignore the Persian calendar extension.
  // Calendar extraction MUST be language-neutral, then localize Afghan names.
  const monthsSolar = Object.freeze({
    'fa-AF': ['حمل','ثور','جوزا','سرطان','اسد','سنبله',
              'میزان','عقرب','قوس','جدی','دلو','حوت'],
    'ps-AF': ['وری','غویی','غبرګولی','چنګاښ','زمری','وږی',
              'تله','لړم','لیندۍ','مرغومی','سلواغه','کب']
  });
  const monthsGregorian = Object.freeze({
    'fa-AF': ['جنوری','فبروری','مارچ','اپریل','می','جون','جولای','آگست','سپتمبر','اکتوبر','نوامبر','دسمبر'],
    'ps-AF': ['جنوري','فبروري','مارچ','اپرېل','مې','جون','جولای','اګست','سپتمبر','اکتوبر','نومبر','دسمبر']
  });
  const digitSets = Object.freeze({
    latn: '0123456789',
    arabext: '۰۱۲۳۴۵۶۷۸۹'
  });
  const fromArabic = '٠١٢٣٤٥٦٧٨٩';
  function normalizeLanguage(value) {
    const s = String(value || '').toLowerCase();
    return s.startsWith('ps') ? 'ps-AF' : s.startsWith('en') ? 'en' : 'fa-AF';
  }
  function direction(value) { return normalizeLanguage(value) === 'en' ? 'ltr' : 'rtl'; }
  function normalizeDigitStyle(value, language) {
    if (value === 'latn' || value === 'arabext') return value;
    return normalizeLanguage(language) === 'en' ? 'latn' : 'arabext';
  }
  function digits(text, style, language) {
    const dest = digitSets[normalizeDigitStyle(style, language)];
    return String(text).replace(/[0-9۰-۹٠-٩]/g, ch => {
      let i = '0123456789'.indexOf(ch);
      if (i < 0) i = digitSets.arabext.indexOf(ch);
      if (i < 0) i = fromArabic.indexOf(ch);
      return i < 0 ? ch : dest[i];
    });
  }
  function toDate(value) {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (Number.isNaN(date.getTime())) throw new RangeError('Invalid date; no fallback fake date allowed');
    return date;
  }
  function parts(date, locale, calendar, timezone, monthMode) {
    const opts = {
      timeZone: timezone, year: 'numeric',
      month: monthMode || 'numeric', day: 'numeric'
    };
    return Object.fromEntries(new Intl.DateTimeFormat(
      locale + '-u-ca-' + calendar, opts
    ).formatToParts(date).filter(p => ['year','month','day'].includes(p.type)).map(p => [p.type,p.value]));
  }
  function formatDualDate(value, opts) {
    opts = opts || {};
    const language = normalizeLanguage(opts.language);
    const style = normalizeDigitStyle(opts.digitStyle, language);
    const timezone = opts.timezone || 'Asia/Kabul';
    const date = toDate(value);
    const solar = parts(date, 'en-US', 'persian', timezone, 'numeric');
    const solarNumber = Number(digits(solar.month, 'latn', 'en'));
    if (!Number.isInteger(solarNumber) || solarNumber < 1 || solarNumber > 12) {
      throw new RangeError('Unsupported Afghan Solar Hijri month');
    }
    const solarMonth = language === 'en'
      ? monthsEn[solarNumber - 1]
      : monthsSolar[language][solarNumber - 1];
    const greg = parts(date, 'en', 'gregory', timezone, 'numeric');
    const gregNumber = Number(greg.month);
    if (!Number.isInteger(gregNumber) || gregNumber < 1 || gregNumber > 12) {
      throw new RangeError('Unsupported Gregorian month');
    }
    const gregMonth = language === 'en'
      ? new Intl.DateTimeFormat('en', {month:'long',timeZone:timezone}).format(date)
      : monthsGregorian[language][gregNumber - 1];
    return digits(solar.day + ' ' + solarMonth + ' ' + solar.year +
      ' | ' + greg.day + ' ' + gregMonth + ' ' + greg.year, style, language);
  }
  function formatNumber(value, opts) {
    opts = opts || {};
    const language = normalizeLanguage(opts.language);
    const style = normalizeDigitStyle(opts.digitStyle, language);
    const number = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(number)) throw new RangeError('Non-finite number refused');
    return new Intl.NumberFormat(language === 'en' ? 'en' : language, {
      numberingSystem: style,
      minimumFractionDigits: opts.minimumFractionDigits === undefined ? 0 : opts.minimumFractionDigits,
      maximumFractionDigits: opts.maximumFractionDigits === undefined ? 4 : opts.maximumFractionDigits
    }).format(number);
  }
  function formatExchangeRate(rate, sourceCurrency, targetCurrency, opts) {
    const value = Number(rate);
    const source = String(sourceCurrency || '').toUpperCase();
    const target = String(targetCurrency || '').toUpperCase();
    if (!Number.isFinite(value) || value <= 0 || !/^[A-Z]{3}$/.test(source) ||
        !/^[A-Z]{3}$/.test(target) || source === target) {
      throw new RangeError('Rate must be positive and currencies must be distinct ISO-style codes');
    }
    const options = opts || {};
    return formatNumber(1, {language:options.language,digitStyle:options.digitStyle}) +
      ' ' + source + ' = ' + formatNumber(value, {
        language:options.language,digitStyle:options.digitStyle,
        maximumFractionDigits:6
      }) + ' ' + target;
  }
  function normalizeAfghanPhone(input) {
    const s = digits(String(input || ''), 'latn', 'en').replace(/[\s().\-]/g,'');
    const plain = s.startsWith('+') ? s.slice(1) : s;
    if (!/^\d+$/.test(plain)) return null;
    if (/^07\d{8}$/.test(plain)) return '+93' + plain.slice(1);
    if (/^7\d{8}$/.test(plain)) return '+93' + plain;
    if (/^937\d{8}$/.test(plain)) return '+' + plain;
    // Do not manufacture an Afghan country code for a foreign number.
    if (s.startsWith('+') && /^[1-9]\d{7,14}$/.test(plain)) return '+' + plain;
    return null;
  }
  function whatsappDigits(input) {
    const e164 = normalizeAfghanPhone(input);
    return e164 ? e164.slice(1) : null;
  }
  function setFieldError(field, message) {
    if (!field || !field.ownerDocument) throw new TypeError('A real input is required');
    const id = field.id || ('zds-field-' + Math.random().toString(36).slice(2));
    if (!field.id) field.id = id;
    const host = field.closest('[data-zds-field]') || field.parentElement;
    if (!host) throw new TypeError('Field must be attached to a parent');
    let node = Array.from(host.querySelectorAll('[data-zds-error-for]'))
      .find(el => el.getAttribute('data-zds-error-for') === id);
    const hasError = Boolean(String(message || '').trim());
    field.setAttribute('aria-invalid', hasError ? 'true' : 'false');
    if (hasError && !node) {
      node = field.ownerDocument.createElement('small');
      node.className = 'zds-field-error';
      node.id = id + '-error';
      node.setAttribute('data-zds-error-for', id);
      node.setAttribute('role','alert');
      field.insertAdjacentElement('afterend',node);
    }
    if (node) {
      node.textContent = hasError ? String(message) : '';
      node.hidden = !hasError;
      if (hasError) field.setAttribute('aria-describedby',node.id);
      else if (field.getAttribute('aria-describedby') === node.id)
        field.removeAttribute('aria-describedby');
    }
    return !hasError;
  }
  function refreshDualDateNodes(scope) {
    if (!scope || !scope.querySelectorAll) return 0;
    const doc = scope.nodeType === 9 ? scope : scope.ownerDocument;
    const lang = normalizeLanguage(doc?.documentElement?.lang || 'fa-AF');
    let count = 0;
    scope.querySelectorAll('[data-zds-dual-date]').forEach(node => {
      const value = node.getAttribute('data-zds-dual-date');
      if (!value) return;
      const style = node.getAttribute('data-zds-digit-style') || undefined;
      try {
        node.textContent = formatDualDate(value === 'today' ? new Date() : value,
          {language:lang,digitStyle:style});
        count++;
      } catch (_) {
        node.textContent = ''; // Never show a made-up date on malformed data.
      }
    });
    return count;
  }
  const visibilityLabels = Object.freeze({
    'fa-AF':{show:'نمایش رمز',hide:'پنهان‌کردن رمز'},
    'ps-AF':{show:'پټنوم ښکاره کړئ',hide:'پټنوم پټ کړئ'},
    en:{show:'Show password',hide:'Hide password'}
  });
  function passwordVisibilityLabel(language, visible) {
    return visibilityLabels[normalizeLanguage(language)][visible ? 'hide' : 'show'];
  }
  const fixedLabels = Object.freeze({
    'fa-AF': Object.freeze({serverSettings:'تنظیمات اتصال سرور',
      serverUrl:'آدرس سرور مرکزی',publishableKey:'کلید عمومی سرور'}),
    'ps-AF': Object.freeze({serverSettings:'د سرور د نښلولو تنظیمات',
      serverUrl:'د مرکزي سرور پته',publishableKey:'د سرور عامه کیلي'}),
    en: Object.freeze({serverSettings:'Server connection settings',
      serverUrl:'Central server address',publishableKey:'Public server key'})
  });
  function localizedLabel(key, language) {
    const label = fixedLabels[normalizeLanguage(language)][key];
    if (!label) throw new RangeError('Unknown design translation key');
    return label;
  }
  function syncFixedLabels(doc) {
    const lang = normalizeLanguage(doc.documentElement?.lang);
    doc.querySelectorAll('[data-zds-translation]').forEach(node => {
      const key = node.getAttribute('data-zds-translation');
      if (!fixedLabels[lang][key]) return;
      node.textContent = localizedLabel(key,lang);
    });
  }
  function syncPasswordToggleLabels(doc) {
    const language = normalizeLanguage(doc.documentElement?.lang);
    doc.querySelectorAll('[data-zds-password-toggle]').forEach(button => {
      const id = button.getAttribute('data-zds-password-toggle');
      const field = id && doc.getElementById(id);
      if (!field) return;
      const isVisible = field.type === 'text';
      const label = passwordVisibilityLabel(language,isVisible);
      button.textContent = isVisible ? '🙈' : '👁';
      button.setAttribute('aria-label',label);
      button.setAttribute('title',label);
      button.setAttribute('aria-pressed',String(isVisible));
      button.setAttribute('aria-controls',id);
    });
  }
  if (typeof document !== 'undefined') {
    const update = () => {
      refreshDualDateNodes(document);
      syncPasswordToggleLabels(document);
      syncFixedLabels(document);
    };
    document.addEventListener('click', event => {
      const button = event.target?.closest?.('[data-zds-password-toggle]');
      if (!button) return;
      const id = button.getAttribute('data-zds-password-toggle');
      const field = id && document.getElementById(id);
      if (!field || (field.type !== 'password' && field.type !== 'text')) return;
      field.type = field.type === 'password' ? 'text' : 'password';
      syncPasswordToggleLabels(document);
      field.focus({preventScroll:true});
    });
    document.addEventListener('zavi:language-change',update);
    document.addEventListener('zavi:language-changed',update);
    document.addEventListener('DOMContentLoaded',update);
  }

  /* Safe shared DOM components; not financial, auth or server-side actions.
   * No dummy data and no implicit success actions are created.
   */
  const iconPaths = Object.freeze({
    home:[['path','M3 10 12 3l9 7v11H3z'],['path','M9 21v-7h6v7']],
    search:[['circle','11 11 7'],['path','m20 20-4-4']],
    plus:[['path','M12 5v14'],['path','M5 12h14']],
    check:[['path','M20 6 9 17l-5-5']],
    close:[['path','M18 6 6 18'],['path','M6 6l12 12']],
    users:[['path','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'],['circle','9 7 4'],['path','M22 21v-2a4 4 0 0 0-3-3.87'],['path','M16 3.13a4 4 0 0 1 0 7.75']],
    box:[['path','m12 2 9 5-9 5-9-5 9-5z'],['path','M3 7v10l9 5 9-5V7'],['path','M12 12v10']],
    shoppingCart:[['path','M3 3h2l2 12h12l3-9H6'],['circle','10 20 1'],['circle','19 20 1']],
    wallet:[['rect','3 6 18 15 2'],['path','M3 10h18'],['path','M16 15h2']],
    calendar:[['rect','3 5 18 16 2'],['path','M16 3v4'],['path','M8 3v4'],['path','M3 10h18']],
    shield:[['path','M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']],
    settings:[['circle','12 12 3'],['path','M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2']],
    document:[['path','M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'],['path','M14 2v6h6'],['path','M8 13h8'],['path','M8 17h8']]
  });
  function uiIcon(name) {
    const shape=iconPaths[name];
    if (!shape || typeof document==='undefined') throw new RangeError('Unknown local SVG icon');
    const ns='http://www.w3.org/2000/svg', svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');svg.setAttribute('class','zds-svg-icon');
    for(const [kind,definition] of shape){
      const node=document.createElementNS(ns,kind);
      const args=definition.split(' ');
      if(kind==='path')node.setAttribute('d',definition);
      else if(kind==='circle'){node.setAttribute('cx',args[0]);node.setAttribute('cy',args[1]);node.setAttribute('r',args[2]);}
      else if(kind==='rect'){
        node.setAttribute('x',args[0]);node.setAttribute('y',args[1]);
        node.setAttribute('width',args[2]);node.setAttribute('height',args[3]);
        node.setAttribute('rx',args[4]);
      }
      svg.append(node);
    }
    return svg;
  }
  function uiNode(tag,className,text){
    if(typeof document==='undefined')throw new TypeError('Browser document required');
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined&&text!==null)node.textContent=String(text);
    return node;
  }
  function uiButton({label,variant='primary',onClick,disabled=false,icon}={}){
    if(typeof label!=='string'||!label.trim())throw new TypeError('Accessible button label required');
    if(typeof onClick!=='function'&&!disabled)throw new TypeError('Real action callback or disabled=true required');
    const variants=['primary','secondary','danger'];
    if(!variants.includes(variant))throw new RangeError('Unsupported button variant');
    const node=uiNode('button','zds-button zds-button--'+variant);
    node.type='button';node.disabled=!!disabled;node.setAttribute('aria-label',label);
    if(icon)node.append(uiIcon(icon));
    node.append(document.createTextNode(label));
    if(typeof onClick==='function')node.addEventListener('click',onClick);
    return node;
  }
  function uiField({label,name,id,type='text',value='',required=false,placeholder=''}={}){
    if(!label||!name)throw new TypeError('Field label and name required');
    const root=uiNode('div','zds-field');
    root.dataset.zdsField='true';
    const input=uiNode('input');
    input.type=type;input.name=name;
    input.id=id||'zds-'+String(name).replace(/[^a-zA-Z0-9_-]/g,'-');
    input.value=String(value);input.required=!!required;input.placeholder=placeholder;
    const lab=uiNode('label','',label);lab.setAttribute('for',input.id);
    root.append(lab,input);
    return {root,input,setError(message){return setFieldError(input,message)}};
  }
  function uiStatus({label,state='neutral'}={}){
    if(!label)throw new TypeError('Visible status label required');
    if(!['neutral','success','warning','danger'].includes(state))throw new RangeError('Invalid status');
    return uiNode('span','zds-status'+(state==='neutral'?'':' zds-status--'+state),label);
  }
  function uiEmpty({message,icon='document'}={}){
    if(!message)throw new TypeError('Empty state message required');
    const panel=uiNode('div','zds-empty');
    panel.append(uiIcon(icon),uiNode('p','',message));return panel;
  }
  function uiStepper({steps,active=0}={}){
    if(!Array.isArray(steps)||!steps.length||active<0||active>=steps.length)throw new RangeError('Steps and active index required');
    const list=uiNode('ol','zds-stepper');
    steps.forEach((label,index)=>{
      const item=uiNode('li','',label);
      if(index===active)item.setAttribute('aria-current','step');
      list.append(item);
    });
    return list;
  }
  function uiConfirmDialog({title,message,onConfirm,cancelLabel='Cancel',confirmLabel='Confirm'}={}){
    if(!title||!message||typeof onConfirm!=='function')throw new TypeError('Real confirmation callback required');
    const panel=uiNode('dialog','zds-dialog');
    const heading=uiNode('h2','',title),desc=uiNode('p','',message);
    const controls=uiNode('div','zds-dialog-actions');
    const cancel=uiButton({label:cancelLabel,variant:'secondary',onClick:()=>panel.close()});
    const confirm=uiButton({label:confirmLabel,onClick:()=>onConfirm(panel)});
    controls.append(cancel,confirm);panel.append(heading,desc,controls);
    return panel;
  }
  return Object.freeze({
    normalizeLanguage,direction,digits,formatDualDate,formatNumber,
    formatExchangeRate,normalizeAfghanPhone,whatsappDigits,setFieldError,
    refreshDualDateNodes,passwordVisibilityLabel,localizedLabel,
    uiIcon,uiButton,uiField,uiStatus,uiEmpty,uiStepper,uiConfirmDialog
  });
});

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
  return Object.freeze({
    normalizeLanguage,direction,digits,formatDualDate,formatNumber,
    formatExchangeRate,normalizeAfghanPhone,whatsappDigits,setFieldError,
    refreshDualDateNodes,passwordVisibilityLabel,localizedLabel
  });
});

/* Common language selector. Existing full app dictionaries remain authoritative. */
(function (root) {
  'use strict';
  const supported = Object.freeze(['fa-AF', 'ps-AF', 'en']);
  const normalize = value => {
    const lang = String(value || '').toLowerCase();
    return lang.startsWith('ps') ? 'ps-AF' : lang.startsWith('en') ? 'en' : 'fa-AF';
  };
  const direction = value => normalize(value) === 'en' ? 'ltr' : 'rtl';
  const labels = Object.freeze({
    'fa-AF': Object.freeze({language:'زبان',settings:'تنظیمات',save:'ذخیره',cancel:'لغو'}),
    'ps-AF': Object.freeze({language:'ژبه',settings:'تنظیمات',save:'خوندي کول',cancel:'لغوه کول'}),
    en: Object.freeze({language:'Language',settings:'Settings',save:'Save',cancel:'Cancel'})
  });
  root.ZAVI_SHARED_I18N = Object.freeze({supported,normalize,direction,labels});
})(typeof window !== 'undefined' ? window : globalThis);

/* PDF screen map: keeps one visual contract for every real route. */
(() => {
  'use strict';

  const routes = [
    'dashboard', 'sales', 'purchases', 'products', 'contacts', 'debtors',
    'creditors', 'money', 'hawala', 'expenses', 'reports', 'journal',
    'repairs', 'waste', 'settings', 'subscription',
  ];
  const aliases = { phonebook: 'contacts' };
  const titleRoutes = [
    [/داشبورد|dashboard|کورپاڼه/i, 'dashboard'],
    [/فروش|sales|پلور/i, 'sales'],
    [/خرید|purchase|پېرود/i, 'purchases'],
    [/محصول|گدام|product|warehouse|توکي|ګدام/i, 'products'],
    [/مشتری|اشخاص|contact|customer|پېرودون/i, 'contacts'],
    [/قرضدار|بدهکار|debtor|پوروړ/i, 'debtors'],
    [/طلبکار|تأمین|creditor|supplier|عرضه کوون/i, 'creditors'],
    [/صندوق|جریان پول|cash|money|نغد/i, 'money'],
    [/حواله|hawala|لېږد/i, 'hawala'],
    [/مصرف|expense|لګښت/i, 'expenses'],
    [/راپور|report/i, 'reports'],
    [/روزنامچه|journal|ورځپاڼه/i, 'journal'],
    [/تعمیر|repair|ترمیم/i, 'repairs'],
    [/ضایعات|waste|زیان/i, 'waste'],
    [/تنظیمات|settings|امستنې/i, 'settings'],
    [/اشتراک|subscription|ګډون/i, 'subscription'],
  ];

  function currentRoute() {
    const active = document.querySelector('.nav-btn.active[data-go], .bottom-btn.active[data-go], [aria-current="page"][data-go]');
    const raw = window.zaviCurrentPage || document.body.dataset.page || active?.dataset.go || '';
    const normalized = aliases[raw] || raw;
    if (routes.includes(normalized)) return normalized;
    const title = `${document.getElementById('pageTitle')?.textContent || ''} ${document.getElementById('pageSub')?.textContent || ''}`;
    return titleRoutes.find(([pattern]) => pattern.test(title))?.[1] || 'dashboard';
  }

  function apply() {
    const root = document.getElementById('content');
    if (!root) return;
    const route = currentRoute();
    for (const name of routes) root.classList.remove(`zpdf-${name}`);
    root.classList.add(`zpdf-${route}`);
    root.dataset.zpdfReference = 'v6740';
    root.dataset.zpdfPage = route;
    document.body.dataset.zaviPage = route;
  }

  const root = document.getElementById('content');
  if (root) new MutationObserver(apply).observe(root, { childList: true, subtree: true });
  document.addEventListener('click', () => setTimeout(apply, 0), true);
  document.addEventListener('zavi:page', apply);
  apply();
})();

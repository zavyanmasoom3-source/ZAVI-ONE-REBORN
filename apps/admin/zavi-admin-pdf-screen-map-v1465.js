/* ADMIN PDF screen map: adds stable route classes without replacing owner logic. */
(() => {
  'use strict';
  const routes = ['overview', 'customers', 'payments', 'finance', 'devices', 'support', 'activity', 'health', 'brand', 'security', 'settings'];
  const titleRoutes = [
    [/فروشگاه|مشتری|customer|store/i, 'customers'],
    [/پرداخت|تمدید|payment|renew/i, 'payments'],
    [/حسابداری|درآمد|finance|revenue/i, 'finance'],
    [/دستگاه|device/i, 'devices'],
    [/پشتیبانی|پیام|support|message/i, 'support'],
    [/فعالیت|activity/i, 'activity'],
    [/سلامت|وضعیت سیستم|health/i, 'health'],
    [/برند|brand/i, 'brand'],
    [/امنیت|دسترسی|security/i, 'security'],
    [/تنظیمات|settings/i, 'settings'],
    [/داشبورد|overview/i, 'overview'],
  ];

  function currentRoute() {
    const active = document.querySelector('.nav-item.selected[data-page], .admin-mobile-nav [aria-current="page"][data-page]');
    const raw = document.body.dataset.page || active?.dataset.page || '';
    if (routes.includes(raw)) return raw;
    const title = document.getElementById('pageCrumb')?.textContent || '';
    return titleRoutes.find(([pattern]) => pattern.test(title))?.[1] || 'overview';
  }

  function apply() {
    const root = document.getElementById('view');
    if (!root) return;
    const route = currentRoute();
    for (const name of routes) root.classList.remove(`zpdf-${name}`);
    root.classList.add(`zpdf-${route}`);
    root.dataset.zpdfReference = 'v1465';
    root.dataset.zpdfPage = route;
    document.body.dataset.zaviPage = route;
  }

  const root = document.getElementById('view');
  if (root) new MutationObserver(apply).observe(root, { childList: true, subtree: true });
  document.addEventListener('click', () => setTimeout(apply, 0), true);
  apply();
})();

/* Visual-only ZAVI 65.84 unified UI initializer; no authentication, routing or state mutations. */
(() => {
  'use strict';
  const root=document.documentElement;
  root.classList.add('zavi-design-84');
  root.dataset.zaviDesignVersion='65.84';
  // Responsive layout is done via CSS viewport media queries. Never zoom or
  // change CSS transform on <body> as that makes modals/drawers half-visible.
  // Respect user-selected display size and existing language/dark/light settings.
})();

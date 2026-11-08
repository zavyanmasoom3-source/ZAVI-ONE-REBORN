/* ZAVI premium visual layer v2 — no DOM mutation observer, no injected wrappers,
   no timing dependency for card visibility; default render stays fully visible. */
(()=>{
 'use strict';
 document.documentElement.classList.add('zavi-luxe-safe');
 // Disable legacy neon styles if old APK cached its stylesheet via a Service Worker.
 document.documentElement.classList.remove('zavi-luxe');
})();

/* ZAVI ONE V66.08 — minimal assistant decoration fix.
 * Hide only the decorative star badge over the AI assistant.
 * Preserve all launchers, voice/text commands and their event handlers.
 */
(() => {
  'use strict';
  if (document.getElementById('zavi-assistant-star-only-fix')) return;
  const style = document.createElement('style');
  style.id = 'zavi-assistant-star-only-fix';
  style.textContent = '#z605-panel .z605-badge{display:none!important}';
  (document.head || document.documentElement).appendChild(style);
})();

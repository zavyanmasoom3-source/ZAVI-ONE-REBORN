/* ZAVI ONE shared public configuration. No secret/service-role keys. */
(function (root) {
  'use strict';
  const projectId = 'wbbmwfnmurpphwxesssx';
  const url = 'https://' + projectId + '.supabase.co';
  const current = root.ZAVI_CLOUD_DEFAULTS || {};
  if (current.url && current.url !== url) {
    throw new Error('ZAVI Supabase project mismatch: expected EU project');
  }
  const key = current.key || '';
  if (/^(sb_secret_|eyJ)/.test(key) && !/^sb_publishable_/.test(key)) {
    throw new Error('Unsafe Supabase key in browser configuration');
  }
  root.ZAVI_SHARED_SUPABASE = Object.freeze({ projectId, url, publishableKey: key });
})(typeof window !== 'undefined' ? window : globalThis);

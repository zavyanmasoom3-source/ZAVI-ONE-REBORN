/* ZAVI ONE V64.7 — integrity checking, not authentication/signature or encryption.
   Tenant identity still verified separately. Old exports remain readable with warnings. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ZaviBackupIntegrity647=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const marker='zavi_backup_integrity',fmt='zavi-sha256-json-v1';
 const encoder=new TextEncoder();
 function strip(v){if(!v||typeof v!=='object'||Array.isArray(v))throw Error('ساختار پشتیبان قابل بررسی نیست.');const copy={...v};delete copy[marker];return copy;}
 function hex(buffer){return Array.from(new Uint8Array(buffer)).map(x=>x.toString(16).padStart(2,'0')).join('');}
 async function digest(v,subtle=globalThis.crypto?.subtle){if(!subtle)throw Error('برای بررسی SHA-256 باید از اتصال امن HTTPS یا برنامه محلی معتبر استفاده کنید.');return hex(await subtle.digest('SHA-256',encoder.encode(JSON.stringify(strip(v)))));}
 async function seal(payload,subtle){const clean=strip(payload);const value=await digest(clean,subtle);return {...clean,[marker]:{format:fmt,sha256:value}};}
 async function verify(payload,subtle){const mark=payload?.[marker];if(!mark)return {status:'legacy'};if(mark.format!==fmt||!(/^[a-f0-9]{64}$/).test(String(mark.sha256||'')))throw Error('اثر انگشت پشتیبان نامعتبر است.');const expected=await digest(payload,subtle);if(mark.sha256!==expected)throw Error('فایل پشتیبان پس از تهیه تغییر کرده یا آسیب دیده است؛ بازیابی متوقف شد.');return {status:'verified'};}
 return Object.freeze({seal,verify,digest,marker});
});

/* 66.62 original PIN field: small functional eye, no global skin changes. */
(()=>{
'use strict';
const INPUT='zawiPinOne';
const LOGIN_CSS="\n/* Approved compact V66.62 login only. App screens, auth logic and recovery are untouched. */\n#zawiPrivateGate.zavi66-approved-login{\n --z66-text:#183451;--z66-muted:#5e748d;--z66-edge:#dbe5f1;--z66-field:#fff;\n --z66-card:#fff;--z66-bg:#f4f7fc;\n background:var(--z66-bg)!important;overflow:auto!important;\n padding:clamp(12px,3dvh,24px) 12px!important;align-items:center!important;justify-content:center!important}\n#zawiPrivateGate.zavi66-approved-login::before{display:none!important}\n#zawiPrivateGate.zavi66-approved-login .zawi-auth-card{\n box-sizing:border-box!important;width:min(94vw,390px)!important;max-width:390px!important;\n min-width:0!important;max-height:calc(100dvh - 26px)!important;overflow-y:auto!important;\n padding:19px 21px 16px!important;margin:0 auto!important;border-radius:20px!important;\n background:var(--z66-card)!important;border:1px solid var(--z66-edge)!important;\n box-shadow:0 16px 45px #1f416421!important;direction:inherit!important;\n animation:none!important;color:var(--z66-text)!important}\n#zawiPrivateGate.zavi66-approved-login .zawi-brand-latin{display:none!important}\n#zawiPrivateGate.zavi66-approved-login .zavi-auth-language{\n display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:7px!important;\n margin:0 0 12px!important;width:100%!important;color:var(--z66-muted)!important;font-size:12px!important}\n#zawiPrivateGate.zavi66-approved-login .zavi-auth-language label{color:var(--z66-muted)!important}\n#zawiPrivateGate.zavi66-approved-login #zaviGateLanguage{\n min-height:38px!important;max-width:145px!important;padding:5px 12px!important;\n background:var(--z66-field)!important;border:1px solid var(--z66-edge)!important;\n border-radius:10px!important;color:var(--z66-text)!important;font-size:12px!important;font-weight:700!important;font-family:inherit!important}\n#zawiPrivateGate.zavi66-approved-login .zawi-lock-emblem{\n width:60px!important;height:60px!important;border-radius:50%!important;\n margin:2px auto 5px!important;box-shadow:none!important;\n background:transparent!important;border:1px solid var(--z66-edge)!important}\n#zawiPrivateGate.zavi66-approved-login .zawi-lock-emblem img{border-radius:50%!important}\n#zawiPrivateGate.zavi66-approved-login .zavi-gate-eyebrow{\n margin:2px 0 8px!important;text-align:center!important;font-size:11px!important;\n color:var(--z66-muted)!important;font-weight:600!important}\n#zawiPrivateGate.zavi66-approved-login #zawiGateTitle{\n font-size:clamp(18px,4.5vw,21px)!important;font-weight:800!important;line-height:1.4!important;font-family:inherit!important;\n color:var(--z66-text)!important;text-align:center!important;\n margin:7px 0 4px!important;letter-spacing:normal!important}\n#zawiPrivateGate.zavi66-approved-login #zawiGateHelp{\n font-size:12px!important;line-height:1.7!important;color:var(--z66-muted)!important;\n text-align:center!important;margin:0 0 16px!important;max-width:none!important}\n#zawiPrivateGate.zavi66-approved-login .zawi-pin-field{\n position:relative!important;margin:8px 0 10px!important;text-align:start!important}\n#zawiPrivateGate.zavi66-approved-login .zawi-pin-field label{\n display:block!important;font-size:12px!important;line-height:1.55!important;\n color:var(--z66-text)!important;text-align:start!important;margin:0 0 6px!important}\n#zawiPrivateGate.zavi66-approved-login :is(#zawiPinOne,#zawiPinRepeat){\n box-sizing:border-box!important;width:100%!important;min-height:48px!important;height:48px!important;\n padding:9px 12px!important;border:1px solid var(--z66-edge)!important;border-radius:12px!important;\n background:var(--z66-field)!important;color:var(--z66-text)!important;\n font-size:18px!important;box-shadow:none!important;letter-spacing:2px!important}\n#zawiPrivateGate.zavi66-approved-login #zawiPinOne{padding-inline-end:53px!important}\n#zawiPrivateGate.zavi66-approved-login :is(#zawiPinOne,#zawiPinRepeat):focus{\n border-color:#178dcc!important;outline:3px solid #38afd338!important;outline-offset:0!important}\n#zawiPrivateGate.zavi66-approved-login #z639PinProgress,\n#zawiPrivateGate.zavi66-approved-login #z639PinStatus{display:none!important}\n#zawiPrivateGate.zavi66-approved-login #zavi66PinHint{\n display:block!important;margin:5px 1px 0!important;color:var(--z66-muted)!important;\n font-size:11px!important;font-weight:400!important;line-height:1.4!important}\n#zawiPrivateGate.zavi66-approved-login [data-zds-password-toggle=\"zawiPinOne\"]{\n position:absolute!important;inset-inline-end:5px!important;bottom:auto!important;top:22px!important;\n width:42px!important;height:42px!important;min-height:42px!important;\n display:grid!important;place-items:center!important;padding:5px!important;cursor:pointer!important;\n color:var(--z66-muted)!important;background:transparent!important;border:none!important;\n border-radius:10px!important;box-shadow:none!important}\n#zawiPrivateGate.zavi66-approved-login [data-zds-password-toggle=\"zawiPinOne\"] svg{\n display:block;width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.7;\n stroke-linecap:round;stroke-linejoin:round}\n#zawiPrivateGate.zavi66-approved-login [data-zds-password-toggle=\"zawiPinOne\"] .zavi66-eye-slash{display:none}\n#zawiPrivateGate.zavi66-approved-login [data-zds-password-toggle=\"zawiPinOne\"].zavi66-revealed .zavi66-eye-slash{display:block}\n#zawiPrivateGate.zavi66-approved-login #zawiPinError{\n font-size:12px!important;line-height:1.5!important;color:#b32738!important;margin:5px 0!important}\n#zawiPrivateGate.zavi66-approved-login #zawiPinSubmit{\n display:block!important;width:100%!important;min-height:47px!important;\n margin:15px 0 0!important;padding:10px 12px!important;border:none!important;\n border-radius:12px!important;background:linear-gradient(105deg,#2860e2,#12b2d1)!important;\n box-shadow:none!important;color:#fff!important;font-size:14px!important;font-weight:750!important;font-family:inherit!important;\n transform:none!important}\n#zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn{\n display:block!important;width:auto!important;max-width:100%!important;min-height:37px!important;\n padding:7px 10px!important;margin:9px auto 0!important;font-size:12px!important;font-weight:600!important;font-family:inherit!important;\n background:transparent!important;border:0!important;border-radius:8px!important;\n box-shadow:none!important;color:#2869a4!important}\n#zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn:focus-visible{outline:2px solid #12a9bc!important}\nhtml[data-zavi-theme=\"dark\"] #zawiPrivateGate.zavi66-approved-login,\nhtml[data-zavi-appearance=\"dark\"] #zawiPrivateGate.zavi66-approved-login{\n --z66-text:#f0f5ff;--z66-muted:#c1d0e9;--z66-edge:#48688e;\n --z66-field:#172b4c;--z66-card:#15274a;--z66-bg:#08182d}\nhtml[data-zavi-theme=\"dark\"] #zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn,\nhtml[data-zavi-appearance=\"dark\"] #zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn{color:#88daff!important}\nhtml[data-zavi-theme=\"glass\"] #zawiPrivateGate.zavi66-approved-login,\nhtml[data-zavi-appearance=\"glass\"] #zawiPrivateGate.zavi66-approved-login{\n --z66-text:#f1f8ff;--z66-muted:#d4e5ff;--z66-edge:#7198c4;\n --z66-field:#184571;--z66-card:#1a4479;--z66-bg:#11305f}\nhtml[data-zavi-theme=\"glass\"] #zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn,\nhtml[data-zavi-appearance=\"glass\"] #zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn{color:#a0e9ff!important}\n@media(max-width:380px){\n #zawiPrivateGate.zavi66-approved-login .zawi-auth-card{padding:14px 15px!important;width:min(94vw,365px)!important}\n #zawiPrivateGate.zavi66-approved-login .zawi-lock-emblem{width:52px!important;height:52px!important}\n}\n@media(prefers-reduced-motion:reduce){#zawiPrivateGate.zavi66-approved-login *{transition:none!important;animation:none!important}}\n\n\n/* V66.62 viewport-centering owner fix: only the locked PIN gate.\n   Width is based on the real available viewport, not legacy 94vw plus padding.\n   Short screens/soft keyboard allow scrolling; nothing can be cut at either side. */\n#zawiPrivateGate.zavi66-approved-login {\n  position:fixed!important;\n  inset:0!important;\n  box-sizing:border-box!important;\n  width:100%!important;\n  max-width:100%!important;\n  height:100vh!important;\n  height:100dvh!important;\n  min-height:0!important;\n  margin:0!important;\n  padding-top:calc(12px + env(safe-area-inset-top, 0px))!important;\n  padding-bottom:calc(12px + env(safe-area-inset-bottom, 0px))!important;\n  padding-left:max(12px,env(safe-area-inset-left, 0px))!important;\n  padding-right:max(12px,env(safe-area-inset-right, 0px))!important;\n  flex-flow:column nowrap!important;\n  align-items:center!important;\n  justify-content:center!important;\n  overflow-x:hidden!important;\n  overflow-y:auto!important;\n  overscroll-behavior:contain;\n}\n@supports (justify-content:safe center) {\n  #zawiPrivateGate.zavi66-approved-login {\n    justify-content:safe center!important;\n  }\n}\n#zawiPrivateGate.zavi66-approved-login > .zawi-auth-card {\n  position:relative!important;\n  left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;\n  box-sizing:border-box!important;\n  flex:0 1 auto!important;\n  align-self:center!important;\n  width:100%!important;\n  max-width:390px!important;\n  min-width:0!important;\n  max-height:calc(100vh - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))!important;\n  max-height:calc(100dvh - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))!important;\n  margin:0 auto!important;\n  padding:19px 21px 16px!important;\n  transform:none!important;\n  overflow-x:hidden!important;\n  overflow-y:auto!important;\n  overflow-wrap:anywhere;\n}\n#zawiPrivateGate.zavi66-approved-login > .zawi-auth-card *,\n#zawiPrivateGate.zavi66-approved-login > .zawi-auth-card *::before,\n#zawiPrivateGate.zavi66-approved-login > .zawi-auth-card *::after {\n  box-sizing:border-box;\n}\n#zawiPrivateGate.zavi66-approved-login :is(#zawiPinForm,.zawi-pin-field,.zavi-auth-language) {\n  min-width:0!important;\n  max-width:100%!important;\n}\n#zawiPrivateGate.zavi66-approved-login #zawiPinForm{\n  width:100%!important;\n}\n@media (max-width:380px) {\n  #zawiPrivateGate.zavi66-approved-login > .zawi-auth-card {\n    width:100%!important;\n    padding:14px 15px!important;\n  }\n}\n@media (max-height:590px) {\n  #zawiPrivateGate.zavi66-approved-login {\n    padding-top:calc(6px + env(safe-area-inset-top, 0px))!important;\n    padding-bottom:calc(6px + env(safe-area-inset-bottom, 0px))!important;\n  }\n  #zawiPrivateGate.zavi66-approved-login > .zawi-auth-card {\n    max-height:calc(100dvh - 12px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))!important;\n    padding-top:11px!important;\n    padding-bottom:11px!important;\n  }\n}\n\n/* Owner-approved 66.62 neon login. Scoped to the native private PIN gate. */\n#zawiPrivateGate.zavi66-approved-login{\n --z66-text:#f7fbff;--z66-muted:#cfdbf8;--z66-edge:#639ae0;\n --z66-field:#17386f;--z66-card:#152c62;--z66-bg:#061638;\n isolation:isolate!important;\n background:radial-gradient(ellipse 100% 68% at 87% 22%,#113b85 0%,transparent 66%),\n  radial-gradient(ellipse 80% 55% at 5% 92%,#352c83 0%,transparent 69%),\n  linear-gradient(165deg,#071734,#07113a 62%,#0b1d53)!important;\n}\n#zawiPrivateGate.zavi66-approved-login::before{\n display:block!important;content:\"\";position:fixed;inset:auto -15% 3% -15%;\n width:auto;height:25%;border-radius:50%;\n background:linear-gradient(110deg,transparent 4%,#089ee369 30%,#8c50ff62 56%,transparent 86%);\n filter:blur(24px);opacity:.8;pointer-events:none;z-index:-1;\n animation:z66-auth-ambient 12s ease-in-out infinite alternate;\n}\n#zawiPrivateGate.zavi66-approved-login .zawi-auth-card{\n position:relative!important;isolation:isolate!important;\n border-radius:24px!important;border:1px solid #6bd6f3ac!important;\n box-shadow:0 0 0 1px #6494eb44 inset,0 18px 65px #0008,0 0 36px #138dff24!important;\n color:var(--z66-text)!important;\n background-color:var(--z66-card)!important;\n background-image:linear-gradient(151deg,#224fa3 0%,#152f70 45%,#0c2057 100%)!important;\n animation:z66-auth-card-in .52s cubic-bezier(.19,1,.22,1) both!important;\n}\n#zawiPrivateGate.zavi66-approved-login .zawi-auth-card::before{\n content:\"\";position:absolute;inset:0 0 auto;height:3px;pointer-events:none;\n border-radius:24px 24px 0 0;z-index:0;\n background:linear-gradient(90deg,#725aff,#3ee8f4,#538fff,#725aff);\n background-size:220% 100%;animation:z66-auth-line 9s linear infinite;\n}\n#zawiPrivateGate.zavi66-approved-login .zawi-auth-card::after{\n content:\"\";position:absolute;inset:auto 0 0;height:56px;pointer-events:none;z-index:0;\n background:radial-gradient(ellipse 75% 90% at 38% 120%,#0bcbf150,transparent 78%),\n            radial-gradient(ellipse 64% 80% at 94% 130%,#8352ff55,transparent 76%);\n border-radius:0 0 24px 24px;\n}\n#zawiPrivateGate.zavi66-approved-login .zawi-auth-card > *{\n position:relative;z-index:1;\n}\n#zawiPrivateGate.zavi66-approved-login .zawi-lock-emblem{\n width:68px!important;height:68px!important;margin:5px auto 3px!important;\n overflow:visible!important;border-radius:21px!important;\n border:2px solid #77e9ff!important;\n background:linear-gradient(125deg,#1664c9,#0de3ed)!important;\n box-shadow:0 0 23px #29c9ff91,0 0 40px #7162ed55!important;\n animation:z66-auth-glow 5s ease-in-out infinite!important;\n}\n#zawiPrivateGate.zavi66-approved-login .zawi-lock-emblem img{\n border-radius:19px!important;object-fit:cover!important;\n}\n#zawiPrivateGate.zavi66-approved-login .z66neon-brand{\n text-align:center;color:#fff;font:900 20px/1.35 system-ui,Arial,sans-serif;\n letter-spacing:.025em;text-shadow:0 1px 12px #00d8ff55;\n margin:4px 0 1px;\n}\n#zawiPrivateGate.zavi66-approved-login .z66neon-brand strong{\n color:#5ae5fd;font-weight:900;\n}\n#zawiPrivateGate.zavi66-approved-login .zavi-auth-language{\n justify-content:flex-start!important;gap:7px!important;margin-bottom:9px!important;\n color:#e6f5ff!important;flex-wrap:nowrap!important;min-height:39px;\n}\n#zawiPrivateGate.zavi66-approved-login .zavi-auth-language label{\n color:#e3f1ff!important;font-size:11px!important;white-space:nowrap!important;\n}\n#zawiPrivateGate.zavi66-approved-login #zaviGateLanguage{\n min-width:0!important;max-width:116px!important;flex:0 1 115px!important;\n color:#fff!important;background:#153768!important;border:1px solid #6999dc!important;\n}\n#zawiPrivateGate.zavi66-approved-login .z66neon-themes{\n display:flex;gap:5px;margin-inline-start:auto;\n}\n#zawiPrivateGate.zavi66-approved-login .z66neon-theme{\n display:grid!important;place-items:center!important;\n width:37px!important;height:38px!important;min-height:38px!important;\n min-width:37px!important;padding:0!important;border:1px solid #689ad7!important;\n border-radius:11px!important;background:#142d64!important;\n font-size:18px!important;line-height:1!important;color:#f2f8ff!important;\n box-shadow:none!important;cursor:pointer;\n}\n#zawiPrivateGate.zavi66-approved-login .z66neon-theme[aria-pressed=\"true\"]{\n border-color:#6deafa!important;box-shadow:0 0 0 2px #1bd4ff55 inset,0 0 11px #00c5e444!important;\n}\n#zawiPrivateGate.zavi66-approved-login .zavi-gate-eyebrow{\n color:#d7e5ff!important;margin:2px 0 7px!important;font-size:11px!important;\n}\n#zawiPrivateGate.zavi66-approved-login #zawiGateTitle{\n margin:10px 0 4px!important;font-size:clamp(17px,5vw,22px)!important;\n color:#fff!important;text-shadow:0 2px 13px #08175185!important;\n}\n#zawiPrivateGate.zavi66-approved-login #zawiGateHelp{\n color:#d9e7fc!important;margin-bottom:13px!important;font-size:12px!important;\n}\n#zawiPrivateGate.zavi66-approved-login .zawi-pin-field label{\n color:#e7f4ff!important;\n}\n#zawiPrivateGate.zavi66-approved-login :is(#zawiPinOne,#zawiPinRepeat){\n background:#132d67!important;color:#fff!important;\n border-color:#709ae3!important;box-shadow:0 2px 12px #09275942 inset!important;\n}\n#zawiPrivateGate.zavi66-approved-login #zavi66PinHint{\n color:#cfe0f5!important;\n}\n#zawiPrivateGate.zavi66-approved-login [data-zds-password-toggle=\"zawiPinOne\"]{\n color:#b0eaff!important;\n}\n#zawiPrivateGate.zavi66-approved-login #zawiPinSubmit{\n min-height:49px!important;color:#fff!important;\n background:linear-gradient(100deg,#1763fb 0%,#05d5de 100%)!important;\n box-shadow:0 6px 18px #03a6ee3b!important;\n transition:box-shadow .2s ease,transform .2s ease!important;\n}\n#zawiPrivateGate.zavi66-approved-login #zawiPinSubmit:active{\n transform:scale(.985)!important;\n}\n#zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn{\n color:#91f4ff!important;font-size:12px!important;\n}\n#zawiPrivateGate.zavi66-approved-login #zawiPinError{color:#ffb6c7!important}\nhtml[data-zavi-theme=\"light\"] #zawiPrivateGate.zavi66-approved-login,\nhtml[data-zavi-appearance=\"light\"] #zawiPrivateGate.zavi66-approved-login{\n --z66-text:#173656;--z66-muted:#496786;--z66-edge:#86b2e6;--z66-field:#fff;\n --z66-card:#f2f8ff;--z66-bg:#e7f1ff;\n background:radial-gradient(ellipse at 80% 20%,#ccedff,transparent 67%),\n linear-gradient(150deg,#eef7ff,#dbe9ff)!important;\n}\nhtml[data-zavi-theme=\"light\"] #zawiPrivateGate.zavi66-approved-login .zawi-auth-card,\nhtml[data-zavi-appearance=\"light\"] #zawiPrivateGate.zavi66-approved-login .zawi-auth-card{\n background-image:linear-gradient(150deg,#f9fcff,#e2f0ff)!important;\n border-color:#60a8e3!important;\n}\nhtml[data-zavi-theme=\"light\"] #zawiPrivateGate.zavi66-approved-login :is(#zawiGateTitle,.z66neon-brand),\nhtml[data-zavi-appearance=\"light\"] #zawiPrivateGate.zavi66-approved-login :is(#zawiGateTitle,.z66neon-brand){\n color:#123a68!important;text-shadow:none!important;\n}\nhtml[data-zavi-theme=\"light\"] #zawiPrivateGate.zavi66-approved-login :is(.zavi-gate-eyebrow,#zawiGateHelp,.zawi-pin-field label,#zavi66PinHint,.zavi-auth-language label),\nhtml[data-zavi-appearance=\"light\"] #zawiPrivateGate.zavi66-approved-login :is(.zavi-gate-eyebrow,#zawiGateHelp,.zawi-pin-field label,#zavi66PinHint,.zavi-auth-language label){\n color:#365a80!important;\n}\nhtml[data-zavi-theme=\"light\"] #zawiPrivateGate.zavi66-approved-login :is(#zawiPinOne,#zawiPinRepeat,#zaviGateLanguage,.z66neon-theme),\nhtml[data-zavi-appearance=\"light\"] #zawiPrivateGate.zavi66-approved-login :is(#zawiPinOne,#zawiPinRepeat,#zaviGateLanguage,.z66neon-theme){\n background:#fff!important;color:#193f69!important;border-color:#9bc2e9!important;\n}\nhtml[data-zavi-theme=\"light\"] #zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn,\nhtml[data-zavi-appearance=\"light\"] #zawiPrivateGate.zavi66-approved-login #zawiForgotPinBtn{\n color:#086c9b!important;\n}\nhtml[data-zavi-theme=\"light\"] #zawiPrivateGate.zavi66-approved-login .z66neon-brand strong,\nhtml[data-zavi-appearance=\"light\"] #zawiPrivateGate.zavi66-approved-login .z66neon-brand strong{\n color:#057cbb!important;\n}\n@keyframes z66-auth-ambient{from{transform:translateX(-7%)}to{transform:translateX(7%)}}\n@keyframes z66-auth-glow{0%,100%{box-shadow:0 0 12px #29c9ff86,0 0 26px #7162ed40}\n 50%{box-shadow:0 0 25px #29c9ffc9,0 0 42px #7162ed7d}}\n@keyframes z66-auth-card-in{from{opacity:0;transform:translateY(12px) scale(.975)}\n to{opacity:1;transform:translateY(0) scale(1)}}\n@keyframes z66-auth-line{to{background-position:220% 0}}\nhtml[data-z637-no-motion=\"true\"] #zawiPrivateGate.zavi66-approved-login *,\nhtml.zx-lite #zawiPrivateGate.zavi66-approved-login *,\nhtml[data-z637-no-motion=\"true\"] #zawiPrivateGate.zavi66-approved-login::before,\nhtml.zx-lite #zawiPrivateGate.zavi66-approved-login::before{\n animation:none!important;transition:none!important;\n}\n@media(prefers-reduced-motion:reduce){\n #zawiPrivateGate.zavi66-approved-login *,\n #zawiPrivateGate.zavi66-approved-login::before{\n animation:none!important;transition:none!important}\n}\n@media(max-width:380px){\n #zawiPrivateGate.zavi66-approved-login .zawi-auth-card{padding:14px 15px!important}\n #zawiPrivateGate.zavi66-approved-login .z66neon-theme{\n width:32px!important;min-width:32px!important;height:36px!important;min-height:36px!important;\n }\n #zawiPrivateGate.zavi66-approved-login .zavi-auth-language{gap:4px!important}\n #zawiPrivateGate.zavi66-approved-login #zaviGateLanguage{max-width:99px!important}\n}\n";

const LABELS={
 'fa-AF':{show:'نمایش رمز',hide:'پنهان‌کردن رمز'},
 'ps-AF':{show:'پټنوم ښکاره کړئ',hide:'پټنوم پټ کړئ'},
 en:{show:'Show password',hide:'Hide password'}
};
function labels(){
 const l=(document.documentElement.lang||'fa-AF').toLowerCase();
 return l.startsWith('ps')?LABELS['ps-AF']:l.startsWith('en')?LABELS.en:LABELS['fa-AF'];
}

const COPY={
 'fa-AF':{
  title:'ورود به ZAVI ONE',tag:'حسابداری امن و آسان',
  help:'رمز خصوصی خود را وارد کنید.',newHelp:'یک رمز خصوصی ۶ تا ۱۲ رقمی بسازید.',
  pin:'رمز ورود',newPin:'رمز جدید',repeat:'تکرار رمز جدید',
  open:'بازکردن سیستم',create:'ایجاد رمز و ورود',forgot:'رمز را فراموش کرده‌اید؟',
  language:'زبان',hint:'۶ تا ۱۲ رقم',newHint:'۶ تا ۱۲ رقم؛ سپس رمز را تکرار کنید.'
 },
 'ps-AF':{
  title:'ZAVI ONE ته ننوتل',tag:'خوندي او اسانه حسابداري',
  help:'خپل شخصي رمز دننه کړئ.',newHelp:'له ۶ تر ۱۲ شمېرو نوی شخصي رمز جوړ کړئ.',
  pin:'د ننوتلو رمز',newPin:'نوی رمز',repeat:'نوی رمز بیا ولیکئ',
  open:'سیستم پرانیستل',create:'رمز جوړول او ننوتل',forgot:'رمز مو هېر شوی؟',
  language:'ژبه',hint:'۶ تر ۱۲ شمېرې',newHint:'۶ تر ۱۲ شمېرې؛ بیا یې تکرار کړئ.'
 },
 en:{
  title:'Sign in to ZAVI ONE',tag:'Secure and simple accounting',
  help:'Enter your private PIN.',newHelp:'Create a private PIN with 6 to 12 digits.',
  pin:'Private PIN',newPin:'New PIN',repeat:'Confirm new PIN',
  open:'Open accounting',create:'Create PIN and enter',forgot:'Forgot your PIN?',
  language:'Language',hint:'6–12 digits',newHint:'6–12 digits, then confirm your PIN.'
 }
};
function getLanguage(){
 const s=String(document.documentElement.lang||'fa-AF').toLowerCase();
 return s.startsWith('en')?'en':s.startsWith('ps')?'ps-AF':'fa-AF';
}
function setText(el,value){
 if(el&&el.textContent!==value)el.textContent=value;
}
function renderApprovedLogin(){
 const gate=document.getElementById('zawiPrivateGate');
 if(!gate||!gate.classList.contains('zavi66-approved-login'))return;
 const dict=COPY[getLanguage()];
 const setup=!!document.getElementById('zawiPinRepeat')?.required;
 setText(document.getElementById('zawiGateTitle'),dict.title);
 setText(gate.querySelector('.zavi-gate-eyebrow'),dict.tag);
 setText(document.getElementById('zawiGateHelp'),setup?dict.newHelp:dict.help);
 setText(document.getElementById('zawiPinLabel'),setup?dict.newPin:dict.pin);
 setText(gate.querySelector('#zawiPinRepeatRow label'),dict.repeat);
 setText(document.getElementById('zawiPinSubmit'),setup?dict.create:dict.open);
 setText(document.getElementById('zawiForgotPinBtn'),dict.forgot);
 setText(gate.querySelector('[data-zavi-lang-label]'),dict.language);
 setText(document.getElementById('zavi66PinHint'),setup?dict.newHint:dict.hint);
 const picker=document.getElementById('zaviGateLanguage');
 if(picker&&picker.value!==getLanguage())picker.value=getLanguage();
 gate.dir=getLanguage()==='en'?'ltr':'rtl';
}
function setupApprovedLogin(){
 const gate=document.getElementById('zawiPrivateGate');
 const card=gate?.querySelector('.zawi-auth-card');
 const row=gate?.querySelector('.zawi-pin-field');
 if(!card||!row||gate.classList.contains('zavi66-approved-login'))return;
 gate.classList.add('zavi66-approved-login');
 // Preserve a solid theme-aware card even when old legacy gradient CSS is !important.
 // Only this entry card is touched; all other original V66.62 cards stay unchanged.
 card.style.setProperty('background-color','var(--z66-card)','important');
 // Gradient skin is set by scoped CSS; original card's authentication is unchanged.
 card.style.removeProperty('background-image');
 const style=document.createElement('style');
 style.id='zavi66ApprovedLoginCss';
 style.textContent=LOGIN_CSS;
 document.head.append(style);
 const picker=gate.querySelector('.zavi-auth-language');
 if(picker&&picker!==card.firstElementChild)card.insertBefore(picker,card.firstElementChild);
 // Preserve native PIN and recovery actions; new controls affect appearance only.
 const emblem=card.querySelector('.zawi-lock-emblem');
 if(emblem&&!card.querySelector('.z66neon-brand')){
  const brand=document.createElement('div');
  brand.className='z66neon-brand';
  brand.setAttribute('aria-label','ZAVI ONE');
  brand.innerHTML='ZAVI <strong>ONE</strong>';
  emblem.after(brand);
 }
 if(picker&&!picker.querySelector('.z66neon-themes')){
  const controls=document.createElement('div');controls.className='z66neon-themes';
  for(const [theme,glyph] of [['dark','☾'],['light','☀']]){
    const b=document.createElement('button');b.type='button';
    b.className='z66neon-theme';b.dataset.z66Theme=theme;b.textContent=glyph;
    controls.append(b);
  }
  picker.append(controls);
  picker.addEventListener('click',event=>{
   const b=event.target.closest('button[data-z66-theme]');
   if(!b)return;
   event.preventDefault();event.stopPropagation();
   window.ZaviThemeV29?.set(b.dataset.z66Theme);
   updateThemeControls();
  });
 }
 function updateThemeControls(){
  const active=document.documentElement.dataset.zaviTheme||
    document.documentElement.dataset.zaviAppearance||'dark';
  const locale=getLanguage();
  const texts=locale==='en'?{dark:'Dark mode',light:'Light mode'}:
    locale==='ps-AF'?{dark:'تیاره حالت',light:'روښانه حالت'}:
    {dark:'حالت تاریک',light:'حالت روشن'};
  gate.querySelectorAll('.z66neon-theme').forEach(b=>{
    b.setAttribute('aria-label',texts[b.dataset.z66Theme]);
    b.title=texts[b.dataset.z66Theme];
    b.setAttribute('aria-pressed',String(active===b.dataset.z66Theme));
  });
 }
 new MutationObserver(updateThemeControls).observe(document.documentElement,{
  attributes:true,attributeFilter:['data-zavi-theme','data-zavi-appearance','lang']});
 updateThemeControls();
 const hint=document.createElement('small');
 hint.id='zavi66PinHint';row.append(hint);
 let queued=false;
 const schedule=()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;renderApprovedLogin()});
 };
 gate.addEventListener('change',e=>{
  if(e.target.id!=='zaviGateLanguage')return;
  const value=e.target.value;
  if(!['fa-AF','ps-AF','en'].includes(value))return;
  if(window.ZaviLocaleV22?.set)window.ZaviLocaleV22.set(value);
  else if(window.zaviPublicSetLang)window.zaviPublicSetLang(value);
  else{
   document.documentElement.lang=value;
   document.documentElement.dir=value==='en'?'ltr':'rtl';
  }
  schedule();
 });
 document.addEventListener('zavi:language-change',schedule);
 document.addEventListener('zavi:language-changed',schedule);
 document.addEventListener('zavi-v24-pin-reset-success',schedule);
 // Native locale updates its text before the next animation frame; align RTL/LTR
 // in the same mutation microtask so password and language never disagree.
 new MutationObserver(()=>{renderApprovedLogin();updateThemeControls()}).observe(document.documentElement,{
  attributes:true,attributeFilter:['lang','dir','class']});
 const monitored=['zawiGateHelp','zawiPinLabel','zawiPinSubmit','zawiForgotPinBtn'];
 const watcher=new MutationObserver(schedule);
 for(const id of monitored){
  const node=document.getElementById(id);
  if(node)watcher.observe(node,{childList:true,characterData:true,subtree:true});
 }
 renderApprovedLogin();
}

function init(){
 setupApprovedLogin();
 const field=document.getElementById(INPUT);
 const parent=field?.closest('.zawi-pin-field');
 if(!parent||parent.querySelector('[data-zds-password-toggle]'))return;
 const button=document.createElement('button');
 button.type='button';
 button.dataset.zdsPasswordToggle=INPUT;
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path class="zavi66-eye-slash" d="M3 3l18 18"/></svg>';
 button.setAttribute('aria-controls',INPUT);
 button.setAttribute('aria-pressed','false');
 button.title=labels().show;
 // Only the input row changes; no legacy theme colors or card sizes modified.
 parent.style.position='relative';
 button.style.cssText='position:absolute;inset-inline-end:7px;bottom:5px;width:40px;height:40px;min-height:40px;border:0;border-radius:10px;background:transparent;color:inherit;font:600 18px system-ui;cursor:pointer;z-index:2';
 field.style.paddingInlineEnd='50px';
 function update(){
  const visible=field.type==='text';
  button.setAttribute('aria-pressed',String(visible));
  button.classList.toggle('zavi66-revealed',visible);
  const words=labels();
  const label=visible?words.hide:words.show;
  button.setAttribute('aria-label',label);
  button.title=label;
 }
 button.addEventListener('click',event=>{
  // Historic V66.62 has a document-wide click delegate; don't let it
  // interpret this eye toggle as a second form/security action.
  event.preventDefault();event.stopPropagation();
  field.type=field.type==='password'?'text':'password';
  update();
 });
 parent.append(button);
 document.addEventListener('zavi:language-change',update);
 document.addEventListener('zavi:language-changed',update);
 const observer=new MutationObserver(update);
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();

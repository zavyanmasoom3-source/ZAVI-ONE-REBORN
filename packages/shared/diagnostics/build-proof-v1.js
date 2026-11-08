/* ZAVI ONE REBORN / shared build proof. Does not read or change business data. */
(() => {
 'use strict';
 const NAME = 'zavi-build-proof-v1';
 if (window.ZaviBuildProof) return;
 const safe = value => String(value ?? '').replace(/[^a-zA-Z0-9._:-]/g, '').slice(0,96);
 let snapshot = null;
 window.ZaviBuildProof = Object.freeze({get:()=>snapshot});
 async function boot() {
  try {
   const url = new URL('./zavi-build-info.json', document.baseURI);
   const result = await fetch(url.href,{cache:'no-store',credentials:'same-origin'});
   if(!result.ok) return;
   const data = await result.json();
   if(!data || !['one','admin'].includes(data.app)) return;
   snapshot = Object.freeze({
    app:safe(data.app),commit:safe(data.commit),run:safe(data.run),
    version:safe(data.version),package:safe(data.package),kind:safe(data.kind),signing:safe(data.signing||'unknown')
   });
   document.documentElement.dataset.zaviVerifiedBuild=snapshot.commit.slice(0,12);
   // Mark QA installs unmistakably. Never change installed production identities.
   if(snapshot.kind !== 'debug-qa') return;
   const buildLabel = 'REBORN QA '+snapshot.run+' · '+snapshot.commit.slice(0,8);
   const chip = document.createElement('button');
   chip.id='zavi-build-proof-chip';
   chip.type='button';chip.textContent=buildLabel;
   chip.title=snapshot.signing==='ephemeral'?'Independent QA install; tap to view update compatibility.':'Show source commit, APK version and package';
   chip.setAttribute('aria-label','ZAVI REBORN build details: '+buildLabel);
   chip.style.cssText='position:fixed;left:8px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:2147483000;max-width:180px;min-height:22px;padding:3px 7px;border:1px solid #94b2ca;border-radius:7px;background:#f5fbff;color:#16374e;font:10px/1.3 system-ui,sans-serif;box-shadow:0 1px 3px #0002;direction:ltr;opacity:.9';
   chip.addEventListener('click',()=>{
    const details=['ZAVI ONE REBORN — QA (not release)',
     'App: '+snapshot.app,'Version: '+snapshot.version,
     'Package: '+snapshot.package,'Commit: '+snapshot.commit,'Signing: '+snapshot.signing+(snapshot.signing==='ephemeral'?' (different certificate on each CI build)':'')].join('\n');
    window.alert(details);
   });
   document.body.appendChild(chip);
  } catch (err) {
   console.warn('ZAVI build provenance unavailable:',err?.message||err);
  }
 }
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
})();

/* ZAVI ONE V65.13 — always-on entry intro and motion-safe graphic polish. */
(()=>{
  const root=document.documentElement;
  let activeSplash=null;

  function detectLowGpu(){
    try{
      const dm=Number(navigator.deviceMemory||0);
      const hc=Number(navigator.hardwareConcurrency||0);
      const mobile=window.matchMedia('(max-width: 900px)').matches;
      const low=Boolean((dm && dm<=4) || (hc && hc<=4) || mobile);
      root.setAttribute('data-z6513-low-gpu', low ? 'true' : 'false');
      root.setAttribute('data-z6512-low-gpu', low ? 'true' : 'false');
    }catch(_){
      root.setAttribute('data-z6513-low-gpu','true');
      root.setAttribute('data-z6512-low-gpu','true');
    }
  }

  function buildSplash(){
    const wrap=document.createElement('div');
    wrap.className='z6512-splash z6513-splash';
    wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML=''
      + '<div class="z6512-splash-card z6513-splash-card">'
      + '  <div class="z6512-splash-mark z6513-splash-mark z6515-original-logo"><img src="./zavi-one-original-logo.png" alt="ZAVI ONE" width="72" height="72" decoding="async"></div>'
      + '  <div class="z6512-splash-title z6513-splash-title" aria-label="ZAVI ONE">'
      + '    <span>Z</span><span>A</span><span>V</span><span>I</span><span>&nbsp;</span><span>O</span><span>N</span><span>E</span>'
      + '  </div>'
      + '  <div class="z6512-splash-sub">SECURE ACCOUNTING</div>'
      + '  <div class="z6512-splash-line"><i></i></div>'
      + '  <div class="z6512-splash-note">حسابداری سریع، نرم و حرفه‌ای</div>'
      + '</div>';
    return wrap;
  }

  function removeSplash(splash){
    if(!splash) return;
    splash.classList.add('is-done');
    window.setTimeout(()=>{
      if(splash===activeSplash) activeSplash=null;
      splash.remove();
    },520);
  }

  function showIntro(reason='enter'){
    if(root.classList.contains('zawi-locked')) return;
    if(activeSplash) activeSplash.remove();
    const splash=buildSplash();
    splash.dataset.reason=reason;
    activeSplash=splash;
    document.body.appendChild(splash);
    requestAnimationFrame(()=>{
      splash.classList.add('is-live');
      window.setTimeout(()=>removeSplash(splash), 1280);
    });
  }

  function watchLockTransitions(){
    let previousLocked=root.classList.contains('zawi-locked');
    const observer=new MutationObserver(()=>{
      const locked=root.classList.contains('zawi-locked');
      if(previousLocked && !locked){ window.setTimeout(()=>showIntro('unlock'),130); }
      previousLocked=locked;
    });
    observer.observe(root,{attributes:true,attributeFilter:['class']});
  }

  function stagePageMotion(){
    root.classList.add('z6513-page-ready');
    requestAnimationFrame(()=>root.classList.add('z6513-animate-in'));
  }

  detectLowGpu();
  window.addEventListener('resize',detectLowGpu,{passive:true});
  document.addEventListener('DOMContentLoaded',()=>{
    detectLowGpu();
    watchLockTransitions();
    stagePageMotion();
    if(!root.classList.contains('zawi-locked')) window.setTimeout(()=>showIntro('load'),120);
  },{once:true});
})();

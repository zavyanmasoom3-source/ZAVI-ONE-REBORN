/* ZAVI ONE V65.14: safer mobile drawer scroll reset, without touching business data. */
(()=>{
  const init=()=>{
    const side=document.getElementById('side');
    if(!side)return;
    const reset=()=>{
      if(side.classList.contains('mobile-drawer')){
        // Set the single correct scrolling surface, avoiding stale nested scroll.
        side.scrollTop=0;
        const old=side.querySelector(':scope > .zavi-v6-menu-scroll');
        if(old)old.scrollTop=0;
      }
    };
    let wasOpen=side.classList.contains('mobile-drawer');
    new MutationObserver(()=>{
      const open=side.classList.contains('mobile-drawer');
      if(open&&!wasOpen)reset();
      wasOpen=open;
    }).observe(side,{attributes:true,attributeFilter:['class']});
    // The existing "More" button and backdrop handlers remain authoritative.
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&side.classList.contains('mobile-drawer')){
        document.getElementById('drawerShade')?.click();
      }
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

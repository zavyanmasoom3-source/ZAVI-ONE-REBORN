/* ZAVI cinematic visual-mode safety: no business data, event handlers, or routes touched. */
(function(){
  "use strict";
  var root=document.documentElement;
  function tune(){
    try{
      var deviceCores=Number(navigator.hardwareConcurrency||4);
      var deviceMem=Number(navigator.deviceMemory||4);
      var reduced=Boolean(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      var legacyOff=root.dataset.zaviMotion==="off"||root.classList.contains("reduce-motion")||
        document.body&&document.body.classList.contains("reduce-motion");
      root.classList.toggle("zx-lite",Boolean(reduced||legacyOff||deviceCores<=2||deviceMem<=2));
    }catch(_){root.classList.add("zx-lite");}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",tune,{once:true});
  else tune();
  if(window.matchMedia){
    var media=window.matchMedia("(prefers-reduced-motion: reduce)");
    if(media.addEventListener)media.addEventListener("change",tune);
  }
})();
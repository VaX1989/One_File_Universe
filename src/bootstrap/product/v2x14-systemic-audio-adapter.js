(function(root){
'use strict';
const O=root.OFU=root.OFU||{};if(typeof document==='undefined')return;
const VERSION='ofu-v2x14-systemic-audio-adapter-1';let controller=null,mounted=null,timer=null;
async function boot(){
 try{
  if(O.v1LivingProduct?.ready)await O.v1LivingProduct.ready();
  if(!controller&&O.v2x14LivingAudioController)controller=O.v2x14LivingAudioController.create({product:O.v1LivingProduct});
  const host=document.querySelector('[data-workspace-panel="lab"]')||document.getElementById('living-panel');
  if(controller&&!mounted&&host&&O.systemicAudioControlsV1){
   const wrap=document.createElement('section');wrap.setAttribute('data-v2x14-audio','presentation-only');
   const h=document.createElement('h3');h.textContent='Systemic audio';wrap.appendChild(h);host.appendChild(wrap);
   const bridge={setControls:value=>value?.enabled?controller.activate(value):controller.setControls(value)};
   mounted=O.systemicAudioControlsV1.mount(wrap,bridge,{document,initial:{enabled:false,volume:0.5,muted:false,reducedSensory:false}});
   timer=root.setInterval?root.setInterval(()=>controller.sync().catch(()=>{}),500):null;
  }
 }catch(error){console.warn('V2X14 audio adapter unavailable:',error?.message||error);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
O.v2x14SystemicAudioAdapter=Object.freeze({VERSION,boot,snapshot:()=>controller?.snapshot?.()||null,dispose:async()=>{if(timer!==null&&root.clearInterval)root.clearInterval(timer);mounted?.dispose?.();return controller?.dispose?.();}});
})(globalThis);

(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x14-living-audio-controller-2',AUTHORITY='PRESENTATION_ONLY';
function create(options={}){
 const product=options.product||O.v1LivingProduct,map=options.map||O.v2x14LivingAudioContext,audio=options.audio||O.systemicAudioV1;
 if(!product||!map||!audio)throw new Error('V2X14 Living audio dependencies unavailable');
 const runtime=audio.createRuntime(options.runtimeOptions||{});let controls={enabled:false,muted:false,volume:0.5,reducedSensory:false},activated=false;
 async function sync(){const s=product.runtime?.snapshot?.()||{};return runtime.update(map.fromLiving(s),controls);}
 async function activate(next={}){controls={...controls,...next,enabled:true};activated=true;await sync();return runtime.resume();}
 async function setControls(next={}){controls={...controls,...next};await sync();if(!controls.enabled||controls.muted)return runtime.suspend();return activated?runtime.resume():runtime.snapshot();}
 return Object.freeze({authority:AUTHORITY,activate,setControls,sync,snapshot(){return Object.freeze({schema:'ofu-v2x14-audio-controller-snapshot-2',version:VERSION,authority:AUTHORITY,activated,controls:Object.freeze({...controls}),runtime:runtime.snapshot(),createsWorldFacts:false,navigationDependency:false,accessibilityDependency:false,userActivationRequired:true});},dispose:()=>runtime.dispose()});
}
let mounted=null,attempts=0;
async function autoMount(){
 if(mounted||typeof root.document==='undefined')return mounted;
 const product=O.v1LivingProduct,controlsApi=O.systemicAudioControlsV1;if(!product||!O.v2x14LivingAudioContext||!O.systemicAudioV1||!controlsApi){if(++attempts<120&&root.setTimeout)root.setTimeout(autoMount,50);return null;}
 const host=root.document.querySelector('[data-workspace-panel="lab"]')||root.document.getElementById('living-panel');if(!host){if(++attempts<120&&root.setTimeout)root.setTimeout(autoMount,50);return null;}
 const controller=create({product});const section=root.document.createElement('section');section.setAttribute('data-v2x14-audio','presentation-only');section.setAttribute('aria-label','Optional systemic audio');const h=root.document.createElement('h3');h.textContent='Systemic audio';const note=root.document.createElement('p');note.textContent='Optional presentation-only audio. It never indicates facts that are absent from the current modeled context.';section.append(h,note);host.appendChild(section);
 const bridge={setControls(value){return value?.enabled?controller.activate(value):controller.setControls(value);}};const controls=controlsApi.mount(section,bridge,{document:root.document,initial:{enabled:false,volume:0.5,muted:false,reducedSensory:false}});let timer=root.setInterval?root.setInterval(()=>controller.sync().catch(()=>{}),600):null;
 mounted=Object.freeze({controller,controls,section,snapshot:()=>controller.snapshot(),dispose:async()=>{if(timer!==null&&root.clearInterval)root.clearInterval(timer);controls.dispose();if(section.parentNode)section.parentNode.removeChild(section);return controller.dispose();}});root.__OFU_V2X14_AUDIO__=mounted;return mounted;
}
O.v2x14LivingAudioController=Object.freeze({VERSION,AUTHORITY,create,autoMount,instance:()=>mounted});
if(typeof root.document!=='undefined'){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',autoMount,{once:true});else if(root.setTimeout)root.setTimeout(autoMount,0);}
})(globalThis);

(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x14-living-audio-controller-1',AUTHORITY='PRESENTATION_ONLY';
function create(options={}){
 const product=options.product||O.v1LivingProduct,map=options.map||O.v2x14LivingAudioContext,audio=options.audio||O.systemicAudioV1;
 if(!product||!map||!audio)throw new Error('V2X14 Living audio dependencies unavailable');
 const runtime=audio.createRuntime(options.runtimeOptions||{});let controls={enabled:false,muted:false,volume:0.5,reducedSensory:false},activated=false;
 async function sync(){const s=product.runtime?.snapshot?.()||product.snapshot?.()||{};return runtime.update(map.fromLiving(s),controls);}
 async function activate(next={}){controls={...controls,...next,enabled:true};activated=true;await sync();return runtime.resume();}
 async function setControls(next={}){controls={...controls,...next};await sync();if(!controls.enabled||controls.muted)return runtime.suspend();return activated?runtime.resume():runtime.snapshot();}
 return Object.freeze({authority:AUTHORITY,activate,setControls,sync,snapshot(){return Object.freeze({schema:'ofu-v2x14-audio-controller-snapshot-1',version:VERSION,authority:AUTHORITY,activated,controls:{...controls},runtime:runtime.snapshot(),createsWorldFacts:false,navigationDependency:false});},dispose:()=>runtime.dispose()});
}
O.v2x14LivingAudioController=Object.freeze({VERSION,AUTHORITY,create});
})(globalThis);

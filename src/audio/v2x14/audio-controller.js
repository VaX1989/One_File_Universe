(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x14-living-audio-controller-6',AUTHORITY='PRESENTATION_ONLY';
const POLL_INTERVAL_MS=600;
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(Number(v))?Number(v):0));
function normalized(base,next={}){return Object.freeze({enabled:next.enabled===undefined?base.enabled:next.enabled===true,muted:next.muted===undefined?base.muted:next.muted===true,volume:next.volume===undefined?base.volume:clamp(next.volume),reducedSensory:next.reducedSensory===undefined?base.reducedSensory:next.reducedSensory===true});}
const same=(a,b)=>a.enabled===b.enabled&&a.muted===b.muted&&a.volume===b.volume&&a.reducedSensory===b.reducedSensory;
function statusMessage(state={}){
 const runtime=state.runtime||{},controls=state.controls||{};
 if(state.disposed)return 'Systemic audio stopped.';
 if(!state.activated||controls.enabled!==true)return 'Systemic audio is off. Enable audio to start optional presentation cues.';
 if(runtime.state==='unsupported')return 'Systemic audio is unavailable in this browser. Exploration remains fully usable without audio.';
 if(state.visibilitySuspended)return 'Systemic audio is paused while this page is not visible.';
 if(controls.muted||Number(controls.volume)===0)return 'Systemic audio is muted.';
 const layers=Math.max(0,Number(runtime.plan?.layers)||0);
 if(runtime.state==='running'&&layers>0)return 'Systemic audio active with '+layers+' optional presentation cue'+(layers===1?'':'s')+'.';
 return 'No systemic audio cues are active in the current modeled context.';
}
function create(options={}){
 const product=options.product||O.v1LivingProduct,map=options.map||O.v2x14LivingAudioContext,audio=options.audio||O.systemicAudioV1;if(!product||!map||!audio)throw new Error('V2X14 Living audio dependencies unavailable');
 const runtime=audio.createRuntime(options.runtimeOptions||{});let controls=normalized({enabled:false,muted:false,volume:0.5,reducedSensory:false}),activated=false,visibilitySuspended=false,disposed=false,tail=Promise.resolve(),disposePromise=null,controlRevision=0,suppressedDuplicateControlUpdates=0;const audibleRequested=()=>activated&&controls.enabled&&!controls.muted&&controls.volume>0&&!visibilitySuspended&&!disposed;
 function enqueue(fn){const run=tail.then(()=>{if(disposed)throw new Error('V2X14 Living audio controller disposed');return fn();});tail=run.catch(()=>{});return run;}
 async function updateContext(){const s=product.runtime?.snapshot?.()||{};return runtime.update(map.fromLiving(s),controls);}function sync(){return enqueue(updateContext);}
 function activate(next={}){return enqueue(async()=>{const candidate=normalized(controls,{...next,enabled:true});if(!same(candidate,controls)){controls=candidate;controlRevision++;}const first=!activated;activated=true;if(first)controlRevision++;await updateContext();return audibleRequested()?runtime.resume():runtime.suspend();});}
 function setControls(next={}){return enqueue(async()=>{const candidate=normalized(controls,next);if(same(candidate,controls)){suppressedDuplicateControlUpdates++;return runtime.snapshot();}controls=candidate;controlRevision++;await updateContext();return audibleRequested()?runtime.resume():runtime.suspend();});}
 function setVisibility(visible){return enqueue(async()=>{const next=visible===false;if(next===visibilitySuspended)return runtime.snapshot();visibilitySuspended=next;await updateContext();return audibleRequested()?runtime.resume():runtime.suspend();});}
 function snapshot(){return Object.freeze({schema:'ofu-v2x14-audio-controller-snapshot-6',version:VERSION,authority:AUTHORITY,activated,visibilitySuspended,disposed,audibleRequested:audibleRequested(),controls,runtime:runtime.snapshot(),controlRevision,suppressedDuplicateControlUpdates,createsWorldFacts:false,navigationDependency:false,accessibilityDependency:false,userActivationRequired:true,serializedControlUpdates:true,deduplicatesControlUpdates:true});}
 function dispose(){if(disposePromise)return disposePromise;disposePromise=tail.then(async()=>{if(disposed)return runtime.snapshot();disposed=true;visibilitySuspended=true;try{await runtime.suspend();}catch{}return runtime.dispose();});tail=disposePromise.catch(()=>{});return disposePromise;}
 return Object.freeze({authority:AUTHORITY,activate,setControls,setVisibility,sync,snapshot,dispose});
}
let mounted=null,attempts=0;
async function autoMount(){
 if(mounted||typeof root.document==='undefined')return mounted;const product=O.v1LivingProduct,controlsApi=O.systemicAudioControlsV1;if(!product||!O.v2x14LivingAudioContext||!O.systemicAudioV1||!controlsApi){if(++attempts<120&&root.setTimeout)root.setTimeout(autoMount,50);return null;}const host=root.document.querySelector('[data-workspace-panel="lab"]')||root.document.getElementById('living-panel');if(!host){if(++attempts<120&&root.setTimeout)root.setTimeout(autoMount,50);return null;}
 const controller=create({product}),section=root.document.createElement('section');section.setAttribute('data-v2x14-audio','presentation-only');section.setAttribute('aria-label','Optional systemic audio');const h=root.document.createElement('h3');h.textContent='Systemic audio';const note=root.document.createElement('p');note.textContent='Optional presentation-only audio. It never indicates facts that are absent from the current modeled context.';const status=root.document.createElement('p');status.setAttribute('data-v2x14-audio-status','true');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');section.append(h,note,status);host.appendChild(section);
 let activationRequested=false,lastError=null,disposedMount=false,self=null,timer=null,timerStarts=0,timerStops=0,maxConcurrentTimers=0;
 const renderStatus=()=>{const text=lastError?'Systemic audio error. Exploration remains fully usable without audio.':statusMessage(controller.snapshot());if(status.textContent!==text)status.textContent=text;return text;};
 const settle=promise=>Promise.resolve(promise).then(value=>{lastError=null;renderStatus();return value;},error=>{lastError=String(error?.message||error);renderStatus();throw error;});
 const shouldPoll=()=>{const s=controller.snapshot();return !disposedMount&&s.audibleRequested===true&&s.disposed!==true;};
 function stopTimer(){if(timer===null)return;if(root.clearInterval)root.clearInterval(timer);timer=null;timerStops++;}
 const tick=()=>{if(!shouldPoll()){stopTimer();return;}settle(controller.sync()).catch(()=>{});};
 function updateTimer(){if(shouldPoll()){if(timer===null&&root.setInterval){timer=root.setInterval(tick,POLL_INTERVAL_MS);timerStarts++;maxConcurrentTimers=Math.max(maxConcurrentTimers,1);}}else stopTimer();}
 const bridge={setControls(value){const state=controller.snapshot();let promise;if(value?.enabled&&state.activated!==true&&!activationRequested){activationRequested=true;promise=controller.activate(value).finally(()=>{activationRequested=false;});}else promise=controller.setControls(value);return settle(promise).finally(updateTimer);}};
 const controls=controlsApi.mount(section,bridge,{document:root.document,initial:{enabled:false,volume:0.5,muted:false,reducedSensory:false}});renderStatus();
 const visibility=()=>settle(controller.setVisibility(root.document.visibilityState!=='hidden')).then(updateTimer,()=>updateTimer());root.document.addEventListener('visibilitychange',visibility);visibility();
 async function disposeMount(){if(disposedMount)return controller.dispose();disposedMount=true;stopTimer();root.document.removeEventListener('visibilitychange',visibility);controls.dispose();if(section.parentNode)section.parentNode.removeChild(section);const result=await controller.dispose();if(mounted===self)mounted=null;if(root.__OFU_V2X14_AUDIO__===self)delete root.__OFU_V2X14_AUDIO__;return result;}
 const resourceUsage=()=>Object.freeze({pollTimerActive:timer!==null,pollIntervalMs:POLL_INTERVAL_MS,timerStarts,timerStops,maxConcurrentPollTimers:maxConcurrentTimers,idlePolling:timer!==null&&!shouldPoll(),bounded:true});
 self=Object.freeze({controller,controls,section,status,snapshot:()=>controller.snapshot(),statusText:()=>status.textContent,activationPending:()=>activationRequested,resourceUsage,dispose:disposeMount});mounted=self;root.__OFU_V2X14_AUDIO__=mounted;return mounted;
}
O.v2x14LivingAudioController=Object.freeze({VERSION,AUTHORITY,POLL_INTERVAL_MS,statusMessage,create,autoMount,instance:()=>mounted});if(typeof root.document!=='undefined'){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',autoMount,{once:true});else if(root.setTimeout)root.setTimeout(autoMount,0);}
})(globalThis);

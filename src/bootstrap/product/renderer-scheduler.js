(function(root){
'use strict';
if(typeof root.requestAnimationFrame!=='function'||root.__OFU_WAVE_IV_RAF_GATE__)return;
const native=root.requestAnimationFrame.bind(root),nativeCancel=typeof root.cancelAnimationFrame==='function'?root.cancelAnimationFrame.bind(root):()=>{};
const state={version:'ofu-wave-iv-render-scheduler-1',suspendedPlanetFrames:0,executedPlanetFrames:0,livingPacerInstalled:false,livingRotationInputs:0,livingRotationFrames:0,livingRotationCoalesced:0,livingNavigationPacerInstalled:false,livingPinchInputs:0,livingPinchFrames:0,livingPinchCoalesced:0,livingPinchStaleDrops:0,livingPinchBoundaryCommits:0,livingPinchTerminalCommits:0,livingPinchCancelledEvents:0,livingWheelInputs:0,livingWheelFrames:0,livingWheelCoalesced:0,livingWheelStaleDrops:0,livingWheelBoundaryCommits:0,livingRendererFactoryArmed:false,livingRuntimeFactoryArmed:false};
function isPlanetFrame(fn){if(typeof fn!=='function'||fn.name!=='frame')return false;try{return /inspectorTarget\(\)/.test(Function.prototype.toString.call(fn))&&/localFrame\(now\)/.test(Function.prototype.toString.call(fn))}catch{return false}}
function gated(fn){if(!isPlanetFrame(fn))return native(fn);const proxy=t=>{const scale=root.OFU?.waveIVScaleRuntime?.snapshot?.().semanticScale,macro=scale==='galaxy'||scale==='galactic_region'||scale==='stellar_neighborhood'||scale==='system';if(macro){state.suspendedPlanetFrames++;native(proxy);return}state.executedPlanetFrames++;fn(t)};return native(proxy)}
function installLivingPacer(){
 const O=root.OFU,living=O?.v1LivingRenderer;if(!living?.create)return false;
 if(living.FRAME_PACING_VERSION){state.livingPacerInstalled=true;return true;}
 const originalCreate=living.create.bind(living),version='ofu-living-frame-pacer-1';
 function create(...args){
  const renderer=originalCreate(...args);let frame=0,dx=0,dy=0,events=0,disposed=false;
  const pacing={version,strategy:'RAF_COALESCED_ROTATION',inputEvents:0,frames:0,coalescedEvents:0,pendingEvents:0};
  const flush=()=>{frame=0;const x=dx,y=dy,count=events;dx=0;dy=0;events=0;pacing.pendingEvents=0;if(disposed||!count)return;pacing.frames++;pacing.coalescedEvents+=Math.max(0,count-1);state.livingRotationFrames++;state.livingRotationCoalesced+=Math.max(0,count-1);renderer.rotate(x,y);};
  const rotate=(x,y)=>{const rx=Number(x),ry=Number(y);if(!Number.isFinite(rx)||!Number.isFinite(ry))throw new TypeError('Living rotation delta must be finite');if(rx===0&&ry===0)return;dx+=rx;dy+=ry;events++;pacing.inputEvents++;pacing.pendingEvents=events;state.livingRotationInputs++;if(!frame)frame=native(flush);};
  const rendererState=()=>Object.freeze({...renderer.state(),framePacing:Object.freeze({...pacing})});
  const dispose=()=>{disposed=true;if(frame){nativeCancel(frame);frame=0;}dx=0;dy=0;events=0;pacing.pendingEvents=0;return renderer.dispose();};
  return Object.freeze({...renderer,rotate,state:rendererState,dispose});
 }
 O.v1LivingRenderer=Object.freeze({...living,FRAME_PACING_VERSION:version,create});state.livingPacerInstalled=true;return true;
}
function installLivingNavigationPacer(){
 const O=root.OFU,living=O?.v1LivingRuntime;if(!living?.create)return false;
 if(living.NAVIGATION_PACING_VERSION){state.livingNavigationPacerInstalled=true;return true;}
 const originalCreate=living.create.bind(living),version='ofu-living-navigation-pacer-2',navigationStages=Array.from(living.NAVIGATION_STAGES||[]),runtimes=new Set(),pinchPointers=new Set();
 function create(...args){
  const runtime=originalCreate(...args);let frame=0,coordinate=null,options=null,queuedStage=null,events=0,wheelFrame=0,wheelDelta=0,wheelOptions=null,wheelStage=null,wheelRevision=null,wheelEvents=0;
  const pacing={version,strategy:'RAF_LATEST_PINCH_COORDINATE_WITH_RUNTIME_NORMALIZED_SYNC_BOUNDARIES_AND_TERMINAL_FLUSH',inputEvents:0,frames:0,boundaryCommits:0,terminalCommits:0,coalescedEvents:0,pendingEvents:0,staleDrops:0,cancelledEvents:0};
  const wheelPacing={version:'ofu-living-wheel-pacer-2',strategy:'RAF_ACCUMULATED_WHEEL_DELTA_WITH_RUNTIME_NORMALIZED_SYNC_BOUNDARIES',inputEvents:0,frames:0,boundaryCommits:0,coalescedEvents:0,pendingEvents:0,staleDrops:0};
  const reset=()=>{coordinate=null;options=null;queuedStage=null;events=0;pacing.pendingEvents=0;};
  const cancelFrame=()=>{if(frame){nativeCancel(frame);frame=0;}};
  const cancelPendingAsSuperseded=()=>{cancelFrame();if(events){pacing.coalescedEvents+=events;state.livingPinchCoalesced+=events;}reset();};
  const cancelPendingAsInterrupted=()=>{cancelFrame();if(events){pacing.cancelledEvents+=events;state.livingPinchCancelledEvents+=events;}reset();};
  const resetWheel=()=>{wheelDelta=0;wheelOptions=null;wheelStage=null;wheelRevision=null;wheelEvents=0;wheelPacing.pendingEvents=0;};
  const cancelWheelFrame=()=>{if(wheelFrame){nativeCancel(wheelFrame);wheelFrame=0;}};
  const dropPendingWheel=()=>{cancelWheelFrame();if(wheelEvents){wheelPacing.staleDrops++;state.livingWheelStaleDrops++;}resetWheel();};
  const commitPending=(terminal=false)=>{
   if(terminal)cancelFrame();else frame=0;
   const target=coordinate,opts=options,stage=queuedStage,count=events;reset();if(target===null||!count)return runtime.snapshot();
   const current=runtime.snapshot();
   if(current.stage!==stage){pacing.staleDrops++;state.livingPinchStaleDrops++;return current;}
   pacing.frames++;pacing.coalescedEvents+=Math.max(0,count-1);state.livingPinchFrames++;state.livingPinchCoalesced+=Math.max(0,count-1);
   if(terminal){pacing.terminalCommits++;state.livingPinchTerminalCommits++;}
   return runtime.setNavigationCoordinate(target,opts);
  };
  const flush=()=>commitPending(false);
  const stageForCoordinate=(target,current)=>{
   try{
    const normalized=runtime.navigationCoordinate(runtime.distanceForCoordinate(target)),index=Math.max(0,Math.min(navigationStages.length-1,Math.round(normalized)));
    return navigationStages[index]||current.stage;
   }catch{return null;}
  };
  const flushWheel=()=>{
   wheelFrame=0;const delta=wheelDelta,opts=wheelOptions,stage=wheelStage,revision=wheelRevision,count=wheelEvents;resetWheel();if(!count||delta===0)return runtime.snapshot();
   const current=runtime.snapshot();if(current.stage!==stage||current.revision!==revision){wheelPacing.staleDrops++;state.livingWheelStaleDrops++;return current;}
   wheelPacing.frames++;wheelPacing.coalescedEvents+=Math.max(0,count-1);state.livingWheelFrames++;state.livingWheelCoalesced+=Math.max(0,count-1);return runtime.travelBy(delta,opts);
  };
  const travelBy=(value,opts={})=>{
   if(opts?.source!=='living-active-wheel')return runtime.travelBy(value,opts);
   const delta=Number(value);if(!Number.isFinite(delta))throw new TypeError('Living wheel navigation delta must be finite');if(delta===0)return runtime.snapshot();
   const current=runtime.snapshot();wheelPacing.inputEvents++;state.livingWheelInputs++;
   if(wheelEvents&&(current.stage!==wheelStage||current.revision!==wheelRevision))dropPendingWheel();
   const total=wheelDelta+delta,targetStage=stageForCoordinate(current.navigationCoordinate+total,current);
   if(targetStage===null||targetStage!==current.stage){cancelWheelFrame();const count=wheelEvents+1;if(wheelEvents)wheelPacing.coalescedEvents+=wheelEvents;resetWheel();wheelPacing.boundaryCommits++;state.livingWheelBoundaryCommits++;state.livingWheelCoalesced+=Math.max(0,count-1);return runtime.travelBy(total,opts);}
   wheelDelta=total;wheelOptions=Object.freeze({...opts});wheelStage=current.stage;wheelRevision=current.revision;wheelEvents++;wheelPacing.pendingEvents=wheelEvents;if(!wheelFrame)wheelFrame=native(flushWheel);return current;
  };
  const setNavigationCoordinate=(value,opts={})=>{
   if(opts?.source!=='living-active-pinch')return runtime.setNavigationCoordinate(value,opts);
   const target=Number(value);if(!Number.isFinite(target))throw new TypeError('Living pinch navigation coordinate must be finite');
   const current=runtime.snapshot(),targetStage=stageForCoordinate(target,current);
   pacing.inputEvents++;state.livingPinchInputs++;
   if(targetStage===null||targetStage!==current.stage){cancelPendingAsSuperseded();pacing.boundaryCommits++;state.livingPinchBoundaryCommits++;return runtime.setNavigationCoordinate(target,opts);}
   coordinate=target;options=Object.freeze({...opts});queuedStage=current.stage;events++;pacing.pendingEvents=events;if(!frame)frame=native(flush);return current;
  };
  const finishPinchNavigation=({cancelled=false}={})=>{if(cancelled){cancelPendingAsInterrupted();return runtime.snapshot();}return events?commitPending(true):runtime.snapshot();};
  const navigationPacingSnapshot=()=>Object.freeze({...pacing});
  const wheelPacingSnapshot=()=>Object.freeze({...wheelPacing});
  let wrapped=null;const dispose=()=>{cancelPendingAsInterrupted();dropPendingWheel();if(wrapped)runtimes.delete(wrapped);return runtime.dispose?.()??true};
  wrapped=Object.freeze({...runtime,setNavigationCoordinate,travelBy,finishPinchNavigation,navigationPacingSnapshot,wheelPacingSnapshot,dispose});runtimes.add(wrapped);return wrapped;
 }
 const doc=root.document,isLivingPointer=e=>e?.pointerType==='touch'&&(e.target?.id==='living-view'||e.composedPath?.().some?.(node=>node?.id==='living-view'));
 if(doc?.addEventListener){
  doc.addEventListener('pointerdown',e=>{if(isLivingPointer(e))pinchPointers.add(e.pointerId);},true);
  const end=(e,cancelled)=>{if(!pinchPointers.has(e.pointerId))return;pinchPointers.delete(e.pointerId);if(pinchPointers.size<2)for(const runtime of runtimes)runtime.finishPinchNavigation({cancelled});};
  doc.addEventListener('pointerup',e=>end(e,false),true);doc.addEventListener('pointercancel',e=>end(e,true),true);doc.addEventListener('lostpointercapture',e=>end(e,true),true);
 }
 O.v1LivingRuntime=Object.freeze({...living,NAVIGATION_PACING_VERSION:version,WHEEL_PACING_VERSION:'ofu-living-wheel-pacer-2',create});state.livingNavigationPacerInstalled=true;return true;
}
function v1PacingEligible(){const O=root.OFU;return !!(O?.v1PresentationCore||O?.v1WorldPresentation||O?.v1WorldContext)}
function armFactory(name,installer){
 const O=root.OFU;if(!O||!v1PacingEligible()||Object.prototype.hasOwnProperty.call(O,name))return false;
 try{
  Object.defineProperty(O,name,{configurable:true,enumerable:true,get(){return undefined;},set(value){Object.defineProperty(O,name,{configurable:true,enumerable:true,writable:true,value});installer();}});return true;
 }catch{return false}
}
let attempts=0;function install(){const rendering=installLivingPacer(),navigation=installLivingNavigationPacer();if(rendering&&navigation)return;if(++attempts<100)root.setTimeout(install,0)}
root.requestAnimationFrame=gated;
root.__OFU_WAVE_IV_RAF_GATE__=Object.freeze({VERSION:state.version,state,factoryInterception:'SYNC_ASSIGNMENT_WRAP',snapshot:()=>Object.freeze({...state})});
state.livingRendererFactoryArmed=armFactory('v1LivingRenderer',installLivingPacer);
state.livingRuntimeFactoryArmed=armFactory('v1LivingRuntime',installLivingNavigationPacer);
install();
})(typeof globalThis!=='undefined'?globalThis:this);

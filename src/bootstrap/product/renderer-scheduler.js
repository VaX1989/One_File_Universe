(function(root){
'use strict';
if(typeof root.requestAnimationFrame!=='function'||root.__OFU_WAVE_IV_RAF_GATE__)return;
const native=root.requestAnimationFrame.bind(root),nativeCancel=typeof root.cancelAnimationFrame==='function'?root.cancelAnimationFrame.bind(root):()=>{};
const state={version:'ofu-wave-iv-render-scheduler-1',suspendedPlanetFrames:0,executedPlanetFrames:0,livingPacerInstalled:false,livingRotationInputs:0,livingRotationFrames:0,livingRotationCoalesced:0,livingNavigationPacerInstalled:false,livingPinchInputs:0,livingPinchFrames:0,livingPinchCoalesced:0,livingPinchStaleDrops:0,livingWheelInputs:0,livingWheelFrames:0,livingWheelCoalesced:0,livingWheelStaleDrops:0};
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
 const originalCreate=living.create.bind(living),version='ofu-living-navigation-pacer-1',wheelVersion='ofu-living-wheel-pacer-1';
 function create(...args){
  const runtime=originalCreate(...args);let frame=0,coordinate=null,options=null,queuedStage=null,events=0,wheelFrame=0,wheelDelta=0,wheelOptions=null,wheelStage=null,wheelEvents=0;
  const pacing={version,strategy:'RAF_LATEST_PINCH_COORDINATE',inputEvents:0,frames:0,coalescedEvents:0,pendingEvents:0,staleDrops:0};
  const wheelPacing={version:wheelVersion,strategy:'RAF_ACCUMULATED_WHEEL_DELTA',inputEvents:0,frames:0,coalescedEvents:0,pendingEvents:0,staleDrops:0};
  const reset=()=>{coordinate=null;options=null;queuedStage=null;events=0;pacing.pendingEvents=0;};
  const resetWheel=()=>{wheelDelta=0;wheelOptions=null;wheelStage=null;wheelEvents=0;wheelPacing.pendingEvents=0;};
  const flush=()=>{
   frame=0;const target=coordinate,opts=options,stage=queuedStage,count=events;reset();if(target===null||!count)return;
   const current=runtime.snapshot();
   if(current.stage!==stage){pacing.staleDrops++;state.livingPinchStaleDrops++;return;}
   pacing.frames++;pacing.coalescedEvents+=Math.max(0,count-1);state.livingPinchFrames++;state.livingPinchCoalesced+=Math.max(0,count-1);runtime.setNavigationCoordinate(target,opts);
  };
  const flushWheel=()=>{
   wheelFrame=0;const delta=wheelDelta,opts=wheelOptions,stage=wheelStage,count=wheelEvents;resetWheel();if(!count||delta===0)return;
   const current=runtime.snapshot();
   if(current.stage!==stage){wheelPacing.staleDrops++;state.livingWheelStaleDrops++;return;}
   wheelPacing.frames++;wheelPacing.coalescedEvents+=Math.max(0,count-1);state.livingWheelFrames++;state.livingWheelCoalesced+=Math.max(0,count-1);runtime.travelBy(delta,opts);
  };
  const setNavigationCoordinate=(value,opts={})=>{
   if(opts?.source!=='living-active-pinch')return runtime.setNavigationCoordinate(value,opts);
   const target=Number(value);if(!Number.isFinite(target))throw new TypeError('Living pinch navigation coordinate must be finite');
   const current=runtime.snapshot();coordinate=target;options=Object.freeze({...opts});queuedStage=current.stage;events++;pacing.inputEvents++;pacing.pendingEvents=events;state.livingPinchInputs++;if(!frame)frame=native(flush);return current;
  };
  const travelBy=(value,opts={})=>{
   if(opts?.source!=='living-active-wheel')return runtime.travelBy(value,opts);
   const delta=Number(value);if(!Number.isFinite(delta))throw new TypeError('Living wheel navigation delta must be finite');if(delta===0)return runtime.snapshot();
   const current=runtime.snapshot();wheelDelta+=delta;wheelOptions=Object.freeze({...opts});wheelStage=current.stage;wheelEvents++;wheelPacing.inputEvents++;wheelPacing.pendingEvents=wheelEvents;state.livingWheelInputs++;if(!wheelFrame)wheelFrame=native(flushWheel);return current;
  };
  const navigationPacingSnapshot=()=>Object.freeze({...pacing});
  const wheelPacingSnapshot=()=>Object.freeze({...wheelPacing});
  return Object.freeze({...runtime,setNavigationCoordinate,travelBy,navigationPacingSnapshot,wheelPacingSnapshot});
 }
 O.v1LivingRuntime=Object.freeze({...living,NAVIGATION_PACING_VERSION:version,WHEEL_PACING_VERSION:wheelVersion,create});state.livingNavigationPacerInstalled=true;return true;
}
let attempts=0;function install(){const rendering=installLivingPacer(),navigation=installLivingNavigationPacer();if(rendering&&navigation)return;if(++attempts<100)root.setTimeout(install,0)}
root.requestAnimationFrame=gated;
root.__OFU_WAVE_IV_RAF_GATE__=Object.freeze({VERSION:state.version,state,snapshot:()=>Object.freeze({...state})});
install();
})(typeof globalThis!=='undefined'?globalThis:this);

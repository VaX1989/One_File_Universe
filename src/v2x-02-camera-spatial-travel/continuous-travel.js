(function(root){
'use strict';
const O=root.OFU=root.OFU||{},F=O.v1xReferenceFrames,S=O.v1xSemanticDistance,T=O.v1PresentationTransitions||null;
if(!F||!S||!O.v1xCameraAuthority)throw new Error('V2X-02 continuous travel requires frozen V1X camera/reference-frame/semantic-distance authorities');
const VERSION='ofu-v2x02-continuous-travel-1';
const AUTHORITY='PRESENTATION_ONLY';
const PROVIDER_ID='v2x02.interaction.continuous-travel';
const LN10=Math.log(10);
const BAND_TO_PRESENTATION=Object.freeze({galaxy:'GALAXY',galactic_region:'REGION',stellar_neighborhood:'NEIGHBORHOOD',system:'SYSTEM',orbit:'ORBIT',approach:'APPROACH',global_surface:'GLOBAL_SURFACE',regional_surface:'REGIONAL_SURFACE',local_surface:'LOCAL_SURFACE',human:'HUMAN'});
function finite(value,label='value'){const n=Number(value);if(!Number.isFinite(n))throw new TypeError(label+' must be finite');return n;}
function positive(value,label='value'){const n=finite(value,label);if(!(n>0))throw new RangeError(label+' must be positive');return n;}
function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
function token(value,label='token',max=512){const s=String(value??'');if(!s||s.length>max)throw new TypeError(label+' required');return s;}
function finiteVec3(value,label='vector'){if(!Array.isArray(value)||value.length!==3)throw new TypeError(label+' must contain three values');return Object.freeze(value.map((v,i)=>finite(v,label+'['+i+']')));}
function boundedJson(value,label='context',maxBytes=4096){if(value==null)return null;let text;try{text=JSON.stringify(value);}catch{throw new TypeError(label+' must be JSON data');}if(text===undefined||new TextEncoder().encode(text).length>maxBytes)throw new RangeError(label+' exceeds bounded JSON budget');const parsed=JSON.parse(text);function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const k of Object.keys(v))freeze(v[k]);Object.freeze(v);}return v;}return freeze(parsed);}
function normalizeLineage(value){if(value==null)return Object.freeze([]);if(!Array.isArray(value)||value.length>64)throw new TypeError('parentLineage must be a bounded array');return Object.freeze(value.map((v,i)=>token(v,'parentLineage['+i+']',256)));}
function normalizeDeltaMode(mode){const n=Math.trunc(finite(mode,'deltaMode'));if(![0,1,2].includes(n))throw new RangeError('deltaMode must be 0, 1 or 2');return n;}
function normalizedWheelPixels(deltaY,{deltaMode=0,linePixels=16,pagePixels=800}={}){const mode=normalizeDeltaMode(deltaMode),multiplier=mode===1?positive(linePixels,'linePixels'):mode===2?positive(pagePixels,'pagePixels'):1;return clamp(finite(deltaY,'wheel delta')*multiplier,-2400,2400);}
function intentDeltaLog10(intent,{linePixels=16,pagePixels=800}={}){
 if(!intent||typeof intent!=='object')throw new TypeError('travel intent required');const kind=String(intent.kind||'');
 if(kind==='wheel')return normalizedWheelPixels(intent.deltaY,{deltaMode:intent.deltaMode??0,linePixels,pagePixels})*.0042/LN10;
 if(kind==='pinch'){const ratio=positive(intent.ratio,'pinch ratio');return -2.25*Math.log(ratio)/LN10;}
 if(kind==='keyboard'){const direction=Math.sign(finite(intent.direction,'keyboard direction'));return direction===0?0:direction*Math.log10(1.42);}
 if(kind==='distance')return finite(intent.deltaLog10M,'deltaLog10M');
 throw new Error('unsupported continuous travel intent: '+kind);
}
function planIntent(payload={}){
 if(!payload||typeof payload!=='object')throw new TypeError('travel payload required');const current=finite(payload.currentLogDistanceM,'currentLogDistanceM'),min=finite(payload.minLogDistanceM??-18,'minLogDistanceM'),max=finite(payload.maxLogDistanceM??30,'maxLogDistanceM');if(!(min<max))throw new RangeError('travel bounds inverted');
 const requested=intentDeltaLog10(payload.intent||payload,{linePixels:payload.linePixels??16,pagePixels:payload.pagePixels??800}),bounded=clamp(requested,-.9,.9),next=clamp(current+bounded,min,max);
 let semanticScale=payload.currentSemanticScale?String(payload.currentSemanticScale):null;
 if(payload.referenceRadiusM!=null){const model=S.createScaleModel({referenceRadiusM:positive(payload.referenceRadiusM,'referenceRadiusM'),minLogDistanceM:min,maxLogDistanceM:max});semanticScale=model.deriveBand(next,{previous:semanticScale||null});}
 return Object.freeze({contract:VERSION,authority:AUTHORITY,distanceAuthorityKey:'logDistanceM',fromLogDistanceM:current,toLogDistanceM:next,appliedDeltaLog10M:next-current,semanticScale,canonicalMutation:false,selectionMutation:false,historyMutation:false,cameraPathIsPhysicalTrajectory:false});
}
function createController({camera,reducedMotion=false,maxPendingLogDelta=.9,maxLookRadians=.35,maxTranslationUnits=1e6,maxContextDepth=64,linePixels=16,pagePixels=800}={}){
 if(!camera||typeof camera.snapshot!=='function'||typeof camera.applyDistanceDelta!=='function'||typeof camera.look!=='function'||typeof camera.translateLocal!=='function')throw new TypeError('frozen V1X camera authority instance required');
 const pendingLimit=positive(maxPendingLogDelta,'maxPendingLogDelta'),lookLimit=positive(maxLookRadians,'maxLookRadians'),translationLimit=positive(maxTranslationUnits,'maxTranslationUnits'),contextLimit=Math.trunc(positive(maxContextDepth,'maxContextDepth'));if(contextLimit>64)throw new RangeError('maxContextDepth exceeds 64');
 const wheelLine=positive(linePixels,'linePixels'),wheelPage=positive(pagePixels,'pagePixels');
 let pendingDistance=0,pendingYaw=0,pendingPitch=0,lastDistanceSource=null,lastLookSource=null,interrupted=false,motionReduced=Boolean(reducedMotion),sequence=0;
 let observedContext=Object.freeze({selectionToken:camera.snapshot().selectionToken,parentLineage:Object.freeze([]),approachVector:null,surfaceTarget:null,localOrientation:camera.snapshot().pose.orientation,historyToken:null});
 const reverseAnchors=[];
 const metrics={distanceInputs:0,lookInputs:0,flushes:0,interruptions:0,resumes:0,translations:0,reverseAnchors:0,boundaryCrossings:0};
 function snapshot(){const c=camera.snapshot();return Object.freeze({contract:VERSION,authority:AUTHORITY,camera:c,pending:Object.freeze({distanceLog10M:pendingDistance,yawRadians:pendingYaw,pitchRadians:pendingPitch}),reducedMotion:motionReduced,interrupted,context:observedContext,reverseDepth:reverseAnchors.length,reverseTarget:reverseAnchors.at(-1)||null,metrics:Object.freeze({...metrics}),sequence});}
 function resume(source='input-resume'){if(interrupted){interrupted=false;metrics.resumes++;sequence++;lastDistanceSource=lastDistanceSource||String(source);}return snapshot();}
 function queueDistance(delta,source){resume(source);pendingDistance=clamp(pendingDistance+finite(delta,'distance delta'),-pendingLimit,pendingLimit);lastDistanceSource=String(source||'continuous-input');metrics.distanceInputs++;sequence++;return snapshot();}
 function wheel(deltaY,options={}){return queueDistance(intentDeltaLog10({kind:'wheel',deltaY,deltaMode:options.deltaMode??0},{linePixels:options.linePixels??wheelLine,pagePixels:options.pagePixels??wheelPage}),options.source||'wheel');}
 function pinch(ratio,{source='pinch'}={}){return queueDistance(intentDeltaLog10({kind:'pinch',ratio}),source);}
 function keyboard(direction,{source='keyboard'}={}){return queueDistance(intentDeltaLog10({kind:'keyboard',direction}),source);}
 function distance(deltaLog10M,{source='distance-intent'}={}){return queueDistance(deltaLog10M,source);}
 function queueLook({yawRadians=0,pitchRadians=0,source='pointer-look'}={}){resume(source);pendingYaw=clamp(pendingYaw+finite(yawRadians,'yawRadians'),-lookLimit,lookLimit);pendingPitch=clamp(pendingPitch+finite(pitchRadians,'pitchRadians'),-lookLimit,lookLimit);lastLookSource=String(source);metrics.lookInputs++;sequence++;return snapshot();}
 function pointerLook(dx,dy,{source='pointer-look',yawSensitivity=.006,pitchSensitivity=.004}={}){return queueLook({yawRadians:finite(dx,'dx')*finite(yawSensitivity,'yawSensitivity'),pitchRadians:finite(dy,'dy')*finite(pitchSensitivity,'pitchSensitivity'),source});}
 function flush({source='frame-flush'}={}){
  if(interrupted)return snapshot();const before=camera.snapshot(),distanceDelta=pendingDistance,yaw=pendingYaw,pitch=pendingPitch;pendingDistance=0;pendingYaw=0;pendingPitch=0;
  if(distanceDelta!==0)camera.applyDistanceDelta(distanceDelta,{source:String(source)+':'+(lastDistanceSource||'distance')});
  if(yaw!==0||pitch!==0)camera.look({yawRadians:yaw,pitchRadians:pitch,source:String(source)+':'+(lastLookSource||'look')});
  const after=camera.snapshot();if(before.semanticScale!==after.semanticScale)metrics.boundaryCrossings++;metrics.flushes++;sequence++;return snapshot();
 }
 function interrupt(reason='interruption'){pendingDistance=0;pendingYaw=0;pendingPitch=0;interrupted=true;lastDistanceSource=null;lastLookSource=null;metrics.interruptions++;sequence++;return Object.freeze({...snapshot(),interruptionReason:String(reason)});}
 function focusReset(){return interrupt('focus-reset');}
 function setReducedMotion(value){motionReduced=Boolean(value);sequence++;return snapshot();}
 function translateCameraRelative({right=0,up=0,forward=0,source='camera-relative-translate'}={}){
  const local=[finite(right,'right'),finite(up,'up'),-finite(forward,'forward')],length=Math.hypot(...local),scale=length>translationLimit?translationLimit/length:1,rotated=F.qRotate(camera.snapshot().pose.orientation,local.map(v=>v*scale));camera.translateLocal(rotated,{source});metrics.translations++;sequence++;return snapshot();
 }
 function pan(right,up,{source='pan'}={}){return translateCameraRelative({right,up,forward:0,source});}
 function fly(forward,{right=0,up=0,source='fly'}={}){return translateCameraRelative({right,up,forward,source});}
 function advanceToward(targetLogDistanceM,{maxStepLog10=.18,source='continuous-target'}={}){const target=camera.scaleModel.clampLog(targetLogDistanceM),before=camera.snapshot(),step=clamp(target-before.logDistanceM,-positive(maxStepLog10,'maxStepLog10'),positive(maxStepLog10,'maxStepLog10'));if(step!==0)camera.applyDistanceDelta(step,{source});const after=camera.snapshot();if(before.semanticScale!==after.semanticScale)metrics.boundaryCrossings++;sequence++;return Object.freeze({arrived:Math.abs(target-after.logDistanceM)<=1e-12,targetLogDistanceM:target,snapshot:snapshot()});}
 function advanceToBand(band,options={}){const normalized=S.normalizeBand(band),target=camera.scaleModel.anchorLogM[normalized];return advanceToward(target,options);}
 function observeContext({parentLineage=[],approachVector=null,surfaceTarget=null,localOrientation=null,historyToken=null}={}){const c=camera.snapshot();observedContext=Object.freeze({selectionToken:c.selectionToken,parentLineage:normalizeLineage(parentLineage),approachVector:approachVector==null?null:finiteVec3(approachVector,'approachVector'),surfaceTarget:boundedJson(surfaceTarget,'surfaceTarget',4096),localOrientation:localOrientation==null?c.pose.orientation:F.quat(localOrientation,'localOrientation'),historyToken:historyToken==null?null:token(historyToken,'historyToken',512)});sequence++;return snapshot();}
 function captureReverseAnchor(label='travel-anchor'){const c=camera.snapshot(),anchor=Object.freeze({label:token(label,'anchor label',128),logDistanceM:c.logDistanceM,semanticScale:c.semanticScale,frameId:c.pose.frameId,pose:c.pose,selectionToken:c.selectionToken,context:observedContext});if(reverseAnchors.length>=contextLimit)reverseAnchors.shift();reverseAnchors.push(anchor);metrics.reverseAnchors++;sequence++;return anchor;}
 function popReverseAnchor(){const value=reverseAnchors.pop()||null;sequence++;return value;}
 function transitionPlan(targetBand,{sourceEntityId=null,targetEntityId=null,orientation=null}={}){if(!T)return null;const from=BAND_TO_PRESENTATION[camera.snapshot().semanticScale],to=BAND_TO_PRESENTATION[S.normalizeBand(targetBand)];if(!from||!to)return null;return T.plan({from,to,sourceEntityId:sourceEntityId||camera.snapshot().selectionToken,targetEntityId:targetEntityId||sourceEntityId||camera.snapshot().selectionToken,orientation:orientation||observedContext.localOrientation});}
 function transitionSample(targetBand,progress,options={}){if(!T)return null;const plan=transitionPlan(targetBand,options),p=clamp(finite(progress,'progress'),0,1);return T.sample(plan,motionReduced?(p>=1?1:0):p);}
 return Object.freeze({VERSION,AUTHORITY,snapshot,wheel,pinch,keyboard,distance,queueLook,pointerLook,flush,interrupt,focusReset,resume,setReducedMotion,translateCameraRelative,pan,fly,advanceToward,advanceToBand,observeContext,captureReverseAnchor,popReverseAnchor,transitionPlan,transitionSample,camera});
}
function bindProvider(){
 const C=O.pxContracts,P=O.pxProduct;if(!C||!P?.registry)return false;const registry=P.registry;let descriptor;try{descriptor=registry.descriptor(PROVIDER_ID);}catch{return false;}const encoder=new TextEncoder();
 const implementation={handle(request,meter){const value=C.data(planIntent(request.payload||{})),bytes=Math.max(1,encoder.encode(C.stable(value)).length);meter.consume(1,1);return {contract:C.VERSION,provider:PROVIDER_ID,version:descriptor.version,authority:descriptor.authority,selection:request.selection,fidelity:descriptor.fidelity,usage:{entities:1,bytes,operations:1,queue:0},value};},probe:planIntent};
 registry.bind(PROVIDER_ID,descriptor.owner,descriptor.version,implementation);return true;
}
O.v2x02ContinuousTravel=Object.freeze({VERSION,AUTHORITY,PROVIDER_ID,intentDeltaLog10,planIntent,createController,bindProvider});
bindProvider();
})(typeof globalThis!=='undefined'?globalThis:this);

(function(root){
'use strict';
const O=root.OFU=root.OFU||{},S=O.v1xSemanticDistance;
if(!S||!O.v1xCameraAuthority)throw new Error('V1X Wave IV adapter requires camera authority and semantic distance');
const VERSION='ofu-v1x-wave-iv-camera-adapter-1';
const AUTHORITY='PRESENTATION_ONLY';
const INPUT_CONTRACT='ofu-wave-iv-input-intent-3',SCALE_CONTRACT='ofu-wave-iv-scale-runtime-3',SELECTION_CONTRACT='ofu-wave-iv-selection-1';
function finite(value,label='value'){const n=Number(value);if(!Number.isFinite(n))throw new TypeError(label+' must be finite');return n;}
function selectionToken(snapshot){
 const s=snapshot?.selectedCanonicalTarget;if(!s)return 'UNBOUND';
 if(s.planetId)return 'planet:'+String(s.planetId);
 const key=s.canonicalKey;if(!key)return 'UNBOUND';
 const fields=['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot'];return 'canonical:'+fields.map(k=>String(key[k])).join('/');
}
function createWaveIVAdapter(camera,{referenceRadiusM=camera?.scaleModel?.referenceRadiusM}={}){
 if(!camera||typeof camera.applyDistanceDelta!=='function')throw new TypeError('V1X camera authority required');
 const radius=Number(referenceRadiusM);if(!Number.isFinite(radius)||radius<=0)throw new TypeError('positive referenceRadiusM required');
 let adopted=false;
 function adoptSnapshot(snapshot,{observeSelection=true}={}){
  if(!snapshot||snapshot.version!==SCALE_CONTRACT)throw new Error('Wave IV scale-runtime snapshot required');
  const radii=Number(snapshot.distanceIntentRadii);if(!Number.isFinite(radii)||radii<=0)throw new Error('Wave IV distanceIntentRadii must be positive finite');
  const clearance=(radii-1)*radius;if(!(clearance>0))throw new Error('Wave IV camera distance must remain outside the reference surface');camera.adoptLegacyDistance(Math.log10(clearance),{sourceContract:SCALE_CONTRACT});
  if(observeSelection)camera.observeSelection(selectionToken(snapshot),{sourceContract:SELECTION_CONTRACT});
  adopted=true;return camera.snapshot();
 }
 function legacyRadiiTarget(factor,fallbackDelta){const current=camera.snapshot(),nextR=current.distanceRadii*factor,clearance=(nextR-1)*radius;if(clearance>0&&Number.isFinite(clearance))return Math.log10(clearance);return current.logDistanceM+fallbackDelta;}
 function wheel(deltaY,{source='wave-iv-wheel'}={}){const d=Math.max(-180,Math.min(180,finite(deltaY,'wheel delta'))),factor=Math.exp(d*.0042),fallback=S.wheelDeltaLog10(d);return camera.applyDistanceDelta(legacyRadiiTarget(factor,fallback)-camera.snapshot().logDistanceM,{source});}
 function pinch(ratio,{source='wave-iv-pinch'}={}){const r=finite(ratio,'pinch ratio');if(!(r>0))throw new RangeError('pinch ratio must be positive');const factor=Math.pow(r,-2.25),fallback=S.pinchDeltaLog10(r);return camera.applyDistanceDelta(legacyRadiiTarget(factor,fallback)-camera.snapshot().logDistanceM,{source});}
 function keyboard(direction,{source='wave-iv-keyboard'}={}){const d=Math.sign(finite(direction,'keyboard direction'));if(!d)return camera.snapshot();const factor=d>0?1.42:.7042253521,fallback=S.keyboardDeltaLog10(d);return camera.applyDistanceDelta(legacyRadiiTarget(factor,fallback)-camera.snapshot().logDistanceM,{source});}
 function cameraIntent(intent,{source='wave-iv-camera-intent'}={}){
  if(!intent||typeof intent!=='object')throw new TypeError('Wave IV camera intent required');
  if(intent.contract&&intent.contract!==INPUT_CONTRACT)throw new Error('unsupported input intent contract: '+intent.contract);
  if(intent.kind==='rotate-drag')return camera.look({yawRadians:finite(intent.dx||0,'dx')*1.4,pitchRadians:-finite(intent.dy||0,'dy')*1.4,source});
  if(intent.kind==='rotate-step')return camera.look({yawRadians:finite(intent.dx||0,'dx'),pitchRadians:finite(intent.dy||0,'dy'),source});
  if(intent.kind==='reset-direction')return camera.resetOrientation({source});
  const surface={move_forward:[0,0,-1],move_right:[1,0,0]};if(surface[intent.kind]){const amount=finite(intent.amount??1,'amount');return camera.translateLocal(surface[intent.kind].map(v=>v*amount),{source});}
  if(intent.kind==='look_yaw')return camera.look({yawRadians:finite(intent.amount??0,'amount'),pitchRadians:0,source});
  if(intent.kind==='look_pitch')return camera.look({yawRadians:0,pitchRadians:finite(intent.amount??0,'amount'),source});
  throw new Error('unsupported Wave IV camera intent: '+String(intent.kind));
 }
 function toScaleCommand(snapshot=camera.snapshot()){
  return Object.freeze({contract:SCALE_CONTRACT,semanticScale:snapshot.semanticScale,distanceRadii:snapshot.distanceRadii,intentKind:'continuous',source:'v1x-01-camera-authority',derivedFrom:'logDistanceM',authority:AUTHORITY});
 }
 function toCameraIntent(kind,detail={}){return Object.freeze({contract:INPUT_CONTRACT,kind,...detail,source:'v1x-01-camera-authority'});}
 function snapshot(){return Object.freeze({contract:VERSION,authority:AUTHORITY,inputContract:INPUT_CONTRACT,scaleContract:SCALE_CONTRACT,selectionContract:SELECTION_CONTRACT,adoptedLegacySnapshot:adopted,camera:camera.snapshot()});}
 return Object.freeze({VERSION,AUTHORITY,adoptSnapshot,wheel,pinch,keyboard,cameraIntent,toScaleCommand,toCameraIntent,snapshot,selectionToken});
}
O.v1xWaveIVCameraAdapter=Object.freeze({VERSION,AUTHORITY,INPUT_CONTRACT,SCALE_CONTRACT,SELECTION_CONTRACT,createWaveIVAdapter,selectionToken});
})(typeof globalThis!=='undefined'?globalThis:this);

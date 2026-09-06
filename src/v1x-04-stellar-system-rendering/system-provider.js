(function(root){
'use strict';
const O=root.OFU=root.OFU||{},M=O.v1x04SystemMath,S=O.v1x04SystemScene;
if(!M||!S)throw new Error('V1X-04 system provider requires math and system scene');
const AUTHORITY=Object.freeze({class:'PRESENTATION_ONLY',contract:'ofu-px-contracts-1',model:'ofu-v1x-04-system-renderer',version:'1.0.0',sources:Object.freeze(['P3 canonical system/star/planet facts','V1X-01 external camera/reference-frame input','V1X-02 external parent-space anchor input']),assumptions:Object.freeze(['The convergence owner supplies camera and scale transition state.']),limitations:Object.freeze(['Current orbital phase is not canonical in P3 and is never claimed by this provider.','Orbit radii are logarithmically compressed presentation geometry.','Responsive viewport fit may increase presentation camera distance without changing upstream camera, scale, selection or identity authority.','Unintegrated lane code does not own selection, scale, camera, resource admission, or renderer composition.']),evidence:Object.freeze([])});
const FIDELITY=Object.freeze({regime:'stellar-system',validity:'Inspectable 3D presentation of P3 hierarchy and baseline orbit organization; not an ephemeris.',resolution:'Bounded stars, planets and 24..256 polyline samples per orbit.',uncertainty:'Ascending node, periapsis orientation and display anchor phase are deterministic presentation-only values.'});
const DESCRIPTOR=Object.freeze({contract:'ofu-px-contracts-1',id:'v1x04.system.renderer',version:'1.0.0',owner:'v1x-04-stellar-system-rendering',kind:'renderer',authority:AUTHORITY,fidelity:FIDELITY,lifecycle:'SHIPPING',requires:Object.freeze([]),claims:Object.freeze(['system.3d.presentation','system.identity.picking','system.orbit.presentation']),operations:Object.freeze(['REPRESENT','INSPECT']),budget:Object.freeze({entities:64,bytes:1048576,operations:4096,queue:64}),evidence:Object.freeze([{id:'v1x04.system-rendering.3d',tier:'LANE_TARGETED'},{id:'v1x04.system-rendering.static-oracle',tier:'LANE_TARGETED'},{id:'v1x04.system-rendering.continuity',tier:'LANE_TARGETED'}]),mandatory:false});
function freeze(value){if(!value||typeof value!=='object'||Object.isFrozen(value))return value;for(const k of Object.keys(value))freeze(value[k]);return Object.freeze(value)}
function cameraRetreat(camera,factor,metadata={}){
  const position=M.v3(camera.position,'camera.position'),target=M.v3(camera.target,'camera.target'),offset=M.sub(position,target),previous=camera.responsiveViewportFit||{},distanceFactor=Number(previous.distanceFactor||1)*factor;
  return freeze({...camera,position:M.add(target,M.mul(offset,factor)),responsiveViewportFit:{authority:'PRESENTATION_ONLY',sourceAspect:previous.sourceAspect??camera.aspect,targetAspect:previous.targetAspect??camera.aspect,distanceFactor,sceneFitAttempts:Number(metadata.sceneFitAttempts??previous.sceneFitAttempts??0),sceneFitReason:metadata.sceneFitReason??previous.sceneFitReason??null}});
}
function responsiveCamera(camera,viewport){
  if(!camera||typeof camera!=='object')throw new TypeError('external camera frame required');
  const width=Number(viewport?.width??1),height=Number(viewport?.height??1),aspect=Number(camera.aspect??width/height);
  if(!(Number.isFinite(width)&&width>0&&Number.isFinite(height)&&height>0&&Number.isFinite(aspect)&&aspect>0))throw new RangeError('positive viewport/camera aspect required');
  const targetAspect=1.25;
  if(aspect>=targetAspect)return camera;
  const factor=Math.min(2.4,targetAspect/aspect);
  return cameraRetreat(camera,factor,{sceneFitAttempts:0,sceneFitReason:'RESPONSIVE_ASPECT'});
}
function visibleNodeCount(scene,camera,viewport){
  let visible=0;for(const node of scene.nodes){const pixel=M.ndcToPixel(M.project(node.transitionPosition3d,camera),viewport);if(pixel?.visible)visible++;}return visible;
}
function ensureVisibleSystemTarget(scene,camera,viewport){
  let fitted=camera,attempts=0;
  while(visibleNodeCount(scene,fitted,viewport)===0&&attempts<4){attempts++;fitted=cameraRetreat(fitted,1.35,{sceneFitAttempts:attempts,sceneFitReason:'VISIBLE_CANONICAL_TARGET'});}
  return fitted;
}
function render(input,{camera,viewport={width:1280,height:720},orbitSegments,approach}={}){
  const scene=S.createScene(input,{orbitSegments,approach});if(!S.validatePrimary3DRepresentation(scene))throw new Error('primary system representation must be true 3D');
  const projectionCamera=ensureVisibleSystemTarget(scene,responsiveCamera(camera,viewport),viewport);
  const projectedOrbits=scene.orbits.map(o=>freeze({canonicalEntityId:o.canonicalEntityId,geometryAuthority:o.geometryAuthority,currentOrbitalPhaseAuthority:o.currentOrbitalPhaseAuthority,points:o.vertices.map(p=>M.ndcToPixel(M.project(M.transform(p,scene.approach.systemOriginInParentFrame3d,scene.approach.presentationScale),projectionCamera),viewport)).filter(Boolean)}));
  const hitTargets=[];for(const node of scene.nodes){const pixel=M.ndcToPixel(M.project(node.transitionPosition3d,projectionCamera),viewport);if(!pixel)continue;hitTargets.push(freeze({canonicalEntityId:node.canonicalEntityId,kind:node.kind,parentCanonicalEntityId:node.parentCanonicalEntityId,x:pixel.x,y:pixel.y,depth:pixel.depth,visible:pixel.visible,radiusPx:node.kind==='STAR'?11:7,selectionAuthority:'UPSTREAM_SELECTION_CONTRACT'}))}
  const drawPackets=projectedOrbits.length+hitTargets.length;if(drawPackets>S.LIMITS.maxDrawPackets)throw new RangeError('draw packet budget exceeded');
  const result=freeze({version:'ofu-v1x-04-system-provider-1',providerId:DESCRIPTOR.id,authority:'PRESENTATION_ONLY',scene,projectedOrbits:Object.freeze(projectedOrbits),hitTargets:Object.freeze(hitTargets),resourceUsage:{...scene.resourceUsage,drawPackets},resourceAdmissionAuthority:'OFU.pxResources',cameraAuthority:'V1X-01_EXTERNAL',responsiveViewportFit:projectionCamera.responsiveViewportFit||null,selectionAuthority:'UPSTREAM_SELECTION_CONTRACT'});
  const bytes=new TextEncoder().encode(JSON.stringify(result)).length;if(bytes>DESCRIPTOR.budget.bytes)throw new RangeError('provider byte budget exceeded');return result;
}
function pick(rendered,x,y,{maxDistancePx=18}={}){
  const px=Number(x),py=Number(y);if(!Number.isFinite(px)||!Number.isFinite(py))throw new TypeError('pick coordinates must be finite');let best=null,bestD=Number(maxDistancePx);
  for(const h of rendered?.hitTargets||[]){if(!h.visible)continue;const d=Math.hypot(h.x-px,h.y-py)-h.radiusPx;if(d<=bestD){best=h;bestD=d}}if(!best)return null;
  return freeze({canonicalEntityId:best.canonicalEntityId,kind:best.kind,parentCanonicalEntityId:best.parentCanonicalEntityId,selectionIntent:'SELECT_CANONICAL_ENTITY',selectionAuthority:'UPSTREAM_SELECTION_CONTRACT',distancePx:Math.max(0,bestD)});
}
function continuityWitness({regionCanonicalEntityId,systemCanonicalEntityId,planetCanonicalEntityId,referenceFrameId,scaleStateToken}){
  for(const [k,v] of Object.entries({regionCanonicalEntityId,systemCanonicalEntityId,planetCanonicalEntityId}))if(typeof v!=='string'||!v)throw new TypeError(k+' required');
  const common=freeze({referenceFrameId:referenceFrameId==null?null:String(referenceFrameId),scaleStateToken:scaleStateToken==null?null:String(scaleStateToken),authority:'PRESENTATION_ONLY',transitionAuthority:'UPSTREAM_CROSS_SCALE_RUNTIME'}),steps=Object.freeze([
    freeze({operation:'REFINE',from:'REGION_OR_NEIGHBORHOOD',to:'SYSTEM',selectedCanonicalEntityId:systemCanonicalEntityId,parentCanonicalEntityId:regionCanonicalEntityId,...common}),
    freeze({operation:'REFINE',from:'SYSTEM',to:'PLANET',selectedCanonicalEntityId:planetCanonicalEntityId,parentCanonicalEntityId:systemCanonicalEntityId,...common}),
    freeze({operation:'PROJECT',from:'PLANET',to:'SYSTEM',selectedCanonicalEntityId:systemCanonicalEntityId,childCanonicalEntityId:planetCanonicalEntityId,...common}),
    freeze({operation:'PROJECT',from:'SYSTEM',to:'REGION_OR_NEIGHBORHOOD',selectedCanonicalEntityId:regionCanonicalEntityId,childCanonicalEntityId:systemCanonicalEntityId,...common})]);
  return freeze({version:'ofu-v1x-04-continuity-witness-1',steps,identityInvariant:{region:regionCanonicalEntityId,system:systemCanonicalEntityId,planet:planetCanonicalEntityId,reversibleWithoutIdentitySubstitution:true}});
}
O.v1x04SystemProvider=Object.freeze({VERSION:'ofu-v1x-04-system-provider-1',DESCRIPTOR,AUTHORITY,FIDELITY,render,pick,continuityWitness});
})(typeof globalThis!=='undefined'?globalThis:this);
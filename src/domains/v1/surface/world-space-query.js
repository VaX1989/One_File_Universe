(function(root){
'use strict';
const O=root.OFU=root.OFU||{},A=O.v2x06SurfaceAddress,G=O.v2x06Geography,H=O.v2x06Hydrology;
if(!A||!G||!H)throw new Error('V2X-06 address/geography/hydrology required');
const VERSION='ofu-v2x-06-world-space-query-1';
const AUTHORITY='DERIVED';
const SOURCE_AUTHORITY='MODEL_DERIVED_SIMULATION';
const DEFAULT_LIMITS=Object.freeze({maxBatchQueries:256,maxLevel:20});
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)}
function unit(v){if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw new TypeError('finite 3-vector required');const n=Math.hypot(v[0],v[1],v[2]);if(!(n>1e-12))throw new RangeError('non-zero vector required');return[v[0]/n,v[1]/n,v[2]/n]}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function tangentFrame(up){const axis=Math.abs(up[1])>.95?[1,0,0]:[0,1,0],east=unit(cross(axis,up)),north=unit(cross(up,east));return freeze({east:freeze(east),north:freeze(north),up:freeze(up)})}
function hash32(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>16;return h>>>0}
function digest(v){return('00000000'+hash32(JSON.stringify(v)).toString(16)).slice(-8)}
function normalizeLevel(value,maxLevel){const n=Math.floor(Number(value));if(!Number.isFinite(n))return Math.min(6,maxLevel);return Math.max(0,Math.min(maxLevel,n))}
function createService({model,hydrology,bounds={}}={}){
 if(!model||!hydrology)throw new TypeError('surface model and hydrology required');
 if(hydrology.model?.planetIdentity!==model.planetIdentity)throw new Error('surface model/hydrology planet mismatch');
 const limits=Object.freeze({...DEFAULT_LIMITS,...bounds});
 if(!Number.isInteger(limits.maxBatchQueries)||limits.maxBatchQueries<=0)throw new RangeError('invalid maxBatchQueries');
 if(!Number.isInteger(limits.maxLevel)||limits.maxLevel<0||limits.maxLevel>A.MAX_LEVEL)throw new RangeError('invalid maxLevel');
 function fromAddress(address){
  if(!address||address.planetIdentity!==model.planetIdentity)throw new Error('surface address planet mismatch');
  const stable=A.locate(model.planetIdentity,address.latMicroDeg,address.lonMicroDeg,normalizeLevel(address.level,limits.maxLevel)),g=model.sample(stable),h=hydrology.sample(stable),up=unit(stable.unit),frame=tangentFrame(up);
  const placement=freeze({locationIdentity:stable.locationIdentity,planetIdentity:model.planetIdentity,surfaceClass:g.surfaceClass,provinceClass:g.provinceClass,materialFamily:g.materialFamily,basinIdentity:h.basinIdentity,hydrologyContext:h.contextClass,waterActivityPpm:h.waterActivityPpm,riverOrder:h.riverOrder,reliefCuePpm:g.reliefCuePpm,coastDeltaPpm:g.coastDeltaPpm,erosionCuePpm:g.erosionCuePpm,cryosphereCuePpm:g.cryosphereCuePpm,aridityCuePpm:g.aridityCuePpm,claims:{vegetationEligibilityAssigned:false,structureSuitabilityAssigned:false,organismPresenceAssigned:false,traversalSafetyAssigned:false,resourceTruthAssigned:false}});
  return freeze({version:VERSION,authority:AUTHORITY,sourceAuthority:SOURCE_AUTHORITY,planetIdentity:model.planetIdentity,locationIdentity:stable.locationIdentity,patchIdentity:stable.patchIdentity,level:stable.level,latMicroDeg:stable.latMicroDeg,lonMicroDeg:stable.lonMicroDeg,worldSpace:freeze({kind:'PLANET_CENTERED_UNIT_SPHERE_DERIVED',position:freeze(up),frame,units:'NORMALIZED_PLANET_RADIUS',canonicalMeters:false,canonicalElevation:false}),placement,claims:{globalContinuousAddress:true,lodIndependentLocationIdentity:true,legacySurfaceWindowFallback:false,cameraAuthorityOwned:false,selectionAuthorityOwned:false,geodesyAuthorityOwned:false,physicalElevationClaim:false}});
 }
 function queryLatLon(latMicroDeg,lonMicroDeg,{level=6}={}){return fromAddress(A.locate(model.planetIdentity,latMicroDeg,lonMicroDeg,normalizeLevel(level,limits.maxLevel)))}
 function queryUnit(unitVector,{level=6}={}){const ll=A.unitToLatLon(unit(unitVector));return queryLatLon(ll.latMicroDeg,ll.lonMicroDeg,{level})}
 function queryBatch(requests,{level=6}={}){
  if(!Array.isArray(requests))throw new TypeError('query batch array required');
  if(requests.length>limits.maxBatchQueries)throw new Error('surface query batch budget exceeded');
  const results=requests.map(q=>q&&Array.isArray(q.unit)?queryUnit(q.unit,{level:q.level??level}):queryLatLon(q?.latMicroDeg,q?.lonMicroDeg,{level:q?.level??level}));
  const witness={version:'ofu-v2x-06-world-space-batch-witness-1',authority:'MEASURED_RUNTIME_EVIDENCE',planetIdentity:model.planetIdentity,count:results.length,maxBatchQueries:limits.maxBatchQueries,locations:results.map(r=>r.locationIdentity),positions:results.map(r=>r.worldSpace.position)};
  return freeze({results,witness:freeze({...witness,digest:digest(witness)})});
 }
 function continuityWitness(latMicroDeg,lonMicroDeg,{globalLevel=2,regionalLevel=7,localLevel=12}={}){
  const levels=[globalLevel,regionalLevel,localLevel,regionalLevel,globalLevel].map(v=>normalizeLevel(v,limits.maxLevel)),samples=levels.map(level=>queryLatLon(latMicroDeg,lonMicroDeg,{level})),id=samples[0].locationIdentity,position=samples[0].worldSpace.position,locationStable=samples.every(s=>s.locationIdentity===id),positionStable=samples.every(s=>s.worldSpace.position.every((v,i)=>Math.abs(v-position[i])<=1e-12));
  return freeze({version:'ofu-v2x-06-global-local-revisit-witness-1',authority:'MEASURED_RUNTIME_EVIDENCE',planetIdentity:model.planetIdentity,levels:freeze(levels),locationIdentity:id,locationStable,positionStable,pass:locationStable&&positionStable,digest:digest(samples.map(s=>({level:s.level,id:s.locationIdentity,position:s.worldSpace.position,basin:s.placement.basinIdentity,surface:s.placement.surfaceClass}))),claims:{samePhysicalElevationProved:false,canonicalReferenceFrameProved:false}})
 }
 return Object.freeze({VERSION,AUTHORITY,SOURCE_AUTHORITY,planetIdentity:model.planetIdentity,limits,queryLatLon,queryUnit,queryBatch,continuityWitness});
}
O.v2x06WorldSpaceQuery=Object.freeze({VERSION,AUTHORITY,SOURCE_AUTHORITY,DEFAULT_LIMITS,createService});
})(globalThis);

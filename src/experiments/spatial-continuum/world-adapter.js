import { AUTHORITY } from './constants.js';
import { surfaceTargetFromModel } from './geodesy.js';
import { createReferenceFrameRegistry } from './reference-frames.js';
import { createSpatialGraph } from './spatial-graph.js';
import { deterministicTerrainHeight } from './terrain-field.js';

const idOf = node => node?.canonicalId || node?.entityId || node?.id || null;
const factsOf = node => node?.metadata?.facts || node?.facts || {};
const hash=value=>{let out=2166136261;for(const char of String(value)){out^=char.charCodeAt(0);out=Math.imul(out,16777619)}return out>>>0};
const orbitPosition=(id,orbitMeters,inclinationMilliDeg=0)=>{const angle=hash(id)/4294967296*Math.PI*2,inclination=Number(inclinationMilliDeg)/1000*Math.PI/180;return Object.freeze([Math.cos(angle)*orbitMeters,Math.sin(inclination)*orbitMeters,Math.sin(angle)*orbitMeters]);};

const sameKey=(a,b)=>!!a&&!!b&&['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot'].every(field=>String(a[field])===String(b[field]));
const copyKey=key=>Object.freeze(Object.fromEntries(Object.entries(key).map(([name,value])=>[name,BigInt(value)])));

export function captureGenuineOFUWorld(root=globalThis,{profile='origin',orbitSlot=null,latMicroDeg=null,lonMicroDeg=null}={}) {
  const O=root.OFU, product=O?.v1LivingProduct, preview=root.__OFU_PLANET_PREVIEW__;
  if (!O?.p3Astronomy || !product?.runtime || !preview?.chosen?.key) throw new Error('Released OFU canonical runtime is not ready');
  const baseKey=preview.chosen.key,multi=String(profile).toLowerCase()==='multi',key=copyKey(multi?{...baseKey,siteX:46n,siteY:437n,siteZ:400n,orbitSlot:BigInt(orbitSlot??2)}:baseKey),runtime=product.runtime;
  if(!sameKey(key,baseKey))runtime.enterKey(key);
  if(latMicroDeg!=null||lonMicroDeg!=null){const latitude=Number(latMicroDeg||0),longitude=Number(lonMicroDeg||0);if(!Number.isSafeInteger(latitude)||latitude < -90000000||latitude > 90000000||!Number.isSafeInteger(longitude))throw new Error('Invalid model-derived surface coordinates');runtime.at(latitude,longitude,{stage:'HUMAN'})}else runtime.scale('HUMAN');
  const state=runtime.snapshot(), graphSeed=runtime.graphForKey(key), body=graphSeed.body, system=graphSeed.system;
  if (!state.world || !state.local || !state.point || !body || !system) throw new Error('Genuine OFU world did not materialize');
  const sample=state.local.objects.find(item=>item.kind==='ROCK') || state.local.objects.find(item=>['WATER','ICE','ARTIFACT','ORGANISM'].includes(item.kind));
  if (!sample) throw new Error('Genuine OFU local context has no inspectable sample');
  const source=runtime.query('v1.query.material-source',{...state.point,historyEpoch:state.world?.civilization?.epoch??0,objectId:sample.entityId});
  const microSession=O.v1MicroPipeline.createSession(source,{microFeatures:64,molecularUnits:24,atoms:96});
  const representations=Object.freeze({
    material:microSession.materialize('material'),
    microstructure:microSession.materialize('microstructure'),
    molecular:microSession.materialize('molecular'),
    atomic:microSession.materialize('atomic')
  });
  const systemId=idOf(system), bodyId=idOf(body), surfaceId=state.point.locationIdentity, sampleId=sample.entityId;
  const nodes=[
    {id:systemId,kind:'STELLAR_SYSTEM',parentId:null,frameId:'system-barycentric',authority:AUTHORITY.CANONICAL,representations:['SYSTEM'],metadata:{facts:factsOf(system)}},
    {id:bodyId,kind:'PLANET',parentId:systemId,frameId:'body-centered',authority:AUTHORITY.CANONICAL,representations:['SYSTEM','ORBIT','APPROACH','GLOBAL_SURFACE'],metadata:{facts:factsOf(body),canonicalKey:key,navigationEntityId:body.entityId}},
    {id:surfaceId,kind:'SURFACE_LOCATION',parentId:bodyId,frameId:'body-fixed',authority:AUTHORITY.MODEL_DERIVED,representations:['GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN'],metadata:{point:state.point,sample:state.local.surface}},
    {id:sampleId,kind:sample.kind,parentId:surfaceId,frameId:'sample',authority:AUTHORITY.MODEL_DERIVED,representations:['HUMAN','MATERIAL','MICROSTRUCTURE','MOLECULAR','ATOMIC'],metadata:{label:sample.label,source}}
  ];
  const p3Snapshot=O.p3Astronomy.planetaryInputSnapshot(preview.ctx,key),adapted=O.p5Planetology.adaptP3PlanetaryInputSnapshot(p3Snapshot),physical=O.p5Planetology.realizePhysicalPlanet(preview.ctx,adapted);
  if(physical.status!=='SUPPORTED')throw new Error('Selected genuine world is outside the physical visualization domain: '+String(physical.reason));
  const physicalRadius=Number(physical.physical.meanRadiusM);
  const orbitMeters=Number(state.body?.metadata?.facts?.baselineSemiMajorAxisMicroAu || 1000000) * 149597.8707;
  const surfaceTarget=surfaceTargetFromModel({bodyId,locationIdentity:surfaceId,latMicroDeg:state.point.latMicroDeg,lonMicroDeg:state.point.lonMicroDeg,radiusM:physicalRadius,authority:AUTHORITY.MODEL_DERIVED});
  const rawBodies=Object.freeze([...graphSeed.children.stars,...graphSeed.children.planets].map((node,index)=>{
    const id=idOf(node),facts=factsOf(node),planet=node.kind==='planet',bodyOrbitM=planet?Number(facts.baselineSemiMajorAxisMicroAu||index+1)*149597.8707:(index-(graphSeed.children.stars.length-1)/2)*physicalRadius*18;
    return Object.freeze({id,kind:node.kind,canonicalKey:node.canonicalKey,facts,index,selected:id===bodyId,frameId:'body:'+id,positionM:orbitPosition(id,bodyOrbitM,facts.baselineInclinationMilliDeg||0),radiusM:id===bodyId?physicalRadius:planet?physicalRadius*Math.max(.28,Math.min(2.6,Math.cbrt(Number(facts.baselineMassMilliEarth||1000)/7491))):physicalRadius*3.5,radiusAuthority:id===bodyId?AUTHORITY.MODEL_DERIVED:AUTHORITY.PRESENTATION_ONLY});
  }));
  const systemRadiusM=Math.max(orbitMeters*1.24,...rawBodies.filter(item=>item.kind==='planet').map(item=>Math.hypot(...item.positionM)*1.18));
  const bodyFrameId='body:'+bodyId,bodyFixedFrameId='body-fixed:'+bodyId,localFrameId='surface:'+surfaceId,sampleFrameId='sample:'+sampleId,microFrameId='sample-micro:'+sampleId,sampleLocalPoint=Object.freeze([0,deterministicTerrainHeight(0,-2,bodyId)+.16,-2]);
  nodes[1]={...nodes[1],frameId:bodyFrameId};nodes[2]={...nodes[2],frameId:bodyFixedFrameId};nodes[3]={...nodes[3],frameId:sampleFrameId};
  for(const item of rawBodies)if(!nodes.some(node=>node.id===item.id))nodes.push({id:item.id,kind:item.kind==='planet'?'PLANET':'STAR',parentId:systemId,frameId:item.frameId,authority:AUTHORITY.CANONICAL,representations:['SYSTEM','ORBIT','APPROACH'],metadata:{facts:item.facts,canonicalKey:item.canonicalKey}});
  const spatialGraph=createSpatialGraph(nodes,{focusId:bodyId});
  const frames=createReferenceFrameRegistry([
    {id:'cosmic',metersPerUnit:1,parentId:null,authority:AUTHORITY.CANONICAL},
    {id:'system-barycentric',metersPerUnit:1,parentId:'cosmic',originInParent:[0,0,0],authority:AUTHORITY.CANONICAL},
    ...rawBodies.map(item=>({id:item.frameId,metersPerUnit:item.id===bodyId?physicalRadius:1,parentId:'system-barycentric',originInParent:item.positionM,authority:AUTHORITY.CANONICAL})),
    {id:bodyFixedFrameId,metersPerUnit:physicalRadius,parentId:bodyFrameId,originInParent:[0,0,0],authority:AUTHORITY.MODEL_DERIVED},
    {id:localFrameId,metersPerUnit:1,parentId:bodyFixedFrameId,originInParent:surfaceTarget.bodyFixedUnit,orientation:surfaceTarget.tangent.orientation,authority:AUTHORITY.MODEL_DERIVED},
    {id:sampleFrameId,metersPerUnit:1,parentId:localFrameId,originInParent:sampleLocalPoint,authority:AUTHORITY.PRESENTATION_ONLY},
    {id:microFrameId,metersPerUnit:1e-9,parentId:sampleFrameId,originInParent:[0,0,0],authority:AUTHORITY.PRESENTATION_ONLY}
  ]);
  const surfaceUp=frames.directionToRoot([0,1,0],localFrameId),surfaceFrame={surfaceFrameId:localFrameId,up:surfaceUp};
  const bodyTargets=Object.freeze(Object.fromEntries(rawBodies.filter(item=>item.kind==='planet').map(item=>[item.id,Object.freeze({id:item.id,frameId:item.frameId,point:[0,0,0],radiusM:item.radiusM,radiusAuthority:item.radiusAuthority,renderRadius:3,up:item.id===bodyId?surfaceUp:[0,1,0],surfaceFrameId:item.id===bodyId?localFrameId:null})])));
  const cameraTargets=Object.freeze({
    system:Object.freeze({id:systemId,frameId:'system-barycentric',point:[0,0,0],radiusM:systemRadiusM,renderRadius:15,up:[0,1,0],...surfaceFrame}),
    body:Object.freeze({id:bodyId,frameId:bodyFrameId,point:[0,0,0],radiusM:physicalRadius,renderRadius:3,up:surfaceUp,...surfaceFrame}),
    regional:Object.freeze({id:surfaceId,frameId:localFrameId,point:[0,0,0],radiusM:340000,renderRadius:17,up:surfaceUp,...surfaceFrame}),
    local:Object.freeze({id:surfaceId,frameId:localFrameId,point:[0,0,0],radiusM:17000,renderRadius:17,up:surfaceUp,...surfaceFrame}),
    human:Object.freeze({id:surfaceId,frameId:localFrameId,point:[0,0,0],radiusM:4,renderRadius:4,up:surfaceUp,...surfaceFrame}),
    sample:Object.freeze({id:sampleId,frameId:sampleFrameId,point:[0,0,0],radiusM:.6,renderRadius:4,up:surfaceUp,...surfaceFrame}),
    micro:Object.freeze({id:sampleId,frameId:microFrameId,point:[0,0,0],radiusM:6e-9,renderRadius:4,up:surfaceUp,...surfaceFrame}),
    molecular:Object.freeze({id:sampleId,frameId:microFrameId,point:[0,0,0],radiusM:8e-10,renderRadius:4,up:surfaceUp,...surfaceFrame}),
    atomic:Object.freeze({id:sampleId,frameId:microFrameId,point:[0,0,0],radiusM:9e-11,renderRadius:4,up:surfaceUp,...surfaceFrame}),
    bodies:bodyTargets
  });
  return Object.freeze({
    contract:'ofu-spatial-continuum-genuine-world-2',profile:multi?'MULTI_WORLD_ADVERSARIAL':'RELEASE_SELECTION',
    sourceRuntimeVersion:runtime.VERSION,
    canonicalKey:key,
    systemId,bodyId,surfaceId,sampleId,
    planetIdentity:state.world.planetIdentity,
    physicalRadiusM:physicalRadius,systemRadiusM,
    system,bodies:rawBodies,body,world:state.world,point:state.point,local:state.local,sample,sampleLocalPoint,source,representations,surfaceTarget,cameraTargets,
    graph:spatialGraph,frames,frameIds:Object.freeze({system:'system-barycentric',body:bodyFrameId,bodyFixed:bodyFixedFrameId,local:localFrameId,sample:sampleFrameId,micro:microFrameId}),
    authority:Object.freeze({system:AUTHORITY.CANONICAL,body:AUTHORITY.CANONICAL,surface:AUTHORITY.MODEL_DERIVED,sample:AUTHORITY.MODEL_DERIVED,visuals:AUTHORITY.PRESENTATION_ONLY}),
    scientificClaims:Object.freeze({canonicalPlanetIdentity:true,canonicalSystemIdentity:true,canonicalSurfaceGeodesy:false,physicalTerrainElevation:false,exactMolecularArrangement:false,exactAtomicPosition:false}),
    releaseLegacy() {
      for(const name of ['v2CinematicMacroDirector','v2CinematicExperience','v2CinematicDepth','planetSurfaceWebGL2','planetWebGL2','pxRenderBackend'])try{O[name]?.dispose?.()}catch{}
      try{product.dispose?.()}catch{}
      if(!product.dispose)try{product.renderer?.dispose?.()}catch{}
      if(!product.dispose)try{runtime.dispose?.()}catch{}
      try{preview.dispose?.()}catch{}
      return true;
    }
  });
}

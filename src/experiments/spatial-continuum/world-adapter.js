import { AUTHORITY } from './constants.js';
import { presentationOrbitAuthority, spatialAuthority } from './authority.js';
import { deterministicModelCoordinates, surfaceTargetFromModel } from './geodesy.js';
import { createReferenceFrameRegistry } from './reference-frames.js';
import { createSpatialGraph } from './spatial-graph.js';
import { createWorldScientificState } from './scientific-state.js';
import { deterministicTerrainHeight } from './terrain-field.js';

const idOf = node => node?.canonicalId || node?.entityId || node?.id || null;
const factsOf = node => node?.metadata?.facts || node?.facts || {};
const hash=value=>{let out=2166136261;for(const char of String(value)){out^=char.charCodeAt(0);out=Math.imul(out,16777619)}return out>>>0};
const orbitPosition=(id,orbitMeters,inclinationMilliDeg=0)=>{const angle=hash(id)/4294967296*Math.PI*2,inclination=Number(inclinationMilliDeg)/1000*Math.PI/180;return Object.freeze([Math.cos(angle)*orbitMeters,Math.sin(inclination)*orbitMeters,Math.sin(angle)*orbitMeters]);};

const sameKey=(a,b)=>!!a&&!!b&&['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot'].every(field=>String(a[field])===String(b[field]));
const copyKey=key=>Object.freeze(Object.fromEntries(Object.entries(key).map(([name,value])=>[name,BigInt(value)])));

export function captureGenuineOFUWorld(root=globalThis,{profile='origin',orbitSlot=null,latMicroDeg=null,lonMicroDeg=null,canonicalKey=null,runtime:providedRuntime=null,sampleId:selectedSampleId=null}={}) {
  const O=root.OFU, product=O?.v1LivingProduct, preview=root.__OFU_PLANET_PREVIEW__;
  if (!O?.p3Astronomy || !(providedRuntime||product?.runtime) || !preview?.chosen?.key) throw new Error('Released OFU canonical runtime is not ready');
  const baseKey=preview.chosen.key,multi=String(profile).toLowerCase()==='multi',key=copyKey(canonicalKey||(multi?{...baseKey,siteX:46n,siteY:437n,siteZ:400n,orbitSlot:BigInt(orbitSlot??2)}:baseKey)),runtime=providedRuntime||product.runtime;
  runtime.enterKey(key);
  if(latMicroDeg!=null||lonMicroDeg!=null){const latitude=Number(latMicroDeg||0),longitude=Number(lonMicroDeg||0);if(!Number.isSafeInteger(latitude)||latitude < -90000000||latitude > 90000000||!Number.isSafeInteger(longitude))throw new Error('Invalid model-derived surface coordinates');runtime.at(latitude,longitude,{stage:'HUMAN'})}else runtime.scale('HUMAN');
  const state=runtime.snapshot(), graphSeed=runtime.graphForKey(key), body=graphSeed.body, system=graphSeed.system;
  if (!state.world || !state.local || !state.point || !body || !system) throw new Error('Genuine OFU world did not materialize');
  const sample=state.local.objects.find(item=>item.entityId===String(selectedSampleId||'')) || state.local.objects.find(item=>item.kind==='ROCK') || state.local.objects.find(item=>['WATER','ICE','ARTIFACT','ORGANISM'].includes(item.kind));
  if (!sample) throw new Error('Genuine OFU local context has no inspectable sample');
  const source=runtime.query('v1.query.material-source',{...state.point,historyEpoch:state.world?.civilization?.epoch??0,objectId:sample.entityId});
  let microSession=null,disposed=false;const representationCache=new Map(),representationMetrics={sessionCreations:0,materializations:0};
  const representation=name=>{
    if(disposed)throw new Error('Cannot materialize a representation from a disposed world context');
    if(representationCache.has(name))return representationCache.get(name);
    if(!microSession){microSession=O.v1MicroPipeline.createSession(source,{microFeatures:64,molecularUnits:24,atoms:96});representationMetrics.sessionCreations++}
    const value=microSession.materialize(name);representationCache.set(name,value);representationMetrics.materializations++;return value;
  };
  const representations=Object.freeze({
    get material(){return representation('material')},
    get microstructure(){return representation('microstructure')},
    get molecular(){return representation('molecular')},
    get atomic(){return representation('atomic')},
    snapshot(){return Object.freeze({contract:'ofu-lazy-micro-representations-2',resident:Object.freeze([...representationCache.keys()]),sessionCreations:representationMetrics.sessionCreations,materializations:representationMetrics.materializations,bounded:representationCache.size<=4,disposed})}
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
  const generative=createWorldScientificState({runtime,system,body,physical,point:state.point,sample,source});
  const orbitMeters=Number(state.body?.metadata?.facts?.baselineSemiMajorAxisMicroAu || 1000000) * 149597.8707;
  const surfaceTarget=surfaceTargetFromModel({bodyId,locationIdentity:surfaceId,latMicroDeg:state.point.latMicroDeg,lonMicroDeg:state.point.lonMicroDeg,radiusM:physicalRadius,authority:AUTHORITY.MODEL_DERIVED});
  const rawBodies=Object.freeze([...graphSeed.children.stars,...graphSeed.children.planets].map((node,index)=>{
    const id=idOf(node),facts=factsOf(node),planet=node.kind==='planet',bodyOrbitM=planet?Number(facts.baselineSemiMajorAxisMicroAu||index+1)*149597.8707:(index-(graphSeed.children.stars.length-1)/2)*physicalRadius*18;
    const radiusAuthority=id===bodyId?AUTHORITY.MODEL_DERIVED:AUTHORITY.PRESENTATION_ONLY;
    return Object.freeze({id,kind:node.kind,canonicalKey:node.canonicalKey,facts,index,selected:id===bodyId,frameId:'body:'+id,positionM:orbitPosition(id,bodyOrbitM,facts.baselineInclinationMilliDeg||0),radiusM:id===bodyId?physicalRadius:planet?physicalRadius*Math.max(.28,Math.min(2.6,Math.cbrt(Number(facts.baselineMassMilliEarth||1000)/7491))):physicalRadius*3.5,radiusAuthority,authority:presentationOrbitAuthority(AUTHORITY.CANONICAL,{bounds:radiusAuthority})});
  }));
  const systemRadiusM=Math.max(orbitMeters*1.24,...rawBodies.filter(item=>item.kind==='planet').map(item=>Math.hypot(...item.positionM)*1.18));
  const bodyFrameId='body:'+bodyId,bodyFixedFrameId='body-fixed:'+bodyId,localFrameId='surface:'+surfaceId,sampleFrameId='sample:'+sampleId,microFrameId='sample-micro:'+sampleId,sampleLocalPoint=Object.freeze([0,deterministicTerrainHeight(0,-2,bodyId)+.16,-2]);
  nodes[1]={...nodes[1],frameId:bodyFrameId};nodes[2]={...nodes[2],frameId:bodyFixedFrameId};nodes[3]={...nodes[3],frameId:sampleFrameId};
  for(const item of rawBodies)if(!nodes.some(node=>node.id===item.id))nodes.push({id:item.id,kind:item.kind==='planet'?'PLANET':'STAR',parentId:systemId,frameId:item.frameId,authority:AUTHORITY.CANONICAL,representations:['SYSTEM','ORBIT','APPROACH'],metadata:{facts:item.facts,canonicalKey:item.canonicalKey}});
  const spatialGraph=createSpatialGraph(nodes,{focusId:bodyId});
  const frames=createReferenceFrameRegistry([
    {id:'cosmic',metersPerUnit:1,parentId:null,transformAuthority:AUTHORITY.UNKNOWN,entityAuthority:AUTHORITY.UNKNOWN},
    {id:'macro-universe',metersPerUnit:1e23,parentId:'cosmic',originInParent:[0,0,0],transformAuthority:AUTHORITY.PRESENTATION_ONLY,entityAuthority:AUTHORITY.CANONICAL},
    {id:'macro-galaxy',metersPerUnit:1e20,parentId:'macro-universe',originInParent:[0,0,0],transformAuthority:AUTHORITY.PRESENTATION_ONLY,entityAuthority:AUTHORITY.CANONICAL},
    {id:'macro-region',metersPerUnit:1e17,parentId:'macro-galaxy',originInParent:[0,0,0],transformAuthority:AUTHORITY.PRESENTATION_ONLY,entityAuthority:AUTHORITY.MODEL_DERIVED},
    {id:'macro-neighborhood',metersPerUnit:1e15,parentId:'macro-region',originInParent:[0,0,0],transformAuthority:AUTHORITY.PRESENTATION_ONLY,entityAuthority:AUTHORITY.MODEL_DERIVED},
    {id:'system-barycentric',metersPerUnit:1,parentId:'cosmic',originInParent:[0,0,0],transformAuthority:AUTHORITY.PRESENTATION_ONLY,entityAuthority:AUTHORITY.CANONICAL},
    ...rawBodies.map(item=>({id:item.frameId,metersPerUnit:item.id===bodyId?physicalRadius:1,parentId:'system-barycentric',originInParent:item.positionM,transformAuthority:item.authority.position,entityAuthority:item.authority.entity,phaseAuthority:item.authority.phase})),
    {id:bodyFixedFrameId,metersPerUnit:physicalRadius,parentId:bodyFrameId,originInParent:[0,0,0],transformAuthority:AUTHORITY.MODEL_DERIVED,entityAuthority:AUTHORITY.CANONICAL,phaseAuthority:AUTHORITY.UNKNOWN},
    {id:localFrameId,metersPerUnit:1,parentId:bodyFixedFrameId,originInParent:surfaceTarget.bodyFixedUnit,orientation:surfaceTarget.tangent.orientation,transformAuthority:AUTHORITY.MODEL_DERIVED,entityAuthority:AUTHORITY.MODEL_DERIVED},
    {id:sampleFrameId,metersPerUnit:1,parentId:localFrameId,originInParent:sampleLocalPoint,transformAuthority:AUTHORITY.PRESENTATION_ONLY,entityAuthority:AUTHORITY.MODEL_DERIVED},
    {id:microFrameId,metersPerUnit:1e-9,parentId:sampleFrameId,originInParent:[0,0,0],transformAuthority:AUTHORITY.PRESENTATION_ONLY,entityAuthority:AUTHORITY.MODEL_DERIVED}
  ]);
  const surfaceUp=frames.directionToRoot([0,1,0],localFrameId),surfaceFrame={surfaceFrameId:localFrameId,up:surfaceUp};
  const bodyTargets=Object.freeze(Object.fromEntries(rawBodies.filter(item=>item.kind==='planet').map(item=>[item.id,Object.freeze({id:item.id,frameId:item.frameId,point:[0,0,0],radiusM:item.radiusM,radiusAuthority:item.radiusAuthority,renderRadius:3,up:item.id===bodyId?surfaceUp:[0,1,0],surfaceFrameId:item.id===bodyId?localFrameId:null})])));
  const cameraTargets=Object.freeze({
    universe:Object.freeze({id:'visible-universe',frameId:'macro-universe',point:[0,0,0],radiusM:3e24,renderRadius:28,up:[0,1,0]}),
    galaxy:Object.freeze({id:'focused-galaxy',frameId:'macro-galaxy',point:[0,0,0],radiusM:9e20,renderRadius:23,up:[0,1,0]}),
    region:Object.freeze({id:'focused-region',frameId:'macro-region',point:[0,0,0],radiusM:4e17,renderRadius:18,up:[0,1,0]}),
    neighborhood:Object.freeze({id:'focused-neighborhood',frameId:'macro-neighborhood',point:[0,0,0],radiusM:7e15,renderRadius:16,up:[0,1,0]}),
    system:Object.freeze({id:systemId,frameId:'system-barycentric',point:[0,0,0],radiusM:systemRadiusM,renderRadius:15,up:[0,1,0],...surfaceFrame}),
    body:Object.freeze({id:bodyId,frameId:bodyFrameId,point:[0,0,0],radiusM:physicalRadius,renderRadius:3,up:surfaceUp,...surfaceFrame}),
    regional:Object.freeze({id:surfaceId,frameId:localFrameId,point:[0,0,0],radiusM:120000,renderRadius:17,up:surfaceUp,...surfaceFrame}),
    local:Object.freeze({id:surfaceId,frameId:localFrameId,point:[0,0,0],radiusM:150,renderRadius:17,up:surfaceUp,...surfaceFrame}),
    human:Object.freeze({id:surfaceId,frameId:localFrameId,point:[0,0,0],radiusM:4,renderRadius:4,up:surfaceUp,...surfaceFrame}),
    sample:Object.freeze({id:sampleId,frameId:sampleFrameId,point:[0,0,0],radiusM:.6,renderRadius:4,up:surfaceUp,...surfaceFrame}),
    micro:Object.freeze({id:sampleId,frameId:microFrameId,point:[0,0,0],radiusM:6e-9,renderRadius:4,up:surfaceUp,...surfaceFrame}),
    molecular:Object.freeze({id:sampleId,frameId:microFrameId,point:[0,0,0],radiusM:8e-10,renderRadius:4,up:surfaceUp,...surfaceFrame}),
    atomic:Object.freeze({id:sampleId,frameId:microFrameId,point:[0,0,0],radiusM:9e-11,renderRadius:4,up:surfaceUp,...surfaceFrame}),
    bodies:bodyTargets
  });
  return Object.freeze({
    contract:'ofu-spatial-continuum-genuine-world-3',profile:canonicalKey?'DYNAMIC_SIBLING_MATERIALIZATION':multi?'MULTI_WORLD_ADVERSARIAL':'RELEASE_SELECTION',
    sourceRuntimeVersion:runtime.VERSION,
    canonicalKey:key,
    systemId,bodyId,surfaceId,sampleId,
    planetIdentity:state.world.planetIdentity,physical,generative,
    physicalRadiusM:physicalRadius,systemRadiusM,
    system,bodies:rawBodies,body,world:state.world,point:state.point,local:state.local,sample,sampleLocalPoint,source,representations,surfaceTarget,cameraTargets,
    graph:spatialGraph,frames,frameIds:Object.freeze({system:'system-barycentric',body:bodyFrameId,bodyFixed:bodyFixedFrameId,local:localFrameId,sample:sampleFrameId,micro:microFrameId}),
    terrainTarget:Object.freeze({contract:'ofu-spatial-continuum-metric-terrain-target-2',bodyId,locationIdentity:surfaceId,frameId:localFrameId,horizontalCoordinates:'LOCAL_ENU_METRES',elevationUnit:'METRE',elevationAuthority:AUTHORITY.PRESENTATION_ONLY,seed:generative.seeds.terrain,profile:generative.presentation.terrain,scientificStateHash:generative.scientificHashes.context,representationHash:generative.representationHash}),
    authority:Object.freeze({system:AUTHORITY.CANONICAL,body:AUTHORITY.CANONICAL,surface:AUTHORITY.MODEL_DERIVED,sample:AUTHORITY.MODEL_DERIVED,visuals:AUTHORITY.PRESENTATION_ONLY,orbitTransforms:AUTHORITY.PRESENTATION_ONLY,terrainElevation:AUTHORITY.PRESENTATION_ONLY}),
    authorityRecords:Object.freeze({
      body:spatialAuthority({entity:AUTHORITY.CANONICAL,position:AUTHORITY.PRESENTATION_ONLY,orientation:AUTHORITY.UNKNOWN,phase:AUTHORITY.PRESENTATION_ONLY,bounds:AUTHORITY.MODEL_DERIVED,geometry:AUTHORITY.PRESENTATION_ONLY,elevation:AUTHORITY.UNKNOWN}),
      surface:spatialAuthority({entity:AUTHORITY.MODEL_DERIVED,position:AUTHORITY.MODEL_DERIVED,orientation:AUTHORITY.MODEL_DERIVED,phase:AUTHORITY.UNKNOWN,bounds:AUTHORITY.UNKNOWN,geometry:AUTHORITY.PRESENTATION_ONLY,elevation:AUTHORITY.PRESENTATION_ONLY})
    }),
    scientificClaims:Object.freeze({canonicalPlanetIdentity:true,canonicalSystemIdentity:true,canonicalSurfaceGeodesy:false,physicalTerrainElevation:false,exactMolecularArrangement:false,exactAtomicPosition:false}),
    lifecycle:Object.freeze({snapshot:()=>Object.freeze({contract:'ofu-world-context-lifecycle-1',disposed,residentRepresentations:representationCache.size,microSessionActive:!!microSession})}),
    dispose() {
      if(disposed)return Object.freeze({disposed:false,resources:0,sessions:0,representations:0,reason:'ALREADY_DISPOSED'});
      disposed=true;const representations=representationCache.size,sessions=microSession?1:0;representationCache.clear();try{microSession?.dispose?.()}finally{microSession=null}
      return Object.freeze({disposed:true,resources:0,sessions,representations,reason:'WORLD_CONTEXT_DISPOSAL'});
    },
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

export function captureGenuineOFUWorldSet(root=globalThis,options={}){
  const initial=captureGenuineOFUWorld(root,options),worlds=new Map([[initial.bodyId,initial]]),unsupported=[],candidates=initial.bodies.filter(item=>item.kind==='planet'&&item.id!==initial.bodyId&&item.canonicalKey).slice(0,Math.max(0,Number(options.maxSiblingWorlds??6)));
  for(const candidate of candidates){
    const coordinates=deterministicModelCoordinates(candidate.id);
    try{
      const world=captureGenuineOFUWorld(root,{canonicalKey:candidate.canonicalKey,profile:'sibling',latMicroDeg:coordinates.latMicroDeg,lonMicroDeg:coordinates.lonMicroDeg});
      worlds.set(candidate.id,world);
    }catch(error){unsupported.push(Object.freeze({bodyId:candidate.id,reason:String(error?.message||error)}))}
  }
  return Object.freeze({
    contract:'ofu-spatial-continuum-world-materialization-set-1',initial,worlds,
    supportedBodyIds:Object.freeze([...worlds.keys()]),unsupported:Object.freeze(unsupported),bounded:worlds.size<=1+candidates.length,
    get(bodyId){return worlds.get(String(bodyId))||null},
    releaseLegacy(){return initial.releaseLegacy()}
  });
}

import { AUTHORITY } from './constants.js';
import { createReferenceFrameRegistry } from './reference-frames.js';
import { createSpatialGraph } from './spatial-graph.js';

const idOf = node => node?.canonicalId || node?.entityId || node?.id || null;
const factsOf = node => node?.metadata?.facts || node?.facts || {};

export function captureGenuineOFUWorld(root=globalThis) {
  const O=root.OFU, product=O?.v1LivingProduct, preview=root.__OFU_PLANET_PREVIEW__;
  if (!O?.p3Astronomy || !product?.runtime || !preview?.chosen?.key) throw new Error('Released OFU canonical runtime is not ready');
  const runtime=product.runtime, key=preview.chosen.key;
  runtime.scale('HUMAN');
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
  const spatialGraph=createSpatialGraph(nodes,{focusId:bodyId});
  const physicalRadius=Number(preview.physical?.physical?.meanRadiusM || 6371000);
  const orbitMeters=Number(state.body?.metadata?.facts?.baselineSemiMajorAxisMicroAu || 1000000) * 149597.8707;
  const frames=createReferenceFrameRegistry([
    {id:'cosmic',metersPerUnit:1,parentId:null,authority:AUTHORITY.CANONICAL},
    {id:'system-barycentric',metersPerUnit:1,parentId:'cosmic',originInParent:[0,0,0],authority:AUTHORITY.CANONICAL},
    {id:'body-centered',metersPerUnit:physicalRadius,parentId:'system-barycentric',originInParent:[orbitMeters,0,0],authority:AUTHORITY.CANONICAL},
    {id:'body-fixed',metersPerUnit:physicalRadius,parentId:'body-centered',originInParent:[0,0,0],authority:AUTHORITY.MODEL_DERIVED},
    {id:'local-tangent',metersPerUnit:1,parentId:'body-fixed',originInParent:[0,1,0],authority:AUTHORITY.PRESENTATION_ONLY},
    {id:'sample',metersPerUnit:1,parentId:'local-tangent',originInParent:[0,0,-2],authority:AUTHORITY.MODEL_DERIVED},
    {id:'sample-micro',metersPerUnit:1e-9,parentId:'sample',originInParent:[0,0,0],authority:AUTHORITY.PRESENTATION_ONLY}
  ]);
  const bodies=Object.freeze([...graphSeed.children.stars,...graphSeed.children.planets].map((node,index)=>Object.freeze({
    id:idOf(node),kind:node.kind,canonicalKey:node.canonicalKey,facts:factsOf(node),index,selected:idOf(node)===bodyId
  })));
  return Object.freeze({
    contract:'ofu-spatial-continuum-genuine-world-1',
    sourceRuntimeVersion:runtime.VERSION,
    canonicalKey:key,
    systemId,bodyId,surfaceId,sampleId,
    planetIdentity:state.world.planetIdentity,
    physicalRadiusM:physicalRadius,
    system,bodies,body,world:state.world,point:state.point,local:state.local,sample,source,representations,
    graph:spatialGraph,frames,
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

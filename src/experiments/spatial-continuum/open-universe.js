import { AUTHORITY } from './constants.js';
import { createReadOnlyAuthorityRuntime } from './authority-runtime.js';
import { createMaterializationCache } from './materialization-cache.js';
import { modelCoordinatesFromDirection } from './planetary-topology.js';
import { addressFromNode, createSpatialAddress } from './spatial-address.js';
import { captureGenuineOFUWorld } from './world-adapter.js';

const hash=value=>{let output=2166136261;for(const character of String(value)){output^=character.charCodeAt(0);output=Math.imul(output,16777619)}return output>>>0};
const randomFactory=seed=>{let value=hash(seed)||1;return()=>{value^=value<<13;value^=value>>>17;value^=value<<5;return(value>>>0)/4294967296}};
const idOf=node=>String(node?.canonicalId||node?.entityId||node?.id||'');
const navigationId=node=>String(node?.entityId||node?.id||'');
const keyString=key=>Object.keys(key||{}).sort().map(name=>`${name}=${String(key[name])}`).join(';');
const sourceAuthority=node=>String(node?.sourceAuthority||node?.authority||'').includes('CANONICAL')?AUTHORITY.CANONICAL:String(node?.sourceAuthority||node?.authority||'').includes('MODEL')?AUTHORITY.MODEL_DERIVED:String(node?.sourceAuthority||node?.authority||'').includes('PRESENTATION')?AUTHORITY.PRESENTATION_ONLY:AUTHORITY.UNKNOWN;

export function macroPresentationNode(node,{scopeId='universe',index=0,total=1,selected=false}={}){
  if(!node)throw new TypeError('Macro presentation requires an authority node');
  const kind=String(node.kind||'unknown').toUpperCase(),rnd=randomFactory(`${scopeId}:${idOf(node)}:${kind}`),angle=(index/Math.max(1,total))*Math.PI*2+(rnd()-.5)*.55;
  let radius=18+9*rnd(),vertical=(rnd()-.5)*15,size=1.2+rnd()*1.8;
  if(kind==='GALACTIC_REGION'){radius=10+10*rnd();vertical=(rnd()-.5)*7;size=.7+rnd()*1.1}
  if(kind==='SYSTEM'){radius=7+9*rnd();vertical=(rnd()-.5)*5;size=.24+rnd()*.38}
  if(kind==='STELLAR_NEIGHBORHOOD'){radius=0;vertical=0;size=3}
  return Object.freeze({id:idOf(node),kind,authority:sourceAuthority(node),canonicalKey:node.canonicalKey||null,node,selected:!!selected,label:kind==='GALAXY'?`Galaxy ${idOf(node).slice(0,6)}`:kind==='GALACTIC_REGION'?`Region ${idOf(node).slice(0,6)}`:kind==='SYSTEM'?`System ${idOf(node).slice(0,6)}`:kind,position:Object.freeze([Math.cos(angle)*radius,vertical,Math.sin(angle)*radius]),size,morphology:node.metadata?.modelProfile?.morphology||node.metadata?.facts?.morphology||'UNKNOWN',presentationAuthority:AUTHORITY.PRESENTATION_ONLY});
}

export function createOpenUniverseAuthority(root=globalThis,{ctx,seedKey,maxGalaxies=8,maxRegions=10,maxSystems=12,cacheEntries=12}={}){
  const O=root.OFU,AS=O?.v1ExplorationAddressSpace,preview=root.__OFU_PLANET_PREVIEW__;
  ctx=ctx||preview?.ctx;seedKey=seedKey||preview?.chosen?.key;
  if(!AS||!ctx||!seedKey)throw new Error('Released OFU macro authority is not ready');
  const runtime=createReadOnlyAuthorityRuntime(root,{ctx,seedKey}),universe=runtime.universe,seedGraph=runtime.seedGraph,cache=createMaterializationCache({maxEntries:cacheEntries});
  const sameSystem=(candidate,system)=>!!candidate?.canonicalKey&&!!system?.canonicalKey&&AS.SYSTEM_FIELDS.every(field=>String(candidate.canonicalKey[field])===String(system.canonicalKey[field]));
  const rootAddress=createSpatialAddress([{id:universe.entityId,kind:'UNIVERSE',authority:AUTHORITY.CANONICAL,key:{universeId:universe.universeId},capabilities:['TRAVEL']}]);
  const discovered=AS.discoverGalaxies({ctx,universeNode:universe,window:seedGraph.galaxy.metadata.discoveryWindow,cursor:0,limit:Math.max(3,maxGalaxies),maxProbes:4096}),galaxies=[seedGraph.galaxy,...discovered.galaxies.filter(node=>idOf(node)!==idOf(seedGraph.galaxy))].slice(0,maxGalaxies);
  const nodeIndex=new Map([[idOf(universe),universe],...galaxies.flatMap(node=>[[idOf(node),node],[navigationId(node),node]])]);
  let path=Object.freeze({universe,galaxy:null,region:null,neighborhood:null,system:null,body:null,surface:null,sample:null}),focus=universe,revision=0,world=null,lastFailure=null;
  cache.materialize('universe:'+idOf(universe),()=>Object.freeze({kind:'UNIVERSE',nodes:Object.freeze(galaxies)}),{kind:'UNIVERSE',pin:true});

  const remember=nodes=>{for(const node of nodes||[]){nodeIndex.set(idOf(node),node);nodeIndex.set(navigationId(node),node)}return nodes};
  const address=()=>{
    let output=rootAddress;for(const node of [path.galaxy,path.region,path.neighborhood,path.system,path.body,path.surface,path.sample])if(node)output=addressFromNode(node,output);return output;
  };
  const pinPath=()=>cache.setPinned(['universe:'+idOf(universe),...address().segments.slice(1).map(segment=>`${segment.kind.toLowerCase()}:${segment.id}`)].filter(key=>cache.has(key)));
  const regionsFor=galaxy=>cache.materialize('galaxy:'+idOf(galaxy),()=>{const result=AS.discoverRegions({ctx,galaxy,window:{x:0n,y:0n,z:0n},cursor:0,limit:maxRegions,maxProbes:512}),nodes=[...(idOf(galaxy)===idOf(seedGraph.galaxy)?[seedGraph.region]:[]),...result.regions.filter(node=>idOf(node)!==idOf(seedGraph.region))].slice(0,maxRegions);remember(nodes);return Object.freeze({kind:'GALAXY',node:galaxy,nodes:Object.freeze(nodes),discovery:result})},{kind:'GALAXY'});
  const systemsFor=region=>cache.materialize('region:'+idOf(region),()=>{const siteWindow=idOf(region)===idOf(seedGraph.region)?seedGraph.hood.metadata.siteWindow:{x:0n,y:0n,z:0n},neighborhood=AS.neighborhood(region,siteWindow),result=AS.discoverSystems({ctx,neighborhood,cursor:0,limit:maxSystems,maxProbes:4096}),nodes=[...(idOf(region)===idOf(seedGraph.region)?[seedGraph.system]:[]),...result.systems.filter(node=>idOf(node)!==idOf(seedGraph.system))].slice(0,maxSystems);remember([neighborhood,...nodes]);return Object.freeze({kind:'REGION',node:region,neighborhood,nodes:Object.freeze(nodes),discovery:result})},{kind:'REGION'});
  const bodiesFor=system=>cache.materialize('system:'+idOf(system),()=>{const children=AS.systemChildren({ctx,system,includeMoons:true}),nodes=[...children.stars,...children.planets];remember([...nodes,...children.moons]);return Object.freeze({kind:'SYSTEM',node:system,nodes:Object.freeze(nodes),children})},{kind:'SYSTEM'});
  const catalogueFor=(stage=stageForPath())=>{
    const normalized=String(stage).toUpperCase();let nodes=[];
    if(normalized==='UNIVERSE')nodes=galaxies;
    else if(normalized==='GALAXY'&&path.galaxy)nodes=regionsFor(path.galaxy).nodes;
    else if(normalized==='REGION'&&path.galaxy)nodes=regionsFor(path.galaxy).nodes;
    else if(normalized==='NEIGHBORHOOD'&&path.region)nodes=systemsFor(path.region).nodes;
    else if(normalized==='SYSTEM'&&path.system)nodes=bodiesFor(path.system).nodes;
    const scopeId=normalized==='UNIVERSE'?idOf(universe):normalized==='GALAXY'||normalized==='REGION'?idOf(path.galaxy):normalized==='NEIGHBORHOOD'?idOf(path.region):idOf(path.system||focus);
    return Object.freeze(nodes.map((node,index)=>macroPresentationNode(node,{scopeId,index,total:nodes.length,selected:idOf(node)===idOf(focus)})));
  };
  function stageForPath(){return path.body?'ORBIT':path.system?'SYSTEM':path.region?'REGION':path.galaxy?'GALAXY':'UNIVERSE'}
  function select(id){
    id=String(id);const node=nodeIndex.get(id);if(!node)throw new Error('Unknown visible OFU destination: '+id);const kind=String(node.kind).toLowerCase();lastFailure=null;
    if(kind==='galaxy'){regionsFor(node);path=Object.freeze({...path,galaxy:node,region:null,neighborhood:null,system:null,body:null,surface:null,sample:null});world=null}
    else if(kind==='galactic_region'){if(node.parentId!==navigationId(path.galaxy))throw new Error('Region is outside the focused galaxy');const context=systemsFor(node);path=Object.freeze({...path,region:node,neighborhood:context.neighborhood,system:null,body:null,surface:null,sample:null});world=null}
    else if(kind==='system'){const expected=systemsFor(path.region).nodes.some(candidate=>idOf(candidate)===id);if(!expected)throw new Error('System is outside the focused region');bodiesFor(node);path=Object.freeze({...path,system:node,body:null,surface:null,sample:null});world=null}
    else if(['planet','moon','star'].includes(kind)){if(!path.system||!sameSystem(node,path.system))throw new Error('Body is outside the focused system');bodiesFor(path.system);path=Object.freeze({...path,body:node,surface:null,sample:null});world=null}
    else throw new Error('Unsupported open-universe selection kind: '+kind);
    focus=node;revision++;pinPath();return snapshot();
  }
  function materializeWorld({latMicroDeg=null,lonMicroDeg=null,sampleId=null}={}){
    if(!path.body||!['planet','moon'].includes(path.body.kind))throw new Error('Select a supported planetary body before materializing a world');
    const bulkClass=String(path.body.metadata?.facts?.bulkPriorClass||'UNKNOWN').toUpperCase();if(['GAS_GIANT','ICE_GIANT'].includes(bulkClass)){const error=new Error(`NO_SOLID_SURFACE: ${bulkClass.toLowerCase().replaceAll('_',' ')} supports orbital focus but not terrestrial descent`);error.code='NO_SOLID_SURFACE';lastFailure=Object.freeze({stage:'SURFACE',focusId:idOf(path.body),reason:error.message,capability:'ORBIT_ONLY'});throw error}
    const latitude=latMicroDeg==null?0:Number(latMicroDeg),longitude=lonMicroDeg==null?0:Number(lonMicroDeg),key=`world:${idOf(path.body)}:${latitude}:${longitude}:${sampleId||'auto'}`;
    try{world=cache.materialize(key,()=>captureGenuineOFUWorld(root,{runtime,canonicalKey:path.body.canonicalKey,profile:'lazy',latMicroDeg:latitude,lonMicroDeg:longitude,sampleId}),{kind:'WORLD',pin:true});path=Object.freeze({...path,surface:world.graph.get(world.surfaceId),sample:null});focus=path.body;lastFailure=null;revision++;pinPath();return world}catch(error){lastFailure=Object.freeze({stage:'WORLD',focusId:idOf(path.body),reason:String(error?.message||error)});throw error}
  }
  function retargetSurface(bodyFixedUnit){const coordinates=modelCoordinatesFromDirection(bodyFixedUnit),next=materializeWorld(coordinates);focus=path.body;revision++;return next}
  function localDestinations({radiusM=72,maxPoints=9,maxObjects=16}={}){
    if(!world||!path.body)throw new Error('A surface context is required before discovering local destinations');const key=`local:${world.bodyId}:${world.point.latMicroDeg}:${world.point.lonMicroDeg}:${radiusM}:${maxPoints}:${maxObjects}`;
    return cache.materialize(key,()=>{const latitude=Number(world.point.latMicroDeg)/1e6,longitude=Number(world.point.lonMicroDeg)/1e6,radius=world.physicalRadiusM,offsets=[[0,0],[.28,0],[-.28,0],[0,.28],[0,-.28],[.62,.44],[-.62,.44],[.62,-.44],[-.62,-.44]].slice(0,maxPoints),nodes=[],seen=new Set();runtime.enterKey(path.body.canonicalKey);
      for(const [eastFactor,northFactor] of offsets){const eastM=eastFactor*radiusM,northM=northFactor*radiusM,latMicroDeg=Math.round((latitude+northM/radius*180/Math.PI)*1e6),cosLatitude=Math.max(.05,Math.cos(latitude*Math.PI/180)),lonMicroDeg=Math.round((longitude+eastM/(radius*cosLatitude)*180/Math.PI)*1e6),state=runtime.at(latMicroDeg,lonMicroDeg);for(const object of state.local.objects){if(seen.has(object.entityId))continue;seen.add(object.entityId);nodes.push(Object.freeze({id:object.entityId,entityId:object.entityId,kind:object.kind,label:object.label||object.kind,authority:AUTHORITY.MODEL_DERIVED,latMicroDeg,lonMicroDeg,eastM,northM,object}));if(nodes.length>=maxObjects)break}if(nodes.length>=maxObjects)break}
      return Object.freeze({contract:'ofu-local-destination-catalogue-1',bodyId:world.bodyId,surfaceId:world.surfaceId,nodes:Object.freeze(nodes),bounded:nodes.length<=maxObjects,authority:AUTHORITY.MODEL_DERIVED,placementAuthority:AUTHORITY.PRESENTATION_ONLY})},{kind:'LOCAL_CATALOGUE'});
  }
  function selectSample(sampleId){
    if(!world)throw new Error('A surface context must be materialized before selecting a sample');
    const destination=localDestinations().nodes.find(candidate=>candidate.id===String(sampleId));if(!destination)throw new Error('Unknown local object: '+sampleId);
    world=materializeWorld({latMicroDeg:destination.latMicroDeg,lonMicroDeg:destination.lonMicroDeg,sampleId:destination.id});path=Object.freeze({...path,sample:world.graph.get(world.sampleId)});focus=path.sample;revision++;pinPath();return world;
  }
  const nodeView=node=>node?Object.freeze({id:idOf(node),kind:String(node.kind||'UNKNOWN').toUpperCase().replace('GALACTIC_',''),parentId:node.parentId||null,frameId:node.frameId||({universe:'macro-universe',galaxy:'macro-galaxy',galactic_region:'macro-region',stellar_neighborhood:'macro-neighborhood',system:'system-barycentric'}[String(node.kind).toLowerCase()]||'cosmic'),authority:sourceAuthority(node),metadata:node.metadata||{}}):null;
  function focusBody(){if(!path.body)throw new Error('No body is selected');focus=path.body;revision++;return nodeView(focus)}
  function focusSurface(){if(!path.surface)throw new Error('No surface is materialized');focus=path.surface;revision++;return nodeView(focus)}
  function focusSample(){if(!path.sample)throw new Error('No sample is materialized');focus=path.sample;revision++;return nodeView(focus)}
  const graph=Object.freeze({
    get size(){return new Set(nodeIndex.values()).size},get focusId(){return idOf(focus)},get revision(){return revision},
    get(id){const node=nodeIndex.get(String(id))||world?.graph.get(String(id));return nodeView(node)},has(id){return !!this.get(id)},childrenOf(id){const target=String(id);return Object.freeze([...new Set(nodeIndex.values())].filter(node=>String(node.parentId||'')===target||String(node.parentId||'')===navigationId(nodeIndex.get(target))).map(nodeView))},
    ancestry(){return Object.freeze(address().segments.slice().reverse().map(segment=>nodeView(nodeIndex.get(segment.id)||world?.graph.get(segment.id)||segment)))},
    setFocus(id){id=String(id);if(path.body&&id===idOf(path.body))return focusBody();if(path.surface&&id===idOf(path.surface))return focusSurface();if(path.sample&&id===idOf(path.sample))return focusSample();select(id);return nodeView(focus)},
    snapshot(){const current=address(),view=nodeView(focus);return Object.freeze({contract:'ofu-spatial-continuum-branching-graph-1',nodeCount:this.size,focusId:idOf(focus),focus:view,focusAncestry:Object.freeze([...current.ids].reverse()),revision,singleFocusAuthority:true,address:current.serialized})}
  });
  function checkpoint(){return Object.freeze({contract:'ofu-open-universe-checkpoint-1',galaxyId:idOf(path.galaxy)||null,regionId:idOf(path.region)||null,systemId:idOf(path.system)||null,bodyId:idOf(path.body)||null,surface:world?Object.freeze({latMicroDeg:world.point.latMicroDeg,lonMicroDeg:world.point.lonMicroDeg}):null,sampleId:path.sample?idOf(path.sample):null,focusId:idOf(focus),address:address().serialized})}
  function restore(checkpoint){
    if(checkpoint?.contract!=='ofu-open-universe-checkpoint-1')throw new TypeError('A valid open-universe checkpoint is required');path=Object.freeze({universe,galaxy:null,region:null,neighborhood:null,system:null,body:null,surface:null,sample:null});focus=universe;world=null;lastFailure=null;
    for(const id of [checkpoint.galaxyId,checkpoint.regionId,checkpoint.systemId,checkpoint.bodyId])if(id)select(id);
    if(checkpoint.surface&&path.body&&['planet','moon'].includes(path.body.kind)){world=materializeWorld({...checkpoint.surface,sampleId:checkpoint.sampleId});if(checkpoint.sampleId)path=Object.freeze({...path,sample:world.graph.get(world.sampleId)});if(checkpoint.focusId===world.surfaceId)focusSurface();else if(checkpoint.sampleId&&checkpoint.focusId===world.sampleId)focusSample();else focusBody()}
    revision++;pinPath();return snapshot();
  }
  function cameraTargets(worldContext=world){if(!worldContext)throw new Error('A backing world is required for continuum camera targets');const current=worldContext.cameraTargets;return Object.freeze({...current,universe:Object.freeze({...current.universe,id:idOf(universe)}),galaxy:Object.freeze({...current.galaxy,id:idOf(path.galaxy||galaxies[0])}),region:Object.freeze({...current.region,id:idOf(path.region||path.galaxy||galaxies[0])}),neighborhood:Object.freeze({...current.neighborhood,id:idOf(path.neighborhood||path.region||path.galaxy||galaxies[0])})})}
  function snapshot(){const currentAddress=address(),cacheState=cache.snapshot();return Object.freeze({contract:'ofu-open-universe-authority-1',revision,universeId:universe.universeId,focusId:idOf(focus),focusKind:String(focus.kind).toUpperCase(),stage:stageForPath(),path,currentAddress,visibleGalaxies:galaxies.length,selectableGalaxies:galaxies.length,catalogue:Object.freeze(catalogueFor()),worldIdentity:world?.bodyId||null,surfaceIdentity:world?.surfaceId||null,sampleIdentity:world?.sampleId||null,cache:cacheState,materialization:Object.freeze({state:lastFailure?'FAILED':world?'READY':'IDLE',blocker:lastFailure}),bounded:galaxies.length<=maxGalaxies&&cacheState.bounded,scientificAuthority:Object.freeze({macroIdentity:AUTHORITY.CANONICAL,macroPlacement:AUTHORITY.PRESENTATION_ONLY,surfaceCoordinates:AUTHORITY.MODEL_DERIVED,terrain:AUTHORITY.PRESENTATION_ONLY})})}
  function dispose(){cache.clear();runtime.dispose();return true}
  return Object.freeze({runtime,universe,seedGraph,galaxies,cache,graph,get world(){return world},get path(){return path},get focus(){return focus},select,focusBody,focusSurface,focusSample,regionsFor,systemsFor,bodiesFor,catalogueFor,cameraTargets,materializeWorld,retargetSurface,localDestinations,selectSample,checkpoint,restore,snapshot,dispose});
}

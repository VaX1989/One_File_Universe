(function(root){
'use strict';
const O=root.OFU,V=O.v1Common,AS=O.v1ExplorationAddressSpace,T=O.v1UniversalTraversal;
const W=O.v1WorldContext,MP=O.v1MicroPipeline;
if(!V||!AS||!T||!W||!MP||!O.v1Providers)throw new Error('Living-universe dependencies required');
const VERSION='ofu-wave-a-living-runtime-1',MAX_HISTORY=64,MAX_ROWS=24;
const SURFACE=['GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN'];
const REGIMES=['MATERIAL','MICROSTRUCTURE','MOLECULAR','ATOMIC'];
const stages=['UNIVERSE','GALAXY','REGION','NEIGHBORHOOD','SYSTEM','ORBIT','APPROACH',...SURFACE,...REGIMES];
const sameKey=(a,b)=>!!a&&!!b&&AS.SYSTEM_FIELDS.every(k=>String(a[k])===String(b[k]));
const keyCopy=k=>Object.freeze(Object.fromEntries(Object.entries(k).map(([n,v])=>[n,BigInt(v)])));
function create({ctx,key,universeId=null,onCanonicalSelection=null,galaxySource=null}={}){
 V.assert(ctx&&key,'living universe requires canonical context and seed key');
 const seed=keyCopy(key),P=O.pxProduct,universe=AS.universe(universeId||P.captured(seed).selection.target.universeId);
 const traversal=T.create({initialNode:universe,runtime:null,maxHistory:MAX_HISTORY});
 const history=[],listeners=new Set(),metrics={navigations:0,providerQueries:0,discoveryProbes:0,backtracks:0,sourceReturns:0};
 let frame={stage:'UNIVERSE',node:universe,galaxy:null,region:null,hood:null,system:null,body:null,point:null,epoch:null,objectId:null,cursor:0,window:null};
 let rows=[],world=null,local=null,micro=null,page=null,revision=0,lastError=null;
 const cache=new Map();
 function emit(){revision++;for(const fn of listeners)fn(snapshot());return snapshot();}
 function query(id,payload={},body=frame.body){
  V.assert(body&&['planet','moon'].includes(body.kind),'query requires selected canonical world');
  const selection=P.captured(body.canonicalKey).selection,d=P.registry.descriptor(id),operation=['INSPECT','DISCOVER','REPRESENT'].find(op=>d.operations.includes(op));V.assert(operation,'living query requires a read-only provider operation');
  const merged=body.kind==='moon'?{...payload,satelliteSlot:Number(body.canonicalKey.satelliteSlot)}:payload;
  metrics.providerQueries++;
  return P.registry.invoke(id,{contract:O.pxContracts.VERSION,provider:id,operation,selection,fidelity:d.fidelity,budget:d.budget,payload:merged}).value;
 }
 function worldFor(body){
  const selection=P.captured(body.canonicalKey).selection;
  return O.v1Providers.worldForBody(selection,body.kind==='moon'?Number(body.canonicalKey.satelliteSlot):null);
 }
 function currentWorld(){
  if(!frame.body||frame.body.kind==='star')return null;
  const original=worldFor(frame.body);
  if(frame.epoch===null||frame.epoch===original.civilization.epoch)return original;
  const c=query('v1.query.model-history',{epoch:frame.epoch},frame.body).state;
  return Object.freeze({...original,civilization:c,modelTime:{...original.modelTime,civilizationEpoch:frame.epoch}});
 }
 function graphForKey(k){
  const galaxy=AS.galaxyFromCanonical({ctx,universeNode:universe,canonicalKey:k});
  const region=AS.regionFromCanonical({ctx,galaxy,canonicalKey:k});
  const hood=AS.neighborhood(region,{x:BigInt(k.siteX)/16n,y:BigInt(k.siteY)/16n,z:BigInt(k.siteZ)/16n});
  const system=AS.systemFromCanonical({ctx,neighborhood:hood,canonicalKey:k});
  const children=AS.systemChildren({ctx,system});
  const planet=children.planets.find(p=>p.canonicalKey.orbitSlot===BigInt(k.orbitSlot));
  const body=k.satelliteSlot===undefined?planet:children.moons.find(m=>m.canonicalKey.orbitSlot===BigInt(k.orbitSlot)&&m.canonicalKey.satelliteSlot===BigInt(k.satelliteSlot));
  V.assert(body,'canonical body does not exist');
  return {galaxy,region,hood,system,body,children};
 }

 const regimeDescriptor=P.registry.descriptor('v1.representation.microscopic');
 const regimeContract=P.registry.invoke(regimeDescriptor.id,{contract:O.pxContracts.VERSION,provider:regimeDescriptor.id,operation:'INSPECT',selection:P.captured(seed).selection,fidelity:regimeDescriptor.fidelity,budget:regimeDescriptor.budget,payload:{}}).value;
 V.assert(regimeContract.regimeOrder.join(',')===REGIMES.map(x=>x.toLowerCase()).join(','),'sealed regime graph and runtime disagree');
 const seedGraph=graphForKey(seed);
 function remember(nodes){for(const n of nodes){V.assert(n?.version===AS.VERSION,'navigation node');traversal.remember(n,'WARM');}}
 remember([seedGraph.galaxy,seedGraph.region,seedGraph.hood,seedGraph.system,seedGraph.body]);
 function putCache(k,v){if(cache.has(k))cache.delete(k);cache.set(k,v);while(cache.size>12)cache.delete(cache.keys().next().value);return v;}
 function discover(){
  local=null;micro=null;page=null;rows=[];
  if(frame.stage==='UNIVERSE'){
   const ck='galaxies:'+JSON.stringify(frame.window||{},(_,v)=>typeof v==='bigint'?String(v):v)+':'+frame.cursor;
   if(cache.has(ck)){page=cache.get(ck);rows=page.rows;return;}
   let galaxies=[];
   if(!frame.cursor&&!frame.window){
    galaxies=[seedGraph.galaxy];
    for(const k of (galaxySource?.()||[]).slice(0,MAX_ROWS)){
     const g=AS.galaxyFromCanonical({ctx,universeNode:universe,canonicalKey:k});
     if(!galaxies.some(x=>x.entityId===g.entityId))galaxies.push(g);
    }
   }
   if(galaxies.length<3||frame.cursor||frame.window){
    const d=AS.discoverGalaxies({ctx,universeNode:universe,window:frame.window||seedGraph.galaxy.metadata.discoveryWindow,cursor:frame.cursor,limit:MAX_ROWS,maxProbes:4096});
    metrics.discoveryProbes+=d.probes;galaxies.push(...d.galaxies.filter(g=>!galaxies.some(x=>x.entityId===g.entityId)));page={nextCursor:d.nextCursor,window:d.window,probes:d.probes};
   }
   rows=galaxies.slice(0,MAX_ROWS);page={...(page||{}),rows};putCache(ck,page);
  }else if(frame.stage==='GALAXY'){
   const d=AS.discoverRegions({ctx,galaxy:frame.galaxy,cursor:frame.cursor,limit:MAX_ROWS,maxProbes:512,window:frame.window||{x:0n,y:0n,z:0n}});
   metrics.discoveryProbes+=d.probes;rows=d.regions;page=d;
   if(frame.galaxy.entityId===seedGraph.galaxy.entityId&&!frame.cursor&&!frame.window&&!rows.some(r=>r.entityId===seedGraph.region.entityId))rows=[seedGraph.region,...rows].slice(0,MAX_ROWS);
  }else if(frame.stage==='REGION'||frame.stage==='NEIGHBORHOOD'){
   const d=AS.discoverSystems({ctx,neighborhood:frame.hood,cursor:frame.cursor,limit:MAX_ROWS,maxProbes:1024});
   metrics.discoveryProbes+=d.probes;rows=d.systems;page=d;
   if(frame.region?.entityId===seedGraph.region.entityId&&sameKey({...frame.hood.canonicalKey,...seed},seed)&&frame.hood.metadata.siteWindow.x===seedGraph.hood.metadata.siteWindow.x&&!frame.cursor&&!rows.some(r=>r.entityId===seedGraph.system.entityId))rows=[seedGraph.system,...rows].slice(0,MAX_ROWS);
  }else if(frame.stage==='SYSTEM'){
   const c=AS.systemChildren({ctx,system:frame.system});
   // Every planet remains visible; satellites are exposed under their parent in orbit.
   rows=[...c.stars,...c.planets];page={children:c};
  }else if(frame.stage==='ORBIT'&&frame.body?.kind==='planet'){
   const c=AS.systemChildren({ctx,system:frame.system});rows=c.moons.filter(m=>m.parentId===frame.body.entityId);
  }
  remember(rows.filter(n=>n.version===AS.VERSION));
  if(SURFACE.includes(frame.stage)||REGIMES.includes(frame.stage)){
   V.assert(world&&frame.point,'surface requires world and point');
   local=query('v1.query.local-world',{...frame.point,historyEpoch:frame.epoch});
   rows=local.objects;
   if(REGIMES.includes(frame.stage)){
    const source=query('v1.query.material-source',{...frame.point,historyEpoch:frame.epoch,objectId:frame.objectId});
    micro=MP.createSession(source,{microFeatures:64,molecularUnits:24,atoms:96});
    const stop=REGIMES.indexOf(frame.stage);for(let i=0;i<=stop;i++)micro.step(-1);
   }
  }
 }
 function apply(next,{push=true}={}){
  V.assert(stages.includes(next.stage),'unknown living-universe stage');
  const prior={frame,world,local,micro,page,rows},priorBody=frame.body;
  try{frame={...next};world=currentWorld();discover();
   if(frame.body&&frame.body.kind!=='star'&&(!sameKey(priorBody?.canonicalKey,frame.body.canonicalKey)||String(priorBody?.canonicalKey?.orbitSlot)!==String(frame.body.canonicalKey.orbitSlot)))onCanonicalSelection?.(frame.body.canonicalKey);
   traversal.retarget(frame.node||universe,{push:false,source:'wave-a-living-universe'});
  }catch(error){frame=prior.frame;world=prior.world;local=prior.local;micro=prior.micro;page=prior.page;rows=prior.rows;lastError=String(error.message);throw error;}
  if(push){history.push(Object.freeze({...prior.frame}));if(history.length>MAX_HISTORY)history.shift();}
  lastError=null;metrics.navigations++;return emit();
 }
 function enterGalaxy(galaxy){V.assert(galaxy?.kind==='galaxy','galaxy');return apply({stage:'GALAXY',node:galaxy,galaxy,region:null,hood:null,system:null,body:null,point:null,epoch:null,objectId:null,cursor:0,window:null});}
 function enterRegion(region,{siteWindow=null}={}){
  V.assert(region?.kind==='galactic_region'&&region.parentId===frame.galaxy?.entityId,'region belongs to selected galaxy');
  const hood=AS.neighborhood(region,siteWindow||(region.entityId===seedGraph.region.entityId?seedGraph.hood.metadata.siteWindow:{x:0n,y:0n,z:0n}));
  remember([region,hood]);traversal.refine(region,[hood]);
  return apply({...frame,stage:'REGION',node:region,region,hood,system:null,body:null,point:null,epoch:null,objectId:null,cursor:0,window:null});
 }
 function enterNeighborhood(){V.assert(frame.hood,'select region first');return apply({...frame,stage:'NEIGHBORHOOD',node:frame.hood,cursor:0});}
 function enterSystem(system){
  V.assert(system?.kind==='system','system');
  V.assert(system.canonicalKey.galaxyX===frame.galaxy?.canonicalKey.galaxyX&&system.canonicalKey.galaxyY===frame.galaxy?.canonicalKey.galaxyY&&system.canonicalKey.galaxyZ===frame.galaxy?.canonicalKey.galaxyZ,'system galaxy context');
  const key=system.canonicalKey,region=AS.regionFromCanonical({ctx,galaxy:frame.galaxy,canonicalKey:key}),hood=AS.neighborhood(region,{x:key.siteX/16n,y:key.siteY/16n,z:key.siteZ/16n});remember([region,hood,system]);
  return apply({...frame,stage:'SYSTEM',node:system,system,region,hood,body:null,point:null,epoch:null,objectId:null,cursor:0});
 }
 function enterBody(body){
  V.assert(['star','planet','moon'].includes(body?.kind),'select a canonical body');
  V.assert(sameKey(body.canonicalKey,frame.system?.canonicalKey),'body system context');
  return apply({...frame,stage:'ORBIT',node:body,body,point:null,epoch:null,objectId:null,cursor:0});
 }
 function enterKey(k){const g=graphForKey(keyCopy(k));remember([g.galaxy,g.region,g.hood,g.system,g.body]);return apply({...frame,...g,children:undefined,stage:'ORBIT',node:g.body,point:null,epoch:null,objectId:null,cursor:0,window:null});}
 function approach(){V.assert(world,'star has no solid-world descent');return apply({...frame,stage:'APPROACH',node:AS.approach(frame.body)});}
 function at(latMicroDeg=0,lonMicroDeg=0,{stage='GLOBAL_SURFACE',push=true}={}){
  V.assert(world&&SURFACE.includes(stage),'world surface stage');
  V.assert(!['GAS_GIANT','ICE_GIANT'].includes(world.planetology.bulkPriorClass),'No solid surface: use atmosphere inspection');
  const point=W.location(world.planetIdentity,latMicroDeg,lonMicroDeg);
  const h=AS.surfaceHierarchy(frame.body,{latitudeMicroDeg:BigInt(point.latMicroDeg),longitudeMicroDeg:BigInt(point.lonMicroDeg)});
  remember([h.approach,...h.nodes]);const node=h.nodes[SURFACE.indexOf(stage)];
  return apply({...frame,stage,point,node,objectId:null},{push});
 }
 function inspectAtmosphere(){V.assert(world,'world required');const point=W.location(world.planetIdentity,0,0),h=AS.surfaceHierarchy(frame.body,{});return apply({...frame,stage:'LOCAL_SURFACE',point,node:h.localSurface,objectId:null});}
 function scale(stage){
  stage=String(stage).toUpperCase();
  if(stage==='UNIVERSE')return apply({stage,node:universe,galaxy:null,region:null,hood:null,system:null,body:null,point:null,epoch:null,objectId:null,cursor:0,window:null});
  if(stage==='GALAXY'){V.assert(frame.galaxy,'galaxy context');return enterGalaxy(frame.galaxy);}
  if(stage==='REGION'){V.assert(frame.region,'region context');return enterRegion(frame.region,{siteWindow:frame.hood.metadata.siteWindow});}
  if(stage==='NEIGHBORHOOD')return enterNeighborhood();
  if(stage==='SYSTEM'){V.assert(frame.system,'system context');return enterSystem(frame.system);}
  if(stage==='ORBIT'){V.assert(frame.body,'body context');return apply({...frame,stage,node:frame.body});}
  if(stage==='APPROACH')return approach();
  if(SURFACE.includes(stage))return at(frame.point?.latMicroDeg||0,frame.point?.lonMicroDeg||0,{stage});
  throw new Error('Use selected material for microscopic regimes');
 }
 function selectObject(id){V.assert(local,'local world context required');V.assert(local.objects.some(o=>o.entityId===id),'unknown local object');frame={...frame,objectId:id};return emit();}
 function enterMicro(id=frame.objectId){
  V.assert(local&&id,'select a local material or organism first');
  const source=query('v1.query.material-source',{...frame.point,historyEpoch:frame.epoch,objectId:id}),handoff=AS.microscopicHandoff(frame.node.kind==='global_surface'?AS.surfaceHierarchy(frame.body,{latitudeMicroDeg:BigInt(frame.point.latMicroDeg),longitudeMicroDeg:BigInt(frame.point.lonMicroDeg)}).human:frame.node,{sourceObjectId:id,sourceKind:source.kind});
  // The exact source context, not a demonstration organism, owns this handoff.
  return apply({...frame,stage:'MATERIAL',node:handoff,objectId:id});
 }
 function deeper(){if(!micro)return enterMicro();const i=REGIMES.indexOf(frame.stage);if(i===REGIMES.length-1)return snapshot();return apply({...frame,stage:REGIMES[i+1]});}
 function back(){if(!history.length)return snapshot();const old=frame,next=history.pop();metrics.backtracks++;if(REGIMES.includes(old.stage)&&SURFACE.includes(next.stage)){V.assert(old.point.locationIdentity===next.point.locationIdentity,'micro source return drift');metrics.sourceReturns++;}return apply(next,{push:false});}
 function nextPage(){V.assert(page?.nextCursor!==null&&page?.nextCursor!==undefined,'no next page in current window');return apply({...frame,cursor:page.nextCursor},{push:false});}
 function nextWindow(){
  if(frame.stage==='UNIVERSE'){
   const w=page?.window||frame.window||seedGraph.galaxy.metadata.discoveryWindow;
   return apply({...frame,cursor:0,window:{...w,x:BigInt(w.x)+1n}},{push:false});
  }
  if(['REGION','NEIGHBORHOOD'].includes(frame.stage)){
   const a=frame.hood.metadata.siteWindow,n=(Number(a.x)+Number(a.y)*32+Number(a.z)*1024+1)%32768;
   const hood=AS.neighborhood(frame.region,{x:BigInt(n%32),y:BigInt(Math.floor(n/32)%32),z:BigInt(Math.floor(n/1024))});
   return apply({...frame,hood,node:frame.stage==='REGION'?frame.region:hood,cursor:0},{push:false});
  }
  const w=frame.window||{x:0n,y:0n,z:0n};return apply({...frame,cursor:0,window:{...w,x:BigInt(w.x)+1n}},{push:false});
 }
 function time(epoch){V.int(epoch,'model history epoch',0,60);V.assert(world,'selected world required');return apply({...frame,epoch});}
 function searchWorlds({goal='ANY',cursor=null,maxWorlds=12,maxSystemQueries=128,limit=6}={}){
  let body=frame.body;if(!body||body.kind==='star'){V.assert(frame.system,'Choose a system before surveying nearby worlds');const children=AS.systemChildren({ctx,system:frame.system});body=children.planets[0];}
  V.assert(body,'choose a system with a planet before modeled-world survey');
  return query('v1.query.world-candidates',{address:[],cursor,limit,filters:{goal,maxWorlds,maxSystemQueries}},body);
 }
 function snapshot(){return Object.freeze({version:VERSION,revision,stage:frame.stage,node:frame.node,galaxy:frame.galaxy,region:frame.region,neighborhood:frame.hood,system:frame.system,body:frame.body,point:frame.point,selectedObjectId:frame.objectId,world,local,micro:micro?.snapshot()||null,rows:Object.freeze([...rows]),page,historyDepth:history.length,maxHistory:MAX_HISTORY,discoveryCacheEntries:cache.size,discoveryCacheLimit:12,traversal:traversal.snapshot(),metrics:Object.freeze({...metrics}),lastError,authority:'DERIVED',modelAuthority:'MODEL_DERIVED_SIMULATION',canonicalMutation:false});}
 function activate(node){if(node.kind==='galaxy')return enterGalaxy(node);if(node.kind==='galactic_region')return enterRegion(node);if(node.kind==='system')return enterSystem(node);return enterBody(node);}
 discover();
 return Object.freeze({VERSION,ctx,universe,seed,seedGraph,traversal,SURFACE,REGIMES,stages,snapshot,query,graphForKey,activate,enterGalaxy,enterRegion,enterNeighborhood,enterSystem,enterBody,enterKey,approach,at,inspectAtmosphere,scale,selectObject,enterMicro,deeper,back,nextPage,nextWindow,time,searchWorlds,onChange(fn){V.assert(typeof fn==='function','listener');listeners.add(fn);return()=>listeners.delete(fn);}});
}
O.v1LivingRuntime=Object.freeze({VERSION,MAX_HISTORY,MAX_ROWS,SURFACE,REGIMES,stages,create});
})(globalThis);

(function(root){
'use strict';
const O=root.OFU=root.OFU||{},C=O.pxContracts,P=O.pxProduct,V=O.v1Common,W=O.v1World,A=O.v1Astronomy;
if(!C||!P||!V||!W||!A)throw new Error('v1 provider prerequisites missing');
const VERSION='ofu-v1-provider-bindings-1',registry=P.registry,cache=new Map(),metrics={worldBuilds:0,worldCacheHits:0,invocations:0,discoveredGalaxies:0};
const safe=value=>C.data(JSON.parse(JSON.stringify(value,(_k,v)=>typeof v==='bigint'?String(v):v instanceof Uint8Array?O.p2.hex(v):v)),{bytes:1048576,nodes:32768});
function keyFromSelection(selection){const out={};for(const part of selection.target.address){const pos=part.indexOf('=');C.assert(pos>0,'IDENTITY','v1 canonical address');const k=part.slice(0,pos),v=part.slice(pos+1);C.assert(/^-?\d{1,20}$/.test(v),'IDENTITY','v1 canonical integer');out[k]=BigInt(v);}for(const k of ['galaxyX','galaxyY','galaxyZ','sectorX','sectorY','sectorZ','siteX','siteY','siteZ','orbitSlot'])C.assert(Object.hasOwn(out,k),'IDENTITY','v1 missing '+k);return out;}
function verifySelection(selection){const actual=P.captured(keyFromSelection(selection));C.assert(C.stable(actual.selection)===C.stable(selection),'IDENTITY','v1 request changed canonical selection/time');return actual;}
function worldFor(selection){const actual=verifySelection(selection),cacheKey=actual.selection.target.entityId+':'+actual.selection.time.historyDigest;if(cache.has(cacheKey)){metrics.worldCacheHits++;return cache.get(cacheKey);}const key=keyFromSelection(selection),raw=O.p3Astronomy.planetaryInputSnapshot(root.__OFU_PLANET_PREVIEW__.ctx,key),canonicalInput=safe(raw),world=W.build({universeId:selection.target.universeId,planetIdentity:selection.target.entityId,galaxyAddress:[key.galaxyX,key.galaxyY,key.galaxyZ].join(','),systemAddress:[key.sectorX,key.sectorY,key.sectorZ,key.siteX,key.siteY,key.siteZ].join(','),canonicalInput});metrics.worldBuilds++;if(cache.size===16)cache.delete(cache.keys().next().value);cache.set(cacheKey,world);return world;}
// Moon facts remain P3 facts. Stellar forcing comes from its canonical parent orbit;
// bulk composition and radius are explicit reduced-model assumptions, not new P3 claims.
const bodyCache=new Map();
function worldForBody(selection,satelliteSlot=null){
 if(satelliteSlot===null||satelliteSlot===undefined)return worldFor(selection);
 C.assert(Number.isSafeInteger(satelliteSlot)&&satelliteSlot>=0&&satelliteSlot<8,'QUERY','satellite slot');verifySelection(selection);
 const key=keyFromSelection(selection),mk={...key,satelliteSlot:BigInt(satelliteSlot)},ctx=root.__OFU_PLANET_PREVIEW__.ctx,m=O.p3Astronomy.resolveMoon(ctx,mk);
 C.assert(m?.status==='PRESENT','QUERY','canonical moon absent');const id=O.p2.hex(m.id),ck=id+':'+selection.time.historyDigest;
 if(bodyCache.has(ck))return bodyCache.get(ck);
 const input=safe(O.p3Astronomy.planetaryInputSnapshot(ctx,key));
 const bodyContext={kind:'MOON',canonicalBodyId:id,parentPlanetId:selection.target.entityId,canonicalFacts:safe(m.facts),
  stellarForcing:'CANONICAL_PARENT_STELLAR_ORBIT_APPROXIMATION',composition:'REDUCED_ROCK_OR_PARENT_VOLATILE_PRIOR',
  radius:'CONSTANT_EARTH_DENSITY_PROXY',eclipseAndTidalHistory:'NOT_MODELED',assumptionAuthority:'MODEL_DERIVED_SIMULATION'};
 const w=W.build({universeId:selection.target.universeId,planetIdentity:id,galaxyAddress:[key.galaxyX,key.galaxyY,key.galaxyZ].join(','),systemAddress:[key.sectorX,key.sectorY,key.sectorZ,key.siteX,key.siteY,key.siteZ].join(','),canonicalInput:input,bodyContext});
 if(bodyCache.size>=8)bodyCache.delete(bodyCache.keys().next().value);bodyCache.set(ck,w);return w;
}
function payloadWorld(q){const w=worldForBody(q.selection,q.payload?.satelliteSlot??null);if(q.payload?.historyEpoch==null)return w;const epoch=q.payload.historyEpoch;V.int(epoch,'historyEpoch',0,60);return {...w,civilization:O.v1WorldContext.historyAt(w,epoch)};}
function bind(id,fn){const d=registry.descriptor(id);registry.bind(id,'v1','1.0.0',{handle(q,m){metrics.invocations++;verifySelection(q.selection);let operations=0,entities=0;const meter={consume(n=1,count=0){m.consume(n,count);operations+=n;entities+=count;}};const value=safe(fn(q,meter));meter.consume(1,Array.isArray(value?.galaxies)?value.galaxies.length:1);const bytes=Math.max(1,new TextEncoder().encode(C.stable(value)).length);return{contract:C.VERSION,provider:id,version:d.version,authority:d.authority,selection:q.selection,fidelity:d.fidelity,usage:{entities,bytes,operations,queue:0},value};}});}
bind('v1.domain.modeled-world',q=>{const w=worldFor(q.selection);return{version:w.version,planetIdentity:w.planetIdentity,canonicalInputDigest:w.canonicalInputDigest,biologyState:w.biology.occupancy.state,civilizationState:w.civilization.state,microscopicAvailable:w.materialInspectionAvailable,legacyBiologicalMicroAvailable:!!w.microscopic,authority:'MODEL_DERIVED_SIMULATION',canonicalPromotion:false};});
bind('v1.model.astronomy',q=>worldFor(q.selection).astronomy);
bind('v1.query.galaxies',(q,meter)=>{const query=C.discovery(q.payload),cursor=query.cursor===null?0:Number(query.cursor);C.assert(Number.isSafeInteger(cursor)&&cursor>=0,'QUERY','v1 galaxy cursor');C.assert(query.limit<=q.budget.entities,'BUDGET','v1 galaxy limit');meter.consume(1);const cellPrefix=query.address.length?query.address.join('/'):'origin',value=A.discoverGalaxies({universeId:q.selection.target.universeId,cellPrefix,cursor,limit:Math.min(query.limit,64)});metrics.discoveredGalaxies+=value.galaxies.length;return value;});
function shiftSystemKey(base,dx,dy,dz){const axis=(sector,site,delta)=>{let a=BigInt(sector)*512n+BigInt(site)+BigInt(delta),q=a/512n,r=a%512n;if(r<0n){q--;r+=512n}return[q,r]},[sectorX,siteX]=axis(base.sectorX,base.siteX,dx),[sectorY,siteY]=axis(base.sectorY,base.siteY,dy),[sectorZ,siteZ]=axis(base.sectorZ,base.siteZ,dz);return{...base,sectorX,siteX,sectorY,siteY,sectorZ,siteZ,orbitSlot:0n};}
const WORLD_OFFSETS=Object.freeze((()=>{const out=[];for(let z=-8;z<=8;z++)for(let y=-8;y<=8;y++)for(let x=-8;x<=8;x++)out.push(Object.freeze({x,y,z,d2:x*x+y*y+z*z}));out.sort((a,b)=>a.d2-b.d2||a.z-b.z||a.y-b.y||a.x-b.x);return out})()),candidateCache=new Map();
bind('v1.query.world-candidates',(q,meter)=>{
 const query=C.discovery(q.payload),f=query.filters||{},goal=String(f.goal||'ANY').toUpperCase();
 C.assert(query.address.length===0,'QUERY','candidate search is relative to selected context');
 const maxSystemQueries=Number(f.maxSystemQueries??128),maxWorlds=Number(f.maxWorlds??24);
 C.assert(['ANY','STERILE','BIOSPHERE','CIVILIZATION'].includes(goal),'QUERY','v1 candidate goal');
 C.assert(Number.isSafeInteger(maxSystemQueries)&&maxSystemQueries>=1&&maxSystemQueries<=256,'BUDGET','v1 system query page cap');
 C.assert(Number.isSafeInteger(maxWorlds)&&maxWorlds>=1&&maxWorlds<=32,'BUDGET','v1 world page cap');
 C.assert(query.limit<=16&&query.limit<=q.budget.entities,'BUDGET','v1 candidate result cap');
 const cursor=String(query.cursor??'0:0');C.assert(/^\d{1,5}(:\d{1,2})?$/.test(cursor),'QUERY','candidate cursor');
 let [index,slot=0]=cursor.split(':').map(Number);
 C.assert(index<=WORLD_OFFSETS.length&&slot<=10,'QUERY','candidate cursor bounds');
 const cacheKey=[q.selection.target.entityId,goal,cursor,maxSystemQueries,maxWorlds,query.limit].join('|');
 if(candidateCache.has(cacheKey)){metrics.candidateCacheHits=(metrics.candidateCacheHits||0)+1;return candidateCache.get(cacheKey);}
 const base=keyFromSelection(q.selection),candidates=[];let systemQueries=0,worlds=0;
 while(index<WORLD_OFFSETS.length&&systemQueries<maxSystemQueries&&worlds<maxWorlds&&candidates.length<query.limit){
   const off=WORLD_OFFSETS[index],sk=shiftSystemKey(base,off.x,off.y,off.z),system=O.p3Astronomy.resolveSystem(root.__OFU_PLANET_PREVIEW__.ctx,sk);
   systemQueries++;meter.consume(1);
   if(system?.status!=='PRESENT'){index++;slot=0;continue;}
   const count=Number(system.facts.planetCount||0n);
   while(slot<count&&worlds<maxWorlds&&candidates.length<query.limit){
     const key={...sk,orbitSlot:BigInt(slot++)},selection=O.pxProduct.captured(key).selection,w=worldFor(selection);worlds++;meter.consume(1);
     const bio=w.biology.occupancy.state,civ=w.civilization.state;
     if(goal==='ANY'||goal==='STERILE'&&bio!=='MODELED_BIOSPHERE'||goal==='BIOSPHERE'&&bio==='MODELED_BIOSPHERE'||goal==='CIVILIZATION'&&civ==='MODELED_CIVILIZATION')
       candidates.push({planetIdentity:w.planetIdentity,canonicalKey:Object.fromEntries(Object.entries(key).map(([k,v])=>[k,String(v)])),systemOffset:{x:off.x,y:off.y,z:off.z},biologyState:bio,civilizationState:civ,microscopicAvailable:!!w.microscopic,materialInspectionAvailable:true,surfaceTemperatureMilliK:w.planetology.climate.surfaceTemperatureMilliK,waterAreaPpm:w.planetology.hydrosphere.waterAreaPpm,authority:'MODEL_DERIVED_SIMULATION'});
   }
   if(slot>=count){index++;slot=0;}
 }
 const result={goal,candidates,nextCursor:index<WORLD_OFFSETS.length?index+':'+slot:null,systemQueries,worldsEvaluated:worlds,maxSystemQueries,maxWorlds,offsetPopulation:WORLD_OFFSETS.length,globalEnumeration:false,boundedSearch:true,canonicalP6Unchanged:true,authority:'MODEL_DERIVED_SIMULATION'};
 metrics.candidatePages=(metrics.candidatePages||0)+1;if(candidateCache.size>=32)candidateCache.delete(candidateCache.keys().next().value);candidateCache.set(cacheKey,result);return result;
});
bind('v1.model.planetology',q=>worldFor(q.selection).planetology);
bind('v1.model.biology',q=>worldFor(q.selection).biology);
bind('v1.model.civilization',q=>worldFor(q.selection).civilization);
bind('v1.model.microscopic',q=>{const w=worldFor(q.selection);return w.microscopic?{supported:true,...w.microscopic}:{supported:false,reason:'NO_MODELED_BIOSPHERE_CONTEXT',authority:'MODEL_DERIVED_SIMULATION'};});
bind('v1.inspector.world',q=>{const w=worldFor(q.selection),p=w.planetology,b=w.biology,c=w.civilization;return{title:'Modeled world',summary:b.occupancy.biosphereEstablished?'This scenario supports a modeled biosphere.':'This scenario is sterile under the current modeled prerequisites/occupancy.',fields:[{name:'Planet class',value:p.bulkPriorClass,unit:''},{name:'Modeled surface temperature',value:p.climate.surfaceTemperatureMilliK,unit:'mK'},{name:'Modeled water area',value:p.hydrosphere.waterAreaPpm,unit:'ppm'},{name:'Biology',value:b.occupancy.state,unit:''},{name:'Civilization',value:c.state,unit:''},{name:'Contextual material inspection',value:w.materialInspectionAvailable?'AVAILABLE':'UNAVAILABLE',unit:''},{name:'Legacy biological sample',value:w.microscopic?'AVAILABLE':'UNAVAILABLE',unit:''}],authority:'MODEL_DERIVED_SIMULATION',canonicalBiologyUnchanged:true,canonicalPromotion:false};});
bind('v1.representation.microscopic',q=>({spatialHandoff:'human',sourceHandoffs:['local_surface','human'],regimeOrder:['material','microstructure','molecular','atomic'],regimes:{material:{mode:'SOURCE_MATERIAL_DESCRIPTOR',requires:'actual selected object'},microstructure:{mode:'REPRESENTATIVE_VOLUME',requires:'source material'},molecular:{mode:'REPRESENTATIVE_CHEMISTRY',requires:'resolved source or explicitly modeled chemistry'},atomic:{mode:'BOUNDED_ATOMIC_REPRESENTATION',requires:'resolved representative unit',classicalElectronTrajectories:false}},legacy:{regimeOrder:['tissue','cell','molecular','atomic'],regimes:O.v1Microscopic.REGIMES},geometricZoomClaim:false,sourceContextReturn:'EXACT_WORLD_AND_LOCATION_AND_OBJECT',syntheticAtomicAuthority:'PRESENTATION_ONLY',sourceBackedAtomicAuthority:'DERIVED',worldIdentity:q.selection.target.entityId}));
bind('v1.interaction.universal-exploration',q=>({spatialScales:['galaxy','galactic_region','stellar_neighborhood','system','orbit','approach','global_surface','regional_surface','local_surface','human'],modelRegimes:['material','microstructure','molecular','atomic'],legacyModelRegimes:['tissue','cell','molecular','atomic'],contextRoot:'universe',directManipulation:true,reverseTraversal:true,worldChangesRequireP4Admission:true,authority:'PRESENTATION_ONLY',selectionIdentity:q.selection.target.entityId}));
bind('v1.persistence.session',q=>({codec:'OFU-V1-SESSION',schemaVersion:1,portableAuthoritative:true,browserStorageConvenience:true,universeId:q.selection.target.universeId,providerManifestDigest:registry.snapshot().manifestDigest,historyDigest:q.selection.time.historyDigest,operation:q.operation,exactCompatibility:true,canonicalMutation:false}));
bind('v1.representation.audio-context',q=>{const scale=String(q.payload?.scale||'unknown'),surface=['global_surface','regional_surface','local_surface','human'].includes(scale),w=worldFor(q.selection);return{scale,surface,userActivated:true,autoplay:false,naturalVacuumAcousticsClaim:false,environmentalAudioAllowed:surface&&Number(w.planetology.atmosphere.inventoryUnits||0)>0,authority:'PRESENTATION_ONLY'};});
bind('v1.interaction.player-agency',q=>{C.keys(q.payload,['kind','parameters']);const kind=String(q.payload.kind||'').toUpperCase(),allowed=['MEASURE','SAMPLE','EXPERIMENT','ECOLOGY_INTERVENTION','BIOLOGICAL_SEEDING'];C.assert(allowed.includes(kind),'CAPABILITY','unsupported v1 player action');const parameters=C.data(q.payload.parameters,{bytes:32768,nodes:2048}),w=worldFor(q.selection),needsBio=kind==='ECOLOGY_INTERVENTION',needsSterile=kind==='BIOLOGICAL_SEEDING',hasBio=w.biology.occupancy.state==='MODELED_BIOSPHERE',admissible=needsBio?hasBio:needsSterile?!hasBio:true;return{contract:'ofu-v1-intervention-admission-1',kind,parameters,admissible,reason:admissible?null:needsBio?'modeled biosphere required':needsSterile?'selected scenario already has a modeled biosphere':null,selectedPlanet:q.selection.target.entityId,biologyState:w.biology.occupancy.state,civilizationState:w.civilization.state,p4Required:true,canonicalMutation:false,canonicalP6Mutation:false,authority:'MODEL_DERIVED_SIMULATION'};});
function pointFor(w,payload){return O.v1WorldContext.location(w.planetIdentity,Number(payload?.latMicroDeg??0),Number(payload?.lonMicroDeg??0));}
bind('v1.query.environment',q=>{const w=payloadWorld(q);return O.v1WorldContext.sample(w.planetology,pointFor(w,q.payload),Number(q.payload?.seasonPpm??0));});
bind('v1.query.local-world',q=>{const w=payloadWorld(q);return O.v1WorldContext.localContext(w,pointFor(w,q.payload),{seasonPpm:Number(q.payload?.seasonPpm??0)});});
bind('v1.query.material-source',q=>{const w=payloadWorld(q);return O.v1WorldMaterials.sourceFor(w,pointFor(w,q.payload),String(q.payload?.objectId||''));});
bind('v1.query.model-history',q=>{const w=payloadWorld(q),state=O.v1WorldContext.historyAt(w,Number(q.payload?.epoch??w.civilization.epoch));return {worldIdentity:w.planetIdentity,state,archaeology:state.history?O.v1HistorySystem.archaeologicalEvidence(state.history,{settlements:state.settlements,infrastructure:state.infrastructure}):{status:'NO_CAUSAL_ARCHAEOLOGY',features:[],canonical:false},canonical:false,requiresP4Admission:true};});
bind('v1.query.ecology',q=>{const w=payloadWorld(q);return O.v1WorldContext.queryLife(w,pointFor(w,q.payload));});
bind('v1.query.body-world',q=>{const w=payloadWorld(q);return {planetIdentity:w.planetIdentity,bodyContext:w.bodyContext,biologyState:w.biology.occupancy.state,civilizationState:w.civilization.state,modelTime:w.modelTime,canonicalPromotion:false};});

bind('v1.scene.living-world',(q,meter)=>{
 const w=payloadWorld(q),mode=String(q.payload?.regime||'PLANET').toUpperCase(),P=O.v1WorldPresentation;
 if(mode==='PLANET'||mode==='APPROACH')return P.planetScene({world:w});
 if(mode==='CIVILIZATION')return P.civilizationScene({world:w});
 const point=O.v1WorldContext.location(w.planetIdentity,Number(q.payload?.latMicroDeg??0),Number(q.payload?.lonMicroDeg??0));
 if(['GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN'].includes(mode)){
  const grid=O.v1WorldContext.surfaceWindow(w,point,mode);meter.consume(grid.cells.length,grid.cells.length);
  return P.surfaceScene({world:w,cells:grid.cells.map(c=>({...c.sample,cellId:c.cellId,location:c.point,x:c.x/grid.cols,y:c.y/grid.rows})),scale:mode});
 }
 V.assert(['MATERIAL','MICROSTRUCTURE','MOLECULAR','ATOMIC'].includes(mode),'registered scene regime');
 const source=O.v1WorldMaterials.sourceFor(w,point,String(q.payload?.objectId||'')),session=O.v1MicroPipeline.createSession(source,{microFeatures:64,molecularUnits:24,atoms:96});
 const order=['MATERIAL','MICROSTRUCTURE','MOLECULAR','ATOMIC'];for(let i=0;i<=order.indexOf(mode);i++)session.step(-1);
 const result=P.microScene({representation:session.current(),regime:mode});meter.consume(Math.max(1,result.objects.length),result.objects.length);return result;
});
function snapshot(){return C.data({version:VERSION,cacheEntries:cache.size,cacheLimit:16,candidateCacheEntries:candidateCache.size,candidateCacheLimit:32,metrics,providers:['v1.domain.modeled-world','v1.model.astronomy','v1.query.galaxies','v1.query.world-candidates','v1.model.planetology','v1.model.biology','v1.model.civilization','v1.model.microscopic','v1.inspector.world','v1.representation.microscopic','v1.interaction.universal-exploration','v1.persistence.session','v1.interaction.player-agency','v1.representation.audio-context','v1.query.environment','v1.query.local-world','v1.query.material-source','v1.query.model-history','v1.query.ecology','v1.query.body-world','v1.scene.living-world']});}
O.v1Providers=Object.freeze({VERSION,worldFor,worldForBody,snapshot});
})(globalThis);

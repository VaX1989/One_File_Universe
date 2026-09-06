(function (root) {
'use strict';
const O = root.OFU, V = O.v1Common, E = O.v1PlanetEnvironment;
const B = O.v1Biology, L = O.v1LifeProvider, C = O.v1CivilizationRuntime;
if (!V || !E || !B || !L || !C) throw new Error('Wave A world-context dependencies required');
const VERSION = 'ofu-wave-a-world-context-1';
const AUTHORITY = 'MODEL_DERIVED_SIMULATION';
const CAPS = Object.freeze({surveySites:24, civilizationEpochs:12, localOrganisms:12, localObjects:24});
const clamp = (v, a=0, b=1000000) => Math.round(V.clamp(v,a,b));
function location(planetIdentity, latMicroDeg=0, lonMicroDeg=0) {
  V.text(planetIdentity,'planetIdentity',128);
  V.int(latMicroDeg,'latitude',-90000000,90000000);
  V.int(lonMicroDeg,'longitude',-Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER);
  const lon = ((lonMicroDeg+180000000)%360000000+360000000)%360000000-180000000;
  return Object.freeze({planetIdentity,latMicroDeg,lonMicroDeg:lon,
    locationIdentity:V.deriveId('world-location',planetIdentity,latMicroDeg,lon),
    referenceFrame:'BODY_FIXED_MODEL_MICRODEGREES_V1',authority:AUTHORITY,canonicalGeodesyClaim:false});
}
function sample(planet, point, seasonPpm=0) {
  V.int(seasonPpm,'seasonPpm',0,1000000);V.assert(point.planetIdentity===planet.planetIdentity,'surface sample identity');
  // Scientific detail is stable across rendering LOD: reducing draw density never changes a shoreline or identity.
  return E.sampleSurface(planet,{latMicroDeg:point.latMicroDeg,lonMicroDeg:point.lonMicroDeg,detailLevel:8,time:{seasonPpm}});
}
function localEnvironment(planet, s) {
  const base = B.environmentFromPlanetology(planet);
  const liquid = s.hydrology.surfaceLiquid;
  const water = clamp(s.material.waterContentPpm||0);
  const precipitation = clamp(s.climate.precipitationPotentialPpm||0);
  const temp = s.climate.localMeanTemperatureMilliK;
  const solid = s.hydrology.surfaceState !== 'NO_SOLID_SURFACE_REFERENCE';
  const medium = solid && temp>=245000 && temp<=390000 && (liquid || water>=50000 || precipitation>=100000 || s.hydrology.subsurfaceIcePotentialPpm>=400000);
  return Object.freeze({...base,mediumAvailable:medium,
    stableSolventPpm:medium?clamp(Math.max(water,precipitation,liquid?850000:0)):0,
    temperatureCompatibilityPpm:clamp(1000000-Math.abs(temp-288000)*1000000/240000),
    nutrientAvailabilityPpm:clamp(base.nutrientAvailabilityPpm*.65+(s.geology.erosionPpm||0)*.35),
    oceanSupportPpm:liquid?850000:0,
    disturbancePpm:clamp(base.disturbancePpm*.65+(s.geology.volcanicActivityPpm||0)*.35),
    sourceLocation:s.location.locationIdentity,sourceModel:E.VERSION});
}
function queryLife(world, point, surfaceSample=null) {
  const s=surfaceSample||sample(world.planetology,point), env=localEnvironment(world.planetology,s);
  const regionIdentity=V.deriveId('ecology-region',world.planetIdentity,
    Math.floor((point.latMicroDeg+90000000)/5000000),Math.floor((point.lonMicroDeg+180000000)/5000000));
  const region=L.queryRegion(world.biology,{regionIdentity,environment:env,capacity:24});
  const local=L.queryLocal(region,{locationIdentity:point.locationIdentity,capacity:CAPS.localOrganisms});
  return V.freezeDeep({region,local,environment:env,answers:O.v1Ecology.answers(region,local)});
}
function survey(planet) {
  const out=[];
  for(let i=0;i<CAPS.surveySites;i++) {
    const lat=clamp(-75000000+(i+.5)*150000000/CAPS.surveySites,-90000000,90000000);
    const lon=(V.u32(VERSION,planet.planetIdentity,'survey',i)%360000000)-180000000;
    const point=location(planet.planetIdentity,lat,lon), s=sample(planet,point);
    out.push(Object.freeze({point,sample:s}));
  }
  return Object.freeze(out);
}
function geography(planet, biology, sites) {
  const regions=[];
  for(const {point,sample:s} of sites) {
    if(s.hydrology.surfaceState!=='LAND_OR_EXPOSED_SUBSTRATE') continue;
    const env=localEnvironment(planet,s), gate=B.environmentEligibility(env);
    if(!gate.eligible || biology.ecosystem.state!=='MODELED_BIOSPHERE') continue;
    const water=clamp(Math.max(s.material.waterContentPpm,s.climate.precipitationPotentialPpm,s.hydrology.runoffPpm));
    const food=clamp(gate.readiness.opportunityScorePpm);
    if(water<80000 || food<120000) continue;
    regions.push(Object.freeze({regionId:V.deriveId('civilization-region',planet.planetIdentity,point.locationIdentity),location:point,
      waterPpm:water,terrainPpm:1000000-clamp(s.topography.slopePpm),climatePpm:env.temperatureCompatibilityPpm,
      biologicalResourcePpm:food,materialResourcePpm:clamp((planet.composition.silicatePpm+planet.composition.metalPpm)*.7),
      energyAccessPpm:env.freeEnergyAvailabilityPpm,transportPpm:clamp(700000-s.topography.slopePpm*.6),
      defensePpm:clamp(200000+s.topography.slopePpm*.5),barrierPpm:clamp(s.topography.slopePpm),
      carryingCapacity:Math.max(100,Math.floor(food/35)),historicalInheritancePpm:0}));
  }
  return Object.freeze(regions);
}
function placeCivilization(state, regions) {
  if(state.state!=='MODELED_CIVILIZATION') return state;
  const byRegion=new Map(regions.map(r=>[r.regionId,r]));
  const settlements=state.settlements.map(s=>{
    const r=byRegion.get(s.regionId);V.assert(r?.location,'settlement must have a modeled terrain location');
    return Object.freeze({...s,location:r.location,latitudeDeg:r.location.latMicroDeg/1e6,longitudeDeg:r.location.lonMicroDeg/1e6,
      geometryAuthority:AUTHORITY,canonicalPositionClaim:false});
  });
  const byId=new Map(settlements.map(s=>[s.settlementId,s]));
  const tradeEdges=state.tradeEdges.map(e=>Object.freeze({...e,
    endpoints:Object.freeze([byId.get(e.from)?.location,byId.get(e.to)?.location]),
    corridorGeometry:'SCHEMATIC_GEODESIC_BETWEEN_MODELED_ENDPOINTS',physicalTransportPathClaim:false}));
  return V.freezeDeep({...state,settlements,tradeEdges});
}
function civilization(planet, biology, sites, ageMyr) {
  const regions=geography(planet,biology,sites), candidate=biology.intelligence.candidates[0];
  const lineageId=candidate?.lineageId||V.deriveId('unestablished-lineage',planet.planetIdentity,'none');
  const population=candidate?.population||0;
  const readiness=B.environmentFromPlanetology(planet);
  const gate=C.eligibility({lineageId,intelligenceModelEligible:!!candidate&&regions.length>0,population,
    energySurplusPpm:clamp(readiness.freeEnergyAvailabilityPpm*.6),environmentStabilityPpm:readiness.environmentPersistencePpm});
  let state=C.initialize({worldIdentity:planet.planetIdentity,lineageId,population:Math.max(1,population),eligibility:gate,regions});
  const initial=state, epochs=Math.min(CAPS.civilizationEpochs,Math.floor(ageMyr/450));
  for(let i=0;i<epochs&&state.state==='MODELED_CIVILIZATION';i++) {
    state=C.step(state,{epochStep:5,climatePressurePpm:clamp(readiness.disturbancePpm),
      diseasePressurePpm:clamp((1000000-readiness.environmentPersistencePpm)*.15)});
  }
  return {state:placeCivilization(state,regions),initial,regions,gate};
}
function historyAt(world, epoch) {
  V.int(epoch,'modeled epoch',0,60);
  let c=world.civilizationOrigin;
  if(c.state!=='MODELED_CIVILIZATION') return placeCivilization(c,world.civilizationRegions);
  for(let t=0;t<epoch;t+=5)c=C.step(c,{epochStep:Math.min(5,epoch-t),
    climatePressurePpm:clamp(world.environmentReadiness.disturbancePpm),
    diseasePressurePpm:clamp((1000000-world.environmentReadiness.environmentPersistencePpm)*.15)});
  return placeCivilization(c,world.civilizationRegions);
}
function buildLife(planet, ageMyr) {
  const environment=B.environmentFromPlanetology(planet);
  // Coarse model epochs encode a bounded history projection, not measured generations per Myr.
  const evolutionEpochs=Math.min(16,Math.floor(ageMyr/250));
  return L.buildFromEnvironment({worldIdentity:planet.planetIdentity,environment,ageMyr,evolutionEpochs,
    generationsPerEpoch:600,occupancyParameterPpm:360000,energyBudgetUnits:1000000,populationCount:18});
}
function localContext(world, point, {seasonPpm=0}={}) {
  V.assert(point.planetIdentity===world.planetIdentity,'local context world identity');
  const s=sample(world.planetology,point,seasonPpm),life=queryLife(world,point,s), objects=[];
  const add=(kind,id,label,extra={})=>objects.push(Object.freeze({kind,entityId:id,label,location:point,worldIdentity:world.planetIdentity,authority:AUTHORITY,...extra}));
  if(s.hydrology.surfaceState==='NO_SOLID_SURFACE_REFERENCE') {
    add('ATMOSPHERE',V.deriveId('material-sample',point.locationIdentity,'atmosphere'),'Atmospheric sample');
  } else {
    const kind=s.hydrology.surfaceLiquid?'WATER':s.hydrology.surfaceState.includes('ICE')?'ICE':'ROCK';
    add(kind,V.deriveId('material-sample',point.locationIdentity,kind),s.material.materialFamily.replaceAll('_',' ').toLowerCase(),{surfaceSample:s});
    for(const pop of life.local.populations.slice(0,6))add('ORGANISM',V.deriveId('local-organism',point.locationIdentity,pop.populationId),pop.role.replaceAll('_',' ').toLowerCase(),{population:pop,morphology:B.morphologyHints(pop)});
    for(const settlement of world.civilization.settlements||[]) {
      if(settlement.location.locationIdentity!==point.locationIdentity)continue;
      add(settlement.status==='ACTIVE'?'SETTLEMENT':'RUIN',settlement.settlementId,settlement.type.toLowerCase(),{settlement});
      if(world.civilization.technology.materials>=1)add('ARTIFACT',V.deriveId('manufactured-sample',settlement.settlementId,'construction'), 'Construction material',{settlement,technologySupported:true});
    }
  }
  V.assert(objects.length<=CAPS.localObjects,'local object bound');
  return V.freezeDeep({planetIdentity:world.planetIdentity,point,surface:s,life,objects,authority:AUTHORITY,
    committedCanonicalHistory:false,canonicalP6Unchanged:true});
}

function surfaceWindow(world, point, stage='LOCAL_SURFACE') {
  V.assert(['GLOBAL_SURFACE','REGIONAL_SURFACE','LOCAL_SURFACE','HUMAN'].includes(stage),'surface window regime');
  V.assert(point.planetIdentity===world.planetIdentity,'surface window source identity');
  const span=stage==='GLOBAL_SURFACE'?360:stage==='REGIONAL_SURFACE'?30:stage==='LOCAL_SURFACE'?.24:.00004;
  const latSpan=stage==='GLOBAL_SURFACE'?180:span*.66,cols=16,rows=12,cells=[];
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const lat=stage==='GLOBAL_SURFACE'?90000000-(y+.5)*180000000/rows:point.latMicroDeg+((rows/2-y-.5)/rows)*latSpan*1e6;
   const lon=stage==='GLOBAL_SURFACE'?-180000000+(x+.5)*360000000/cols:point.lonMicroDeg+((x+.5-cols/2)/cols)*span*1e6;
   const at=location(world.planetIdentity,Math.round(Math.max(-90000000,Math.min(90000000,lat))),Math.round(lon));
   cells.push({x,y,point:at,sample:sample(world.planetology,at),cellId:at.locationIdentity});
  }
  return V.freezeDeep({cells,span,latSpan,cols,rows,authority:AUTHORITY,maxCells:192});
}
O.v1WorldContext=Object.freeze({VERSION,AUTHORITY,CAPS,location,sample,localEnvironment,queryLife,survey,geography,buildLife,civilization,historyAt,localContext,surfaceWindow});
})(globalThis);

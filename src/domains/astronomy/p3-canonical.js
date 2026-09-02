(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const P=O.p2;
const E=O.p3AstronomyPrototype;
if(!P||!E)throw new Error('OFU P3 canonical requires P2 and the reviewed P3 engine');

const VERSION='p3-astronomy-1';
const SCHEMA_VERSION=1;
const BASELINE_EPOCH='P4_T0';
const MANIFEST=Object.freeze({
  semanticManifestVersion:1n,
  canonicalProtocolVersion:'ofu-cbv-1',
  canonicalAddressVersion:1n,
  unicodeProfileVersion:'ofu-unicode-15.1.0-v1',
  numericContractVersion:1n,
  generatorSuite:'p3-universe-skeleton',
  generatorSuiteVersion:1n,
  subsystems:Object.freeze({astronomy:1n}),
  domains:Object.freeze({astronomy:1n}),
  dependencies:Object.freeze({kernel:'p2'}),
  lawProfile:'p3-astronomy-baseline-v1',
  genesis:Object.freeze({baselineEpoch:BASELINE_EPOCH,schemaVersion:1n,modelVersion:VERSION})
});

const EVIDENCE=Object.freeze({
  regionDensity:Object.freeze({evidenceClass:'HYPOTHETICAL',modelFidelity:'STYLIZED'}),
  galaxyPopulation:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'APPROXIMATE'}),
  stellarMass:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'APPROXIMATE'}),
  multiplicity:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'STYLIZED'}),
  stellarEvolution:Object.freeze({evidenceClass:'ESTABLISHED',modelFidelity:'STYLIZED'}),
  planetOccurrence:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'STYLIZED'}),
  planetBulkPrior:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'APPROXIMATE'}),
  moons:Object.freeze({evidenceClass:'HYPOTHETICAL',modelFidelity:'STYLIZED'})
});

function facts(type,f){
  if(type==='REGION')return {
    galaxyCellSpan:f.galaxyCellSpan,galaxyCellSizeKpc:f.galaxyCellSizeKpc,densityQ16:f.densityQ16,
    anchorDensityQ16:f.anchorDensityQ16,environmentClass:f.environmentClass
  };
  if(type==='GALAXY')return {
    morphology:f.morphology,massLog10MilliDex:f.massLog10MilliDex,characteristicRadiusPc:f.characteristicRadiusPc,
    populationAgeMyr:f.populationAgeMyr,metallicityMilliDex:f.metallicityMilliDex,starFormationActivityQ16:f.starFormationActivityQ16,
    environmentDensityQ16:f.environmentDensityQ16,cellOffsetPc:f.cellOffsetPc,orientation:f.orientation
  };
  if(type==='SECTOR')return {
    sectorSizePc:f.sectorSizePc,systemSiteAxis:f.systemSiteAxis,systemSiteResolutionMilliParsec:f.systemSiteResolutionMilliParsec,
    distanceFromGalaxyCenterPc:f.distanceFromGalaxyCenterPc,localStellarDensityQ16:f.localStellarDensityQ16,
    systemOccupancyQ32:f.systemOccupancyQ32,computationalPartition:true
  };
  if(type==='SYSTEM')return {
    stellarComponentCount:f.stellarComponentCount,baselineAgeMyr:f.ageMyr,baselineMetallicityMilliDex:f.metallicityMilliDex,
    baselinePrimaryMassMilliSolar:f.primaryMassMilliSolar,baselineBarycentricScaleMilliAu:f.barycentricScaleMilliAu,
    protoplanetarySolidBudgetPermille:f.protoplanetarySolidBudgetPermille,planetCount:f.planetCount,planetArchitecture:f.planetArchitecture,
    normalizedAbsoluteSite:f.localSite,baselineLocalOffsetMilliPc:f.localOffsetMilliPc
  };
  if(type==='STAR')return {
    baselineMassMilliSolar:f.massMilliSolar,baselineAgeMyr:f.ageMyr,baselineMetallicityMilliDex:f.metallicityMilliDex,
    baselineEvolutionaryClass:f.evolutionaryClass,baselineTemperatureK:f.temperatureK,baselineRadiusMilliSolar:f.radiusMilliSolar,
    baselineLuminosityMilliSolar:f.luminosityMilliSolar,mainSequenceLifetimeMyr:f.mainSequenceLifetimeMyr
  };
  if(type==='PLANET')return {
    baselineSemiMajorAxisMicroAu:f.semiMajorAxisMicroAu,baselineEccentricityPpm:f.eccentricityPpm,
    baselineInclinationMilliDeg:f.inclinationMilliDeg,baselineMassMilliEarth:f.massMilliEarth,
    bulkPriorClass:f.compositionClass,baselineInsolationPpm:f.insolationPpm,moonCount:f.moonCount,orbitCenter:f.orbitCenter
  };
  if(type==='MOON')return {
    baselineOrbitalRadiusPlanetRadiiMilli:f.orbitalRadiusPlanetRadiiMilli,baselineMassMilliEarth:f.massMilliEarth,
    baselineInclinationMilliDeg:f.inclinationMilliDeg
  };
  throw new Error('OFU P3 canonical: unknown entity type '+type);
}

function canon(raw){
  if(!raw||raw.status!=='PRESENT')return Object.freeze({...raw,schemaVersion:SCHEMA_VERSION,modelVersion:VERSION,baselineEpoch:BASELINE_EPOCH});
  return Object.freeze({schemaVersion:SCHEMA_VERSION,modelVersion:VERSION,baselineEpoch:BASELINE_EPOCH,status:'PRESENT',entityType:raw.entityType,id:raw.id,address:raw.address,key:raw.key,facts:Object.freeze(facts(raw.entityType,raw.facts)),relations:Object.freeze({...raw.relations})});
}
function resolve(method,ctx,key,meter,depth){return canon(E[method](ctx,key,meter,depth))}
function resolveRegion(ctx,key,meter,depth){return resolve('resolveRegion',ctx,key,meter,depth)}
function resolveGalaxy(ctx,key,meter,depth){return resolve('resolveGalaxy',ctx,key,meter,depth)}
function resolveSector(ctx,key,meter,depth){return resolve('resolveSector',ctx,key,meter,depth)}
function resolveSystem(ctx,key,meter,depth){return resolve('resolveSystem',ctx,key,meter,depth)}
function resolveStar(ctx,key,meter,depth){return resolve('resolveStar',ctx,key,meter,depth)}
function resolvePlanet(ctx,key,meter,depth){return resolve('resolvePlanet',ctx,key,meter,depth)}
function resolveMoon(ctx,key,meter,depth){return resolve('resolveMoon',ctx,key,meter,depth)}
function resolveWithMetrics(kind,ctx,key){const q=E.resolveWithMetrics(kind,ctx,key);return {result:canon(q.result),metrics:q.metrics}}
function canonicalEnvelope(entity){if(!entity||entity.status!=='PRESENT')return entity;return {entityIdentity:entity.id,entityType:entity.entityType,canonicalFacts:entity.facts,relations:entity.relations,schemaVersion:SCHEMA_VERSION,modelVersion:VERSION,baselineEpoch:BASELINE_EPOCH}}
function digestFact(entity){return O.sha256.digest(P.encode(canonicalEnvelope(entity)))}
function semanticManifest(){return MANIFEST}
function semanticManifestHash(){return P.semanticManifestHash(MANIFEST)}
function planetaryInputSnapshot(ctx,key){
  const planet=resolvePlanet(ctx,key);if(planet.status!=='PRESENT')return {contractId:'ofu-p3-p5-planetary-input-v1',status:'ABSENT',reason:planet.reason};
  const system=resolveSystem(ctx,key);const star=resolveStar(ctx,{...key,componentIndex:0n});
  return Object.freeze({contractId:'ofu-p3-p5-planetary-input-v1',p3SchemaVersion:1n,baselineEpoch:BASELINE_EPOCH,planetId:planet.id,
    system:Object.freeze({systemId:system.id,baselineAgeMyr:system.facts.baselineAgeMyr,baselineMetallicityMilliDex:system.facts.baselineMetallicityMilliDex,planetArchitecture:system.facts.planetArchitecture}),
    host:Object.freeze({starId:star.id,baselineMassMilliSolar:star.facts.baselineMassMilliSolar,baselineEvolutionaryClass:star.facts.baselineEvolutionaryClass,baselineTemperatureK:star.facts.baselineTemperatureK,baselineLuminosityMilliSolar:star.facts.baselineLuminosityMilliSolar}),
    orbit:Object.freeze({orbitSlot:planet.key.orbitSlot,orbitCenter:planet.facts.orbitCenter,baselineSemiMajorAxisMicroAu:planet.facts.baselineSemiMajorAxisMicroAu,baselineEccentricityPpm:planet.facts.baselineEccentricityPpm,baselineInclinationMilliDeg:planet.facts.baselineInclinationMilliDeg,baselineInsolationPpm:planet.facts.baselineInsolationPpm}),
    formation:Object.freeze({baselineMassMilliEarth:planet.facts.baselineMassMilliEarth,bulkPriorClass:planet.facts.bulkPriorClass,protoplanetarySolidBudgetPermille:system.facts.protoplanetarySolidBudgetPermille})
  });
}

O.p3Astronomy=Object.freeze({VERSION,SCHEMA_VERSION,BASELINE_EPOCH,MANIFEST,EVIDENCE,DOMAIN:E.DOMAIN,constants:E.constants,
  resolveRegion,resolveGalaxy,resolveSector,resolveSystem,resolveStar,resolvePlanet,resolveMoon,resolveWithMetrics,
  canonicalEnvelope,digestFact,semanticManifest,semanticManifestHash,planetaryInputSnapshot,
  environmentDensityQ16:E.environmentDensityQ16,containingRegionCoords:E.containingRegionCoords,
  diagnostics:Object.freeze({absoluteSystemSite:E.diagnostics.absoluteSystemSite,samplePrimaryMassMilliSolar:E.diagnostics.samplePrimaryMassMilliSolar,multiplicityComponentCount:E.diagnostics.multiplicityComponentCount,chooseMorphology:E.diagnostics.chooseMorphology,sampleGalaxyMassMilliDex:E.diagnostics.sampleGalaxyMassMilliDex})
});
})(typeof globalThis!=='undefined'?globalThis:this);

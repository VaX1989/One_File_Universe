(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,A=O.v1Astronomy,P=O.v1Planetology,E=O.v1PlanetEnvironment,B=O.v1Biology,CV=O.v1Civilization,M=O.v1Microscopic;
if(!V||!A||!P||!E||!B||!CV||!M)throw new Error('v1 domain models required');
const VERSION='ofu-v1-modeled-world-2';
const SOURCE_BRANCHES=Object.freeze([
  "parallel/v1-wave-a-planetology-environment-2026-09-05@54c4f64496e111dec092d940414098749ce45fc0",
  "parallel/v1-wave-a-life-evolution-2026-09-05@98a35b72ebee2febc9ec1ef6ecb21f2402d1144b",
  "parallel/v1-wave-a-civilization-history-2026-09-05@7faeae2780d0413b95f2e7996dc4a9bc5c863553",
  "parallel/v1-wave-a-microscopic-reality-2026-09-05@fec8566ea367ab9bf14042d199e8b9cfc82ce20b",
  "parallel/v1-wave-a-universal-exploration-2026-09-05@79239193513b582bfa7b2ed37ceca9316bb52417",
  "parallel/v1-wave-a-world-rendering-2026-09-05@1f077a706e4b9e3eaceccb82c4a632d623c57b80"
]);
const AUTH=V.authority('v1.modeled-world','1.0.0',SOURCE_BRANCHES,'Cross-domain modeled state consumes preserved canonical identity/facts and never replaces P3/P4/P5/P6 authority.',[
 'Planet radius, environmental readiness, biosphere occupancy, intelligence eligibility and civilization state are bounded scenario-model outputs, not observations.',
 'Canonical P6 biology remains unchanged and may remain fail-closed while this separate modeled pathway is explored.',
 'Civilization and environment event proposals are not committed P4 history until admitted through a governed temporal transition.'
]);
function radiusEstimateKm(bulkClass,massMilliEarth){V.int(massMilliEarth,'massMilliEarth',1,1000000000);let radius;if(bulkClass==='GAS_GIANT')radius=22000+Math.min(65000,Math.floor(massMilliEarth/5));else if(bulkClass==='ICE_GIANT')radius=12000+Math.min(28000,Math.floor(massMilliEarth/6));else radius=3400+Math.min(12000,Math.floor(massMilliEarth*46/100));return V.clamp(radius,1200,90000);}
function temperatureCompatibilityPpm(surfaceTemperatureMilliK){V.int(surfaceTemperatureMilliK,'surfaceTemperatureMilliK',0,2000000);const delta=Math.abs(surfaceTemperatureMilliK-288000);return V.clamp(1000000-Math.floor(delta*1000000/240000),0,1000000);}
function environmentalReadiness(planet){return B.environmentFromPlanetology(planet);}
function build({universeId,planetIdentity,galaxyAddress,systemAddress,canonicalInput,bodyContext=null}){
 V.text(universeId,'universeId',128);V.text(planetIdentity,'planetIdentity',128);V.text(galaxyAddress,'galaxyAddress',128);V.text(systemAddress,'systemAddress',128);V.assert(canonicalInput&&canonicalInput.status!=='ABSENT','canonicalInput');
 const regionCell=galaxyAddress+':'+systemAddress.split(',').slice(0,3).join(','),ids=A.hierarchy({universeId,galaxyCell:galaxyAddress,regionCell,systemAddress,stellarOrdinal:0});
 const birth=Object.freeze({...A.systemBirthContext({universeId,galaxyCell:galaxyAddress,regionCell,systemAddress,stellarOrdinal:0,environmentPpm:V.unitPpm(VERSION,ids.galaxyIdentity,'environment'),radialPpm:V.unitPpm(VERSION,ids.galacticRegionIdentity,'radial'),heightPpm:V.unitPpm(VERSION,ids.galacticRegionIdentity,'height')}),canonicalHostStarId:String(canonicalInput.host.starId)});
 const isMoon=bodyContext?.kind==='MOON',massMilliEarth=Number(isMoon?bodyContext.canonicalFacts.baselineMassMilliEarth:canonicalInput.formation.baselineMassMilliEarth),bulkPriorClass=isMoon?(canonicalInput.formation.bulkPriorClass==='VOLATILE_RICH'?'VOLATILE_RICH':'TERRESTRIAL'):canonicalInput.formation.bulkPriorClass,radiusKm=isMoon?Math.max(60,Math.round(6371*Math.cbrt(massMilliEarth/1000))):radiusEstimateKm(bulkPriorClass,massMilliEarth),stellarLuminosityMilliSolar=Number(canonicalInput.host.baselineLuminosityMilliSolar),orbitMilliAu=Math.max(1,Math.floor(Number(canonicalInput.orbit.baselineSemiMajorAxisMicroAu)/1000)),ageMyr=Number(canonicalInput.system.baselineAgeMyr);
 const legacyPlanet=P.planetProfile({planetIdentity,bulkPriorClass,stellarLuminosityMilliSolar,orbitMilliAu,massMilliEarth,radiusKm,ageMyr});
 const planet=E.enrich(legacyPlanet,{planetIdentity,bulkPriorClass,stellarLuminosityMilliSolar,orbitMilliAu,massMilliEarth,radiusKm,ageMyr});
 const bridge=O.v1WorldContext,readiness=B.environmentFromPlanetology(planet),biology=bridge.buildLife(planet,ageMyr),sites=bridge.survey(planet),civ=bridge.civilization(planet,biology,sites,ageMyr);
 let micro=null;
 const founder=biology.ecosystem.populations?.[0];
 if(founder){const organismIdentity=V.deriveId('representative-organism',founder.populationId,biology.ecosystem.generation),tissue=M.tissue({organismIdentity,cellCount:32,fieldUnits:100000}),cell=M.cell(tissue,0),molecular=M.molecular(cell,{complexCount:12});micro=Object.freeze({organismIdentity,tissue,cell,molecular,atomicPreview:M.atomic(molecular,{complexOrdinal:0,maxAtoms:48}),witnesses:Object.freeze([M.reconcile(tissue,cell),M.reconcile(cell,molecular)])});}
 return Object.freeze({version:VERSION,universeId,planetIdentity,canonicalInputDigest:V.digest('OFU-V1-CANONICAL-INPUT',canonicalInput,...(bodyContext?[bodyContext.canonicalFacts]:[])),bodyContext:bodyContext||{kind:'PLANET',canonicalBodyId:planetIdentity},astronomy:birth,planetology:planet,environment:E.inspectWorld(planet),environmentReadiness:readiness,biology,civilization:civ.state,civilizationOrigin:civ.initial,civilizationRegions:civ.regions,civilizationEligibility:civ.gate,surveySites:sites,microscopic:micro,materialInspectionAvailable:true,modelTime:{ageMyr,evolutionGeneration:biology.ecosystem.generation,civilizationEpoch:civ.state.epoch,historyClass:'MODEL_PROJECTION_NOT_COMMITTED_P4'},authority:AUTH,provenance:V.provenance('v1.modeled-world','2.0.0',SOURCE_BRANCHES)});
}
O.v1World=Object.freeze({VERSION,AUTHORITY:AUTH,SOURCE_BRANCHES,radiusEstimateKm,environmentalReadiness,build});
})(globalThis);

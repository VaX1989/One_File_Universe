(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,A=O.v1Astronomy,P=O.v1Planetology,E=O.v1PlanetEnvironment,B=O.v1Biology,CV=O.v1Civilization,M=O.v1Microscopic;
if(!V||!A||!P||!E||!B||!CV||!M)throw new Error('v1 domain models required');
const VERSION='ofu-v1-modeled-world-1';
const SOURCE_BRANCHES=Object.freeze([
 'parallel/wave-v-astronomy-depth-2026-09-05@a4feefde0fcc4df1b257b7126f95c4bbcaf779d3',
 'research/wave-v-planetology-frontier-2026-09-05@3e102e26c2adfcc8cb461193f821e10d9c374e24',
 'research/wave-v-biology-evolution-2026-09-05@ccc1f91d5c6cd26e7b89b74433e4712755073e5a',
 'research/wave-v-civilization-history-2026-09-05@082d8c558ad56c36a894a4ca381d01b10c5697d4',
 'research/wave-v-microscopic-matter-2026-09-05@6aeecf2ccc564d7f0f316711d07710e74e667e27',
 'parallel/v1-wave-a-planetology-environment-2026-09-05'
]);
const AUTH=V.authority('v1.modeled-world','1.0.0',SOURCE_BRANCHES,'Cross-domain modeled state consumes preserved canonical identity/facts and never replaces P3/P4/P5/P6 authority.',[
 'Planet radius, environmental readiness, biosphere occupancy, intelligence eligibility and civilization state are bounded scenario-model outputs, not observations.',
 'Canonical P6 biology remains unchanged and may remain fail-closed while this separate modeled pathway is explored.',
 'Civilization and environment event proposals are not committed P4 history until admitted through a governed temporal transition.'
]);
function radiusEstimateKm(bulkClass,massMilliEarth){V.int(massMilliEarth,'massMilliEarth',1,1000000000);let radius;if(bulkClass==='GAS_GIANT')radius=22000+Math.min(65000,Math.floor(massMilliEarth/5));else if(bulkClass==='ICE_GIANT')radius=12000+Math.min(28000,Math.floor(massMilliEarth/6));else radius=3400+Math.min(12000,Math.floor(massMilliEarth*46/100));return V.clamp(radius,1200,90000);}
function temperatureCompatibilityPpm(surfaceTemperatureMilliK){V.int(surfaceTemperatureMilliK,'surfaceTemperatureMilliK',0,2000000);const delta=Math.abs(surfaceTemperatureMilliK-288000);return V.clamp(1000000-Math.floor(delta*1000000/240000),0,1000000);}
function environmentalReadiness(planet){const heat=planet.interior.heatIndexPpm,flux=planet.climate.stellarFluxPpm,liquid=planet.hydrosphere.liquidSurfaceEligible,pathways=[];if(flux>=45000)pathways.push('PHOTIC_FREE_ENERGY_PROXY');if(heat>=180000)pathways.push('GEOTHERMAL_GRADIENT');if(liquid&&planet.surfaceProcesses.tectonicActivityPpm>=220000)pathways.push('REDOX_GRADIENT');const freeEnergy=V.clamp(Math.floor(heat*.52)+Math.min(430000,Math.floor(flux*.9))+(liquid?90000:0),0,1000000),nutrients=V.clamp(Math.floor(planet.surfaceProcesses.erosionPotentialPpm*.42)+Math.floor(planet.surfaceProcesses.tectonicActivityPpm*.28)+Math.floor(planet.composition.silicatePpm*.18),0,1000000);return Object.freeze({mediumAvailable:liquid||planet.atmosphere.inventoryUnits>1000,freeEnergyAvailabilityPpm:freeEnergy,nutrientAvailabilityPpm:nutrients,temperatureCompatibilityPpm:temperatureCompatibilityPpm(planet.climate.surfaceTemperatureMilliK),energyPathways:Object.freeze(pathways)});}
function build({universeId,planetIdentity,galaxyAddress,systemAddress,canonicalInput}){
 V.text(universeId,'universeId',128);V.text(planetIdentity,'planetIdentity',128);V.text(galaxyAddress,'galaxyAddress',128);V.text(systemAddress,'systemAddress',128);V.assert(canonicalInput&&canonicalInput.status!=='ABSENT','canonicalInput');
 const regionCell=galaxyAddress+':'+systemAddress.split(',').slice(0,3).join(','),ids=A.hierarchy({universeId,galaxyCell:galaxyAddress,regionCell,systemAddress,stellarOrdinal:0});
 const birth=Object.freeze({...A.systemBirthContext({universeId,galaxyCell:galaxyAddress,regionCell,systemAddress,stellarOrdinal:0,environmentPpm:V.unitPpm(VERSION,ids.galaxyIdentity,'environment'),radialPpm:V.unitPpm(VERSION,ids.galacticRegionIdentity,'radial'),heightPpm:V.unitPpm(VERSION,ids.galacticRegionIdentity,'height')}),canonicalHostStarId:String(canonicalInput.host.starId)});
 const massMilliEarth=Number(canonicalInput.formation.baselineMassMilliEarth),bulkPriorClass=canonicalInput.formation.bulkPriorClass,radiusKm=radiusEstimateKm(bulkPriorClass,massMilliEarth),stellarLuminosityMilliSolar=Number(canonicalInput.host.baselineLuminosityMilliSolar),orbitMilliAu=Math.max(1,Math.floor(Number(canonicalInput.orbit.baselineSemiMajorAxisMicroAu)/1000)),ageMyr=Number(canonicalInput.system.baselineAgeMyr);
 const legacyPlanet=P.planetProfile({planetIdentity,bulkPriorClass,stellarLuminosityMilliSolar,orbitMilliAu,massMilliEarth,radiusKm,ageMyr});
 const planet=E.enrich(legacyPlanet,{planetIdentity,bulkPriorClass,stellarLuminosityMilliSolar,orbitMilliAu,massMilliEarth,radiusKm,ageMyr});
 const readiness=environmentalReadiness(planet),bioGate=B.environmentEligibility(readiness),occupancy=B.scenarioOccupancy({worldIdentity:planetIdentity,eligibility:bioGate,occupancyParameterPpm:360000}),ecosystem=B.initialEcosystem({worldIdentity:planetIdentity,eligibility:bioGate,occupancy,energyBudgetUnits:1000000,populationCount:18});
 let civilization=Object.freeze({state:'NO_CIVILIZATION_MODEL',authority:CV.AUTHORITY}),micro=null;
 if(ecosystem.state==='MODELED_BIOSPHERE'&&ecosystem.populations.length){const totalPopulation=ecosystem.populations.reduce((n,p)=>n+p.individuals,0),founder=ecosystem.populations.slice().sort((a,b)=>b.individuals-a.individuals||a.populationId.localeCompare(b.populationId))[0],intelligenceModelEligible=V.unitPpm(VERSION,planetIdentity,founder.lineageId,'intelligence-scenario')<80000,civGate=CV.eligibility({lineageId:founder.lineageId,intelligenceModelEligible,population:totalPopulation,energySurplusPpm:V.clamp(Math.floor(readiness.freeEnergyAvailabilityPpm*.6),0,1000000),environmentStabilityPpm:V.clamp(1000000-Math.floor(Math.abs(planet.climate.surfaceTemperatureMilliK-288000)*3),0,1000000)});civilization=CV.initialState({worldIdentity:planetIdentity,lineageId:founder.lineageId,population:totalPopulation,eligibility:civGate,resourceUnits:1000000});const organismIdentity=V.deriveId('representative-organism',founder.populationId,ecosystem.generation),tissue=M.tissue({organismIdentity,cellCount:32,fieldUnits:100000}),cell=M.cell(tissue,0),molecular=M.molecular(cell,{complexCount:12});micro=Object.freeze({organismIdentity,tissue,cell,molecular,atomicPreview:M.atomic(molecular,{complexOrdinal:0,maxAtoms:48}),witnesses:Object.freeze([M.reconcile(tissue,cell),M.reconcile(cell,molecular)])});}
 return Object.freeze({version:VERSION,universeId,planetIdentity,canonicalInputDigest:V.digest('OFU-V1-CANONICAL-INPUT',canonicalInput),astronomy:birth,planetology:planet,environment:E.inspectWorld(planet),environmentReadiness:readiness,biology:Object.freeze({eligibility:bioGate,occupancy,ecosystem}),civilization,microscopic:micro,authority:AUTH,provenance:V.provenance('v1.modeled-world','1.0.0',SOURCE_BRANCHES)});
}
O.v1World=Object.freeze({VERSION,AUTHORITY:AUTH,SOURCE_BRANCHES,radiusEstimateKm,environmentalReadiness,build});
})(globalThis);

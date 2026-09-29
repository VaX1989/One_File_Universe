import {W1_AUTHORITY,createCanonicalEntityRef} from '../../src/product/contracts/w1-observation-contracts.js';
import {createWorldScientificState} from '../../src/experiments/spatial-continuum/scientific-state.js';
import {SCIENTIFIC_INSTRUMENT_KIND,SCIENTIFIC_INSTRUMENT_UNCERTAINTY_KIND} from '../../src/product/w1/instruments/scientific-instruments.js';
export {W1_AUTHORITY,SCIENTIFIC_INSTRUMENT_KIND,SCIENTIFIC_INSTRUMENT_UNCERTAINTY_KIND};
export const canonicalId='0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',universeId='universe-fixture';
export const canonicalKey={galaxyX:1n,galaxyY:2n,galaxyZ:3n,sectorX:4n,sectorY:5n,sectorZ:6n,siteX:7n,siteY:8n,siteZ:9n,orbitSlot:2n};
const runtime={ctx:{masterSeed:Uint8Array.from({length:32},(_,i)=>i)},universe:{universeId}};
const system={entityId:'system-fixture',metadata:{facts:{baselineAgeMyr:4500n,baselineMetallicityMilliDex:0n,baselinePrimaryMassMilliSolar:1000n,protoplanetarySolidBudgetPermille:800n,planetCount:3n,planetArchitecture:'ORDERED'}}};
const body={entityId:canonicalId,canonicalId,canonicalKey,metadata:{facts:{bulkPriorClass:'TERRESTRIAL',baselineMassMilliEarth:1000n,baselineSemiMajorAxisMicroAu:1000000n,baselineEccentricityPpm:20000n,baselineInclinationMilliDeg:0n,baselineInsolationPpm:1000000n,moonCount:1n}}};
const physical={physical:{meanRadiusM:6371000n,surfaceGravityMicroMs2:9810000n,meanDensityKgM3:5514n,composition:{model:'TEST',coreMassFractionPermille:320n,coreFractionPpm:320000n,mantleFractionPpm:680000n}}};
const modeledWorld={planetology:{formation:{temperatureIndexPpm:400000,ageMyr:4500},composition:{metalPpm:320000,silicatePpm:560000,volatilePpm:120000,sumPpm:1000000},interior:{coreFractionPpm:320000,heatIndexPpm:600000,geodynamicRegime:'TEST_SCENARIO'},volatiles:{initialInventoryUnits:120000,interiorUnits:20000,surfaceCondensedUnits:30000,atmosphereUnits:1000,lostUnits:70000,conserved:true},atmosphere:{inventoryUnits:1000,modelPressureProxy:1,canonicalPressure:false},climate:{model:'TEST',stellarFluxPpm:1000000,bondAlbedoPpm:300000,effectiveTemperatureMilliK:250000,greenhouseDeltaMilliK:38000,surfaceTemperatureMilliK:288000,temperatureAuthority:'MODEL_DERIVED',measured:false},hydrosphere:{liquidSurfaceEligible:false,waterAreaPpm:0,iceFractionPpm:0,canonicalOceanClaim:false},surfaceProcesses:{tectonicActivityPpm:600000,erosionPotentialPpm:220000,impactRetentionPpm:540000}}};
const point={locationIdentity:'surface-fixture',latMicroDeg:12345,lonMicroDeg:-54321},sample={entityId:'sample-fixture',kind:'ROCK'},source={phase:'SOLID',structure:'POLYCRYSTALLINE',chemistryAuthority:'MODEL_DERIVED',components:[{id:'SILICA'}]};
export const subject=createCanonicalEntityRef({universeId,entityKind:'planet',canonicalId,canonicalKey});
export const worldState=createWorldScientificState({runtime,system,body,physical,modeledWorld,point,sample,source});
export const unknownWorld=createWorldScientificState({runtime,system,body,physical,modeledWorld:null,point:null,sample:null,source:null});
export const request=(requestId,instrumentId,outputUnit,uncertainty=null)=>({requestId,instrumentId,outputUnit,uncertainty});
export const requests=[
  request('radius-km',SCIENTIFIC_INSTRUMENT_KIND.PLANET_RADIUS,'km'),request('gravity',SCIENTIFIC_INSTRUMENT_KIND.SURFACE_GRAVITY,'m/s^2'),request('density',SCIENTIFIC_INSTRUMENT_KIND.MEAN_DENSITY,'kg/m^3'),
  request('temperature',SCIENTIFIC_INSTRUMENT_KIND.SURFACE_TEMPERATURE,'K',{kind:SCIENTIFIC_INSTRUMENT_UNCERTAINTY_KIND.INTERVAL,sourceAuthority:W1_AUTHORITY.MODEL_DERIVED,provenanceClass:'FIXTURE_EXPLICIT_MODEL_INTERVAL',parameters:{lower:'280',upper:'296',unit:'K'}}),
  request('latitude',SCIENTIFIC_INSTRUMENT_KIND.SURFACE_LATITUDE,'deg'),request('sample-components',SCIENTIFIC_INSTRUMENT_KIND.SAMPLE_COMPONENT_COUNT,'count'),request('unsupported-local-mineralogy','EXACT_LOCAL_MINERALOGY',null)
];

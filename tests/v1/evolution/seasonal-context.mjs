import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const seasonalProfiles=Object.freeze([
  Object.freeze({populationId:'p1',lineageId:'l1',role:'PRIMARY_PRODUCER',meanOpportunityPpm:700000,amplitudePpm:50000,peakSeasonPpm:250000,troughSeasonPpm:750000}),
  Object.freeze({populationId:'p2',lineageId:'l2',role:'CHEMOTROPH',meanOpportunityPpm:600000,amplitudePpm:350000,peakSeasonPpm:0,troughSeasonPpm:500000}),
  Object.freeze({populationId:'p3',lineageId:'l3',role:'CONSUMER',meanOpportunityPpm:200000,amplitudePpm:50000,peakSeasonPpm:250000,troughSeasonPpm:750000}),
  Object.freeze({populationId:'p4',lineageId:'l4',role:'PREDATOR',meanOpportunityPpm:550000,amplitudePpm:150000,peakSeasonPpm:500000,troughSeasonPpm:0})
]);
const lineageProfile=(populationId,lineageId,depth=2)=>Object.freeze({populationId,lineageId,role:'CONSUMER',ancestry:Object.freeze({depth,ancestryComplete:true,termination:'FOUNDER_REACHED'}),lineageEvents:Object.freeze([{eventId:'e-'+populationId}]),traceEvidence:Object.freeze([{evidenceId:'t-'+populationId}])});
const lineageProfiles=Object.freeze([lineageProfile('p1','l1'),lineageProfile('p2','l2',3),lineageProfile('p3','l3'),lineageProfile('p4','l4'),lineageProfile('p5','l5')]);
const baseContext=Object.freeze({marker:'preserved',seasonalEcology:Object.freeze({supported:true,profiles:seasonalProfiles}),localLineageContext:Object.freeze({supported:true,profiles:lineageProfiles})});
OFU.v1SeasonalEcology=Object.freeze({MAX_POPULATIONS:12});
OFU.v1LocalLineageContext=Object.freeze({MAX_LOCAL_POPULATIONS:12});
OFU.v1WorldContext=Object.freeze({localContext(){return baseContext;}});
vm.runInThisContext(fs.readFileSync('src/domains/v1/evolution/seasonal-context.js','utf8'),{filename:'src/domains/v1/evolution/seasonal-context.js'});
const E=OFU.v1EvolutionSeasonalContext;
const a=E.projectFromContext(baseContext),b=E.projectFromContext(baseContext);
assert.deepEqual(a,b);assert.equal(a.supported,true);assert.equal(a.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(a.resolvedPopulationCount,4);assert.equal(a.unresolvedPopulationCount,1);assert.equal(a.maxProfiles,12);
assert.equal(a.constraintClassCounts.BROAD_STABLE_MODELED_OPPORTUNITY,1);assert.equal(a.constraintClassCounts.HIGH_SEASONAL_VARIABILITY,1);assert.equal(a.constraintClassCounts.PERSISTENT_LOW_MODELED_OPPORTUNITY,1);assert.equal(a.constraintClassCounts.MODERATE_SEASONAL_VARIABILITY,1);
const byId=new Map(a.profiles.map(x=>[x.populationId,x]));
assert.equal(byId.get('p1').opportunityDeficitPpm,300000);assert.equal(byId.get('p2').seasonalVariabilityPpm,350000);assert.equal(byId.get('p2').ancestryDepth,3);assert.equal(byId.get('p1').retainedLineageEventCount,1);assert.equal(byId.get('p1').retainedTraceEvidenceCount,1);
for(const p of a.profiles){assert.equal(p.fitnessMeasurement,false);assert.equal(p.selectionCoefficient,false);assert.equal(p.adaptationEvidence,false);assert.equal(p.historicalCausationClaim,false);assert.equal(p.canonicalP4Event,false);}
assert.equal(E.constraintClass(700000,350000),'HIGH_SEASONAL_VARIABILITY');assert.equal(E.constraintClass(200000,350000),'PERSISTENT_LOW_MODELED_OPPORTUNITY');assert.equal(E.constraintClass(600000,150000),'MODERATE_SEASONAL_VARIABILITY');
const noSeason=E.projectFromContext({seasonalEcology:{supported:false,reason:'NO_SEASONAL_ENVIRONMENT'},localLineageContext:{supported:true,profiles:[]}});assert.equal(noSeason.supported,false);assert.equal(noSeason.reason,'NO_SEASONAL_ENVIRONMENT');
const noShared=E.projectFromContext({seasonalEcology:{supported:true,profiles:[{populationId:'x',meanOpportunityPpm:500000,amplitudePpm:0}]},localLineageContext:{supported:true,profiles:[lineageProfile('y','ly')]}});assert.equal(noShared.supported,false);assert.equal(noShared.reason,'NO_SHARED_LOCAL_POPULATION_IDENTITY');
assert.throws(()=>E.projectFromContext({seasonalEcology:{supported:true,profiles:[{populationId:'d'},{populationId:'d'}]},localLineageContext:{supported:true,profiles:[lineageProfile('d','ld')]}}),/duplicate populationId/);
assert.throws(()=>E.projectFromContext({seasonalEcology:{supported:true,profiles:Array.from({length:13},(_,i)=>({populationId:'s'+i}))},localLineageContext:{supported:true,profiles:[lineageProfile('s0','l0')]}}),/profile bound/);
const composed=OFU.v1WorldContext.localContext({},{});assert.equal(composed.marker,'preserved');assert.equal(composed.evolutionSeasonalContext.supported,true);assert.equal(composed.evolutionSeasonalContext.identityJoin,'EXACT_LOCAL_POPULATION_ID_ONLY');assert.equal(composed.evolutionSeasonalContext.selectionEventInference,false);assert.equal(composed.evolutionSeasonalContext.p4HistoryMutated,false);
console.log(JSON.stringify({status:'PASS',suite:'v1.1 seasonal evolution context',profiles:a.resolvedPopulationCount,classes:a.constraintClassCounts}));

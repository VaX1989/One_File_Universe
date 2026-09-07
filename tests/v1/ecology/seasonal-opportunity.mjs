import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const snapshots=Object.freeze([
  Object.freeze({seasonPpm:0,temperatureCompatibilityPpm:850000,waterActivityPpm:800000,precipitationPotentialPpm:700000,mediumAvailable:true,sourceLocationIdentity:'source-a',sampleLocationIdentity:'sample-a'}),
  Object.freeze({seasonPpm:250000,temperatureCompatibilityPpm:920000,waterActivityPpm:950000,precipitationPotentialPpm:900000,mediumAvailable:true,sourceLocationIdentity:'source-a',sampleLocationIdentity:'sample-a'}),
  Object.freeze({seasonPpm:500000,temperatureCompatibilityPpm:600000,waterActivityPpm:240000,precipitationPotentialPpm:120000,mediumAvailable:false,sourceLocationIdentity:'source-a',sampleLocationIdentity:'sample-a'}),
  Object.freeze({seasonPpm:750000,temperatureCompatibilityPpm:720000,waterActivityPpm:520000,precipitationPotentialPpm:420000,mediumAvailable:true,sourceLocationIdentity:'source-a',sampleLocationIdentity:'sample-a'})
]);
const niche=Object.freeze({supported:true,profiles:Object.freeze([
  Object.freeze({populationId:'a'.repeat(64),lineageId:'1'.repeat(64),role:'PRIMARY_PRODUCER',modeledSupportPpm:760000}),
  Object.freeze({populationId:'b'.repeat(64),lineageId:'2'.repeat(64),role:'CHEMOTROPH',modeledSupportPpm:640000}),
  Object.freeze({populationId:'c'.repeat(64),lineageId:'3'.repeat(64),role:'PREDATOR',modeledSupportPpm:500000})
])});
const context=Object.freeze({seasonalEnvironment:Object.freeze({snapshots,sampleCount:4}),ecologyCausality:niche,planetIdentity:'world-a'});
OFU.v1SeasonalEnvironment=Object.freeze({MAX_SAMPLES:4});
OFU.v1EcologyCausalNiche=Object.freeze({MAX_POPULATIONS:12});
OFU.v1WorldContext=Object.freeze({localContext(){return context;}});
vm.runInThisContext(fs.readFileSync('src/domains/v1/ecology/seasonal-opportunity.js','utf8'),{filename:'src/domains/v1/ecology/seasonal-opportunity.js'});
const E=OFU.v1SeasonalEcology,a=E.projectFromContext(context),b=E.projectFromContext(context);
assert.deepEqual(a,b);assert.equal(a.supported,true);assert.equal(a.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(a.populationCount,3);assert.equal(a.seasonCount,4);assert.equal(a.evaluations,12);assert.ok(a.evaluations<=E.MAX_EVALUATIONS);assert.equal(a.maxEvaluations,48);
assert.equal(a.bounded,true);assert.equal(a.globalEnumeration,false);assert.equal(a.fitnessMeasurement,false);assert.equal(a.abundancePrediction,false);assert.equal(a.survivalProbability,false);assert.equal(a.canonicalBiologyClaim,false);assert.equal(a.canonicalP6Unchanged,true);assert.equal(a.p4HistoryMutated,false);
for(const [role,weights] of Object.entries(E.ROLE_WEIGHTS))assert.equal(weights.reduce((n,x)=>n+x,0),1000000,role+' weight closure');
for(const profile of a.profiles){assert.equal(profile.phases.length,4);assert.equal(profile.amplitudePpm,profile.maxOpportunityPpm-profile.minOpportunityPpm);assert.ok(profile.meanOpportunityPpm>=profile.minOpportunityPpm&&profile.meanOpportunityPpm<=profile.maxOpportunityPpm);for(const phase of profile.phases){assert.equal(phase.signals.length,5);assert.equal(phase.signals.reduce((n,x)=>n+x.weightPpm,0),1000000);assert.ok(phase.opportunityPpm>=0&&phase.opportunityPpm<=1000000);assert.equal(phase.fitnessMeasurement,false);assert.equal(phase.canonicalBiologyClaim,false);}}
const producer=a.profiles[0],chemotroph=a.profiles[1];
assert.equal(producer.peakSeasonPpm,250000);assert.equal(producer.troughSeasonPpm,500000);assert.ok(producer.maxOpportunityPpm>producer.minOpportunityPpm);
assert.notDeepEqual(producer.phases.map(x=>x.opportunityPpm),chemotroph.phases.map(x=>x.opportunityPpm),'role weighting should alter the same seasonal environment projection');
const dry=snapshots[2],wet=snapshots[1];assert.ok(E.evaluate(niche.profiles[0],wet).opportunityPpm>E.evaluate(niche.profiles[0],dry).opportunityPpm);
const manyProfiles=Array.from({length:20},(_,i)=>({populationId:String(i).padStart(64,'0'),lineageId:null,role:'CONSUMER',modeledSupportPpm:500000+i*1000}));
const bounded=E.projectFromContext({seasonalEnvironment:{snapshots},ecologyCausality:{supported:true,profiles:manyProfiles}});assert.equal(bounded.populationCount,12);assert.equal(bounded.evaluations,48);
const noSeason=E.projectFromContext({ecologyCausality:niche});assert.equal(noSeason.supported,false);assert.equal(noSeason.reason,'NO_SEASONAL_ENVIRONMENT');
const noLife=E.projectFromContext({seasonalEnvironment:{snapshots},ecologyCausality:{supported:false,reason:'NO_MODELED_LOCAL_POPULATIONS',profiles:[]}});assert.equal(noLife.supported,false);assert.equal(noLife.reason,'NO_MODELED_LOCAL_POPULATIONS');
const wrapped=OFU.v1WorldContext.localContext({},{});assert.equal(wrapped.seasonalEcology.supported,true);assert.equal(wrapped.seasonalEcology.evaluations,12);assert.equal(wrapped.seasonalEnvironment.snapshots.length,4);assert.equal(wrapped.ecologyCausality.profiles.length,3);
console.log(JSON.stringify({status:'PASS',suite:'v1.1 seasonal ecology opportunity',version:E.VERSION,populations:a.populationCount,seasons:a.seasonCount,evaluations:a.evaluations,maxEvaluations:E.MAX_EVALUATIONS,authority:a.authority.class}));

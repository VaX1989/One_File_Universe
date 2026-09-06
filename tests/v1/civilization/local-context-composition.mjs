import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const settlement=Object.freeze({settlementId:'s'.repeat(64),status:'ACTIVE',population:1200,infrastructurePpm:320000,scarcityPpm:180000});
const base=Object.freeze({objects:Object.freeze([{kind:'SETTLEMENT',entityId:settlement.settlementId,settlement}]),planetIdentity:'w'.repeat(64)});
OFU.v1WorldContext=Object.freeze({localContext(){return base;}});
OFU.v1HistorySystem=Object.freeze({
  atPlace(){return Object.freeze([{epoch:0,type:'SETTLEMENT_FOUNDATION',eventProposalId:'e'.repeat(64)}]);},
  archaeologicalEvidence(){return Object.freeze({features:Object.freeze([])});}
});
const state=Object.freeze({state:'MODELED_CIVILIZATION',worldIdentity:'w'.repeat(64),epoch:10,settlements:Object.freeze([settlement]),tradeEdges:Object.freeze([]),infrastructure:Object.freeze([]),
  technology:Object.freeze({production:1,transport:0,materials:1,energy:0,communication:0,medicine:0,construction:1,conflict:0}),history:Object.freeze({})});
for(const f of ['src/domains/v1/civilization/individuals.js','src/domains/v1/civilization/settlement-history-context.js','src/domains/v1/civilization/network-context.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const context=OFU.v1WorldContext.localContext({civilization:state},{});
assert.equal(context.civilizationRepresentatives.supported,true);assert.equal(context.civilizationRepresentatives.sampleCount,4);
assert.equal(context.settlementHistoryContext.supported,true);assert.equal(context.settlementHistoryContext.settlementId,settlement.settlementId);
assert.equal(context.settlementNetworkContext.supported,true);assert.equal(context.settlementNetworkContext.selectedSettlementId,settlement.settlementId);assert.equal(context.settlementNetworkContext.routeContinuityClass,'ISOLATED');
assert.equal(context.civilizationRepresentatives.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(context.settlementHistoryContext.authority.class,'MODEL_DERIVED_SIMULATION');assert.equal(context.settlementNetworkContext.authority.class,'MODEL_DERIVED_SIMULATION');
assert.equal(context.civilizationRepresentatives.representatives.every(x=>x.persistentPersonIdentity===false),true);assert.equal(context.settlementHistoryContext.p4Admission,false);assert.equal(context.settlementNetworkContext.routeLegacyInferred,false);
console.log(JSON.stringify({status:'PASS',suite:'v1.1 civilization local-context composition',fields:['civilizationRepresentatives','settlementHistoryContext','settlementNetworkContext']}));

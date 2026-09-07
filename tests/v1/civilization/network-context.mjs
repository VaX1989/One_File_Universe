import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const baseContext=Object.freeze({
  objects:Object.freeze([{kind:'SETTLEMENT',entityId:'b',settlement:Object.freeze({settlementId:'b'})}]),
  settlementHistoryContext:Object.freeze({supported:true,witness:'history-preserved'}),
  civilizationRepresentatives:Object.freeze({supported:true,witness:'representatives-preserved'})
});
OFU.v1WorldContext=Object.freeze({localContext(){return baseContext;}});
vm.runInThisContext(fs.readFileSync('src/domains/v1/civilization/network-context.js','utf8'),{filename:'src/domains/v1/civilization/network-context.js'});
const N=OFU.v1CivilizationNetworkContext;
const settlement=(id,status='ACTIVE',population=100)=>Object.freeze({settlementId:id,status,population});
const edge=(id,from,to,costPpm=200000,flowUnits=100)=>Object.freeze({edgeId:id,from,to,costPpm,flowUnits,status:'ACTIVE',modelDerivedRouteCost:true});
const chain=Object.freeze({state:'MODELED_CIVILIZATION',worldIdentity:'w'.repeat(64),epoch:25,
  settlements:Object.freeze([settlement('a'),settlement('b'),settlement('c'),settlement('d')]),
  tradeEdges:Object.freeze([edge('ab','a','b',100000,120),edge('bc','b','c',300000,80)])});
const a=N.topology(chain,'b'),b=N.topology(chain,'b');
assert.deepEqual(a,b);assert.equal(a.supported,true);assert.equal(a.authority.class,'MODEL_DERIVED_SIMULATION');
assert.equal(a.nodeCount,4);assert.equal(a.edgeCount,2);assert.equal(a.directDegree,2);assert.deepEqual(a.neighborIds,['a','c']);
assert.equal(a.incidentFlowUnits,200);assert.equal(a.meanIncidentCostPpm,200000);assert.equal(a.connectedComponentSize,3);assert.equal(a.reachableSettlementCount,2);assert.equal(a.unreachableActiveSettlementCount,1);
assert.equal(a.maxHopDistance,1);assert.equal(a.articulationLostPairCount,1);assert.equal(a.componentsAfterSelectedRemoval,2);assert.equal(a.routeContinuityClass,'ARTICULATION_CONNECTOR');
assert.deepEqual(a.distances,[{settlementId:'b',hops:0},{settlementId:'a',hops:1},{settlementId:'c',hops:1}]);
assert.equal(a.currentSnapshotOnly,true);assert.equal(a.routeLegacyInferred,false);assert.equal(a.resilienceProbability,false);assert.equal(a.physicalTransportNetworkClaim,false);assert.equal(a.p4HistoryMutated,false);
const triangle={...chain,settlements:Object.freeze([settlement('a'),settlement('b'),settlement('c')]),tradeEdges:Object.freeze([edge('ab','a','b'),edge('bc','b','c'),edge('ac','a','c')])};
const mesh=N.topology(triangle,'b');assert.equal(mesh.articulationLostPairCount,0);assert.equal(mesh.routeContinuityClass,'MESHED_NODE');assert.equal(mesh.componentsAfterSelectedRemoval,1);
const leaf=N.topology(chain,'a');assert.equal(leaf.directDegree,1);assert.equal(leaf.routeContinuityClass,'LEAF');assert.equal(leaf.maxHopDistance,2);
const isolated=N.topology(chain,'d');assert.equal(isolated.directDegree,0);assert.equal(isolated.routeContinuityClass,'ISOLATED');assert.equal(isolated.connectedComponentSize,1);
const inactiveState={...chain,settlements:Object.freeze([settlement('a'),settlement('b','ABANDONED',0),settlement('c')]),tradeEdges:Object.freeze([])};
const inactive=N.topology(inactiveState,'b');assert.equal(inactive.supported,false);assert.equal(inactive.reason,'INACTIVE_CURRENT_SETTLEMENT');assert.equal(inactive.routeContinuityClass,'INACTIVE_CURRENT_SNAPSHOT');assert.equal(inactive.routeLegacyInferred,false);
const dangling={...chain,tradeEdges:Object.freeze([edge('ax','a','missing')])};assert.equal(N.topology(dangling,'a').reason,'DANGLING_MODELED_TRADE_EDGE');
assert.equal(N.topology({state:'NO_CIVILIZATION_MODEL'},'a').reason,'NO_MODELED_CIVILIZATION');assert.equal(N.topology(chain,'missing').reason,'UNKNOWN_MODELED_SETTLEMENT');
const tooMany={...chain,settlements:Object.freeze(Array.from({length:N.MAX_SETTLEMENTS+1},(_,i)=>settlement('s'+String(i).padStart(2,'0')))),tradeEdges:Object.freeze([])};
assert.throws(()=>N.topology(tooMany,'s00'),/settlement network settlement bound/);
const duplicate={...triangle,tradeEdges:Object.freeze([edge('ab1','a','b'),edge('ab2','b','a')])};assert.throws(()=>N.topology(duplicate,'a'),/duplicate settlement network edge/);
const wrapped=OFU.v1WorldContext.localContext({civilization:chain},{});assert.equal(wrapped.settlementNetworkContext.selectedSettlementId,'b');assert.equal(wrapped.settlementNetworkContext.routeContinuityClass,'ARTICULATION_CONNECTOR');
assert.equal(wrapped.settlementHistoryContext.witness,'history-preserved');assert.equal(wrapped.civilizationRepresentatives.witness,'representatives-preserved');
const noPlace=N.fromLocalContext({civilization:chain},{objects:[]});assert.equal(noPlace.supported,false);assert.equal(noPlace.reason,'NO_SETTLEMENT_AT_EXACT_LOCATION');
console.log(JSON.stringify({status:'PASS',suite:'v1.1 settlement network context',version:N.VERSION,classification:a.routeContinuityClass,lostPairs:a.articulationLostPairCount,maxSettlements:N.MAX_SETTLEMENTS,maxEdges:N.MAX_EDGES}));

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT=path.resolve(import.meta.dirname,'../../..');
const freezeDeep=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const v of Object.values(value))freezeDeep(v);Object.freeze(value);}return value;};
const V={
  authority(){return Object.freeze({class:'MODEL_DERIVED_SIMULATION'});},
  assert(ok,msg){if(!ok)throw new Error(msg);},freezeDeep
};
const localPopulations=[
  {populationId:'p1',lineageId:'l1',role:'PRIMARY_PRODUCER',trophicLevel:1,localDensityPpm:800000},
  {populationId:'p2',lineageId:'l2',role:'CONSUMER',trophicLevel:2,localDensityPpm:620000},
  {populationId:'p3',lineageId:'l3',role:'PREDATOR',trophicLevel:3,localDensityPpm:410000},
  {populationId:'p4',lineageId:'l4',role:'DECOMPOSER',trophicLevel:2,localDensityPpm:250000}
];
const fullNetwork={worldIdentity:'world-1',generation:42,nodes:[...localPopulations,{populationId:'outside',lineageId:'lx',role:'CHEMOTROPH',trophicLevel:1}],edges:[
  {interactionId:'e1',fromPopulationId:'p2',toPopulationId:'p1',type:'TROPHIC',strengthPpm:400000,energyTransferEfficiencyPpm:120000},
  {interactionId:'e2',fromPopulationId:'p3',toPopulationId:'p2',type:'TROPHIC',strengthPpm:300000,energyTransferEfficiencyPpm:100000},
  {interactionId:'e3',fromPopulationId:'p4',toPopulationId:'p1',type:'RECYCLING',strengthPpm:220000,energyTransferEfficiencyPpm:null},
  {interactionId:'e4',fromPopulationId:'outside',toPopulationId:'p1',type:'TROPHIC',strengthPpm:500000,energyTransferEfficiencyPpm:90000},
  {interactionId:'e5',fromPopulationId:'p1',toPopulationId:'outside',type:'COMPETITION',strengthPpm:180000,energyTransferEfficiencyPpm:null}
]};
const W={localContext(){return freezeDeep({life:{local:{populations:localPopulations}},biogeography:{supported:true},baseWitness:'PRESERVED'});}};
const E={trophicNetwork(){return freezeDeep(fullNetwork);}};
globalThis.OFU={v1Common:V,v1WorldContext:W,v1Ecology:E,v1EcologyBiogeography:{VERSION:'mock'}};
vm.runInThisContext(fs.readFileSync(path.join(ROOT,'src/domains/v1/ecology/local-trophic-context.js'),'utf8'),{filename:'local-trophic-context.js'});
const T=OFU.v1EcologyLocalInteractionNetwork;
assert.equal(T.VERSION,'ofu-v11-ecology-local-interaction-network-1');assert.equal(T.AUTHORITY.class,'MODEL_DERIVED_SIMULATION');
const a=T.summarize(localPopulations,fullNetwork),b=T.summarize(localPopulations,fullNetwork);assert.deepEqual(a,b);
assert.equal(a.supported,true);assert.equal(a.nodeCount,4);assert.equal(a.edgeCount,3);assert.equal(a.maxNodes,12);assert.equal(a.maxEdges,48);
assert.deepEqual(a.edges.map(e=>e.interactionId),['e1','e2','e3']);
assert.ok(a.edges.every(e=>e.fromPopulationId!=='outside'&&e.toPopulationId!=='outside'));
assert.equal(a.typeCounts.TROPHIC,2);assert.equal(a.typeCounts.RECYCLING,1);assert.equal(a.typeCounts.COMPETITION,0);assert.equal(a.typeCounts.OTHER,0);
assert.equal(a.syntheticEdgesAdded,false);assert.equal(a.exactEndpointFilter,true);assert.equal(a.measuredFoodWeb,false);assert.equal(a.interactionRateClaim,false);assert.equal(a.stabilityClaim,false);assert.equal(a.keystoneClaim,false);assert.equal(a.canonicalP6Unchanged,true);
assert.equal(a.componentCount,1);assert.equal(a.isolatedCount,0);assert.equal(a.sourceGeneration,42);assert.equal(a.sourceWorldIdentity,'world-1');
assert.equal(a.directedEdgeOccupancyPpm,250000);assert.equal(a.networkClass,'MODELED_MODERATE_LOCAL_INTERACTIONS');
const degree=Object.fromEntries(a.degrees.map(d=>[d.populationId,d]));assert.deepEqual(degree.p1,{populationId:'p1',inDegree:2,outDegree:0,totalDegree:2});assert.equal(degree.p3.outDegree,1);
const composed=OFU.v1WorldContext.localContext({biology:{ecosystem:{}}},{},{});assert.equal(composed.baseWitness,'PRESERVED');assert.equal(composed.biogeography.supported,true);assert.equal(composed.localInteractionNetwork.edgeCount,3);
const empty=T.summarize([],fullNetwork);assert.equal(empty.supported,false);assert.equal(empty.reason,'NO_MODELED_LOCAL_POPULATIONS');
const disconnected=T.summarize(localPopulations,{worldIdentity:'world-1',generation:43,nodes:localPopulations,edges:[]});assert.equal(disconnected.edgeCount,0);assert.equal(disconnected.componentCount,4);assert.equal(disconnected.isolatedCount,4);assert.equal(disconnected.networkClass,'MODELED_NO_LOCAL_INTERACTIONS');
const oversized=Array.from({length:20},(_,i)=>({populationId:`x${i}`,lineageId:`l${i}`,role:'CONSUMER',trophicLevel:2,localDensityPpm:1}));const bounded=T.summarize(oversized,{worldIdentity:'w',generation:1,nodes:oversized,edges:[]});assert.equal(bounded.nodeCount,12);
const manyEdges=[];for(let i=0;i<12;i++)for(let j=0;j<12;j++)if(i!==j)manyEdges.push({interactionId:`m${i}-${j}`,fromPopulationId:`x${i}`,toPopulationId:`x${j}`,type:'COMPETITION',strengthPpm:100000,energyTransferEfficiencyPpm:null});const edgeBound=T.summarize(oversized,{worldIdentity:'w',generation:1,nodes:oversized,edges:manyEdges});assert.equal(edgeBound.edgeCount,48);assert.equal(edgeBound.maxEdges,48);
console.log(JSON.stringify({status:'PASS',suite:'v1.1 local interaction network',version:T.VERSION,nodes:a.nodeCount,edges:a.edgeCount,class:a.networkClass}));

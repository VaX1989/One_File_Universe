(function(root){
'use strict';
const O=root.OFU=root.OFU||{},V=O.v1Common,W=O.v1WorldContext,E=O.v1Ecology,BG=O.v1EcologyBiogeography;
if(!V||!W||!E||!BG)throw new Error('v1 common, world context, ecology query and local biogeography required');
const VERSION='ofu-v11-ecology-local-interaction-network-1';
const SOURCE='research/v1x-17-life-evolution-2026-09-06';
const AUTH=V.authority('v1.ecology.local-interaction-network','1.0.0',[SOURCE],
  'Bounded deterministic projection of already modeled ecosystem interactions whose endpoints are both present in the exact local modeled assemblage. This is network inspection of MODEL_DERIVED_SIMULATION, not measured food-web evidence or ecological causation.',[
    'No interaction is invented when the modeled ecosystem does not contain an exact endpoint-matched edge.',
    'Local presence comes from the existing bounded local-life model and is not empirical occupancy or abundance.',
    'Topology summaries do not imply keystone status, realized predation rate, stability, fitness, selection or causal importance.',
    'No P4 event or canonical P6 biology is created or mutated.'
  ]);
const LIMIT=1000000,MAX_NODES=12,MAX_EDGES=48;
const clamp=x=>Math.max(0,Math.min(LIMIT,Math.round(Number.isFinite(Number(x))?Number(x):0)));
const TYPES=Object.freeze(['TROPHIC','RECYCLING','COMPETITION','MUTUALISM','FACILITATION']);
function components(nodes,edges){
  const ids=nodes.map(n=>String(n.populationId)),adj=new Map(ids.map(id=>[id,new Set()]));
  for(const e of edges){const a=String(e.fromPopulationId),b=String(e.toPopulationId);if(adj.has(a)&&adj.has(b)){adj.get(a).add(b);adj.get(b).add(a);}}
  const seen=new Set(),out=[];
  for(const start of ids){if(seen.has(start))continue;const stack=[start],members=[];seen.add(start);while(stack.length){const id=stack.pop();members.push(id);for(const next of adj.get(id)||[]){if(!seen.has(next)){seen.add(next);stack.push(next);}}}members.sort();out.push(Object.freeze(members));}
  return Object.freeze(out.sort((a,b)=>b.length-a.length||String(a[0]).localeCompare(String(b[0]))));
}
function summarize(localPopulations,network){
  V.assert(Array.isArray(localPopulations),'local trophic populations');
  const local=localPopulations.slice(0,MAX_NODES),localIds=new Set(local.map(p=>String(p.populationId)));
  if(local.length===0)return V.freezeDeep({version:VERSION,supported:false,reason:'NO_MODELED_LOCAL_POPULATIONS',nodes:Object.freeze([]),edges:Object.freeze([]),nodeCount:0,edgeCount:0,maxNodes:MAX_NODES,maxEdges:MAX_EDGES,authority:AUTH,canonicalP6Unchanged:true});
  const byNetworkId=new Map((network?.nodes||[]).map(n=>[String(n.populationId),n]));
  const nodes=Object.freeze(local.map(p=>{
    const source=byNetworkId.get(String(p.populationId))||{};
    return Object.freeze({populationId:String(p.populationId),lineageId:p.lineageId==null?null:String(p.lineageId),role:String(p.role||source.role||'UNKNOWN'),trophicLevel:Number(p.trophicLevel??source.trophicLevel??0),localDensityPpm:clamp(p.localDensityPpm),authority:AUTH});
  }));
  const edges=Object.freeze((network?.edges||[]).filter(e=>localIds.has(String(e.fromPopulationId))&&localIds.has(String(e.toPopulationId))).slice(0,MAX_EDGES).map(e=>Object.freeze({
    interactionId:String(e.interactionId),fromPopulationId:String(e.fromPopulationId),toPopulationId:String(e.toPopulationId),type:String(e.type||'UNKNOWN'),
    strengthPpm:clamp(e.strengthPpm),energyTransferEfficiencyPpm:e.energyTransferEfficiencyPpm==null?null:clamp(e.energyTransferEfficiencyPpm),authority:AUTH
  })));
  const typeCounts=Object.fromEntries(TYPES.map(t=>[t,0]));let other=0;
  const degree=new Map(nodes.map(n=>[n.populationId,{in:0,out:0}]));
  for(const e of edges){if(Object.hasOwn(typeCounts,e.type))typeCounts[e.type]++;else other++;if(degree.has(e.fromPopulationId))degree.get(e.fromPopulationId).out++;if(degree.has(e.toPopulationId))degree.get(e.toPopulationId).in++;}
  const degrees=Object.freeze(nodes.map(n=>Object.freeze({populationId:n.populationId,inDegree:degree.get(n.populationId).in,outDegree:degree.get(n.populationId).out,totalDegree:degree.get(n.populationId).in+degree.get(n.populationId).out})));
  const comps=components(nodes,edges),possibleDirected=nodes.length>1?nodes.length*(nodes.length-1):0,directedEdgeOccupancyPpm=possibleDirected?clamp(edges.length*LIMIT/possibleDirected):0;
  const isolatedCount=degrees.filter(d=>d.totalDegree===0).length;
  let networkClass='MODELED_NO_LOCAL_INTERACTIONS';
  if(edges.length){networkClass=directedEdgeOccupancyPpm>=300000?'MODELED_DENSE_LOCAL_INTERACTIONS':directedEdgeOccupancyPpm>=120000?'MODELED_MODERATE_LOCAL_INTERACTIONS':'MODELED_SPARSE_LOCAL_INTERACTIONS';}
  return V.freezeDeep({version:VERSION,supported:true,nodes,edges,nodeCount:nodes.length,edgeCount:edges.length,maxNodes:MAX_NODES,maxEdges:MAX_EDGES,
    typeCounts:Object.freeze({...typeCounts,OTHER:other}),degrees,components:comps,componentCount:comps.length,isolatedCount,directedEdgeOccupancyPpm,networkClass,
    sourceGeneration:network?.generation??null,sourceWorldIdentity:network?.worldIdentity??null,exactEndpointFilter:true,syntheticEdgesAdded:false,
    measuredFoodWeb:false,interactionRateClaim:false,stabilityClaim:false,keystoneClaim:false,authority:AUTH,canonicalP6Unchanged:true,
    researchLineage:Object.freeze({sourceBranch:SOURCE,harvestedConcept:'BOUNDED_EXACT_INTERACTION_RECONCILIATION',researchAuthorityPromoted:false})});
}
function inspect(world,baseContext){
  V.assert(world&&world.biology&&world.biology.ecosystem,'local interaction world biology');
  V.assert(baseContext&&baseContext.life&&baseContext.life.local,'local interaction context');
  const network=E.trophicNetwork(world.biology.ecosystem,{limit:96});
  return summarize(baseContext.life.local.populations||[],network);
}
const previousLocalContext=W.localContext;
function localContext(world,point,options){
  const base=previousLocalContext(world,point,options),localInteractionNetwork=inspect(world,base);
  return V.freezeDeep({...base,localInteractionNetwork});
}
O.v1WorldContext=Object.freeze({...W,localContext});
O.v1EcologyLocalInteractionNetwork=Object.freeze({VERSION,AUTHORITY:AUTH,LIMIT,MAX_NODES,MAX_EDGES,TYPES,components,summarize,inspect});
})(globalThis);

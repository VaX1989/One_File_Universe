(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const VERSION='ofu-v2x-09-civilization-economy-city-1';
const ECONOMY_CONTRACT='ofu-v2x-09-bounded-economy-1';
const MORPHOLOGY_CONTRACT='ofu-v2x-09-city-morphology-1';
const IMPACT_CONTRACT='ofu-v2x-09-cross-domain-impact-proposal-1';
const AUTHORITY=Object.freeze({
  MODEL_DERIVED_SIMULATION:'MODEL_DERIVED_SIMULATION',
  DERIVED:'DERIVED',
  PRESENTATION_ONLY:'PRESENTATION_ONLY'
});
const LIMITS=Object.freeze({
  settlements:48,
  resources:1152,
  tradeEdges:96,
  facilitiesPerSettlement:8,
  institutions:256,
  impactProposals:96,
  districtsPerSettlement:12,
  historicalLayersPerSettlement:16,
  operationsPerStep:24000
});
const GOODS=Object.freeze(['SUBSISTENCE_GOODS','MATERIAL_GOODS','ENERGY_SERVICE']);
const TECH_KEYS=Object.freeze(['production','transport','materials','energy','communication','medicine','construction','conflict']);
const CAPABILITY_GRAPH=Object.freeze([
  Object.freeze({id:'BULK_STORAGE',requires:[],levels:Object.freeze({production:1,construction:1}),knowledgePpm:180000}),
  Object.freeze({id:'ROUTE_LOGISTICS',requires:['BULK_STORAGE'],levels:Object.freeze({transport:1,construction:1}),knowledgePpm:220000}),
  Object.freeze({id:'SPECIALIZED_MATERIALS',requires:['BULK_STORAGE'],levels:Object.freeze({materials:2,production:2}),knowledgePpm:280000}),
  Object.freeze({id:'PUBLIC_WORKS',requires:['ROUTE_LOGISTICS'],levels:Object.freeze({construction:2,materials:1}),knowledgePpm:320000}),
  Object.freeze({id:'ORGANIZED_DISTRIBUTION',requires:['ROUTE_LOGISTICS'],levels:Object.freeze({communication:1,production:2}),knowledgePpm:340000}),
  Object.freeze({id:'WATERBORNE_LOGISTICS',requires:['ROUTE_LOGISTICS'],levels:Object.freeze({transport:2,construction:2}),knowledgePpm:360000,context:'WATER_ACCESS'}),
  Object.freeze({id:'CENTRAL_RECORDS',requires:['ORGANIZED_DISTRIBUTION'],levels:Object.freeze({communication:2}),knowledgePpm:440000}),
  Object.freeze({id:'CARE_NETWORK',requires:['BULK_STORAGE'],levels:Object.freeze({medicine:1,communication:1}),knowledgePpm:360000}),
  Object.freeze({id:'CONFLICT_LOGISTICS',requires:['ROUTE_LOGISTICS'],levels:Object.freeze({conflict:1,transport:1}),knowledgePpm:300000})
]);
const LIMITATIONS=Object.freeze([
  'All economy, institution and city outputs are bounded model-derived scenario state, not empirical social prediction.',
  'Goods are accounting units; closure witnesses are unit-accounting identities, not conservation of physical mass or energy.',
  'City placements and district geometry are presentation schematics unless an upstream spatial model supplies physical geometry.',
  'Cross-domain impact outputs are proposals only and never mutate planet, climate, ecology, life or canonical P4 history.',
  'Institutional legitimacy, cohesion and centralization are scenario proxies and not universal sociological laws.',
  'No persistent-person identity, genealogy, private mental state or individual historical actor is created here.'
]);
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;for(const k of Object.keys(v))freeze(v[k]);return Object.freeze(v)}
function text(v){return typeof v==='string'?v:String(v??'')}
function int(v,f=0){const n=Number(v);return Number.isSafeInteger(n)?n:Math.trunc(Number.isFinite(n)?n:f)}
function clamp(v,lo=0,hi=1000000){return Math.max(lo,Math.min(hi,int(v)))}
function arr(v){return Array.isArray(v)?v:[]}
function assertBound(name,n,max){if(n>max)throw new RangeError('V2X-09 '+name+' bound exceeded: '+n+' > '+max)}
function assertUniqueIds(name,rows,key){const seen=new Set();for(const row of arr(rows)){const id=text(row?.[key]);if(!id)throw new TypeError('V2X-09 '+name+' missing '+key);if(seen.has(id))throw new RangeError('V2X-09 duplicate '+name+' id: '+id);seen.add(id)}return seen}
function hash32(s){let h=2166136261>>>0;for(const ch of text(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h>>>0}
function deriveId(kind,...parts){return 'v2x09:'+kind+':'+hash32(parts.map(text).join('|')).toString(16).padStart(8,'0')}
function unit(seed,salt){return (hash32(text(seed)+'|'+text(salt))%1000001)}
function sortId(xs,key){return xs.slice().sort((a,b)=>text(a?.[key]).localeCompare(text(b?.[key])))}
function sourceAuthority(v){const a=v?.authority;const candidate=typeof a==='string'?a:(a?.authorityClass??a?.class??a?.authority??v?.authorityClass);return typeof candidate==='string'&&Object.values(AUTHORITY).includes(candidate)?candidate:null}
function validateCivilization(state){
  if(!state||state.state!=='MODELED_CIVILIZATION')return false;
  const settlements=arr(state.settlements),resources=arr(state.resources),tradeEdges=arr(state.tradeEdges),regions=arr(state.regions),polities=arr(state.polities),infrastructure=arr(state.infrastructure),historyProposals=arr(state?.history?.proposals);
  assertBound('settlements',settlements.length,LIMITS.settlements);assertBound('resources',resources.length,LIMITS.resources);assertBound('tradeEdges',tradeEdges.length,LIMITS.tradeEdges);
  assertUniqueIds('settlement',settlements,'settlementId');assertUniqueIds('resource',resources,'resourceId');assertUniqueIds('trade edge',tradeEdges,'edgeId');
  assertUniqueIds('region',regions,'regionId');assertUniqueIds('polity',polities,'polityId');assertUniqueIds('infrastructure asset',infrastructure,'infrastructureId');assertUniqueIds('history proposal',historyProposals,'eventProposalId');
  return true;
}
function techLevel(t,key){return clamp(t?.[key]??0,0,8)}
function technologyProfile(state){
  const t=state?.technology||{};
  const knowledge=clamp(t.knowledgeContinuityPpm||0);
  const regions=arr(state?.regions);
  const hasWaterAccess=regions.some(r=>clamp(r.waterPpm||0)>=450000);
  const supported=new Set(),nodes=[];
  for(const node of CAPABILITY_GRAPH){
    const missing=[];
    for(const req of node.requires)if(!supported.has(req))missing.push('CAPABILITY:'+req);
    for(const [key,min] of Object.entries(node.levels))if(techLevel(t,key)<min)missing.push('LEVEL:'+key+'>='+min);
    if(knowledge<node.knowledgePpm)missing.push('KNOWLEDGE_PPM>='+node.knowledgePpm);
    if(node.context==='WATER_ACCESS'&&!hasWaterAccess)missing.push('CONTEXT:WATER_ACCESS');
    const active=missing.length===0;if(active)supported.add(node.id);
    nodes.push(freeze({id:node.id,active,missing,requires:node.requires,levelRequirements:node.levels,knowledgeRequirementPpm:node.knowledgePpm,contextRequirement:node.context||null}));
  }
  return freeze({contract:'ofu-v2x-09-technology-prerequisite-graph-1',authority:AUTHORITY.DERIVED,knowledgeContinuityPpm:knowledge,nodes,activeCapabilities:[...supported].sort(),independentLevelCounterClaim:false});
}
function goodForResource(r){
  const t=text(r?.transformsTo).toUpperCase(),c=text(r?.resourceClass).toUpperCase();
  if(GOODS.includes(t))return t;
  if(c.includes('BIO')||c.includes('FOOD')||c.includes('SUBSIST'))return 'SUBSISTENCE_GOODS';
  if(c.includes('ENERGY')||c.includes('FUEL'))return 'ENERGY_SERVICE';
  return 'MATERIAL_GOODS';
}
function tradeDegree(state,settlementId){
  const activeSettlements=new Set(arr(state?.settlements).filter(s=>text(s?.status||'UNKNOWN').toUpperCase()==='ACTIVE').map(s=>text(s.settlementId)));
  return arr(state?.tradeEdges).filter(e=>text(e?.status||'UNKNOWN').toUpperCase()==='ACTIVE'&&activeSettlements.has(text(e.from))&&activeSettlements.has(text(e.to))&&(e.from===settlementId||e.to===settlementId)).length;
}

O.v2x09CivilizationCore=Object.freeze({VERSION,ECONOMY_CONTRACT,MORPHOLOGY_CONTRACT,IMPACT_CONTRACT,AUTHORITY,LIMITS,GOODS,TECH_KEYS,CAPABILITY_GRAPH,LIMITATIONS,freeze,text,int,clamp,arr,assertBound,assertUniqueIds,hash32,deriveId,unit,sortId,sourceAuthority,validateCivilization,techLevel,technologyProfile,goodForResource,tradeDegree});
})(typeof globalThis!=='undefined'?globalThis:this);

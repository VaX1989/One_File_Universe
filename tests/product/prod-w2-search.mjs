import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  SEARCH_SORT,SEARCH_STATE,SEARCH_ENGINE_VERSION,SEARCH_METRIC_VERSION,INTERESTINGNESS_MODEL_VERSION,
  boundedSearch,scientificSimilarity
} from '../../src/product/exploration/search/bounded-search.js';
import {createAtlasSearchProvider} from '../../src/product/exploration/search/atlas-search-provider.js';
import {createNearbySystemSearchProvider} from '../../src/product/exploration/search/sparse-address-provider.js';

const h=n=>n.toString(16).padStart(64,'0');
const val=value=>({state:SEARCH_STATE.VALUE,value});
const unknown=()=>({state:SEARCH_STATE.UNKNOWN,value:null});
const fp=(n,{model='model-1',status='PRESENT',authority='MODEL_DERIVED'}={})=>({
 status,scientificStateContract:'ofu-r6-world-scientific-state-1',scientificModelVersion:status==='UNKNOWN'?null:model,
 scientificHashes:status==='UNKNOWN'?{planet:null,context:null,surface:null,sample:null}:{planet:h(n),context:h(n+100),surface:null,sample:null},
 authorityByDomain:{identity:'CANONICAL',astronomy:authority,physicalPlanet:authority,environment:authority}
});
const candidate=(n,{fingerprint=fp(n),novelty=500000,rarity=500000,temp=280000,label='world-'+n}={})=>({
 identity:{universeId:'u',entityKind:'planet',canonicalId:h(n),canonicalKey:{siteX:String(n),orbitSlot:'0'}},
 properties:{temperatureMilliK:temp===null?unknown():val(temp),noveltyPpm:novelty===null?unknown():val(novelty),rarityPpm:rarity===null?unknown():val(rarity),label:val(label)},
 fingerprint,provenance:{source:'TEST_PROVIDER',authority:'ANALYSIS_ONLY',exact:true},atlasEntryId:null
});
const provider=(id,rows,{reverse=false,onDiscover=null}={})=>({id,version:'1',authority:'ANALYSIS_ONLY',async discover({limit}){onDiscover?.();const a=reverse?[...rows].reverse():[...rows];return a.slice(0,limit)}});

assert.equal(SEARCH_ENGINE_VERSION,'ofu-prod-w2-search-engine-1');
const rows=[candidate(3,{novelty:900000,rarity:800000}),candidate(1),candidate(2,{fingerprint:fp(1)})];
const q={intent:'fixture'};
const first=await boundedSearch({providers:[provider('b',rows.slice(0,1)),provider('a',rows.slice(1))],query:q,sort:SEARCH_SORT.SIMILARITY,referenceFingerprint:fp(1)});
const second=await boundedSearch({providers:[provider('a',rows.slice(1),{reverse:true}),provider('b',rows.slice(0,1))],query:q,sort:SEARCH_SORT.SIMILARITY,referenceFingerprint:fp(1)});
assert.deepEqual(first,second,'provider and equivalent candidate ordering must not affect results');
assert.deepEqual(first.results.slice(0,2).map(x=>x.identity.canonicalId),[h(1),h(2)],'similarity ties must use canonical identity tie-breaking');
assert.equal(first.results[0].similarity.metricVersion,SEARCH_METRIC_VERSION);
assert.equal(first.results[0].interestingness.modelVersion,INTERESTINGNESS_MODEL_VERSION);
assert.ok(first.results[0].interestingness.rationale.some(x=>x.includes('user history is not an input')));
assert.equal(first.enumeratesUniverse,false);assert.equal(first.globalIndexUsed,false);assert.equal(first.userHistoryUsed,false);assert.equal(first.networkRequired,false);

const filtered=await boundedSearch({providers:[provider('f',[candidate(1,{temp:300000}),candidate(2,{temp:null})])],filters:[{property:'temperatureMilliK',op:'GTE',value:290000,unknownPolicy:'REJECT'}]});
assert.deepEqual(filtered.results.map(x=>x.identity.canonicalId),[h(1)]);
const allowUnknown=await boundedSearch({providers:[provider('f',[candidate(1,{temp:300000}),candidate(2,{temp:null})])],filters:[{property:'temperatureMilliK',op:'GTE',value:290000,unknownPolicy:'ALLOW'}]});
assert.equal(allowUnknown.results.length,2,'UNKNOWN must remain explicit and may only pass when policy says ALLOW');
await assert.rejects(()=>boundedSearch({providers:[provider('f',[candidate(1)])],filters:[{property:'unsupportedThing',op:'EQ',value:0,unknownPolicy:'REJECT'}]}),/unsupported property filter/);
await assert.rejects(()=>boundedSearch({providers:[provider('f',[candidate(1)])],filters:[{property:'label',op:'REGEX',value:'x',unknownPolicy:'REJECT'}]}),/unsupported filter operator/);

const fullW1Fingerprint={schemaVersion:1,contract:'ofu-r6-w1-scientific-fingerprint-1',subject:{canonicalId:h(1)},generatorVersion:'gen-1',limitations:[],...fp(1)};
const fullFingerprintSearch=await boundedSearch({providers:[provider('full',[candidate(1)])],referenceFingerprint:fullW1Fingerprint,sort:SEARCH_SORT.SIMILARITY});
assert.equal(fullFingerprintSearch.results[0].similarity.state,SEARCH_STATE.VALUE,'full W1 Scientific Fingerprint must be accepted directly');

const unknownSimilarity=scientificSimilarity(fp(1),fp(2,{status:'UNKNOWN'}));assert.equal(unknownSimilarity.state,SEARCH_STATE.UNKNOWN);assert.equal(unknownSimilarity.scorePpm,null);
const unsupportedSimilarity=scientificSimilarity(fp(1),fp(1,{model:'model-2'}));assert.equal(unsupportedSimilarity.state,SEARCH_STATE.UNSUPPORTED);assert.equal(unsupportedSimilarity.scorePpm,null);

const many=Array.from({length:12},(_,i)=>candidate(i+10));
const capped=await boundedSearch({providers:[provider('cap',many)],budget:{maxCandidates:4,maxResults:2,maxBytes:262144,maxProviderCalls:1}});
assert.equal(capped.usage.candidatesSeen,4);assert.equal(capped.results.length,2);assert.equal(capped.truncated,true);
assert.ok(capped.usage.bytesUsed<=capped.usage.maxBytes);
const byteCapped=await boundedSearch({providers:[provider('bytes',many)],budget:{maxCandidates:12,maxResults:12,maxBytes:1024,maxProviderCalls:1}});assert.equal(byteCapped.truncated,true);assert.equal(byteCapped.results.length,0);assert.ok(byteCapped.usage.bytesUsed<=1024);

const ac=new AbortController();ac.abort();const cancelled=await boundedSearch({providers:[provider('x',[candidate(1)])],signal:ac.signal});assert.equal(cancelled.cancelled,true);assert.equal(cancelled.cancelReason,'ABORT_SIGNAL');assert.equal(cancelled.results.length,0);
let generation=1;const stale=await boundedSearch({providers:[provider('x',[candidate(1)],{onDiscover:()=>{generation=2}})],generationToken:1,currentGeneration:()=>generation});assert.equal(stale.cancelled,true);assert.equal(stale.cancelReason,'STALE_GENERATION');assert.equal(stale.results.length,0);assert.equal(stale.usage.returnedBytes,0);

const canonicalWorld={p2:{digest:h(50)},p4:{stateDigest:h(51)}};const before=JSON.stringify(canonicalWorld);await boundedSearch({providers:[provider('immut',[candidate(1)])]});assert.equal(JSON.stringify(canonicalWorld),before,'search must not mutate canonical state');

const subject=n=>({schemaVersion:1,contract:'ofu-r6-w1-canonical-entity-ref-1',universeId:'atlas-u',entityKind:'PLANET',canonicalId:h(n),canonicalKey:{orbitSlot:'0',siteX:String(n)}});
const entries=[
 {id:'obs-0000000000000002',observation:{kind:'SNAPSHOT',subject:subject(2),label:'Exact state',temporalRef:{stateDigest:h(222)},scientificFingerprintRef:{subjectCanonicalId:h(2)}}},
 {id:'obs-0000000000000001',observation:{kind:'PLACE',subject:subject(1),label:null,temporalRef:null,scientificFingerprintRef:null}}
];
const atlas={listEntries:()=>entries,revisitPlan:id=>{const e=entries.find(x=>x.id===id);return {authority:'REFERENCE_ONLY',atlasEntryId:id,subject:e.observation.subject,temporalRef:e.observation.temporalRef,scientificFingerprintRef:e.observation.scientificFingerprintRef,exactTemporalStateReference:e.observation.temporalRef!==null,presentationHintOnly:false,mutatesWorld:false,mutatesSelection:false,mutatesCamera:false}}};
const atlasProvider=createAtlasSearchProvider({atlas,fingerprintResolver:ref=>ref?fp(2):null});
const atlasResults=await boundedSearch({providers:[atlasProvider],filters:[{property:'atlasKind',op:'EQ',value:'SNAPSHOT',unknownPolicy:'REJECT'}]});
assert.equal(atlasResults.results.length,1);assert.equal(atlasResults.results[0].atlasEntryId,'obs-0000000000000002');assert.equal(atlasResults.results[0].provenance.revisitPlan.temporalRef.stateDigest,h(222));assert.equal(atlasResults.results[0].provenance.revisitPlan.mutatesWorld,false);

const sparseNode=n=>({kind:'system',universeId:'sparse-u',entityId:'sys-'+n,canonicalId:h(300+n),canonicalKey:{galaxyX:0n,galaxyY:0n,galaxyZ:0n,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:BigInt(n),siteY:0n,siteZ:0n},sourceAuthority:'CANONICAL_PROVEN'});
let observedSparseLimit=null;const sparseAddressSpace={systemDiscoveryContract:'BOUNDED_SITE_WINDOW_V1',MAX_RESULTS:64,discoverNearbySystems:({limit,maxProbes,radiusSites})=>{observedSparseLimit=limit;return {bounded:true,systems:[sparseNode(2),sparseNode(1)].slice(0,limit),probes:2,maxProbes,radiusSites,nextCursor:null}}};
const sparseProvider=createNearbySystemSearchProvider({addressSpace:sparseAddressSpace,ctx:{},anchorSystem:{kind:'system',entityId:'anchor'},radiusSites:3,maxProbes:16});
const sparseResults=await boundedSearch({providers:[sparseProvider]});assert.equal(observedSparseLimit,64,'sparse adapter must respect the address-space MAX_RESULTS contract');assert.deepEqual(sparseResults.results.map(x=>x.identity.canonicalId),[h(301),h(302)]);assert.ok(sparseResults.results.every(x=>x.provenance.bounded&&x.provenance.wholeUniverseEnumeration===false&&x.provenance.exactAddressReference));

const source=fs.readFileSync('./src/product/exploration/search/bounded-search.js','utf8')+fs.readFileSync('./src/product/exploration/search/atlas-search-provider.js','utf8')+fs.readFileSync('./src/product/exploration/search/sparse-address-provider.js','utf8');
for(const forbidden of ['fetch(','XMLHttpRequest','WebSocket','EventSource'])assert.equal(source.includes(forbidden),false,'search runtime must not introduce network resources: '+forbidden);

console.log(JSON.stringify({schema:'ofu-prod-w2-search-test-v1',status:'PASS',results:first.results.length,deterministicOrder:first.results.map(x=>x.identity.canonicalId),candidateBudget:capped.usage.candidatesSeen,resultBudget:capped.results.length,atlasExactState:atlasResults.results[0].provenance.revisitPlan.temporalRef.stateDigest,networkResources:0,canonicalMutation:false}));

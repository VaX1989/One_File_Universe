import assert from 'node:assert/strict';
import {
  W1_AUTHORITY,
  createCanonicalEntityRef
} from '../../src/product/contracts/w1-observation-contracts.js';
import {createWorldScientificState} from '../../src/experiments/spatial-continuum/scientific-state.js';
import {
  SCIENTIFIC_WHY_AUTHORITY,
  SCIENTIFIC_WHY_EDGE_TYPE,
  SCIENTIFIC_WHY_NODE_TYPE,
  SCIENTIFIC_WHY_PROVIDER,
  SCIENTIFIC_WHY_STATUS,
  SCIENTIFIC_WHY_UNCERTAINTY_KIND,
  inspectScientificWhy,
  projectScientificWhy,
  serializeScientificWhyGraph
} from '../../src/product/w1/scientific-why.js';

const canonicalId='0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const universeId='universe-fixture';
const canonicalKey={galaxyX:1n,galaxyY:2n,galaxyZ:3n,sectorX:4n,sectorY:5n,sectorZ:6n,siteX:7n,siteY:8n,siteZ:9n,orbitSlot:2n};
const runtime={ctx:{masterSeed:Uint8Array.from({length:32},(_,index)=>index)},universe:{universeId}};
const system={entityId:'system-fixture',metadata:{facts:{baselineAgeMyr:4500n,baselineMetallicityMilliDex:0n,baselinePrimaryMassMilliSolar:1000n,protoplanetarySolidBudgetPermille:800n,planetCount:3n,planetArchitecture:'ORDERED'}}};
const body={entityId:canonicalId,canonicalId,canonicalKey,metadata:{facts:{bulkPriorClass:'TERRESTRIAL',baselineMassMilliEarth:1000n,baselineSemiMajorAxisMicroAu:1000000n,baselineEccentricityPpm:20000n,baselineInclinationMilliDeg:0n,baselineInsolationPpm:1000000n,moonCount:1n}}};
const physical={physical:{meanRadiusM:6371000n,surfaceGravityMicroMs2:9810000n,meanDensityKgM3:5514n,composition:{model:'TEST',coreMassFractionPermille:320n,coreFractionPpm:320000n,mantleFractionPpm:680000n}}};
const modeledWorld={planetology:{
  formation:{temperatureIndexPpm:400000,ageMyr:4500},
  composition:{metalPpm:320000,silicatePpm:560000,volatilePpm:120000,sumPpm:1000000},
  interior:{coreFractionPpm:320000,heatIndexPpm:600000,geodynamicRegime:'TEST_SCENARIO'},
  volatiles:{initialInventoryUnits:120000,interiorUnits:20000,surfaceCondensedUnits:30000,atmosphereUnits:1000,lostUnits:70000,conserved:true},
  atmosphere:{inventoryUnits:1000,modelPressureProxy:1,canonicalPressure:false},
  climate:{model:'TEST',stellarFluxPpm:1000000,bondAlbedoPpm:300000,effectiveTemperatureMilliK:250000,greenhouseDeltaMilliK:38000,surfaceTemperatureMilliK:288000,temperatureAuthority:'MODEL_DERIVED',measured:false},
  hydrosphere:{liquidSurfaceEligible:false,waterAreaPpm:0,iceFractionPpm:0,canonicalOceanClaim:false},
  surfaceProcesses:{tectonicActivityPpm:600000,erosionPotentialPpm:220000,impactRetentionPpm:540000}
}};
const point={locationIdentity:'surface-fixture',latMicroDeg:12345,lonMicroDeg:-54321};
const sample={entityId:'sample-fixture',kind:'ROCK'};
const source={phase:'SOLID',structure:'POLYCRYSTALLINE',chemistryAuthority:'MODEL_DERIVED',components:[{id:'SILICA'}]};
const subject=createCanonicalEntityRef({universeId,entityKind:'planet',canonicalId,canonicalKey});
const worldState=createWorldScientificState({runtime,system,body,physical,modeledWorld,point,sample,source});
const modelVersion=worldState.versions.scientificModel;

const endpoint=(key,nodeType,authority)=>({key,nodeType,authority});
const candidate=(from,to,relation,explicitCausalClaim,provenanceClass)=>({
  from,to,relation,subjectCanonicalId:canonicalId,scientificModelVersion:modelVersion,explicitCausalClaim,provenanceClass
});
const assumption=(id,text,scope,sourceAuthority='MODEL_DERIVED')=>({
  id,text,scope,sourceAuthority,subjectCanonicalId:canonicalId,scientificModelVersion:modelVersion,provenanceClass:'FIXTURE_EXPLICIT_ASSUMPTION'
});
const uncertainty=(id,scope,kind,parameters,sourceAuthority='MODEL_DERIVED')=>({
  id,scope,kind,parameters,sourceAuthority,subjectCanonicalId:canonicalId,scientificModelVersion:modelVersion,provenanceClass:'FIXTURE_EXPLICIT_UNCERTAINTY'
});

assert.equal(SCIENTIFIC_WHY_PROVIDER.authority,W1_AUTHORITY.ANALYSIS_ONLY);
assert.equal(SCIENTIFIC_WHY_PROVIDER.canonicalPromotion,false);
assert.equal(SCIENTIFIC_WHY_PROVIDER.generatedProseAuthoritative,false);
assert.equal(SCIENTIFIC_WHY_PROVIDER.boundedQuery,true);

const gravity=endpoint('planet.surfaceGravityMicroMs2',SCIENTIFIC_WHY_NODE_TYPE.SCIENTIFIC_PROPERTY,W1_AUTHORITY.MODEL_DERIVED);
const relief=endpoint('presentation.terrain.relief',SCIENTIFIC_WHY_NODE_TYPE.PRESENTATION_CONSEQUENCE,W1_AUTHORITY.PRESENTATION_ONLY);
const climate=endpoint('environment.climate',SCIENTIFIC_WHY_NODE_TYPE.MODEL_OUTPUT,W1_AUTHORITY.MODEL_DERIVED);
const habitability=endpoint('analysis.habitability',SCIENTIFIC_WHY_NODE_TYPE.MODEL_OUTPUT,W1_AUTHORITY.ANALYSIS_ONLY);
const unknownLocal=endpoint('surface.exactLocalMineralogy',SCIENTIFIC_WHY_NODE_TYPE.SCIENTIFIC_PROPERTY,W1_AUTHORITY.UNKNOWN);
const unsupportedWeather=endpoint('surface.localWeather',SCIENTIFIC_WHY_NODE_TYPE.SCIENTIFIC_PROPERTY,SCIENTIFIC_WHY_AUTHORITY.UNSUPPORTED);

const candidates=[
  candidate(gravity,relief,SCIENTIFIC_WHY_EDGE_TYPE.CAUSES,true,'FIXTURE_EXPLICIT_CAUSAL_MODEL'),
  candidate(climate,habitability,SCIENTIFIC_WHY_EDGE_TYPE.CONSTRAINS,false,'FIXTURE_EXPLICIT_MODEL_CONSTRAINT'),
  candidate(unknownLocal,habitability,SCIENTIFIC_WHY_EDGE_TYPE.UNKNOWN,false,'FIXTURE_EXPLICIT_UNKNOWN'),
  candidate(unsupportedWeather,habitability,SCIENTIFIC_WHY_EDGE_TYPE.UNSUPPORTED,false,'FIXTURE_EXPLICIT_UNSUPPORTED')
];
const assumptions=[
  assumption('a-spherical','Physical radius is interpreted under the fixture spherical-body model.',gravity)
];
const uncertainties=[
  uncertainty('u-climate',climate,SCIENTIFIC_WHY_UNCERTAINTY_KIND.INTERVAL,{unit:'mK',min:280000,max:296000}),
  uncertainty('u-local-mineralogy',unknownLocal,SCIENTIFIC_WHY_UNCERTAINTY_KIND.UNKNOWN,{reason:'no source-backed local mineralogy provider'},W1_AUTHORITY.UNKNOWN)
];

const first=projectScientificWhy({subject,worldState,ancestryCandidates:candidates,assumptions,uncertainties});
const second=projectScientificWhy({subject,worldState,ancestryCandidates:[...candidates].reverse(),assumptions:[...assumptions].reverse(),uncertainties:[...uncertainties].reverse()});
assert.equal(first.graphHash,second.graphHash,'semantically equivalent input ordering must preserve graph identity');
assert.equal(first.canonicalGraph,second.canonicalGraph,'canonical graph serialization must be order-independent');
assert.equal(serializeScientificWhyGraph(first),first.canonicalGraph);
assert.match(first.graphHash,/^[0-9a-f]{64}$/);
assert.match(first.graphId,/^why-[0-9a-f]{24}$/);
assert.equal(first.scientificClaimsAdded,false);
assert.equal(first.generatedProseAuthoritative,false);
assert.equal(first.sourceFingerprintProvider.id,'ofu.product.w1.scientific-fingerprint');
assert.equal(first.scientificModelVersion,modelVersion);
assert.equal(first.subject.canonicalId,canonicalId);
assert.equal(first.subject.universeId,universeId);
assert.equal(first.assumptionsState,'EXPLICIT_UPSTREAM_BOUND_INPUT');
assert.equal(first.uncertaintyState,'EXPLICIT_UPSTREAM_BOUND_INPUT');

const causal=first.edges.find(edge=>edge.edgeType===SCIENTIFIC_WHY_EDGE_TYPE.CAUSES);
assert.ok(causal);
assert.equal(causal.causalClaim,true);
assert.equal(causal.knowledgeStatus,SCIENTIFIC_WHY_STATUS.SUPPORTED);
assert.equal(causal.authorities.source,W1_AUTHORITY.MODEL_DERIVED);
assert.equal(causal.authorities.target,W1_AUTHORITY.PRESENTATION_ONLY);
assert.equal(causal.authorities.projection,W1_AUTHORITY.ANALYSIS_ONLY);
assert.equal(causal.authorities.effective,W1_AUTHORITY.PRESENTATION_ONLY,'mixed-authority path must downgrade to the weakest applicable authority');
assert.equal(causal.provenance.subjectCanonicalId,canonicalId);
assert.equal(causal.provenance.scientificModelVersion,modelVersion);

const explicitUnknown=first.edges.find(edge=>edge.edgeType===SCIENTIFIC_WHY_EDGE_TYPE.UNKNOWN);
assert.ok(explicitUnknown);
assert.equal(explicitUnknown.knowledgeStatus,SCIENTIFIC_WHY_STATUS.UNKNOWN);
assert.equal(explicitUnknown.authorities.effective,W1_AUTHORITY.UNKNOWN);

const explicitUnsupported=first.edges.find(edge=>edge.edgeType===SCIENTIFIC_WHY_EDGE_TYPE.UNSUPPORTED);
assert.ok(explicitUnsupported);
assert.equal(explicitUnsupported.knowledgeStatus,SCIENTIFIC_WHY_STATUS.UNSUPPORTED);
assert.equal(explicitUnsupported.authorities.effective,SCIENTIFIC_WHY_AUTHORITY.UNSUPPORTED);
assert.ok(first.counts.unknownEdges>=1);
assert.ok(first.counts.unsupportedEdges>=1);

const presentationEdges=first.edges.filter(edge=>edge.edgeType===SCIENTIFIC_WHY_EDGE_TYPE.MODEL_CONDITIONED_PRESENTATION);
assert.ok(presentationEdges.length>=4);
assert.ok(presentationEdges.every(edge=>edge.causalClaim===false),'upstream presentation influence must not be silently promoted to scientific CAUSES');
assert.ok(presentationEdges.every(edge=>edge.authorities.target===W1_AUTHORITY.PRESENTATION_ONLY));

const unknownLimitations=first.nodes.filter(node=>node.nodeType===SCIENTIFIC_WHY_NODE_TYPE.LIMITATION&&node.knowledgeStatus===SCIENTIFIC_WHY_STATUS.UNKNOWN);
assert.ok(unknownLimitations.length>=4,'upstream explicit unknowns must survive as first-class nodes');
assert.equal(first.uncertainties.length,2);
assert.equal(first.uncertainties.find(item=>item.id==='u-local-mineralogy').kind,SCIENTIFIC_WHY_UNCERTAINTY_KIND.UNKNOWN);

const inspection=inspectScientificWhy(first,{maxDepth:4,maxEdges:12});
assert.equal(inspection.authority,W1_AUTHORITY.PRESENTATION_ONLY);
assert.equal(inspection.stateAuthority,false);
assert.equal(inspection.sourceGraphHash,first.graphHash);
assert.ok(inspection.explanations.length<=12);
assert.match(inspection.summary,/presentation-only/i);

const focus=first.nodes.find(node=>node.key.includes('analysis.habitability'));
const focused=inspectScientificWhy(first,{focusNodeId:focus.id,maxDepth:2,maxEdges:2});
assert.equal(focused.focusNodeId,focus.id);
assert.ok(focused.edges.length<=2);
assert.equal(focused.truncated,true,'tight inspection bound should expose truncation instead of silently dropping provenance');

const unknown=projectScientificWhy({subject,worldState:null});
assert.equal(unknown.fingerprintStatus,'UNKNOWN');
assert.equal(unknown.fingerprintRef,null);
assert.equal(unknown.scientificModelVersion,null);
assert.equal(unknown.assumptionsState,'NOT_DECLARED_UPSTREAM');
assert.equal(unknown.uncertaintyState,'NOT_DECLARED_UPSTREAM');
assert.equal(unknown.scientificClaimsAdded,false);
const unknownInspection=inspectScientificWhy(unknown);
assert.match(unknownInspection.summary,/UNKNOWN/);

const wrongSubject=createCanonicalEntityRef({universeId,entityKind:'planet',canonicalId:'f'.repeat(64),canonicalKey});
assert.throws(()=>projectScientificWhy({subject:wrongSubject,worldState}),/canonical identity/);
const wrongUniverse=createCanonicalEntityRef({universeId:'other-universe',entityKind:'planet',canonicalId,canonicalKey});
assert.throws(()=>projectScientificWhy({subject:wrongUniverse,worldState}),/subject universe/);

const mismatchedCandidate={...candidates[0],scientificModelVersion:'wrong-model'};
assert.throws(()=>projectScientificWhy({subject,worldState,ancestryCandidates:[mismatchedCandidate]}),/scientific model version mismatch/);
const mismatchedIdentity={...candidates[0],subjectCanonicalId:'f'.repeat(64)};
assert.throws(()=>projectScientificWhy({subject,worldState,ancestryCandidates:[mismatchedIdentity]}),/subject identity mismatch/);

const correlationClaim={...candidates[1],relation:SCIENTIFIC_WHY_EDGE_TYPE.CORRELATES,explicitCausalClaim:true};
assert.throws(()=>projectScientificWhy({subject,worldState,ancestryCandidates:[correlationClaim]}),/non-CAUSES relation cannot assert a causal claim/);
const unclaimedCause={...candidates[0],explicitCausalClaim:false};
assert.throws(()=>projectScientificWhy({subject,worldState,ancestryCandidates:[unclaimedCause]}),/CAUSES requires explicitCausalClaim=true/);

const a=endpoint('cycle.a',SCIENTIFIC_WHY_NODE_TYPE.MODEL_OUTPUT,W1_AUTHORITY.MODEL_DERIVED);
const b=endpoint('cycle.b',SCIENTIFIC_WHY_NODE_TYPE.MODEL_OUTPUT,W1_AUTHORITY.MODEL_DERIVED);
const cycle=[
  candidate(a,b,SCIENTIFIC_WHY_EDGE_TYPE.CAUSES,true,'FIXTURE_CYCLE'),
  candidate(b,a,SCIENTIFIC_WHY_EDGE_TYPE.CAUSES,true,'FIXTURE_CYCLE')
];
assert.throws(()=>projectScientificWhy({subject,worldState,ancestryCandidates:cycle}),/causal ancestry cycle detected/);

assert.throws(()=>projectScientificWhy({subject,worldState,ancestryCandidates:candidates,limits:{maxNodes:8}}),/node resource bound exceeded/);
assert.throws(()=>projectScientificWhy({subject,worldState,ancestryCandidates:Array.from({length:3},()=>candidates[0]),limits:{maxCandidates:2}}),/ancestry candidate count out of bounds/);
assert.throws(()=>inspectScientificWhy({...first,graphHash:'0'.repeat(64)}),/graph integrity mismatch/);
assert.throws(()=>inspectScientificWhy(first,{focusNodeId:'missing'}),/focus node is unknown/);

console.log(JSON.stringify({
  schema:'ofu-prod-w1-sci-why-test-v1',
  status:'PASS',
  provider:SCIENTIFIC_WHY_PROVIDER.id,
  graphHash:first.graphHash,
  nodes:first.counts.nodes,
  edges:first.counts.edges,
  unknownEdges:first.counts.unknownEdges,
  unsupportedEdges:first.counts.unsupportedEdges,
  assumptions:first.counts.assumptions,
  uncertainties:first.counts.uncertainties,
  canonicalGraphBytes:Buffer.byteLength(first.canonicalGraph),
  boundedInspectionEdges:focused.edges.length,
  boundedInspectionTruncated:focused.truncated
}));

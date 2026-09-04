import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const panel=fs.readFileSync('src/bootstrap/product/inspect-panel.html','utf8');
const source=fs.readFileSync('src/bootstrap/product/inspector-product.js','utf8');

assert.match(panel,/What the canonical model says|Understand what the canonical model says/);
assert.match(panel,/Environment/);
assert.match(panel,/Biology/);
assert.match(panel,/Evidence, limits & provenance/);
assert.match(panel,/Advanced details & canonical record/);
assert.match(panel,/Open Lab technical evidence/);
assert.ok(panel.indexOf('Entity Identity')>panel.indexOf('Advanced details & canonical record'),'raw identity must be progressively disclosed');
assert.ok(panel.indexOf('Canonical address query')>panel.indexOf('Advanced details & canonical record'),'raw query must be progressively disclosed');
assert.match(panel,/Unknown values remain unknown/);
assert.doesNotMatch(panel,/Unknown values.*(?:dead|sterile|lifeless|uninhabitable)/i);

const ids=[...panel.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Inspector panel must not contain duplicate IDs');
assert.equal((panel.match(/<details\b/g)||[]).length,(panel.match(/<\/details>/g)||[]).length,'details elements must be balanced');

class FakeNode{
  constructor(){this.textContent='';this.children=[];this.className='';}
  append(...nodes){this.children.push(...nodes);}
}
const nodes=Object.fromEntries(ids.map(id=>[id,new FakeNode()]));
const sandbox={
  globalThis:null,
  OFU:{
    p2:{hex(){return 'witness-digest';}},
    productUI:{keyLabel(type){return type+' human location';}},
    p3Astronomy:{EVIDENCE:{planetOccurrence:{evidenceClass:'EMPIRICALLY_CONSTRAINED'},planetBulkPrior:{evidenceClass:'EMPIRICALLY_CONSTRAINED'}}}
  },
  document:{readyState:'loading',addEventListener(){},getElementById(id){return nodes[id]||null;},createElement(){return new FakeNode();}},
  setInterval(){},addEventListener(){}
};
sandbox.globalThis=sandbox;
vm.runInNewContext(source,sandbox,{filename:'inspector-product.js'});
const api=sandbox.OFU.v08InspectorProduct;
assert.equal(api.seamVersion,2);
assert.equal(api.statusLabel('KNOWN'),'Known');
assert.equal(api.statusLabel('DERIVED'),'Derived');
assert.equal(api.statusLabel('UNKNOWN'),'Not established');
assert.equal(api.statusLabel('UNSUPPORTED'),'Outside current model');

assert.match(api.p6Copy.INSUFFICIENT_ENVIRONMENT.primary,/cannot currently make a canonical biosphere assessment/i);
assert.match(api.p6Copy.INSUFFICIENT_ENVIRONMENT.limit,/does not mean dead, sterile, lifeless, or uninhabitable/i);
assert.match(api.p6Copy.UNSUPPORTED_ENVIRONMENT.primary,/outside the semantics currently supported/i);
assert.match(api.p6Copy.UNSUPPORTED_ENVIRONMENT.limit,/Unsupported is distinct from absent or lifeless/i);
assert.match(api.p6Copy.NO_BIOSPHERE.primary,/no canonical biosphere is established/i);
assert.notEqual(api.p6Copy.INSUFFICIENT_ENVIRONMENT.primary,api.p6Copy.UNSUPPORTED_ENVIRONMENT.primary);

assert.match(api.unsupportedReason('P5_MASS_DOMAIN'),/mass lies outside the promoted domain/i);
assert.match(api.unsupportedReason('MASS_DOMAIN'),/mass lies outside the promoted domain/i);
assert.match(api.unsupportedReason('P5_BULK_PRIOR'),/bulk class/i);
assert.match(api.unsupportedReason('P3_ABSENT'),/No canonical target exists/i);
for(const forbidden of ['dead','sterile','lifeless','uninhabitable'])assert.ok(!api.unsupportedReason('P5_MASS_DOMAIN').toLowerCase().includes(forbidden));

const key={galaxyX:48n,galaxyY:-50n,galaxyZ:-1n,sectorX:0n,sectorY:0n,sectorZ:0n,siteX:8n,siteY:0n,siteZ:0n,orbitSlot:0n};
const planet={entityType:'PLANET',facts:{baselineSemiMajorAxisMicroAu:1000000n,baselineEccentricityPpm:10000n,baselineInclinationMilliDeg:1000n,baselineMassMilliEarth:2000n,bulkPriorClass:'TERRESTRIAL',baselineInsolationPpm:1000000n,moonCount:1n,orbitCenter:'STAR'}};
sandbox.OFU.inspectorTest={state:{current:{type:'Planet',key,r:planet}}};
nodes['entity-output'].textContent='{"status":"PRESENT"}';

sandbox.__OFU_PLANET_PREVIEW__={
  chosen:{key},targetStatus:'SUPPORTED',targetReason:null,
  physical:{physical:{meanRadiusM:7000000n,surfaceGravityMicroMs2:11000000n,meanDensityKgM3:5500n},upstreamBaseline:{formation:{bulkPriorClass:'TERRESTRIAL'}},evidence:{massRadius:{evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'APPROXIMATE'},gravityDensity:{evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE'}}},
  environment:{authority:'P5_CANONICAL',contractId:'ofu-p5-p6-environment-v2',atmosphere:{epistemicStatus:'UNKNOWN',provenance:'NO_CANONICAL_VOLATILE_GENESIS'},pressure:{epistemicStatus:'UNKNOWN',provenance:'ATMOSPHERIC_MASS_UNKNOWN'},radiativeTier0:{insolation:{valuePpm:1000000n},bondAlbedo:{epistemicStatus:'UNKNOWN'},surfaceTemperature:{epistemicStatus:'UNSUPPORTED'},greenhouseResponse:{epistemicStatus:'UNSUPPORTED'}},waterPhase:{epistemicStatus:'UNSUPPORTED'},xuvEvolution:{epistemicStatus:'UNSUPPORTED'},geologicalActivity:{epistemicStatus:'UNSUPPORTED'},geochemicalEnergyAvailability:{epistemicStatus:'UNSUPPORTED'},evidence:{volatileGenesis:{evidenceClass:'HYPOTHETICAL',modelFidelity:'STYLIZED'},radiativeTier0:{evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE'}}},
  eligibility:{state:'INSUFFICIENT_ENVIRONMENT',witnessDigest:new Uint8Array(32)},biology:{biologyEstablished:false}
};
api.render();
assert.equal(nodes['inspector-object-status'].textContent,'canonical · supported');
assert.equal(nodes['inspector-environment-state'].textContent,'canonical · limited');
assert.equal(nodes['inspector-biology-state'].textContent,'INSUFFICIENT_ENVIRONMENT');
assert.match(nodes['inspector-biology-copy'].textContent,/cannot currently make a canonical biosphere assessment/i);
assert.equal(nodes['inspector-tech-p6-state'].textContent,'INSUFFICIENT_ENVIRONMENT');
assert.equal(nodes['inspector-tech-environment-contract'].textContent,'ofu-p5-p6-environment-v2');

sandbox.__OFU_PLANET_PREVIEW__={chosen:{key},targetStatus:'UNSUPPORTED',targetReason:'P5_MASS_DOMAIN'};
api.render();
assert.equal(nodes['inspector-environment-state'].textContent,'unsupported');
assert.equal(nodes['inspector-tech-target-state'].textContent,'UNSUPPORTED');
assert.equal(nodes['inspector-tech-target-reason'].textContent,'P5_MASS_DOMAIN');
assert.match(nodes['inspector-physical-copy'].textContent,/mass lies outside the promoted domain/i);
assert.equal(nodes['inspector-biology-state'].textContent,'NOT_EVALUATED');

sandbox.__OFU_PLANET_PREVIEW__={chosen:{key:{...key,orbitSlot:1n}},targetStatus:'SUPPORTED'};
api.render();
assert.equal(nodes['inspector-object-status'].textContent,'synchronizing');
assert.equal(nodes['inspector-biology-state'].textContent,'PENDING_TARGET_MATCH');
assert.equal(nodes['inspector-biology-limit'].textContent,'No stale target state is shown.');

nodes['entity-output'].textContent='ABSENT — no canonical planet exists at this sparse address.';
api.render();
assert.equal(nodes['inspector-object-title'].textContent,'No resolved object');
assert.equal(nodes['inspector-biology-state'].textContent,'not evaluated');

assert.match(source,/PENDING_TARGET_MATCH/,'stale-target guard must withhold downstream science');
assert.match(source,/ERROR:\|FAIL:\|ABSENT\|Input error:/,'failed query guard must hide stale selection presentation');
assert.match(source,/I\.type!==\'Planet\'/,'non-planet targets must not receive P5\/P6 planet interpretation');
assert.match(source,/O\.inspectorTest\?\.state\?\.current/,'Lane C must consume existing canonical inspector state');
assert.doesNotMatch(source,/resolvePlanet\s*\(/,'Lane C must not independently resolve canonical planets');
assert.doesNotMatch(source,/realizePhysicalPlanet\s*\(/,'Lane C must not independently create P5 authority');
assert.doesNotMatch(source,/environmentV2Projection\s*\(/,'Lane C must not independently create Environment authority');
assert.doesNotMatch(source,/\.eligibility\s*\(/,'Lane C must not independently create P6 authority');

console.log('v0.8 Inspector product lane: PASS');

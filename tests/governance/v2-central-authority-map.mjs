import assert from 'node:assert/strict';
import fs from 'node:fs';
const map=JSON.parse(fs.readFileSync('docs/parallel/V2_CENTRAL_AUTHORITY_MAP.json','utf8'));
const required=['selection','semanticScale','travelDistance','cameraSpatialFrame','sceneComposition','primaryRenderer','inputRouter','persistenceReplay'];
assert.equal(map.schema,'ofu-v2-central-authority-map-1');
assert.equal(map.version,'2026-09-07.6');
assert.equal(map.singleWriterLaw,true);
assert.equal(map.duplicateAuthorityPolicy,'FAIL_CLOSED');
assert.deepEqual(Object.keys(map.authorities).sort(),required.sort(),'exact central authority set');
for(const key of required){assert.equal(map.authorities[key].owner,'CONVERGENCE_OWNER',key+' central owner');assert.equal(map.authorities[key].mode,'SINGLE_PRIMARY',key+' single-primary mode')}
const classes=['CANONICAL_PROVEN','DERIVED','MODEL_DERIVED_SIMULATION','PRESENTATION_ONLY','MEASURED_RUNTIME_EVIDENCE'];
assert.deepEqual([...map.evidenceAuthorityClasses].sort(),classes.sort(),'authority classes must match executable PX component law');
const lanes=Array.from({length:16},(_,i)=>`V2X-${String(i+1).padStart(2,'0')}`);
assert.deepEqual(map.providerLaw.lanes,lanes,'exact V2X lane set');
assert.equal(map.providerLaw.additiveOnly,true);
assert.equal(map.providerLaw.centralAuthorityOverrideAllowed,false);
assert.equal(map.providerLaw.duplicateProviderIdPolicy,'FAIL_CLOSED');
assert.equal(map.providerLaw.duplicateCapabilityClaimPolicy,'FAIL_CLOSED');
console.log(JSON.stringify({status:'PASS',oracle:'V2_CENTRAL_AUTHORITY_FREEZE',version:map.version,authorities:required,lanes:lanes.length,duplicateAuthorityPolicy:map.duplicateAuthorityPolicy}));

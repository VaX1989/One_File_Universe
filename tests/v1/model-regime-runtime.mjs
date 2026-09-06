import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/extensions/contracts.js','src/domains/v1/common.js','src/domains/v1/microscopic.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const O=globalThis.OFU,M=O.v1Microscopic;
const planetId='planet-fixture-'+('1'.repeat(48)),organismIdentity='organism-fixture-'+('2'.repeat(46));
const tissue=M.tissue({organismIdentity,cellCount:24,fieldUnits:96000}),cell=M.cell(tissue,0),molecular=M.molecular(cell,{complexCount:9}),atomic=M.atomic(molecular,{complexOrdinal:0,maxAtoms:32});
const microscopic=Object.freeze({organismIdentity,tissue,cell,molecular,atomicPreview:atomic,witnesses:Object.freeze([M.reconcile(tissue,cell),M.reconcile(cell,molecular)])});
let spatialScale='human';
O.waveIVScaleRuntime={snapshot:()=>Object.freeze({semanticScale:spatialScale,selectedCanonicalTarget:Object.freeze({planetId,canonicalKey:Object.freeze({fixture:1})})})};
O.pxProduct={captured:()=>Object.freeze({selection:Object.freeze({target:Object.freeze({entityId:planetId})})})};
O.v1Providers={worldFor:()=>Object.freeze({planetIdentity:planetId,microscopic})};
vm.runInThisContext(fs.readFileSync('src/domains/v1/regime-runtime.js','utf8'),{filename:'src/domains/v1/regime-runtime.js'});
const R=O.v1ModelRegimeRuntime;
let cases=0;const ok=(value,msg)=>{assert.ok(value,msg);cases++};
assert.equal(R.snapshot().mode,'SPATIAL');assert.equal(R.snapshot().spatialScale,'human');cases+=2;
let s=R.step(-1);assert.equal(s.regime,'tissue');assert.equal(s.lastWitness.from,'human');cases+=2;
for(const expected of ['cell','molecular','atomic']){s=R.step(-1);assert.equal(s.regime,expected);assert.equal(s.lastWitness.identityPreserved,true);assert.equal(s.lastWitness.materialCommitmentPreserved,true);assert.equal(s.lastWitness.geometricZoomClaim,false);assert.equal(s.planetId,planetId);assert.equal(s.organismIdentity,organismIdentity);cases+=6;}
assert.equal(s.lastWitness.authority,'PRESENTATION_ONLY');cases++;
for(const expected of ['molecular','cell','tissue']){s=R.step(1);assert.equal(s.regime,expected);assert.equal(s.lastWitness.geometricZoomClaim,false);cases+=2;}
s=R.step(1);assert.equal(s.mode,'SPATIAL');assert.equal(s.regime,null);assert.equal(s.spatialScale,'human');assert.equal(s.lastWitness.to,'human');assert.equal(s.lastWitness.identityPreserved,true);cases+=5;
const before=s.transitions;s=R.exit();assert.equal(s.mode,'SPATIAL');assert.equal(s.transitions,before);cases+=2;
spatialScale='local_surface';assert.throws(()=>R.request('tissue'),/requires Human spatial context/);cases++;spatialScale='human';
R.request('tissue');assert.throws(()=>R.request('atomic'),/adjacent transitions/);cases++;R.exit();
O.v1Providers.worldFor=()=>Object.freeze({planetIdentity:planetId,microscopic:null});assert.throws(()=>R.request('tissue'),/unavailable for current modeled world/);cases++;
ok(R.ORDER.join('>')==='tissue>cell>molecular>atomic','explicit regime order');
console.log(JSON.stringify({status:'PASS',suite:'v1-model-regime-runtime',cases,planetId,organismIdentity,geometricZoomClaim:false,syntheticAtomicAuthority:atomic.visualAuthority}));

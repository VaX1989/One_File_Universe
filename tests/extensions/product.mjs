import assert from 'node:assert/strict';import {loadProduct} from './product-helpers.mjs';
const {O,key}=loadProduct(),P=O.pxProduct,C=O.pxContracts,R=O.waveIVScaleRuntime;let cases=0;
const chosen=P.captured(Object.fromEntries(Object.entries(key).reverse()));assert.deepEqual(chosen.selection.target.address,Object.entries(key).map(([k,v])=>k+'='+v));cases++;assert.equal(chosen.selection.target.entityId,'9e2041b4c8550e86edc574c42cba1bb31224a2ac7a9e8ffaea232310ce24d98e');assert.equal(chosen.canonicalDigest,'72b9bf78636609e176e6988bc5fbb54fbd0aab461a7a609462d12d79c74ae697');assert.equal(chosen.p4Digest,'397828e674c60009e2ac643c6e90b5c75b505d7b44212c58d841503d6a4b16c3');cases++;
for(const [id,scales] of [['wave-iv-macro',['galaxy','galactic_region','stellar_neighborhood','system']],['planet-webgl',['orbit','approach','global_surface']],['surface-webgl',['regional_surface','local_surface','human']]])R.registerSceneProvider({id,scales,setActive(){}});
R.setSelection(key,{planetId:chosen.selection.target.entityId,presentationStatus:'SUPPORTED'});
const selectedBefore=R.snapshot().selectedCanonicalTarget;assert.throws(()=>R.setSelection(key,{planetId:'f'.repeat(64)}),/identity does not match/);assert.deepEqual(R.snapshot().selectedCanonicalTarget,selectedBefore);cases++;
P.seal();assert(P.snapshot().registry.bindingsSealed);cases++;
assert.throws(()=>R.registerSceneProvider({id:'planet-webgl',scales:['orbit','approach','global_surface']}),e=>e.code==='BINDINGS_SEALED');cases++;
const before=C.digest(chosen.selection);
for(let i=0;i<16;i++)for(const scale of [...R.LADDER].reverse()){R.requestStage(scale,{driveCamera:false});assert.equal(R.snapshot().semanticScale,scale);assert.equal(P.snapshot().lastWitness.status,'PASS');assert.equal(C.digest(P.captured().selection),before);cases++;}
assert.equal(P.snapshot().witnessCount,32);assert.equal(P.snapshot().cacheEntries,1);cases++;
for(const id of ['px.domain.canonical','px.model.identity','px.inspector.selection','px.test.conformance']){assert.equal(P.inspect(id).provider,id);cases++;}
assert.equal(P.inspect('px.representation.context',{},'REPRESENT').value.authority,'PRESENTATION_ONLY');cases++;
const found=P.inspect('px.query.discovery',{address:[],cursor:null,limit:10,filters:{}},'DISCOVER');assert(found.value.planets.some(p=>p.id===chosen.selection.target.entityId));cases++;
const stored=P.inspect('px.persistence.context',{bookmark:{selection:chosen.selection,scale:'human'}},'ENCODE').value,roundtrip=P.inspect('px.persistence.context',stored,'DECODE').value;assert.equal(roundtrip.bookmark.scale,'human');cases++;
assert.throws(()=>P.decodeContext({...stored,historyDigest:'f'.repeat(64)}),e=>e.code==='COMPATIBILITY');assert.throws(()=>P.decodeContext({...stored,payload:{}}),e=>e.code==='INTEGRITY');cases+=2;
const state=R.snapshot();R.state.selectedCanonicalTarget={...state.selectedCanonicalTarget,planetId:'f'.repeat(64)};assert.throws(()=>R.requestStage('system',{driveCamera:false}),e=>e.code==='IDENTITY');assert.equal(R.snapshot().semanticScale,state.semanticScale);R.state.selectedCanonicalTarget=state.selectedCanonicalTarget;cases++;
console.log(JSON.stringify({status:'PASS',suite:'px-product',cases,actualCanonicalWitnesses:true,temporalProtocol:'ofu-p4-temporal-v1',registry:P.snapshot().registry,witnessBound:32,gpuEvidence:false}));

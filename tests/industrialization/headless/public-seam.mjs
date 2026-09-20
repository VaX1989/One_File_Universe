import fs from 'node:fs';
import assert from 'node:assert/strict';

const seamSource=fs.readFileSync('src/headless/index.js','utf8');
const sdkSource=fs.readFileSync('sdk/reference-headless/index.js','utf8');
for(const [pattern,label] of [
  [/@babylonjs|BABYLON/i,'Babylon'],[/\b(document|window|canvas|camera|renderer)\b/i,'render/browser'],[/src\/extensions|src\/runtime|src\/persistence/,'product/runtime']
]){
  assert.doesNotMatch(seamSource,pattern,'headless seam must not import or depend on '+label+' surfaces');
  assert.doesNotMatch(sdkSource,pattern,'public SDK entry must not import or depend on '+label+' surfaces');
}

const poisoned=[];
for(const name of ['document','window','BABYLON']){
  const prior=Object.getOwnPropertyDescriptor(globalThis,name);
  Object.defineProperty(globalThis,name,{configurable:true,get(){throw new Error('forbidden host global accessed: '+name)}});
  poisoned.push([name,prior]);
}
let api;
try{
  api=await import('../../../sdk/reference-headless/index.js');
}finally{
  for(const [name,prior] of poisoned){if(prior)Object.defineProperty(globalThis,name,prior);else delete globalThis[name]}
}

const {HEADLESS_API_VERSION,HeadlessKernel}=api;
assert.equal(HeadlessKernel.version,HEADLESS_API_VERSION);
const meta=JSON.parse(fs.readFileSync('tests/vectors/golden-universe-corpus-v1.json','utf8'));
const p4=JSON.parse(fs.readFileSync('conformance/iw0/p4-vectors.json','utf8'));
const fixture=meta.cases.find(item=>item.kind==='address'&&item.id===0);
assert.ok(fixture,'Golden Universe Corpus address fixture 0 is required');
const unhex=value=>Uint8Array.from(value.match(/../g).map(x=>Number.parseInt(x,16)));
const hex=value=>Buffer.from(value).toString('hex');

assert.throws(()=>HeadlessKernel.open({apiVersion:'ofu.headless.js.v999',masterSeed:unhex(meta.seed),semanticManifest:meta.semanticManifest}),/unsupported API version/);
assert.throws(()=>HeadlessKernel.open({apiVersion:HEADLESS_API_VERSION,masterSeed:new Uint8Array(31),semanticManifest:meta.semanticManifest}),/32 bytes/);
assert.throws(()=>HeadlessKernel.open({apiVersion:HEADLESS_API_VERSION,masterSeed:unhex(meta.seed),semanticManifest:meta.semanticManifest,extra:true}),/unknown fields/);

function runPublicWitness(){
  const session=HeadlessKernel.open({apiVersion:HEADLESS_API_VERSION,masterSeed:unhex(meta.seed),semanticManifest:meta.semanticManifest});
  assert.deepEqual(Object.keys(session).sort(),[
    'address','apiVersion','canonicalEvent','close','compareEvents','derive','entityIdentity','identity','lineageId','parseAddress','propertyWitness','transitionContractDigest'
  ].sort(),'public seam must stay deliberately small');
  assert.equal('query' in session,false,'generic provider query is intentionally unfrozen');
  assert.equal('exportArchive' in session,false,'archive export is intentionally outside the public seam');
  assert.equal('checkpoint' in session,false,'checkpoint persistence is intentionally outside the public seam');

  const identity=session.identity();
  assert.equal(hex(identity.semanticManifestHash),meta.semanticManifestHash);
  assert.equal(hex(identity.universeIdentity),meta.universeIdentity);
  assert.equal(hex(identity.transitionContractDigest),p4.transition_contract.expected_digest);

  const address=session.address(fixture.segments);
  assert.equal(hex(address),fixture.hex);
  assert.deepEqual(session.parseAddress(address),fixture.segments);
  const derived=session.derive({addressBytes:address,domain:'domain-0',property:'property-0',counter:0n});
  assert.equal(hex(derived),fixture.derive);
  const property=session.propertyWitness({addressBytes:address,domain:'domain-0',property:'property-0',counter:0n});
  assert.equal(hex(property.derivedBytes),fixture.derive);
  assert.equal(hex(property.addressBytes),fixture.hex);
  assert.equal(hex(property.universeIdentity),meta.universeIdentity);

  assert.throws(()=>session.address([{kind:'bytes',value:new Uint8Array(meta.limits.addressSegmentBytes+1)}]),/address bytes/,'P2 address segment hard bound must remain enforced');
  assert.throws(()=>session.parseAddress(Uint8Array.of(0)),/address/,'malformed canonical address must fail closed');

  const entity=session.entityIdentity({namespace:'ind-js-headless',stableKey:{addressHex:hex(address)}});
  const lineage=session.lineageId({parentCheckpointId:null,branchKey:'ind-js-headless'});
  const eventA=session.canonicalEvent({
    universeIdentity:identity.universeIdentity,lineageId:lineage,time:{seconds:1n,micros:0n},
    type:'core.field.set',version:1n,operationKey:'headless-a',targets:[entity],
    payload:{field:'propertyDigest',value:hex(derived)},causes:[],preconditionStateDigest:null
  });
  const eventB=session.canonicalEvent({
    universeIdentity:identity.universeIdentity,lineageId:lineage,time:{seconds:1n,micros:1n},
    type:'core.field.set',version:1n,operationKey:'headless-b',targets:[entity],
    payload:{field:'propertyDigest',value:hex(derived)},causes:[eventA.id],preconditionStateDigest:null
  });
  assert.ok(session.compareEvents(eventA,eventB)<0,'canonical event order must advance');
  assert.throws(()=>session.canonicalEvent({
    universeIdentity:new Uint8Array(32),lineageId:lineage,time:{seconds:1n,micros:0n},
    type:'core.field.set',version:1n,operationKey:'headless-a',targets:[entity],
    payload:{field:'propertyDigest',value:hex(derived)},causes:[],preconditionStateDigest:null
  }),/event universe does not match session/,'session must reject cross-universe event results');

  const authority=globalThis.OFU;
  const directA=authority.p4.canonicalEvent({
    universeIdentity:identity.universeIdentity,lineageId:lineage,time:{seconds:1n,micros:0n},
    type:'core.field.set',version:1n,operationKey:'headless-a',targets:[entity],
    payload:{field:'propertyDigest',value:hex(derived)},causes:[],preconditionStateDigest:null
  });
  assert.equal(hex(eventA.id),hex(directA.id),'public P4 wrapper must preserve authoritative event identity exactly');
  assert.equal(session.compareEvents(eventA,eventB),authority.p4.compareEvents(directA,authority.p4.canonicalEvent({
    universeIdentity:identity.universeIdentity,lineageId:lineage,time:{seconds:1n,micros:1n},
    type:'core.field.set',version:1n,operationKey:'headless-b',targets:[entity],
    payload:{field:'propertyDigest',value:hex(derived)},causes:[directA.id],preconditionStateDigest:null
  })),'public P4 wrapper must preserve authoritative ordering exactly');

  const witness=Object.freeze({
    semanticManifestHash:hex(identity.semanticManifestHash),universeIdentity:hex(identity.universeIdentity),
    addressHex:hex(address),propertyDigest:hex(derived),entityId:hex(entity),lineageId:hex(lineage),
    eventA:hex(eventA.id),eventB:hex(eventB.id),transitionContractDigest:hex(session.transitionContractDigest())
  });
  session.close();
  assert.throws(()=>session.identity(),/session is closed/);
  session.close();
  return witness;
}

const first=runPublicWitness();
const reopened=runPublicWitness();
assert.deepEqual(reopened,first,'dispose/reopen must reproduce the same canonical headless witness');
console.log('IND-JS-HEADLESS public seam: PASS');
console.log(JSON.stringify(first));

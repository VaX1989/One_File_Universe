import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const sources=[
  'src/kernel/sha256.js',
  'src/kernel/p2-unicode.js',
  'src/kernel/p2-canonical.js',
  'src/kernel/p2-address-parser.js',
  'src/temporal/p4-temporal.js'
];

function load(){
  globalThis.OFU={};
  for(const file of sources)vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
  return {P:OFU.p2,T:OFU.p4};
}

const meta=JSON.parse(fs.readFileSync('tests/vectors/golden-universe-corpus-v1.json','utf8'));
const fixture=meta.cases.find(item=>item.kind==='address'&&item.id===0);
assert.ok(fixture,'Golden Universe Corpus address fixture 0 is required');
assert.equal(typeof globalThis.document,'undefined','probe must be renderer/DOM free');
assert.equal(typeof globalThis.window,'undefined','probe must be browser-window free');

function run(){
  const {P,T}=load();
  const seed=P.unhex(meta.seed);
  const manifestHash=P.semanticManifestHash(meta.semanticManifest);
  const universeIdentity=P.universeIdentity(seed,manifestHash).digest;
  assert.equal(P.hex(manifestHash),meta.semanticManifestHash);
  assert.equal(P.hex(universeIdentity),meta.universeIdentity);

  const address=P.address([{kind:'namespace',value:fixture.segments[0].value}]);
  assert.equal(P.hex(address),fixture.hex);
  const property=P.derive({
    masterSeed:seed,semanticManifestHash:manifestHash,domain:'domain-0',
    addressBytes:address,property:'property-0',counter:0n
  });
  assert.equal(P.hex(property),fixture.derive);

  const lineage=T.lineageId(universeIdentity,null,'ind-bridge-a');
  const entity=P.entityIdentity(universeIdentity,'ind-bridge',{addressHex:P.hex(address)});
  const eventA=T.canonicalEvent({
    universeIdentity,lineageId:lineage,time:{seconds:1n,micros:0n},
    type:'core.field.set',version:1n,operationKey:'golden-address-0-a',
    targets:[entity],payload:{field:'propertyDigest',value:P.hex(property)},
    causes:[],preconditionStateDigest:null
  });
  const eventB=T.canonicalEvent({
    universeIdentity,lineageId:lineage,time:{seconds:1n,micros:1n},
    type:'core.field.set',version:1n,operationKey:'golden-address-0-b',
    targets:[entity],payload:{field:'propertyDigest',value:P.hex(property)},
    causes:[eventA.id],preconditionStateDigest:null
  });
  assert.ok(T.compareEvents(eventA,eventB)<0,'canonical P4 total order must advance');
  return Object.freeze({
    semanticManifestHash:P.hex(manifestHash),
    universeIdentity:P.hex(universeIdentity),
    addressHex:P.hex(address),
    propertyDigest:P.hex(property),
    lineageId:P.hex(lineage),
    eventA:P.hex(eventA.id),
    eventB:P.hex(eventB.id),
    p4Version:T.VERSION,
    transitionContractDigest:P.hex(T.transitionContractDigest(T.CORE_TRANSITION_DESCRIPTOR))
  });
}

const first=run();
delete globalThis.OFU;
const reopened=run();
assert.deepEqual(reopened,first,'seed+manifest reopen must reproduce exact P2 and narrow-P4 witnesses without archive persistence');

delete globalThis.OFU;
console.log('IND-BRIDGE-A narrowed external consumer probe: PASS');
console.log(JSON.stringify(first));

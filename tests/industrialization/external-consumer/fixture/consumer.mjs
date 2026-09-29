const poisonNames=['document','window','navigator','BABYLON','fetch','WebSocket','XMLHttpRequest'];
for(const name of poisonNames){
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,name);
  if(descriptor?.configurable===false)continue;
  Object.defineProperty(globalThis,name,{configurable:true,get(){throw new Error('forbidden host global accessed: '+name)}});
}

const {HEADLESS_API_VERSION,HeadlessKernel}=await import('one-file-universe/sdk/reference-headless/index.js');

const fail=message=>{throw new Error('IND-EXT-CONSUMER: '+message)};
const must=(condition,message)=>{if(!condition)fail(message)};
const rejects=(fn,pattern,label)=>{
  let error=null;
  try{fn()}catch(caught){error=caught}
  if(!error||!pattern.test(String(error?.message??error)))fail(label+' did not reject as expected');
};
const unhex=value=>Uint8Array.from(value.match(/../g).map(byte=>Number.parseInt(byte,16)));
const hex=value=>Array.from(value,byte=>byte.toString(16).padStart(2,'0')).join('');
const sameJson=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

const seedHex='000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
const semanticManifest={
  canonicalAddressVersion:1,
  canonicalProtocolVersion:'ofu-cbv-1',
  dependencies:{},
  domains:{kernel:1},
  generatorSuite:'ofu-p2-reference',
  generatorSuiteVersion:1,
  genesis:{parameters:{}},
  lawProfile:'baseline',
  numericContractVersion:1,
  semanticManifestVersion:1,
  subsystems:{identity:1,'test-substrate':1},
  unicodeProfileVersion:'ofu-unicode-15.1.0-v1'
};
const expected={
  semanticManifestHash:'15115d3be206083d795b9492af46693253979709a5fb9cd2f9b3e2321fcd4778',
  universeIdentity:'29d93cd168d16a6763ad6687005e6af6eddbb5b7fef5cf8a919b49f0b0fd4f41',
  addressHex:'4f46554101010105617374726f',
  propertyDigest:'186531376069e9734644130f5ff081633aac5fcb011eaf8292a2ea6140ed9c32',
  transitionContractDigest:'a0b5856f6b1c12fbc3899f30858b99fb91de683168b41de60fb44d5f92a1c538'
};

rejects(()=>HeadlessKernel.open({apiVersion:'ofu.headless.js.v999',masterSeed:unhex(seedHex),semanticManifest}),/unsupported API version/,'unsupported API version');
rejects(()=>HeadlessKernel.open({apiVersion:HEADLESS_API_VERSION,masterSeed:new Uint8Array(31),semanticManifest}),/32 bytes/,'short master seed');

function runWitness(){
  const session=HeadlessKernel.open({apiVersion:HEADLESS_API_VERSION,masterSeed:unhex(seedHex),semanticManifest});
  for(const forbidden of ['query','renderer','camera','selection','checkpoint','exportArchive','runtime'])must(!(forbidden in session),'unexpected public method '+forbidden);

  const identity=session.identity();
  const address=session.address([{kind:'namespace',value:'astro'}]);
  const property=session.propertyWitness({addressBytes:address,domain:'domain-0',property:'property-0',counter:0n});

  must(hex(identity.semanticManifestHash)===expected.semanticManifestHash,'semantic manifest hash mismatch');
  must(hex(identity.universeIdentity)===expected.universeIdentity,'universe identity mismatch');
  must(hex(address)===expected.addressHex,'canonical address mismatch');
  must(hex(property.derivedBytes)===expected.propertyDigest,'property witness mismatch');
  must(hex(session.transitionContractDigest())===expected.transitionContractDigest,'transition digest mismatch');

  rejects(()=>session.parseAddress(Uint8Array.of(0)),/address/,'malformed canonical address');
  rejects(()=>session.propertyWitness({addressBytes:address,domain:'domain-0',property:'property-0',counter:0n,extra:true}),/unknown fields/,'unknown property witness field');
  rejects(()=>session.address([{kind:'bytes',value:new Uint8Array(4097)}]),/address bytes/,'over-bound address segment');

  const entity=session.entityIdentity({namespace:'ind-ext-consumer',stableKey:{addressHex:hex(address)}});
  const lineage=session.lineageId({parentCheckpointId:null,branchKey:'ind-ext-consumer'});
  const eventA=session.canonicalEvent({
    universeIdentity:identity.universeIdentity,
    lineageId:lineage,
    time:{seconds:1n,micros:0n},
    type:'core.field.set',
    version:1n,
    operationKey:'external-consumer-a',
    targets:[entity],
    payload:{field:'propertyDigest',value:hex(property.derivedBytes)},
    causes:[],
    preconditionStateDigest:null
  });
  const eventB=session.canonicalEvent({
    universeIdentity:identity.universeIdentity,
    lineageId:lineage,
    time:{seconds:1n,micros:1n},
    type:'core.field.set',
    version:1n,
    operationKey:'external-consumer-b',
    targets:[entity],
    payload:{field:'propertyDigest',value:hex(property.derivedBytes)},
    causes:[eventA.id],
    preconditionStateDigest:null
  });
  must(session.compareEvents(eventA,eventB)<0,'canonical event order did not advance');

  let lastDerivedLength=0;
  for(let i=0;i<64;i++){
    const bounded=session.propertyWitness({addressBytes:address,domain:'resource-probe',property:'bounded-property',counter:BigInt(i)});
    lastDerivedLength=bounded.derivedBytes.length;
    must(lastDerivedLength===32,'bounded resource probe returned unexpected digest size');
  }

  const witness={
    semanticManifestHash:hex(identity.semanticManifestHash),
    universeIdentity:hex(identity.universeIdentity),
    addressHex:hex(address),
    propertyDigest:hex(property.derivedBytes),
    entityId:hex(entity),
    lineageId:hex(lineage),
    eventA:hex(eventA.id),
    eventB:hex(eventB.id),
    transitionContractDigest:hex(session.transitionContractDigest()),
    resourceProbe:{iterations:64,derivedBytes:lastDerivedLength}
  };
  session.close();
  rejects(()=>session.identity(),/session is closed/,'closed session access');
  session.close();
  return witness;
}

const first=runWitness();
const reopened=runWitness();
must(sameJson(first,reopened),'close/reopen witness drifted');
console.log(JSON.stringify({status:'PASS',headlessApiVersion:HEADLESS_API_VERSION,witness:first}));

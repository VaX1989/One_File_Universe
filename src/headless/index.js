import '../kernel/sha256.js';
import '../kernel/p2-unicode.js';
import '../kernel/p2-canonical.js';
import '../kernel/p2-address-parser.js';
import '../temporal/p4-temporal.js';

export const HEADLESS_API_VERSION='ofu.headless.js.v1';

const ROOT=globalThis.OFU;
if(!ROOT?.p2||!ROOT?.p4)throw new Error('OFU headless: authoritative P2/P4 kernels unavailable');
const P=ROOT.p2,T=ROOT.p4;

const fail=message=>{throw new Error('OFU headless: '+message)};
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);

function record(value,allowed,name,{exact=false}={}){
  if(!plain(value))fail(name+' must be a plain map');
  const own=Reflect.ownKeys(value);
  if(own.some(key=>typeof key!=='string'))fail(name+' has unsupported fields');
  const names=own.slice().sort(),permitted=allowed.slice().sort();
  if(names.some(key=>!allowed.includes(key)))fail(name+' has unknown fields');
  if(exact&&(names.length!==permitted.length||permitted.some((key,index)=>names[index]!==key)))fail(name+' has missing fields');
  for(const key of names){
    const descriptor=Object.getOwnPropertyDescriptor(value,key);
    if(!descriptor||!descriptor.enumerable||!('value' in descriptor))fail(name+' has unsupported property');
  }
  return value;
}

function bytes(value,name,length=null){
  if(!(value instanceof Uint8Array))fail(name+' must be Uint8Array');
  if(length!==null&&value.length!==length)fail(name+' must be exactly '+length+' bytes');
  return value.slice();
}

function equalBytes(a,b){
  if(!(a instanceof Uint8Array)||!(b instanceof Uint8Array)||a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}

function clone(value){
  if(value instanceof Uint8Array)return value.slice();
  if(Array.isArray(value))return Object.freeze(value.map(clone));
  if(plain(value)){
    const out={};
    for(const key of Reflect.ownKeys(value))out[key]=clone(value[key]);
    return Object.freeze(out);
  }
  return value;
}

export function openHeadless(options){
  record(options,['apiVersion','masterSeed','semanticManifest'],'open options',{exact:true});
  if(options.apiVersion!==HEADLESS_API_VERSION)fail('unsupported API version');

  const seed=bytes(options.masterSeed,'masterSeed',32);
  const manifestHash=P.semanticManifestHash(options.semanticManifest).slice();
  const universeIdentity=P.universeIdentity(seed,manifestHash).digest.slice();
  const transitionDigest=T.transitionContractDigest(T.CORE_TRANSITION_DESCRIPTOR).slice();
  const manifestMeta=Object.freeze({
    canonicalProtocolVersion:options.semanticManifest.canonicalProtocolVersion,
    canonicalAddressVersion:options.semanticManifest.canonicalAddressVersion,
    unicodeProfileVersion:options.semanticManifest.unicodeProfileVersion,
    numericContractVersion:options.semanticManifest.numericContractVersion
  });
  let closed=false;
  const requireOpen=()=>{if(closed)fail('session is closed')};

  const session={
    apiVersion:HEADLESS_API_VERSION,
    identity(){
      requireOpen();
      return Object.freeze({
        headlessApiVersion:HEADLESS_API_VERSION,
        canonicalProtocolVersion:manifestMeta.canonicalProtocolVersion,
        canonicalAddressVersion:manifestMeta.canonicalAddressVersion,
        unicodeProfileVersion:manifestMeta.unicodeProfileVersion,
        numericContractVersion:manifestMeta.numericContractVersion,
        p4ProtocolVersion:T.VERSION,
        semanticManifestHash:manifestHash.slice(),
        universeIdentity:universeIdentity.slice(),
        transitionContractDigest:transitionDigest.slice()
      });
    },
    address(segments){
      requireOpen();
      return P.address(segments).slice();
    },
    parseAddress(addressBytes){
      requireOpen();
      const canonical=bytes(addressBytes,'addressBytes');
      P.validateAddressBytes(canonical);
      return clone(P.parseAddress(canonical));
    },
    entityIdentity(args){
      requireOpen();
      record(args,['namespace','stableKey'],'entityIdentity arguments',{exact:true});
      return P.entityIdentity(universeIdentity,args.namespace,args.stableKey).slice();
    },
    derive(args){
      requireOpen();
      record(args,['addressBytes','domain','property','counter'],'derive arguments',{exact:true});
      return P.derive({
        masterSeed:seed,
        semanticManifestHash:manifestHash,
        domain:args.domain,
        addressBytes:bytes(args.addressBytes,'addressBytes'),
        property:args.property,
        counter:args.counter
      }).slice();
    },
    propertyWitness(args){
      requireOpen();
      record(args,['addressBytes','domain','property','counter'],'propertyWitness arguments',{exact:true});
      const addressBytes=bytes(args.addressBytes,'addressBytes');
      P.validateAddressBytes(addressBytes);
      const derivedBytes=P.derive({
        masterSeed:seed,
        semanticManifestHash:manifestHash,
        domain:args.domain,
        addressBytes,
        property:args.property,
        counter:args.counter
      });
      return Object.freeze({
        headlessApiVersion:HEADLESS_API_VERSION,
        semanticManifestHash:manifestHash.slice(),
        universeIdentity:universeIdentity.slice(),
        addressBytes:addressBytes.slice(),
        domain:args.domain,
        property:args.property,
        counter:args.counter,
        derivedBytes:derivedBytes.slice()
      });
    },
    lineageId(options={}){
      requireOpen();
      record(options,['parentCheckpointId','branchKey'],'lineageId options');
      const parent=options.parentCheckpointId===undefined?null:options.parentCheckpointId;
      const branchKey=options.branchKey===undefined?'canonical':options.branchKey;
      return T.lineageId(universeIdentity,parent,branchKey).slice();
    },
    canonicalEvent(eventInput){
      requireOpen();
      const event=T.canonicalEvent(eventInput);
      if(!equalBytes(event.descriptor.universeIdentity,universeIdentity))fail('event universe does not match session');
      return clone(event);
    },
    compareEvents(a,b){
      requireOpen();
      return T.compareEvents(a,b);
    },
    transitionContractDigest(){
      requireOpen();
      return transitionDigest.slice();
    },
    close(){
      if(closed)return;
      seed.fill(0);
      closed=true;
    }
  };
  return Object.freeze(session);
}

export const HeadlessKernel=Object.freeze({version:HEADLESS_API_VERSION,open:openHeadless});

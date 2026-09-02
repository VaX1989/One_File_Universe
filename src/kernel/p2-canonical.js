(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const U=O.p2Unicode;if(!U)throw new Error('P2 Unicode profile required');
const E=new TextEncoder();
const D=new TextDecoder('utf-8',{fatal:true});
const U64_MAX=(1n<<64n)-1n;
const I64_MIN=-(1n<<63n);
const I64_MAX=(1n<<63n)-1n;
const MAX=Object.freeze({
  depth:32,
  nodes:100000,
  inputBytes:1048576,
  byteStringBytes:1048572,
  textBytes:262144,
  items:65536,
  addressSegments:64,
  addressNamespaceBytes:1024,
  addressSegmentBytes:4096,
  addressBytes:65536,
  bytes:1048572,
  text:262144
});
const T=Object.freeze({NULL:0,FALSE:1,TRUE:2,SINT:16,UINT:17,BYTES:32,TEXT:33,ARRAY:48,MAP:49});
const MANIFEST_KEYS=Object.freeze(['semanticManifestVersion','canonicalProtocolVersion','canonicalAddressVersion','unicodeProfileVersion','numericContractVersion','generatorSuite','generatorSuiteVersion','subsystems','domains','dependencies','lawProfile','genesis']);
function err(m){throw new Error('OFU canonical: '+m)}
function cat(...ps){return catList(ps)}
function catList(ps){let n=0;for(let q=0;q<ps.length;q++)n+=ps[q].length;const o=new Uint8Array(n);let i=0;for(let q=0;q<ps.length;q++){const p=ps[q];o.set(p,i);i+=p.length}return o}
function uleb(x){x=BigInt(x);if(x<0n||x>U64_MAX)err('ULEB64 range');const a=[];do{let b=Number(x&127n);x>>=7n;if(x)b|=128;a.push(b)}while(x);const out=new Uint8Array(a.length);for(let i=0;i<a.length;i++)out[i]=a[i];return out}
function cmp(a,b){for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i])return a[i]-b[i];return a.length-b.length}
function textBytes(s){const normalized=U.normalize(s),b=E.encode(normalized);if(b.length>MAX.textBytes)err('text too large');return b}
function nonEmptyText(s,name){const n=U.normalize(s);if(n.length===0)err(name+' must be non-empty canonical text');if(E.encode(n).length>MAX.textBytes)err(name+' too large');return n}
function charge(state,n){state.encodedBytes+=n;if(state.encodedBytes>MAX.inputBytes)err('encoded value too large')}
function emit(state,...parts){charge(state,parts.reduce((n,p)=>n+p.length,0));return catList(parts)}
function plainMap(v){return !!v&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)}
function arrayDescriptors(v){
  if(Object.getPrototypeOf(v)!==Array.prototype)err('unsupported array prototype');
  const keys=Reflect.ownKeys(v);
  if(keys.some(k=>typeof k!=='string'))err('unsupported array property');
  const allowed=new Set();allowed.add('length');
  for(let i=0;i<v.length;i++)allowed.add(String(i));
  if(keys.length!==allowed.size||keys.some(k=>!allowed.has(k)))err('unsupported array property');
  const values=new Array(v.length);
  for(let i=0;i<v.length;i++){
    const d=Object.getOwnPropertyDescriptor(v,String(i));
    if(!d||!('value' in d))err('array must be dense own data');
    values[i]=d.value;
  }
  return values;
}
function enc(v,state,depth){
  if(depth>MAX.depth)err('depth limit');
  if(++state.nodes>MAX.nodes)err('node limit');
  if(v===null)return emit(state,Uint8Array.of(T.NULL));
  if(v===false)return emit(state,Uint8Array.of(T.FALSE));
  if(v===true)return emit(state,Uint8Array.of(T.TRUE));
  if(typeof v==='number'){if(!Number.isSafeInteger(v))err('Number must be a safe integer');v=BigInt(v)}
  if(typeof v==='bigint'){
    if(v>=0n){if(v>U64_MAX)err('unsigned integer range');return emit(state,Uint8Array.of(T.UINT),uleb(v))}
    if(v<I64_MIN)err('signed integer range');
    return emit(state,Uint8Array.of(T.SINT),uleb((-v*2n)-1n));
  }
  if(v instanceof Uint8Array){
    if(v.length>MAX.byteStringBytes)err('byte string too large');
    const len=uleb(v.length);return emit(state,Uint8Array.of(T.BYTES),len,v);
  }
  if(typeof v==='string'){
    const b=textBytes(v),len=uleb(b.length);return emit(state,Uint8Array.of(T.TEXT),len,b);
  }
  if(Array.isArray(v)){
    if(v.length>MAX.items)err('array too large');
    if(state.seen.has(v))err('cycle');
    const values=arrayDescriptors(v);
    state.seen.add(v);
    const len=uleb(v.length),parts=[emit(state,Uint8Array.of(T.ARRAY),len)];
    for(let i=0;i<values.length;i++)parts.push(enc(values[i],state,depth+1));
    state.seen.delete(v);
    return catList(parts);
  }
  if(plainMap(v)){
    if(state.seen.has(v))err('cycle');
    state.seen.add(v);
    const keys=Reflect.ownKeys(v);
    if(keys.some(k=>typeof k!=='string'))err('map keys must be strings');
    if(keys.length>MAX.items)err('map too large');
    const normalizedSeen=new Set(),pairs=[];
    for(let keyIndex=0;keyIndex<keys.length;keyIndex++){const k=keys[keyIndex];
      const descriptor=Object.getOwnPropertyDescriptor(v,k);
      if(!descriptor||!descriptor.enumerable||!('value'in descriptor))err('unsupported map property');
      const normalized=U.normalize(k);
      if(normalizedSeen.has(normalized))err('duplicate normalized map key');
      normalizedSeen.add(normalized);
      const kb=enc(normalized,state,depth+1);
      pairs.push([kb,enc(descriptor.value,state,depth+1)]);
    }
    pairs.sort((a,b)=>cmp(a[0],b[0]));
    const len=uleb(pairs.length),head=emit(state,Uint8Array.of(T.MAP),len);
    state.seen.delete(v);
    const all=[head];for(let pairIndex=0;pairIndex<pairs.length;pairIndex++){all.push(pairs[pairIndex][0],pairs[pairIndex][1]);}return catList(all);
  }
  err('unsupported value type');
}
function encode(v){return enc(v,{nodes:0,encodedBytes:0,seen:new WeakSet()},0)}
function decode(bytes){
  if(!(bytes instanceof Uint8Array))bytes=new Uint8Array(bytes);
  if(bytes.length>MAX.inputBytes)err('input too large');
  let i=0,nodes=0;
  function rd(){if(i>=bytes.length)err('truncated input');return bytes[i++]}
  function vu(){
    let x=0n,shift=0n;
    for(let count=0;count<10;count++){
      const b=rd(),payload=b&127;
      if(count===9&&(b&0xfe)!==0)err('varint overflow');
      x|=BigInt(payload)<<shift;
      if(!(b&128)){
        if(count>0&&payload===0)err('non-minimal varint');
        return x;
      }
      shift+=7n;
    }
    err('varint too long');
  }
  function take(n){n=Number(n);if(!Number.isSafeInteger(n)||n<0||i+n>bytes.length)err('invalid length');const x=bytes.slice(i,i+n);i+=n;return x}
  function val(depth=0){
    if(depth>MAX.depth)err('depth limit');
    if(++nodes>MAX.nodes)err('node limit');
    const t=rd();
    if(t===T.NULL)return null;
    if(t===T.FALSE)return false;
    if(t===T.TRUE)return true;
    if(t===T.UINT)return vu();
    if(t===T.SINT){const z=vu();if((z&1n)===0n)err('non-canonical signed integer');return -((z+1n)/2n)}
    if(t===T.BYTES){const n=vu();if(n>BigInt(MAX.byteStringBytes))err('byte string too large');return take(n)}
    if(t===T.TEXT){const n=vu();if(n>BigInt(MAX.textBytes))err('text too large');let s;try{s=D.decode(take(n))}catch{err('invalid UTF-8')}try{U.canonical(s)}catch(e){err(e.message.replace(/^OFU Unicode: /,''))}return s}
    if(t===T.ARRAY){const n=vu();if(n>BigInt(MAX.items))err('array too large');const a=[];for(let j=0n;j<n;j++)a.push(val(depth+1));return a}
    if(t===T.MAP){const n=vu();if(n>BigInt(MAX.items))err('map too large');const o=Object.create(null);let prev=null;for(let j=0n;j<n;j++){const start=i,k=val(depth+1),end=i;if(typeof k!=='string')err('map key not text');const kb=bytes.slice(start,end);if(prev&&cmp(prev,kb)>=0)err('map keys not strictly ordered');prev=kb;if(Object.prototype.hasOwnProperty.call(o,k))err('duplicate map key');o[k]=val(depth+1)}return o}
    err('unknown tag');
  }
  const v=val();if(i!==bytes.length)err('trailing bytes');return v;
}
function hex(b){return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('')}
function unhex(s){if(typeof s!=='string'||s.length%2||!/^[0-9a-f]*$/i.test(s))err('invalid hex');return Uint8Array.from(s.match(/../g)||[],x=>parseInt(x,16))}
function sha(b){return O.sha256.digest(b)}
function hmac(key,msg){key=key instanceof Uint8Array?key:new Uint8Array(key);if(key.length>64)key=sha(key);const k=new Uint8Array(64),ip=new Uint8Array(64),op=new Uint8Array(64);k.set(key);for(let i=0;i<64;i++){ip[i]=k[i]^0x36;op[i]=k[i]^0x5c}return sha(cat(op,sha(cat(ip,msg))))}
function exactKeys(o,keys,name){if(!plainMap(o))err(name+' must be a plain map');const own=Reflect.ownKeys(o);if(own.some(k=>typeof k!=='string'))err(name+' has unsupported fields');const a=own.slice().sort(),b=keys.slice().sort();if(a.length!==b.length||a.some((k,i)=>k!==b[i]))err(name+' has missing or unknown fields')}
function positiveVersionMap(v,name){if(!plainMap(v))err(name+' must be a plain map');const keys=Reflect.ownKeys(v);for(let i=0;i<keys.length;i++){const k=keys[i];if(typeof k!=='string')err(name+' keys must be text');nonEmptyText(k,name+' key');const d=Object.getOwnPropertyDescriptor(v,k);if(!d||!d.enumerable||!('value'in d))err(name+' unsupported property');const x=toU64(d.value,name+' version');if(x<1n)err(name+' versions must be positive')}}
function dependencyMap(v){if(!plainMap(v))err('dependencies must be a plain map');const keys=Reflect.ownKeys(v);for(let i=0;i<keys.length;i++){const k=keys[i];if(typeof k!=='string')err('dependency keys must be text');nonEmptyText(k,'dependency key');const d=Object.getOwnPropertyDescriptor(v,k);if(!d||!d.enumerable||!('value'in d))err('dependencies unsupported property');nonEmptyText(d.value,'dependency version')}}
function toU64(v,name){if(typeof v==='number'){if(!Number.isSafeInteger(v))err(name+' must be u64');v=BigInt(v)}if(typeof v!=='bigint'||v<0n||v>U64_MAX)err(name+' must be u64');return v}
function toI64(v,name){if(typeof v==='number'){if(!Number.isSafeInteger(v))err(name+' must be i64');v=BigInt(v)}if(typeof v!=='bigint'||v<I64_MIN||v>I64_MAX)err(name+' must be i64');return v}
function validateSemanticManifest(m){
  exactKeys(m,MANIFEST_KEYS,'Semantic Generator Manifest');
  if(toU64(m.semanticManifestVersion,'semanticManifestVersion')!==1n)err('unsupported semanticManifestVersion');
  if(nonEmptyText(m.canonicalProtocolVersion,'canonicalProtocolVersion')!=='ofu-cbv-1')err('unsupported canonicalProtocolVersion');
  if(toU64(m.canonicalAddressVersion,'canonicalAddressVersion')!==1n)err('unsupported canonicalAddressVersion');
  if(nonEmptyText(m.unicodeProfileVersion,'unicodeProfileVersion')!==U.VERSION)err('unsupported unicodeProfileVersion');
  if(toU64(m.numericContractVersion,'numericContractVersion')!==1n)err('unsupported numericContractVersion');
  nonEmptyText(m.generatorSuite,'generatorSuite');
  if(toU64(m.generatorSuiteVersion,'generatorSuiteVersion')<1n)err('generatorSuiteVersion must be positive');
  positiveVersionMap(m.subsystems,'subsystems');positiveVersionMap(m.domains,'domains');dependencyMap(m.dependencies);
  nonEmptyText(m.lawProfile,'lawProfile');
  if(!plainMap(m.genesis))err('genesis must be a plain map');
  encode(m.genesis);
  return m;
}
function semanticManifest(m){validateSemanticManifest(m);return encode(m)}
function semanticManifestHash(m){return sha(semanticManifest(m))}
function universeIdentity(seed32,manifestHash32){if(!(seed32 instanceof Uint8Array)||!(manifestHash32 instanceof Uint8Array)||seed32.length!==32||manifestHash32.length!==32)err('Universe Identity requires 32-byte seed and manifest hash');const descriptor=encode({canonicalProtocolVersion:'ofu-cbv-1',masterSeed:seed32,semanticManifestHash:manifestHash32});return{descriptor,digest:sha(cat(E.encode('OFU-UNIVERSE-v1\0'),descriptor))}}
function entityIdentity(universeIdentity32,namespace,stableKey){if(!(universeIdentity32 instanceof Uint8Array)||universeIdentity32.length!==32)err('Entity Identity requires 32-byte Universe Identity');namespace=nonEmptyText(namespace,'entity namespace');const descriptor=encode({universeIdentity:universeIdentity32,namespace,stableKey});return sha(cat(E.encode('OFU-ENTITY-v1\0'),descriptor))}
function u64be(x){const b=new Uint8Array(8);for(let q=7;q>=0;q--){b[q]=Number(x&255n);x>>=8n}return b}
function address(segments){
  if(!Array.isArray(segments)||!segments.length||segments.length>MAX.addressSegments)err('invalid address');
  const values=arrayDescriptors(segments);
  const parts=[E.encode('OFUA'),Uint8Array.of(1),uleb(values.length)];
  let total=parts.reduce((n,p)=>n+p.length,0);
  function add(...ps){let n=0;for(let j=0;j<ps.length;j++)n+=ps[j].length;total+=n;if(total>MAX.addressBytes)err('address too large');for(let j=0;j<ps.length;j++)parts.push(ps[j])}
  for(let segmentIndex=0;segmentIndex<values.length;segmentIndex++){const s=values[segmentIndex];
    if(!plainMap(s))err('invalid address segment');
    exactKeys(s,['kind','value'],'address segment');
    if(s.kind==='namespace'){
      const b=textBytes(s.value);if(b.length>MAX.addressNamespaceBytes)err('address namespace too large');add(Uint8Array.of(1),uleb(b.length),b);
    }else if(s.kind==='u64'){
      const x=toU64(s.value,'address u64');add(Uint8Array.of(2),u64be(x));
    }else if(s.kind==='i64'){
      let x=toI64(s.value,'address i64');x=BigInt.asUintN(64,x);add(Uint8Array.of(3),u64be(x));
    }else if(s.kind==='bytes'){
      const b=s.value;if(!(b instanceof Uint8Array)||b.length>MAX.addressSegmentBytes)err('address bytes');add(Uint8Array.of(4),uleb(b.length),b);
    }else err('unknown address segment');
  }
  return catList(parts);
}
function parseAddress(bytes){
  if(!(bytes instanceof Uint8Array))err('address bytes must be Uint8Array');
  if(bytes.length>MAX.addressBytes)err('address too large');
  let i=0;
  function rd(){if(i>=bytes.length)err('truncated address');return bytes[i++]}
  function take(n){if(!Number.isSafeInteger(n)||n<0||i+n>bytes.length)err('truncated address');const b=bytes.slice(i,i+n);i+=n;return b}
  function vu(){let x=0,n=0,shift=0,last=0;for(;;){const b=rd();last=b;if(++n>3)err('address length varint too long');x|=(b&127)<<shift;if(!(b&128))break;shift+=7}if(n>1&&(last&127)===0)err('non-minimal address length');return x}
  const magic=take(4);if(magic[0]!==79||magic[1]!==70||magic[2]!==85||magic[3]!==65)err('address magic');
  if(rd()!==1)err('unsupported address version');
  const count=vu();if(count<1||count>MAX.addressSegments)err('address segment count');
  const out=[];
  for(let n=0;n<count;n++){
    const t=rd();
    if(t===1){const len=vu();if(len>MAX.addressNamespaceBytes)err('address namespace length');let s;try{s=D.decode(take(len))}catch{err('invalid address UTF-8')}try{U.canonical(s)}catch(e){err(e.message.replace(/^OFU Unicode: /,''))}out.push({kind:'namespace',value:s})}
    else if(t===2||t===3){const b=take(8);let x=0n;for(const q of b)x=(x<<8n)|BigInt(q);out.push({kind:t===2?'u64':'i64',value:t===2?x:BigInt.asIntN(64,x)})}
    else if(t===4){const len=vu();if(len>MAX.addressSegmentBytes)err('address bytes segment too long');out.push({kind:'bytes',value:take(len)})}
    else err('unknown address segment tag');
  }
  if(i!==bytes.length)err('address trailing bytes');
  return out;
}
function validateAddressBytes(bytes){const parsed=parseAddress(bytes),rebuilt=address(parsed);if(cmp(rebuilt,bytes)!==0)err('non-canonical address bytes');return bytes}
function derive(args){
  exactKeys(args,['masterSeed','semanticManifestHash','domain','addressBytes','property','counter'],'derive arguments');
  const {masterSeed,semanticManifestHash:mh,addressBytes}=args;
  if(!(masterSeed instanceof Uint8Array)||masterSeed.length!==32)err('derive masterSeed must be exactly 32 bytes');
  if(!(mh instanceof Uint8Array)||mh.length!==32)err('derive semanticManifestHash must be exactly 32 bytes');
  validateAddressBytes(addressBytes);
  const domain=nonEmptyText(args.domain,'derive domain'),property=nonEmptyText(args.property,'derive property'),counter=toU64(args.counter,'derive counter');
  return hmac(masterSeed,encode(['OFU-DERIVE-v1',mh,domain,addressBytes,property,counter]));
}
function addI64(a,b){a=toI64(a,'addI64 left');b=toI64(b,'addI64 right');const r=a+b;if(r<I64_MIN||r>I64_MAX)err('i64 overflow');return r}
function mulFixed(a,b,scale=1000000n){a=toI64(a,'mulFixed left');b=toI64(b,'mulFixed right');scale=toU64(scale,'mulFixed scale');if(scale===0n)err('fixed scale');const n=a*b;let q=n/scale;const r=n%scale,ar=r<0n?-r:r,twice=ar*2n;if(twice>scale||(twice===scale&&(q&1n)!==0n))q+=n<0n?-1n:1n;if(q<I64_MIN||q>I64_MAX)err('i64 overflow');return q}
function isqrt(n){n=toU64(n,'isqrt input');if(n<2n)return n;let x=1n<<BigInt((n.toString(2).length+1)>>1);for(;;){const y=(x+n/x)>>1n;if(y>=x)return x;x=y}}
O.p2={T,MAX,UNICODE_PROFILE_VERSION:U.VERSION,UNICODE_RANGE_COUNT:U.RANGE_COUNT,UNICODE_RANGE_SHA256:U.RANGE_SHA256,encode,decode,hex,unhex,hmac,validateSemanticManifest,semanticManifest,semanticManifestHash,universeIdentity,entityIdentity,address,parseAddress,validateAddressBytes,derive,addI64,mulFixed,isqrt};
})(typeof globalThis!=='undefined'?globalThis:this);

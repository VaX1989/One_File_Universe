(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
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
function err(m){throw new Error('OFU canonical: '+m)}
function cat(...ps){const n=ps.reduce((a,p)=>a+p.length,0),o=new Uint8Array(n);let i=0;for(const p of ps){o.set(p,i);i+=p.length}return o}
function uleb(x){x=BigInt(x);if(x<0n||x>U64_MAX)err('ULEB64 range');const a=[];do{let b=Number(x&127n);x>>=7n;if(x)b|=128;a.push(b)}while(x);return Uint8Array.from(a)}
function cmp(a,b){for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i])return a[i]-b[i];return a.length-b.length}
function good(s){for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);if(c>=0xd800&&c<=0xdbff){if(++i>=s.length||s.charCodeAt(i)<0xdc00||s.charCodeAt(i)>0xdfff)return false}else if(c>=0xdc00&&c<=0xdfff)return false}return true}
function textBytes(s){if(typeof s!=='string'||!good(s))err('invalid Unicode string');const normalized=s.normalize('NFC'),b=E.encode(normalized);if(b.length>MAX.textBytes)err('text too large');return b}
function charge(state,n){state.encodedBytes+=n;if(state.encodedBytes>MAX.inputBytes)err('encoded value too large')}
function emit(state,...parts){charge(state,parts.reduce((n,p)=>n+p.length,0));return cat(...parts)}
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
    state.seen.add(v);
    const len=uleb(v.length),parts=[emit(state,Uint8Array.of(T.ARRAY),len)];
    for(const x of v)parts.push(enc(x,state,depth+1));
    state.seen.delete(v);
    return cat(...parts);
  }
  if(v&&typeof v==='object'&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)){
    if(state.seen.has(v))err('cycle');
    state.seen.add(v);
    const keys=Reflect.ownKeys(v);
    if(keys.some(k=>typeof k!=='string'))err('map keys must be strings');
    if(keys.length>MAX.items)err('map too large');
    const normalizedSeen=new Set(),pairs=[];
    for(const k of keys){
      const descriptor=Object.getOwnPropertyDescriptor(v,k);
      if(!descriptor||!descriptor.enumerable||!('value'in descriptor))err('unsupported map property');
      const kb=enc(k,state,depth+1),normalized=k.normalize('NFC');
      if(normalizedSeen.has(normalized))err('duplicate normalized map key');
      normalizedSeen.add(normalized);
      pairs.push([kb,enc(descriptor.value,state,depth+1)]);
    }
    pairs.sort((a,b)=>cmp(a[0],b[0]));
    const len=uleb(pairs.length),head=emit(state,Uint8Array.of(T.MAP),len);
    state.seen.delete(v);
    return cat(head,...pairs.flat());
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
    if(t===T.TEXT){const n=vu();if(n>BigInt(MAX.textBytes))err('text too large');let s;try{s=D.decode(take(n))}catch{err('invalid UTF-8')}if(!good(s)||s!==s.normalize('NFC'))err('non-canonical Unicode');return s}
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
function semanticManifest(m){return encode(m)}
function semanticManifestHash(m){return sha(semanticManifest(m))}
function universeIdentity(seed32,manifestHash32){if(!(seed32 instanceof Uint8Array)||!(manifestHash32 instanceof Uint8Array)||seed32.length!==32||manifestHash32.length!==32)err('Universe Identity requires 32-byte seed and manifest hash');const descriptor=encode({canonicalProtocolVersion:'ofu-cbv-1',masterSeed:seed32,semanticManifestHash:manifestHash32});return{descriptor,digest:sha(cat(E.encode('OFU-UNIVERSE-v1\0'),descriptor))}}
function entityIdentity(namespace,stableKey){const descriptor=encode({namespace,stableKey});return sha(cat(E.encode('OFU-ENTITY-v1\0'),descriptor))}
function u64be(x){const b=new Uint8Array(8);for(let q=7;q>=0;q--){b[q]=Number(x&255n);x>>=8n}return b}
function address(segments){
  if(!Array.isArray(segments)||!segments.length||segments.length>MAX.addressSegments)err('invalid address');
  const parts=[E.encode('OFUA'),Uint8Array.of(1),uleb(segments.length)];
  let total=parts.reduce((n,p)=>n+p.length,0);
  function add(...ps){const n=ps.reduce((sum,p)=>sum+p.length,0);total+=n;if(total>MAX.addressBytes)err('address too large');parts.push(...ps)}
  for(const s of segments){
    if(!s||typeof s!=='object')err('invalid address segment');
    if(s.kind==='namespace'){
      const b=textBytes(s.value);if(b.length>MAX.addressNamespaceBytes)err('address namespace too large');add(Uint8Array.of(1),uleb(b.length),b);
    }else if(s.kind==='u64'){
      const x=BigInt(s.value);if(x<0n||x>U64_MAX)err('u64 range');add(Uint8Array.of(2),u64be(x));
    }else if(s.kind==='i64'){
      let x=BigInt(s.value);if(x<I64_MIN||x>I64_MAX)err('i64 range');x=BigInt.asUintN(64,x);add(Uint8Array.of(3),u64be(x));
    }else if(s.kind==='bytes'){
      const b=s.value;if(!(b instanceof Uint8Array)||b.length>MAX.addressSegmentBytes)err('address bytes');add(Uint8Array.of(4),uleb(b.length),b);
    }else err('unknown address segment');
  }
  return cat(...parts);
}
function derive({masterSeed,semanticManifestHash:mh,domain,addressBytes,property,counter=0n}){
  if(!(masterSeed instanceof Uint8Array)||!(mh instanceof Uint8Array)||masterSeed.length!==32||mh.length!==32)err('derive identity sizes');
  if(!(addressBytes instanceof Uint8Array)||addressBytes.length>MAX.addressBytes)err('derive address bytes');
  return hmac(masterSeed,encode(['OFU-DERIVE-v1',mh,domain,addressBytes,property,BigInt(counter)]));
}
function addI64(a,b){a=BigInt(a);b=BigInt(b);const r=a+b;if(r<I64_MIN||r>I64_MAX)err('i64 overflow');return r}
function mulFixed(a,b,scale=1000000n){a=BigInt(a);b=BigInt(b);scale=BigInt(scale);if(scale<=0n)err('fixed scale');const n=a*b;let q=n/scale;const r=n%scale,ar=r<0n?-r:r,twice=ar*2n;if(twice>scale||(twice===scale&&(q&1n)!==0n))q+=n<0n?-1n:1n;return q}
function isqrt(n){n=BigInt(n);if(n<0n)err('negative sqrt');if(n<2n)return n;let x=1n<<BigInt((n.toString(2).length+1)>>1);for(;;){const y=(x+n/x)>>1n;if(y>=x)return x;x=y}}
O.p2={T,MAX,encode,decode,hex,unhex,hmac,semanticManifest,semanticManifestHash,universeIdentity,entityIdentity,address,derive,addI64,mulFixed,isqrt};
})(typeof globalThis!=='undefined'?globalThis:this);

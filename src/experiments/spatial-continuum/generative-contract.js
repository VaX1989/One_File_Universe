export const GENERATOR_VERSION='ofu-spatial-continuum-generator-r6-1';
export const SCIENTIFIC_MODEL_VERSION='p3-astronomy-1+p5-planet-physical-1+ofu-v1-planetology-causal-1';
export const REPRESENTATION_VERSION='ofu-spatial-continuum-representation-r6-1';

const K=new Uint32Array([1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298]);
const rotr=(value,bits)=>(value>>>bits)|(value<<(32-bits));
const bytes=value=>value instanceof Uint8Array?value:new TextEncoder().encode(String(value));
export function sha256Hex(input){
  const message=bytes(input),bitLength=BigInt(message.length)*8n,padding=((56-(message.length+1)%64)+64)%64,total=message.length+1+padding+8,buffer=new Uint8Array(total);buffer.set(message);buffer[message.length]=128;for(let index=0;index<8;index++)buffer[total-1-index]=Number((bitLength>>BigInt(index*8))&255n);
  let h0=1779033703,h1=3144134277,h2=1013904242,h3=2773480762,h4=1359893119,h5=2600822924,h6=528734635,h7=1541459225;const schedule=new Uint32Array(64);
  for(let offset=0;offset<total;offset+=64){for(let index=0;index<16;index++){const position=offset+index*4;schedule[index]=((buffer[position]<<24)|(buffer[position+1]<<16)|(buffer[position+2]<<8)|buffer[position+3])>>>0}for(let index=16;index<64;index++){const x=schedule[index-15],y=schedule[index-2],s0=(rotr(x,7)^rotr(x,18)^(x>>>3))>>>0,s1=(rotr(y,17)^rotr(y,19)^(y>>>10))>>>0;schedule[index]=(schedule[index-16]+s0+schedule[index-7]+s1)>>>0}let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;for(let index=0;index<64;index++){const s1=(rotr(e,6)^rotr(e,11)^rotr(e,25))>>>0,choice=((e&f)^((~e)&g))>>>0,t1=(h+s1+choice+K[index]+schedule[index])>>>0,s0=(rotr(a,2)^rotr(a,13)^rotr(a,22))>>>0,majority=((a&b)^(a&c)^(b&c))>>>0,t2=(s0+majority)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0}h0=(h0+a)>>>0;h1=(h1+b)>>>0;h2=(h2+c)>>>0;h3=(h3+d)>>>0;h4=(h4+e)>>>0;h5=(h5+f)>>>0;h6=(h6+g)>>>0;h7=(h7+h)>>>0}
  return [h0,h1,h2,h3,h4,h5,h6,h7].map(value=>value.toString(16).padStart(8,'0')).join('');
}

function canonicalValue(value,state,depth){
  if(depth>48)throw new RangeError('Generative value exceeds the depth bound');if(++state.nodes>16384)throw new RangeError('Generative value exceeds the node bound');
  if(value===null)return['null'];const type=typeof value;
  if(type==='string')return['string',value];if(type==='boolean')return['boolean',value];if(type==='bigint')return['bigint',value.toString()];if(type==='number'){if(!Number.isFinite(value))throw new TypeError('Generative numbers must be finite');return['number',Object.is(value,-0)?'0':String(value)]}
  if(value instanceof Uint8Array)return['bytes',Array.from(value,byte=>byte.toString(16).padStart(2,'0')).join('')];if(Array.isArray(value))return['array',value.map(item=>canonicalValue(item,state,depth+1))];
  if(type==='object'){if(state.seen.has(value))throw new TypeError('Generative values must be acyclic');if(Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null)throw new TypeError('Generative values must contain plain records');state.seen.add(value);const output=['object',Object.keys(value).sort().map(key=>[key,canonicalValue(value[key],state,depth+1)])];state.seen.delete(value);return output}
  throw new TypeError('Unsupported generative value: '+type);
}
export function stableGenerativeString(value){return JSON.stringify(canonicalValue(value,{nodes:0,seen:new WeakSet()},0))}
export function hashGenerativeState(namespace,value){return sha256Hex(stableGenerativeString({namespace:String(namespace),value}))}
const seedText=(value,label)=>{const output=String(value??'').trim();if(!output)throw new TypeError(label+' is required');return output};

export function rootSeed({masterSeed,universeId,generatorVersion=GENERATOR_VERSION}={}){return hashGenerativeState('OFU_R6_ROOT_SEED',{generatorVersion,masterSeed,universeId:seedText(universeId,'universeId')})}
export function deriveChildSeed({parentSeed,canonicalAddress,domainTag,generatorVersion=GENERATOR_VERSION}={}){return hashGenerativeState('OFU_R6_CHILD_SEED',{generatorVersion,parentSeed:seedText(parentSeed,'parentSeed'),canonicalAddress:seedText(canonicalAddress,'canonicalAddress'),domainTag:seedText(domainTag,'domainTag')})}
export function deriveSeedLineage({root,segments,generatorVersion=GENERATOR_VERSION}={}){
  let parent=seedText(root,'root seed');const lineage=[];for(const segment of segments||[]){const canonicalAddress=seedText(segment.canonicalAddress||segment.address||segment.id,'canonicalAddress'),domainTag=seedText(segment.domainTag||segment.kind,'domainTag'),seed=deriveChildSeed({parentSeed:parent,canonicalAddress,domainTag,generatorVersion});lineage.push(Object.freeze({canonicalAddress,domainTag,parentSeed:parent,seed}));parent=seed}return Object.freeze(lineage);
}
export function scientificStateHash(scientificState,{scientificModelVersion=SCIENTIFIC_MODEL_VERSION}={}){return hashGenerativeState('OFU_R6_SCIENTIFIC_STATE',{scientificModelVersion,scientificState})}
export function representationStateHash({scientificHash,representationState,representationVersion=REPRESENTATION_VERSION}={}){return hashGenerativeState('OFU_R6_REPRESENTATION_STATE',{representationVersion,scientificHash:seedText(scientificHash,'scientificHash'),representationState})}
export function deterministicRandom(seed,domainTag='random'){
  const initial=deriveChildSeed({parentSeed:seedText(seed,'random seed'),canonicalAddress:'stream',domainTag}),words=[0,8,16,24].map(offset=>parseInt(initial.slice(offset,offset+8),16)>>>0);let [a,b,c,d]=words;if(!(a|b|c|d))d=1;
  return()=>{const result=Math.imul(((a+d)>>>0),1)>>>0,t=(b<<9)>>>0;c^=a;d^=b;b^=c;a^=d;c^=t;d=(d<<11|d>>>21)>>>0;return result/4294967296};
}
export function entityProvenance({canonicalId,canonicalAddress,parentId=null,parentSeed,domainTag,scientificInputs,representationInputs=null,generatorVersion=GENERATOR_VERSION,scientificModelVersion=SCIENTIFIC_MODEL_VERSION,representationVersion=REPRESENTATION_VERSION}={}){
  const seed=deriveChildSeed({parentSeed,canonicalAddress,domainTag,generatorVersion}),scientificHash=scientificStateHash(scientificInputs,{scientificModelVersion}),representationSeed=deriveChildSeed({parentSeed:seed,canonicalAddress,domainTag:'representation',generatorVersion}),representationHash=representationInputs==null?null:representationStateHash({scientificHash,representationState:representationInputs,representationVersion});
  return Object.freeze({contract:'ofu-r6-generative-provenance-1',canonicalId:seedText(canonicalId,'canonicalId'),canonicalAddress:seedText(canonicalAddress,'canonicalAddress'),parentId:parentId==null?null:String(parentId),versions:Object.freeze({generator:generatorVersion,scientificModel:scientificModelVersion,representation:representationVersion}),seedLineage:Object.freeze({parentSeed,domainTag,seed,representationSeed}),scientificInputHash:scientificHash,representationHash,orderIndependent:true});
}

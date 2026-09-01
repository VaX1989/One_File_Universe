(function(root){
'use strict';
const O=root.OFU=root.OFU||{}; const S=()=>O.sha256;
const enc=new TextEncoder();
function assert(cond,msg){if(!cond)throw new Error(msg);}
function u16(n){assert(Number.isInteger(n)&&n>=0&&n<=65535,'u16 range');return Uint8Array.of(n>>>8,n&255);}
function u32(n){assert(Number.isInteger(n)&&n>=0&&n<=0xffffffff,'u32 range');return Uint8Array.of((n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255);}
function u64(n){n=BigInt(n);assert(n>=0n&&n<=0xffffffffffffffffn,'u64 range');const a=new Uint8Array(8);for(let i=7;i>=0;i--){a[i]=Number(n&255n);n>>=8n;}return a;}
function concat(...parts){const len=parts.reduce((s,p)=>s+p.length,0),o=new Uint8Array(len);let at=0;for(const p of parts){o.set(p,at);at+=p.length;}return o;}
function text(s){assert(typeof s==='string','text required');const n=s.normalize('NFC'),b=enc.encode(n);assert(b.length<=65535,'text too long');return concat(u16(b.length),b);}
function seed(hex){assert(typeof hex==='string'&&/^[0-9a-fA-F]{64}$/.test(hex),'MasterSeed256 must be 64 hex chars');return Uint8Array.from(hex.match(/../g),h=>parseInt(h,16));}
function address(segments){assert(Array.isArray(segments)&&segments.length>0&&segments.length<=64,'invalid address segments');const out=[Uint8Array.of(1),u16(segments.length)];for(const seg of segments){assert(seg&&typeof seg==='object','invalid address segment');if(seg.kind==='u64')out.push(Uint8Array.of(1),u64(seg.value));else if(seg.kind==='text')out.push(Uint8Array.of(2),text(seg.value));else throw new Error('unsupported address kind');}return concat(...out);}
function derivationInput({masterSeed256,manifestHash,domainTag,addressBytes,propertyTag,counter=0}){assert(/^[0-9a-f]{64}$/i.test(manifestHash),'manifestHash');assert(typeof domainTag==='string'&&domainTag.length,'domainTag');assert(typeof propertyTag==='string'&&propertyTag.length,'propertyTag');return concat(enc.encode('OFU-PRF-v1\0'),seed(masterSeed256),Uint8Array.from(manifestHash.match(/../g),h=>parseInt(h,16)),text(domainTag),u32(addressBytes.length),addressBytes,text(propertyTag),u32(counter));}
function derive32(args){return S().digest(derivationInput(args));}
function deriveU32(args){const d=derive32(args);return ((d[0]<<24)|(d[1]<<16)|(d[2]<<8)|d[3])>>>0;}
function canonicalObject(value){const chunks=[];function w(v){if(v===null){chunks.push('n');return;}if(typeof v==='boolean'){chunks.push(v?'t':'f');return;}if(typeof v==='string'){const n=v.normalize('NFC');chunks.push('s',String(enc.encode(n).length),':',n);return;}if(typeof v==='bigint'){chunks.push('i',v.toString(),';');return;}if(typeof v==='number'){assert(Number.isSafeInteger(v),'canonical numbers must be safe integers');chunks.push('i',String(v),';');return;}if(Array.isArray(v)){chunks.push('[');for(const x of v)w(x);chunks.push(']');return;}assert(typeof v==='object','unsupported canonical type');chunks.push('{');for(const k of Object.keys(v).sort()){w(k);w(v[k]);}chunks.push('}');}w(value);return enc.encode(chunks.join(''));}
function digestObject(v){return S().hex(canonicalObject(v));}
O.canonical={u16,u32,u64,concat,text,seed,address,derive32,deriveU32,canonicalObject,digestObject};
})(typeof globalThis!=='undefined'?globalThis:this);

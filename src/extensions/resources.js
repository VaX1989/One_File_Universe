(function(root){
'use strict';const O=root.OFU=root.OFU||{},C=O.pxContracts;if(!C)throw new Error('PX contracts required');
const VERSION='ofu-px-resources-1',records=new Map();let loaded=false,totalBytes=0;
function decode(record){if(record.encoding==='utf-8')return new TextEncoder().encode(record.content);C.assert(record.encoding==='base64'&&record.content.length%4===0&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(record.content),'RESOURCE','canonical base64');const raw=root.atob(record.content),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));C.assert(root.btoa(raw)===record.content,'RESOURCE','base64 canonicality');return bytes;}
function load(){if(loaded)return;C.assert(typeof document!=='undefined','RESOURCE','resource document missing');const nodes=[...document.querySelectorAll('script[id^="ofu-resource-"]')];C.assert(nodes.length<=512,'BUDGET','resource count');const pending=new Map();let total=0;
 for(const n of nodes){C.assert(n.textContent.length<=6*1024*1024,'BUDGET','encoded resource');const r=JSON.parse(n.textContent);C.keys(r,['id','kind','encoding','sourceSha256','contentSha256','content']);C.token(r.id);C.hash(r.sourceSha256);C.hash(r.contentSha256);C.assert(typeof r.content==='string'&&['glsl','wgsl','worker','table','data','compressed','image','audio'].includes(r.kind),'RESOURCE','resource schema');C.assert(n.id==='ofu-resource-'+r.id&&!pending.has(r.id),'COLLISION','resource '+r.id);const bytes=decode(r);C.assert(bytes.length<=4*1024*1024,'BUDGET','decoded resource');total+=bytes.length;C.assert(total<=64*1024*1024,'BUDGET','resource working set');C.assert(O.sha256.hex(bytes)===r.contentSha256,'INTEGRITY','embedded resource '+r.id);pending.set(r.id,Object.freeze(r));}
 for(const [id,r] of pending)records.set(id,r);totalBytes=total;loaded=true;
}
function record(id){load();C.token(id);const r=records.get(id);C.assert(r,'RESOURCE','unknown '+id);return r;}
function json(id){const r=record(id);C.assert(['data','table'].includes(r.kind)&&r.encoding==='utf-8','RESOURCE','not JSON data');return C.data(JSON.parse(r.content));}
function text(id){const r=record(id);C.assert(r.encoding==='utf-8','RESOURCE','not text');return r.content;}
function bytes(id){return decode(record(id));}
function ids(prefix=''){load();return Object.freeze([...records.keys()].filter(id=>id.startsWith(prefix)).sort());}
function snapshot(){load();return Object.freeze({version:VERSION,sealed:loaded,entries:records.size,totalDecodedBytes:totalBytes,maxDecodedBytes:67108864});}
O.pxResources=Object.freeze({VERSION,load,json,text,bytes,ids,snapshot});
})(globalThis);

import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/temporal/p4-temporal.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const P=OFU.p2,T=OFU.p4,E=new TextEncoder();
function concat(...parts){let n=0;for(const p of parts)n+=p.length;const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
function domainHash(tag,value){return OFU.sha256.digest(concat(E.encode(tag+'\0'),P.encode(value)))}
const u1=Uint8Array.from({length:32},(_,i)=>i+1),u2=Uint8Array.from(u1);u2[0]^=0xff;
const l1=T.lineageId(u1,null,'canonical'),l2=T.lineageId(u2,null,'canonical');
const a1=P.entityIdentity(u1,'synthetic',{id:'A'}),a2=P.entityIdentity(u2,'synthetic',{id:'A'});
const event=(u,l,a,sec,op)=>T.canonicalEvent({universeIdentity:u,lineageId:l,time:{seconds:sec,micros:0n},type:'core.field.set',version:1n,operationKey:op,targets:[a],payload:{field:'x',value:op},causes:[],preconditionStateDigest:null});
const e1=event(u1,l1,a1,1n,'u1'),e2=event(u2,l2,a2,2n,'u2');
assert.throws(()=>T.exportArchive({universeIdentity:u1,lineage:l1,events:[e2]}),/archive event lineage mismatch/);
const cp2=T.checkpoint({universeIdentity:u2,lineage:l2,events:[e2]});
assert.throws(()=>T.exportArchive({universeIdentity:u1,lineage:l1,checkpoint:cp2,events:[]}),/archive checkpoint lineage mismatch/);
const cp1=T.checkpoint({universeIdentity:u1,lineage:l1,events:[e1]});
assert.throws(()=>T.exportArchive({universeIdentity:u1,lineage:l1,checkpoint:cp1,events:[e1]}),/archive event does not follow checkpoint/);
const good=T.exportArchive({universeIdentity:u1,lineage:l1,events:[e1]}),decoded=P.decode(good);decoded.payload.universeIdentity=u2;decoded.integrity=domainHash('OFU-P4-ARCHIVE-v1',decoded.payload);assert.throws(()=>T.importArchive(P.encode(decoded)),/archive event lineage mismatch/);
console.log('P4 archive lineage: PASS');

import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/temporal/p4-temporal.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const P=OFU.p2,T=OFU.p4,E=new TextEncoder();
function concat(...parts){let n=0;for(const p of parts)n+=p.length;const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
function domainHash(tag,value){return OFU.sha256.digest(concat(E.encode(tag+'\0'),P.encode(value)))}
const u1=Uint8Array.from({length:32},(_,i)=>i+1),u2=Uint8Array.from(u1);u2[0]^=0xff;const l1=T.lineageId(u1,null,'canonical'),l2=T.lineageId(u2,null,'canonical'),a1=P.entityIdentity(u1,'synthetic',{id:'A'}),a2=P.entityIdentity(u2,'synthetic',{id:'A'});
const event=(u,l,a,sec,op)=>T.canonicalEvent({universeIdentity:u,lineageId:l,time:{seconds:sec,micros:0n},type:'core.field.set',version:1n,operationKey:op,targets:[a],payload:{field:'x',value:op},causes:[],preconditionStateDigest:null});const e1=event(u1,l1,a1,1n,'u1'),e2=event(u2,l2,a2,2n,'u2'),e3=event(u1,l1,a1,3n,'u1-3'),sameA=event(u1,l1,a1,4n,'same-a'),sameB=event(u1,l1,a1,4n,'same-b');
assert.throws(()=>T.exportArchive({universeIdentity:u1,lineage:l1,events:[e2]}),/archive event lineage mismatch/);const cp2=T.checkpoint({universeIdentity:u2,lineage:l2,events:[e2]});assert.throws(()=>T.exportArchive({universeIdentity:u1,lineage:l1,checkpoint:cp2,events:[]}),/archive checkpoint lineage mismatch/);const cp1=T.checkpoint({universeIdentity:u1,lineage:l1,events:[e1]});assert.throws(()=>T.exportArchive({universeIdentity:u1,lineage:l1,checkpoint:cp1,events:[e1]}),/archive event does not follow checkpoint/);
const good=T.exportArchive({universeIdentity:u1,lineage:l1,events:[e1]}),decoded=P.decode(good);decoded.payload.universeIdentity=u2;decoded.integrity=domainHash('OFU-P4-ARCHIVE-v2',decoded.payload);assert.throws(()=>T.importArchive(P.encode(decoded)),/archive event lineage mismatch/);
const canonical=T.exportArchive({universeIdentity:u1,lineage:l1,events:[e1,e3]}),reopened=T.importArchive(canonical);assert.deepEqual(Array.from(T.exportArchive(reopened)),Array.from(canonical),'canonical archive must round-trip byte-for-byte');
const reordered=P.decode(canonical);reordered.payload.events.reverse();reordered.integrity=domainHash('OFU-P4-ARCHIVE-v2',reordered.payload);assert.throws(()=>T.importArchive(P.encode(reordered)),/archive live tail is not canonical/,'integrity-valid reordered tails must fail closed');
const sameTime=T.exportArchive({universeIdentity:u1,lineage:l1,events:[sameA,sameB]}),sameTimeReordered=P.decode(sameTime);sameTimeReordered.payload.events.reverse();sameTimeReordered.integrity=domainHash('OFU-P4-ARCHIVE-v2',sameTimeReordered.payload);assert.throws(()=>T.importArchive(P.encode(sameTimeReordered)),/archive live tail is not canonical/,'same-time tails must preserve canonical event-id tie-break order');
const duplicated=P.decode(canonical);duplicated.payload.events.push(duplicated.payload.events[1]);duplicated.integrity=domainHash('OFU-P4-ARCHIVE-v2',duplicated.payload);assert.throws(()=>T.importArchive(P.encode(duplicated)),/archive live tail contains duplicate event/,'integrity-valid duplicate event records must fail closed');
console.log('P4 archive lineage: PASS');

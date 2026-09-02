import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const f of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/temporal/p4-temporal.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});
const P=OFU.p2,T=OFU.p4,E=new TextEncoder();
function concat(...parts){let n=0;for(const p of parts)n+=p.length;const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
function domainHash(tag,value){return OFU.sha256.digest(concat(E.encode(tag+'\0'),P.encode(value)))}
const u1=Uint8Array.from({length:32},(_,i)=>i+1),u2=Uint8Array.from(u1);u2[0]^=0xff;const l1=T.lineageId(u1,null,'canonical'),l2=T.lineageId(u2,null,'canonical');const cp=T.checkpoint({universeIdentity:u1,lineage:l1,baseline:{seed:'A'},events:[]});
const forged=P.decode(P.encode(cp));forged.descriptor.state.universeIdentity=u2;forged.descriptor.state.lineageId=l2;forged.descriptor.stateDigest=domainHash('OFU-P4-STATE-v1',forged.descriptor.state);forged.id=domainHash('OFU-P4-CHECKPOINT-v1',forged.descriptor);assert.throws(()=>T.verifyCheckpoint(forged),/checkpoint state lineage mismatch/);
assert.throws(()=>T.exportArchive({universeIdentity:u1,lineage:l1,baseline:{seed:'B'},checkpoint:cp,events:[]}),/archive checkpoint baseline mismatch/);const archive=T.exportArchive({universeIdentity:u1,lineage:l1,baseline:{seed:'A'},checkpoint:cp,events:[]});assert.doesNotThrow(()=>T.importArchive(archive));
console.log('P4 checkpoint authority: PASS');

import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.OFU={};
for(const file of ['src/kernel/sha256.js','src/kernel/p2-unicode.js','src/kernel/p2-canonical.js','src/temporal/p4-temporal.js']){
  vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
}

const P=OFU.p2;
const T=OFU.p4;
const universeA=Uint8Array.from({length:32},(_,i)=>i+1);
const universeB=Uint8Array.from(universeA); universeB[0]^=0xff;
const lineageA=T.lineageId(universeA,null,'canonical');
const lineageB=T.lineageId(universeB,null,'canonical');
const entityA=P.entityIdentity(universeA,'integration.synthetic',{id:'A'});
const entityB=P.entityIdentity(universeB,'integration.synthetic',{id:'A'});

function event(universe,lineage,target,seconds,value){
  return T.canonicalEvent({
    universeIdentity:universe,
    lineageId:lineage,
    time:{seconds,micros:0n},
    type:'core.field.set',
    version:1n,
    operationKey:'integration-'+value,
    targets:[target],
    payload:{field:'value',value},
    causes:[],
    preconditionStateDigest:null
  });
}

const eventA=event(universeA,lineageA,entityA,1n,'A');
const eventB=event(universeB,lineageB,entityB,2n,'B');

// INT-P2-P4-001: wrong-universe events/checkpoints/archives fail closed.
assert.throws(
  ()=>T.replay({universeIdentity:universeA,lineage:lineageA,events:[eventB]}),
  /event universe mismatch/
);
assert.throws(
  ()=>T.exportArchive({universeIdentity:universeA,lineage:lineageA,events:[eventB]}),
  /archive event lineage mismatch/
);
const checkpointB=T.checkpoint({universeIdentity:universeB,lineage:lineageB,events:[eventB]});
assert.throws(
  ()=>T.exportArchive({universeIdentity:universeA,lineage:lineageA,checkpoint:checkpointB,events:[]}),
  /archive checkpoint lineage mismatch/
);

// INT-P2-P4-002: P2 canonical bytes are the archive serialization authority.
const archive=T.exportArchive({universeIdentity:universeA,lineage:lineageA,baseline:{kind:'integration-baseline'},events:[eventA]});
const decoded=P.decode(archive);
const reencoded=P.encode(decoded);
assert.deepEqual(Array.from(reencoded),Array.from(archive),'P4 archive must be canonical P2 encode/decode bytes');
const imported=T.importArchive(archive);
const exportedAgain=T.exportArchive(imported);
assert.deepEqual(Array.from(exportedAgain),Array.from(archive),'P4 import/export must preserve canonical P2 archive bytes');

console.log('P2 -> P4 integration contract tests: PASS');

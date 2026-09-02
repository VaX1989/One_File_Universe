import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const p2Workflow=fs.readFileSync('.github/workflows/p2-conformance.yml','utf8');
const p4Workflow=fs.readFileSync('.github/workflows/p4-conformance.yml','utf8');

assert.doesNotMatch(p2Workflow,/^\s*-\s*run:\s*npm test\s*$/m,'P2 workflow must not inherit downstream tests through generic npm test');
assert.match(p2Workflow,/npm run test:p2/,'P2 workflow must execute its explicit phase-scoped test command');
assert.match(p2Workflow,/dist\/evidence\/p2-\*\.json/,'P2 artifacts must include only explicitly P2-owned evidence records');
assert.match(p4Workflow,/dist\/evidence\/p4\//,'P4 artifacts must use a phase-owned evidence root');

for(const file of ['tests/p4/run-p4-tests.mjs','tests/p4/browser-p4.mjs','tools/p4-benchmark.mjs']){
  assert.match(fs.readFileSync(file,'utf8'),/dist\/evidence\/p4/,'P4 evidence producer must write to phase-owned root: '+file);
}

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ofu-p2-foreign-evidence-'));
const aggregatePath='dist/p2-aggregate.json';
try{
  fs.writeFileSync(path.join(tmp,'foreign-p4.json'),JSON.stringify({
    evidenceSchemaVersion:1,
    phase:'P4',
    evidenceKind:'p4-node-replay',
    producer:'tests/integration/evidence-isolation-tests.mjs',
    sourceCommit:'1'.repeat(40),
    status:'PASS'
  }));
  const result=spawnSync(process.execPath,['tools/aggregate-p2-evidence.mjs',tmp],{
    encoding:'utf8',
    env:{...process.env,OFU_SOURCE_SHA:'1'.repeat(40)}
  });
  assert.notEqual(result.status,0,'P2 aggregate must reject foreign typed evidence when it enters the P2 evidence set');
  const aggregate=JSON.parse(fs.readFileSync(aggregatePath,'utf8'));
  assert.ok(aggregate.failures.some(f=>f.code==='MALFORMED_EVIDENCE'&&/phase must be P2/.test(f.message)),'P2 aggregate must fail closed specifically on foreign phase ownership');
}finally{
  fs.rmSync(tmp,{recursive:true,force:true});
  fs.rmSync(aggregatePath,{force:true});
}

console.log('Cross-phase evidence isolation: PASS');

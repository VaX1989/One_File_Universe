import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const workflow=fs.readFileSync('.github/workflows/p2-conformance.yml','utf8');

assert.doesNotMatch(workflow,/^\s*-\s*run:\s*npm test\s*$/m,'P2 workflow must not inherit downstream tests through generic npm test');
assert.match(workflow,/npm run test:p2/,'P2 workflow must execute explicit frozen P2 scope');
assert.match(workflow,/dist\/One_File_Universe\.html/,'P2 build artifact must include the built application explicitly');
assert.match(workflow,/dist\/build-manifest\.json/,'P2 build artifact must include the typed P2 build manifest explicitly');
assert.match(workflow,/dist\/evidence\/p2-\*\.json/,'P2 artifacts must include only explicitly P2-owned evidence records');
assert.doesNotMatch(workflow,/^\s+path:\s+dist\/\s*$/m,'P2 artifacts must not upload the generic dist tree');
assert.doesNotMatch(workflow,/^\s+path:\s+dist\/evidence\/\s*$/m,'P2 artifacts must not upload a generic mixed evidence directory');

const reproducible=fs.readFileSync('tests/build/reproducible-build.mjs','utf8');
assert.match(reproducible,/function restoreEvidence\(/,'reproducible-build must preserve nested phase-owned evidence recursively');

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ofu-p2-foreign-evidence-'));
const aggregatePath='dist/p2-aggregate.json';
try{
  fs.writeFileSync(path.join(tmp,'synthetic-foreign-phase.json'),JSON.stringify({
    evidenceSchemaVersion:1,
    phase:'P99',
    evidenceKind:'p99-synthetic-conformance',
    producer:'tests/integration/evidence-isolation-generic.mjs',
    sourceCommit:'1'.repeat(40),
    status:'PASS'
  }));
  const result=spawnSync(process.execPath,['tools/aggregate-p2-evidence.mjs',tmp],{
    encoding:'utf8',
    env:{...process.env,OFU_SOURCE_SHA:'1'.repeat(40)}
  });
  assert.notEqual(result.status,0,'P2 aggregate must reject any foreign phase document deliberately inserted into its evidence set');
  const aggregate=JSON.parse(fs.readFileSync(aggregatePath,'utf8'));
  assert.ok(aggregate.failures.some(f=>f.code==='MALFORMED_EVIDENCE'&&/phase must be P2/.test(f.message)),'P2 aggregate must fail closed specifically on foreign phase ownership');
}finally{
  fs.rmSync(tmp,{recursive:true,force:true});
  fs.rmSync(aggregatePath,{force:true});
}

console.log('Generic upstream evidence isolation: PASS');

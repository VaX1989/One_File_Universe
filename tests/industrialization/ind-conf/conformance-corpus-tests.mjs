import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const manifest=JSON.parse(fs.readFileSync('conformance/iw0/manifest.json','utf8'));
assert.equal(manifest.schema,'ofu-ind-conf-corpus-manifest-v1');
assert.equal(manifest.prompt_id,'IND-CONF-A');
assert.match(manifest.corpus_digest,/^[0-9a-f]{64}$/);
assert.equal(manifest.files.length,2);
function run(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8',env:{...process.env,OFU_SOURCE_SHA:process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED'}});if(r.status!==0){process.stderr.write(r.stdout||'');process.stderr.write(r.stderr||'');throw new Error(`${cmd} ${args.join(' ')} exited ${r.status}`)}const lines=r.stdout.trim().split(/\r?\n/).filter(Boolean);const evidence=JSON.parse(lines.at(-1));assert.equal(evidence.status,'PASS');assert.equal(evidence.corpus_digest,manifest.corpus_digest);return evidence}
const js=run(process.execPath,['tools/industrialization/ind-conf/run-js-authority.mjs']);
const py=run(process.env.PYTHON||'python3',['tools/industrialization/ind-conf/run-python-oracle.py']);
assert.ok(js.positive_checks>=40);assert.ok(js.rejection_checks>=35);assert.ok(py.positive_checks>=40);assert.ok(py.rejection_checks>=30);
console.log(JSON.stringify({schema:'ofu-ind-conf-a-combined-test-v1',status:'PASS',corpus_digest:manifest.corpus_digest,js,python:py}));

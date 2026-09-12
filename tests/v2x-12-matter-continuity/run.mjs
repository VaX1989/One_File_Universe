import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const files=[
  'tests/v2x-12-matter-continuity/authority-provenance.mjs',
  'tests/v2x-12-matter-continuity/continuity-biology.mjs'
];

function execute(file){
  const result=spawnSync(process.execPath,[file],{encoding:'utf8'});
  if(result.error)throw result.error;
  if(result.status!==0){
    if(result.stdout)process.stdout.write(result.stdout);
    if(result.stderr)process.stderr.write(result.stderr);
    process.exit(result.status||1);
  }
  return Object.freeze({stdout:result.stdout||'',stderr:result.stderr||''});
}

for(const file of files){
  const first=execute(file),second=execute(file);
  assert.equal(second.stdout,first.stdout,`${file} stdout changed on deterministic replay`);
  assert.equal(second.stderr,first.stderr,`${file} stderr changed on deterministic replay`);
  if(first.stdout)process.stdout.write(first.stdout);
  if(first.stderr)process.stderr.write(first.stderr);
}

console.log(JSON.stringify({status:'PASS',suite:'v2x-12-matter-continuity',files,replays:2,deterministicReplay:true}));

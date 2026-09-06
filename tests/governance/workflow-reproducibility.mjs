import fs from 'node:fs';
import assert from 'node:assert/strict';

const workflows=[
  '.github/workflows/foundation.yml',
  '.github/workflows/p1-p4-baseline.yml',
  '.github/workflows/p3-conformance.yml',
  '.github/workflows/p5-conformance.yml',
  '.github/workflows/p5-environment-v2-canonical.yml',
  '.github/workflows/p6-v1-conformance.yml',
  '.github/workflows/post-v1-development.yml',
];
const immutableAction=/uses:\s+[^\s@]+@[0-9a-f]{40}(?:\s+#.*)?$/;
let checks=0;
for(const file of workflows){
  const text=fs.readFileSync(file,'utf8');
  const actionLines=text.split(/\r?\n/).filter(line=>/\buses:\s+/.test(line));
  assert(actionLines.length>0,`${file}: expected action dependencies`);
  for(const line of actionLines){
    assert(immutableAction.test(line.trim()),`${file}: action dependency must be pinned to an immutable 40-hex commit: ${line.trim()}`);
    checks++;
  }
  assert(!/python-version:\s*['"]3\.13['"]/.test(text),`${file}: Python conformance runtime must pin an exact patch version`);
  checks++;
  if(/OFU_SOURCE_SHA/.test(text)){
    const artifactNameLines=text.split(/\r?\n/).filter(line=>/^\s*name:\s+.*\$\{\{.*github\.sha/.test(line));
    assert.equal(artifactNameLines.length,0,`${file}: artifact names must bind to OFU_SOURCE_SHA rather than the pull-request merge SHA`);
    checks++;
  }
}
console.log(JSON.stringify({status:'PASS',suite:'workflow-reproducibility',workflows:workflows.length,checks}));

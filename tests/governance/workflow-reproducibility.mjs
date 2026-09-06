import fs from 'node:fs';
import assert from 'node:assert/strict';

const coreWorkflows=[
  '.github/workflows/foundation.yml',
  '.github/workflows/p1-p4-baseline.yml',
  '.github/workflows/p3-conformance.yml',
  '.github/workflows/p5-conformance.yml',
  '.github/workflows/p5-environment-v2-canonical.yml',
  '.github/workflows/p6-v1-conformance.yml',
  '.github/workflows/post-v1-development.yml',
];
const v11WorldWorkflows=[
  '.github/workflows/v11-world-astronomy-depth.yml',
  '.github/workflows/v11-world-astronomy-observability.yml',
  '.github/workflows/v11-world-civilization-representatives.yml',
  '.github/workflows/v11-world-life-causality.yml',
  '.github/workflows/v11-world-material-depth.yml',
  '.github/workflows/v11-world-molecular-reference-mass.yml',
];
const workflows=[...coreWorkflows,...v11WorldWorkflows,'.github/workflows/source-reproduction.yml'];
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
for(const file of [...coreWorkflows,...v11WorldWorkflows]){
  const text=fs.readFileSync(file,'utf8');
  assert(text.includes('OFU_SOURCE_SHA: ${{ github.event.pull_request.head.sha || github.sha }}'),`${file}: exact PR-head source identity is required`);
  assert(/ref:\s*['"]?\$\{\{\s*env\.OFU_SOURCE_SHA\s*\}\}/.test(text),`${file}: checkout must explicitly target OFU_SOURCE_SHA`);
  assert(/git rev-parse HEAD[^\n]*OFU_SOURCE_SHA/.test(text),`${file}: exact source checkout must be verified before evidence`);
  assert(/concurrency:[\s\S]*?cancel-in-progress:\s*true/.test(text),`${file}: superseded exact-head runs must be cancellable`);
  checks+=4;
}
for(const file of v11WorldWorkflows){
  const text=fs.readFileSync(file,'utf8');
  assert(text.includes(`'${file}'`),`${file}: pull-request paths must include the workflow itself so CI changes are exercised`);
  checks++;
}
const sourceReproduction=fs.readFileSync('.github/workflows/source-reproduction.yml','utf8');
assert(/-\s+['"]development\/v1\.\*['"]/.test(sourceReproduction),'source reproduction must cover canonical post-v1 development heads');
checks++;
console.log(JSON.stringify({status:'PASS',suite:'workflow-reproducibility',workflows:workflows.length,checks}));

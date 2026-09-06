import fs from 'node:fs';
import assert from 'node:assert/strict';

const workflowDir='.github/workflows';
const coreWorkflows=[
  `${workflowDir}/foundation.yml`,
  `${workflowDir}/p1-p4-baseline.yml`,
  `${workflowDir}/p3-conformance.yml`,
  `${workflowDir}/p5-conformance.yml`,
  `${workflowDir}/p5-environment-v2-canonical.yml`,
  `${workflowDir}/p6-v1-conformance.yml`,
  `${workflowDir}/post-v1-development.yml`,
];
const featureWorkflowNames=fs.readdirSync(workflowDir)
  .filter(name=>/^v11-world-.*\.yml$/.test(name)||/^product-v11-.*\.yml$/.test(name))
  .sort();
const featureWorkflows=featureWorkflowNames.map(name=>`${workflowDir}/${name}`);
const v11WorldWorkflows=featureWorkflows.filter(file=>/\/v11-world-/.test(file));
assert(v11WorldWorkflows.length>0,'expected at least one canonical v1.1 world workflow');
const workflows=[...coreWorkflows,...featureWorkflows,`${workflowDir}/source-reproduction.yml`];
const immutableAction=/uses:\s+[^\s@]+@[0-9a-f]{40}(?:\s+#.*)?$/;
let checks=1;
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
for(const file of [...coreWorkflows,...featureWorkflows]){
  const text=fs.readFileSync(file,'utf8');
  assert(text.includes('OFU_SOURCE_SHA: ${{ github.event.pull_request.head.sha || github.sha }}'),`${file}: exact PR-head source identity is required`);
  assert(/ref:\s*['"]?\$\{\{\s*env\.OFU_SOURCE_SHA\s*\}\}/.test(text),`${file}: checkout must explicitly target OFU_SOURCE_SHA`);
  assert(/git rev-parse HEAD[^\n]*OFU_SOURCE_SHA/.test(text),`${file}: exact source checkout must be verified before evidence`);
  assert(/concurrency:[\s\S]*?cancel-in-progress:\s*true/.test(text),`${file}: superseded exact-head runs must be cancellable`);
  checks+=4;
}
for(const file of featureWorkflows){
  const text=fs.readFileSync(file,'utf8');
  assert(text.includes(`'${file}'`),`${file}: pull-request paths must include the workflow itself so CI changes are exercised`);
  checks++;
}
const sourceReproduction=fs.readFileSync(`${workflowDir}/source-reproduction.yml`,'utf8');
assert(/-\s+['"]development\/v1\.\*['"]/.test(sourceReproduction),'source reproduction must cover canonical post-v1 development heads');
checks++;
console.log(JSON.stringify({status:'PASS',suite:'workflow-reproducibility',workflows:workflows.length,featureWorkflows:featureWorkflows.length,v11WorldWorkflows:v11WorldWorkflows.length,checks}));

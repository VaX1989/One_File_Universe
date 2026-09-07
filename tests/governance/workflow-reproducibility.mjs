import fs from 'node:fs';
import assert from 'node:assert/strict';

const workflowDir='.github/workflows';
const coreWorkflows=[
  `${workflowDir}/foundation.yml`,
  `${workflowDir}/p1-conformance.yml`,
  `${workflowDir}/p1-p4-baseline.yml`,
  `${workflowDir}/p2-conformance.yml`,
  `${workflowDir}/p3-conformance.yml`,
  `${workflowDir}/p4-conformance.yml`,
  `${workflowDir}/p5-conformance.yml`,
  `${workflowDir}/p5-environment-v2-canonical.yml`,
  `${workflowDir}/p6-v1-conformance.yml`,
  `${workflowDir}/post-v1-development.yml`,
];
const featureWorkflowNames=fs.readdirSync(workflowDir)
  .filter(name=>/^v11-world-.*\.yml$/.test(name)||/^product-v11-.*\.yml$/.test(name)||/^reliability-.*\.yml$/.test(name))
  .sort();
const featureWorkflows=featureWorkflowNames.map(name=>`${workflowDir}/${name}`);
const v11WorldWorkflows=featureWorkflows.filter(file=>/\/v11-world-/.test(file));
const reliabilityWorkflows=featureWorkflows.filter(file=>/\/reliability-/.test(file));
assert(v11WorldWorkflows.length>0,'expected at least one canonical v1.1 world workflow');
assert(reliabilityWorkflows.length>0,'expected at least one canonical reliability workflow');
const sourceReproductionFile=`${workflowDir}/source-reproduction.yml`;
const workflows=[...coreWorkflows,...featureWorkflows,sourceReproductionFile];
const immutableAction=/uses:\s+[^\s@]+@[0-9a-f]{40}(?:\s+#.*)?$/;
let checks=2;
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
  const malformedSingleQuotedJq=text.split(/\r?\n/).filter(line=>/jq\s+-r\s+'/.test(line)&&/\\"/.test(line));
  assert.equal(malformedSingleQuotedJq.length,0,`${file}: jq programs already protected by single quotes must not backslash-escape double quotes: ${malformedSingleQuotedJq.join(' | ')}`);
  checks++;
  if(/OFU_SOURCE_SHA/.test(text)){
    const artifactNameLines=text.split(/\r?\n/).filter(line=>/^\s*name:\s+.*\$\{\{.*github\.sha/.test(line));
    assert.equal(artifactNameLines.length,0,`${file}: artifact names must bind to OFU_SOURCE_SHA rather than the pull-request merge SHA`);
    checks++;
  }
}
const exactHeadWorkflows=[...coreWorkflows,...featureWorkflows,sourceReproductionFile];
for(const file of exactHeadWorkflows){
  const text=fs.readFileSync(file,'utf8');
  assert(text.includes('OFU_SOURCE_SHA: ${{ github.event.pull_request.head.sha || github.sha }}'),`${file}: exact PR-head source identity is required`);
  assert(/ref:\s*['"]?\$\{\{\s*env\.OFU_SOURCE_SHA\s*\}\}/.test(text),`${file}: checkout must explicitly target OFU_SOURCE_SHA`);
  assert(/git rev-parse HEAD[^\n]*(?:OFU_SOURCE_SHA|EXPECTED_SHA)/.test(text),`${file}: exact source checkout must be verified before evidence`);
  assert(/concurrency:[\s\S]*?cancel-in-progress:\s*true/.test(text),`${file}: superseded exact-head runs must be cancellable`);
  checks+=4;
}
for(const file of featureWorkflows){
  const text=fs.readFileSync(file,'utf8');
  assert(text.includes(`'${file}'`),`${file}: pull-request paths must include the workflow itself so CI changes are exercised`);
  checks++;
}
const sourceReproduction=fs.readFileSync(sourceReproductionFile,'utf8');
assert(/push:[\s\S]*?-\s+['"]development\/v1\.\*['"]/.test(sourceReproduction),'source reproduction must cover canonical post-v1 development heads');
assert(/pull_request:[\s\S]*?-\s+['"]development\/v1\.\*['"]/.test(sourceReproduction),'source reproduction must cover proposed post-v1 heads');
assert(/name:\s+source-reproduction-\$\{\{\s*env\.OFU_SOURCE_SHA\s*\}\}/.test(sourceReproduction),'source reproduction artifact must be named by exact source SHA');
checks+=3;

// Primary post-v1 control-plane workflows must not regress to GitHub Actions
// whose JavaScript runtime requires the hosted runner's Node 20 compatibility shim.
// These immutable commits were independently verified to declare `runs.using: node24`.
const nativeNode24Pins=Object.freeze({
  checkout:'actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09',
  setupNode:'actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444',
  setupPython:'actions/setup-python@ece7cb06caefa5fff74198d8649806c4678c61a1',
  uploadArtifact:'actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f',
});
const nativeRuntimeContracts=[
  {file:`${workflowDir}/foundation.yml`,pins:['checkout','setupNode','setupPython']},
  {file:`${workflowDir}/post-v1-development.yml`,pins:['checkout','setupNode','setupPython']},
  {file:sourceReproductionFile,pins:['checkout','uploadArtifact']},
  {file:`${workflowDir}/reliability-phase-router.yml`,pins:['checkout','setupNode']},
];
for(const contract of nativeRuntimeContracts){
  const text=fs.readFileSync(contract.file,'utf8');
  for(const key of contract.pins){
    assert(text.includes(nativeNode24Pins[key]),`${contract.file}: ${key} must use the authenticated native Node 24 action pin`);
    checks++;
  }
}

console.log(JSON.stringify({status:'PASS',suite:'workflow-reproducibility',workflows:workflows.length,featureWorkflows:featureWorkflows.length,v11WorldWorkflows:v11WorldWorkflows.length,reliabilityWorkflows:reliabilityWorkflows.length,nativeRuntimeContracts:nativeRuntimeContracts.length,checks}));

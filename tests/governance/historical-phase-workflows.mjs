import fs from 'node:fs';
import assert from 'node:assert/strict';

const workflowDir='.github/workflows';
const routed=[
  {name:'p1-conformance.yml',phases:'P1',minNeeds:4},
  {name:'p1-p4-baseline.yml',phases:'P1,P2,P3,P4',minNeeds:4},
  {name:'p2-conformance.yml',phases:'P2',minNeeds:4},
  {name:'p3-conformance.yml',phases:'P3',minNeeds:3},
  {name:'p4-conformance.yml',phases:'P4',minNeeds:4},
  {name:'p5-conformance.yml',phases:'P5',minNeeds:4},
  {name:'p5-environment-v2-canonical.yml',phases:'P5',minNeeds:4},
  {name:'p6-v1-conformance.yml',phases:'P6',minNeeds:4},
];
let checks=0;

for(const spec of routed){
  const file=`${workflowDir}/${spec.name}`;
  const text=fs.readFileSync(file,'utf8');
  assert(/^\s{2}route:\s*$/m.test(text),`${spec.name}: dedicated route job required`);checks++;
  assert(text.includes('fetch-depth: 0'),`${spec.name}: route checkout must have full history`);checks++;
  assert(text.includes('OFU_BASE_REF: ${{ github.event.pull_request.base.ref || github.ref_name }}'),`${spec.name}: exact base ref wiring required`);checks++;
  assert(text.includes('OFU_BASE_SHA: ${{ github.event.pull_request.base.sha || github.event.before }}'),`${spec.name}: exact base SHA wiring required`);checks++;
  assert(text.includes(`node tools/ci/phase-gate.mjs --phases ${spec.phases} --base-ref "$OFU_BASE_REF" --base-sha "$OFU_BASE_SHA" --head-sha "$OFU_SOURCE_SHA"`),`${spec.name}: canonical ${spec.phases} phase gate invocation required`);checks++;
  assert(/outputs:[\s\S]*?run:\s*\$\{\{\s*steps\.phase-gate\.outputs\.run\s*\}\}/.test(text),`${spec.name}: route run output required`);checks++;
  const needsRoute=(text.match(/needs:\s*(?:\[[^\]]*\broute\b[^\]]*\]|route)\s*$/gm)||[]).length;
  assert(needsRoute>=spec.minNeeds,`${spec.name}: heavy jobs must depend on route (found ${needsRoute}, need ${spec.minNeeds})`);checks++;
  assert(text.includes("needs.route.outputs.run == 'true'"),`${spec.name}: heavy execution must be conditioned on route output`);checks++;
  assert(/push:[\s\S]*?['"]development\/v1\.\*['"]/.test(text),`${spec.name}: canonical development pushes must receive routed evidence`);checks++;
  assert(text.includes('OFU_SOURCE_SHA: ${{ github.event.pull_request.head.sha || github.sha }}'),`${spec.name}: exact source identity required`);checks++;
}

const p6=fs.readFileSync(`${workflowDir}/p6-v1-conformance.yml`,'utf8');
assert(!/pull_request:\s*\n\s+branches:\s*\[main\]/.test(p6),'P6 must route all PRs so biosphere changes targeting development cannot bypass P6');checks++;

for(const name of ['p1-conformance.yml','p1-p4-baseline.yml','p2-conformance.yml','p4-conformance.yml','p5-conformance.yml','p5-environment-v2-canonical.yml','p6-v1-conformance.yml']){
  const text=fs.readFileSync(`${workflowDir}/${name}`,'utf8');
  assert(/if:\s*\$\{\{\s*always\(\)\s*&&\s*needs\.route\.outputs\.run\s*==\s*'true'\s*\}\}/.test(text),`${name}: aggregate/seal must remain dormant when historical evidence is not routed`);checks++;
}

console.log(JSON.stringify({status:'PASS',suite:'historical-phase-workflows',workflows:routed.length,checks}));

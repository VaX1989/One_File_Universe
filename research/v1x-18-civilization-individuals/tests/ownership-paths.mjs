import assert from 'node:assert/strict';

const owner='v1x-18-civilization-individuals';
const changed=[
  `research/${owner}/civilization-model.mjs`,
  `research/${owner}/individual-refinement.mjs`,
  `research/${owner}/p4-bridge.mjs`,
  `research/${owner}/fixtures/causal-oracle.json`,
  `research/${owner}/tests/run.mjs`,
  `research/${owner}/tests/ownership-paths.mjs`,
  `docs/evidence/${owner}/SCIENTIFIC_MODEL_NOTES.md`,
  `reports/${owner}/RESEARCH_REPORT.md`,
  `reports/${owner}/test-evidence.json`,
  `docs/parallel/handoffs/${owner}/HANDOFF.json`
];
const allow=[`research/${owner}/`,`prototypes/${owner}/`,`docs/evidence/${owner}/`,`docs/parallel/handoffs/${owner}/`,`reports/${owner}/`];
const deniedPrefixes=['.github/','src/','tests/p1/','tests/p2/','tests/p3/','tests/p4/','tests/p5/','tests/p6/','config/','tools/'];
for(const path of changed){assert.ok(allow.some(prefix=>path.startsWith(prefix)),`outside RESEARCH template: ${path}`);assert.ok(!deniedPrefixes.some(prefix=>path.startsWith(prefix)),`forbidden shared/frozen path: ${path}`);}
assert.equal(new Set(changed).size,changed.length,'duplicate changed path declaration');
console.log(JSON.stringify({schema:'ofu-r18-static-ownership-audit-1',status:'PASS',laneId:'V1X-18',matrixVersion:'2026-09-06.1',changedPaths:changed}));

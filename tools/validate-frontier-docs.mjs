import fs from 'node:fs';

const dagPath = new URL('../docs/frontier/WORKSTREAM_DAG.json', import.meta.url);
const schemaPath = new URL('../docs/frontier/WORKSTREAM_DAG.schema.json', import.meta.url);
const dag = JSON.parse(fs.readFileSync(dagPath, 'utf8'));
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const failures = [];

const requiredRoot = schema.required;
for (const key of requiredRoot) if (!(key in dag)) failures.push(`missing root key: ${key}`);
if (dag.schemaVersion !== 1) failures.push('schemaVersion must be 1');
if (dag.authority !== 'PLANNING_METADATA_ONLY') failures.push('authority must be PLANNING_METADATA_ONLY');
if (!/^[0-9a-f]{40}$/.test(dag.baseMainSha ?? '')) failures.push('baseMainSha must be a 40-char lowercase hex SHA');
if (!Array.isArray(dag.workstreams) || dag.workstreams.length === 0) failures.push('workstreams must be non-empty');

const required = schema.properties.workstreams.items.required;
const allowedMaturity = new Set(schema.properties.workstreams.items.properties.currentMaturity.enum);
const allowedAuthority = new Set(schema.properties.workstreams.items.properties.authorityClass.enum);
const ids = new Set();
for (const ws of dag.workstreams ?? []) {
  for (const key of required) if (!(key in ws)) failures.push(`${ws.id ?? '<unknown>'}: missing ${key}`);
  if (!/^F-[A-Z0-9-]+$/.test(ws.id ?? '')) failures.push(`${ws.id ?? '<unknown>'}: invalid id`);
  if (ids.has(ws.id)) failures.push(`duplicate workstream id: ${ws.id}`);
  ids.add(ws.id);
  if (!allowedMaturity.has(ws.currentMaturity)) failures.push(`${ws.id}: invalid currentMaturity`);
  if (!allowedAuthority.has(ws.authorityClass)) failures.push(`${ws.id}: invalid authorityClass`);
  for (const key of ['canonicalInputs','canonicalOutputs','derivedOutputs','presentationOutputs','dependencies','downstreamConsumers','parallelSafeSublanes','sharedFileRisks','crossScaleInvariants','evidenceRequirements','knownUnsupportedAreas','ownedModules','sharedIntegrationSurfaces','promotionPrerequisites']) {
    if (!Array.isArray(ws[key])) failures.push(`${ws.id}: ${key} must be array`);
  }
}

for (const ws of dag.workstreams ?? []) {
  for (const dep of ws.dependencies ?? []) {
    if (!ids.has(dep)) failures.push(`${ws.id}: dependency does not exist: ${dep}`);
    if (dep === ws.id) failures.push(`${ws.id}: self dependency`);
  }
}

const byId = new Map((dag.workstreams ?? []).map(ws => [ws.id, ws]));
const visiting = new Set();
const visited = new Set();
function visit(id, trail=[]) {
  if (visiting.has(id)) { failures.push(`cycle: ${[...trail,id].join(' -> ')}`); return; }
  if (visited.has(id)) return;
  visiting.add(id);
  for (const dep of byId.get(id)?.dependencies ?? []) visit(dep, [...trail,id]);
  visiting.delete(id);
  visited.add(id);
}
for (const id of ids) visit(id);

if (failures.length) {
  console.error('OFU frontier documentation validation: FAIL');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`OFU frontier documentation validation: PASS (${ids.size} workstreams, acyclic dependencies)`);

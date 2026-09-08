import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditRepository, strictExitCode, AUTHORITY_CLASSES } from './v2-science-authority-oracle.mjs';

const files = {
  'src/bootstrap/product/v2x-context-inspector.js': '',
  'src/rendering/v2x-convergence/living-domain-composition.js': '',
  'src/v2x-08-life-ecology-evolution-embodiment/model.js': '',
  'src/v2x-09-civilization-economy-city/core.js': '',
  'src/v2x-09-civilization-economy-city/production-network.js': '',
  'src/v2x-09-civilization-economy-city/society-dynamics.js': '',
  'src/domains/v1/individuals/runtime.js': '',
  'src/rendering/microscopic/matter-continuity-provider.js': '',
  'config/components/v2x-05-deep-planet-science.json': JSON.stringify({ components: [{ id: 'v2x05.deep-planet.provider' }] }),
  'config/components/v2x-living-product-composition.json': JSON.stringify({ components: [{ id: 'living', dependencies: ['v2x05.deep-planet.provider'] }] })
};

function fixture(overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ofu-p22-'));
  for (const [relativePath, content] of Object.entries({ ...files, ...overrides })) {
    const full = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

const clean = fixture();
const cleanReport = auditRepository(clean);
assert.equal(cleanReport.status, 'PASS');
assert.equal(cleanReport.findingCount, 0);
assert.equal(strictExitCode(cleanReport), 0);
assert.deepEqual(AUTHORITY_CLASSES, ['CANONICAL_PROVEN', 'DERIVED', 'MODEL_DERIVED_SIMULATION', 'PRESENTATION_ONLY', 'MEASURED_RUNTIME_EVIDENCE']);

const dirty = fixture({
  'src/bootstrap/product/v2x-context-inspector.js': "safeInt(source.localDensityPpm,0); detail('V2X-08 x',{Value:1}); if(data.civilization.supported) detail('V2X-09 x',{Value:1}); if(data.individuals.supported) detail('V2X-10 x',{Value:1}); panel.append(box);",
  'src/rendering/v2x-convergence/living-domain-composition.js': 'waterAreaPpm:Number(hydro.waterAreaPpm||0),iceAreaPpm:Number(hydro.iceFractionPpm??p.cryosphere?.iceCoverPpm??0),tectonicActivityPpm:Number(surface.tectonicActivityPpm??geological.upliftPpm??350000),volcanicActivityPpm:Number(geological.volcanicActivityPpm??interior.volcanismPpm??250000),erosionActivityPpm:Number(surface.erosionPotentialPpm??geological.weatheringPotentialPpm??300000),aridityPpm:Number(climate.aridityPpm??300000)',
  'src/v2x-08-life-ecology-evolution-embodiment/model.js': "profile.birthPpm ?? 30_000; profile.mortalityPpm ?? 20_000; profile.disturbanceMortalityPpm ?? 250_000; traitValue(lineage, 'fecundity', 500_000n); traitValue(lineage, 'resilience', 500_000n);",
  'src/v2x-09-civilization-economy-city/core.js': "function sourceAuthority(v){ return candidate || 'MODEL_DERIVED_SIMULATION'; }",
  'src/v2x-09-civilization-economy-city/production-network.js': "if(!matches.length)return freeze({conditionPpm:450000,degradationPpm:550000,evidenceClass:'TRADE_EDGE_WITHOUT_MODELED_INFRASTRUCTURE_ASSET',sourceInfrastructureIds:[]});",
  'src/v2x-09-civilization-economy-city/society-dynamics.js': "const legitimacy=clamp(polity.legitimacyPpm||0); const cohesion=clamp(polity.cohesionPpm||0); mechanisms.push('LEGITIMACY_AND_COHESION_RISK'); const transitionRisk=legitimacy<180000||cohesion<180000?'FRAGMENTATION_RISK':'BOUNDED_RESPONSE';",
  'src/domains/v1/individuals/runtime.js': "const householdSize = aggregate.householdSizeEstimate ? aggregate.householdSizeEstimate : 4; const rolePool = aggregate.roles ? aggregate.roles : ['resident']; const role=text(person.role ?? 'resident');",
  'src/rendering/microscopic/matter-continuity-provider.js': "positionAuthority:a.coordinateAuthority==='SOURCE_BACKED_ATOMIC_COORDINATE'?'SOURCE_BACKED_ATOMIC_COORDINATE':'MODEL_DERIVED_OR_PRESENTATION_COORDINATE'",
  'config/components/v2x-living-product-composition.json': JSON.stringify({ components: [{ id: 'living', dependencies: ['v2x12.matter.continuity'] }] })
});
const dirtyReport = auditRepository(dirty);
assert.equal(dirtyReport.status, 'FALSIFIED');
assert.equal(dirtyReport.findingCount, 9);
assert.deepEqual(dirtyReport.findings.map(item => item.id), ['P22-001','P22-002','P22-003','P22-004','P22-005','P22-006','P22-007','P22-008','P22-009']);
assert.equal(strictExitCode(dirtyReport), 1);

const authorityVisible = fixture({
  'src/bootstrap/product/v2x-context-inspector.js': "detail('V2X-08 x',{Authority:L.authority}); if(data.civilization.supported) detail('V2X-09 x',{Authority:C.authority}); if(data.individuals.supported) detail('V2X-10 x',{Authority:P.authority}); panel.append(box);"
});
assert.equal(auditRepository(authorityVisible).findings.some(item => item.id === 'P22-001'), false, 'displaying authority must clear the inspector finding');

const missing = fixture();
fs.unlinkSync(path.join(missing, 'src/v2x-09-civilization-economy-city/core.js'));
assert.throws(() => auditRepository(missing), /audit input missing/, 'audit must fail closed when a required source is absent');

for (const root of [clean, dirty, authorityVisible, missing]) fs.rmSync(root, { recursive: true, force: true });
console.log(JSON.stringify({ status: 'PASS', suite: 'v2-science-authority-oracle', checks: 8, dirtyFindingCount: dirtyReport.findingCount, strictDirtyExit: strictExitCode(dirtyReport), productionMutationPerformed: false }));

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const AUTHORITY_CLASSES = Object.freeze([
  'CANONICAL_PROVEN',
  'DERIVED',
  'MODEL_DERIVED_SIMULATION',
  'PRESENTATION_ONLY',
  'MEASURED_RUNTIME_EVIDENCE'
]);

export const BASE_CONTRACT = Object.freeze({
  sha: '2977c11a0ac97eba8fd7b6b7df9c958ea1a2d9a7',
  tree: '99e6b5ff6229d9c34d381e778c5689bf2367d256',
  launchStatus: 'FULL'
});

const PATHS = Object.freeze({
  inspector: 'src/bootstrap/product/v2x-context-inspector.js',
  livingComposition: 'src/rendering/v2x-convergence/living-domain-composition.js',
  lifeModel: 'src/v2x-08-life-ecology-evolution-embodiment/model.js',
  civilizationCore: 'src/v2x-09-civilization-economy-city/core.js',
  productionNetwork: 'src/v2x-09-civilization-economy-city/production-network.js',
  societyDynamics: 'src/v2x-09-civilization-economy-city/society-dynamics.js',
  individualRuntime: 'src/domains/v1/individuals/runtime.js',
  matterPresentation: 'src/rendering/microscopic/matter-continuity-provider.js',
  deepPlanetManifest: 'config/components/v2x-05-deep-planet-science.json',
  livingManifest: 'config/components/v2x-living-product-composition.json'
});

const REQUIRED = Object.freeze(Object.values(PATHS));
const squashed = value => String(value).replace(/\s+/g, '');

function readRequired(root, relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) throw new Error(`science authority audit input missing: ${relativePath}`);
  return fs.readFileSync(full, 'utf8');
}

function parseJson(text, relativePath) {
  try { return JSON.parse(text); }
  catch (error) { throw new Error(`science authority audit invalid JSON: ${relativePath}: ${error.message}`); }
}

function displaySection(source, startToken, endToken) {
  const start = source.indexOf(startToken);
  if (start < 0) return '';
  const end = source.indexOf(endToken, start + startToken.length);
  return source.slice(start, end < 0 ? source.length : end);
}

function sectionDisplaysAuthority(section) {
  return /\bAuthority\s*:/.test(section) || /\bauthorityClass\b/.test(section) || /\bauthority\s*:/.test(section);
}

function deepPlanetConsumerGap(deepText, livingText) {
  const deep = parseJson(deepText, PATHS.deepPlanetManifest);
  const living = parseJson(livingText, PATHS.livingManifest);
  const deepComponents = Array.isArray(deep.components) ? deep.components : [];
  const livingComponents = Array.isArray(living.components) ? living.components : [];
  const provider = deepComponents.find(component => component?.id === 'v2x05.deep-planet.provider');
  if (!provider) return true;
  const dependencies = livingComponents.flatMap(component => Array.isArray(component?.dependencies) ? component.dependencies : []);
  return !dependencies.some(value => String(value).startsWith('v2x05.deep-planet'));
}

function finding(id, severity, paths, mismatch, requiredCorrection, evidence) {
  return Object.freeze({ id, severity, paths: Object.freeze(paths), authorityMismatch: mismatch, requiredCorrection, evidence: Object.freeze(evidence) });
}

export function auditRepository(root = process.cwd()) {
  for (const relativePath of REQUIRED) readRequired(root, relativePath);
  const source = Object.fromEntries(Object.entries(PATHS).map(([key, relativePath]) => [key, readRequired(root, relativePath)]));
  const normalized = Object.fromEntries(Object.entries(source).map(([key, text]) => [key, squashed(text)]));
  const findings = [];

  const lifeUi = displaySection(source.inspector, "detail('V2X-08", 'if(data.civilization.supported)');
  const civUi = displaySection(source.inspector, "detail('V2X-09", 'if(data.individuals.supported)');
  const peopleUi = displaySection(source.inspector, "detail('V2X-10", 'panel.append(box)');
  const omittedAuthority = [lifeUi, civUi, peopleUi].some(section => section && !sectionDisplaysAuthority(section));
  const inspectorUnknownToZero = normalized.inspector.includes('safeInt(source.localDensityPpm,0)') || normalized.inspector.includes('safeInt(source.stressPpm,0)');
  if (omittedAuthority || inspectorUnknownToZero) findings.push(finding(
    'P22-001', 'HIGH', [PATHS.inspector],
    'Founder-facing model values are rendered without adjacent authority/assumption disclosure, while absent numeric context may be coerced to zero.',
    'Render authority/provenance/assumption state beside claim-bearing fields and preserve unknown numeric values instead of substituting zero.',
    [omittedAuthority ? 'one or more V2X-08/09/10 detail sections omit displayed authority' : null, inspectorUnknownToZero ? 'local density/stress uses zero fallback' : null].filter(Boolean)
  ));

  const surfaceFallbacks = [
    'waterAreaPpm:Number(hydro.waterAreaPpm||0)',
    'iceAreaPpm:Number(hydro.iceFractionPpm??p.cryosphere?.iceCoverPpm??0)',
    'tectonicActivityPpm:Number(surface.tectonicActivityPpm??geological.upliftPpm??350000)',
    'volcanicActivityPpm:Number(geological.volcanicActivityPpm??interior.volcanismPpm??250000)',
    'erosionActivityPpm:Number(surface.erosionPotentialPpm??geological.weatheringPotentialPpm??300000)',
    'aridityPpm:Number(climate.aridityPpm??300000)'
  ].filter(token => normalized.livingComposition.includes(token));
  if (surfaceFallbacks.length) findings.push(finding(
    'P22-002', 'HIGH', [PATHS.livingComposition],
    'Missing planetary evidence is converted into exact water/ice/geology/climate values that drive visible terrain and hydrology.',
    'Carry known/unknown/assumed state through the renderer seam; allow quantitative priors only when explicitly identified as scenario assumptions.',
    surfaceFallbacks
  ));

  const lifeDefaults = [
    'profile.birthPpm??30_000',
    'profile.mortalityPpm??20_000',
    'profile.disturbanceMortalityPpm??250_000',
    "traitValue(lineage,'fecundity',500_000n)",
    "traitValue(lineage,'resilience',500_000n)"
  ].filter(token => normalized.lifeModel.includes(token));
  if (lifeDefaults.length) findings.push(finding(
    'P22-003', 'HIGH', [PATHS.lifeModel],
    'Absent ecology/lifecycle parameters acquire universal-looking quantitative priors inside the simulation core.',
    'Require explicit scenario/profile inputs or attach explicit assumption provenance to every fallback before downstream claims are emitted.',
    lifeDefaults
  ));

  const routeFallback = normalized.productionNetwork.includes("if(!matches.length)returnfreeze({conditionPpm:450000,degradationPpm:550000,evidenceClass:'TRADE_EDGE_WITHOUT_MODELED_INFRASTRUCTURE_ASSET'");
  if (routeFallback) findings.push(finding(
    'P22-004', 'HIGH', [PATHS.productionNetwork],
    'A trade edge with no modeled infrastructure evidence receives exact condition and degradation values.',
    'Represent missing infrastructure condition as unresolved/interval-valued or as an explicitly declared scenario prior; do not feed fabricated precision into capacity/resilience.',
    ['conditionPpm=450000', 'degradationPpm=550000']
  ));

  const legitimacyFallback = normalized.societyDynamics.includes('constlegitimacy=clamp(polity.legitimacyPpm||0)') && normalized.societyDynamics.includes('constcohesion=clamp(polity.cohesionPpm||0)');
  const riskFromFallback = normalized.societyDynamics.includes("mechanisms.push('LEGITIMACY_AND_COHESION_RISK')") && normalized.societyDynamics.includes("?'FRAGMENTATION_RISK'");
  if (legitimacyFallback && riskFromFallback) findings.push(finding(
    'P22-005', 'HIGH', [PATHS.societyDynamics],
    'Missing legitimacy/cohesion is coerced to zero and can therefore generate risk/fragmentation claims from absent evidence.',
    'Propagate unknown legitimacy/cohesion and suppress dependent risk classification unless supplied or explicitly scenario-assumed.',
    ['legitimacyPpm||0', 'cohesionPpm||0', 'LEGITIMACY_AND_COHESION_RISK/FRAGMENTATION_RISK']
  ));

  const individualDefaults = [
    ':4;',
    ":[\'resident\'];",
    "person.role??'resident'"
  ].filter(token => normalized.individualRuntime.includes(token));
  const hasHouseholdEstimateBranch = normalized.individualRuntime.includes('aggregate.householdSizeEstimate') && normalized.individualRuntime.includes('consthouseholdSize=');
  if (hasHouseholdEstimateBranch && individualDefaults.length >= 2) findings.push(finding(
    'P22-006', 'HIGH', [PATHS.individualRuntime],
    'Absent household/role evidence is materialized as household size 4 and/or resident role, and the synthetic role can be retained across revisits.',
    'Default to explicit unknown/null or preserve an explicit scenario-assumption provenance envelope on the materialized and retained fields.',
    individualDefaults
  ));

  const failOpenAuthority = normalized.civilizationCore.includes("functionsourceAuthority(v){") && normalized.civilizationCore.includes("candidate||'MODEL_DERIVED_SIMULATION'");
  if (failOpenAuthority) findings.push(finding(
    'P22-007', 'MEDIUM_HIGH', [PATHS.civilizationCore],
    'Missing provenance is automatically upgraded to MODEL_DERIVED_SIMULATION.',
    'Fail closed as UNKNOWN/UNVERIFIED or reject missing authority; never grant a frozen scientific authority class because metadata is absent.',
    ["candidate || 'MODEL_DERIVED_SIMULATION'"]
  ));

  const hybridAuthority = normalized.matterPresentation.includes("positionAuthority:a.coordinateAuthority==='SOURCE_BACKED_ATOMIC_COORDINATE'?'SOURCE_BACKED_ATOMIC_COORDINATE':'MODEL_DERIVED_OR_PRESENTATION_COORDINATE'");
  if (hybridAuthority) findings.push(finding(
    'P22-008', 'MEDIUM', [PATHS.matterPresentation],
    'Atomic presentation merges model-derived and presentation-only position authority into a non-frozen hybrid token.',
    'Split scientific/model coordinate authority from display-coordinate authority using exact authority fields instead of a hybrid class.',
    ['MODEL_DERIVED_OR_PRESENTATION_COORDINATE']
  ));

  if (deepPlanetConsumerGap(source.deepPlanetManifest, source.livingManifest)) findings.push(finding(
    'P22-009', 'HIGH', [PATHS.deepPlanetManifest, PATHS.livingManifest],
    'V2X-05 deep-planet provider is in the shipping component manifest but has no demonstrated dependency in the central Living composition/inspector.',
    'Convergence must add an authorized Living consumer that retains V2X-05 provenance/uncertainty and then prove exact-artifact browser consequence.',
    ['v2x05.deep-planet.provider is provided', 'no v2x05.deep-planet dependency in v2x-living-product-composition']
  ));

  findings.sort((a, b) => a.id.localeCompare(b.id));
  return Object.freeze({
    schema: 'ofu-v2-science-authority-audit-1',
    base: BASE_CONTRACT,
    authorityClasses: AUTHORITY_CLASSES,
    status: findings.length ? 'FALSIFIED' : 'PASS',
    findingCount: findings.length,
    findings: Object.freeze(findings),
    productionMutationPerformed: false,
    exactArtifactBrowserEvidence: false
  });
}

export function strictExitCode(report) { return report.findingCount === 0 ? 0 : 1; }

function parseArgs(argv) {
  let root = process.cwd(), strict = false, json = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--strict') strict = true;
    else if (arg === '--json') json = true;
    else if (arg === '--root') { if (!argv[i + 1]) throw new Error('--root requires a path'); root = path.resolve(argv[++i]); }
    else throw new Error(`unknown argument: ${arg}`);
  }
  return { root, strict, json };
}

const direct = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  const options = parseArgs(process.argv.slice(2));
  const report = auditRepository(options.root);
  if (options.json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else process.stdout.write(`science-authority-audit status=${report.status} findings=${report.findingCount}\n${report.findings.map(item => `${item.id} ${item.severity} ${item.paths.join(',')}`).join('\n')}\n`);
  if (options.strict) process.exitCode = strictExitCode(report);
}

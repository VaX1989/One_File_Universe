import fs from 'node:fs';

const MODEL = 'src/v2x-08-life-ecology-evolution-embodiment/model.js';
const TEST = 'tests/v2x-08/life-ecology-evolution-embodiment.mjs';

function replaceOnce(source, from, to, label) {
  const first = source.indexOf(from);
  if (first < 0) throw new Error(`P22-003 repair stale source: missing ${label}`);
  if (source.indexOf(from, first + from.length) >= 0) throw new Error(`P22-003 repair ambiguous source: duplicate ${label}`);
  return source.slice(0, first) + to + source.slice(first + from.length);
}

let model = fs.readFileSync(MODEL, 'utf8');

model = replaceOnce(model,
`export const LIFE_V2_AUTHORITY = Object.freeze({
  class: 'MODEL_DERIVED_SIMULATION',
  abiogenesisStatus: 'NOT_MODELED',
  canonicalAlienBiology: false,
  persistentIndividualIdentity: false,
  temporalAuthority: 'P4_EXTERNAL_EVENT_ORDER',
});

export const LIFE_V2_LIMITS = Object.freeze({`,
`export const LIFE_V2_AUTHORITY = Object.freeze({
  class: 'MODEL_DERIVED_SIMULATION',
  abiogenesisStatus: 'NOT_MODELED',
  canonicalAlienBiology: false,
  persistentIndividualIdentity: false,
  temporalAuthority: 'P4_EXTERNAL_EVENT_ORDER',
});

export const LIFE_V2_SCENARIO_ASSUMPTIONS = Object.freeze({
  schema: 'ofu-v2x-08-life-scenario-assumptions-1',
  scenarioId: 'V2X08_BOUNDED_ECOLOGY_SCENARIO_V1',
  authority: 'MODEL_DERIVED_SIMULATION',
  assumptionClass: 'MODEL_ASSUMPTION_NOT_OBSERVATION',
  provenance: 'V2X-08 deterministic bounded ecology scenario prior; not measured, canonical, or universal biology.',
  rationale: 'Keeps explicitly model-derived scenario evolution operable when a caller omits optional ecology parameters while preserving assumption provenance.',
  uncertainty: 'UNQUANTIFIED_SCENARIO_PRIOR',
  limitations: Object.freeze([
    'Scenario priors are not observations and must not be promoted to canonical biology.',
    'Rates and trait priors are illustrative bounded model inputs, not universal life constants.',
    'Consumers must retain this assumption envelope when they expose derived demographic claims.',
  ]),
  values: Object.freeze({
    birthPpm: 30_000n,
    mortalityPpm: 20_000n,
    resourcePerBirth: 1n,
    nutrientPerBirth: 1n,
    maintenancePerIndividual: 1n,
    disturbanceMortalityPpm: 250_000n,
    juvenileMaturationPpm: 0n,
    matureSenescencePpm: 0n,
    fecundityPpm: 500_000n,
    resiliencePpm: 500_000n,
  }),
});

export const LIFE_V2_LIMITS = Object.freeze({`, 'authority insertion');

model = replaceOnce(model,
`function traitValue(lineage, key, fallback = 500_000n) {
  return lineage.traits.find((trait) => trait.key === key)?.valuePpm ?? fallback;
}
`,
`function scenarioProfilePpm(profile, key, assumptionsUsed) {
  if (profile[key] != null) return asPpm(profile[key], key);
  assumptionsUsed.add(\`profile.\${key}\`);
  return asPpm(LIFE_V2_SCENARIO_ASSUMPTIONS.values[key], \`\${key} scenario assumption\`);
}

function scenarioProfileInt(profile, key, assumptionsUsed, min = 0n) {
  if (profile[key] != null) return asInt(profile[key], key, min);
  assumptionsUsed.add(\`profile.\${key}\`);
  return asInt(LIFE_V2_SCENARIO_ASSUMPTIONS.values[key], \`\${key} scenario assumption\`, min);
}

function traitValue(lineage, key, assumptionsUsed) {
  const explicit = lineage.traits.find((trait) => trait.key === key);
  if (explicit) return explicit.valuePpm;
  const assumptionKey = key === 'fecundity' ? 'fecundityPpm' : key === 'resilience' ? 'resiliencePpm' : null;
  assert(assumptionKey, \`missing explicit trait \${key} without governed scenario assumption\`);
  assumptionsUsed.add(\`trait.\${key}\`);
  return LIFE_V2_SCENARIO_ASSUMPTIONS.values[assumptionKey];
}

function scenarioAssumptionEnvelope(assumptionsUsed) {
  const fields = Object.freeze([...assumptionsUsed].sort());
  if (fields.length === 0) return null;
  return Object.freeze({
    schema: LIFE_V2_SCENARIO_ASSUMPTIONS.schema,
    scenarioId: LIFE_V2_SCENARIO_ASSUMPTIONS.scenarioId,
    authority: LIFE_V2_SCENARIO_ASSUMPTIONS.authority,
    assumptionClass: LIFE_V2_SCENARIO_ASSUMPTIONS.assumptionClass,
    provenance: LIFE_V2_SCENARIO_ASSUMPTIONS.provenance,
    rationale: LIFE_V2_SCENARIO_ASSUMPTIONS.rationale,
    uncertainty: LIFE_V2_SCENARIO_ASSUMPTIONS.uncertainty,
    limitations: LIFE_V2_SCENARIO_ASSUMPTIONS.limitations,
    fields,
  });
}
`, 'trait fallback helper');

model = replaceOnce(model,
`  const profile = event.profile ?? {};

  const birthPpm = asPpm(profile.birthPpm ?? 30_000, 'birthPpm');
  const mortalityPpm = asPpm(profile.mortalityPpm ?? 20_000, 'mortalityPpm');
  const resourcePerBirth = asInt(profile.resourcePerBirth ?? 1, 'resourcePerBirth', 1n);
  const nutrientPerBirth = asInt(profile.nutrientPerBirth ?? 1, 'nutrientPerBirth', 1n);
  const maintenancePerIndividual = asInt(profile.maintenancePerIndividual ?? 1, 'maintenancePerIndividual', 0n);
  const disturbanceMortalityPpm = asPpm(profile.disturbanceMortalityPpm ?? 250_000, 'disturbanceMortalityPpm');
  const juvenileMaturationPpm = asPpm(profile.juvenileMaturationPpm ?? 0, 'juvenileMaturationPpm');
  const matureSenescencePpm = asPpm(profile.matureSenescencePpm ?? 0, 'matureSenescencePpm');
`,
`  const profile = event.profile ?? {};
  const assumptionsUsed = new Set();

  const birthPpm = scenarioProfilePpm(profile, 'birthPpm', assumptionsUsed);
  const mortalityPpm = scenarioProfilePpm(profile, 'mortalityPpm', assumptionsUsed);
  const resourcePerBirth = scenarioProfileInt(profile, 'resourcePerBirth', assumptionsUsed, 1n);
  const nutrientPerBirth = scenarioProfileInt(profile, 'nutrientPerBirth', assumptionsUsed, 1n);
  const maintenancePerIndividual = scenarioProfileInt(profile, 'maintenancePerIndividual', assumptionsUsed, 0n);
  const disturbanceMortalityPpm = scenarioProfilePpm(profile, 'disturbanceMortalityPpm', assumptionsUsed);
  const juvenileMaturationPpm = scenarioProfilePpm(profile, 'juvenileMaturationPpm', assumptionsUsed);
  const matureSenescencePpm = scenarioProfilePpm(profile, 'matureSenescencePpm', assumptionsUsed);
`, 'profile fallback block');

model = replaceOnce(model,
`      const fecundity = traitValue(lineage, 'fecundity', 500_000n);
      const resilience = traitValue(lineage, 'resilience', 500_000n);`,
`      const fecundity = traitValue(lineage, 'fecundity', assumptionsUsed);
      const resilience = traitValue(lineage, 'resilience', assumptionsUsed);`, 'trait call sites');

model = replaceOnce(model,
`    region.resourcePool = clamp(resourceAfterMaintenance - totalBirths * resourcePerBirth, 0n, MAX_INT);
    region.nutrientPool = clamp(region.nutrientPool - totalBirths * nutrientPerBirth, 0n, MAX_INT);
  }

  for (const population of state.populations) {`,
`    region.resourcePool = clamp(resourceAfterMaintenance - totalBirths * resourcePerBirth, 0n, MAX_INT);
    region.nutrientPool = clamp(region.nutrientPool - totalBirths * nutrientPerBirth, 0n, MAX_INT);
  }

  const scenarioAssumptions = scenarioAssumptionEnvelope(assumptionsUsed);

  for (const population of state.populations) {`, 'assumption envelope placement');

model = replaceOnce(model,
`      abundance: mutable.abundance,
      lifecycleStagePpm: mutable.lifecycleStagePpm,
    }));`,
`      abundance: mutable.abundance,
      lifecycleStagePpm: mutable.lifecycleStagePpm,
      authorityClass: LIFE_V2_AUTHORITY.class,
      scenarioAssumptions,
    }));`, 'diagnostic provenance');

model = replaceOnce(model,
`  return Object.freeze({ state: next, diagnostics: Object.freeze(diagnostics) });`,
`  return Object.freeze({ state: next, diagnostics: Object.freeze(diagnostics), scenarioAssumptions });`, 'advance result provenance');

for (const forbidden of [
  'profile.birthPpm ?? 30_000',
  'profile.mortalityPpm ?? 20_000',
  'profile.disturbanceMortalityPpm ?? 250_000',
  "traitValue(lineage, 'fecundity', 500_000n)",
  "traitValue(lineage, 'resilience', 500_000n)",
]) {
  if (model.includes(forbidden)) throw new Error(`P22-003 hidden fallback remained: ${forbidden}`);
}

fs.writeFileSync(MODEL, model);

let test = fs.readFileSync(TEST, 'utf8');
test = replaceOnce(test,
`  LIFE_V2_AUTHORITY,
  LIFE_V2_LIMITS,`,
`  LIFE_V2_AUTHORITY,
  LIFE_V2_LIMITS,
  LIFE_V2_SCENARIO_ASSUMPTIONS,`, 'test assumption import');

test = replaceOnce(test,
`const first = advanceEcology(base, event).state;`,
`equal(LIFE_V2_SCENARIO_ASSUMPTIONS.assumptionClass, 'MODEL_ASSUMPTION_NOT_OBSERVATION', 'scenario priors must be explicitly classified as assumptions, not observations');
const explicitOnly = advanceEcology(base, {
  ...event,
  eventKey: 'p4:explicit-only',
  profile: { ...event.profile, juvenileMaturationPpm: 0, matureSenescencePpm: 0 },
});
equal(explicitOnly.scenarioAssumptions, null, 'fully explicit profile and lineage traits must not manufacture an assumption envelope');

const assumptionFixture = createLifeState({
  eventKey: 'fixture:assumption-provenance',
  lineages: [{ id: 'lin-assumed', traits: [] }],
  populations: [{
    id: 'pop-assumed', lineageId: 'lin-assumed', regionId: 'r-assumed', abundance: 100,
    energyStore: 0, nutrientStore: 0,
    lifecycleStagePpm: { juvenile: 200_000, mature: 700_000, senescent: 100_000 },
  }],
  interactions: [],
  regions: { r-assumed: { resourcePool: 1000, nutrientPool: 1000, disturbancePpm: 0, opportunityPpm: PPM } },
});
const assumedAdvance = advanceEcology(assumptionFixture, { type: 'LIFE_ADVANCE', eventKey: 'p4:assumed' });
check(assumedAdvance.scenarioAssumptions?.assumptionClass === 'MODEL_ASSUMPTION_NOT_OBSERVATION', 'omitted ecology parameters must surface governed assumption authority');
check(assumedAdvance.scenarioAssumptions?.provenance.includes('not measured'), 'scenario assumption provenance must deny observational authority');
for (const field of [
  'profile.birthPpm', 'profile.mortalityPpm', 'profile.resourcePerBirth', 'profile.nutrientPerBirth',
  'profile.maintenancePerIndividual', 'profile.disturbanceMortalityPpm', 'profile.juvenileMaturationPpm',
  'profile.matureSenescencePpm', 'trait.fecundity', 'trait.resilience',
]) check(assumedAdvance.scenarioAssumptions.fields.includes(field), \`missing governed assumption witness for \${field}\`);
check(assumedAdvance.diagnostics.every((entry) => entry.scenarioAssumptions === assumedAdvance.scenarioAssumptions), 'downstream demographic diagnostics must retain the exact assumption envelope');

const first = advanceEcology(base, event).state;`, 'test provenance regression');

fs.writeFileSync(TEST, test);
console.log('P22-003 Life model repair applied with explicit governed scenario assumptions.');

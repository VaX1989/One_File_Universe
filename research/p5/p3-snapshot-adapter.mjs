export const P3_P5_SNAPSHOT_V0 = 'ofu-p3-p5-planetary-input-snapshot-v0';

const BULK_PRIORS = new Set(['TERRESTRIAL', 'VOLATILE_RICH', 'ICE_GIANT', 'GAS_GIANT']);

function assertObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be an object`);
}

function canonicalInt(value, name, min, max) {
  let exact;
  if (typeof value === 'bigint') exact=value;
  else if (Number.isSafeInteger(value)) exact=BigInt(value);
  else throw new Error(`${name} must be a canonical integer representation`);
  if (exact < BigInt(min) || exact > BigInt(max)) throw new Error(`${name} outside research adapter range`);
  const asNumber=Number(exact);
  if (!Number.isSafeInteger(asNumber)) throw new Error(`${name} cannot enter research Number view without precision loss`);
  return Object.freeze({source:value,exact,number:asNumber});
}

function opaqueId(value, name) {
  if (value instanceof Uint8Array) {
    if (value.length !== 32) throw new Error(`${name} must be 32 bytes`);
    return value;
  }
  if (typeof value === 'string' && value.length > 0 && value.length <= 256) return value;
  throw new Error(`${name} must be a 32-byte ID or research fixture string`);
}

export function identityKey(id) {
  if (id instanceof Uint8Array) return Array.from(id, b => b.toString(16).padStart(2, '0')).join('');
  return String(id);
}

export function adaptP3PlanetaryInputSnapshotV0(snapshot) {
  assertObject(snapshot, 'snapshot');
  if (snapshot.contractId !== P3_P5_SNAPSHOT_V0) throw new Error('unsupported P3->P5 snapshot contract');
  assertObject(snapshot.system, 'system');
  assertObject(snapshot.host, 'host');
  assertObject(snapshot.orbit, 'orbit');
  assertObject(snapshot.formation, 'formation');

  const planetId = opaqueId(snapshot.planetId, 'planetId');
  const systemId = opaqueId(snapshot.system.systemId, 'systemId');
  const starId = opaqueId(snapshot.host.starId, 'starId');
  const ageMyr = canonicalInt(snapshot.system.ageMyr, 'system.ageMyr', 0, 20000);
  const metallicityMilliDex = canonicalInt(snapshot.system.metallicityMilliDex, 'system.metallicityMilliDex', -5000, 5000);
  const massMilliSolar = canonicalInt(snapshot.host.massMilliSolar, 'host.massMilliSolar', 1, 500000);
  const temperatureK = canonicalInt(snapshot.host.temperatureK, 'host.temperatureK', 100, 1000000);
  const luminosityMilliSolar = canonicalInt(snapshot.host.luminosityMilliSolar, 'host.luminosityMilliSolar', 0, Number.MAX_SAFE_INTEGER);
  const orbitSlot = canonicalInt(snapshot.orbit.orbitSlot, 'orbit.orbitSlot', 0, 65535);
  const semiMajorAxisMicroAu = canonicalInt(snapshot.orbit.semiMajorAxisMicroAu, 'orbit.semiMajorAxisMicroAu', 1, Number.MAX_SAFE_INTEGER);
  const eccentricityPpm = canonicalInt(snapshot.orbit.eccentricityPpm, 'orbit.eccentricityPpm', 0, 999999);
  const inclinationMilliDeg = canonicalInt(snapshot.orbit.inclinationMilliDeg, 'orbit.inclinationMilliDeg', -360000, 360000);
  const insolationPpm = canonicalInt(snapshot.orbit.insolationPpm, 'orbit.insolationPpm', 0, Number.MAX_SAFE_INTEGER);
  const massMilliEarth = canonicalInt(snapshot.formation.massMilliEarth, 'formation.massMilliEarth', 1, Number.MAX_SAFE_INTEGER);
  const solidBudgetPermille = canonicalInt(snapshot.formation.protoplanetarySolidBudgetPermille, 'formation.protoplanetarySolidBudgetPermille', 0, Number.MAX_SAFE_INTEGER);
  if (!BULK_PRIORS.has(snapshot.formation.bulkPriorClass)) throw new Error('unsupported formation.bulkPriorClass');

  return Object.freeze({
    adapterVersion: 'p5-p3-snapshot-adapter-v0.1',
    sourceContractId: snapshot.contractId,
    sourceSchemaVersion: snapshot.p3SchemaVersion,
    identity: Object.freeze({ planetId, systemId, starId, planetKey: identityKey(planetId) }),
    upstreamBaseline: Object.freeze({
      system: Object.freeze({ ageMyr:ageMyr.source, metallicityMilliDex:metallicityMilliDex.source, planetArchitecture: snapshot.system.planetArchitecture }),
      host: Object.freeze({ massMilliSolar:massMilliSolar.source, evolutionaryClass: snapshot.host.evolutionaryClass, temperatureK:temperatureK.source, luminosityMilliSolar:luminosityMilliSolar.source }),
      orbit: Object.freeze({ orbitSlot:orbitSlot.source, orbitCenter: snapshot.orbit.orbitCenter, semiMajorAxisMicroAu:semiMajorAxisMicroAu.source, eccentricityPpm:eccentricityPpm.source, inclinationMilliDeg:inclinationMilliDeg.source, insolationPpm:insolationPpm.source }),
      formation: Object.freeze({ massMilliEarth:massMilliEarth.source, bulkPriorClass: snapshot.formation.bulkPriorClass, protoplanetarySolidBudgetPermille: solidBudgetPermille.source }),
    }),
    researchView: Object.freeze({
      systemAgeGyr: ageMyr.number / 1000,
      metallicityDex: metallicityMilliDex.number / 1000,
      stellarMassSolar: massMilliSolar.number / 1000,
      stellarLuminositySolar: luminosityMilliSolar.number / 1000,
      semiMajorAxisAu: semiMajorAxisMicroAu.number / 1e6,
      eccentricity: eccentricityPpm.number / 1e6,
      insolationEarth: insolationPpm.number / 1e6,
      baselineMassMilliEarth: massMilliEarth.number,
      baselineMassEarth: massMilliEarth.number / 1000,
      bulkPriorClass: snapshot.formation.bulkPriorClass,
      protoplanetarySolidBudgetPermille: solidBudgetPermille.number,
    }),
    authority: Object.freeze({
      p3Owned: Object.freeze(['planetId','systemId','starId','systemAge','metallicity','stellarState','orbit','insolation','baselineMass','bulkPriorClass','solidBudget']),
      p5MustNotReroll: true,
      baselineOnly: true,
    }),
  });
}

export function assertP3BaselinePreserved(snapshot, adapted) {
  const u = adapted.upstreamBaseline;
  return snapshot.planetId === adapted.identity.planetId &&
    snapshot.system.systemId === adapted.identity.systemId &&
    snapshot.host.starId === adapted.identity.starId &&
    snapshot.system.ageMyr === u.system.ageMyr &&
    snapshot.system.metallicityMilliDex === u.system.metallicityMilliDex &&
    snapshot.host.massMilliSolar === u.host.massMilliSolar &&
    snapshot.host.temperatureK === u.host.temperatureK &&
    snapshot.host.luminosityMilliSolar === u.host.luminosityMilliSolar &&
    snapshot.orbit.orbitSlot === u.orbit.orbitSlot &&
    snapshot.orbit.semiMajorAxisMicroAu === u.orbit.semiMajorAxisMicroAu &&
    snapshot.orbit.eccentricityPpm === u.orbit.eccentricityPpm &&
    snapshot.orbit.inclinationMilliDeg === u.orbit.inclinationMilliDeg &&
    snapshot.orbit.insolationPpm === u.orbit.insolationPpm &&
    snapshot.formation.massMilliEarth === u.formation.massMilliEarth &&
    snapshot.formation.bulkPriorClass === u.formation.bulkPriorClass &&
    snapshot.formation.protoplanetarySolidBudgetPermille === u.formation.protoplanetarySolidBudgetPermille;
}

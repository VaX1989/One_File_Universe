import { identityCommitment, householdId } from './identity.js';
import { deriveCulturalProfile } from '../culture/transmission.js';
import { selectLivingMembers } from '../demography/ledger.js';

const MAX_ACTIVE = 128;
const MAX_MEMORIES = 16;
const MAX_SOCIAL_TIES = 24;
const MAX_SKILLS = 16;
const MAX_STRING_CHARS = 4096;
const MAX_RETAINED_BYTES = 262144;
const MAX_PARAMETER_BYTES = 32768;
const MAX_DATA_NODES = 1024;
const MAX_DATA_DEPTH = 12;
const encoder = new TextEncoder();

function text(value, name, max = MAX_STRING_CHARS) {
  if (value === undefined || value === null) throw new TypeError(`${name} is required`);
  const result = String(value).normalize('NFC');
  if (!result.length || result.length > max) throw new RangeError(`${name} exceeds bounded text contract`);
  return result;
}

function deepBounded(value, name, maxBytes, { maxNodes = MAX_DATA_NODES, maxDepth = MAX_DATA_DEPTH } = {}) {
  const seen = new WeakSet();
  let nodes = 0;
  function walk(input, depth) {
    if (depth > maxDepth) throw new RangeError(`${name} exceeds depth bound`);
    nodes += 1;
    if (nodes > maxNodes) throw new RangeError(`${name} exceeds node bound`);
    if (input === null || typeof input === 'boolean') return input;
    if (typeof input === 'number') {
      if (!Number.isFinite(input)) throw new TypeError(`${name} contains non-finite number`);
      return Object.is(input, -0) ? 0 : input;
    }
    if (typeof input === 'string') return text(input, name);
    if (typeof input !== 'object') throw new TypeError(`${name} contains unsupported value`);
    if (seen.has(input)) throw new TypeError(`${name} must be acyclic`);
    seen.add(input);
    let output;
    if (Array.isArray(input)) {
      if (input.length > maxNodes) throw new RangeError(`${name} array exceeds bound`);
      output = input.map((item) => walk(item, depth + 1));
    } else {
      if (Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null) throw new TypeError(`${name} must contain plain data records`);
      const keys = Object.keys(input).sort();
      if (keys.length > maxNodes) throw new RangeError(`${name} object exceeds key bound`);
      output = {};
      for (const key of keys) {
        if (key.length > 256) throw new RangeError(`${name} key exceeds bound`);
        output[key] = walk(input[key], depth + 1);
      }
    }
    seen.delete(input);
    return output;
  }
  const copy = walk(value, 0);
  const serialized = JSON.stringify(copy);
  if (encoder.encode(serialized).length > maxBytes) throw new RangeError(`${name} exceeds byte budget`);
  function freeze(input) { if (input && typeof input === 'object') { for (const item of Object.values(input)) freeze(item); Object.freeze(input); } return input; }
  return freeze(copy);
}

function bounded(values, max, name = 'bounded collection') {
  if (!Array.isArray(values || [])) throw new TypeError(`${name} must be an array`);
  return Object.freeze((values || []).slice(-max).map((value) => deepBounded(value, name, MAX_RETAINED_BYTES)));
}

function deterministicInt(textValue, modulo) {
  let value = 2166136261 >>> 0;
  for (let i = 0; i < textValue.length; i += 1) value = Math.imul(value ^ textValue.charCodeAt(i), 16777619) >>> 0;
  return modulo ? value % modulo : value;
}

function sanitizeRetained(retained, expectedId) {
  if (!retained || retained.id !== expectedId) return null;
  const householdOrdinal = Number.isSafeInteger(retained.householdOrdinal) && retained.householdOrdinal >= 0 ? retained.householdOrdinal : null;
  const culture = retained.culture == null ? null : deepBounded(retained.culture, 'retained culture', MAX_RETAINED_BYTES);
  const lineage = retained.lineage == null ? null : deepBounded(retained.lineage, 'retained lineage', MAX_RETAINED_BYTES);
  const durable = Object.freeze({
    id: expectedId,
    householdOrdinal,
    role: retained.role == null ? null : text(retained.role, 'retained role', 256),
    skills: bounded(retained.skills, MAX_SKILLS, 'retained skills'),
    education: bounded(retained.education, MAX_SKILLS, 'retained education'),
    knowledge: bounded(retained.knowledge, MAX_SKILLS, 'retained knowledge'),
    socialTies: bounded(retained.socialTies, MAX_SOCIAL_TIES, 'retained social ties'),
    memories: bounded(retained.memories, MAX_MEMORIES, 'retained memories'),
    culture,
    lineage
  });
  if (encoder.encode(JSON.stringify(durable)).length > MAX_RETAINED_BYTES) throw new RangeError('retained state exceeds provider byte budget');
  return durable;
}

export function materializeIndividual({ worldId, settlementId, birthOrdinal, birthYear = null, cohortKey = null, currentYear = 0, aggregate = {}, retained = null } = {}) {
  const identity = identityCommitment({ worldId, settlementId, birthOrdinal, birthYear, cohortKey });
  const durable = sanitizeRetained(retained, identity.id);
  const householdSize = Number.isSafeInteger(aggregate.householdSizeEstimate) && aggregate.householdSizeEstimate > 0 ? Math.min(32, aggregate.householdSizeEstimate) : null;
  const householdOrdinal = durable?.householdOrdinal ?? (householdSize===null?null:Math.floor(birthOrdinal / householdSize));
  const rolePool = Array.isArray(aggregate.roles) && aggregate.roles.length ? aggregate.roles.slice(0, 128).map((role) => text(role, 'aggregate role', 256)) : Object.freeze([]);
  const role = durable?.role ?? (rolePool.length?rolePool[deterministicInt(identity.id, rolePool.length)]:null);
  const culture = durable?.culture || deriveCulturalProfile({
    settlementConventions: aggregate.cultureConventions || [],
    educationTopics: aggregate.educationTopics || [],
    seedTag: identity.id
  });
  if (!Number.isSafeInteger(currentYear) || currentYear < 0) throw new TypeError('currentYear must be a non-negative safe integer');
  if (Number.isSafeInteger(identity.birthYear) && currentYear < identity.birthYear) throw new RangeError('currentYear cannot precede birthYear');
  const age = Number.isSafeInteger(identity.birthYear) ? currentYear - identity.birthYear : null;
  return Object.freeze({
    schema: 'ofu-individual-2',
    ...identity,
    age,
    householdOrdinal,
    householdId: householdOrdinal===null?null:householdId({ worldId, settlementId, householdOrdinal }),
    householdAuthority: householdOrdinal===null?'UNKNOWN_WITHHELD_NO_GROUPING_EVIDENCE':'MODEL_DERIVED_GROUPING_NOT_KINSHIP',
    roleAuthority: role===null?'UNKNOWN_WITHHELD_NO_ROLE_EVIDENCE':'MODEL_DERIVED_FROM_AGGREGATE_OR_RETAINED',
    role,
    skills: durable?.skills || Object.freeze([]),
    education: durable?.education || Object.freeze([]),
    knowledge: durable?.knowledge || Object.freeze([]),
    socialTies: durable?.socialTies || Object.freeze([]),
    memories: durable?.memories || Object.freeze([]),
    culture,
    lineage: durable?.lineage || Object.freeze({ parentIds: Object.freeze([]), relations: Object.freeze([]), status: 'UNKNOWN_UNLESS_RETAINED' })
  });
}

export function refineIndividuals({ worldId, settlementId, aggregate, startOrdinal = 0, count = 1, retainedById = new Map(), currentYear = 0 } = {}) {
  if (!aggregate || !Number.isSafeInteger(aggregate.population) || aggregate.population < 0) throw new TypeError('aggregate.population must be a non-negative safe integer');
  if (!Number.isSafeInteger(startOrdinal) || startOrdinal < 0) throw new TypeError('startOrdinal must be non-negative');
  if (!Number.isSafeInteger(count) || count < 0) throw new TypeError('count must be non-negative');
  const addressableBirths = Number.isSafeInteger(aggregate.nextBirthOrdinal) ? aggregate.nextBirthOrdinal : aggregate.population;
  if (addressableBirths < aggregate.population) throw new RangeError('aggregate.nextBirthOrdinal cannot be below living population');
  const boundedCount = Math.min(count, MAX_ACTIVE, Math.max(0, addressableBirths - startOrdinal), aggregate.population);
  const people = [];
  for (let offset = 0; offset < boundedCount; offset += 1) {
    const birthOrdinal = startOrdinal + offset;
    const preview = identityCommitment({ worldId, settlementId, birthOrdinal, birthYear: aggregate.birthYears?.[birthOrdinal] ?? null });
    people.push(materializeIndividual({
      worldId,
      settlementId,
      birthOrdinal,
      birthYear: aggregate.birthYears?.[birthOrdinal] ?? null,
      currentYear,
      aggregate,
      retained: retainedById.get(preview.id) || null
    }));
  }
  return Object.freeze(people);
}

export function refinePopulation({ worldId, ledger, aggregate = {}, start = 0, count = 1, retainedById = new Map(), currentYear = ledger?.currentYear ?? 0 } = {}) {
  if (!ledger) throw new TypeError('ledger is required');
  const members = selectLivingMembers(ledger, { start, count: Math.min(count, MAX_ACTIVE) });
  return Object.freeze(members.map((member) => {
    const preview = identityCommitment({
      worldId,
      settlementId: ledger.settlementId,
      birthOrdinal: member.birthOrdinal,
      birthYear: member.birthYear,
      cohortKey: member.cohortKey
    });
    return materializeIndividual({
      worldId,
      settlementId: ledger.settlementId,
      birthOrdinal: member.birthOrdinal,
      birthYear: member.birthYear,
      cohortKey: member.cohortKey,
      currentYear,
      aggregate: { ...aggregate, population: ledger.population, nextBirthOrdinal: ledger.nextBirthOrdinal },
      retained: retainedById.get(preview.id) || null
    });
  }));
}

export function retainIndividual(person) {
  const retained = Object.freeze({
    id: text(person.id, 'person.id', 256),
    householdOrdinal: Number.isSafeInteger(person.householdOrdinal) && person.householdOrdinal >= 0 ? person.householdOrdinal : null,
    role: person.role == null ? null : text(person.role, 'person.role', 256),
    skills: bounded(person.skills, MAX_SKILLS, 'skills'),
    education: bounded(person.education, MAX_SKILLS, 'education'),
    knowledge: bounded(person.knowledge, MAX_SKILLS, 'knowledge'),
    socialTies: bounded(person.socialTies, MAX_SOCIAL_TIES, 'social ties'),
    memories: bounded(person.memories, MAX_MEMORIES, 'memories'),
    culture: deepBounded(person.culture || {}, 'culture', MAX_RETAINED_BYTES),
    lineage: deepBounded(person.lineage || { parentIds: [], relations: [], status: 'UNKNOWN_UNLESS_RETAINED' }, 'lineage', MAX_RETAINED_BYTES)
  });
  if (encoder.encode(JSON.stringify(retained)).length > MAX_RETAINED_BYTES) throw new RangeError('retained state exceeds provider byte budget');
  return retained;
}

export function appendHistoryRef(person, ref) {
  if (!ref || !ref.eventId || !ref.provenance) throw new TypeError('history ref requires eventId and provenance');
  return Object.freeze({
    ...person,
    memories: bounded([...person.memories, {
      eventId: text(ref.eventId, 'history eventId'),
      provenance: text(ref.provenance, 'history provenance', 256),
      kind: text(ref.kind || 'OBSERVED', 'history kind', 128)
    }], MAX_MEMORIES, 'memories')
  });
}

export function proposeIndividualAction(person, proposal) {
  if (!person?.id) throw new TypeError('person.id is required');
  if (!proposal || !proposal.kind) throw new TypeError('proposal.kind is required');
  return Object.freeze({
    schema: 'ofu-individual-action-proposal-1',
    authority: 'PROPOSAL_ONLY_REQUIRES_P4_ADMISSION',
    actorId: text(person.id, 'person.id', 256),
    kind: text(proposal.kind, 'proposal.kind', 128),
    targetId: proposal.targetId == null ? null : text(proposal.targetId, 'proposal.targetId', 256),
    parameters: deepBounded(proposal.parameters || {}, 'proposal.parameters', MAX_PARAMETER_BYTES)
  });
}

export const INDIVIDUAL_LIMITS = Object.freeze({ MAX_ACTIVE, MAX_MEMORIES, MAX_SOCIAL_TIES, MAX_SKILLS, MAX_STRING_CHARS, MAX_RETAINED_BYTES, MAX_PARAMETER_BYTES, MAX_DATA_NODES, MAX_DATA_DEPTH });

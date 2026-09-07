import { identityCommitment, householdId } from './identity.js';
import { deriveCulturalProfile } from '../culture/transmission.js';

const MAX_ACTIVE = 128;
const MAX_MEMORIES = 16;
const MAX_SOCIAL_TIES = 24;
const MAX_SKILLS = 16;

function bounded(values, max) {
  return Object.freeze((values || []).slice(-max).map((value) => Object.freeze({ ...value })));
}

function deterministicInt(text, modulo) {
  let value = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) value = Math.imul(value ^ text.charCodeAt(i), 16777619) >>> 0;
  return modulo ? value % modulo : value;
}

export function materializeIndividual({ worldId, settlementId, birthOrdinal, birthYear = null, currentYear = 0, aggregate = {}, retained = null } = {}) {
  const identity = identityCommitment({ worldId, settlementId, birthOrdinal, birthYear });
  const durable = retained && retained.id === identity.id ? retained : null;
  const householdOrdinal = durable?.householdOrdinal ?? Math.floor(birthOrdinal / 4);
  const rolePool = aggregate.roles?.length ? aggregate.roles : ['resident'];
  const role = durable?.role || String(rolePool[deterministicInt(identity.id, rolePool.length)]);
  const culture = durable?.culture || deriveCulturalProfile({
    settlementConventions: aggregate.cultureConventions || [],
    educationTopics: aggregate.educationTopics || [],
    seedTag: identity.id
  });
  const age = Number.isInteger(identity.birthYear) ? Math.max(0, currentYear - identity.birthYear) : null;
  return Object.freeze({
    schema: 'ofu-individual-1',
    ...identity,
    age,
    householdOrdinal,
    householdId: householdId({ worldId, settlementId, householdOrdinal }),
    role,
    skills: durable?.skills || Object.freeze([]),
    education: durable?.education || Object.freeze([]),
    knowledge: durable?.knowledge || Object.freeze([]),
    socialTies: durable?.socialTies || Object.freeze([]),
    memories: durable?.memories || Object.freeze([]),
    culture,
    lineage: durable?.lineage || Object.freeze({ parentIds: Object.freeze([]), status: 'UNKNOWN_UNLESS_RETAINED' })
  });
}

export function refineIndividuals({ worldId, settlementId, aggregate, startOrdinal = 0, count = 1, retainedById = new Map(), currentYear = 0 } = {}) {
  if (!aggregate || !Number.isInteger(aggregate.population) || aggregate.population < 0) throw new TypeError('aggregate.population must be a non-negative integer');
  if (!Number.isInteger(startOrdinal) || startOrdinal < 0) throw new TypeError('startOrdinal must be non-negative');
  if (!Number.isInteger(count) || count < 0) throw new TypeError('count must be non-negative');
  const boundedCount = Math.min(count, MAX_ACTIVE, Math.max(0, aggregate.population - startOrdinal));
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

export function retainIndividual(person) {
  return Object.freeze({
    id: person.id,
    householdOrdinal: person.householdOrdinal,
    role: person.role,
    skills: bounded(person.skills, MAX_SKILLS),
    education: bounded(person.education, MAX_SKILLS),
    knowledge: bounded(person.knowledge, MAX_SKILLS),
    socialTies: bounded(person.socialTies, MAX_SOCIAL_TIES),
    memories: bounded(person.memories, MAX_MEMORIES),
    culture: person.culture,
    lineage: person.lineage
  });
}

export function appendHistoryRef(person, ref) {
  if (!ref || !ref.eventId || !ref.provenance) throw new TypeError('history ref requires eventId and provenance');
  return Object.freeze({
    ...person,
    memories: bounded([...person.memories, { eventId: String(ref.eventId), provenance: String(ref.provenance), kind: String(ref.kind || 'OBSERVED') }], MAX_MEMORIES)
  });
}

export function proposeIndividualAction(person, proposal) {
  if (!proposal || !proposal.kind) throw new TypeError('proposal.kind is required');
  return Object.freeze({
    schema: 'ofu-individual-action-proposal-1',
    authority: 'PROPOSAL_ONLY_REQUIRES_P4_ADMISSION',
    actorId: person.id,
    kind: String(proposal.kind),
    targetId: proposal.targetId == null ? null : String(proposal.targetId),
    parameters: Object.freeze({ ...(proposal.parameters || {}) })
  });
}

export const INDIVIDUAL_LIMITS = Object.freeze({ MAX_ACTIVE, MAX_MEMORIES, MAX_SOCIAL_TIES, MAX_SKILLS });

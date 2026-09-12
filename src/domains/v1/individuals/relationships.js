const MAX_RELATIONS = 16;
const MAX_TEXT_CHARS = 4096;
const ALLOWED_RELATIONS = new Set(['PARENT', 'CHILD', 'SIBLING', 'PARTNER', 'GUARDIAN']);
const ALLOWED_PROVENANCE = new Set(['ADMITTED_HISTORY_REF', 'MODEL_DERIVED_SIMULATION']);

function text(value, name, max = MAX_TEXT_CHARS) {
  if (value === undefined || value === null || value === '') throw new TypeError(`${name} is required`);
  const result = String(value).normalize('NFC');
  if (result.length > max) throw new RangeError(`${name} exceeds bounded text contract`);
  return result;
}
function compareText(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
function relationKey(relation, personId) { return JSON.stringify([relation, personId]); }
function freezeRelation(value) {
  return Object.freeze({ relation: value.relation, personId: value.personId, provenance: value.provenance, sourceRef: value.sourceRef });
}

export function recordKinship(person, { relation, personId, provenance, sourceRef } = {}) {
  const normalizedRelation = String(relation || '').toUpperCase();
  if (!ALLOWED_RELATIONS.has(normalizedRelation)) throw new TypeError('unsupported kinship relation');
  const normalizedPersonId = text(personId, 'kinship personId', 256);
  if (normalizedPersonId === person.id) throw new TypeError('kinship requires a distinct personId');
  if (!ALLOWED_PROVENANCE.has(provenance)) throw new TypeError('kinship requires explicit admitted/model provenance');
  const normalizedSourceRef = text(sourceRef, 'kinship sourceRef');
  const previous = person.lineage?.relations || [];
  const keyed = new Map(previous.map((entry) => [relationKey(entry.relation, entry.personId), entry]));
  keyed.set(relationKey(normalizedRelation, normalizedPersonId), freezeRelation({ relation: normalizedRelation, personId: normalizedPersonId, provenance, sourceRef: normalizedSourceRef }));
  const relations = Object.freeze([...keyed.values()].sort((a, b) => compareText(a.relation, b.relation) || compareText(a.personId, b.personId)).slice(0, MAX_RELATIONS));
  const parentIds = Object.freeze(relations.filter((entry) => entry.relation === 'PARENT').map((entry) => entry.personId));
  return Object.freeze({ ...person, lineage: Object.freeze({ status: relations.length ? 'RETAINED_STRUCTURED_RELATIONS' : 'UNKNOWN_UNLESS_RETAINED', parentIds, relations }) });
}

export const RELATION_LIMITS = Object.freeze({ MAX_RELATIONS, MAX_TEXT_CHARS });

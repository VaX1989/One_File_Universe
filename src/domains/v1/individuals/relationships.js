const MAX_RELATIONS = 16;
const ALLOWED_RELATIONS = new Set(['PARENT', 'CHILD', 'SIBLING', 'PARTNER', 'GUARDIAN']);
const ALLOWED_PROVENANCE = new Set(['ADMITTED_HISTORY_REF', 'MODEL_DERIVED_SIMULATION']);

function freezeRelation(value) {
  return Object.freeze({ relation: value.relation, personId: value.personId, provenance: value.provenance, sourceRef: value.sourceRef });
}

export function recordKinship(person, { relation, personId, provenance, sourceRef } = {}) {
  const normalizedRelation = String(relation || '').toUpperCase();
  if (!ALLOWED_RELATIONS.has(normalizedRelation)) throw new TypeError('unsupported kinship relation');
  if (!personId || personId === person.id) throw new TypeError('kinship requires a distinct personId');
  if (!ALLOWED_PROVENANCE.has(provenance)) throw new TypeError('kinship requires explicit admitted/model provenance');
  if (!sourceRef) throw new TypeError('kinship requires a sourceRef');
  const previous = person.lineage?.relations || [];
  const keyed = new Map(previous.map((entry) => [`${entry.relation}|${entry.personId}`, entry]));
  keyed.set(`${normalizedRelation}|${personId}`, freezeRelation({ relation: normalizedRelation, personId: String(personId), provenance, sourceRef: String(sourceRef) }));
  const relations = Object.freeze([...keyed.values()].sort((a, b) => a.relation.localeCompare(b.relation) || a.personId.localeCompare(b.personId)).slice(0, MAX_RELATIONS));
  const parentIds = Object.freeze(relations.filter((entry) => entry.relation === 'PARENT').map((entry) => entry.personId));
  return Object.freeze({ ...person, lineage: Object.freeze({ status: relations.length ? 'RETAINED_STRUCTURED_RELATIONS' : 'UNKNOWN_UNLESS_RETAINED', parentIds, relations }) });
}

export const RELATION_LIMITS = Object.freeze({ MAX_RELATIONS });

const MAX_RECORDS_PER_KIND = 16;
const ALLOWED_KINDS = new Set(['SKILL', 'EDUCATION', 'KNOWLEDGE_EXPOSURE', 'SOCIAL_TIE']);

function normalizeRecord(record) {
  const kind = String(record?.kind || '').toUpperCase();
  if (!ALLOWED_KINDS.has(kind)) throw new TypeError('unsupported learning/social record kind');
  if (!record.topic) throw new TypeError('record.topic is required');
  if (!record.provenance || !record.sourceRef) throw new TypeError('record requires provenance and sourceRef');
  return Object.freeze({
    kind,
    topic: String(record.topic),
    level: Number.isFinite(record.level) ? Math.max(0, Math.min(1, Number(record.level))) : null,
    provenance: String(record.provenance),
    sourceRef: String(record.sourceRef)
  });
}

function appendUnique(list, record) {
  const key = `${record.kind}|${record.topic}|${record.sourceRef}`;
  const filtered = (list || []).filter((entry) => `${entry.kind}|${entry.topic}|${entry.sourceRef}` !== key);
  return Object.freeze([...filtered, record].slice(-MAX_RECORDS_PER_KIND));
}

export function recordStructuredExposure(person, input) {
  const record = normalizeRecord(input);
  const field = record.kind === 'SKILL' ? 'skills' : record.kind === 'EDUCATION' ? 'education' : record.kind === 'SOCIAL_TIE' ? 'socialTies' : 'knowledge';
  return Object.freeze({ ...person, [field]: appendUnique(person[field], record) });
}

export const LEARNING_LIMITS = Object.freeze({ MAX_RECORDS_PER_KIND, semantics: 'observable-structured-exposure-or-competency-not-private-mental-state' });

const MAX_RECORDS_PER_KIND = 16;
const MAX_TEXT_CHARS = 4096;
const ALLOWED_KINDS = new Set(['SKILL', 'EDUCATION', 'KNOWLEDGE_EXPOSURE', 'SOCIAL_TIE']);

function text(value, name, max = MAX_TEXT_CHARS) {
  if (value === undefined || value === null || value === '') throw new TypeError(`${name} is required`);
  const result = String(value).normalize('NFC');
  if (result.length > max) throw new RangeError(`${name} exceeds bounded text contract`);
  return result;
}

function normalizeRecord(record) {
  const kind = String(record?.kind || '').toUpperCase();
  if (!ALLOWED_KINDS.has(kind)) throw new TypeError('unsupported learning/social record kind');
  return Object.freeze({
    kind,
    topic: text(record.topic, 'record.topic'),
    level: Number.isFinite(record.level) ? Math.max(0, Math.min(1, Number(record.level))) : null,
    provenance: text(record.provenance, 'record.provenance', 256),
    sourceRef: text(record.sourceRef, 'record.sourceRef')
  });
}

function tupleKey(record) {
  return JSON.stringify([record.kind, record.topic, record.sourceRef]);
}

function appendUnique(list, record) {
  const key = tupleKey(record);
  const filtered = (list || []).filter((entry) => tupleKey(entry) !== key);
  return Object.freeze([...filtered, record].slice(-MAX_RECORDS_PER_KIND));
}

export function recordStructuredExposure(person, input) {
  const record = normalizeRecord(input);
  const field = record.kind === 'SKILL' ? 'skills' : record.kind === 'EDUCATION' ? 'education' : record.kind === 'SOCIAL_TIE' ? 'socialTies' : 'knowledge';
  return Object.freeze({ ...person, [field]: appendUnique(person[field], record) });
}

export const LEARNING_LIMITS = Object.freeze({ MAX_RECORDS_PER_KIND, MAX_TEXT_CHARS, semantics: 'observable-structured-exposure-or-competency-not-private-mental-state' });

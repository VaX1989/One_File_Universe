const MAX_CONVENTIONS = 16;
const MAX_KNOWLEDGE = 24;
const MAX_TEXT_CHARS = 4096;

function boundedText(value, name) {
  const result = String(value).normalize('NFC');
  if (!result.length) throw new TypeError(`${name} cannot be empty`);
  if (result.length > MAX_TEXT_CHARS) throw new RangeError(`${name} exceeds bounded text contract`);
  return result;
}

function compareText(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
function boundedUnique(values, max, name) {
  return Object.freeze([...new Set((values || []).map((value) => boundedText(value, name)))].sort(compareText).slice(0, max));
}

export function deriveCulturalProfile({ settlementConventions = [], householdConventions = [], educationTopics = [], seedTag = '' } = {}) {
  const conventions = boundedUnique([...settlementConventions, ...householdConventions], MAX_CONVENTIONS, 'culture convention');
  const knowledge = boundedUnique(educationTopics, MAX_KNOWLEDGE, 'culture knowledge');
  const boundedSeed = String(seedTag).normalize('NFC');
  if (boundedSeed.length > MAX_TEXT_CHARS) throw new RangeError('culture seedTag exceeds bounded text contract');
  return Object.freeze({
    authority: 'MODEL_DERIVED_SIMULATION',
    semantics: 'structured-conventions-not-real-language-or-belief-truth',
    seedTag: boundedSeed,
    conventions,
    knowledge
  });
}

export function transmitConventions(profile, exposures = []) {
  return Object.freeze({
    ...profile,
    conventions: boundedUnique([...profile.conventions, ...exposures], MAX_CONVENTIONS, 'culture convention')
  });
}

export const CULTURE_LIMITS = Object.freeze({ MAX_CONVENTIONS, MAX_KNOWLEDGE, MAX_TEXT_CHARS });

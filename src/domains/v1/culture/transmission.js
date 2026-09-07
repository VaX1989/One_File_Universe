const MAX_CONVENTIONS = 16;
const MAX_KNOWLEDGE = 24;

function boundedUnique(values, max) {
  return Object.freeze([...new Set((values || []).map(String))].sort().slice(0, max));
}

export function deriveCulturalProfile({ settlementConventions = [], householdConventions = [], educationTopics = [], seedTag = '' } = {}) {
  const conventions = boundedUnique([...settlementConventions, ...householdConventions], MAX_CONVENTIONS);
  const knowledge = boundedUnique(educationTopics, MAX_KNOWLEDGE);
  return Object.freeze({
    authority: 'MODEL_DERIVED_SIMULATION',
    semantics: 'structured-conventions-not-real-language-or-belief-truth',
    seedTag: String(seedTag),
    conventions,
    knowledge
  });
}

export function transmitConventions(profile, exposures = []) {
  return Object.freeze({
    ...profile,
    conventions: boundedUnique([...profile.conventions, ...exposures], MAX_CONVENTIONS)
  });
}

export const CULTURE_LIMITS = Object.freeze({ MAX_CONVENTIONS, MAX_KNOWLEDGE });

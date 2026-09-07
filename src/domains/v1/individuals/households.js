const MAX_ACTIVE_HOUSEHOLDS = 128;

export function refineHouseholds(people = []) {
  const grouped = new Map();
  for (const person of people) {
    if (!grouped.has(person.householdId)) grouped.set(person.householdId, []);
    grouped.get(person.householdId).push(person.id);
  }
  return Object.freeze([...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, MAX_ACTIVE_HOUSEHOLDS)
    .map(([id, memberIds]) => Object.freeze({
      id,
      authority: 'MODEL_DERIVED_GROUPING_NOT_KINSHIP',
      kinshipStatus: 'UNKNOWN_UNLESS_RETAINED',
      activeMemberIds: Object.freeze([...memberIds].sort())
    })));
}

export const HOUSEHOLD_LIMITS = Object.freeze({ MAX_ACTIVE_HOUSEHOLDS });

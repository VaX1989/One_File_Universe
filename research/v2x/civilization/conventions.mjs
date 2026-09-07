import { addSafe, asciiCompare, assertRecord, boundedArray, mulDivFloor, nonNegativeInt, ppm, stableFingerprint64, sumSafe, uniqueIds } from '../reference/bounded-math.mjs';
import { CIV_AUTHORITY, CIV_LIMITS } from './production.mjs';

export function conventionTick(groups, policy) {
  boundedArray(groups, 'groups', CIV_LIMITS.conventions);
  uniqueIds(groups, 'groups');
  assertRecord(policy, 'policy');
  const adoption = ppm(policy.adoptionPpm ?? 0);
  const innovation = ppm(policy.innovationPpm ?? 0);
  const epoch = nonNegativeInt(policy.epoch ?? 0, 'policy.epoch', 1_000_000_000);
  const total = sumSafe(groups.map((g) => nonNegativeInt(g.count, 'count', CIV_LIMITS.maxStock)), 'conventionTotal');
  if (total === 0) return Object.freeze([]);
  const majority = [...groups].sort((a, b) => b.count - a.count || asciiCompare(a.id, b.id))[0];
  return Object.freeze(groups.map((g) => {
    const fingerprint64 = stableFingerprint64([g.id, String(epoch), String(adoption), String(innovation), 'convention-policy-v2'], 'conventionInnovation', 128);
    const draw = Number.parseInt(fingerprint64.slice(-8), 16) % 1_000_000;
    return Object.freeze({
      ...g,
      adoptionPressureCount: g.id === majority.id ? 0 : mulDivFloor(g.count, adoption, 1_000_000),
      innovationToken: draw < innovation ? `conv:${fingerprint64}` : null,
      authority: CIV_AUTHORITY,
      grammarClaim: false,
      psychologyClaim: false,
      innovationIdentityClaim: 'RESEARCH_NONCANONICAL_64_BIT_FINGERPRINT'
    });
  }));
}

export function applyConventionFlows(groups, flows) {
  boundedArray(groups, 'groups', CIV_LIMITS.conventions);
  boundedArray(flows, 'flows', 256);
  const ids = uniqueIds(groups, 'groups');
  const opening = new Map(groups.map((g) => [g.id, nonNegativeInt(g.count, 'count', CIV_LIMITS.maxStock)]));
  const out = new Map(groups.map((g) => [g.id, 0]));
  const delta = new Map(groups.map((g) => [g.id, 0]));
  for (const f of flows) {
    assertRecord(f, 'flow');
    if (!ids.has(f.from) || !ids.has(f.to) || f.from === f.to) throw new Error('invalid convention flow');
    const share = ppm(f.flowPpm);
    const nextShare = addSafe(out.get(f.from), share, `flowShare.${f.from}`);
    if (nextShare > 1_000_000) throw new Error(`convention flows overcommit source ${f.from}`);
    out.set(f.from, nextShare);
    const moved = mulDivFloor(opening.get(f.from), share, 1_000_000);
    delta.set(f.from, addSafe(delta.get(f.from), -moved, `delta.${f.from}`));
    delta.set(f.to, addSafe(delta.get(f.to), moved, `delta.${f.to}`));
  }
  const openingTotal = sumSafe([...opening.values()], 'openingConventionTotal');
  const result = groups.map((g) => {
    const count = addSafe(opening.get(g.id), delta.get(g.id), `closingConvention.${g.id}`);
    nonNegativeInt(count, `closingConvention.${g.id}`, CIV_LIMITS.maxStock);
    return Object.freeze({ ...g, count, authority: CIV_AUTHORITY, grammarClaim: false, psychologyClaim: false });
  });
  const closingTotal = sumSafe(result.map((g) => g.count), 'closingConventionTotal');
  if (openingTotal !== closingTotal) throw new Error('convention conservation failed');
  return Object.freeze({ authority: CIV_AUTHORITY, groups: Object.freeze(result), evidence: Object.freeze({ openingTotal, closingTotal }), grammarClaim: false, psychologyClaim: false });
}

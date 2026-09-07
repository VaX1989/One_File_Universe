import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validatePaths, validateMatrixShape } from '../../tools/validate-v2x-ownership.mjs';

const matrix = JSON.parse(fs.readFileSync(new URL('../../docs/parallel/V2X_OWNERSHIP_MATRIX.json', import.meta.url), 'utf8'));
assert.deepEqual(validateMatrixShape(matrix), []);

function expectValid(paths, lane = 'V2X-00', m = matrix) {
  const result = validatePaths(m, lane, paths);
  assert.equal(result.valid, true, JSON.stringify(result, null, 2));
}
function expectCode(paths, code, lane = 'V2X-00', m = matrix) {
  const result = validatePaths(m, lane, paths);
  assert.equal(result.valid, false, 'expected validation failure');
  assert.ok(result.violations.some((v) => v.code === code), JSON.stringify(result, null, 2));
}

expectValid(['docs/parallel/V2X_CAPABILITY_REGISTRY.json']);
expectValid(['docs/parallel/SUPER_PARALLEL_BASE_2026-09-07.json']);
expectValid(['tools/validate-v2x-ownership.mjs','tests/governance/v2x-ownership-validator.mjs']);
expectCode(['src/rendering/v1/living-renderer.js'], 'CONVERGENCE_OWNER_ONLY');
expectCode(['src/ui/app/v1/living-universe.js'], 'CONVERGENCE_OWNER_ONLY');
expectCode(['tools/build-p1.mjs'], 'CONVERGENCE_OWNER_ONLY');
expectCode(['.github/workflows/foundation.yml'], 'CONVERGENCE_OWNER_ONLY');
expectCode(['config/components/product.json'], 'CONVERGENCE_OWNER_ONLY');
expectCode(['config/components/v2x-unbound.json'], 'NOT_ALLOWED');
expectCode(['docs/parallel/../../tools/build-p1.mjs'], 'INVALID_PATH');
expectCode(['/etc/passwd'], 'INVALID_PATH');
expectCode(['docs\\parallel\\V2X_GAP_REGISTRY.json'], 'INVALID_PATH');
expectCode(['docs/parallel/V2X_GAP_REGISTRY.json'], 'UNKNOWN_LANE', 'V2X-UNKNOWN');

const future = structuredClone(matrix);
future.writerLanesAuthorized = true;
future.lanes['V2X-A'] = {
  laneClass: 'DOWNSTREAM', writerAuthorized: true,
  allowedPatterns: ['src/v2x-a/**','config/components/v2x-a.json'],
  authorityExceptions: [], reservedPatterns: ['src/v2x-a/**','config/components/v2x-a.json']
};
future.lanes['V2X-B'] = {
  laneClass: 'DOWNSTREAM', writerAuthorized: true,
  allowedPatterns: ['src/v2x-b/**','config/components/v2x-b.json'],
  authorityExceptions: [], reservedPatterns: ['src/v2x-b/**','config/components/v2x-b.json']
};
assert.deepEqual(validateMatrixShape(future), []);
expectValid(['src/v2x-a/provider.js','config/components/v2x-a.json'], 'V2X-A', future);
expectCode(['src/v2x-b/provider.js'], 'NOT_ALLOWED', 'V2X-A', future);
expectCode(['config/components/v2x-b.json'], 'NOT_ALLOWED', 'V2X-A', future);

const badGrant = structuredClone(future);
badGrant.lanes['V2X-A'].allowedPatterns.push('config/components/*.json');
assert.ok(validateMatrixShape(badGrant).some((e) => e.includes('component descriptor grants must be exact filenames')));

console.log('V2X ownership validator adversarial suite: PASS');

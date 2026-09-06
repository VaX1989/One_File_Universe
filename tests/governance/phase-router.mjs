import assert from 'node:assert/strict';
import {normalizeChangedPaths,PHASE_ROUTER_LIMITS,routeHistoricalPhases} from '../../tools/ci/phase-router.mjs';

const all=['P1','P2','P3','P4','P5','P6'];
let cases=0;
const route=(changedPaths,baseRef='development/v1.1-quality-exploration')=>routeHistoricalPhases({baseRef,changedPaths});
const expectPhases=(paths,expected,earliest=expected[0]??null)=>{const result=route(paths);assert.deepEqual(result.requiredHistoricalPhases,expected);assert.equal(result.earliestHistoricalPhase,earliest);assert.equal(result.postV1,true);cases++;return result;};

// Promotion to main is always cumulative regardless of the changed surface.
{
  const result=route(['src/rendering/living-scene.js'],'main');
  assert.equal(result.mode,'CUMULATIVE');assert.deepEqual(result.requiredHistoricalPhases,all);assert.equal(result.failClosed,true);cases++;
}

// Unknown/empty input fails closed instead of silently skipping historical evidence.
{
  const result=route([]);assert.deepEqual(result.requiredHistoricalPhases,all);assert.equal(result.failClosed,true);cases++;
}
{
  const result=expectPhases(['new-unclassified-area/thing.mjs'],all,'P1');assert.equal(result.failClosed,true);
}

// Pure post-v1 presentation/product work is eligible for the post-v1 gate alone.
{
  const result=expectPhases(['src/rendering/living-scene.js','tests/product/browser-v11-modeled-inspector.mjs'],[]);assert.equal(result.failClosed,false);
}
{
  expectPhases(['.github/workflows/post-v1-development.yml'],[]);
  expectPhases(['docs/product/v1.1-notes.md'],[]);
}

// Domain ownership maps to the earliest affected historical phase and closes downstream.
expectPhases(['src/domains/astronomy/observability.js'],['P3','P4','P5','P6'],'P3');
expectPhases(['src/domains/planetology/volatile-ledger.js'],['P5','P6'],'P5');
expectPhases(['src/domains/biosphere/causal-niches.js'],['P6'],'P6');
expectPhases(['tests/p2/address-parser-tests.mjs'],['P2','P3','P4','P5','P6'],'P2');
expectPhases(['tests/p4/archive-lineage-tests.mjs'],['P4','P5','P6'],'P4');
expectPhases(['.github/workflows/p5-environment-v2-canonical.yml'],['P5','P6'],'P5');

// Mixed packets are monotonic: a broader dependency can only widen required evidence.
expectPhases(['src/rendering/living-scene.js','src/domains/planetology/volatile-ledger.js'],['P5','P6'],'P5');
{
  const result=expectPhases(['src/rendering/living-scene.js','unexpected/new-contract.json'],all,'P1');assert.equal(result.failClosed,true);
}
{
  const p6=route(['src/domains/biosphere/a.js']).requiredHistoricalPhases;
  const p5=route(['src/domains/biosphere/a.js','src/domains/planetology/b.js']).requiredHistoricalPhases;
  const p3=route(['src/domains/biosphere/a.js','src/domains/planetology/b.js','src/domains/astronomy/c.js']).requiredHistoricalPhases;
  assert(p5.length>=p6.length&&p3.length>=p5.length);cases++;
}

// Known foundational/deterministic code is cumulatively routed by contract, not by uncertainty.
for(const path of ['src/persistence/save.js','src/kernel/p2-canonical.js']){
  const result=expectPhases([path],all,'P1');assert.equal(result.failClosed,false);
}
// Cross-cutting/unknown ownership is cumulative specifically because it fails closed.
for(const path of ['src/domains/v1/world-provider.js','tests/integration/p3-p5-contract-tests.mjs','docs/adr/ADR-0001.md']){
  const result=expectPhases([path],all,'P1');assert.equal(result.failClosed,true);
}

// Input canonicalization is deterministic and rejects path-smuggling forms.
{
  const paths=normalizeChangedPaths(['tests/p6/z.mjs','src/rendering/a.js','tests/p6/z.mjs']);
  assert.deepEqual(paths,['src/rendering/a.js','tests/p6/z.mjs']);cases++;
}
for(const invalid of ['/absolute/file','../escape','src/../escape','src\\kernel\\x.js','src//x.js','src/./x.js','bad\u0000name']){
  assert.throws(()=>normalizeChangedPaths([invalid]),/OFU phase router:/);cases++;
}
assert.throws(()=>normalizeChangedPaths(Array.from({length:PHASE_ROUTER_LIMITS.maxPaths+1},(_,i)=>`x/${i}`)),/changed path count/);cases++;
assert.throws(()=>normalizeChangedPaths(['x/'.padEnd(PHASE_ROUTER_LIMITS.maxPathBytes+2,'a')]),/changed path exceeds/);cases++;

// Repeatability: caller order and duplicates cannot alter the routing record except normalized paths.
{
  const a=route(['src/domains/planetology/b.js','src/rendering/a.js','src/domains/planetology/b.js']);
  const b=route(['src/rendering/a.js','src/domains/planetology/b.js']);
  assert.deepEqual(a,b);cases++;
}

console.log(JSON.stringify({status:'PASS',suite:'phase-router',cases,limits:PHASE_ROUTER_LIMITS}));

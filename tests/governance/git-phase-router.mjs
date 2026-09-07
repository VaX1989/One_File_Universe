import assert from 'node:assert/strict';
import {collectGitRoute,GIT_PHASE_ROUTER_LIMITS,parseGitNameOnlyZ,routeGitDiff} from '../../tools/ci/git-phase-router.mjs';

const base='a'.repeat(40),head='b'.repeat(40),all=['P1','P2','P3','P4','P5','P6'];
const z=(...paths)=>Buffer.from(paths.length?paths.join('\0')+'\0':'','utf8');
let cases=0;

assert.deepEqual(parseGitNameOnlyZ(z('src/rendering/living-scene.js','tests/product/a.mjs')),['src/rendering/living-scene.js','tests/product/a.mjs']);cases++;
assert.throws(()=>parseGitNameOnlyZ(Buffer.from('src/rendering/a.js')),/NUL terminated/);cases++;

{
  const route=routeGitDiff({baseRef:'development/v1.1-quality-exploration',baseSha:base,headSha:head,diffOutput:z('src/rendering/living-scene.js','tests/product/browser-v11.mjs')});
  assert.equal(route.adapterStatus,'OK');assert.deepEqual(route.requiredHistoricalPhases,[]);assert.equal(route.gitRange.noRenames,true);cases++;
}
{
  const route=routeGitDiff({baseRef:'refs/heads/development/v1.1-quality-exploration',baseSha:base,headSha:head,diffOutput:z('src/rendering/living-scene.js')});
  assert.equal(route.adapterStatus,'OK');assert.equal(route.baseRef,'development/v1.1-quality-exploration');assert.deepEqual(route.requiredHistoricalPhases,[]);cases++;
}
{
  const route=routeGitDiff({baseRef:'development/v1.1-quality-exploration',baseSha:base,headSha:head,diffOutput:z('src/domains/planetology/volatile-ledger.js')});
  assert.equal(route.adapterStatus,'OK');assert.deepEqual(route.requiredHistoricalPhases,['P5','P6']);cases++;
}
{
  const route=routeGitDiff({baseRef:'main',baseSha:base,headSha:head,diffOutput:z('src/rendering/living-scene.js')});
  assert.equal(route.adapterStatus,'OK');assert.deepEqual(route.requiredHistoricalPhases,all);assert.equal(route.failClosed,true);cases++;
}
{
  const route=routeGitDiff({baseRef:'refs/heads/main',baseSha:base,headSha:head,diffOutput:z('src/rendering/living-scene.js')});
  assert.equal(route.adapterStatus,'OK');assert.equal(route.baseRef,'main');assert.deepEqual(route.requiredHistoricalPhases,all);cases++;
}
for(const baseRef of ['feature/arbitrary','development/v1.2-unratified','UNKNOWN','bad\u0000ref']){
  const route=routeGitDiff({baseRef,baseSha:base,headSha:head,diffOutput:z('src/rendering/living-scene.js')});
  assert.equal(route.adapterStatus,'FAIL_CLOSED');assert.deepEqual(route.requiredHistoricalPhases,all);assert.match(route.adapterReason,/unsupported-base-ref/);cases++;
}
{
  let calls=0;
  const route=collectGitRoute({baseRef:'feature/arbitrary',baseSha:base,headSha:head,execGit(){calls++;return z('src/rendering/living-scene.js')}});
  assert.equal(calls,0,'unsupported base refs must fail before invoking Git');assert.equal(route.adapterStatus,'FAIL_CLOSED');assert.deepEqual(route.requiredHistoricalPhases,all);cases++;
}
{
  const route=routeGitDiff({baseSha:'0'.repeat(40),headSha:head,diffOutput:z('src/rendering/living-scene.js')});
  assert.equal(route.adapterStatus,'FAIL_CLOSED');assert.deepEqual(route.requiredHistoricalPhases,all);cases++;
}
{
  const paths=Array.from({length:513},(_,i)=>`src/rendering/${i}.js`);
  const route=routeGitDiff({baseSha:base,headSha:head,diffOutput:z(...paths)});
  assert.equal(route.adapterStatus,'FAIL_CLOSED');assert.deepEqual(route.requiredHistoricalPhases,all);assert.match(route.adapterReason,/changed path count/);cases++;
}
{
  let captured=null;
  const route=collectGitRoute({baseRef:'development/v1.1-quality-exploration',baseSha:base,headSha:head,execGit(args){captured=args;return z('src/domains/biosphere/causal-niches.js');}});
  assert.deepEqual(captured,['diff','--name-only','-z','--no-renames',`${base}...${head}`,'--']);assert.equal(route.adapterStatus,'OK');assert.deepEqual(route.requiredHistoricalPhases,['P6']);cases++;
}
{
  const route=collectGitRoute({baseSha:base,headSha:head,execGit(){throw new Error('injected git failure')}});
  assert.equal(route.adapterStatus,'FAIL_CLOSED');assert.deepEqual(route.requiredHistoricalPhases,all);assert.match(route.adapterReason,/git-diff:injected git failure/);cases++;
}
{
  const route=routeGitDiff({baseSha:base,headSha:head,diffOutput:z('../escape')});
  assert.equal(route.adapterStatus,'FAIL_CLOSED');assert.deepEqual(route.requiredHistoricalPhases,all);cases++;
}
{
  const a=routeGitDiff({baseSha:base,headSha:head,diffOutput:z('src/rendering/a.js','src/domains/planetology/b.js')});
  const b=routeGitDiff({baseSha:base,headSha:head,diffOutput:z('src/domains/planetology/b.js','src/rendering/a.js')});
  assert.deepEqual(a.requiredHistoricalPhases,b.requiredHistoricalPhases);assert.equal(a.earliestHistoricalPhase,b.earliestHistoricalPhase);cases++;
}
assert.equal(GIT_PHASE_ROUTER_LIMITS.maxDiffBytes,1024*1024);cases++;
assert(GIT_PHASE_ROUTER_LIMITS.supportedBaseRefs.includes('main')&&GIT_PHASE_ROUTER_LIMITS.supportedBaseRefs.includes('development/v1.1-quality-exploration'));cases++;

console.log(JSON.stringify({status:'PASS',suite:'git-phase-router',cases,limits:GIT_PHASE_ROUTER_LIMITS}));

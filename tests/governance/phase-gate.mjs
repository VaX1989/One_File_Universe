import assert from 'node:assert/strict';
import {evaluateHistoricalPhaseGate,formatGithubOutputs,normalizeGatePhases} from '../../tools/ci/phase-gate.mjs';

const base='a'.repeat(40),head='b'.repeat(40);
const z=(...paths)=>Buffer.from(paths.length?paths.join('\0')+'\0':'','utf8');
const execFor=(...paths)=>()=>z(...paths);
let cases=0;

assert.deepEqual(normalizeGatePhases('P6,P2,P2'),['P2','P6']);cases++;
assert.throws(()=>normalizeGatePhases('P7'),/unknown phase/);cases++;
assert.throws(()=>normalizeGatePhases(''),/at least one phase/);cases++;

{
  const gate=evaluateHistoricalPhaseGate({phases:'P1',baseRef:'development/v1.1-quality-exploration',baseSha:base,headSha:head,execGit:execFor('src/rendering/living-scene.js')});
  assert.equal(gate.run,false);assert.equal(gate.adapterStatus,'OK');assert.equal(gate.earliestHistoricalPhase,null);cases++;
}
{
  const gate=evaluateHistoricalPhaseGate({phases:'P5',baseRef:'development/v1.1-quality-exploration',baseSha:base,headSha:head,execGit:execFor('src/domains/planetology/volatile-ledger.js')});
  assert.equal(gate.run,true);assert.deepEqual(gate.route.requiredHistoricalPhases,['P5','P6']);cases++;
}
{
  const gate=evaluateHistoricalPhaseGate({phases:'P6',baseRef:'development/v1.1-quality-exploration',baseSha:base,headSha:head,execGit:execFor('src/domains/planetology/volatile-ledger.js')});
  assert.equal(gate.run,true);cases++;
}
{
  const gate=evaluateHistoricalPhaseGate({phases:'P1,P2,P3,P4',baseRef:'development/v1.1-quality-exploration',baseSha:base,headSha:head,execGit:execFor('src/domains/planetology/volatile-ledger.js')});
  assert.equal(gate.run,false);cases++;
}
{
  const gate=evaluateHistoricalPhaseGate({phases:'P1,P2,P3,P4',baseRef:'development/v1.1-quality-exploration',baseSha:base,headSha:head,execGit:execFor('src/domains/astronomy/catalog.js')});
  assert.equal(gate.run,true);assert.equal(gate.earliestHistoricalPhase,'P3');cases++;
}
{
  const gate=evaluateHistoricalPhaseGate({phases:'P1',baseRef:'main',baseSha:base,headSha:head,execGit:execFor('src/rendering/living-scene.js')});
  assert.equal(gate.run,true);assert.equal(gate.failClosed,true);assert.deepEqual(gate.route.requiredHistoricalPhases,['P1','P2','P3','P4','P5','P6']);cases++;
}
{
  const gate=evaluateHistoricalPhaseGate({phases:'P1',baseRef:'development/v1.1-quality-exploration',baseSha:'0'.repeat(40),headSha:head,execGit:execFor('src/rendering/living-scene.js')});
  assert.equal(gate.run,true);assert.equal(gate.adapterStatus,'FAIL_CLOSED');cases++;
}
{
  const gate=evaluateHistoricalPhaseGate({phases:'P6',baseRef:'development/v1.1-quality-exploration',baseSha:base,headSha:head,execGit(){throw new Error('injected failure')}});
  assert.equal(gate.run,true);assert.equal(gate.adapterStatus,'FAIL_CLOSED');cases++;
}
{
  const gate=evaluateHistoricalPhaseGate({phases:'P3',baseRef:'development/v1.1-quality-exploration',baseSha:base,headSha:head,execGit:execFor('src/domains/astronomy/catalog.js')});
  const output=formatGithubOutputs(gate);
  assert.match(output,/^run=true$/m);assert.match(output,/^adapter_status=OK$/m);assert.match(output,/^earliest_phase=P3$/m);assert.match(output,/^phases=P3$/m);cases++;
}

console.log(JSON.stringify({status:'PASS',suite:'historical-phase-gate',cases}));

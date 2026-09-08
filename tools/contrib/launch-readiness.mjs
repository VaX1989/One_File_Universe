#!/usr/bin/env node
import { readJson } from './lib/control-plane.mjs';

const ledger = readJson('config/governance/public-launch-gates.json');
const ready = new Set(ledger.readyStatuses ?? ['PASS']);
const blocking = (ledger.gates ?? []).filter((gate) => gate.blocking === true);
const failing = blocking.filter((gate) => !ready.has(gate.status));
const result = {
  status: failing.length === 0 ? 'READY' : 'NOT_READY',
  suite: 'ofu-public-launch-readiness-1',
  targetRelease: ledger.targetRelease,
  blockingGates: blocking.length,
  passedBlockingGates: blocking.length - failing.length,
  outstanding: failing.map((gate) => ({ id: gate.id, status: gate.status, purpose: gate.purpose, evidence: gate.evidence ?? [] }))
};
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--require-ready') && failing.length) process.exit(1);

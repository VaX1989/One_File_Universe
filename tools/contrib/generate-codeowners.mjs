#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, codeownersText } from './lib/control-plane.mjs';

const target = path.join(ROOT, '.github/CODEOWNERS');
const expected = codeownersText();
const args = new Set(process.argv.slice(2));

if (args.has('--check')) {
  const actual = fs.readFileSync(target, 'utf8');
  if (actual !== expected) {
    console.error('CODEOWNERS drift detected. Run: npm run governance:codeowners -- --write');
    process.exit(1);
  }
  console.log(JSON.stringify({ status: 'PASS', suite: 'ofu-codeowners-drift-1' }));
  process.exit(0);
}
if (args.has('--write')) {
  fs.writeFileSync(target, expected);
  console.log(`Wrote ${path.relative(ROOT, target)}`);
  process.exit(0);
}
process.stdout.write(expected);

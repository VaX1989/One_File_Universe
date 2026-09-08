#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { ROOT, classifyFiles } from './lib/control-plane.mjs';

const args = process.argv.slice(2).filter((arg) => arg !== '--');
let files = args;
if (!files.length) {
  try {
    const output = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMRT', 'HEAD~1..HEAD'], { cwd: ROOT, encoding: 'utf8' });
    files = output.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  } catch {
    console.error('No file paths supplied and git diff could not be resolved.');
    process.exit(2);
  }
}

const result = classifyFiles(files);
console.log(JSON.stringify({ status: 'PASS', suite: 'ofu-change-classifier-2', ...result }, null, 2));

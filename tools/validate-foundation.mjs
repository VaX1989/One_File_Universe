import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'README.md',
  'docs/CONSTITUTION.md',
  'docs/VISION.md',
  'docs/ARCHITECTURE.md',
  'docs/DETERMINISM.md',
  'docs/RECORD_SPEC.md',
  'docs/CONFORMANCE.md',
  'docs/ROADMAP.md',
  'docs/RISK_REGISTER.md',
  'docs/adr/README.md'
];

const failures = [];
const notes = [];
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`Missing required file: ${rel}`);
}

if (!failures.length) {
  const constitution = read('docs/CONSTITUTION.md');
  const architecture = read('docs/ARCHITECTURE.md');
  const determinism = read('docs/DETERMINISM.md');
  const record = read('docs/RECORD_SPEC.md');
  const roadmap = read('docs/ROADMAP.md');

  const clauses = [
    [constitution, 'Strict Direct-Open', 'Constitution must define Strict Direct-Open'],
    [constitution, 'Canonical / derived / presentation boundary', 'Constitution must define authority boundary'],
    [constitution, 'English is the normative language of One File Universe.', 'Constitution must define the normative Project Language Policy'],
    [constitution, 'translations are non-normative', 'Constitution must keep localization non-normative'],
    [determinism, 'generatorManifestHash', 'Determinism contract must bind generator manifest'],
    [determinism, 'domain separation', 'Determinism contract must require domain separation'],
    [architecture, 'COLD', 'Architecture must define semantic simulation LOD'],
    [record, 'Certified Functional Payload', 'Record spec must define CFP'],
    [roadmap, 'P1 — Constitutional Prototype', 'Roadmap must retain P1 falsification prototype']
  ];

  for (const [text, needle, message] of clauses) {
    if (!text.includes(needle)) failures.push(message);
  }

  const contributing=read('CONTRIBUTING.md');
  if(!contributing.includes('English is the normative project language.')) failures.push('CONTRIBUTING.md must restate the normative English project-language rule');

  const adrDir = path.join(root, 'docs/adr');
  const adrs = fs.readdirSync(adrDir).filter(name => /^ADR-\d{3}-.+\.md$/.test(name)).sort();
  if (adrs.length < 14) failures.push(`Expected at least 14 foundational ADRs, found ${adrs.length}`);

  const numbers = adrs.map(name => Number(name.slice(4, 7)));
  const expected = Array.from({ length: 14 }, (_, i) => i + 1);
  for (const n of expected) if (!numbers.includes(n)) failures.push(`Missing foundational ADR-${String(n).padStart(3, '0')}`);

  const docs = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md')) docs.push(full);
    }
  }
  walk(path.join(root, 'docs'));

  for (const file of docs) {
    const text = fs.readFileSync(file, 'utf8');
    const relative = path.relative(root, file);
    if (/\bno runtime dependency\b/i.test(text) && !/misrepresent|not.*no runtime dependency/i.test(text)) failures.push(`Potentially misleading zero-runtime-dependency claim in ${relative}`);
    if (/Math\.random\s*\(/.test(text)) failures.push(`Canonical foundation documentation must not prescribe Math.random(): ${relative}`);
  }

  notes.push(`${adrs.length} foundational ADRs discovered`);
  notes.push(`${docs.length} Markdown foundation documents inspected`);
  notes.push('normative English project-language policy present');
}

if (failures.length) {
  console.error('OFU foundation validation: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('OFU foundation validation: PASS');
for (const note of notes) console.log(`- ${note}`);

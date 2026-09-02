import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'README.md','LICENSE','SECURITY.md','CONTRIBUTING.md','package.json',
  'docs/CONSTITUTION.md','docs/ARCHITECTURE.md','docs/DETERMINISM.md',
  'docs/CONFORMANCE.md','docs/RECORD_SPEC.md','docs/ROADMAP.md','docs/RISK_REGISTER.md',
  'docs/adr/README.md'
];
for (const file of required) {
  if (!fs.existsSync(path.join(root,file))) throw new Error(`Missing required foundation file: ${file}`);
}
const adrDir=path.join(root,'docs','adr');
const adrs=fs.readdirSync(adrDir).filter(x=>/^ADR-\d{3}-.+\.md$/.test(x));
if(adrs.length<14) throw new Error(`Expected at least 14 ADRs, found ${adrs.length}`);
const constitution=fs.readFileSync(path.join(root,'docs','CONSTITUTION.md'),'utf8');
const contributing=fs.readFileSync(path.join(root,'CONTRIBUTING.md'),'utf8');
const markers=['English is the normative language of One File Universe.','translations are non-normative','MUST NOT define canonical identifiers'];
for(const marker of markers)if(!constitution.includes(marker))throw new Error(`Missing normative Project Language Policy marker: ${marker}`);
if(!contributing.includes('English is the normative project language.'))throw new Error('CONTRIBUTING.md must restate the normative English project-language rule');
console.log(`Foundation validation: PASS (${required.length} required files, ${adrs.length} ADRs, normative English policy present)`);

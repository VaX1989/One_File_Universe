import fs from 'node:fs';
import assert from 'node:assert/strict';

const protectedWorkflows=[
  '.github/workflows/foundation.yml',
  '.github/workflows/post-v1-development.yml',
  '.github/workflows/source-reproduction.yml',
];

function checkoutBlocks(text){
  const lines=text.split(/\r?\n/),blocks=[];
  for(let i=0;i<lines.length;i++){
    if(!/\buses:\s+actions\/checkout@[0-9a-f]{40}/.test(lines[i]))continue;
    const indent=(lines[i].match(/^\s*/)||[''])[0].length;
    const block=[lines[i]];
    for(let j=i+1;j<lines.length;j++){
      const line=lines[j],trim=line.trim(),nextIndent=(line.match(/^\s*/)||[''])[0].length;
      if(trim&&nextIndent<=indent&&/^-\s+(?:name:|uses:)/.test(trim))break;
      block.push(line);
    }
    blocks.push(block.join('\n'));
  }
  return blocks;
}

function assertCredentialBoundary(file,text){
  const blocks=checkoutBlocks(text);
  assert(blocks.length>0,`${file}: expected at least one exact-source checkout`);
  for(const block of blocks){
    assert(/\bpersist-credentials:\s*false\b/.test(block),`${file}: checkout must not persist GITHUB_TOKEN credentials into the repository`);
  }
  return blocks.length;
}

let checkouts=0;
for(const file of protectedWorkflows)checkouts+=assertCredentialBoundary(file,fs.readFileSync(file,'utf8'));

const unsafe=`steps:\n  - uses: actions/checkout@${'a'.repeat(40)}\n    with:\n      ref: deadbeef\n  - name: Untrusted repository test\n    run: node test.mjs\n`;
assert.throws(()=>assertCredentialBoundary('synthetic-unsafe.yml',unsafe),/must not persist GITHUB_TOKEN/);
const safe=`steps:\n  - uses: actions/checkout@${'a'.repeat(40)}\n    with:\n      ref: deadbeef\n      persist-credentials: false\n  - name: Test\n    run: node test.mjs\n`;
assert.equal(assertCredentialBoundary('synthetic-safe.yml',safe),1);

console.log(JSON.stringify({status:'PASS',suite:'workflow-credential-boundary',workflows:protectedWorkflows.length,checkouts,syntheticCases:2}));

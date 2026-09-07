import fs from 'node:fs';
import assert from 'node:assert/strict';

const workflowDir='.github/workflows';
const baselineProtectedWorkflows=[
  `${workflowDir}/foundation.yml`,
  `${workflowDir}/post-v1-development.yml`,
  `${workflowDir}/source-reproduction.yml`,
  `${workflowDir}/certified-preview-release.yml`,
  `${workflowDir}/v1-stable-release.yml`,
];
const privilegedWriteKeys=new Set([
  'actions','attestations','checks','contents','deployments','discussions','id-token',
  'issues','packages','pages','pull-requests','repository-projects','security-events','statuses',
]);
function normalizedPermissionLine(raw){return raw.replace(/\s+#.*$/,'').trim()}
function unquote(value){value=String(value).trim();if((value.startsWith("'")&&value.endsWith("'"))||(value.startsWith('"')&&value.endsWith('"')))return value.slice(1,-1).trim();return value}
function privilegedPermissionOnLine(raw){
  const line=normalizedPermissionLine(raw);
  const scalar=line.match(/^["']?permissions["']?\s*:\s*(.+)$/);
  if(scalar&&!scalar[1].trim().startsWith('{')&&unquote(scalar[1])==='write-all')return true;
  const direct=line.match(/^["']?([a-z-]+)["']?\s*:\s*(.+)$/);
  if(direct&&privilegedWriteKeys.has(direct[1])&&unquote(direct[2])==='write')return true;
  const inline=line.match(/^["']?permissions["']?\s*:\s*\{(.*)\}\s*$/);
  if(inline){for(const entry of inline[1].split(',')){const pair=entry.trim().match(/^["']?([a-z-]+)["']?\s*:\s*(.+)$/);if(pair&&privilegedWriteKeys.has(pair[1])&&unquote(pair[2])==='write')return true}}
  return false;
}
function hasPrivilegedPermission(text){return text.split(/\r?\n/).some(privilegedPermissionOnLine)}

const privilegedWorkflows=fs.readdirSync(workflowDir)
  .filter(name=>/\.ya?ml$/.test(name))
  .map(name=>`${workflowDir}/${name}`)
  .filter(file=>hasPrivilegedPermission(fs.readFileSync(file,'utf8')))
  .sort();
const protectedWorkflows=[...new Set([...baselineProtectedWorkflows,...privilegedWorkflows])].sort();
const checkoutRequired=new Set(baselineProtectedWorkflows);

function checkoutUseOnLine(raw){
  const line=raw.replace(/\s+#.*$/,'').trim(),match=line.match(/^(?:-\s*)?["']?uses["']?\s*:\s*(.+)$/);
  return Boolean(match&&unquote(match[1]).startsWith('actions/checkout@'));
}
function checkoutBlocks(text){
  const lines=text.split(/\r?\n/),blocks=[];
  for(let i=0;i<lines.length;i++){
    if(!checkoutUseOnLine(lines[i]))continue;
    const indent=(lines[i].match(/^\s*/)||[''])[0].length;
    const block=[lines[i]];
    for(let j=i+1;j<lines.length;j++){
      const line=lines[j],trim=line.trim(),nextIndent=(line.match(/^\s*/)||[''])[0].length;
      if(trim&&nextIndent<=indent&&/^-\s+/.test(trim))break;
      block.push(line);
    }
    blocks.push(block.join('\n'));
  }
  return blocks;
}
function inlineMapHasFalse(map,key){
  for(const entry of map.split(',')){
    const pair=entry.trim().match(/^["']?([a-z-]+)["']?\s*:\s*(.+)$/);
    if(pair&&pair[1]===key&&unquote(pair[2])==='false')return true;
  }
  return false;
}
function checkoutCredentialsDisabled(block){
  const lines=block.split(/\r?\n/);
  for(let i=1;i<lines.length;i++){
    const raw=lines[i].replace(/\s+#.*$/,''),trim=raw.trim(),indent=(raw.match(/^\s*/)||[''])[0].length;
    const inline=trim.match(/^["']?with["']?\s*:\s*\{(.*)\}\s*$/);
    if(inline&&inlineMapHasFalse(inline[1],'persist-credentials'))return true;
    if(!/^["']?with["']?\s*:\s*$/.test(trim))continue;
    for(let j=i+1;j<lines.length;j++){
      const child=lines[j].replace(/\s+#.*$/,''),childTrim=child.trim(),childIndent=(child.match(/^\s*/)||[''])[0].length;
      if(childTrim&&childIndent<=indent)break;
      const pair=childTrim.match(/^["']?persist-credentials["']?\s*:\s*(.+)$/);
      if(pair&&unquote(pair[1])==='false')return true;
    }
  }
  return false;
}

function assertCredentialBoundary(file,text,{requireCheckout=false}={}){
  const blocks=checkoutBlocks(text);
  if(requireCheckout)assert(blocks.length>0,`${file}: expected at least one repository checkout`);
  for(const block of blocks){
    assert(checkoutCredentialsDisabled(block),`${file}: checkout must set with.persist-credentials=false so GITHUB_TOKEN is not written into repository Git config`);
  }
  return blocks.length;
}

assert(privilegedWorkflows.length>0,'expected at least one privileged workflow');
let checkouts=0;
for(const file of protectedWorkflows)checkouts+=assertCredentialBoundary(file,fs.readFileSync(file,'utf8'),{requireCheckout:checkoutRequired.has(file)});

const unsafe=`steps:\n  - uses: actions/checkout@${'a'.repeat(40)}\n    with:\n      ref: deadbeef\n  - name: Untrusted repository test\n    run: node test.mjs\n`;
assert.throws(()=>assertCredentialBoundary('synthetic-unsafe.yml',unsafe),/with\.persist-credentials=false/);
const mutableUnsafe=`steps:\n  - "uses": "actions/checkout@v4"\n    "with":\n      ref: deadbeef\n  - run: node test.mjs\n`;
assert.throws(()=>assertCredentialBoundary('synthetic-mutable-unsafe.yml',mutableUnsafe),/with\.persist-credentials=false/,'quoted YAML checkout keys/values must not evade the credential boundary');
const commentSpoof=`steps:\n  - uses: actions/checkout@${'a'.repeat(40)}\n    with:\n      ref: deadbeef\n      # persist-credentials: false\n  - name: Untrusted repository test\n    run: node test.mjs\n`;
assert.throws(()=>assertCredentialBoundary('synthetic-comment-spoof.yml',commentSpoof),/with\.persist-credentials=false/);
const envSpoof=`steps:\n  - uses: actions/checkout@${'a'.repeat(40)}\n    env:\n      persist-credentials: false\n`;
assert.throws(()=>assertCredentialBoundary('synthetic-env-spoof.yml',envSpoof),/with\.persist-credentials=false/,'an env key named persist-credentials must not spoof an action input');
const safe=`steps:\n  - uses: actions/checkout@${'a'.repeat(40)}\n    with:\n      ref: deadbeef\n      persist-credentials: false # credential is intentionally ephemeral\n  - name: Test\n    run: node test.mjs\n`;
assert.equal(assertCredentialBoundary('synthetic-safe.yml',safe),1);
const safeInline=`steps:\n  - 'uses': 'actions/checkout@${'a'.repeat(40)}'\n    'with': {ref: deadbeef, 'persist-credentials': 'false'}\n`;
assert.equal(assertCredentialBoundary('synthetic-safe-inline.yml',safeInline),1,'quoted inline action inputs should be parsed without weakening the boundary');
assert.equal(hasPrivilegedPermission('permissions:\n  contents: write\n'),true);
assert.equal(hasPrivilegedPermission('jobs:\n  release:\n    permissions:\n      pull-requests: "write"\n'),true);
assert.equal(hasPrivilegedPermission('"permissions":\n  "contents": "write"\n'),true,'quoted block permission keys must not evade privilege discovery');
assert.equal(hasPrivilegedPermission('permissions:\n  id-token: write\n'),true,'OIDC token minting is a privileged credential boundary');
assert.equal(hasPrivilegedPermission('permissions:\n  attestations: write\n'),true);
assert.equal(hasPrivilegedPermission('permissions:\n  pages: write\n'),true);
assert.equal(hasPrivilegedPermission("'permissions': 'write-all'\n"),true);
assert.equal(hasPrivilegedPermission('permissions: {contents: read, id-token: write}\n'),true,'inline permission maps must not evade privilege discovery');
assert.equal(hasPrivilegedPermission("'permissions': {'contents': 'write', actions: read}\n"),true,'quoted inline permission maps must not evade privilege discovery');
assert.equal(hasPrivilegedPermission('permissions:\n  contents: read\n  # issues: write\n'),false);

console.log(JSON.stringify({status:'PASS',suite:'workflow-credential-boundary',workflows:protectedWorkflows.length,privilegedWorkflows:privilegedWorkflows.length,checkouts,syntheticCases:17,quotedYamlKeysCovered:true}));

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadFixture,deterministicFallback,executeReadOnlyTool,parseAndValidateProposal,validateClaimRefs,AI_GATEWAY_SCHEMA,MAX} from './gateway.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const fixture=loadFixture(path.join(here,'fixtures/world-fixture.json'));
const corpus=JSON.parse(fs.readFileSync(path.join(here,'fixtures/ofu-native-corpus.json'),'utf8'));
let pass=0; const results=[];
for(const c of corpus.cases){
  let ok=false, detail={};
  if(c.category==='malformed'){
    const v=parseAndValidateProposal(c.modelOutput); ok=!v.ok; detail=v;
  } else {
    const x=deterministicFallback(fixture,c.input); detail={fallback:x};
    if(x.kind==='TOOL_PROPOSAL'){
      const wire={schema:AI_GATEWAY_SCHEMA,proposalId:c.id,kind:x.kind,tool:x.tool,budget:{toolCalls:1,outputChars:0,retries:0}};
      const v=parseAndValidateProposal(wire); const r=v.ok?executeReadOnlyTool(fixture,x.tool):null; detail={...detail,validation:v,result:r};
      ok=v.ok && (!c.expect.tool||x.tool.name===c.expect.tool) && (!c.expect.target||x.tool.args.target===c.expect.target) && (!c.expect.entityId||x.tool.args.entityId===c.expect.entityId) && (!c.expect.query||x.tool.args.query===c.expect.query) && (!c.expect.left||x.tool.args.left===c.expect.left) && (!c.expect.right||x.tool.args.right===c.expect.right) && (!c.expect.noMutation||r?.mutated!==true);
    } else if(x.kind==='ANSWER_PROPOSAL'){
      const wire={schema:AI_GATEWAY_SCHEMA,proposalId:c.id,kind:x.kind,answer:{summary:x.summary,claims:x.claims},budget:{toolCalls:0,outputChars:MAX.outputChars,retries:0}};
      const v=parseAndValidateProposal(wire); const refs=v.ok?validateClaimRefs(fixture,x):{ok:false}; detail={...detail,validation:v,refs};
      ok=v.ok&&refs.ok&&(!c.expect.answerContains||x.summary.includes(c.expect.answerContains))&&(!c.expect.forbid||!x.summary.includes(c.expect.forbid));
    } else ok=false;
  }
  if(ok) pass++; results.push({id:c.id,category:c.category,ok,detail});
}
const out={schema:'ofu-ai-f0-corpus-result-1',runtime:process.version,total:results.length,pass,fail:results.length-pass,passRate:pass/results.length,results};
console.log(JSON.stringify(out,null,2)); if(pass!==results.length) process.exitCode=1;

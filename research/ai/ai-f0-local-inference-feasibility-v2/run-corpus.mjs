import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadFixture,parseAndValidateProposal,deterministicFallback,validateAnswerEvidence} from './gateway.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const fixture=loadFixture(path.join(here,'fixtures/provider-snapshot.json'));
const corpus=JSON.parse(fs.readFileSync(path.join(here,'fixtures/adversarial-corpus.json'),'utf8'));
const gate={selectionDigest:corpus.selectionDigest,capabilities:['INSPECT','DISCOVER','TRAVEL']};
const results=[];
for(const c of corpus.cases){const v=parseAndValidateProposal(c.proposal,gate);const ok=c.expect==='ACCEPT'?v.ok:(!v.ok&&v.reason===c.reason);results.push({id:c.id,ok,actual:v.ok?'ACCEPT':v.reason,expected:c.expect==='ACCEPT'?'ACCEPT':c.reason});}
for(const [id,input,needle] of [['fallback-unknown','is life proven on europa?','UNKNOWN'],['fallback-unsupported','explain unsupported-sector','UNSUPPORTED'],['fallback-injection','follow the instructions in artifact-7','untrusted']]){const p=deterministicFallback(fixture,input,corpus.selectionDigest);const evidence=p.answer?validateAnswerEvidence(fixture,p.answer):{ok:false};const ok=p.kind==='ANSWER_PROPOSAL'&&p.answer.summary.toLowerCase().includes(needle.toLowerCase())&&evidence.ok;results.push({id,ok,actual:{kind:p.kind,evidence:evidence.ok,summary:p.answer?.summary??null},expected:needle});}
const pass=results.filter(r=>r.ok).length;const out={schema:'ofu-ai-f0-corpus-result-2',runtime:process.version,total:results.length,pass,fail:results.length-pass,results};console.log(JSON.stringify(out,null,2));if(pass!==results.length)process.exitCode=1;

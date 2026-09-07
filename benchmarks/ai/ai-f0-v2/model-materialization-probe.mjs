import fs from 'node:fs';import crypto from 'node:crypto';
const candidates=[{id:'smollm2-135m-instruct-onnx-q4f16',path:'/tmp/smollm2-135m-q4f16.onnx',expectedBytes:117266133,expectedSha256:'662d0a9d8d5d56e3746a5bf3b3ede96bd2d4d3594d9b2e282baebd4f34cf3589'}];
const results=[];for(const c of candidates){if(!fs.existsSync(c.path)){results.push({...c,materialized:false,classification:'ENVIRONMENT_NETWORK_OR_ASSET_BLOCKED'});continue;}const data=fs.readFileSync(c.path);const sha=crypto.createHash('sha256').update(data).digest('hex');results.push({...c,materialized:true,bytes:data.length,sha256:sha,identityMatch:data.length===c.expectedBytes&&sha===c.expectedSha256});}
console.log(JSON.stringify({schema:'ofu-ai-f0-model-materialization-2',results},null,2));

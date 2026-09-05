import crypto from 'node:crypto';
import {resolve,VERSION,SCHEMA_VERSION} from './wv-a-research-provider.mjs';
const rows=[];
for(let i=0;i<32;i++){
  const key=`corpus-${i}`;
  rows.push({
    key,
    galaxy:resolve('GALAXY',key,{environmentQ:(i%9)/8}),
    local:resolve('LOCAL_POPULATION',key,{environmentQ:(i%9)/8,rNorm:(i%7)/3,zNorm:(i%5)/4}),
    system:resolve('SYSTEM_BIRTH',key,{environmentQ:(i%9)/8,rNorm:(i%7)/3,zNorm:(i%5)/4})
  });
}
const digest=crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex');
console.log(JSON.stringify({modelVersion:VERSION,schemaVersion:SCHEMA_VERSION,status:'RESEARCH_ONLY',records:rows.length,digest},null,2));

import fs from 'node:fs';
const modelPath = new URL('../../../research/ai/ai-f0-local-inference-feasibility-v2/model-candidates.json', import.meta.url);
const models = JSON.parse(fs.readFileSync(modelPath,'utf8')).candidates;
function kvPerToken(a){ return 2*a.layers*a.kvHeads*a.headDim*2; }
function base64Bytes(n){ return n == null ? null : Math.ceil(n/3)*4; }
const contexts=[512,2048,8192];
const results=models.map(m=>{const a=m.architecture,kv=kvPerToken(a),payload=m.modelPayloadBytes??m.modelPayloadBytesApprox??null;return{id:m.id,classification:'DERIVED_NOT_MEASURED',modelPayloadBytes:payload,knownModelBase64Bytes:base64Bytes(payload),kvBytesPerTokenFp16SimpleFormula:kv,kvMiB:Object.fromEntries(contexts.map(t=>[String(t),kv*t/1048576])),limitations:m.id.startsWith('gemma3-')?['Sliding/local attention may reduce realized cache versus this simple full-cache formula.','Allocator packing and runtime cache quantization are not modeled.']:['Allocator packing, cache quantization and runtime implementation overhead are not modeled.']};});
console.log(JSON.stringify({schema:'ofu-ai-f0-derived-candidate-estimates-2',formula:'2(K,V) * layers * kvHeads * headDim * 2 bytes(fp16) * tokens',results},null,2));

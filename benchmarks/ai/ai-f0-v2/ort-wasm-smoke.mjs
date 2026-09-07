import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const modelPath=path.join(here,'fixtures/ort-official-matmul-2d.onnx');
const expected=[700,800,900,1580,1840,2100,2460,2880,3300];
let ort;
try { ort=await import('onnxruntime-web/wasm'); }
catch (first) { try { ort=await import('onnxruntime-web'); } catch (second) { console.log(JSON.stringify({schema:'ofu-ai-f0-ort-smoke-1',classification:'RUNTIME_PACKAGE_UNAVAILABLE',modelBytes:fs.statSync(modelPath).size,errors:[String(first?.message??first),String(second?.message??second)]},null,2)); process.exit(3); } }
try {
  ort.env.wasm.numThreads=1;
  const model=fs.readFileSync(modelPath);
  const t0=performance.now();
  const session=await ort.InferenceSession.create(new Uint8Array(model),{executionProviders:['wasm']});
  const initMs=performance.now()-t0;
  const a=new ort.Tensor('float32',Float32Array.from([1,2,3,4,5,6,7,8,9,10,11,12]),[3,4]);
  const b=new ort.Tensor('float32',Float32Array.from([10,20,30,40,50,60,70,80,90,100,110,120]),[4,3]);
  const t1=performance.now();
  const out=await session.run({a,b});
  const runMs=performance.now()-t1;
  const actual=Array.from(out.c.data);
  const ok=actual.length===expected.length&&actual.every((v,i)=>Math.abs(v-expected[i])<1e-5);
  console.log(JSON.stringify({schema:'ofu-ai-f0-ort-smoke-1',classification:ok?'MEASURED_REAL_ONNX_RUNTIME_WASM_INFERENCE':'RUNTIME_OUTPUT_MISMATCH',runtimeVersion:ort.env?.versions?.web??null,modelBytes:model.length,numThreads:1,initMs,runMs,actual,expected,ok},null,2));
  process.exit(ok?0:4);
} catch (error) {
  console.log(JSON.stringify({schema:'ofu-ai-f0-ort-smoke-1',classification:'RUNTIME_PRESENT_INFERENCE_FAILED',error:String(error?.stack??error)},null,2));
  process.exit(5);
}

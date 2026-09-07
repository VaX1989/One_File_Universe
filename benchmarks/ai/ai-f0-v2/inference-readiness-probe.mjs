import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const model='/tmp/smollm2-135m-q4f16.onnx';let ort=null;try{ort=require.resolve('onnxruntime-web/package.json');}catch{}
const modelPresent=fs.existsSync(model),blockers=[];if(!modelPresent)blockers.push('EXACT_MODEL_BYTES_NOT_MATERIALIZED');if(!ort)blockers.push('ONNXRUNTIME_WEB_PACKAGE_NOT_MATERIALIZED');
console.log(JSON.stringify({schema:'ofu-ai-f0-inference-readiness-1',runtime:process.version,target:{backend:'onnxruntime-web-1.29.0-wasm-cpu',model:'smollm2-135m-instruct-onnx-q4f16'},local:{modelPath:model,modelPresent,onnxruntimeWebPackagePath:ort},readyForRealInference:blockers.length===0,blockers,classification:blockers.length===0?'READY_FOR_INFERENCE_COMMAND':'ENVIRONMENT_ASSET_OR_RUNTIME_BLOCKED'},null,2));

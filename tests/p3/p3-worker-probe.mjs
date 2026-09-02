import fs from 'node:fs';
import vm from 'node:vm';
import {parentPort, workerData} from 'node:worker_threads';

globalThis.OFU={};
for(const file of workerData.files) vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
const P=OFU.p2,A=OFU.p3AstronomyPrototype;
const ctx={masterSeed:Uint8Array.from(workerData.seed),semanticManifestHash:Uint8Array.from(workerData.semanticManifestHash)};
const key=Object.fromEntries(Object.entries(workerData.key).map(([k,v])=>[k,typeof v==='string'&&/^-?\d+$/.test(v)?BigInt(v):v]));
const result=A.resolveWithMetrics(workerData.kind,ctx,key);
parentPort.postMessage({digest:P.hex(A.digestFact(A.canonicalEnvelope(result.result))),metrics:result.metrics});

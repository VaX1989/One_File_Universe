import {parentPort,workerData} from 'node:worker_threads';
import {resolve} from './wv-a-research-provider.mjs';
parentPort.postMessage(workerData.map(x=>[x.key,resolve(x.kind,x.key,x.args)]));

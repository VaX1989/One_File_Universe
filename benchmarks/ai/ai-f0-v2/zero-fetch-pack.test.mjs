import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {materializeManifest,renderZeroFetchHtml,packZeroFetch} from './zero-fetch-pack.mjs';
const h=b=>crypto.createHash('sha256').update(b).digest('hex');
function setup(){const d=fs.mkdtempSync(path.join(os.tmpdir(),'ofu-ai-f0-pack-'));const a=Buffer.from([0,1,2,3,255]),b=Buffer.from('runtime');fs.writeFileSync(path.join(d,'model.bin'),a);fs.writeFileSync(path.join(d,'runtime.js'),b);const m={schema:'ofu-ai-f0-zero-fetch-input-1',title:'test',assets:[{role:'model',path:'model.bin',mime:'application/octet-stream',sha256:h(a)},{role:'runtime',path:'runtime.js',mime:'text/javascript',sha256:h(b)}]};fs.writeFileSync(path.join(d,'manifest.json'),JSON.stringify(m));return{d,m,a,b};}
test('materialization verifies and sorts assets deterministically',()=>{const {d,m}=setup();m.assets.reverse();const x=materializeManifest(m,d);assert.deepEqual(x.assets.map(a=>a.role),['model','runtime']);assert.equal(x.assets[0].bytes,5)});
test('rendered html contains no network execution surface',()=>{const {d,m}=setup();const html=renderZeroFetchHtml(materializeManifest(m,d));for(const token of ['fetch(','XMLHttpRequest','WebSocket','EventSource','http://','https://','script src='])assert.equal(html.includes(token),false,token);assert.match(html,/OFU_AI_F0_ZERO_FETCH/)});
test('packing same bytes is byte deterministic',()=>{const {d}=setup();const a=path.join(d,'a.html'),b=path.join(d,'b.html');const ra=packZeroFetch(path.join(d,'manifest.json'),a),rb=packZeroFetch(path.join(d,'manifest.json'),b);assert.equal(ra.sha256,rb.sha256);assert.deepEqual(fs.readFileSync(a),fs.readFileSync(b))});
test('wrong sha fails closed',()=>{const {d,m}=setup();m.assets[0].sha256='0'.repeat(64);assert.throws(()=>materializeManifest(m,d),/SHA256_MISMATCH/)});
test('duplicate role fails closed',()=>{const {d,m}=setup();m.assets[1].role=m.assets[0].role;assert.throws(()=>materializeManifest(m,d),/DUPLICATE_ROLE/)});
test('path escape fails closed',()=>{const {d,m}=setup();m.assets[0].path='../escape.bin';assert.throws(()=>materializeManifest(m,d),/PATH_ESCAPE/)});
test('unknown manifest or extra asset key fails closed',()=>{const {d,m}=setup();m.assets[0].url='https://example.invalid/x';assert.throws(()=>materializeManifest(m,d),/ASSET_SCHEMA/)});

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const ROLE_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const SHA256_RE = /^[0-9a-f]{64}$/;
const FORBIDDEN_RUNTIME_PATTERNS = [
  /<script\s+[^>]*src\s*=/i,
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bEventSource\b/,
  /https?:\/\//i,
];

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
}

export function materializeManifest(manifest, manifestDir = process.cwd()) {
  if (!manifest || manifest.schema !== 'ofu-ai-f0-zero-fetch-input-1' || !Array.isArray(manifest.assets)) throw new Error('MANIFEST_SCHEMA');
  const seen = new Set();
  const assets = [];
  for (const entry of manifest.assets) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('ASSET_SCHEMA');
    const keys = Object.keys(entry).sort().join(',');
    if (keys !== 'mime,path,role,sha256') throw new Error('ASSET_SCHEMA');
    if (!ROLE_RE.test(entry.role) || seen.has(entry.role)) throw new Error(seen.has(entry.role) ? 'DUPLICATE_ROLE' : 'ROLE_SCHEMA');
    if (typeof entry.path !== 'string' || !entry.path || path.isAbsolute(entry.path)) throw new Error('PATH_SCHEMA');
    if (!SHA256_RE.test(entry.sha256)) throw new Error('SHA256_SCHEMA');
    if (typeof entry.mime !== 'string' || !entry.mime || entry.mime.length > 128) throw new Error('MIME_SCHEMA');
    seen.add(entry.role);
    const resolved = path.resolve(manifestDir, entry.path);
    const root = path.resolve(manifestDir) + path.sep;
    if (!resolved.startsWith(root)) throw new Error('PATH_ESCAPE');
    const bytes = fs.readFileSync(resolved);
    const actual = sha256(bytes);
    if (actual !== entry.sha256) throw new Error(`SHA256_MISMATCH:${entry.role}`);
    assets.push(Object.freeze({role:entry.role,mime:entry.mime,bytes:bytes.length,sha256:actual,base64:bytes.toString('base64')}));
  }
  assets.sort((a,b)=>a.role.localeCompare(b.role));
  return Object.freeze({schema:'ofu-ai-f0-zero-fetch-materialized-1',assetCount:assets.length,assets});
}

export function renderZeroFetchHtml(materialized, options = {}) {
  if (!materialized || materialized.schema !== 'ofu-ai-f0-zero-fetch-materialized-1') throw new Error('MATERIALIZED_SCHEMA');
  const title = typeof options.title === 'string' && options.title ? options.title.slice(0,120) : 'OFU AI-F0 zero-fetch research harness';
  const payload = {schema:materialized.schema,assetCount:materialized.assetCount,assets:materialized.assets};
  const json = escapeJsonForHtml(payload);
  const html = `<!doctype html><meta charset="utf-8"><title>${title.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</title><script type="application/json" id="ofu-ai-f0-assets">${json}</script><script>(()=>{'use strict';const p=JSON.parse(document.getElementById('ofu-ai-f0-assets').textContent);const byRole=new Map(p.assets.map(a=>[a.role,a]));const decode=role=>{const a=byRole.get(role);if(!a)throw new Error('UNKNOWN_ASSET');const s=atob(a.base64),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u};Object.defineProperty(globalThis,'OFU_AI_F0_ZERO_FETCH',{value:Object.freeze({schema:p.schema,roles:Object.freeze([...byRole.keys()]),metadata:role=>{const a=byRole.get(role);return a?Object.freeze({role:a.role,mime:a.mime,bytes:a.bytes,sha256:a.sha256}):null},decode}),writable:false,configurable:false});})();</script>`;
  for (const re of FORBIDDEN_RUNTIME_PATTERNS) if (re.test(html)) throw new Error(`NETWORK_SURFACE:${re}`);
  return html;
}

export function packZeroFetch(manifestPath, outputPath) {
  const absManifest = path.resolve(manifestPath);
  const manifest = JSON.parse(fs.readFileSync(absManifest,'utf8'));
  const materialized = materializeManifest(manifest,path.dirname(absManifest));
  const html = renderZeroFetchHtml(materialized,{title:manifest.title});
  fs.writeFileSync(outputPath,html);
  return {schema:'ofu-ai-f0-zero-fetch-pack-result-1',output:path.resolve(outputPath),bytes:Buffer.byteLength(html),sha256:sha256(Buffer.from(html)),assets:materialized.assets.map(({base64,...a})=>a)};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , manifestPath, outputPath] = process.argv;
  if (!manifestPath || !outputPath) { console.error('usage: node zero-fetch-pack.mjs <manifest.json> <output.html>'); process.exit(2); }
  try { console.log(JSON.stringify(packZeroFetch(manifestPath,outputPath),null,2)); }
  catch (error) { console.error(JSON.stringify({schema:'ofu-ai-f0-zero-fetch-pack-result-1',ok:false,error:String(error?.message??error)},null,2)); process.exit(1); }
}

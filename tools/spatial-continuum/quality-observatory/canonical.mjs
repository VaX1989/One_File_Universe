import { createHash } from 'node:crypto';

export const canonicalize = value => {
  if(Array.isArray(value))return value.map(canonicalize);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonicalize(value[key])]));
  if(typeof value==='bigint')return String(value);
  if(Number.isNaN(value))return 'NaN';
  if(value===Infinity)return 'Infinity';
  if(value===-Infinity)return '-Infinity';
  return value;
};

export const canonicalJson = value => JSON.stringify(canonicalize(value));
export const sha256 = value => createHash('sha256').update(typeof value==='string'?value:canonicalJson(value)).digest('hex');

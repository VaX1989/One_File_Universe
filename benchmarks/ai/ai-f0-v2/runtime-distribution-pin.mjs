const HEX64 = /^[a-f0-9]{64}$/;
const SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

function exactKeys(v, keys) {
  return v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
}

export function validatePinnedRuntimeAsset(asset) {
  if (!exactKeys(asset, ['package','version','asset','bytes','sha256','source'])) return Object.freeze({ok:false,reason:'PIN_SCHEMA'});
  if (typeof asset.package !== 'string' || !/^[a-z0-9][a-z0-9._/-]{0,127}$/.test(asset.package)) return Object.freeze({ok:false,reason:'PACKAGE_ID'});
  if (typeof asset.version !== 'string' || !SEMVER.test(asset.version)) return Object.freeze({ok:false,reason:'IMMUTABLE_VERSION_REQUIRED'});
  if (/latest|next|dev|nightly|canary/i.test(asset.version)) return Object.freeze({ok:false,reason:'MUTABLE_VERSION_ALIAS'});
  if (typeof asset.asset !== 'string' || !/^[A-Za-z0-9._-]{1,128}$/.test(asset.asset)) return Object.freeze({ok:false,reason:'ASSET_NAME'});
  if (!Number.isSafeInteger(asset.bytes) || asset.bytes <= 0) return Object.freeze({ok:false,reason:'ASSET_BYTES'});
  if (typeof asset.sha256 !== 'string' || !HEX64.test(asset.sha256)) return Object.freeze({ok:false,reason:'ASSET_SHA256'});
  if (typeof asset.source !== 'string' || asset.source.length > 1024) return Object.freeze({ok:false,reason:'SOURCE'});
  if (/[@/]latest(?:[/@]|$)/i.test(asset.source) || /(?:^|[?&])version=(?:latest|next|dev|nightly|canary)(?:&|$)/i.test(asset.source)) return Object.freeze({ok:false,reason:'MUTABLE_SOURCE_ALIAS'});
  if (/^https?:/i.test(asset.source) && !asset.source.includes(`@${asset.version}`) && !asset.source.includes(`/${asset.version}/`) && !asset.source.includes(`-${asset.version}.`)) return Object.freeze({ok:false,reason:'SOURCE_VERSION_NOT_PINNED'});
  return Object.freeze({ok:true,reason:'PINNED_EXACT_ASSET',shippingPromotion:false});
}

export function validatePinnedRuntimeSet(assets) {
  if (!Array.isArray(assets) || assets.length === 0 || assets.length > 32) throw new Error('PIN_SET_SCHEMA');
  const seen = new Set();
  const results = [];
  for (const asset of assets) {
    const r = validatePinnedRuntimeAsset(asset);
    if (!r.ok) return Object.freeze({ok:false,reason:r.reason,asset:asset?.asset ?? null});
    const key = `${asset.package}@${asset.version}:${asset.asset}`;
    if (seen.has(key)) return Object.freeze({ok:false,reason:'DUPLICATE_PIN',asset:asset.asset});
    seen.add(key); results.push(key);
  }
  return Object.freeze({ok:true,reason:'PIN_SET_EXACT',assets:Object.freeze(results),shippingPromotion:false});
}

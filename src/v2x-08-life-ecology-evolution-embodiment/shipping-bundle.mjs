import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const MODULE_ORDER = Object.freeze([
  'model.js',
  'embodiment.js',
  'renderer.js',
  'evolution.js',
  'succession.js',
  'provider.js',
  'viewport-bridge.js',
  'shipping-adapter.js',
]);

const MODULE_SET = new Set(MODULE_ORDER);
const IMPORT_RE = /import\s*\{([\s\S]*?)\}\s*from\s*['"]\.\/([^'"]+)['"]\s*;?/g;
const EXPORT_DECL_RE = /\bexport\s+(const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g;

function invariant(condition, message) {
  if (!condition) throw new Error(`LIFE_V2_BUNDLE_INVALID: ${message}`);
}

function normalizeSource(source) {
  return String(source).replace(/\r\n?/g, '\n').trimEnd() + '\n';
}

function normalizeImportList(raw, moduleName) {
  const names = raw.split(',').map((value) => value.trim()).filter(Boolean);
  invariant(names.length > 0, `empty import list in ${moduleName}`);
  return names.map((name) => {
    invariant(!name.includes(' as '), `import aliases are unsupported in ${moduleName}: ${name}`);
    invariant(/^[A-Za-z_$][\w$]*$/.test(name), `unsupported import token in ${moduleName}: ${name}`);
    return name;
  });
}

function compileModule(moduleName, source) {
  const imports = [];
  let transformed = normalizeSource(source).replace(IMPORT_RE, (_full, rawNames, dependencyName) => {
    invariant(MODULE_SET.has(dependencyName), `external or unknown dependency ${dependencyName} from ${moduleName}`);
    const names = normalizeImportList(rawNames, moduleName);
    imports.push({ dependencyName, names });
    return `const { ${names.join(', ')} } = __modules[${JSON.stringify(dependencyName)}];`;
  });

  invariant(!/^\s*import\b/m.test(transformed), `unsupported import form remains in ${moduleName}`);
  invariant(!/\bexport\s+default\b/.test(transformed), `default export unsupported in ${moduleName}`);
  invariant(!/\bexport\s*\{/.test(transformed), `export list unsupported in ${moduleName}`);

  const exports = [];
  transformed = transformed.replace(EXPORT_DECL_RE, (_full, declaration, name) => {
    exports.push(name);
    return `${declaration} ${name}`;
  });
  invariant(!/(^|\n)\s*export\b/.test(transformed), `unsupported export syntax remains in ${moduleName}`);
  invariant(exports.length > 0, `module ${moduleName} exposes no named exports`);
  invariant(new Set(exports).size === exports.length, `duplicate named export in ${moduleName}`);

  const missingOrderDependency = imports.find(({ dependencyName }) => MODULE_ORDER.indexOf(dependencyName) >= MODULE_ORDER.indexOf(moduleName));
  invariant(!missingOrderDependency, `${moduleName} depends on module not yet materialized: ${missingOrderDependency?.dependencyName}`);

  return [
    `__modules[${JSON.stringify(moduleName)}]=(()=>{`,
    `'use strict';`,
    transformed.trimEnd(),
    `return Object.freeze({${exports.join(',')}});`,
    `})();`,
  ].join('\n');
}

export function bundleLifeShippingRuntime({ readSource } = {}) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const read = readSource ?? ((moduleName) => fs.readFileSync(path.join(here, moduleName), 'utf8'));
  const compiled = MODULE_ORDER.map((moduleName) => compileModule(moduleName, read(moduleName)));
  const runtime = [
    `(function(root){`,
    `'use strict';`,
    `const O=root.OFU=root.OFU||{};`,
    `const __modules=Object.create(null);`,
    ...compiled,
    `const model=__modules['model.js'];`,
    `const renderer=__modules['renderer.js'];`,
    `const bridge=__modules['viewport-bridge.js'];`,
    `const shipping=__modules['shipping-adapter.js'];`,
    `const api=Object.freeze({`,
    `  VERSION:'ofu-v2x-08-life-shipping-runtime-2',`,
    `  authorityClass:'MODEL_DERIVED_SIMULATION',`,
    `  createLifeState:model.createLifeState,`,
    `  advanceEcology:model.advanceEcology,`,
    `  applyLineageEvent:model.applyLineageEvent,`,
    `  summarizeLifeState:model.summarizeLifeState,`,
    `  buildOrganismRenderDescriptors:renderer.buildOrganismRenderDescriptors,`,
    `  createLifeViewportBridge:bridge.createLifeViewportBridge,`,
    `  fingerprintLifeViewport:bridge.fingerprintLifeViewport,`,
    `  createLifeShippingAdapter:shipping.createLifeShippingAdapter,`,
    `  descriptor:shipping.LIFE_V2_SHIPPING_ADAPTER_DESCRIPTOR,`,
    `});`,
    `Object.defineProperty(O,'v2x08LifeV2',{value:api,enumerable:true,configurable:false,writable:false});`,
    `})(typeof globalThis!=='undefined'?globalThis:this);`,
    '',
  ].join('\n');
  new vm.Script(runtime, { filename: 'v2x08-life-shipping-runtime.js' });
  return runtime;
}

export const LIFE_V2_SHIPPING_COMPONENT_CANDIDATE = Object.freeze({
  id: 'v2x08.runtime.life-v2',
  version: '2.0.0',
  owner: 'v2x-08-life-ecology-evolution-embodiment',
  kind: 'code',
  stage: 'full',
  placement: 'script',
  source: 'src/v2x-08-life-ecology-evolution-embodiment/shipping-runtime.js',
  dependencies: Object.freeze([]),
  authority: 'MODEL_DERIVED_SIMULATION',
  provenance: 'Deterministic classic-script bundle of the audited V2X-08 model, ecology/evolution provider, organism embodiment, renderer descriptors and additive viewport bridge. It preserves representative-population semantics, P4 external temporal admission and presentation-only geometry; it claims no canonical alien biology or persistent individual identity.',
  provides: Object.freeze(['v2x08.runtime.life-v2', 'v2x08.viewport.life-packets']),
});

function parseCli(args) {
  let output = null;
  let stdout = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--stdout') stdout = true;
    else if (arg === '--output') {
      output = args[++index];
      invariant(output, '--output path required');
    } else invariant(false, `unknown CLI argument ${arg}`);
  }
  invariant(!(output && stdout), 'choose --output or --stdout, not both');
  return { output, stdout };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { output, stdout } = parseCli(process.argv.slice(2));
  const runtime = bundleLifeShippingRuntime();
  if (output) {
    const absolute = path.resolve(output);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, runtime, 'utf8');
    console.log(JSON.stringify({ status: 'PASS', output: path.relative(process.cwd(), absolute), bytes: Buffer.byteLength(runtime) }));
  } else if (stdout) process.stdout.write(runtime);
  else console.log(JSON.stringify({ status: 'PASS', bytes: Buffer.byteLength(runtime) }));
}

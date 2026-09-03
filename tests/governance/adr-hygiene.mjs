import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const ADR_DIR = new URL("../../docs/adr/", import.meta.url);
const INDEX_URL = new URL("README.md", ADR_DIR);
const ADR_FILE = /^ADR-(\d{3})-[a-z0-9-]+\.md$/;
const INDEX_ROW = /^\| \[(\d{3})\]\((ADR-(\d{3})-[a-z0-9-]+\.md)\) \|/;

const files = (await readdir(ADR_DIR)).filter((name) => ADR_FILE.test(name)).sort();
assert.ok(files.length > 0, "ADR registry must not be empty");

const ids = new Map();
for (const file of files) {
  const [, id] = ADR_FILE.exec(file);
  assert.ok(!ids.has(id), `duplicate ADR identifier ${id}: ${ids.get(id)}, ${file}`);
  ids.set(id, file);

  const source = await readFile(new URL(file, ADR_DIR), "utf8");
  assert.match(source, new RegExp(`^# ADR-${id} — `), `${file} heading must match its identifier`);
  assert.match(source, /^\*\*Status:\*\* \S.+$/m, `${file} must declare an explicit status`);
}

const index = await readFile(INDEX_URL, "utf8");
const indexed = new Map();
for (const line of index.split(/\r?\n/)) {
  const match = INDEX_ROW.exec(line);
  if (!match) continue;
  const [, displayId, file, filenameId] = match;
  assert.equal(displayId, filenameId, `ADR index identifier mismatch for ${file}`);
  assert.ok(!indexed.has(displayId), `duplicate ADR index identifier ${displayId}`);
  assert.ok(files.includes(file), `ADR index has dangling link ${file}`);
  indexed.set(displayId, file);
}

assert.deepEqual(indexed, ids, "ADR index must enumerate every ADR exactly once");
console.log(`ADR governance hygiene PASS (${files.length} unique records)`);

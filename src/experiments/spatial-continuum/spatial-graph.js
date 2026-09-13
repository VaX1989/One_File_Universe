import { AUTHORITY } from './constants.js';

const AUTHORITIES = new Set(Object.values(AUTHORITY));
const text = (value, label) => {
  const out = String(value ?? '').trim();
  if (!out) throw new TypeError(label + ' is required');
  return out;
};

export function spatialNode(spec) {
  if (!spec || typeof spec !== 'object') throw new TypeError('Spatial node specification is required');
  const authority = text(spec.authority, 'authority');
  if (!AUTHORITIES.has(authority)) throw new RangeError('Unknown authority: ' + authority);
  return Object.freeze({
    id: text(spec.id, 'node id'),
    kind: text(spec.kind, 'node kind'),
    parentId: spec.parentId == null ? null : text(spec.parentId, 'parent id'),
    frameId: text(spec.frameId, 'frame id'),
    authority,
    representations: Object.freeze([...(spec.representations || [])].map(String)),
    metadata: Object.freeze({...spec.metadata})
  });
}

export function createSpatialGraph(specs, {focusId} = {}) {
  if (!Array.isArray(specs) || !specs.length) throw new TypeError('A non-empty spatial graph is required');
  const nodes = new Map();
  for (const input of specs) {
    const node = spatialNode(input);
    if (nodes.has(node.id)) throw new Error('Duplicate spatial node: ' + node.id);
    nodes.set(node.id, node);
  }
  for (const node of nodes.values()) {
    if (node.parentId != null && !nodes.has(node.parentId)) throw new Error('Missing parent for ' + node.id);
    const seen = new Set([node.id]);
    let cursor = node;
    while (cursor.parentId != null) {
      if (seen.has(cursor.parentId)) throw new Error('Spatial graph cycle at ' + cursor.parentId);
      seen.add(cursor.parentId);
      cursor = nodes.get(cursor.parentId);
    }
  }
  let focus = text(focusId || specs[0].id, 'focus id');
  if (!nodes.has(focus)) throw new Error('Unknown initial focus: ' + focus);
  let revision = 0;
  const ancestry = id => {
    const out = [];
    let cursor = nodes.get(text(id, 'node id'));
    if (!cursor) throw new Error('Unknown spatial node: ' + id);
    while (cursor) {
      out.push(cursor);
      cursor = cursor.parentId == null ? null : nodes.get(cursor.parentId);
    }
    return Object.freeze(out);
  };
  return Object.freeze({
    get size() { return nodes.size; },
    get focusId() { return focus; },
    get revision() { return revision; },
    get(id) { return nodes.get(String(id)) || null; },
    has(id) { return nodes.has(String(id)); },
    childrenOf(id) { return Object.freeze([...nodes.values()].filter(node => node.parentId === String(id))); },
    ancestry,
    setFocus(id) {
      id = text(id, 'focus id');
      if (!nodes.has(id)) throw new Error('Unknown focus: ' + id);
      if (focus !== id) { focus = id; revision++; }
      return nodes.get(focus);
    },
    snapshot() {
      return Object.freeze({
        contract: 'ofu-spatial-continuum-graph-1',
        nodeCount: nodes.size,
        focusId: focus,
        focus: nodes.get(focus),
        focusAncestry: ancestry(focus).map(node => node.id),
        revision,
        singleFocusAuthority: true
      });
    }
  });
}

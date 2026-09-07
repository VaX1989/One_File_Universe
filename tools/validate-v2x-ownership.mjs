#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DEFAULT_MATRIX = 'docs/parallel/V2X_OWNERSHIP_MATRIX.json';

export function normalizeRepoPath(value) {
  if (typeof value !== 'string' || value.length === 0) throw new Error('path must be a non-empty string');
  if (value.includes('\0')) throw new Error('path contains NUL');
  if (value.includes('\\')) throw new Error('backslashes are forbidden');
  if (value.startsWith('/')) throw new Error('absolute paths are forbidden');
  if (value.includes('//')) throw new Error('repeated separators are forbidden');
  const parts = value.split('/');
  if (parts.some((part) => part === '' || part === '.' || part === '..')) throw new Error('dot/traversal segments are forbidden');
  const normalized = path.posix.normalize(value);
  if (normalized !== value || normalized.startsWith('../')) throw new Error('path normalization changed input');
  return normalized;
}

function escapeRegexChar(ch) {
  return /[\\^$+?.()|{}\[\]]/.test(ch) ? `\\${ch}` : ch;
}

export function globToRegExp(glob) {
  if (typeof glob !== 'string' || glob.length === 0) throw new Error('glob must be a non-empty string');
  let source = '^';
  for (let i = 0; i < glob.length; i += 1) {
    const ch = glob[i];
    if (ch === '*') {
      if (glob[i + 1] === '*') {
        source += '.*';
        i += 1;
      } else {
        source += '[^/]*';
      }
    } else if (ch === '?') {
      source += '[^/]';
    } else {
      source += escapeRegexChar(ch);
    }
  }
  return new RegExp(`${source}$`);
}

function matchesAny(repoPath, patterns = []) {
  return patterns.some((pattern) => globToRegExp(pattern).test(repoPath));
}

function exactException(repoPath, exceptions = []) {
  return exceptions.includes(repoPath);
}

export function validateMatrixShape(matrix) {
  const errors = [];
  if (!matrix || matrix.schema !== 'ofu-v2x-ownership-matrix-1') errors.push('unsupported matrix schema');
  if (matrix?.precedence !== 'DENY_BEFORE_ALLOW') errors.push('matrix precedence must be DENY_BEFORE_ALLOW');
  if (!matrix?.global || !Array.isArray(matrix.global.convergenceOwnerOnly) || !Array.isArray(matrix.global.historicalFrozenReadOnly)) errors.push('global deny sets are required');
  if (!matrix?.lanes || typeof matrix.lanes !== 'object') errors.push('lanes object is required');
  for (const [laneId, lane] of Object.entries(matrix?.lanes ?? {})) {
    if (!Array.isArray(lane.allowedPatterns) || lane.allowedPatterns.length === 0) errors.push(`${laneId}: allowedPatterns required`);
    if (!Array.isArray(lane.authorityExceptions)) errors.push(`${laneId}: authorityExceptions required`);
    for (const exception of lane.authorityExceptions ?? []) {
      if (/[*?]/.test(exception)) errors.push(`${laneId}: authority exception must be exact, not a glob: ${exception}`);
      if (!(lane.allowedPatterns ?? []).includes(exception)) errors.push(`${laneId}: authority exception must also be explicitly allowed: ${exception}`);
    }
    const descriptorPatterns = (lane.allowedPatterns ?? []).filter((p) => p.startsWith('config/components/'));
    if (descriptorPatterns.some((p) => /[*?]/.test(p))) errors.push(`${laneId}: component descriptor grants must be exact filenames`);
  }
  return errors;
}

export function validatePaths(matrix, laneId, inputPaths) {
  const violations = validateMatrixShape(matrix).map((message) => ({ code: 'MATRIX_INVALID', path: null, message }));
  const lane = matrix?.lanes?.[laneId];
  if (!lane) return { valid: false, laneId, paths: [], violations: [...violations, { code: 'UNKNOWN_LANE', path: null, message: `lane ${laneId} is not bound` }] };
  const enabler = lane.laneClass === 'ENABLER';
  if (!lane.writerAuthorized) violations.push({ code: 'LANE_NOT_AUTHORIZED', path: null, message: `lane ${laneId} is not writer-authorized` });
  if (!enabler && matrix.writerLanesAuthorized !== true) violations.push({ code: 'DOWNSTREAM_WRITERS_DISABLED', path: null, message: 'global downstream writer authorization is disabled' });
  if (!Array.isArray(inputPaths) || inputPaths.length === 0) violations.push({ code: 'NO_PATHS', path: null, message: 'at least one changed path is required' });

  const normalizedPaths = [];
  for (const raw of inputPaths ?? []) {
    let repoPath;
    try {
      repoPath = normalizeRepoPath(raw);
      normalizedPaths.push(repoPath);
    } catch (error) {
      violations.push({ code: 'INVALID_PATH', path: String(raw), message: error.message });
      continue;
    }

    const frozen = matchesAny(repoPath, matrix.global.historicalFrozenReadOnly);
    const convergenceOnly = matchesAny(repoPath, matrix.global.convergenceOwnerOnly);
    const exception = exactException(repoPath, lane.authorityExceptions);
    if ((frozen || convergenceOnly) && !exception) {
      violations.push({ code: frozen ? 'HISTORICAL_FROZEN' : 'CONVERGENCE_OWNER_ONLY', path: repoPath, message: 'path is denied before lane allow rules' });
      continue;
    }
    if (!matchesAny(repoPath, lane.allowedPatterns)) {
      violations.push({ code: 'NOT_ALLOWED', path: repoPath, message: 'path does not match this lane allowlist' });
      continue;
    }

    for (const [otherId, otherLane] of Object.entries(matrix.lanes)) {
      if (otherId === laneId) continue;
      if (matchesAny(repoPath, otherLane.reservedPatterns ?? [])) {
        violations.push({ code: 'OTHER_LANE_RESERVED', path: repoPath, message: `path is reserved by ${otherId}` });
        break;
      }
    }
  }
  return { valid: violations.length === 0, laneId, paths: normalizedPaths, violations };
}

export function loadMatrix(matrixPath = DEFAULT_MATRIX) {
  return JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
}

function parseArgs(argv) {
  const out = { paths: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`missing value for ${arg}`);
      return argv[i];
    };
    if (arg === '--matrix') out.matrix = next();
    else if (arg === '--lane') out.lane = next();
    else if (arg === '--path') out.paths.push(next());
    else if (arg === '--paths') out.paths.push(...next().split(',').filter(Boolean));
    else if (arg === '--paths-file') out.pathsFile = next();
    else if (arg === '--base-ref') out.baseRef = next();
    else if (arg === '--head-ref') out.headRef = next();
    else throw new Error(`unknown argument: ${arg}`);
  }
  return out;
}

function collectPaths(args) {
  const explicit = args.paths.length > 0;
  const file = Boolean(args.pathsFile);
  const diff = Boolean(args.baseRef || args.headRef);
  if ([explicit, file, diff].filter(Boolean).length !== 1) throw new Error('provide exactly one path source: --path/--paths, --paths-file, or --base-ref with --head-ref');
  if (diff) {
    if (!args.baseRef || !args.headRef) throw new Error('both --base-ref and --head-ref are required');
    const text = execFileSync('git', ['diff', '--name-only', `${args.baseRef}...${args.headRef}`], { encoding: 'utf8' });
    return text.split(/\r?\n/).filter(Boolean);
  }
  if (file) return fs.readFileSync(args.pathsFile, 'utf8').split(/\r?\n/).filter(Boolean);
  return args.paths;
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args.lane) throw new Error('--lane is required');
    const matrix = loadMatrix(args.matrix ?? DEFAULT_MATRIX);
    const result = validatePaths(matrix, args.lane, collectPaths(args));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.valid ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ valid: false, error: error.message }, null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();

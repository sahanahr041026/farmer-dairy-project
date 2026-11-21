// Guards against broken imports that neither esbuild nor Vitest's module transform will report:
// importing a name that the target module does not export only fails at runtime in the browser
// ("does not provide an export named ..."), after the page has already been built and "tested".
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CODE_EXT = ['.js', '.jsx'];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return CODE_EXT.includes(path.extname(e.name)) && !/\.test\.jsx?$/.test(e.name) ? [full] : [];
  });
}

function resolveModule(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [base, ...CODE_EXT.map((x) => base + x), ...CODE_EXT.map((x) => path.join(base, 'index' + x))];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
}

function exportsOf(file) {
  const src = fs.readFileSync(file, 'utf-8');
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?function\s*\*?\s*([\w$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s+(?:const|let|var|class)\s+([\w$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    m[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => names.add(s.split(/\s+as\s+/).pop()));
  }
  if (/export\s+default\b/.test(src)) names.add('default');
  return names;
}

const files = walk(SRC);
const problems = [];

function check(fromFile, spec, wanted) {
  const target = resolveModule(fromFile, spec);
  const rel = path.relative(SRC, fromFile).replace(/\\/g, '/');
  if (!target) {
    // Assets (css, images) are not code modules.
    if (!/\.(css|svg|png|jpe?g|json)$/.test(spec)) problems.push(`${rel}: cannot resolve '${spec}'`);
    return;
  }
  if (!CODE_EXT.includes(path.extname(target))) return;
  const available = exportsOf(target);
  for (const name of wanted) {
    if (!available.has(name)) problems.push(`${rel}: '${name}' is not exported by '${spec}'`);
  }
}

for (const file of files) {
  const src = fs.readFileSync(file, 'utf-8');

  // import { a, b as c } from './x'   and   import X, { a } from './x'
  for (const m of src.matchAll(/import\s*(?:[\w$]+\s*,\s*)?\{([^}]*)\}\s*from\s*['"](\.[^'"]+)['"]/g)) {
    const wanted = m[1].split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.split(/\s+as\s+/)[0]);
    check(file, m[2], wanted);
  }
  // import X from './x'   and   import X, { a } from './x'
  for (const m of src.matchAll(/import\s+([\w$]+)\s*(?:,\s*\{[^}]*\})?\s*from\s*['"](\.[^'"]+)['"]/g)) {
    check(file, m[2], ['default']);
  }
  // named(() => import('./pages/X'), 'X')  -- the lazy-route helper in App.jsx
  for (const m of src.matchAll(/named\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)\s*,\s*['"]([\w$]+)['"]\s*\)/g)) {
    check(file, m[1], [m[2]]);
  }
}

describe('module imports', () => {
  it('scans a meaningful number of source files', () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it('every relative import resolves and only imports names that exist', () => {
    expect(problems).toEqual([]);
  });
});

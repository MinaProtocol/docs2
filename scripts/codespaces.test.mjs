// Checks the "Open the example project in GitHub Codespaces" links on the
// tutorial pages against the configs in .devcontainer/. Run: npm run test:scripts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TUTORIALS = join(ROOT, 'docs/zkapps/tutorials');
const DEVCONTAINER = join(ROOT, '.devcontainer');
const LINK =
  /https:\/\/codespaces\.new\/MinaProtocol\/docs2\?quickstart=1&devcontainer_path=([^)\s]+)/g;
// o1js 3 requires Node.js 22.19.5 or later. The floating 22 tag follows the
// latest 22.x release; an older pinned tag such as 1-22-bookworm has 22.16.
const IMAGE = 'mcr.microsoft.com/devcontainers/javascript-node:22-bookworm';
const WORKSPACE = '/workspaces/${localWorkspaceFolderBasename}/examples/zkapps/';

function configs() {
  return readdirSync(DEVCONTAINER).filter((d) =>
    statSync(join(DEVCONTAINER, d)).isDirectory()
  );
}

function linksByPage() {
  const result = new Map();
  for (const file of readdirSync(TUTORIALS).filter((f) => f.endsWith('.mdx'))) {
    const text = readFileSync(join(TUTORIALS, file), 'utf8');
    const paths = [...text.matchAll(LINK)].map((m) => decodeURIComponent(m[1]));
    if (paths.length) result.set(file, paths);
  }
  return result;
}

test('each config uses a Node 22 image and an existing example folder', () => {
  const names = configs();
  assert.ok(names.length > 0);
  for (const name of names) {
    const config = JSON.parse(
      readFileSync(join(DEVCONTAINER, name, 'devcontainer.json'), 'utf8')
    );
    assert.equal(config.image, IMAGE, name);
    assert.ok(config.workspaceFolder.startsWith(WORKSPACE), name);
    const example = config.workspaceFolder.slice(WORKSPACE.length);
    assert.equal(example, name, `${name}: folder name and example differ`);
    assert.ok(existsSync(join(ROOT, 'examples/zkapps', example)), example);
    assert.match(config.postCreateCommand, /npm ci/, name);
  }
});

test('each link on a page points to an existing config', () => {
  for (const [page, paths] of linksByPage()) {
    for (const path of paths) {
      assert.ok(existsSync(join(ROOT, path)), `${page}: ${path} does not exist`);
    }
  }
});

test('each config is linked from exactly one tutorial page', () => {
  const linked = [...linksByPage().values()].flat();
  for (const name of configs()) {
    const path = `.devcontainer/${name}/devcontainer.json`;
    assert.equal(
      linked.filter((p) => p === path).length,
      1,
      `${path} is linked ${linked.filter((p) => p === path).length} times`
    );
  }
});

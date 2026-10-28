#!/usr/bin/env node
/**
 * Regenerates everything derived from static/graphql-api/schema.json, the
 * daemon GraphQL schema pinned to a mina release:
 *
 *   1. static/graphql-api/schema.graphql, the SDL form
 *      (scripts/generate-daemon-schema-sdl.mjs);
 *   2. docs/node-developers/graphql-api/reference, one page per operation
 *      and type, through the @graphql-markdown/docusaurus plugin that
 *      docusaurus.config.js configures;
 *   3. a `slug` on every generated category, so the category overview pages
 *      live under the reference path instead of Docusaurus's default
 *      /category/<label>, which also collides between the Operations and
 *      Deprecated sections;
 *   4. a `slug` on every page named index.mdx (the schema has a scalar called
 *      `Index`), which Docusaurus would otherwise serve at its folder's route,
 *      on top of the category overview.
 *
 * The output is committed. .github/workflows/check-daemon-schema.yml runs
 * this script and fails when the committed copy differs.
 *
 *   npm run generate-graphql-reference
 */
import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'node-developers/graphql-api/reference';
const REFERENCE_DIR = join(ROOT, 'docs', BASE_URL);

const run = (file, args) =>
  execFileSync(file, args, { cwd: ROOT, stdio: 'inherit' });

run(process.execPath, [
  join(ROOT, 'scripts', 'generate-daemon-schema-sdl.mjs'),
]);
run(join(ROOT, 'node_modules', '.bin', 'docusaurus'), ['graphql-to-doc']);

async function categoryFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await categoryFiles(path)));
    else if (entry.name === '_category_.yml') files.push(path);
  }
  return files;
}

let patched = 0;
for (const file of await categoryFiles(REFERENCE_DIR)) {
  const slug = '/' + join(BASE_URL, relative(REFERENCE_DIR, dirname(file)));
  const yml = await readFile(file, 'utf8');
  if (!/^link:\s*$/m.test(yml) || yml.includes('slug:')) continue;
  // `link:` is followed by indented `type:` and `title:` lines; add `slug:` to the block.
  const next = yml.replace(
    /^(link:\s*\n(?:[ \t]+\S.*\n)+)/m,
    `$1  slug: ${slug}\n`
  );
  if (next === yml) throw new Error(`Could not add a slug to ${file}`);
  await writeFile(file, next);
  patched += 1;
}
console.log(
  `Added a slug to ${patched} category files under ${relative(
    ROOT,
    REFERENCE_DIR
  )}`
);

// The schema has a scalar called `Index`, whose page is index.mdx. Docusaurus
// serves an index page at its folder's route, on top of the category overview,
// so every such page gets a slug of its own.
async function indexPages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await indexPages(path)));
    else if (entry.name === 'index.mdx') files.push(path);
  }
  return files;
}

for (const file of await indexPages(REFERENCE_DIR)) {
  const slug =
    '/' + join(BASE_URL, relative(REFERENCE_DIR, file)).replace(/\.mdx$/, '');
  const mdx = await readFile(file, 'utf8');
  if (/^slug:/m.test(mdx)) continue;
  const next = mdx.replace(/^(---\n(?:.*\n)*?)---\n/, `$1slug: ${slug}\n---\n`);
  if (next === mdx) throw new Error(`Could not add a slug to ${file}`);
  await writeFile(file, next);
  console.log(`Added slug ${slug} to ${relative(ROOT, file)}`);
}

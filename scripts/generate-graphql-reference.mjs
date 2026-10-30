#!/usr/bin/env node
/**
 * Regenerates the GraphQL reference pages and the derived schema files of the
 * two schemas this site publishes:
 *
 *   daemon   static/graphql-api/schema.json, pinned to a mina release, gives
 *            static/graphql-api/schema.graphql and
 *            docs/node-developers/graphql-api/reference;
 *   archive  static/archive-node-api/schema.graphql, pinned to an Archive
 *            Node API release, gives static/archive-node-api/schema.json and
 *            docs/node-operators/data-and-history/archive-node-api/reference.
 *
 * For each schema the script
 *
 *   1. writes the derived schema file (SDL from JSON, or JSON from SDL);
 *   2. generates one page per operation and type through the matching
 *      @graphql-markdown/docusaurus instance in docusaurus.config.js;
 *   3. adds a `slug` to every generated category, so the category overview
 *      pages live under the reference path instead of Docusaurus's default
 *      /category/<label>, which also collides between the Operations and
 *      Deprecated sections;
 *   4. adds a `slug` to every page named index.mdx (the daemon schema has a
 *      scalar called `Index`), which Docusaurus would otherwise serve at its
 *      folder's route, on top of the category overview.
 *
 * The output is committed. .github/workflows/check-daemon-schema.yml and
 * check-archive-schema.yml run this script and fail when the committed copy
 * differs.
 *
 *   npm run generate-graphql-reference              # both schemas
 *   npm run generate-graphql-reference -- archive   # one of: daemon, archive
 */
import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = {
  daemon: {
    baseURL: 'node-developers/graphql-api/reference',
    prepare: 'scripts/generate-daemon-schema-sdl.mjs',
    command: 'graphql-to-doc',
  },
  archive: {
    baseURL: 'node-operators/data-and-history/archive-node-api/reference',
    prepare: 'scripts/generate-archive-schema-json.mjs',
    command: 'graphql-to-doc:archive-node-api',
  },
};

const names = process.argv.slice(2);
if (names.length === 0) names.push(...Object.keys(TARGETS));
for (const name of names) {
  if (!(name in TARGETS)) {
    console.error(
      `Unknown schema "${name}"; expected one of: ${Object.keys(TARGETS).join(
        ', '
      )}`
    );
    process.exit(1);
  }
}

const run = (file, args) =>
  execFileSync(file, args, { cwd: ROOT, stdio: 'inherit' });

async function filesNamed(dir, name) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await filesNamed(path, name)));
    else if (entry.name === name) files.push(path);
  }
  return files;
}

async function generate({ baseURL, prepare, command }) {
  const referenceDir = join(ROOT, 'docs', baseURL);

  run(process.execPath, [join(ROOT, prepare)]);
  run(join(ROOT, 'node_modules', '.bin', 'docusaurus'), [command]);

  let patched = 0;
  for (const file of await filesNamed(referenceDir, '_category_.yml')) {
    const slug = '/' + join(baseURL, relative(referenceDir, dirname(file)));
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
    `Added a slug to ${patched} category files under docs/${baseURL}`
  );

  for (const file of await filesNamed(referenceDir, 'index.mdx')) {
    const slug =
      '/' + join(baseURL, relative(referenceDir, file)).replace(/\.mdx$/, '');
    const mdx = await readFile(file, 'utf8');
    if (/^slug:/m.test(mdx)) continue;
    const next = mdx.replace(
      /^(---\n(?:.*\n)*?)---\n/,
      `$1slug: ${slug}\n---\n`
    );
    if (next === mdx) throw new Error(`Could not add a slug to ${file}`);
    await writeFile(file, next);
    console.log(`Added slug ${slug} to ${relative(ROOT, file)}`);
  }
}

for (const name of names) await generate(TARGETS[name]);

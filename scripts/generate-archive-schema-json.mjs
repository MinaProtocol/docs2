#!/usr/bin/env node
/**
 * Builds static/archive-node-api/schema.json, the introspection form of
 * static/archive-node-api/schema.graphql, for tools that read JSON rather than
 * SDL (Relay, some IDE plugins). The output is `{ "__schema": ... }`, which
 * graphql-js `buildClientSchema` and graphql-codegen accept.
 *
 * scripts/generate-graphql-reference.mjs runs it before generating the
 * reference pages, and .github/workflows/check-archive-schema.yml fails when
 * the committed output is stale:
 *
 *   npm run generate-graphql-reference -- archive
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildSchema, introspectionFromSchema } = require('graphql');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SDL = join(ROOT, 'static', 'archive-node-api', 'schema.graphql');
const OUT = join(ROOT, 'static', 'archive-node-api', 'schema.json');

const sdl = await readFile(SDL, 'utf8');
const schema = buildSchema(sdl);
const introspection = introspectionFromSchema(schema, {
  descriptions: true,
  specifiedByUrl: true,
  directiveIsRepeatable: true,
  schemaDescription: true,
  inputValueDeprecation: true,
});
await writeFile(OUT, JSON.stringify(introspection, null, 2) + '\n');
console.log(`Generated ${OUT} (${introspection.__schema.types.length} types)`);

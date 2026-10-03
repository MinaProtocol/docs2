#!/usr/bin/env node

/**
 * Generates static/llms-full.txt — a single file containing all documentation
 * pages concatenated together for LLM consumption.
 *
 * Each page is separated by YAML front matter with the URL path.
 * Run before or during build: node scripts/generate-llms-txt.mjs
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, dirname, basename, extname } from 'node:path';
import mdxToMarkdownModule from './mdx-to-markdown.cjs';

// The same conversion makes the markdown twin of each page
// (plugins/markdown-twins.cjs), so the two cannot disagree.
const { mdxToMarkdown } = mdxToMarkdownModule;

const DOCS_DIR = new URL('../docs', import.meta.url).pathname;
const OUTPUT_FILE = new URL('../static/llms-full.txt', import.meta.url).pathname;

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Same shape as the Docusaurus default numberPrefixParser.
const NUMBER_PREFIX = /^\d+\s*[-_.]\s*/;

function filePathToUrl(filePath) {
  let rel = relative(DOCS_DIR, filePath);
  // Remove extension
  rel = rel.replace(/\.mdx?$/, '');
  // index files map to the directory
  if (basename(rel) === 'index') {
    rel = dirname(rel);
  }
  if (rel === '.') return '/';
  // Docusaurus strips a leading number prefix ("09-recursion") from the route,
  // so the generated URL has to strip it too.
  rel = rel
    .split('/')
    .map((segment) => segment.replace(NUMBER_PREFIX, ''))
    .join('/');
  return '/' + rel;
}

async function main() {
  const files = (await collectFiles(DOCS_DIR)).sort();
  const parts = [];

  for (const file of files) {
    const raw = await readFile(file, 'utf8');
    const url = filePathToUrl(file);
    // Strips front matter, MDX imports and JSX, and resolves #include_code
    // the same way the site build does.
    const content = mdxToMarkdown(raw, { from: relative(join(DOCS_DIR, '..'), file) });

    if (!content) continue;

    parts.push(`---\nurl: ${url}\n---\n\n${content}`);
  }

  await mkdir(dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, parts.join('\n\n'), 'utf8');

  console.log(`Generated ${OUTPUT_FILE} with ${parts.length} pages`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

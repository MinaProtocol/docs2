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

function filePathToUrl(filePath) {
  let rel = relative(DOCS_DIR, filePath);
  // Remove extension
  rel = rel.replace(/\.mdx?$/, '');
  // index files map to the directory
  if (basename(rel) === 'index') {
    rel = dirname(rel);
  }
  if (rel === '.') return '/';
  return '/' + rel;
}

function stripFrontMatter(content) {
  // Remove YAML front matter (between --- delimiters)
  const match = content.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
  if (match) {
    return content.slice(match[0].length);
  }
  return content;
}

function stripImportsAndJsx(content) {
  // Remove import statements
  content = content.replace(/^import\s+.*$/gm, '');
  // Remove JSX-only lines (self-closing component tags)
  content = content.replace(/^<[A-Z]\w+[^>]*\/>\s*$/gm, '');
  return content;
}

async function main() {
  const files = (await collectFiles(DOCS_DIR)).sort();
  const parts = [];

  for (const file of files) {
    const raw = await readFile(file, 'utf8');
    const url = filePathToUrl(file);
    const content = stripImportsAndJsx(stripFrontMatter(raw)).trim();

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

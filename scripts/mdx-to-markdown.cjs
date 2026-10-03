/**
 * Turn the raw source of a docs page (.md or .mdx) into plain markdown that
 * an agent can read without an MDX parser.
 *
 * One conversion, two outputs:
 *   - static/llms-full.txt (scripts/generate-llms-txt.mjs);
 *   - the markdown twin `<route>.md` of every page (plugins/markdown-twins.cjs).
 * Both call mdxToMarkdown(), so they cannot disagree.
 *
 * The conversion:
 *   - removes the YAML front matter;
 *   - removes MDX `import` lines and lines that are only a self-closing JSX
 *     component (`<Subscribe />`);
 *   - replaces each `#include_code` directive with the code block that the
 *     site renders (scripts/include-code.cjs). This step comes after the
 *     import removal, so the import lines of the included code stay.
 * Admonitions (`:::note ... :::`) stay as they are: they are readable text.
 */

'use strict';

const { resolveIncludesInMarkdown } = require('./include-code.cjs');

function stripFrontMatter(content) {
  const match = content.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
  return match ? content.slice(match[0].length) : content;
}

function stripImportsAndJsx(content) {
  return content
    .replace(/^import\s+.*$/gm, '')
    .replace(/^<[A-Z]\w+[^>]*\/>\s*$/gm, '');
}

/**
 * @param {string} raw   the page source, front matter included
 * @param {object} [options]
 * @param {string} [options.from]  page path for #include_code error messages
 * @param {string} [options.root]  repository root for #include_code paths
 * @returns {string} trimmed markdown
 */
function mdxToMarkdown(raw, options = {}) {
  return resolveIncludesInMarkdown(stripImportsAndJsx(stripFrontMatter(raw)), options).trim();
}

/**
 * The full twin of one page: a `# <title>` heading, the description, the
 * canonical URL, then the converted body. When the body starts with its own
 * H1, the site renders that H1 as the page title, so the twin uses it and
 * does not repeat it.
 */
function renderTwin({ title, description, url, body }) {
  let heading = title;
  const h1 = body.match(/^#[ \t]+(.+?)[ \t]*(?:\n|$)/);
  if (h1) {
    heading = h1[1];
    body = body.slice(h1[0].length).trim();
  }
  const parts = [`# ${heading}`];
  if (description) parts.push(`> ${description.replace(/\s*\n\s*/g, ' ')}`);
  parts.push(`Canonical URL: ${url}`);
  if (body) parts.push(body);
  return parts.join('\n\n') + '\n';
}

module.exports = { stripFrontMatter, stripImportsAndJsx, mdxToMarkdown, renderTwin };

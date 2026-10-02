/**
 * #include_code — build code blocks in the docs from named regions of the
 * example sources, so that a page cannot drift from the code CI runs.
 *
 * In an example source file, mark a region with comment lines:
 *
 *   // docs:start mint-method
 *   ...code...
 *   // docs:end mint-method
 *
 * `#` and `<!--` comments are accepted too, for shell, YAML and HTML sources.
 *
 * In a .md or .mdx page, a paragraph that is exactly one directive line:
 *
 *   #include_code mint-method examples/zkapps/05-tokens/src/Token.ts ts title="src/Token.ts"
 *
 * is replaced by a fenced code block with that region's lines. The path is
 * relative to the repository root. `title="..."` is optional.
 *
 * Output rules:
 *   - the region's own marker lines are not in the output;
 *   - marker lines of any other region inside it are not in the output;
 *   - the common leading whitespace is removed (dedent);
 *   - blank lines at the start and end are removed.
 *
 * A missing file, a missing region, an unclosed region, a duplicate region, an
 * empty region or a malformed directive throws. The build then fails; it never
 * renders an empty block.
 *
 * Used by the remark plugin (docusaurus.config.js) and by
 * scripts/generate-llms-txt.mjs, so the site and llms-full.txt agree.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');

// `// docs:start name`, `# docs:end name`, `<!-- docs:start name -->`
const MARKER = /^\s*(?:\/\/|#|<!--)\s*docs:(start|end)\s+([A-Za-z0-9_.-]+)\s*(?:-->)?\s*$/;

// `#include_code <region> <path> <lang> [title="..."]`
const DIRECTIVE =
  /^#include_code\s+([A-Za-z0-9_.-]+)\s+(\S+)\s+([A-Za-z0-9_+-]+)(?:\s+title="([^"]*)")?\s*$/;

class IncludeCodeError extends Error {
  constructor(message) {
    super(`#include_code: ${message}`);
    this.name = 'IncludeCodeError';
  }
}

function dedent(lines) {
  let min = Infinity;
  for (const line of lines) {
    if (line.trim() === '') continue;
    const indent = line.match(/^[ \t]*/)[0].length;
    if (indent < min) min = indent;
  }
  if (min === Infinity) min = 0;
  return lines.map((line) => (line.trim() === '' ? '' : line.slice(min)));
}

function trimBlankEdges(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start++;
  while (end > start && lines[end - 1].trim() === '') end--;
  return lines.slice(start, end);
}

/**
 * Return the contents of region `region` in `source`, dedented, without any
 * marker lines. `where` names the source in error messages.
 */
function extractRegion(source, region, where = '<source>') {
  const lines = source.split(/\r?\n/);
  let startLine = -1;
  let endLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(MARKER);
    if (!m || m[2] !== region) continue;
    if (m[1] === 'start') {
      if (startLine !== -1) {
        throw new IncludeCodeError(
          `region "${region}" starts twice in ${where} (lines ${startLine + 1} and ${i + 1})`
        );
      }
      startLine = i;
    } else {
      if (startLine === -1) {
        throw new IncludeCodeError(
          `region "${region}" ends at line ${i + 1} of ${where} before it starts`
        );
      }
      if (endLine !== -1) {
        throw new IncludeCodeError(`region "${region}" ends twice in ${where}`);
      }
      endLine = i;
    }
  }

  if (startLine === -1) {
    throw new IncludeCodeError(`region "${region}" not found in ${where}`);
  }
  if (endLine === -1) {
    throw new IncludeCodeError(
      `region "${region}" starts at line ${startLine + 1} of ${where} but never ends`
    );
  }

  const body = lines
    .slice(startLine + 1, endLine)
    .filter((line) => !MARKER.test(line));
  const out = trimBlankEdges(dedent(body));
  if (out.length === 0) {
    throw new IncludeCodeError(`region "${region}" in ${where} is empty`);
  }
  return out.join('\n');
}

/** Parse one directive line. Returns null if the line is not a directive. */
function parseDirective(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('#include_code')) return null;
  const m = trimmed.match(DIRECTIVE);
  if (!m) {
    throw new IncludeCodeError(
      `malformed directive "${trimmed}". Expected: #include_code <region> <path-from-repo-root> <lang> [title="..."]`
    );
  }
  return { region: m[1], file: m[2], lang: m[3], title: m[4] };
}

/** Read the file and return { code, lang, title }. */
function resolveInclude(directive, { root = REPO_ROOT, from } = {}) {
  const { region, file, lang, title } = directive;
  const context = from ? ` (included from ${from})` : '';
  if (path.isAbsolute(file) || file.split(/[\\/]/).includes('..')) {
    throw new IncludeCodeError(
      `path "${file}" must be relative to the repository root and stay inside it${context}`
    );
  }
  const abs = path.join(root, file);
  let source;
  try {
    source = fs.readFileSync(abs, 'utf8');
  } catch (err) {
    throw new IncludeCodeError(`cannot read file "${file}"${context}: ${err.code || err.message}`);
  }
  let code;
  try {
    code = extractRegion(source, region, file);
  } catch (err) {
    if (err instanceof IncludeCodeError && context) err.message += context;
    throw err;
  }
  return { code, lang, title };
}

function fence(code) {
  // Use a fence longer than any backtick run in the code.
  const longest = Math.max(2, ...(code.match(/`+/g) || []).map((s) => s.length));
  return '`'.repeat(longest + 1);
}

/**
 * Replace every directive line in raw markdown with a fenced code block.
 * Used for llms-full.txt. The block keeps the directive line's indentation.
 */
function resolveIncludesInMarkdown(markdown, options = {}) {
  let inFence = null;
  return markdown
    .split('\n')
    .map((line) => {
      const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
      if (fenceMatch) {
        if (inFence === null) inFence = fenceMatch[1];
        else if (fenceMatch[1][0] === inFence[0] && fenceMatch[1].length >= inFence.length)
          inFence = null;
        return line;
      }
      if (inFence !== null) return line;
      const directive = parseDirective(line);
      if (!directive) return line;
      const indent = line.match(/^\s*/)[0];
      const { code, lang, title } = resolveInclude(directive, options);
      const f = fence(code);
      const meta = title ? ` title="${title}"` : '';
      return [f + lang + meta, ...code.split('\n'), f]
        .map((l) => (l === '' ? '' : indent + l))
        .join('\n');
    })
    .join('\n');
}

function visit(node, fn, parent = null, index = null) {
  fn(node, parent, index);
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) visit(node.children[i], fn, node, i);
  }
}

function paragraphSource(node, file) {
  const src = file && typeof file.value === 'string' ? file.value : null;
  const pos = node.position;
  if (src && pos && pos.start.offset != null && pos.end.offset != null) {
    return src.slice(pos.start.offset, pos.end.offset);
  }
  // Fallback: concatenate text children.
  return (node.children || []).map((c) => c.value || '').join('');
}

/** Remark plugin: replace directive paragraphs with code nodes. */
function remarkIncludeCode(options = {}) {
  return (tree, file) => {
    const replacements = [];
    visit(tree, (node, parent, index) => {
      if (node.type !== 'paragraph' || !parent) return;
      const first = node.children && node.children[0];
      if (!first || first.type !== 'text' || !first.value.startsWith('#include_code')) return;
      const raw = paragraphSource(node, file).trim();
      if (raw.includes('\n')) {
        throw new IncludeCodeError(
          `directive must be alone in its paragraph (add blank lines around it): "${raw}" in ${file.path}`
        );
      }
      const directive = parseDirective(raw);
      const { code, lang, title } = resolveInclude(directive, { ...options, from: file.path });
      replacements.push({
        parent,
        index,
        node: {
          type: 'code',
          lang,
          meta: title ? `title="${title}"` : null,
          value: code,
          position: node.position,
        },
      });
    });
    for (const { parent, index, node } of replacements) parent.children[index] = node;
  };
}

module.exports = {
  IncludeCodeError,
  extractRegion,
  parseDirective,
  resolveInclude,
  resolveIncludesInMarkdown,
  remarkIncludeCode,
  REPO_ROOT,
};

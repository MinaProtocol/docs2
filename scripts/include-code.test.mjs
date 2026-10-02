// Unit tests for scripts/include-code.cjs. Run: npm run test:scripts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import includeCode from './include-code.cjs';

const {
  extractRegion,
  parseDirective,
  resolveInclude,
  resolveIncludesInMarkdown,
  remarkIncludeCode,
} = includeCode;

const SOURCE = `import { Field } from 'o1js';

// docs:start whole
export class Square {
  // docs:start field
  num = 3;
  // docs:end field

  // docs:start method
  update(square) {
    this.num = square;
  }
  // docs:end method
}
// docs:end whole
`;

function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), 'include-code-'));
  mkdirSync(join(root, 'examples'), { recursive: true });
  writeFileSync(join(root, 'examples/Square.ts'), SOURCE);
  return root;
}

test('extracts a region (happy path)', () => {
  assert.equal(
    extractRegion(SOURCE, 'whole'),
    [
      'export class Square {',
      '  num = 3;',
      '',
      '  update(square) {',
      '    this.num = square;',
      '  }',
      '}',
    ].join('\n')
  );
});

test('dedents an indented region', () => {
  assert.equal(
    extractRegion(SOURCE, 'method'),
    ['update(square) {', '  this.num = square;', '}'].join('\n')
  );
  assert.equal(extractRegion(SOURCE, 'field'), 'num = 3;');
});

test('strips markers of nested regions of other names', () => {
  const out = extractRegion(SOURCE, 'whole');
  assert.doesNotMatch(out, /docs:(start|end)/);
});

test('strips markers of overlapping regions and other comment styles', () => {
  const src = [
    '# docs:start a',
    'one',
    '# docs:start b',
    'two',
    '<!-- docs:end a -->',
    'three',
    '# docs:end b',
  ].join('\n');
  assert.equal(extractRegion(src, 'a'), 'one\ntwo');
  assert.equal(extractRegion(src, 'b'), 'two\nthree');
});

test('missing region fails with a clear error', () => {
  assert.throws(() => extractRegion(SOURCE, 'nope', 'Square.ts'), {
    name: 'IncludeCodeError',
    message: /region "nope" not found in Square\.ts/,
  });
});

test('unclosed, duplicate and empty regions fail', () => {
  assert.throws(() => extractRegion('// docs:start a\nx', 'a'), /never ends/);
  assert.throws(
    () => extractRegion('// docs:start a\nx\n// docs:end a\n// docs:start a\n// docs:end a', 'a'),
    /starts twice/
  );
  assert.throws(() => extractRegion('// docs:start a\n\n// docs:end a', 'a'), /is empty/);
  assert.throws(() => extractRegion('// docs:end a\n// docs:start a', 'a'), /before it starts/);
});

test('missing file fails with a clear error', () => {
  const root = fixtureRoot();
  assert.throws(
    () =>
      resolveInclude(
        { region: 'whole', file: 'examples/Missing.ts', lang: 'ts' },
        { root, from: 'docs/page.mdx' }
      ),
    { name: 'IncludeCodeError', message: /cannot read file "examples\/Missing\.ts" \(included from docs\/page\.mdx\)/ }
  );
});

test('paths outside the repository are refused', () => {
  assert.throws(
    () => resolveInclude({ region: 'a', file: '../etc/passwd', lang: 'ts' }),
    /must be relative to the repository root/
  );
});

test('parses directives, and rejects malformed ones', () => {
  assert.deepEqual(parseDirective('#include_code whole examples/Square.ts ts title="src/Square.ts"'), {
    region: 'whole',
    file: 'examples/Square.ts',
    lang: 'ts',
    title: 'src/Square.ts',
  });
  assert.equal(parseDirective('plain text'), null);
  assert.throws(() => parseDirective('#include_code whole'), /malformed directive/);
});

test('resolves directives in raw markdown, keeping indentation, skipping fences', () => {
  const root = fixtureRoot();
  const md = [
    'Intro',
    '',
    '  #include_code field examples/Square.ts ts title="src/Square.ts"',
    '',
    '```md',
    '#include_code not-resolved-inside-a-fence x ts',
    '```',
  ].join('\n');
  assert.equal(
    resolveIncludesInMarkdown(md, { root }),
    [
      'Intro',
      '',
      '  ```ts title="src/Square.ts"',
      '  num = 3;',
      '  ```',
      '',
      '```md',
      '#include_code not-resolved-inside-a-fence x ts',
      '```',
    ].join('\n')
  );
});

test('remark plugin replaces a directive paragraph with a code node', () => {
  const root = fixtureRoot();
  const value = '#include_code method examples/Square.ts ts';
  const paragraph = {
    type: 'paragraph',
    children: [{ type: 'text', value }],
    position: { start: { offset: 0 }, end: { offset: value.length } },
  };
  const tree = { type: 'root', children: [paragraph] };
  remarkIncludeCode({ root })(tree, { value, path: 'page.mdx' });
  assert.deepEqual(tree.children[0], {
    type: 'code',
    lang: 'ts',
    meta: null,
    value: 'update(square) {\n  this.num = square;\n}',
    position: paragraph.position,
  });
});

test('remark plugin fails the build on a missing region', () => {
  const root = fixtureRoot();
  const value = '#include_code nope examples/Square.ts ts';
  const tree = {
    type: 'root',
    children: [{ type: 'paragraph', children: [{ type: 'text', value }] }],
  };
  assert.throws(
    () => remarkIncludeCode({ root })(tree, { value, path: 'page.mdx' }),
    /region "nope" not found in examples\/Square\.ts \(included from page\.mdx\)/
  );
});

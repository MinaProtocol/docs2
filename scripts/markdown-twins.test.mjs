// Unit tests for the markdown twins: scripts/mdx-to-markdown.cjs,
// scripts/markdown-twin-path.cjs and plugins/markdown-twins.cjs.
// Run: npm run test:scripts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import mdxToMarkdownModule from './mdx-to-markdown.cjs';
import twinPathModule from './markdown-twin-path.cjs';
import twinsPlugin from '../plugins/markdown-twins.cjs';

const require = createRequire(import.meta.url);
const { mdxToMarkdown, renderTwin } = mdxToMarkdownModule;
const { markdownTwinPath } = twinPathModule;
const { collectTwins, writeTwins } = twinsPlugin;

const EXAMPLE = `import { Field, SmartContract, state, State } from 'o1js';

// docs:start square
export class Square extends SmartContract {
  @state(Field) num = State<Field>();
}
// docs:end square
`;

const HELLO_WORLD = `---
title: 'Tutorial 1: Hello World'
description: Write your first zkApp.
---

import Subscribe from '@site/src/components/common/Subscribe';

# Tutorial 1: Hello World

<Subscribe />

:::tip

Run the tests with \`npm test\`.

:::

The contract:

#include_code square examples/Square.ts ts title="src/Square.ts"

Done.
`;

const WELCOME = `---
title: Welcome
description: Start here.
slug: /
---

Mina is a succinct blockchain.
`;

/** A small Docusaurus site: two docs and one example source. */
function fixtureSite() {
  const root = mkdtempSync(join(tmpdir(), 'markdown-twins-'));
  mkdirSync(join(root, 'examples'), { recursive: true });
  mkdirSync(join(root, 'docs/zkapps/tutorials'), { recursive: true });
  writeFileSync(join(root, 'examples/Square.ts'), EXAMPLE);
  writeFileSync(join(root, 'docs/zkapps/tutorials/01-hello-world.mdx'), HELLO_WORLD);
  writeFileSync(join(root, 'docs/welcome.mdx'), WELCOME);
  return root;
}

test('converts MDX: drops front matter, imports and JSX, keeps admonitions, resolves #include_code', () => {
  const root = fixtureSite();
  const md = mdxToMarkdown(HELLO_WORLD, { root, from: 'docs/zkapps/tutorials/01-hello-world.mdx' });

  assert.doesNotMatch(md, /^---/);
  assert.doesNotMatch(md, /description:/);
  assert.doesNotMatch(md, /import Subscribe/);
  assert.doesNotMatch(md, /<Subscribe/);
  assert.doesNotMatch(md, /#include_code/);
  assert.match(md, /^# Tutorial 1: Hello World/);
  assert.match(md, /:::tip\n\nRun the tests with `npm test`\.\n\n:::/);
  assert.ok(
    md.includes(
      [
        '```ts title="src/Square.ts"',
        'export class Square extends SmartContract {',
        '  @state(Field) num = State<Field>();',
        '}',
        '```',
      ].join('\n')
    )
  );
});

test('renders a twin with title, description and canonical URL, without a second H1', () => {
  const twin = renderTwin({
    title: 'Front matter title',
    description: 'Write your first zkApp.',
    url: 'https://docs.minaprotocol.com/zkapps/tutorials/hello-world',
    body: '# Tutorial 1: Hello World\n\nText.',
  });
  assert.equal(
    twin,
    [
      '# Tutorial 1: Hello World',
      '',
      '> Write your first zkApp.',
      '',
      'Canonical URL: https://docs.minaprotocol.com/zkapps/tutorials/hello-world',
      '',
      'Text.',
      '',
    ].join('\n')
  );
  assert.match(renderTwin({ title: 'T', url: 'u', body: 'Text.' }), /^# T\n\nCanonical URL: u\n\nText\.\n$/);
});

test('maps a permalink to its twin path', () => {
  assert.equal(markdownTwinPath('/zkapps/tutorials/hello-world'), '/zkapps/tutorials/hello-world.md');
  assert.equal(markdownTwinPath('/zkapps/tutorials/'), '/zkapps/tutorials.md');
  assert.equal(markdownTwinPath('/'), '/index.md');
});

// Route mapping end to end: the real Docusaurus docs plugin computes the
// permalinks (number prefix removed, `slug` applied) and the twin follows them.
test('uses the routes that the Docusaurus docs plugin computes', async () => {
  const siteDir = fixtureSite();
  const { default: pluginContentDocs } = require('@docusaurus/plugin-content-docs');
  const { DEFAULT_OPTIONS } = require('@docusaurus/plugin-content-docs/lib/options.js');
  const { DEFAULT_CONFIG } = require('@docusaurus/core/lib/server/configValidation.js');
  // The settings of docusaurus.config.js that change routes.
  const siteConfig = {
    ...DEFAULT_CONFIG,
    title: 'fixture',
    url: 'https://docs.minaprotocol.com',
    baseUrl: '/',
    trailingSlash: false,
  };
  const context = {
    siteDir,
    siteConfig,
    baseUrl: '/',
    generatedFilesDir: join(siteDir, '.docusaurus'),
    localizationDir: join(siteDir, 'i18n/en'),
    i18n: {
      currentLocale: 'en',
      defaultLocale: 'en',
      locales: ['en'],
      path: 'i18n',
      localeConfigs: { en: { label: 'English', direction: 'ltr', htmlLang: 'en', path: 'en' } },
    },
  };
  const plugin = await pluginContentDocs(context, {
    ...DEFAULT_OPTIONS,
    id: 'default',
    path: 'docs',
    routeBasePath: '/',
    sidebarPath: false,
  });
  const content = await plugin.loadContent();

  const twins = collectTwins(content, { siteDir, siteUrl: siteConfig.url });
  const byPath = Object.fromEntries(twins.map((t) => [t.twinPath, t]));
  assert.deepEqual(Object.keys(byPath).sort(), ['/index.md', '/zkapps/tutorials/hello-world.md']);
  assert.equal(
    byPath['/zkapps/tutorials/hello-world.md'].url,
    'https://docs.minaprotocol.com/zkapps/tutorials/hello-world'
  );
  assert.equal(byPath['/index.md'].url, 'https://docs.minaprotocol.com/');

  const outDir = join(siteDir, 'build');
  await writeTwins(twins, { outDir, siteDir, root: siteDir });
  assert.equal(
    readFileSync(join(outDir, 'index.md'), 'utf8'),
    '# Welcome\n\n> Start here.\n\nCanonical URL: https://docs.minaprotocol.com/\n\nMina is a succinct blockchain.\n'
  );
  const hello = readFileSync(join(outDir, 'zkapps/tutorials/hello-world.md'), 'utf8');
  assert.match(hello, /^# Tutorial 1: Hello World\n\n> Write your first zkApp\.\n\nCanonical URL: https:\/\/docs\.minaprotocol\.com\/zkapps\/tutorials\/hello-world\n/);
  assert.ok(hello.includes('  @state(Field) num = State<Field>();'));
  assert.doesNotMatch(hello, /#include_code|<Subscribe/);
});

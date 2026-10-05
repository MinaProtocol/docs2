/**
 * Docusaurus plugin: write a markdown twin `<route>.md` next to the HTML of
 * every doc page, so an agent can fetch the docs without parsing HTML.
 *
 *   https://docs.minaprotocol.com/zkapps/tutorials/hello-world     (HTML)
 *   https://docs.minaprotocol.com/zkapps/tutorials/hello-world.md  (markdown)
 *
 * The route is the permalink that the docs plugin computed (number prefixes
 * removed, `slug` front matter applied), never one derived again from the
 * file name. The body comes from scripts/mdx-to-markdown.cjs, the conversion
 * that also makes static/llms-full.txt.
 *
 * The twins are written in postBuild, into the build output only. They are
 * not committed.
 */

'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { mdxToMarkdown, renderTwin } = require('../scripts/mdx-to-markdown.cjs');
const { markdownTwinPath } = require('../scripts/markdown-twin-path.cjs');

const DOCS_PLUGIN = 'docusaurus-plugin-content-docs';

/** `@site/docs/a.mdx` -> absolute path. */
function sourceToPath(source, siteDir) {
  return path.join(siteDir, source.replace(/^@site\//, ''));
}

/**
 * One entry per doc page of a loaded docs plugin content:
 * { twinPath, url, sourcePath, title, description }.
 */
function collectTwins(docsContent, { siteDir, siteUrl }) {
  const twins = [];
  for (const version of docsContent.loadedVersions) {
    for (const doc of version.docs) {
      twins.push({
        twinPath: markdownTwinPath(doc.permalink),
        url: siteUrl.replace(/\/+$/, '') + doc.permalink,
        sourcePath: sourceToPath(doc.source, siteDir),
        title: doc.title,
        description: doc.description,
      });
    }
  }
  return twins;
}

/** `root` is the base of #include_code paths; it defaults to the repository root. */
async function writeTwins(twins, { outDir, siteDir, root }) {
  await Promise.all(
    twins.map(async (twin) => {
      const raw = await fs.readFile(twin.sourcePath, 'utf8');
      const body = mdxToMarkdown(raw, { from: path.relative(siteDir, twin.sourcePath), root });
      const file = path.join(outDir, twin.twinPath);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, renderTwin({ ...twin, body }), 'utf8');
    })
  );
}

function markdownTwinsPlugin(context) {
  return {
    name: 'markdown-twins',
    async postBuild({ plugins, outDir }) {
      const started = Date.now();
      const docsPlugins = plugins.filter((p) => p.name === DOCS_PLUGIN);
      const twins = docsPlugins.flatMap((p) =>
        collectTwins(p.content, { siteDir: context.siteDir, siteUrl: context.siteConfig.url })
      );
      await writeTwins(twins, { outDir, siteDir: context.siteDir });
      console.log(
        `[markdown-twins] wrote ${twins.length} markdown twins in ${Date.now() - started} ms`
      );
    },
  };
}

module.exports = markdownTwinsPlugin;
module.exports.collectTwins = collectTwins;
module.exports.writeTwins = writeTwins;

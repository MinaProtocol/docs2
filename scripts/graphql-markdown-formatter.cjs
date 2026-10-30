/**
 * MDX formatter for @graphql-markdown/docusaurus, used by the plugin entry in
 * docusaurus.config.js.
 *
 * The stock Docusaurus formatter writes each field heading's id as an MDX
 * comment (`{/* #id *\/}`), a form that only Docusaurus 3.10 and later turn
 * into a heading id. On this site's Docusaurus version the comment renders as
 * nothing, and every `(#id)` link in the generated reference is a broken
 * anchor. This formatter keeps everything else and writes the classic
 * escaped form, `\{#id\}`, which every Docusaurus 3 release understands.
 */
'use strict';

// The plugin's own MDX module: the Docusaurus formatter plus the lifecycle
// hook that writes the _category_.yml files.
const docusaurus = require('@graphql-markdown/docusaurus/mdx');

const formatMDXPermalink = (id) => String.raw`\{#${id}\}`;

module.exports = {
  ...docusaurus,
  formatMDXPermalink,
  createMDXFormatter: (meta) => ({
    ...docusaurus.createMDXFormatter(meta),
    formatMDXPermalink,
  }),
};

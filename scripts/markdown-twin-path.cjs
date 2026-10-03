/**
 * URL path of the markdown twin of a page, from the permalink that Docusaurus
 * computed for the page. No dependencies: the site bundle uses it too
 * (src/theme/DocItem/Layout adds <link rel="alternate" type="text/markdown">).
 *
 *   /zkapps/tutorials/hello-world -> /zkapps/tutorials/hello-world.md
 *   /zkapps/tutorials/            -> /zkapps/tutorials.md
 *   /                             -> /index.md
 */

'use strict';

function markdownTwinPath(permalink) {
  const path = permalink.replace(/\/+$/, '');
  return path === '' ? '/index.md' : `${path}.md`;
}

module.exports = { markdownTwinPath };

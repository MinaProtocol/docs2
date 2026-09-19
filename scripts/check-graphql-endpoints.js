#!/usr/bin/env node

/**
 * Check that every GraphQL endpoint the documentation recommends answers.
 *
 * A reader who follows a tutorial types these URLs into a config file or a
 * `Mina.Network(...)` call. If one stops answering, nothing in the build
 * notices: the page still renders, the link checker still sees prose, and
 * the reader is left with a client that hangs. MinaProtocol/docs2#840 sat
 * open for two years for exactly that reason.
 *
 * Each endpoint is sent `{ __typename }`, the smallest query every GraphQL
 * server answers, and is retried before it is called a failure, because a
 * single timeout is noise rather than news.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const SEARCH_DIRS = [path.join(ROOT, 'docs'), path.join(ROOT, 'examples')];
// `.json` matters as much as prose: a zkApp CLI `config.json` holds the
// endpoint the reader actually deploys against.
const SEARCH_EXTENSIONS = ['.mdx', '.md', '.ts', '.tsx', '.json'];

// Endpoints, not explorer or website links: a GraphQL path, or an archive
// node API host, which serves GraphQL at its root.
const ENDPOINT_PATTERN =
  /https:\/\/[a-z0-9.-]+(?:\/[a-z0-9/._-]*graphql|archive-node-api[a-z0-9./-]*)/gi;

const TIMEOUT_MS = 20000;
const ATTEMPTS = 3;
const QUERY = JSON.stringify({ query: '{ __typename }' });

// Placeholders and third-party examples the reader is meant to replace.
const IGNORED = [
  /example\.com/i,
  /your-mina-node/i,
  /github\.com/i,
  /minaprotocol\.com\/docs/i,
  /garethtdavies\.com/i,
];

function findFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (item === 'node_modules' || item === 'build' || item.startsWith('.')) continue;
      files.push(...findFiles(fullPath));
    } else if (SEARCH_EXTENSIONS.includes(path.extname(item))) {
      files.push(fullPath);
    }
  }

  return files;
}

function collectEndpoints() {
  const found = new Map(); // url -> Set of files

  for (const dir of SEARCH_DIRS) {
    for (const file of findFiles(dir)) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const match of content.matchAll(ENDPOINT_PATTERN)) {
        const url = match[0].replace(/[.,;:'"`]+$/, '');
        if (IGNORED.some(pattern => pattern.test(url))) continue;

        if (!found.has(url)) found.set(url, new Set());
        found.get(url).add(path.relative(ROOT, file));
      }
    }
  }

  return found;
}

function post(url) {
  return new Promise(resolve => {
    const request = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(QUERY),
        },
      },
      response => {
        let body = '';
        response.on('data', chunk => (body += chunk));
        response.on('end', () =>
          resolve({ statusCode: response.statusCode, body })
        );
      }
    );

    request.on('error', error => resolve({ error: error.message }));
    request.setTimeout(TIMEOUT_MS, () => {
      request.destroy();
      resolve({ error: `no answer within ${TIMEOUT_MS / 1000}s` });
    });

    request.write(QUERY);
    request.end();
  });
}

async function check(url) {
  let last;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    last = await post(url);

    if (last.statusCode === 200 && last.body.includes('__typename')) {
      return { ok: true, attempt };
    }
  }

  return {
    ok: false,
    reason: last.error ?? `answered ${last.statusCode}`,
  };
}

async function run() {
  const endpoints = collectEndpoints();

  if (endpoints.size === 0) {
    console.log('No GraphQL endpoints referenced in the documentation.');
    return;
  }

  console.log(`Checking ${endpoints.size} GraphQL endpoint(s)...\n`);

  const failures = [];

  // Probed together rather than one after another, so adding an endpoint costs
  // no wall-clock time. Results are collected in the order the endpoints were
  // found, so the output does not depend on which host answers first.
  const entries = [...endpoints];
  const results = await Promise.all(entries.map(([url]) => check(url)));

  for (const [index, [url, files]] of entries.entries()) {
    const result = results[index];

    if (result.ok) {
      const note = result.attempt > 1 ? ` (on attempt ${result.attempt})` : '';
      console.log(`✅ ${url}${note}`);
    } else {
      console.log(`❌ ${url} — ${result.reason}`);
      failures.push({ url, files, reason: result.reason });
    }
  }

  if (failures.length > 0) {
    console.log(`\n❌ ${failures.length} endpoint(s) did not answer:\n`);

    for (const { url, files, reason } of failures) {
      console.log(`  ${url}`);
      console.log(`    ${reason} after ${ATTEMPTS} attempts`);
      for (const file of files) console.log(`    referenced from ${file}`);
      console.log('');
    }

    process.exit(1);
  }

  console.log(`\n✅ All ${endpoints.size} endpoint(s) answer.`);
}

run().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

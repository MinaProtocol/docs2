#!/usr/bin/env node

/**
 * Script to validate outbound links to the o1Labs documentation site.
 *
 * Checks every docs.o1labs.org URL referenced from:
 *   - docs/ ** / *.mdx and *.md
 *   - vercel.json redirect destinations
 *
 * For each URL it verifies the page resolves, and where the reference
 * carries a #fragment, that the fragment still exists on the page. An
 * anchor that disappears is the dangerous case: the page keeps returning
 * 200, so nothing else notices, and the reader lands somewhere with no
 * sign of the section they were sent to.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const VERCEL_JSON = path.join(ROOT, 'vercel.json');

const O1LABS_HOST = 'docs.o1labs.org';
const URL_PATTERN = /https:\/\/docs\.o1labs\.org\/[^\s)"'`<>\]]+/g;
const CONCURRENCY = 6;
const TIMEOUT_MS = 20000;

// Trailing punctuation that belongs to the prose, not the URL.
function trimUrl(url) {
  return url.replace(/[.,;:]+$/, '');
}

function findDocFiles(dir) {
  const files = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...findDocFiles(fullPath));
    } else if (/\.mdx?$/.test(item)) {
      files.push(fullPath);
    }
  }
  return files;
}

/** Collect every o1Labs URL with the file and line it came from. */
function collectReferences() {
  const refs = new Map(); // url -> [{ file, line }]
  const add = (url, file, line) => {
    const clean = trimUrl(url);
    if (!refs.has(clean)) refs.set(clean, []);
    refs.get(clean).push({ file, line });
  };

  for (const file of findDocFiles(DOCS_DIR)) {
    const rel = path.relative(ROOT, file);
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .forEach((text, i) => {
        for (const match of text.match(URL_PATTERN) || []) {
          add(match, rel, i + 1);
        }
      });
  }

  // The redirects matter as much as the in-page links: for the guides
  // delegated to o1Labs they are the only route a reader has.
  if (fs.existsSync(VERCEL_JSON)) {
    const vercel = JSON.parse(fs.readFileSync(VERCEL_JSON, 'utf8'));
    for (const redirect of vercel.redirects || []) {
      const dest = redirect.destination || '';
      if (dest.includes(O1LABS_HOST) && !dest.includes(':path')) {
        add(dest, 'vercel.json', `redirect from ${redirect.source}`);
      }
    }
  }

  return refs;
}

function fetchPage(url, redirectsLeft = 5) {
  return new Promise((resolve) => {
    const request = https.get(url, { timeout: TIMEOUT_MS }, (response) => {
      const { statusCode, headers } = response;
      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        response.resume();
        if (redirectsLeft === 0) {
          return resolve({
            status: statusCode,
            body: '',
            error: 'too many redirects',
          });
        }
        const next = new URL(headers.location, url).toString();
        return resolve(fetchPage(next, redirectsLeft - 1));
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => (body += chunk));
      response.on('end', () => resolve({ status: statusCode, body }));
    });
    request.on('timeout', () => {
      request.destroy();
      resolve({ status: 0, body: '', error: 'timeout' });
    });
    request.on('error', (err) =>
      resolve({ status: 0, body: '', error: err.message })
    );
  });
}

function hasAnchor(body, anchor) {
  const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    new RegExp(`id=["']${escaped}["']`, 'i').test(body) ||
    new RegExp(`name=["']${escaped}["']`, 'i').test(body)
  );
}

async function run() {
  const refs = collectReferences();
  const urls = [...refs.keys()].sort();
  console.log(`Checking ${urls.length} ${O1LABS_HOST} references...\n`);

  // One fetch per page, shared by every anchor pointing into it.
  const pages = new Map();
  const bases = [...new Set(urls.map((u) => u.split('#')[0]))];
  const queue = [...bases];
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length) {
        const base = queue.shift();
        pages.set(base, await fetchPage(base));
      }
    })
  );

  const failures = [];
  for (const url of urls) {
    const [base, anchor] = url.split('#');
    const page = pages.get(base);
    if (page.status !== 200) {
      failures.push({ url, reason: page.error || `HTTP ${page.status}` });
    } else if (anchor && !hasAnchor(page.body, anchor)) {
      failures.push({
        url,
        reason: `page is 200 but anchor #${anchor} no longer exists`,
      });
    }
  }

  // The site declares a canonical host that has never resolved. If that
  // ever changes, every reference here has to move with it.
  const sample = pages.get(bases[0]);
  if (sample && sample.status === 200) {
    const canonical = sample.body.match(
      /rel="canonical"\s+href="https:\/\/([^/"]+)/
    );
    if (canonical && canonical[1] !== O1LABS_HOST) {
      console.log(
        `⚠️  o1Labs pages declare "${canonical[1]}" as their canonical host, ` +
          `but we link to "${O1LABS_HOST}". See MinaProtocol/docs2#1236.\n`
      );
    }
  }

  if (failures.length === 0) {
    console.log(`✅ All ${urls.length} references resolve.`);
    return;
  }

  console.log(`❌ ${failures.length} broken reference(s):\n`);
  for (const { url, reason } of failures) {
    console.log(`  ${url}`);
    console.log(`    ${reason}`);
    for (const { file, line } of refs.get(url)) {
      console.log(`    referenced from ${file}:${line}`);
    }
    console.log('');
  }
  process.exitCode = 1;
}

run();

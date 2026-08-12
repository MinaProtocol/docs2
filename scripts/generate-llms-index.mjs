#!/usr/bin/env node

/**
 * Generates static/llms.txt — the discovery / TOC layer of the docs, per the
 * https://llmstxt.org/ spec.
 *
 * Source of truth:
 *   - sidebars.js                 → hierarchy and which pages are surfaced
 *   - each .mdx file's frontmatter → title and description
 *
 * Companion to generate-llms-txt.mjs which produces the full corpus
 * (llms-full.txt). Both should be regenerated on every build so neither
 * drifts from the docs source.
 */

import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DOCS_DIR = join(ROOT, "docs");
const OUTPUT_FILE = join(ROOT, "static", "llms.txt");

const SITE_URL = "https://docs.minaprotocol.com";

const HEADER = `# Mina Protocol Documentation

> Mina is a lightweight blockchain powered by zero-knowledge proofs (zk-SNARKs). Unlike traditional blockchains, Mina maintains a constant ~22KB chain size. Developers build privacy-preserving smart contracts called zkApps using o1js, a TypeScript-based zk framework. The protocol uses Ouroboros Samasika proof-of-stake consensus.

This file is auto-generated from \`sidebars.js\` and the frontmatter of each documentation page. It indexes the docs for AI agents and other automation. The full content of every page is at [llms-full.txt](${SITE_URL}/llms-full.txt).
`;

// Top-level sidebar entries that are too internal-process to surface to AI
// agents. Add IDs/labels here to skip them.
const SKIP_LABELS = new Set(["Participate"]);

// Operator-facing facts that don't live as their own pages but matter for
// integrators. Injected as a separate section so AI agents see them without
// having to fetch the FAQ page.
const OPERATOR_FACTS = [
  {
    label: "Exchange Integration FAQ",
    url: `${SITE_URL}/node-operators/faq#exchange-integration`,
    description:
      "Account creation fee 1 MINA, mempool capacity 3000 transactions, recommended 15-block confirmation, no official broadcast nodes, do not require memos for deposits.",
  },
  {
    label: "Daemon defaults",
    url: `${SITE_URL}/node-operators/validator-node/querying-data`,
    description:
      "GraphQL API on port 3085 by default; configurable via --rest-port.",
  },
  {
    label: "Lifecycle of a Payment",
    url: `${SITE_URL}/mina-protocol/lifecycle-of-a-payment`,
    description:
      "Transaction states from submission to finality, confirmation count vs reorg probability, what exchanges should wait for.",
  },
];

// ---------------------------------------------------------------------------

async function readFrontmatter(docId) {
  for (const ext of [".mdx", ".md"]) {
    const directPath = join(DOCS_DIR, `${docId}${ext}`);
    const indexPath = join(DOCS_DIR, docId, `index${ext}`);
    for (const path of [directPath, indexPath]) {
      try {
        const content = await readFile(path, "utf-8");
        const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (!match) return { title: null, description: null };
        const fm = {};
        for (const line of match[1].split("\n")) {
          const m = line.match(/^(\w+):\s*(.+)$/);
          if (m) fm[m[1]] = m[2].replace(/^['"]|['"]$/g, "").trim();
        }
        return { title: fm.title ?? null, description: fm.description ?? null };
      } catch {
        /* try next path */
      }
    }
  }
  return null;
}

function docIdToUrl(docId) {
  return `${SITE_URL}/${docId}`.replace(/\/index$/, "");
}

async function entryToBullet(docId, fallbackLabel) {
  const fm = await readFrontmatter(docId);
  if (!fm) return null; // file doesn't exist
  const title = fm.title || fallbackLabel || docId;
  const description = fm.description;
  const url = docIdToUrl(docId);
  if (!description) {
    return { url, line: null, missing: { docId, title } };
  }
  return { url, line: `- [${title}](${url}): ${description}` };
}

async function flattenCategory(items, fallbackLabel) {
  const bullets = [];
  const missingDescriptions = [];

  async function walk(item) {
    if (typeof item === "string") {
      const r = await entryToBullet(item);
      if (!r) return;
      if (r.missing) missingDescriptions.push(r.missing);
      else bullets.push(r.line);
      return;
    }
    if (item.type === "doc") {
      const r = await entryToBullet(item.id, item.label);
      if (!r) return;
      if (r.missing) missingDescriptions.push(r.missing);
      else bullets.push(r.line);
      return;
    }
    if (item.type === "link") {
      bullets.push(`- [${item.label}](${item.href}): External link.`);
      return;
    }
    if (item.type === "category") {
      // First the category's own landing page (if it has one)
      if (item.link?.type === "doc") {
        const r = await entryToBullet(item.link.id, item.label);
        if (r) {
          if (r.missing) missingDescriptions.push(r.missing);
          else bullets.push(r.line);
        }
      }
      for (const child of item.items ?? []) await walk(child);
    }
  }

  for (const it of items) await walk(it);
  return { bullets, missingDescriptions };
}

async function build() {
  const require = createRequire(pathToFileURL(`${ROOT}/`).href);
  const sidebars = require("./sidebars.js");
  const top = sidebars.docs;

  const sections = [];
  const allMissing = [];

  for (const entry of top) {
    if (typeof entry === "string") continue;
    if (SKIP_LABELS.has(entry.label)) continue;

    if (entry.type === "category") {
      const { bullets, missingDescriptions } = await flattenCategory(
        entry.items ?? [],
        entry.label,
      );

      // Prepend the category's own landing page if linked
      if (entry.link?.type === "doc") {
        const r = await entryToBullet(entry.link.id, entry.label);
        if (r?.line) bullets.unshift(r.line);
        else if (r?.missing) missingDescriptions.push(r.missing);
      }

      if (bullets.length === 0) continue;
      sections.push({ heading: entry.label, bullets });
      allMissing.push(...missingDescriptions);
    } else if (entry.type === "doc") {
      const r = await entryToBullet(entry.id, entry.label);
      if (r?.line) {
        sections.push({ heading: entry.label, bullets: [r.line] });
      } else if (r?.missing) {
        allMissing.push(r.missing);
      }
    }
  }

  // Append operator facts as their own H2
  sections.push({
    heading: "Operator-facing facts",
    bullets: OPERATOR_FACTS.map(
      (f) => `- [${f.label}](${f.url}): ${f.description}`,
    ),
  });

  const body = sections
    .map((s) => `## ${s.heading}\n\n${s.bullets.join("\n")}`)
    .join("\n\n");

  const output = `${HEADER}\n${body}\n`;
  await writeFile(OUTPUT_FILE, output, "utf-8");

  const sizeKb = (output.length / 1024).toFixed(1);
  const linkedPages = sections.reduce((n, s) => n + s.bullets.length, 0);
  console.log(
    `Generated ${OUTPUT_FILE}: ${linkedPages} pages, ${sections.length} sections, ${sizeKb} KB`,
  );

  if (allMissing.length > 0) {
    console.warn(
      `\n${allMissing.length} sidebar pages skipped because their frontmatter has no \`description\`:`,
    );
    for (const m of allMissing.slice(0, 20)) {
      console.warn(`  ${m.docId} (${m.title})`);
    }
    if (allMissing.length > 20) {
      console.warn(`  ... and ${allMissing.length - 20} more`);
    }
    console.warn(
      `\nAdd a \`description:\` to the frontmatter of these pages to surface them in llms.txt.`,
    );
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});

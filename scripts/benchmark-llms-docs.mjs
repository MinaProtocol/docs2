#!/usr/bin/env node

/**
 * AI Documentation Quality Benchmark for Mina Protocol Docs
 *
 * Measures how well LLMs can answer questions using docs.minaprotocol.com
 * documentation served via llms.txt and llms-full.txt.
 *
 * Usage:
 *   # Run all benchmarks against llms.txt
 *   ANTHROPIC_API_KEY=sk-... node scripts/benchmark-llms-docs.mjs
 *
 *   # Run against llms-full.txt instead
 *   ANTHROPIC_API_KEY=sk-... node scripts/benchmark-llms-docs.mjs --source full
 *
 *   # Run a specific category only
 *   ANTHROPIC_API_KEY=sk-... node scripts/benchmark-llms-docs.mjs --category factual
 *
 *   # Run without docs (baseline)
 *   ANTHROPIC_API_KEY=sk-... node scripts/benchmark-llms-docs.mjs --source none
 *
 *   # Use a different model
 *   ANTHROPIC_API_KEY=sk-... node scripts/benchmark-llms-docs.mjs --model claude-sonnet-4-6-20250514
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { parseArgs } from "util";

const DOCS_BASE_URL = "https://docs.minaprotocol.com";

// ---------------------------------------------------------------------------
// Benchmark questions
// ---------------------------------------------------------------------------

const BENCHMARKS = {
  factual: {
    description: "Factual retrieval — single correct answers from docs",
    questions: [
      {
        id: "f1",
        question: "What is the minimum recommended fee for a Mina transaction?",
        expected: "0.001 MINA",
        grading: "exact_match",
        keywords: ["0.001"],
      },
      {
        id: "f2",
        question:
          "How many blocks should an exchange wait for transaction confirmation on Mina?",
        expected: "15 blocks",
        grading: "exact_match",
        keywords: ["15"],
      },
      {
        id: "f3",
        question:
          "What fee is charged when creating a new account on the Mina blockchain?",
        expected: "1 MINA",
        grading: "exact_match",
        keywords: ["1 mina", "1mina", "one mina"],
      },
      {
        id: "f4",
        question: "What is the maximum mempool capacity in Mina?",
        expected: "3,000 transactions",
        grading: "exact_match",
        keywords: ["3000", "3,000"],
      },
      {
        id: "f5",
        question: "What consensus mechanism does Mina use?",
        expected: "Ouroboros Samasika (Proof of Stake)",
        grading: "exact_match",
        keywords: ["ouroboros", "samasika"],
      },
      {
        id: "f6",
        question: "What is Mina's approximate blockchain size?",
        expected: "~22 KB",
        grading: "exact_match",
        keywords: ["22"],
      },
      {
        id: "f7",
        question:
          "What programming language is o1js written in / what language do developers use to write zkApps?",
        expected: "TypeScript",
        grading: "exact_match",
        keywords: ["typescript"],
      },
      {
        id: "f8",
        question:
          "What is the maximum number of on-chain state fields in a Mina zkApp smart contract?",
        expected: "8 Field elements",
        grading: "exact_match",
        keywords: ["8"],
      },
      {
        id: "f9",
        question:
          "What port does the Mina daemon GraphQL API run on by default?",
        expected: "3085",
        grading: "exact_match",
        keywords: ["3085"],
      },
      {
        id: "f10",
        question:
          "What is the base provable type in o1js that represents a finite field element?",
        expected: "Field",
        grading: "exact_match",
        keywords: ["field"],
      },
    ],
  },

  procedural: {
    description: "Procedural task completion — multi-step instructions",
    questions: [
      {
        id: "p1",
        question: "How do I deploy my first zkApp to Devnet?",
        expected:
          "Must include: install zkApp CLI, create project (zk project), write smart contract, configure deploy alias, fund account from faucet, run zk deploy",
        grading: "llm_judge",
        required_steps: [
          "install zkApp CLI or npm",
          "create project",
          "write or edit smart contract",
          "configure deployment",
          "fund account or faucet",
          "deploy command",
        ],
      },
      {
        id: "p2",
        question: "How do I set up a block producer node on Mina mainnet?",
        expected:
          "Must include: install mina package, generate keypair, import key, configure peers/daemon, start daemon, verify sync status",
        grading: "llm_judge",
        required_steps: [
          "install mina",
          "generate or import keypair",
          "configure daemon or peers",
          "start daemon",
          "check sync status",
        ],
      },
      {
        id: "p3",
        question:
          "How do I integrate Mina on my exchange using the Rosetta API?",
        expected:
          "Must include: run Rosetta via Docker or compose, wait for sync, use construction API for transactions, track deposits via block scanning",
        grading: "llm_judge",
        required_steps: [
          "run rosetta via docker",
          "wait for sync",
          "construction API or send transaction",
          "scan blocks or track deposits",
        ],
      },
      {
        id: "p4",
        question: "How do I create a custom token using o1js?",
        expected:
          "Must include: extend TokenContract or SmartContract, define mint/transfer/burn methods, set permissions, deploy",
        grading: "llm_judge",
        required_steps: [
          "extend TokenContract or SmartContract",
          "define token methods",
          "set permissions",
          "deploy",
        ],
      },
      {
        id: "p5",
        question: "How do I delegate my MINA stake using a wallet?",
        expected:
          "Must include: install/open wallet, have MINA balance, choose validator, delegate, understand epoch delay",
        grading: "llm_judge",
        required_steps: [
          "wallet",
          "MINA balance",
          "choose validator or block producer",
          "delegate",
        ],
      },
    ],
  },

  conceptual: {
    description:
      "Conceptual understanding — synthesis and reasoning about Mina",
    questions: [
      {
        id: "c1",
        question:
          "How is Mina different from Ethereum in terms of blockchain architecture?",
        expected:
          "Should mention: constant-size chain (~22KB), zk-SNARKs for compression, off-chain execution with on-chain verification, no full chain download needed",
        grading: "llm_judge",
        required_concepts: [
          "constant or small chain size",
          "zk-SNARKs or zero-knowledge proofs",
          "off-chain execution or computation",
        ],
      },
      {
        id: "c2",
        question:
          "Why would a developer choose to build a zkApp instead of a traditional smart contract?",
        expected:
          "Should mention: privacy of inputs, off-chain computation, proof verification on-chain, TypeScript development",
        grading: "llm_judge",
        required_concepts: [
          "privacy",
          "off-chain computation",
          "proof verification",
        ],
      },
      {
        id: "c3",
        question: "How do actions and reducers work in o1js?",
        expected:
          "Should explain: dispatching actions within methods, actions accumulate across transactions, reducer processes accumulated actions, enables concurrent updates",
        grading: "llm_judge",
        required_concepts: [
          "dispatch actions",
          "accumulate or collect",
          "reducer processes or reduces",
        ],
      },
      {
        id: "c4",
        question:
          "What are the tradeoffs between on-chain and off-chain storage in Mina zkApps?",
        expected:
          "Should cover: 8-field limit on-chain, Merkle trees for off-chain verification, cost vs complexity tradeoffs",
        grading: "llm_judge",
        required_concepts: [
          "limited on-chain state",
          "merkle tree",
          "tradeoff or complexity",
        ],
      },
      {
        id: "c5",
        question:
          "What role do SNARK workers play in the Mina protocol and why are they necessary?",
        expected:
          "Should explain: produce zk-SNARKs that compress transactions, keep chain size constant, earn fees, separate from block producers",
        grading: "llm_judge",
        required_concepts: [
          "produce SNARKs or proofs",
          "compress or constant size",
          "fees or incentive",
        ],
      },
    ],
  },

  code_generation: {
    description: "Code generation — produce working o1js / Mina code",
    questions: [
      {
        id: "g1",
        question:
          "Write a simple zkApp smart contract in o1js/TypeScript that stores a single number on-chain and has a method to update it. Only the deployer should be able to update it.",
        expected:
          "Should use SmartContract, @state decorator, @method decorator, include some form of permission or sender check",
        grading: "llm_judge",
        required_elements: [
          "SmartContract",
          "@state",
          "@method",
          "permission or sender check",
          "Field type",
        ],
      },
      {
        id: "g2",
        question:
          "Write TypeScript code using o1js to fetch the account balance of a Mina address on devnet.",
        expected:
          "Should use fetchAccount or Mina.getBalance, set network to devnet endpoint",
        grading: "llm_judge",
        required_elements: [
          "fetchAccount or getBalance",
          "network or endpoint configuration",
          "public key parameter",
        ],
      },
      {
        id: "g3",
        question:
          "Write code to sign a payment transaction using the mina-signer npm package.",
        expected:
          "Should import Client from mina-signer, create client instance, call signPayment with correct structure",
        grading: "llm_judge",
        required_elements: [
          "mina-signer import",
          "Client instance",
          "signPayment or signTransaction",
          "to, from, amount fields",
        ],
      },
      {
        id: "g4",
        question:
          "Write a ZkProgram in o1js that proves knowledge of a preimage for a Poseidon hash.",
        expected:
          "Should use ZkProgram.create or ZkProgram, Poseidon.hash, verify hash matches public input",
        grading: "llm_judge",
        required_elements: [
          "ZkProgram",
          "Poseidon.hash",
          "public input or output",
          "assert or assertEqual",
        ],
      },
      {
        id: "g5",
        question:
          "Write a TypeScript script that uses the Rosetta API to scan blocks and find deposit transactions to a specific address.",
        expected:
          "Should make HTTP requests to Rosetta /block endpoint, iterate transactions, filter by address and operation type",
        grading: "llm_judge",
        required_elements: [
          "block endpoint or /block",
          "iterate or loop blocks",
          "filter by address",
          "operation type or amount",
        ],
      },
    ],
  },

  hallucination: {
    description: "Hallucination detection — must NOT fabricate features",
    questions: [
      {
        id: "h1",
        question: "Does Mina support Solidity smart contracts?",
        expected:
          "No. Mina uses o1js (TypeScript) for smart contracts, not Solidity.",
        grading: "llm_judge",
        must_reject: "solidity support",
        correct_answer: "no",
      },
      {
        id: "h2",
        question:
          "How do I use the official Mina EVM bridge to transfer tokens from Ethereum?",
        expected:
          "There is no official Mina EVM bridge mentioned in the documentation.",
        grading: "llm_judge",
        must_reject: "evm bridge instructions",
        correct_answer:
          "should indicate no official EVM bridge exists or is documented",
      },
      {
        id: "h3",
        question:
          "How do I call contract.execute() to run my zkApp method on Mina?",
        expected:
          "There is no execute() method. zkApp methods are called directly by name on the contract instance.",
        grading: "llm_judge",
        must_reject: "execute() method usage",
        correct_answer: "should clarify execute() does not exist",
      },
      {
        id: "h4",
        question:
          "How do I install and use the mina-sdk npm package to interact with Mina?",
        expected:
          "There is no mina-sdk package. The correct packages are o1js for zkApps and mina-signer for signing.",
        grading: "llm_judge",
        must_reject: "mina-sdk instructions",
        correct_answer: "should redirect to o1js or mina-signer",
      },
      {
        id: "h5",
        question:
          "How do I query the Mina blockchain using its REST API endpoints?",
        expected:
          "Mina uses a GraphQL API, not a REST API. Rosetta is a separate standardized API for exchanges.",
        grading: "llm_judge",
        must_reject: "REST API usage for the daemon",
        correct_answer: "should clarify Mina uses GraphQL, not REST",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const API_KEY = process.env.ANTHROPIC_API_KEY;

async function callAnthropic(messages, { system, model, maxTokens = 1024 }) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: system || undefined,
      messages,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Anthropic API error ${resp.status}: ${body}`);
  }

  const data = await resp.json();
  return data.content[0].text;
}

// ---------------------------------------------------------------------------
// Fetch docs context
// ---------------------------------------------------------------------------

async function fetchDocsContext(source) {
  if (source === "none") return null;

  const url =
    source === "full"
      ? `${DOCS_BASE_URL}/llms-full.txt`
      : `${DOCS_BASE_URL}/llms.txt`;

  // Try local file first, fall back to URL
  try {
    const localPath =
      source === "full" ? "static/llms-full.txt" : "static/llms.txt";
    return readFileSync(localPath, "utf-8");
  } catch {
    console.log(`Local file not found, fetching from ${url}...`);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
    return resp.text();
  }
}

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

function gradeExactMatch(answer, question) {
  const lower = answer.toLowerCase();
  return question.keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

async function gradeLlmJudge(answer, question, model) {
  let judgePrompt;

  if (question.must_reject) {
    // Hallucination category
    judgePrompt = `You are a strict grading judge. A user asked an AI the following question about Mina Protocol:

Question: ${question.question}

The AI answered:
${answer}

The correct behavior is: ${question.correct_answer}
The AI must NOT provide instructions for: ${question.must_reject}

Grade the answer:
- Score 1: The AI correctly refused or corrected the false premise
- Score 0: The AI hallucinated and provided instructions for something that doesn't exist

Respond with ONLY a JSON object: {"score": 0 or 1, "reason": "brief explanation"}`;
  } else if (question.required_steps) {
    // Procedural category
    judgePrompt = `You are a strict grading judge. A user asked an AI for instructions:

Question: ${question.question}

The AI answered:
${answer}

Required steps that should be present: ${JSON.stringify(question.required_steps)}

For each required step, determine if the answer covers it (even if worded differently).
Score = number of steps covered / total steps.

Respond with ONLY a JSON object: {"score": 0.0 to 1.0, "covered_steps": [...], "missing_steps": [...], "reason": "brief explanation"}`;
  } else if (question.required_concepts) {
    // Conceptual category
    judgePrompt = `You are a strict grading judge. A user asked an AI about Mina Protocol concepts:

Question: ${question.question}

The AI answered:
${answer}

Required concepts that should be discussed: ${JSON.stringify(question.required_concepts)}

For each required concept, determine if the answer covers it meaningfully.
Also check for any factual errors about Mina Protocol.
Score = concepts covered / total concepts, minus 0.2 for each factual error (min 0).

Respond with ONLY a JSON object: {"score": 0.0 to 1.0, "covered": [...], "missing": [...], "errors": [...], "reason": "brief explanation"}`;
  } else if (question.required_elements) {
    // Code generation category
    judgePrompt = `You are a strict grading judge for code generation. A user asked an AI to write Mina/o1js code:

Question: ${question.question}

The AI answered:
${answer}

Required code elements: ${JSON.stringify(question.required_elements)}

For each required element, determine if the code includes it.
Also check if the code would plausibly compile (no obvious syntax errors, correct API usage for o1js/mina-signer).
Score = elements present / total elements. Subtract 0.2 if code has obvious errors (min 0).

Respond with ONLY a JSON object: {"score": 0.0 to 1.0, "present": [...], "missing": [...], "has_errors": true/false, "reason": "brief explanation"}`;
  }

  const judgeResponse = await callAnthropic(
    [{ role: "user", content: judgePrompt }],
    { model, maxTokens: 512 }
  );

  try {
    const jsonMatch = judgeResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    console.warn("  Failed to parse judge response:", judgeResponse);
  }
  return { score: 0, reason: "Failed to parse judge response" };
}

// ---------------------------------------------------------------------------
// Main benchmark runner
// ---------------------------------------------------------------------------

async function runBenchmark(options) {
  const { source, category, model } = options;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Mina Docs AI Benchmark`);
  console.log(`Model: ${model}`);
  console.log(`Source: ${source}`);
  console.log(`Category: ${category || "all"}`);
  console.log(`${"=".repeat(60)}\n`);

  const docsContext = await fetchDocsContext(source);
  const systemPrompt = docsContext
    ? `You are a helpful assistant that answers questions about Mina Protocol based on the following documentation:\n\n${docsContext}`
    : "You are a helpful assistant. Answer questions about Mina Protocol to the best of your knowledge.";

  // Truncate system prompt if it's too large (for llms-full.txt)
  const maxSystemChars = 180_000;
  const truncatedSystem =
    systemPrompt.length > maxSystemChars
      ? systemPrompt.slice(0, maxSystemChars) +
        "\n\n[Documentation truncated due to length]"
      : systemPrompt;

  const categories = category
    ? { [category]: BENCHMARKS[category] }
    : BENCHMARKS;

  if (category && !BENCHMARKS[category]) {
    console.error(
      `Unknown category: ${category}. Available: ${Object.keys(BENCHMARKS).join(", ")}`
    );
    process.exit(1);
  }

  const results = {};
  let totalScore = 0;
  let totalQuestions = 0;

  for (const [catName, cat] of Object.entries(categories)) {
    console.log(`\n--- ${catName}: ${cat.description} ---\n`);
    results[catName] = { questions: [], score: 0, total: cat.questions.length };

    for (const q of cat.questions) {
      process.stdout.write(`  [${q.id}] ${q.question.slice(0, 60)}... `);

      try {
        const answer = await callAnthropic(
          [{ role: "user", content: q.question }],
          { system: truncatedSystem, model, maxTokens: 1500 }
        );

        let score, details;

        if (q.grading === "exact_match") {
          const passed = gradeExactMatch(answer, q);
          score = passed ? 1 : 0;
          details = { passed, answer_snippet: answer.slice(0, 200) };
        } else {
          const judgeResult = await gradeLlmJudge(answer, q, model);
          score = judgeResult.score;
          details = {
            ...judgeResult,
            answer_snippet: answer.slice(0, 200),
          };
        }

        results[catName].questions.push({
          id: q.id,
          question: q.question,
          score,
          details,
        });
        results[catName].score += score;

        const icon = score >= 0.8 ? "PASS" : score >= 0.5 ? "PARTIAL" : "FAIL";
        console.log(`${icon} (${score.toFixed(2)})`);
      } catch (err) {
        console.log(`ERROR: ${err.message}`);
        results[catName].questions.push({
          id: q.id,
          question: q.question,
          score: 0,
          details: { error: err.message },
        });
      }

      totalScore += results[catName].questions.at(-1).score;
      totalQuestions++;
    }

    const catScore = results[catName].score / results[catName].total;
    console.log(
      `\n  Category score: ${results[catName].score.toFixed(2)}/${results[catName].total} (${(catScore * 100).toFixed(1)}%)`
    );
  }

  // Summary
  const overallPct = ((totalScore / totalQuestions) * 100).toFixed(1);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`OVERALL: ${totalScore.toFixed(2)}/${totalQuestions} (${overallPct}%)`);
  console.log(`${"=".repeat(60)}`);

  console.log("\nCategory breakdown:");
  for (const [catName, cat] of Object.entries(results)) {
    const pct = ((cat.score / cat.total) * 100).toFixed(1);
    const bar = "#".repeat(Math.round(cat.score / cat.total * 20)).padEnd(20, ".");
    console.log(`  ${catName.padEnd(18)} [${bar}] ${pct}%`);
  }

  // Save detailed results
  const output = {
    metadata: {
      timestamp: new Date().toISOString(),
      model,
      source,
      category: category || "all",
    },
    summary: {
      overall_score: totalScore,
      total_questions: totalQuestions,
      overall_percentage: parseFloat(overallPct),
      categories: Object.fromEntries(
        Object.entries(results).map(([k, v]) => [
          k,
          {
            score: v.score,
            total: v.total,
            percentage: parseFloat(((v.score / v.total) * 100).toFixed(1)),
          },
        ])
      ),
    },
    details: results,
  };

  mkdirSync("benchmark-results", { recursive: true });
  const filename = `benchmark-results/benchmark-${source}-${model.replace(/[^a-z0-9-]/gi, "_")}-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(filename, JSON.stringify(output, null, 2));
  console.log(`\nDetailed results saved to: ${filename}`);

  return output;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    source: { type: "string", default: "llms" },
    category: { type: "string", default: "" },
    model: { type: "string", default: "claude-sonnet-4-6-20250514" },
    help: { type: "boolean", default: false },
  },
});

if (args.help) {
  console.log(`
Mina Docs AI Benchmark

Usage:
  ANTHROPIC_API_KEY=sk-... node scripts/benchmark-llms-docs.mjs [options]

Options:
  --source   llms | full | none     Which docs source to use (default: llms)
  --category factual | procedural | conceptual | code_generation | hallucination
                                     Run a single category (default: all)
  --model    MODEL_ID               Anthropic model to use (default: claude-sonnet-4-6-20250514)
  --help                            Show this help

Examples:
  # Compare llms.txt vs llms-full.txt vs no docs
  node scripts/benchmark-llms-docs.mjs --source llms
  node scripts/benchmark-llms-docs.mjs --source full
  node scripts/benchmark-llms-docs.mjs --source none

  # Quick test on one category
  node scripts/benchmark-llms-docs.mjs --category factual
`);
  process.exit(0);
}

if (!API_KEY) {
  console.error(
    "Error: ANTHROPIC_API_KEY environment variable is required.\n" +
      "Set it with: export ANTHROPIC_API_KEY=sk-..."
  );
  process.exit(1);
}

runBenchmark({
  source: args.source,
  category: args.category || null,
  model: args.model,
}).catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});

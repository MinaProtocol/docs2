// Offline tests for the oracle's signing logic.
//
// The smart contract in ../contracts checks an oracle response with
//   signature.verify(oraclePublicKey, [id, creditScore])
// These tests check the same thing with o1js, against what the oracle signs.
// No server, no network.
//
// Run with `npm test`. Node.js 22.18 or later strips the TypeScript types of
// lib/signCreditScore.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Field, PrivateKey, PublicKey, Signature } from 'o1js';
import { getSignedCreditScore } from '../lib/signCreditScore.ts';

// The oracle public key that the smart contract trusts, read from its source
// so that this test and the contract cannot disagree.
const contractSource = readFileSync(
  new URL('../../contracts/src/OracleExample.ts', import.meta.url),
  'utf8'
);
const ORACLE_PUBLIC_KEY = contractSource.match(
  /ORACLE_PUBLIC_KEY\s*=\s*'(B62[1-9A-HJ-NP-Za-km-z]+)'/
)[1];

// The public key of the hardcoded development key in lib/signCreditScore.ts.
const DEV_PUBLIC_KEY = 'B62qphyUJg3TjMKi74T2rF8Yer5rQjBr1UyEG7Wg9XEYAHjaSiSqFv1';

// What the contract does with a response.
function contractAccepts(response, oraclePublicKey) {
  const signature = Signature.fromBase58(response.signature);
  return signature
    .verify(PublicKey.fromBase58(oraclePublicKey), [
      Field(response.data.id),
      Field(response.data.creditScore),
    ])
    .toBoolean();
}

function withPrivateKey(privateKey, fn) {
  const saved = process.env.PRIVATE_KEY;
  process.env.PRIVATE_KEY = privateKey;
  try {
    return fn();
  } finally {
    if (saved === undefined) delete process.env.PRIVATE_KEY;
    else process.env.PRIVATE_KEY = saved;
  }
}

test('returns the mock credit scores: 787 for user 1, 536 for any other user', () => {
  assert.deepEqual(getSignedCreditScore(1).data, { id: 1, creditScore: 787 });
  assert.deepEqual(getSignedCreditScore(2).data, { id: 2, creditScore: 536 });
  assert.deepEqual(getSignedCreditScore(42).data, { id: 42, creditScore: 536 });
});

test('without PRIVATE_KEY, signs with the development key', () => {
  const saved = process.env.PRIVATE_KEY;
  delete process.env.PRIVATE_KEY;
  try {
    assert.equal(getSignedCreditScore(1).publicKey, DEV_PUBLIC_KEY);
  } finally {
    if (saved !== undefined) process.env.PRIVATE_KEY = saved;
  }
});

test('the signature verifies in o1js for [id, creditScore] and the returned public key', () => {
  for (const user of [1, 2, 3]) {
    const response = getSignedCreditScore(user);
    assert.equal(contractAccepts(response, response.publicKey), true, `user ${user}`);
  }
});

test('the signature binds the user id and the credit score', () => {
  const user2 = getSignedCreditScore(2);
  // user 2's signature, presented with user 1's id
  assert.equal(
    contractAccepts({ ...user2, data: { id: 1, creditScore: 536 } }, user2.publicKey),
    false
  );
  // user 2's signature, presented with a higher score
  assert.equal(
    contractAccepts({ ...user2, data: { id: 2, creditScore: 787 } }, user2.publicKey),
    false
  );
});

test('with PRIVATE_KEY set, signs with that key; the contract must trust its public key', () => {
  const key = PrivateKey.random();
  const publicKey = key.toPublicKey().toBase58();
  const response = withPrivateKey(key.toBase58(), () => getSignedCreditScore(1));

  assert.equal(response.publicKey, publicKey);
  assert.equal(contractAccepts(response, publicKey), true);
  // A contract that trusts another key rejects the response.
  assert.equal(contractAccepts(response, ORACLE_PUBLIC_KEY), false);
});

test('the demo oracle responses in the tutorial verify against the contract key', () => {
  // https://07-oracles.vercel.app/api/credit-score?user=1 and ?user=2, as shown
  // in docs/zkapps/tutorials/07-oracle.mdx and used in OracleExample.test.ts.
  // The demo oracle signs with its own PRIVATE_KEY, whose public key is the
  // one the contract trusts.
  const demo = [
    {
      data: { id: 1, creditScore: 787 },
      signature:
        '7mXGPCbSJUiYgZnGioezZm7GCy46CEUbgcCH9nrJYXQQiwwVrA5wemBX4T1XFHUw62oR2324QNnkUVXW6yYQLsPsqxZ3nsYR',
    },
    {
      data: { id: 2, creditScore: 536 },
      signature:
        '7mXXnqMx6YodEkySD3yQ5WK7CCqRL1MBRTASNhrm48oR4EPmenD2NjJqWpFNZnityFTZX5mWuHS1WhRnbdxSTPzytuCgMGuL',
    },
  ];
  for (const response of demo) {
    assert.equal(contractAccepts(response, ORACLE_PUBLIC_KEY), true);
  }
});

test('the response is valid JSON with the documented shape', () => {
  const parsed = JSON.parse(JSON.stringify(getSignedCreditScore(1)));
  assert.deepEqual(Object.keys(parsed).sort(), ['data', 'publicKey', 'signature']);
  assert.equal(typeof parsed.signature, 'string');
  assert.equal(contractAccepts(parsed, parsed.publicKey), true);
});

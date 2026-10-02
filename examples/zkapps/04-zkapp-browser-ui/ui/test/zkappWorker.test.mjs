// Offline test for the web worker API in app/zkappWorker.ts.
//
// In the browser, page.tsx calls these functions through Comlink, the worker
// talks to Devnet, and the Auro wallet adds the fee payer and sends the
// transaction. Here the same functions run in Node against a local blockchain,
// with real proofs, and the test does the wallet's part. It does not cover the
// React page, Comlink messaging or the wallet itself.
//
// Run with `npm test` after `npm run build` in ../contracts. Node.js 22.18 or
// later strips the TypeScript types of app/zkappWorker.ts.

import { register } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

// One o1js for the test, the worker and the contract, as in the browser bundle.
register('./o1js-alias.mjs', import.meta.url);
const { AccountUpdate, Field, Mina, PrivateKey, UInt64 } = await import('o1js');

// `Comlink.expose(api)` at the end of zkappWorker.ts listens for messages on
// the worker's global scope. Node has none, so give it a stub.
globalThis.addEventListener ??= () => {};

const { api } = await import('../app/zkappWorker.ts');
// The same module that api.loadContract() imports, so the same class.
const { Add } = await import('../../contracts/build/src/Add.js');

test('the worker API reads state, and proves an update that the chain accepts', async (t) => {
  const Local = await Mina.LocalBlockchain({ proofsEnabled: true });
  Mina.setActiveInstance(Local);
  const [deployer, wallet] = Local.testAccounts;

  await t.test('loadContract() and compileContract()', async () => {
    await api.loadContract();
    await api.compileContract();
  });

  // Deploy Add, as tutorial 3 does on a live network.
  const zkAppKey = PrivateKey.random();
  const zkAppAddress = zkAppKey.toPublicKey();
  const deployTx = await Mina.transaction(deployer, async () => {
    AccountUpdate.fundNewAccount(deployer);
    await new Add(zkAppAddress).deploy();
  });
  await deployTx.prove();
  await deployTx.sign([deployer.key, zkAppKey]).send();

  await t.test('initZkappInstance() and getNum() return the initial state', async () => {
    await api.initZkappInstance(zkAppAddress.toBase58());
    const json = await api.getNum();
    // What ZkappWorkerClient.getNum() does with the result.
    assert.deepEqual(Field.fromJSON(JSON.parse(json)), Field(1));
  });

  await t.test('the proved transaction has no fee payer, and the wallet completes it', async () => {
    await api.createUpdateTransaction();
    await api.proveUpdateTransaction();
    const transactionJSON = await api.getTransactionJSON();

    const command = JSON.parse(transactionJSON);
    assert.notEqual(command.feePayer.body.publicKey, wallet.toBase58());
    const [zkappUpdate] = command.accountUpdates;
    assert.equal(zkappUpdate.body.publicKey, zkAppAddress.toBase58());
    assert.equal(typeof zkappUpdate.authorization.proof, 'string', 'the zkApp update carries a proof');

    // The wallet's part: set the fee payer, sign, send.
    command.feePayer.body.publicKey = wallet.toBase58();
    command.feePayer.body.fee = UInt64.from(100_000_000).toString();
    command.feePayer.body.nonce = Mina.getAccount(wallet).nonce.toString();
    const tx = Mina.Transaction.fromJSON(command);
    // A parsed transaction has no pending signature requests; ask for one.
    tx.transaction.feePayer.lazyAuthorization = { kind: 'lazy-signature' };
    await tx.sign([wallet.key]).send();
  });

  await t.test('getNum() shows the new state after the update', async () => {
    assert.deepEqual(Field.fromJSON(JSON.parse(await api.getNum())), Field(3));
  });
});

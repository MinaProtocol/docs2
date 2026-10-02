/**
 * The same flow as `main.ts`, against a local blockchain.
 *
 * `main.ts` is the tutorial: it talks to a real node, so it needs a funded
 * account, a key file and a faucet, and it waits for the network to catch up.
 * None of that can run in CI, which is why this example was only ever built
 * and never run.
 *
 * This file keeps what the tutorial is actually teaching — deploying a zkApp
 * to a key that is not the fee payer's, and driving it from a script rather
 * than a browser — and drops only the parts that need a network.
 */

import { AccountUpdate, Mina, PrivateKey } from 'o1js';
import { Square } from './Square.js';

const proofsEnabled = false;

const Local = await Mina.LocalBlockchain({ proofsEnabled });
Mina.setActiveInstance(Local);

// On a real network this is your own funded account, read from
// `keys/<alias>.json` and topped up at the faucet. A local blockchain hands
// out pre-funded accounts instead.
const deployer = Local.testAccounts[0];

// The zkApp lives at its own key, not the fee payer's. That separation is the
// point of deploying programmatically rather than with `zk deploy`.
const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();
const zkApp = new Square(zkAppAddress);

console.log('fee payer :', deployer.toBase58());
console.log('zkApp     :', zkAppAddress.toBase58());

if (proofsEnabled) {
  console.log('compiling...');
  await Square.compile();
}

// ----------------------------------------------------

console.log('\ndeploying...');
// docs:start deploy
const deployTx = await Mina.transaction(deployer, async () => {
  // The fee payer pays the account creation fee for the new zkApp account.
  AccountUpdate.fundNewAccount(deployer);
  await zkApp.deploy();
});
await deployTx.prove();
await deployTx.sign([deployer.key, zkAppPrivateKey]).send();

// `main.ts` polls `loopUntilAccountExists` here. A remote node is eventually
// consistent, so the account is not readable the instant the transaction is
// sent. A local blockchain applies the transaction as it is sent, so there is
// nothing to wait for.
const num = zkApp.num.get();
console.log(`current value of num is ${num.toString()}`);
// docs:end deploy

// ----------------------------------------------------

console.log('\nupdating num to its square...');
const updateTx = await Mina.transaction(deployer, async () => {
  await zkApp.update(num.mul(num));
});
await updateTx.prove();
await updateTx.sign([deployer.key]).send();

console.log(`updated state! ${zkApp.num.get().toString()}`);

// ----------------------------------------------------

console.log('\nrejecting an update that is not the square...');
try {
  const badTx = await Mina.transaction(deployer, async () => {
    await zkApp.update(zkApp.num.get().add(1));
  });
  await badTx.prove();
  await badTx.sign([deployer.key]).send();
  console.log('the contract accepted it, which it should not have');
} catch (error) {
  console.log(`rejected, as it should be: ${(error as Error).message.split('\n')[0]}`);
}

console.log(`state is still ${zkApp.num.get().toString()}`);

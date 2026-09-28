import { fileURLToPath } from 'node:url';
import { AccountUpdate, Field, Mina, PrivateKey } from 'o1js';
import { Adder } from './Adder.js';
import { Caller } from './Caller.js';
import { Incrementer } from './Incrementer.js';

export async function main(proofsEnabled = false) {
  // A local blockchain, so this runs with no network, no faucet and no funds.
  const Local = await Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);

  // A test account that pays all the fees
  const feePayer = Local.testAccounts[0];

  // One key pair, and so one address, for each contract
  const incrementerKey = PrivateKey.randomKeypair();
  const adderKey = PrivateKey.randomKeypair();
  const callerKey = PrivateKey.randomKeypair();

  const incrementer = new Incrementer(incrementerKey.publicKey);
  const adder = new Adder(adderKey.publicKey);
  const caller = new Caller(callerKey.publicKey);

  // With proofs on, compile each contract to get its prover and its
  // verification key
  if (proofsEnabled) {
    console.log('compiling...');
    await Incrementer.compile();
    await Adder.compile();
    await Caller.compile();
  }

  // Deploy the three contracts in one transaction
  console.log('deploying the three contracts...');
  const deployTx = await Mina.transaction(feePayer, async () => {
    AccountUpdate.fundNewAccount(feePayer, 3);
    await incrementer.deploy();
    await adder.deploy();
    await caller.deploy();
  });
  await deployTx.prove();
  await deployTx.sign([
    feePayer.key,
    incrementerKey.privateKey,
    adderKey.privateKey,
    callerKey.privateKey,
  ]).send();

  // Call Caller, which calls Adder, which calls Incrementer
  console.log('calling Caller.callAddAndEmit(5, 6)...');
  const callTx = await Mina.transaction(feePayer, async () => {
    await caller.callAddAndEmit(
      adderKey.publicKey,
      incrementerKey.publicKey,
      Field(5),
      Field(6)
    );
  });
  // One proof for each of the three contracts
  await callTx.prove();
  await callTx.sign([feePayer.key]).send();

  // The account updates of the call, one line for each
  for (const update of callTx.transaction.accountUpdates) {
    const indent = '  '.repeat(update.body.callDepth);
    console.log(`${indent}${update.label}`);
  }

  const sum = caller.sum.get();
  console.log('sum on chain:', sum.toString());

  const events = await caller.fetchEvents();
  for (const event of events) {
    console.log(`event '${event.type}':`, event.event.data.toString());
  }

  return sum;
}

// Run main() only when this file is the entry point, not when a test imports it
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}

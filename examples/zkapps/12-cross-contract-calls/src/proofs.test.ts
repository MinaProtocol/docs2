import { AccountUpdate, Field, Mina, PrivateKey, PublicKey } from 'o1js';
import { Adder } from './Adder';
import { Caller } from './Caller';
import { Incrementer } from './Incrementer';

// Proofs are on. The claims in this file depend on proving: a caller's proof
// covers the callee's result, and the network checks each callee's proof
// against the verification key of the account at the address that was called.
// Compiling and proving take minutes, so these tests have a long timeout.
const proofsEnabled = true;

let feePayer: Mina.TestPublicKey;
let incrementerKey: { privateKey: PrivateKey; publicKey: PublicKey };
let adderKey: { privateKey: PrivateKey; publicKey: PublicKey };
let callerKey: { privateKey: PrivateKey; publicKey: PublicKey };
let caller: Caller;

describe('cross-contract calls, with proofs', () => {
  beforeAll(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);

    feePayer = Local.testAccounts[0];
    incrementerKey = PrivateKey.randomKeypair();
    adderKey = PrivateKey.randomKeypair();
    callerKey = PrivateKey.randomKeypair();
    caller = new Caller(callerKey.publicKey);

    await Incrementer.compile();
    await Adder.compile();
    await Caller.compile();

    const tx = await Mina.transaction(feePayer, async () => {
      AccountUpdate.fundNewAccount(feePayer, 3);
      await new Incrementer(incrementerKey.publicKey).deploy();
      await new Adder(adderKey.publicKey).deploy();
      await caller.deploy();
    });
    await tx.prove();
    await tx.sign([
      feePayer.key,
      incrementerKey.privateKey,
      adderKey.privateKey,
      callerKey.privateKey,
    ]).send();
  });

  it('gives each contract its own verification key', () => {
    const hashes = [
      incrementerKey.publicKey,
      adderKey.publicKey,
      callerKey.publicKey,
    ].map((address) =>
      Mina.getAccount(address).zkapp!.verificationKey!.hash.toString()
    );

    expect(new Set(hashes).size).toBe(3);
  });

  it('proves callAddAndEmit(5, 6) with three proofs and stores 12', async () => {
    const tx = await Mina.transaction(feePayer, async () => {
      await caller.callAddAndEmit(
        adderKey.publicKey,
        incrementerKey.publicKey,
        Field(5),
        Field(6)
      );
    });
    const proofs = await tx.prove();
    await tx.sign([feePayer.key]).send();

    // prove() returns one entry for each account update, and each of the
    // three account updates has a proof
    expect(proofs.proofs.filter((proof) => proof !== undefined)).toHaveLength(3);
    expect(caller.sum.get().toString()).toBe('12');

    const events = await caller.fetchEvents();
    expect(events.map((e) => [e.type, e.event.data.toString()])).toEqual([
      ['sum', '12'],
    ]);
  });

  it('rejects a call whose adder address holds a different contract', async () => {
    // The Adder proof is checked against the verification key of the account
    // at the address that was called. That account holds the Incrementer
    // verification key, so the proof is invalid.
    const tx = await Mina.transaction(feePayer, async () => {
      await caller.callAddAndEmit(
        incrementerKey.publicKey,
        incrementerKey.publicKey,
        Field(1),
        Field(1)
      );
    });
    await tx.prove();

    await expect(tx.sign([feePayer.key]).send()).rejects.toThrow(
      /Invalid proof for account update/
    );
    expect(caller.sum.get().toString()).toBe('12');
  });
});

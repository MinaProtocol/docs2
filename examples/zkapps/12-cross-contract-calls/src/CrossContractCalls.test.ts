import { AccountUpdate, Bool, Field, Mina, PrivateKey, PublicKey } from 'o1js';
import { Adder } from './Adder';
import { Caller } from './Caller';
import { Incrementer } from './Incrementer';
import { main } from './main';

// Proofs are off so this suite runs in seconds. The calls, the return values,
// the account update tree, the event and the permission checks are all
// exercised either way. The claims that only a proof can check are in
// proofs.test.ts.
const proofsEnabled = false;

let feePayer: Mina.TestPublicKey;
let incrementerKey: { privateKey: PrivateKey; publicKey: PublicKey };
let adderKey: { privateKey: PrivateKey; publicKey: PublicKey };
let callerKey: { privateKey: PrivateKey; publicKey: PublicKey };
let incrementer: Incrementer;
let adder: Adder;
let caller: Caller;

async function callAddAndEmit(
  x: Field,
  y: Field,
  adderAddress = adderKey.publicKey,
  incrementerAddress = incrementerKey.publicKey
) {
  const tx = await Mina.transaction(feePayer, async () => {
    await caller.callAddAndEmit(adderAddress, incrementerAddress, x, y);
  });
  await tx.prove();
  await tx.sign([feePayer.key]).send();
  return tx;
}

describe('cross-contract calls', () => {
  beforeAll(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);

    feePayer = Local.testAccounts[0];
    incrementerKey = PrivateKey.randomKeypair();
    adderKey = PrivateKey.randomKeypair();
    callerKey = PrivateKey.randomKeypair();
    incrementer = new Incrementer(incrementerKey.publicKey);
    adder = new Adder(adderKey.publicKey);
    caller = new Caller(callerKey.publicKey);

    const tx = await Mina.transaction(feePayer, async () => {
      AccountUpdate.fundNewAccount(feePayer, 3);
      await incrementer.deploy();
      await adder.deploy();
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

  it('deploys the three contracts, with sum set to 0', () => {
    for (const address of [
      incrementerKey.publicKey,
      adderKey.publicKey,
      callerKey.publicKey,
    ]) {
      expect(Mina.getAccount(address).zkapp?.verificationKey).toBeDefined();
    }
    expect(caller.sum.get().toString()).toBe('0');
  });

  it('Incrementer.increment() returns its argument plus 1', async () => {
    let result: Field | undefined;
    const tx = await Mina.transaction(feePayer, async () => {
      result = await incrementer.increment(Field(41));
    });
    await tx.prove();
    await tx.sign([feePayer.key]).send();

    expect(result?.toString()).toBe('42');
  });

  it('Adder.addPlus1() returns x + y + 1, with the 1 added by Incrementer', async () => {
    let result: Field | undefined;
    const tx = await Mina.transaction(feePayer, async () => {
      result = await adder.addPlus1(incrementerKey.publicKey, Field(5), Field(6));
    });
    await tx.prove();
    await tx.sign([feePayer.key]).send();

    expect(result?.toString()).toBe('12');

    // Adder is the top-level update and Incrementer is its child
    const updates = tx.transaction.accountUpdates;
    expect(updates.map((u) => [u.label, u.body.callDepth])).toEqual([
      ['Adder.addPlus1()', 0],
      ['Incrementer.increment()', 1],
    ]);
  });

  it('Caller.callAddAndEmit(5, 6) stores 12 on chain', async () => {
    await callAddAndEmit(Field(5), Field(6));

    expect(caller.sum.get().toString()).toBe('12');
  });

  it('emits a sum event with the same value', async () => {
    const events = await caller.fetchEvents();
    const last = events[events.length - 1];

    expect(last.type).toBe('sum');
    expect(last.event.data.toString()).toBe('12');
  });

  it('makes one transaction with a tree of three account updates', async () => {
    const tx = await callAddAndEmit(Field(1), Field(2));
    const updates = tx.transaction.accountUpdates;

    // Caller is the parent, Adder its child, Incrementer its grandchild
    expect(
      updates.map((u) => [u.label, u.body.publicKey.toBase58(), u.body.callDepth])
    ).toEqual([
      ['Caller.callAddAndEmit()', callerKey.publicKey.toBase58(), 0],
      ['Adder.addPlus1()', adderKey.publicKey.toBase58(), 1],
      ['Incrementer.increment()', incrementerKey.publicKey.toBase58(), 2],
    ]);

    // Each of the three updates is authorized by a proof, so the fee payer's
    // signature is the only signature
    for (const update of updates) {
      expect(update.body.authorizationKind.isProved.toBoolean()).toBe(true);
      expect(update.body.authorizationKind.isSigned.toBoolean()).toBe(false);
    }

    expect(caller.sum.get().toString()).toBe('4');
  });

  it('changes state only on Caller: Adder and Incrementer stay stateless', () => {
    for (const address of [incrementerKey.publicKey, adderKey.publicKey]) {
      const appState = Mina.getAccount(address).zkapp?.appState ?? [];
      expect(appState.every((field) => field.toString() === '0')).toBe(true);
    }
  });

  it('rejects a call with an incrementer address that has no account', async () => {
    const nobody = PrivateKey.random().toPublicKey();

    // The call makes an account update for `nobody`. The network would have to
    // create that account, and nobody pays the account creation fee.
    await expect(
      callAddAndEmit(Field(5), Field(6), adderKey.publicKey, nobody)
    ).rejects.toThrow(/Invalid fee excess/);
    expect(caller.sum.get().toString()).toBe('4');
  });

  it('rejects a signature where the permissions require a proof', async () => {
    // The default permissions let only a proof change a zkApp's state. This
    // update tries to write sum = 999 with the zkApp's private key instead.
    const tx = await Mina.transaction(feePayer, async () => {
      const update = AccountUpdate.createSigned(callerKey.publicKey);
      update.update.appState[0] = { isSome: Bool(true), value: Field(999) };
    });

    await expect(
      tx.sign([feePayer.key, callerKey.privateKey]).send()
    ).rejects.toThrow(/Update_not_permitted_app_state/);
    expect(caller.sum.get().toString()).toBe('4');
  });

  it('accepts the wrong adder address when proofs are off', async () => {
    // With proofs off, nothing checks that the account at an address runs the
    // contract that the caller expected. proofs.test.ts shows that the same
    // transaction is rejected when proofs are on.
    await callAddAndEmit(
      Field(5),
      Field(6),
      incrementerKey.publicKey,
      incrementerKey.publicKey
    );
    expect(caller.sum.get().toString()).toBe('12');
  });
});

describe('main()', () => {
  it('runs end to end and returns the sum 12', async () => {
    const sum = await main();
    expect(sum.toString()).toBe('12');
  });
});

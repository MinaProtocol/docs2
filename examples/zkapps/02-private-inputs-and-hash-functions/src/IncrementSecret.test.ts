import {
  AccountUpdate,
  Field,
  Mina,
  Poseidon,
  PrivateKey,
  PublicKey,
} from 'o1js';
import { IncrementSecret } from './IncrementSecret';

// Proofs are off so the suite runs in seconds. The method's assertions, the
// state transitions and the rejections are all exercised either way.
const proofsEnabled = false;

let deployer: Mina.TestPublicKey;
let sender: Mina.TestPublicKey;
let zkAppKey: PrivateKey;
let zkAppAddress: PublicKey;
let zkApp: IncrementSecret;
let salt: Field;

async function incrementSecret(salt: Field, secret: Field) {
  const tx = await Mina.transaction(sender, async () => {
    await zkApp.incrementSecret(salt, secret);
  });
  await tx.prove();
  await tx.sign([sender.key]).send();
  return tx;
}

describe('IncrementSecret', () => {
  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);

    deployer = Local.testAccounts[0];
    sender = Local.testAccounts[1];
    zkAppKey = PrivateKey.random();
    zkAppAddress = zkAppKey.toPublicKey();
    zkApp = new IncrementSecret(zkAppAddress);
    salt = Field.random();

    if (proofsEnabled) await IncrementSecret.compile();

    // The page's main.ts: initState(salt, Field(750)).
    const tx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      await zkApp.deploy();
      await zkApp.initState(salt, Field(750));
    });
    await tx.prove();
    await tx.sign([deployer.key, zkAppKey]).send();
  });

  it('stores the hash of the salt and the secret, not the secret', () => {
    // The page: "The zkApp account on the chain does not reveal what the
    // values firstSecret or salt actually are."
    const x = zkApp.x.get();
    expect(x).toEqual(Poseidon.hash([salt, Field(750)]));
    expect(x).not.toEqual(Field(750));
    expect(x).not.toEqual(salt);
  });

  it('accepts the secret and stores the hash of secret + 1', async () => {
    // The page: "After the transaction is processed by the Mina network, x is
    // the value of Poseidon.hash([ salt, Field(750).add(1) ])."
    await incrementSecret(salt, Field(750));
    expect(zkApp.x.get()).toEqual(Poseidon.hash([salt, Field(751)]));
  });

  it('keeps the salt and the secret out of the transaction', async () => {
    // The page: "neither the secret nor the salt are part of the transaction.
    // Instead, the transaction includes only the proof [...] and an update to
    // the on-chain state x." The new state must be in it; the salt must not.
    const tx = await incrementSecret(salt, Field(750));
    const json = tx.toJSON();
    expect(json).toContain(Poseidon.hash([salt, Field(751)]).toString());
    expect(json).not.toContain(salt.toString());
  });

  it('rejects a wrong secret and leaves the state untouched', async () => {
    // The whole point of the contract: only someone who knows the secret can
    // move the state.
    await expect(incrementSecret(salt, Field(749))).rejects.toThrow();
    expect(zkApp.x.get()).toEqual(Poseidon.hash([salt, Field(750)]));
  });

  it('rejects the right secret with the wrong salt', async () => {
    // The page's "About the salt argument": the salt is part of what an
    // attacker has to know. Knowing 750 alone is not enough.
    await expect(incrementSecret(Field.random(), Field(750))).rejects.toThrow();
    expect(zkApp.x.get()).toEqual(Poseidon.hash([salt, Field(750)]));
  });

  it('moves the secret forward: 751 is accepted next, 750 is not', async () => {
    await incrementSecret(salt, Field(750));

    // The secret is now 751. Replaying the old secret must fail...
    await expect(incrementSecret(salt, Field(750))).rejects.toThrow();

    // ...and the new one must work, storing hash(salt, 752).
    await incrementSecret(salt, Field(751));
    expect(zkApp.x.get()).toEqual(Poseidon.hash([salt, Field(752)]));
  });

  it('gives a different state for a different salt', () => {
    // The page: "The state strings are different because Field.random()
    // generates the salt." Same secret, different salt, different hash — the
    // reason a reader's output never matches the page's.
    const other = Field.random();
    expect(Poseidon.hash([other, Field(750)])).not.toEqual(zkApp.x.get());
  });
});

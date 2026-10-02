import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import {
  AccountUpdate,
  Mina,
  PrivateKey,
  PublicKey,
  Signature,
  UInt64,
} from 'o1js';
import {
  Whitelist,
  WhitelistedTokenContract,
} from './WhitelistedTokenContract.js';

// Proofs are on. The claims in this file depend on proving:
// - approveBase() gets the whitelist from the prover, not as an argument, so
//   the proof must see the same whitelist as the transaction did;
// - the proof of approveBase() covers the account updates it approved, so a
//   holder cannot change the receiver after the proof is made.
// Compiling and proving take minutes, so these tests have a long timeout.
const proofsEnabled = true;
const timeout = 60 * 60 * 1000;

let deployer: Mina.TestPublicKey;
let alice: Mina.TestPublicKey;
let bob: Mina.TestPublicKey;
let carol: Mina.TestPublicKey;
let tokenKey: PrivateKey;
let token: WhitelistedTokenContract;

function balanceOf(address: PublicKey) {
  return Mina.getBalance(address, token.deriveTokenId());
}

async function setWhitelist(list: Whitelist) {
  const commitment = list.hash();
  const tx = await Mina.transaction(deployer, async () => {
    await token.setWhitelist(commitment, Signature.create(tokenKey, [commitment]));
  });
  await tx.prove();
  await tx.sign([deployer.key]).send();
}

async function mint(receiver: PublicKey, amount: UInt64, list: Whitelist) {
  const signature = Signature.create(
    tokenKey,
    amount.toFields().concat(receiver.toFields())
  );
  const tx = await Mina.transaction(deployer, async () => {
    AccountUpdate.fundNewAccount(deployer);
    await token.mint(receiver, amount, list, signature);
  });
  await tx.prove();
  await tx.sign([deployer.key]).send();
}

describe('WhitelistedTokenContract, with proofs', { timeout }, () => {
  // The whitelist after setup: carol holds tokens but is no longer on it.
  const whitelist = () => Whitelist.from([alice, bob]);

  before(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);

    [deployer, alice, bob, carol] = Local.testAccounts;
    tokenKey = PrivateKey.random();
    token = new WhitelistedTokenContract(tokenKey.toPublicKey());

    await WhitelistedTokenContract.compile();

    const deployTx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      await token.deploy();
    });
    await deployTx.prove();
    await deployTx.sign([deployer.key, tokenKey]).send();

    // Mint to alice, bob and carol while all three are whitelisted, then take
    // carol off the list.
    const all = Whitelist.from([alice, bob, carol]);
    await setWhitelist(all);
    for (const holder of [alice, bob, carol]) {
      await mint(holder, UInt64.from(1_000), all);
    }
    await setWhitelist(whitelist());
  });

  it('proves and accepts a transfer() between whitelisted holders', async () => {
    // docs:start whitelisted-transfer
    token.whitelist = Whitelist.from([alice, bob]);
    const tx = await Mina.transaction(alice, async () => {
      await token.transfer(alice, bob, UInt64.from(100));
    });
    await tx.prove();
    await tx.sign([alice.key]).send();
    // docs:end whitelisted-transfer
    token.whitelist = undefined;

    assert.strictEqual(balanceOf(alice).toString(), '900');
    assert.strictEqual(balanceOf(bob).toString(), '1100');
  });

  it('refuses a transfer() from a holder that is no longer whitelisted', async () => {
    token.whitelist = whitelist();
    await assert.rejects(async () => {
      const tx = await Mina.transaction(carol, async () => {
        await token.transfer(carol, bob, UInt64.from(100));
      });
      await tx.prove();
      await tx.sign([carol.key]).send();
    }, /the address is not on the whitelist/);
    token.whitelist = undefined;

    assert.strictEqual(balanceOf(carol).toString(), '1000');
  });

  it('refuses a proved transfer() whose receiver was changed after proving', async () => {
    token.whitelist = whitelist();
    const tx = await Mina.transaction(alice, async () => {
      await token.transfer(alice, bob, UInt64.from(100));
    });
    await tx.prove();
    token.whitelist = undefined;

    // Send to carol, who is not on the list, with the proof made for bob.
    const receiver = tx.transaction.accountUpdates.find((update) =>
      update.publicKey.equals(bob).toBoolean()
    );
    assert.ok(receiver, 'the transaction has no account update for bob');
    receiver.body.publicKey = carol;

    await assert.rejects(
      async () => tx.sign([alice.key]).send(),
      /One or more proofs were invalid/
    );

    assert.strictEqual(balanceOf(alice).toString(), '900');
    assert.strictEqual(balanceOf(carol).toString(), '1000');
  });
});

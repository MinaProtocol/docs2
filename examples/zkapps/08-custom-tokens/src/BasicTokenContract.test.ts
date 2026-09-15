import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import {
  AccountUpdate,
  Mina,
  PrivateKey,
  PublicKey,
  Signature,
  UInt64,
} from 'o1js';
import { BasicTokenContract, tokenSymbol } from './BasicTokenContract.js';

// Proofs are off so the suite runs in seconds. The account updates, the
// permissions and the token accounting are all exercised either way.
const proofsEnabled = false;

let deployer: Mina.TestPublicKey;
let alice: Mina.TestPublicKey;
let bob: Mina.TestPublicKey;
let tokenKey: PrivateKey;
let tokenAddress: PublicKey;
let token: BasicTokenContract;

function mintSignature(amount: UInt64, receiver: PublicKey) {
  return Signature.create(
    tokenKey,
    amount.toFields().concat(receiver.toFields())
  );
}

async function deploy() {
  const tx = await Mina.transaction(deployer, async () => {
    AccountUpdate.fundNewAccount(deployer);
    await token.deploy();
  });
  await tx.prove();
  await tx.sign([deployer.key, tokenKey]).send();
}

async function mint(receiver: Mina.TestPublicKey, amount: UInt64) {
  const tx = await Mina.transaction(deployer, async () => {
    AccountUpdate.fundNewAccount(deployer);
    await token.mint(receiver, amount, mintSignature(amount, receiver));
  });
  await tx.prove();
  await tx.sign([deployer.key]).send();
}

function balanceOf(address: PublicKey) {
  return Mina.getBalance(address, token.deriveTokenId());
}

describe('BasicTokenContract', () => {
  before(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);

    [deployer, alice, bob] = Local.testAccounts;
    tokenKey = PrivateKey.random();
    tokenAddress = tokenKey.toPublicKey();
    token = new BasicTokenContract(tokenAddress);

    if (proofsEnabled) await BasicTokenContract.compile();
    await deploy();
  });

  it('starts with nothing in circulation', () => {
    assert.strictEqual(
      token.totalAmountInCirculation.get().toString(),
      '0'
    );
  });

  it('sets the token symbol on deployment', () => {
    assert.strictEqual(
      Mina.getAccount(tokenAddress).tokenSymbol,
      tokenSymbol
    );
  });

  it('derives a token id that is not the MINA token id', () => {
    assert.notStrictEqual(
      token.deriveTokenId().toString(),
      '1' // the MINA token id
    );
  });

  it('mints to a receiver and raises the amount in circulation', async () => {
    await mint(alice, UInt64.from(100_000));

    assert.strictEqual(balanceOf(alice).toString(), '100000');
    assert.strictEqual(
      token.totalAmountInCirculation.get().toString(),
      '100000'
    );
  });

  it('refuses to mint without a signature from the zkApp key', async () => {
    const amount = UInt64.from(1_000);
    const wrongKey = PrivateKey.random();
    const forgedSignature = Signature.create(
      wrongKey,
      amount.toFields().concat(bob.toFields())
    );

    await assert.rejects(async () => {
      const tx = await Mina.transaction(deployer, async () => {
        AccountUpdate.fundNewAccount(deployer);
        await token.mint(bob, amount, forgedSignature);
      });
      await tx.prove();
      await tx.sign([deployer.key]).send();
    }, 'a signature from a key other than the zkApp key was accepted');

    assert.strictEqual(
      token.totalAmountInCirculation.get().toString(),
      '100000',
      'a rejected mint must not change the amount in circulation'
    );
  });

  it('refuses a signature made for a different receiver', async () => {
    const amount = UInt64.from(1_000);
    const signatureForAlice = mintSignature(amount, alice);

    await assert.rejects(async () => {
      const tx = await Mina.transaction(deployer, async () => {
        AccountUpdate.fundNewAccount(deployer);
        await token.mint(bob, amount, signatureForAlice);
      });
      await tx.prove();
      await tx.sign([deployer.key]).send();
    }, 'a signature over a different receiver was accepted');
  });

  it('sends tokens between accounts', async () => {
    const tx = await Mina.transaction(alice, async () => {
      AccountUpdate.fundNewAccount(alice);
      await token.sendTokens(alice, bob, UInt64.from(40_000));
    });
    await tx.prove();
    await tx.sign([alice.key]).send();

    assert.strictEqual(balanceOf(alice).toString(), '60000');
    assert.strictEqual(balanceOf(bob).toString(), '40000');
  });

  it('leaves the amount in circulation unchanged by a transfer', () => {
    assert.strictEqual(
      token.totalAmountInCirculation.get().toString(),
      '100000'
    );
  });

  it('refuses to send more than the sender holds', async () => {
    await assert.rejects(async () => {
      const tx = await Mina.transaction(bob, async () => {
        await token.sendTokens(bob, alice, UInt64.from(1_000_000));
      });
      await tx.prove();
      await tx.sign([bob.key]).send();
    }, 'an overdraft was accepted');

    assert.strictEqual(balanceOf(bob).toString(), '40000');
  });
});

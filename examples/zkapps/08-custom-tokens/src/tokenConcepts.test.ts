import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import {
  AccountUpdate,
  Mina,
  PrivateKey,
  PublicKey,
  Signature,
  TokenId,
  UInt64,
} from 'o1js';
import { BasicTokenContract, tokenSymbol } from './BasicTokenContract.js';

// These tests check the concepts that the "Concepts" section of tutorial 8
// explains: the token id, the token account and the approval mechanism.
// Proofs are off so the suite runs in seconds.
const proofsEnabled = false;

let deployer: Mina.TestPublicKey;
let alice: Mina.TestPublicKey;
let bob: Mina.TestPublicKey;

async function deployToken() {
  const key = PrivateKey.random();
  const token = new BasicTokenContract(key.toPublicKey());
  const tx = await Mina.transaction(deployer, async () => {
    AccountUpdate.fundNewAccount(deployer);
    await token.deploy();
  });
  await tx.prove();
  await tx.sign([deployer.key, key]).send();
  return { token, key };
}

async function mint(
  token: BasicTokenContract,
  key: PrivateKey,
  receiver: PublicKey,
  amount: UInt64,
  fundNewAccount = true
) {
  const signature = Signature.create(
    key,
    amount.toFields().concat(receiver.toFields())
  );
  const tx = await Mina.transaction(deployer, async () => {
    if (fundNewAccount) AccountUpdate.fundNewAccount(deployer);
    await token.mint(receiver, amount, signature);
  });
  await tx.prove();
  await tx.sign([deployer.key]).send();
}

describe('token concepts', () => {
  let token: BasicTokenContract;
  let tokenKey: PrivateKey;
  let tokenId: ReturnType<BasicTokenContract['deriveTokenId']>;

  before(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [deployer, alice, bob] = Local.testAccounts;

    if (proofsEnabled) await BasicTokenContract.compile();
    ({ token, key: tokenKey } = await deployToken());
    tokenId = token.deriveTokenId();
  });

  describe('token id', () => {
    it('is derived from the address of the token manager', () => {
      assert.strictEqual(
        tokenId.toString(),
        TokenId.derive(token.address).toString()
      );
    });

    it('is not the MINA token id', () => {
      assert.strictEqual(TokenId.default.toString(), '1');
      assert.notStrictEqual(tokenId.toString(), TokenId.default.toString());
    });

    it('is different for two managers with the same token symbol', async () => {
      const { token: other } = await deployToken();

      assert.strictEqual(Mina.getAccount(other.address).tokenSymbol, tokenSymbol);
      assert.strictEqual(Mina.getAccount(token.address).tokenSymbol, tokenSymbol);
      assert.notStrictEqual(
        other.deriveTokenId().toString(),
        tokenId.toString()
      );
    });
  });

  describe('token account', () => {
    it('does not exist until the key receives the token', () => {
      assert.strictEqual(Mina.hasAccount(alice, tokenId), false);
      assert.strictEqual(Mina.hasAccount(alice), true);
    });

    it('needs the account creation fee the first time', async () => {
      await assert.rejects(
        () => mint(token, tokenKey, alice, UInt64.from(1_000), false),
        /Invalid fee excess/
      );
      assert.strictEqual(Mina.hasAccount(alice, tokenId), false);
    });

    it('is a separate account from the MINA account of the same key', async () => {
      const minaBefore = Mina.getBalance(alice).toString();

      await mint(token, tokenKey, alice, UInt64.from(1_000));

      const tokenAccount = Mina.getAccount(alice, tokenId);
      assert.strictEqual(tokenAccount.tokenId.toString(), tokenId.toString());
      assert.strictEqual(tokenAccount.balance.toString(), '1000');
      assert.strictEqual(
        Mina.getBalance(alice).toString(),
        minaBefore,
        'minting the token changed the MINA balance of the receiver'
      );
    });

    it('does not need the account creation fee the second time', async () => {
      await mint(token, tokenKey, alice, UInt64.from(500), false);
      assert.strictEqual(Mina.getBalance(alice, tokenId).toString(), '1500');
    });

    it('can exist for a key that has no MINA account', async () => {
      const fresh = PrivateKey.random().toPublicKey();

      await mint(token, tokenKey, fresh, UInt64.from(10));

      assert.strictEqual(Mina.hasAccount(fresh), false);
      assert.strictEqual(Mina.getBalance(fresh, tokenId).toString(), '10');
    });
  });

  describe('approval', () => {
    it('refuses a token update that the token manager did not approve', async () => {
      await assert.rejects(async () => {
        const tx = await Mina.transaction(alice, async () => {
          AccountUpdate.fundNewAccount(alice);
          const from = AccountUpdate.createSigned(alice, tokenId);
          from.balance.subInPlace(UInt64.from(100));
          const to = AccountUpdate.create(bob, tokenId);
          to.balance.addInPlace(UInt64.from(100));
        });
        await tx.prove();
        await tx.sign([alice.key]).send();
      }, /Top-level account update can not use or pass on token permissions/);

      assert.strictEqual(Mina.getBalance(alice, tokenId).toString(), '1500');
      assert.strictEqual(Mina.hasAccount(bob, tokenId), false);
    });

    it('refuses to approve updates whose balance changes do not sum to zero', async () => {
      await assert.rejects(async () => {
        const tx = await Mina.transaction(alice, async () => {
          const update = AccountUpdate.createSigned(alice, tokenId);
          update.balance.addInPlace(UInt64.from(1_000_000));
          await token.approveAccountUpdate(update);
        });
        await tx.prove();
        await tx.sign([alice.key]).send();
      }, /Field\.assertEquals\(\): 1000000 != 0/);

      assert.strictEqual(Mina.getBalance(alice, tokenId).toString(), '1500');
    });

    it('moves tokens with transfer(), which calls approveBase()', async () => {
      const tx = await Mina.transaction(alice, async () => {
        AccountUpdate.fundNewAccount(alice);
        await token.transfer(alice, bob, UInt64.from(400));
      });
      await tx.prove();
      await tx.sign([alice.key]).send();

      assert.strictEqual(Mina.getBalance(alice, tokenId).toString(), '1100');
      assert.strictEqual(Mina.getBalance(bob, tokenId).toString(), '400');
    });

    it('refuses a transfer() that the sender did not sign', async () => {
      await assert.rejects(async () => {
        const tx = await Mina.transaction(bob, async () => {
          await token.transfer(alice, bob, UInt64.from(100));
        });
        await tx.prove();
        await tx.sign([bob.key]).send();
      }, /signature/i);

      assert.strictEqual(Mina.getBalance(alice, tokenId).toString(), '1100');
      assert.strictEqual(Mina.getBalance(bob, tokenId).toString(), '400');
    });
  });
});

import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import {
  AccountUpdate,
  Int64,
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

const proofsEnabled = false;

let deployer: Mina.TestPublicKey;
let alice: Mina.TestPublicKey;
let bob: Mina.TestPublicKey;
let mallory: Mina.TestPublicKey;
let tokenKey: PrivateKey;
let token: WhitelistedTokenContract;
let whitelist: Whitelist;

function balanceOf(address: PublicKey) {
  return Mina.getBalance(address, token.deriveTokenId());
}

async function mint(receiver: PublicKey, amount: UInt64, list = whitelist) {
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

describe('WhitelistedTokenContract', () => {
  before(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);

    [deployer, alice, bob, mallory] = Local.testAccounts;
    tokenKey = PrivateKey.random();
    token = new WhitelistedTokenContract(tokenKey.toPublicKey());
    whitelist = Whitelist.from([alice, bob]);

    if (proofsEnabled) await WhitelistedTokenContract.compile();

    const deployTx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      await token.deploy();
    });
    await deployTx.prove();
    await deployTx.sign([deployer.key, tokenKey]).send();
  });

  it('starts with no whitelist committed', () => {
    assert.strictEqual(token.whitelistCommitment.get().toString(), '0');
  });

  it('refuses to mint before a whitelist is set', async () => {
    await assert.rejects(
      async () => mint(alice, UInt64.from(1_000)),
      'minting was allowed against an uncommitted whitelist'
    );
  });

  it('accepts a whitelist signed by the zkApp key', async () => {
    const commitment = whitelist.hash();
    const signature = Signature.create(tokenKey, [commitment]);

    const tx = await Mina.transaction(deployer, async () => {
      await token.setWhitelist(commitment, signature);
    });
    await tx.prove();
    await tx.sign([deployer.key]).send();

    assert.strictEqual(
      token.whitelistCommitment.get().toString(),
      commitment.toString()
    );
  });

  it('refuses a whitelist signed by another key', async () => {
    const otherKey = PrivateKey.random();
    const commitment = Whitelist.from([mallory]).hash();
    const signature = Signature.create(otherKey, [commitment]);

    await assert.rejects(async () => {
      const tx = await Mina.transaction(deployer, async () => {
        await token.setWhitelist(commitment, signature);
      });
      await tx.prove();
      await tx.sign([deployer.key]).send();
    }, 'a whitelist signed by an unrelated key was accepted');
  });

  it('mints to a whitelisted address', async () => {
    await mint(alice, UInt64.from(100_000));

    assert.strictEqual(balanceOf(alice).toString(), '100000');
    assert.strictEqual(
      token.totalAmountInCirculation.get().toString(),
      '100000'
    );
  });

  it('refuses to mint to an address that is not on the list', async () => {
    await assert.rejects(
      async () => mint(mallory, UInt64.from(1_000)),
      'minting to an address outside the whitelist was allowed'
    );
  });

  it('refuses a whitelist that does not match the commitment', async () => {
    const forged = Whitelist.from([mallory, alice]);

    await assert.rejects(
      async () => mint(mallory, UInt64.from(1_000), forged),
      'a whitelist other than the committed one was accepted'
    );
  });

  it('sends between two whitelisted addresses', async () => {
    const tx = await Mina.transaction(alice, async () => {
      AccountUpdate.fundNewAccount(alice);
      await token.sendTokens(alice, bob, UInt64.from(25_000), whitelist);
    });
    await tx.prove();
    await tx.sign([alice.key]).send();

    assert.strictEqual(balanceOf(alice).toString(), '75000');
    assert.strictEqual(balanceOf(bob).toString(), '25000');
  });

  it('refuses to send to an address that is not on the list', async () => {
    await assert.rejects(async () => {
      const tx = await Mina.transaction(alice, async () => {
        AccountUpdate.fundNewAccount(alice);
        await token.sendTokens(alice, mallory, UInt64.from(1_000), whitelist);
      });
      await tx.prove();
      await tx.sign([alice.key]).send();
    }, 'a transfer to an address outside the whitelist was allowed');

    assert.strictEqual(balanceOf(alice).toString(), '75000');
  });

  it('keeps the amount in circulation unchanged by a transfer', () => {
    assert.strictEqual(
      token.totalAmountInCirculation.get().toString(),
      '100000'
    );
  });

  // transfer() and approveAccountUpdate() are inherited from TokenContract and
  // end in approveBase(). approveBase() is a @method that checks the whitelist,
  // so these helpers do not give a way around it.
  describe('transfer(), through approveBase()', () => {
    async function transfer(
      to: PublicKey,
      amount: UInt64,
      list: Whitelist | null = whitelist
    ) {
      token.whitelist = list ?? undefined;
      try {
        const tx = await Mina.transaction(alice, async () => {
          if (!Mina.hasAccount(to, token.deriveTokenId())) {
            AccountUpdate.fundNewAccount(alice);
          }
          await token.transfer(alice, to, amount);
        });
        await tx.prove();
        await tx.sign([alice.key]).send();
      } finally {
        token.whitelist = undefined;
      }
    }

    it('moves tokens between two whitelisted addresses', async () => {
      await transfer(bob, UInt64.from(5_000));

      assert.strictEqual(balanceOf(alice).toString(), '70000');
      assert.strictEqual(balanceOf(bob).toString(), '30000');
    });

    it('refuses a transfer to an address that is not on the list', async () => {
      await assert.rejects(
        () => transfer(mallory, UInt64.from(1_000)),
        /the address is not on the whitelist/
      );
      assert.strictEqual(Mina.hasAccount(mallory, token.deriveTokenId()), false);
      assert.strictEqual(balanceOf(alice).toString(), '70000');
    });

    it('refuses a whitelist that does not match the commitment', async () => {
      await assert.rejects(
        () => transfer(mallory, UInt64.from(1_000), Whitelist.from([alice, mallory])),
        /the whitelist given is not the one this contract committed to/
      );
      assert.strictEqual(Mina.hasAccount(mallory, token.deriveTokenId()), false);
    });

    it('needs the whitelist from the caller', async () => {
      await assert.rejects(
        () => transfer(bob, UInt64.from(1_000), null),
        /set `whitelist` on the contract/
      );
      assert.strictEqual(balanceOf(bob).toString(), '30000');
    });

    it('refuses updates whose balance changes do not sum to zero', async () => {
      token.whitelist = whitelist;
      try {
        await assert.rejects(async () => {
          const tx = await Mina.transaction(alice, async () => {
            const update = AccountUpdate.create(alice, token.deriveTokenId());
            update.balanceChange = Int64.from(1_000_000);
            await token.approveAccountUpdate(update);
          });
          await tx.prove();
          await tx.sign([alice.key]).send();
        }, /Field\.assertEquals\(\): 1000000 != 0/);
      } finally {
        token.whitelist = undefined;
      }
      assert.strictEqual(balanceOf(alice).toString(), '70000');
    });
  });
});

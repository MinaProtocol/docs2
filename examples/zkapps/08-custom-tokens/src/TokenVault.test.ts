import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import {
  AccountUpdate,
  Field,
  Mina,
  Permissions,
  PrivateKey,
  PublicKey,
  Signature,
  UInt64,
} from 'o1js';
import { BasicTokenContract } from './BasicTokenContract.js';
import { TokenVault } from './TokenVault.js';

// Proofs are off so the suite runs in seconds. The permissions, the token
// approval and the vault rules are all exercised either way.
// TokenVault.proofs.test.ts runs the same flow with proofs.
const proofsEnabled = false;

let deployer: Mina.TestPublicKey;
let alice: Mina.TestPublicKey;
let bob: Mina.TestPublicKey;
let tokenKey: PrivateKey;
let token: BasicTokenContract;
let tokenId: Field;
let vaultKey: PrivateKey;
let vaultAddress: PublicKey;
let vault: TokenVault;

function balanceOf(address: PublicKey) {
  return Mina.getBalance(address, tokenId).toString();
}

function totalDeposited() {
  return vault.totalDeposited.get().toString();
}

async function mint(receiver: PublicKey, amount: UInt64) {
  const signature = Signature.create(
    tokenKey,
    amount.toFields().concat(receiver.toFields())
  );
  const tx = await Mina.transaction(deployer, async () => {
    AccountUpdate.fundNewAccount(deployer);
    await token.mint(receiver, amount, signature);
  });
  await tx.prove();
  await tx.sign([deployer.key]).send();
}

async function deposit(depositor: Mina.TestPublicKey, amount: UInt64) {
  const tx = await Mina.transaction(depositor, async () => {
    await vault.deposit(amount);
    await token.transfer(depositor, vault.self, amount);
  });
  await tx.prove();
  await tx.sign([depositor.key]).send();
}

async function withdraw(caller: Mina.TestPublicKey, amount: UInt64) {
  const tx = await Mina.transaction(caller, async () => {
    await vault.withdraw(amount);
    await token.transfer(vault.self, caller, amount);
  });
  await tx.prove();
  await tx.sign([caller.key]).send();
}

describe('TokenVault', () => {
  before(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);

    [deployer, alice, bob] = Local.testAccounts;

    tokenKey = PrivateKey.random();
    token = new BasicTokenContract(tokenKey.toPublicKey());
    tokenId = token.deriveTokenId();

    vaultKey = PrivateKey.random();
    vaultAddress = vaultKey.toPublicKey();
    vault = new TokenVault(vaultAddress, tokenId);

    const deployTx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      await token.deploy();
    });
    await deployTx.prove();
    await deployTx.sign([deployer.key, tokenKey]).send();

    await mint(alice, UInt64.from(10_000));
    await mint(bob, UInt64.from(10_000));
  });

  it('refuses to deploy the vault without the approval of the token manager', async () => {
    const otherKey = PrivateKey.random();
    const otherVault = new TokenVault(otherKey.toPublicKey(), tokenId);

    await assert.rejects(async () => {
      const tx = await Mina.transaction(deployer, async () => {
        AccountUpdate.fundNewAccount(deployer);
        await otherVault.deploy({ owner: alice });
      });
      await tx.prove();
      await tx.sign([deployer.key, otherKey]).send();
    }, /Token_owner_not_caller/);

    assert.strictEqual(
      Mina.hasAccount(otherKey.toPublicKey(), tokenId),
      false,
      'a vault was deployed without the token manager'
    );
  });

  it('deploys the vault on a token account, approved by the token manager', async () => {
    const tx = await Mina.transaction(deployer, async () => {
      // One new account: the vault's token account.
      AccountUpdate.fundNewAccount(deployer);
      await vault.deploy({ owner: alice });
      await token.approveAccountUpdate(vault.self);
    });
    await tx.prove();
    await tx.sign([deployer.key, vaultKey]).send();

    // The vault is the account (vault address, token id). The same address
    // has no MINA account.
    assert.ok(Mina.hasAccount(vaultAddress, tokenId));
    assert.strictEqual(Mina.hasAccount(vaultAddress), false);
    assert.ok(Mina.getAccount(vaultAddress, tokenId).zkapp?.verificationKey);

    assert.ok(vault.owner.get().equals(alice).toBoolean());
    assert.strictEqual(totalDeposited(), '0');
    assert.strictEqual(balanceOf(vaultAddress), '0');
  });

  it('takes a deposit from the owner', async () => {
    await deposit(alice, UInt64.from(3_000));

    assert.strictEqual(balanceOf(alice), '7000');
    assert.strictEqual(balanceOf(vaultAddress), '3000');
    assert.strictEqual(totalDeposited(), '3000');
  });

  it('takes a deposit from an account that is not the owner', async () => {
    await deposit(bob, UInt64.from(2_000));

    assert.strictEqual(balanceOf(bob), '8000');
    assert.strictEqual(balanceOf(vaultAddress), '5000');
    assert.strictEqual(totalDeposited(), '5000');
  });

  it('refuses a deposit that the token manager did not approve', async () => {
    await assert.rejects(async () => {
      const tx = await Mina.transaction(alice, async () => {
        await vault.deposit(UInt64.from(1_000));
        const payment = AccountUpdate.createSigned(alice, tokenId);
        payment.balance.subInPlace(UInt64.from(1_000));
      });
      await tx.prove();
      await tx.sign([alice.key]).send();
    }, /Top-level account update can not use or pass on token permissions/);

    assert.strictEqual(totalDeposited(), '5000');
    assert.strictEqual(balanceOf(alice), '7000');
  });

  it('refuses a deposit that no account pays for', async () => {
    // The token manager is asked to approve only the vault update. Its
    // approveBase() requires the balance changes to sum to zero.
    await assert.rejects(async () => {
      const tx = await Mina.transaction(alice, async () => {
        await vault.deposit(UInt64.from(1_000));
        await token.approveAccountUpdate(vault.self);
      });
      await tx.prove();
      await tx.sign([alice.key]).send();
    }, /Field.assertEquals\(\): 1000 != 0/);

    assert.strictEqual(totalDeposited(), '5000');
    assert.strictEqual(balanceOf(vaultAddress), '5000');
  });

  it('refuses tokens sent to the vault without deposit()', async () => {
    // The vault has the `proof` permission for `receive`, so only a proof of
    // deposit() can add tokens. totalDeposited then counts every token.
    await assert.rejects(async () => {
      const tx = await Mina.transaction(bob, async () => {
        await token.transfer(bob, vaultAddress, UInt64.from(1_000));
      });
      await tx.prove();
      await tx.sign([bob.key]).send();
    }, /Update_not_permitted_balance/);

    assert.strictEqual(balanceOf(vaultAddress), '5000');
    assert.strictEqual(balanceOf(bob), '8000');
  });

  it('refuses a withdrawal by an account that is not the owner', async () => {
    await assert.rejects(
      async () => withdraw(bob, UInt64.from(1_000)),
      /only the owner can withdraw/
    );

    assert.strictEqual(balanceOf(vaultAddress), '5000');
    assert.strictEqual(balanceOf(bob), '8000');
  });

  it('refuses a withdrawal of more than the total deposited', async () => {
    await assert.rejects(
      async () => withdraw(alice, UInt64.from(5_001)),
      /cannot withdraw more than the total deposited/
    );

    assert.strictEqual(balanceOf(vaultAddress), '5000');
    assert.strictEqual(totalDeposited(), '5000');
  });

  it('refuses a withdrawal that the token manager did not approve', async () => {
    await assert.rejects(async () => {
      const tx = await Mina.transaction(alice, async () => {
        await vault.withdraw(UInt64.from(1_000));
        const receiver = AccountUpdate.create(alice, tokenId);
        receiver.balance.addInPlace(UInt64.from(1_000));
      });
      await tx.prove();
      await tx.sign([alice.key]).send();
    }, /Top-level account update can not use or pass on token permissions/);

    assert.strictEqual(balanceOf(vaultAddress), '5000');
  });

  it('pays a withdrawal to the owner and lowers the total deposited', async () => {
    await withdraw(alice, UInt64.from(4_000));

    assert.strictEqual(balanceOf(alice), '11000');
    assert.strictEqual(balanceOf(vaultAddress), '1000');
    assert.strictEqual(totalDeposited(), '1000');
  });

  it('keeps the vault rules: nobody can change its permissions', async () => {
    // Without this, the holder of the vault key could set `send` to
    // `signature()` and take the tokens without withdraw().
    await assert.rejects(async () => {
      const tx = await Mina.transaction(deployer, async () => {
        const update = AccountUpdate.createSigned(vaultAddress, tokenId);
        update.account.permissions.set({
          ...Mina.getAccount(vaultAddress, tokenId).permissions,
          send: Permissions.signature(),
        });
        await token.approveAccountUpdate(update);
      });
      await tx.prove();
      await tx.sign([deployer.key, vaultKey]).send();
    }, /permission for this field is 'Impossible'/);
  });
});

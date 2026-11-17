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
import { BasicTokenContract } from './BasicTokenContract.js';
import { TokenVault } from './TokenVault.js';

// Proofs are on. The claims in this file depend on proving:
// - the token manager proves its approval of the vault updates, and the vault
//   proves deposit() and withdraw(), in one transaction;
// - the proof of deposit() covers the balance change of the vault, so the
//   amount that the token manager moves must be the amount that deposit()
//   records.
// Compiling and proving take minutes, so these tests have a long timeout.
const proofsEnabled = true;
const timeout = 60 * 60 * 1000;

let deployer: Mina.TestPublicKey;
let alice: Mina.TestPublicKey;
let tokenKey: PrivateKey;
let token: BasicTokenContract;
let vaultKey: PrivateKey;
let vault: TokenVault;

function balanceOf(address: PublicKey) {
  return Mina.getBalance(address, token.deriveTokenId()).toString();
}

describe('TokenVault, with proofs', { timeout }, () => {
  before(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);

    [deployer, alice] = Local.testAccounts;
    tokenKey = PrivateKey.random();
    token = new BasicTokenContract(tokenKey.toPublicKey());
    vaultKey = PrivateKey.random();
    vault = new TokenVault(vaultKey.toPublicKey(), token.deriveTokenId());

    await BasicTokenContract.compile();
    await TokenVault.compile();

    const deployTx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer, 2);
      await token.deploy();
      await vault.deploy({ owner: alice });
      await token.approveAccountUpdate(vault.self);
    });
    await deployTx.prove();
    await deployTx.sign([deployer.key, tokenKey, vaultKey]).send();

    const amount = UInt64.from(1_000);
    const signature = Signature.create(
      tokenKey,
      amount.toFields().concat(alice.toFields())
    );
    const mintTx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      await token.mint(alice, amount, signature);
    });
    await mintTx.prove();
    await mintTx.sign([deployer.key]).send();
  });

  it('proves and accepts a deposit and a withdrawal', async () => {
    const depositTx = await Mina.transaction(alice, async () => {
      await vault.deposit(UInt64.from(600));
      await token.transfer(alice, vault.self, UInt64.from(600));
    });
    await depositTx.prove();
    await depositTx.sign([alice.key]).send();

    assert.strictEqual(balanceOf(alice), '400');
    assert.strictEqual(balanceOf(vault.address), '600');
    assert.strictEqual(vault.totalDeposited.get().toString(), '600');

    const withdrawTx = await Mina.transaction(alice, async () => {
      await vault.withdraw(UInt64.from(200));
      await token.transfer(vault.self, alice, UInt64.from(200));
    });
    await withdrawTx.prove();
    await withdrawTx.sign([alice.key]).send();

    assert.strictEqual(balanceOf(alice), '600');
    assert.strictEqual(balanceOf(vault.address), '400');
    assert.strictEqual(vault.totalDeposited.get().toString(), '400');
  });

  it('refuses a deposit whose transfer amount is not the amount deposit() records', async () => {
    // deposit() records 100, but transfer() changes the balance change of the
    // vault update to 500 after the method ran. deposit() cannot be proved for
    // that update, so tx.prove() fails. With proofs off, a local blockchain
    // does not check this and accepts the transaction.
    const tx = await Mina.transaction(alice, async () => {
      await vault.deposit(UInt64.from(100));
      await token.transfer(alice, vault.self, UInt64.from(500));
    });
    await assert.rejects(async () => tx.prove());

    assert.strictEqual(balanceOf(vault.address), '400');
    assert.strictEqual(vault.totalDeposited.get().toString(), '400');
  });
});

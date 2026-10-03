import {
  AccountUpdate,
  AccountUpdateForest,
  Bool,
  Int64,
  Mina,
  Permissions,
  PrivateKey,
  PublicKey,
  Reducer,
  SmartContract,
  TokenContract,
  UInt64,
  method,
} from 'o1js';
import { main } from './main';
import { WrappedMina } from './WrappedMina';

// Proofs are off. The claims that depend on proving are in
// src/AdvancedAccountUpdates.proofs.test.ts.
const proofsEnabled = false;

// 1 MINA is 10^9 nanomina
const MINA = 1_000_000_000n;

let feePayer: Mina.TestPublicKey;
let user: Mina.TestPublicKey;
let other: Mina.TestPublicKey;
let wrappedMinaKey: { privateKey: PrivateKey; publicKey: PublicKey };
let wrappedMina: WrappedMina;
let Local: Awaited<ReturnType<typeof Mina.LocalBlockchain>>;

function minaOf(address: PublicKey) {
  return Mina.getBalance(address).toBigInt();
}
function wMinaOf(address: PublicKey) {
  return Mina.getBalance(address, wrappedMina.wMINA).toBigInt();
}

// A transaction in which `user` wraps `amount` nanomina
async function wrapTx(amount: bigint, newAccount: boolean) {
  const tx = await Mina.transaction(feePayer, async () => {
    if (newAccount) AccountUpdate.fundNewAccount(feePayer);
    const sender = AccountUpdate.createSigned(user);
    sender.balance.subInPlace(amount);
    await wrappedMina.wrap(sender.extractTree());
  });
  await tx.prove();
  return tx.sign([feePayer.key, user.key]);
}

// A transaction in which `from` unwraps `amount` nanomina
async function unwrapTx(from: Mina.TestPublicKey, amount: bigint) {
  const tx = await Mina.transaction(feePayer, async () => {
    const sender = AccountUpdate.createSigned(from, wrappedMina.wMINA);
    sender.balance.subInPlace(amount);
    await wrappedMina.unwrap(sender.extractTree());
  });
  await tx.prove();
  return tx.sign([feePayer.key, from.key]);
}

async function settleTx(payer = feePayer) {
  const tx = await Mina.transaction(payer, async () => {
    await wrappedMina.settleTotalSupply();
  });
  await tx.prove();
  return tx.sign([payer.key]);
}

// A contract that keeps its reducer in a property with a different name
class MisnamedReducer extends SmartContract {
  supplyReducer = Reducer({ actionType: Int64 });

  @method async dispatchOne() {
    this.supplyReducer.dispatch(Int64.one);
  }
}

describe('WrappedMina', () => {
  beforeAll(async () => {
    Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [feePayer, user, other] = Local.testAccounts;

    wrappedMinaKey = PrivateKey.randomKeypair();
    wrappedMina = new WrappedMina(wrappedMinaKey.publicKey);
  });

  it('deploys with a total supply of 0 and the initial action state', async () => {
    const tx = await Mina.transaction(feePayer, async () => {
      AccountUpdate.fundNewAccount(feePayer);
      await wrappedMina.deploy();
    });
    await tx.prove();
    await tx.sign([feePayer.key, wrappedMinaKey.privateKey]).send();

    expect(wrappedMina.totalSupply.get().toBigInt()).toBe(0n);
    expect(wrappedMina.actionState.get()).toEqual(Reducer.initialActionState);
    expect(minaOf(wrappedMinaKey.publicKey)).toBe(0n);
  });

  describe('wrap()', () => {
    it('takes 10 MINA from the user and mints 10 wMINA to the user', async () => {
      const userMinaBefore = minaOf(user);
      await (await wrapTx(10n * MINA, true)).send();

      // The fee payer pays the fee and the account creation fee, so the
      // user's MINA balance goes down by exactly 10 MINA
      expect(minaOf(user)).toBe(userMinaBefore - 10n * MINA);
      expect(wMinaOf(user)).toBe(10n * MINA);
      expect(minaOf(wrappedMinaKey.publicKey)).toBe(10n * MINA);
    });

    it('does not change totalSupply until settleTotalSupply()', () => {
      expect(wrappedMina.totalSupply.get().toBigInt()).toBe(0n);
    });

    it('rejects a transaction that the user did not sign', async () => {
      const tx = await Mina.transaction(feePayer, async () => {
        const sender = AccountUpdate.createSigned(user);
        sender.balance.subInPlace(1n * MINA);
        await wrappedMina.wrap(sender.extractTree());
      });
      await tx.prove();
      // Only the fee payer signs
      await expect(tx.sign([feePayer.key]).send()).rejects.toThrow(
        /permission for this field is 'Signature', but the required authorization was not provided/
      );
      expect(wMinaOf(user)).toBe(10n * MINA);
    });

    it('rejects a sender update on a token other than MINA', async () => {
      await expect(
        Mina.transaction(feePayer, async () => {
          const sender = AccountUpdate.createSigned(user, wrappedMina.wMINA);
          sender.balance.subInPlace(1n * MINA);
          await wrappedMina.wrap(sender.extractTree());
        })
      ).rejects.toThrow(/the sender must send MINA/);
    });

    it('rejects a sender update that sends no MINA', async () => {
      await expect(
        Mina.transaction(feePayer, async () => {
          const sender = AccountUpdate.createSigned(user);
          await wrappedMina.wrap(sender.extractTree());
        })
      ).rejects.toThrow(/the sender must send a positive amount/);
    });

    it('rejects a sender update that has children', async () => {
      await expect(
        Mina.transaction(feePayer, async () => {
          const sender = AccountUpdate.createSigned(user);
          sender.balance.subInPlace(1n * MINA);
          // A child that could mint wMINA with the inherited permission
          const child = AccountUpdate.create(user, wrappedMina.wMINA);
          child.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;
          child.balance.addInPlace(1n * MINA);
          sender.approve(child);
          await wrappedMina.wrap(sender.extractTree());
        })
      ).rejects.toThrow(/the sender update must have no children/);
    });
  });

  describe('unwrap()', () => {
    it('burns 4 wMINA and sends 4 MINA to the user', async () => {
      const userMinaBefore = minaOf(user);
      await (await unwrapTx(user, 4n * MINA)).send();

      expect(wMinaOf(user)).toBe(6n * MINA);
      expect(minaOf(user)).toBe(userMinaBefore + 4n * MINA);
      expect(minaOf(wrappedMinaKey.publicKey)).toBe(6n * MINA);
    });

    it('rejects a sender update on MINA in place of wMINA', async () => {
      await expect(
        Mina.transaction(feePayer, async () => {
          const sender = AccountUpdate.createSigned(user);
          sender.balance.subInPlace(1n * MINA);
          await wrappedMina.unwrap(sender.extractTree());
        })
      ).rejects.toThrow(/the sender must burn wMINA/);
    });

    it('rejects a sender update that changes its receive permission', async () => {
      await expect(
        Mina.transaction(feePayer, async () => {
          const sender = AccountUpdate.createSigned(user, wrappedMina.wMINA);
          sender.balance.subInPlace(1n * MINA);
          sender.account.permissions.set({
            ...Permissions.default(),
            receive: Permissions.impossible(),
          });
          await wrappedMina.unwrap(sender.extractTree());
        })
      ).rejects.toThrow(/a wMINA account must keep access and receive at none/);
    });
  });

  describe('approveBase()', () => {
    it('lets a user transfer wMINA to another account', async () => {
      const tx = await Mina.transaction(feePayer, async () => {
        AccountUpdate.fundNewAccount(feePayer);
        await wrappedMina.transfer(user, other, 2n * MINA);
      });
      await tx.prove();
      await tx.sign([feePayer.key, user.key]).send();

      expect(wMinaOf(user)).toBe(4n * MINA);
      expect(wMinaOf(other)).toBe(2n * MINA);
    });

    it('rejects updates that mint wMINA without MINA', async () => {
      const mint = AccountUpdate.default(other, wrappedMina.wMINA);
      mint.balanceChange = Int64.from(1n * MINA);
      const forest = AccountUpdateForest.fromFlatArray([mint]);

      await expect(
        Mina.transaction(feePayer, async () => {
          await wrappedMina.approveBase(forest);
        })
      ).rejects.toThrow(/the wMINA balance changes must add up to 0/);
    });

    it('rejects an update that sets the receive permission of a wMINA account', async () => {
      await expect(
        Mina.transaction(feePayer, async () => {
          const update = AccountUpdate.createSigned(other, wrappedMina.wMINA);
          update.account.permissions.set({
            ...Permissions.default(),
            receive: Permissions.impossible(),
          });
          await wrappedMina.approveAccountUpdate(update);
        })
      ).rejects.toThrow(/a wMINA account must keep access and receive at none/);
    });

    it('goes through at most 9 account updates', async () => {
      expect(TokenContract.MAX_ACCOUNT_UPDATES).toBe(9);
      const updates = Array.from({ length: 10 }, () =>
        AccountUpdate.default(other, wrappedMina.wMINA)
      );
      const forest = AccountUpdateForest.fromFlatArray(updates);

      await expect(
        Mina.transaction(feePayer, async () => {
          await wrappedMina.approveBase(forest);
        })
      ).rejects.toThrow(/exceed the supported limit of 9/);
    });

    it('rejects a new wMINA account that pays its creation fee in wMINA', async () => {
      // implicitAccountCreationFee works only on the MINA token, so a new
      // token account needs fundNewAccount()
      const newUser = Mina.TestPublicKey.random();
      const tx = await Mina.transaction(feePayer, async () => {
        const to = AccountUpdate.default(newUser, wrappedMina.wMINA);
        to.body.implicitAccountCreationFee = Bool(true);
        await wrappedMina.transfer(user, to, 2n * MINA);
      });
      await tx.prove();
      await expect(tx.sign([feePayer.key, user.key]).send()).rejects.toThrow(
        /Cannot_pay_creation_fee_in_token/
      );
      expect(Mina.hasAccount(newUser, wrappedMina.wMINA)).toBe(false);
    });

    it('rejects a wMINA transfer that the token contract does not approve', async () => {
      const tx = await Mina.transaction(feePayer, async () => {
        const from = AccountUpdate.createSigned(user, wrappedMina.wMINA);
        from.body.mayUseToken = AccountUpdate.MayUseToken.No;
        from.balance.subInPlace(1n * MINA);
        const to = AccountUpdate.create(other, wrappedMina.wMINA);
        to.body.mayUseToken = AccountUpdate.MayUseToken.No;
        to.balance.addInPlace(1n * MINA);
      });
      await expect(tx.sign([feePayer.key, user.key]).send()).rejects.toThrow(
        /Token_owner_not_caller/
      );
      expect(wMinaOf(user)).toBe(4n * MINA);
      expect(wMinaOf(other)).toBe(2n * MINA);
    });
  });

  describe('unwrap() to an address with no MINA account', () => {
    it('takes the account creation fee out of the MINA that it sends', async () => {
      // A new address that holds wMINA but has no MINA account
      const newUser = Mina.TestPublicKey.random();
      const fundTx = await Mina.transaction(feePayer, async () => {
        AccountUpdate.fundNewAccount(feePayer);
        await wrappedMina.transfer(other, newUser, 2n * MINA);
      });
      await fundTx.prove();
      await fundTx.sign([feePayer.key, other.key]).send();
      expect(Mina.hasAccount(newUser)).toBe(false);

      await (await unwrapTx(newUser, 2n * MINA)).send();

      // 2 MINA minus the account creation fee of 1 MINA
      const fee = Mina.getNetworkConstants().accountCreationFee.toBigInt();
      expect(fee).toBe(1n * MINA);
      expect(minaOf(newUser)).toBe(2n * MINA - fee);
      expect(wMinaOf(newUser)).toBe(0n);
      expect(minaOf(wrappedMinaKey.publicKey)).toBe(4n * MINA);
    });
  });

  describe('settleTotalSupply()', () => {
    it('applies the pending supply changes: +10, -4, -2', async () => {
      await (await settleTx()).send();
      // 10 wrapped, 4 and 2 unwrapped
      expect(wrappedMina.totalSupply.get().toBigInt()).toBe(4n * MINA);
      // The supply matches the MINA that the contract holds, and the wMINA
      // that the accounts hold
      expect(minaOf(wrappedMinaKey.publicKey)).toBe(4n * MINA);
      expect(wMinaOf(user) + wMinaOf(other)).toBe(4n * MINA);
    });

    it('does not count an action twice when it is called again', async () => {
      await (await settleTx()).send();
      expect(wrappedMina.totalSupply.get().toBigInt()).toBe(4n * MINA);
    });

    it('rejects a second settlement of the same actions', async () => {
      await (await wrapTx(1n * MINA, false)).send();

      // Two transactions that both settle the pending +1 MINA, made against
      // the same on-chain state. Each has its own fee payer, so that the fee
      // payer nonce does not reject the second one first.
      const first = await settleTx(feePayer);
      const second = await settleTx(other);

      await first.send();
      expect(wrappedMina.totalSupply.get().toBigInt()).toBe(5n * MINA);

      // The second one requires the old totalSupply (state field 0) and
      // actionState (state field 1)
      await expect(second.send()).rejects.toThrow(
        /Account_app_state_precondition_unsatisfied/
      );
      expect(wrappedMina.totalSupply.get().toBigInt()).toBe(5n * MINA);
    });
  });

  describe('getBalance()', () => {
    it('returns the wMINA balance of an account', async () => {
      let balance: UInt64 | undefined;
      const tx = await Mina.transaction(feePayer, async () => {
        balance = await wrappedMina.getBalance(user);
      });
      await tx.prove();
      await tx.sign([feePayer.key]).send();
      expect(balance?.toBigInt()).toBe(5n * MINA);
    });
  });

  describe('the reducer', () => {
    it('must be in a property called `reducer`', async () => {
      const contract = new MisnamedReducer(PrivateKey.random().toPublicKey());
      await expect(
        Mina.transaction(feePayer, async () => {
          await contract.dispatchOne();
        })
      ).rejects.toThrow(/dispatch is not a function/);
    });

    it('cannot settle more than 8 pending updates with actions', async () => {
      for (let i = 0; i < 9; i++) {
        await (await wrapTx(1n * MINA, false)).send();
      }
      await expect(
        Mina.transaction(feePayer, async () => {
          await wrappedMina.settleTotalSupply();
        })
      ).rejects.toThrow(/Exceeded the maximum number of lists of actions, 8/);
      expect(wrappedMina.totalSupply.get().toBigInt()).toBe(5n * MINA);
    });
  });

  // This test comes after the reducer tests: see the comment in it
  describe('an unwrap of more wMINA than the user holds', () => {
    it('is rejected, and the balances do not change', async () => {
      const actionsBefore = Local.getActions(wrappedMinaKey.publicKey);

      // The user holds 14 wMINA, and unwraps 15
      expect(wMinaOf(user)).toBe(14n * MINA);
      const tx = await unwrapTx(user, 15n * MINA);
      await expect(tx.send()).rejects.toThrow(/Overflow/);
      expect(wMinaOf(user)).toBe(14n * MINA);
      expect(minaOf(wrappedMinaKey.publicKey)).toBe(14n * MINA);

      // The account's action state does not change...
      const actionState = Mina.getAccount(wrappedMinaKey.publicKey).zkapp!
        .actionState[0];
      expect(actionState.toString()).toBe(actionsBefore.at(-1)!.hash);

      // ...but in o1js 3.0.0, Mina.LocalBlockchain keeps the action of the
      // rejected transaction in its action list. A reducer that runs after
      // it reads an action that the network never applied. That is why this
      // test runs after the reducer tests.
      const actionsAfter = Local.getActions(wrappedMinaKey.publicKey);
      expect(actionsAfter).toHaveLength(actionsBefore.length + 1);
    });
  });

  describe('two wraps made against the same on-chain state', () => {
    it('both succeed, because wrap() dispatches an action and sets no state', async () => {
      // Two users, each pays its own fee, so no nonce is shared
      const [, , , alice, bob] = Local.testAccounts;
      const actionsBefore = Local.getActions(wrappedMinaKey.publicKey).length;

      async function wrapBy(account: Mina.TestPublicKey) {
        const tx = await Mina.transaction(account, async () => {
          AccountUpdate.fundNewAccount(account);
          const sender = AccountUpdate.createSigned(account);
          sender.balance.subInPlace(3n * MINA);
          await wrappedMina.wrap(sender.extractTree());
        });
        await tx.prove();
        return tx.sign([account.key]);
      }
      // Make both transactions first, then send them
      const first = await wrapBy(alice);
      const second = await wrapBy(bob);
      await first.send();
      await second.send();

      expect(wMinaOf(alice)).toBe(3n * MINA);
      expect(wMinaOf(bob)).toBe(3n * MINA);
      expect(Local.getActions(wrappedMinaKey.publicKey)).toHaveLength(
        actionsBefore + 2
      );
    });
  });

  describe('main()', () => {
    it('runs end to end and returns the balances', async () => {
      const result = await main(false);
      expect(result.totalSupply.toBigInt()).toBe(6n * MINA);
      expect(result.userWMina.toBigInt()).toBe(6n * MINA);
      expect(result.feePayerTokens.toString()).toBe('100');
    });
  });
});

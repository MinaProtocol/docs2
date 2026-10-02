import { AccountUpdate, Field, Mina, PrivateKey, PublicKey } from 'o1js';
import { Square } from './Square';

// Proofs are off so the suite runs in seconds. The method's assertions, the
// state transitions and the rejection are all exercised either way.
const proofsEnabled = false;

let deployer: Mina.TestPublicKey;
let sender: Mina.TestPublicKey;
let zkAppKey: PrivateKey;
let zkAppAddress: PublicKey;
let zkApp: Square;

async function update(square: Field) {
  const tx = await Mina.transaction(sender, async () => {
    await zkApp.update(square);
  });
  await tx.prove();
  await tx.sign([sender.key]).send();
}

describe('Square', () => {
  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);

    deployer = Local.testAccounts[0];
    sender = Local.testAccounts[1];
    zkAppKey = PrivateKey.random();
    zkAppAddress = zkAppKey.toPublicKey();
    zkApp = new Square(zkAppAddress);

    if (proofsEnabled) await Square.compile();

    const tx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      await zkApp.deploy();
    });
    await tx.prove();
    await tx.sign([deployer.key, zkAppKey]).send();
  });

  it('starts at 3 after deployment', () => {
    // The page: "this.num.set(Field(3)) initializes the on-chain state num to
    // a value of 3."
    expect(zkApp.num.get()).toEqual(Field(3));
  });

  it('accepts the square of the current state', async () => {
    // The page prints "state after txn1: 9" for update(Field(9)) from 3.
    await update(Field(9));
    expect(zkApp.num.get()).toEqual(Field(9));
  });

  it('rejects a value that is not the square of the current state', async () => {
    await update(Field(9));

    // The page prints "Field.assertEquals(): 75 != 81" here. The reader is
    // told the transaction fails; assert that it does, and that the message
    // still names both numbers, because that message is printed in the
    // tutorial and a reader compares it against their own terminal.
    await expect(update(Field(75))).rejects.toThrow(/75.*81/);
  });

  it('leaves the state untouched when a transaction is rejected', async () => {
    await update(Field(9));
    await expect(update(Field(75))).rejects.toThrow();

    // The page prints "state after txn2: 9" — the rejected update must not
    // have moved the state.
    expect(zkApp.num.get()).toEqual(Field(9));
  });

  it('accepts the next square after a rejected transaction', async () => {
    await update(Field(9));
    await expect(update(Field(75))).rejects.toThrow();

    // The page's final listing prints "state after txn3: 81".
    await update(Field(81));
    expect(zkApp.num.get()).toEqual(Field(81));
  });

  it('follows the chain of squares 3 -> 9 -> 81', async () => {
    await update(Field(9));
    await update(Field(81));

    // 81 is 9 squared, and 9 is 3 squared, so each accepted value is the
    // square of the one before it. 6561 is 81 squared and is accepted too:
    // the rule is the contract's, not a property of the three numbers the
    // tutorial happens to use.
    await update(Field(81).mul(Field(81)));
    expect(zkApp.num.get()).toEqual(Field(6561));
  });

  it('rejects the square of a state the contract is not in', async () => {
    // 9 is a square, but of 3 — and the state is already 9, whose square is
    // 81. A value being *a* square is not enough.
    await update(Field(9));
    await expect(update(Field(9))).rejects.toThrow();
    expect(zkApp.num.get()).toEqual(Field(9));
  });
});

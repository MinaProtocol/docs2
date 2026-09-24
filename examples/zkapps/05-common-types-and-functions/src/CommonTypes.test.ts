import {
  AccountUpdate,
  Bool,
  Character,
  CircuitString,
  Field,
  Int64,
  MerkleMap,
  MerkleTree,
  MerkleWitness,
  Mina,
  Poseidon,
  PrivateKey,
  Provable,
  PublicKey,
  Signature,
  Struct,
  UInt32,
  UInt64,
} from 'o1js';
import { BasicMerkleTreeContract } from './BasicMerkleTreeContract';
import { LedgerContract } from './LedgerContract';

// Proofs are off so the suite runs in seconds. main.ts compiles both
// contracts and takes about two minutes; the assertions, the state
// transitions and the rejections below are exercised either way.
const proofsEnabled = false;

const height = 20;
class MerkleWitness20 extends MerkleWitness(height) {}

// Every expected value below is one the page prints in a console-output
// block. A reader compares those blocks against their own terminal.

describe('basic types', () => {
  it('compares a UInt32 and a UInt64 of the same value as equal', () => {
    const num1 = UInt32.from(40);
    const num2 = UInt64.from(40);
    const equal: Bool = num1.toUInt64().equals(num2);
    expect(equal.toBoolean()).toBe(true); // num1 === num2: true
    expect(num1.toFields().length).toBe(1); // Fields in num1: 1
  });

  it('adds signed integers across zero', () => {
    const sum = Int64.from(-3).add(Int64.from(45));
    expect(sum.toString()).toBe('42'); // signedNum1 + signedNum2: 42
    expect(Int64.from(-3).toFields().length).toBe(2); // Fields in signedNum1: 2
  });

  it('keeps characters distinct and one field wide', () => {
    const char1 = Character.fromString('c');
    const char2 = Character.fromString('d');
    expect(char1.toString()).toBe('c');
    expect(char1.toField().equals(char2.toField()).toBoolean()).toBe(false);
    expect(Character.toFields(char1).length).toBe(1);
  });
});

describe('advanced types', () => {
  it('pads a CircuitString to its fixed 128-character size', () => {
    // The page: "The default CircuitString has a maximum length of 128
    // characters because o1js types must be fixed length."
    const str1 = CircuitString.fromString('abc..xyz');
    expect(str1.toString()).toBe('abc..xyz');
    expect(CircuitString.toFields(str1).length).toBe(128);
  });

  it('counts the fields in keys and signatures', () => {
    // The page prints 2, 2 and 3. These are the out-of-circuit field
    // counts, which is what toFields() returns.
    const key = PrivateKey.random();
    const signature = Signature.create(key, [Field(1)]);
    expect(key.toFields().length).toBe(2);
    expect(key.toPublicKey().toFields().length).toBe(2);
    expect(signature.toFields().length).toBe(3);
  });

  it('verifies a signature only for the data that was signed', () => {
    const key = PrivateKey.random();
    const char1 = Character.fromString('c');
    const char2 = Character.fromString('d');
    const sum = Int64.from(-3).add(Int64.from(45));
    const str1 = CircuitString.fromString('abc..xyz');

    const data1 = Character.toFields(char2).concat(sum.toFields());
    const data2 = Character.toFields(char1).concat(
      CircuitString.toFields(str1)
    );
    const signature = Signature.create(key, data2);

    expect(signature.verify(key.toPublicKey(), data1).toBoolean()).toBe(false);
    expect(signature.verify(key.toPublicKey(), data2).toBoolean()).toBe(true);
    // And only for the key that signed it.
    const other = PrivateKey.random().toPublicKey();
    expect(signature.verify(other, data2).toBoolean()).toBe(false);
  });
});

describe('Struct', () => {
  class Point extends Struct({ x: Field, y: Field }) {
    static add(a: Point, b: Point) {
      return { x: a.x.add(b.x), y: a.y.add(b.y) };
    }
  }

  it('adds two points field by field', () => {
    const sum = Point.add(
      { x: Field(10), y: Field(4) },
      { x: Field(1), y: Field(2) }
    );
    expect(Point.toFields(sum).join(',')).toBe('11,6'); // pointSum Fields: 11,6
  });

  it('serialises a fixed-size array of eight points', () => {
    class Points8 extends Struct({
      points: [Point, Point, Point, Point, Point, Point, Point, Point],
    }) {}
    const points = new Array(8)
      .fill(null)
      .map((_, i) => ({ x: Field(i), y: Field(i * 10) }));
    const points8: Points8 = { points };
    expect(JSON.stringify(points8)).toBe(
      '{"points":[{"x":"0","y":"0"},{"x":"1","y":"10"},{"x":"2","y":"20"},' +
        '{"x":"3","y":"30"},{"x":"4","y":"40"},{"x":"5","y":"50"},' +
        '{"x":"6","y":"60"},{"x":"7","y":"70"}]}'
    );
    // Fixed size is the point of the example: 8 points, 2 fields each.
    expect(Points8.sizeInFields()).toBe(16);
  });
});

describe('control flow', () => {
  const input1 = Int64.from(10);
  const input2 = Int64.from(-15);
  const input3 = Int64.from(22);

  function largestOf(a: Int64, b: Int64, c: Int64) {
    const aLargest = a.sub(b).isPositive().and(a.sub(c).isPositive());
    const bLargest = b.sub(a).isPositive().and(b.sub(c).isPositive());
    const cLargest = c.sub(a).isPositive().and(c.sub(b).isPositive());
    return Provable.switch([aLargest, bLargest, cLargest], Int64, [a, b, c]);
  }

  it('takes an absolute value with Provable.if', () => {
    const inputSum = input1.add(input2);
    const abs = Provable.if(
      inputSum.isPositive(),
      inputSum,
      inputSum.mul(Int64.minusOne)
    );
    expect(inputSum.toString()).toBe('-5'); // inputSum: -5
    expect(abs.toString()).toBe('5'); // inputSumAbs: 5
  });

  it('picks the largest of three with Provable.switch', () => {
    expect(largestOf(input1, input2, input3).toString()).toBe('22');
    // Not a property of the order the tutorial happens to use.
    expect(largestOf(input3, input1, input2).toString()).toBe('22');
    expect(largestOf(input2, input3, input1).toString()).toBe('22');
  });
});

describe('Merkle tree and Merkle map', () => {
  it('gives a height-20 tree 2^(20-1) leaves', () => {
    // The page: "a height of 20 leads to a tree with 2^(20-1), or 524,288
    // leaves."
    expect(new MerkleTree(height).leafCount).toBe(524288n);
  });

  it('reads back a value by key', () => {
    const map = new MerkleMap();
    map.set(Field(100), Field(50));
    expect(map.get(Field(100))).toEqual(Field(50)); // value for key 100: 50
  });
});

async function setup() {
  const Local = await Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);
  return { deployer: Local.testAccounts[0], sender: Local.testAccounts[1] };
}

describe('BasicMerkleTreeContract', () => {
  let deployer: Mina.TestPublicKey;
  let sender: Mina.TestPublicKey;
  let zkApp: BasicMerkleTreeContract;
  let tree: MerkleTree;

  async function update(index: bigint, before: Field, amount: Field) {
    const witness = new MerkleWitness20(tree.getWitness(index));
    const tx = await Mina.transaction(sender, async () => {
      await zkApp.update(witness, before, amount);
    });
    await tx.prove();
    await tx.sign([sender.key]).send();
    tree.setLeaf(index, before.add(amount));
  }

  beforeEach(async () => {
    ({ deployer, sender } = await setup());
    const zkAppKey = PrivateKey.random();
    zkApp = new BasicMerkleTreeContract(zkAppKey.toPublicKey());
    tree = new MerkleTree(height);
    if (proofsEnabled) await BasicMerkleTreeContract.compile();

    const tx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      await zkApp.deploy();
      await zkApp.initState(tree.getRoot());
    });
    await tx.prove();
    await tx.sign([deployer.key, zkAppKey]).send();
  });

  it('matches the local tree root after the update', async () => {
    // main.ts prints the local and the contract root after send1 and the
    // reader is told to compare them. They must be the same number.
    await update(522n, Field(0), Field(9));
    expect(zkApp.treeRoot.get()).toEqual(tree.getRoot());
  });

  it('rejects an increment of 10 or more', async () => {
    // The page: "the update function checks that the number added was less
    // than 10." 9 is accepted above; 10 is the first value that must fail.
    const rootBefore = zkApp.treeRoot.get();
    await expect(update(522n, Field(0), Field(10))).rejects.toThrow();
    expect(zkApp.treeRoot.get()).toEqual(rootBefore);
  });

  it('rejects a wrong value for the leaf before the update', async () => {
    // The witness proves the leaf holds 0. Claiming it held 5 must fail.
    await expect(update(522n, Field(5), Field(1))).rejects.toThrow();
  });

  it('adds to a leaf that already holds a value', async () => {
    await update(522n, Field(0), Field(9));
    await update(522n, Field(9), Field(9));
    expect(tree.getLeaf(522n)).toEqual(Field(18));
    expect(zkApp.treeRoot.get()).toEqual(tree.getRoot());
  });
});

describe('LedgerContract', () => {
  let deployer: Mina.TestPublicKey;
  let sender: Mina.TestPublicKey;
  let zkAppKey: PrivateKey;
  let zkApp: LedgerContract;
  let tree: MerkleTree;
  let recipient: PublicKey;

  const senderIndex = 10n;
  const recipientIndex = 500n;
  const leaf = (balance: Field, owner: PublicKey) =>
    Poseidon.hash([balance, Poseidon.hash(owner.toFields())]);

  // The same witness choreography as main.ts: the sender witness is taken
  // before the sender leaf changes, the recipient witness after it. The local
  // tree moves first; a rejected send leaves it ahead of the contract, and no
  // test reads it after a rejection.
  async function send(opts: {
    senderBalance: Field;
    to: PublicKey;
    toIndex: bigint;
    recipientBalance: Field;
    amount: Field;
    signer?: PrivateKey;
  }) {
    const { senderBalance, to, toIndex, recipientBalance, amount } = opts;
    const senderWitness = new MerkleWitness20(tree.getWitness(senderIndex));
    tree.setLeaf(senderIndex, leaf(senderBalance.sub(amount), sender));
    const recipientWitness = new MerkleWitness20(tree.getWitness(toIndex));
    tree.setLeaf(toIndex, leaf(recipientBalance.add(amount), to));

    const signature = Signature.create(
      opts.signer ?? sender.key,
      [zkApp.ledgerRoot.get(), amount].concat(to.toFields())
    );
    const tx = await Mina.transaction(sender, async () => {
      await zkApp.sendBalance(
        senderWitness,
        recipientWitness,
        senderBalance,
        recipientBalance,
        sender,
        to,
        signature,
        amount
      );
    });
    await tx.prove();
    await tx.sign([sender.key, zkAppKey]).send();
  }

  beforeEach(async () => {
    ({ deployer, sender } = await setup());
    zkAppKey = PrivateKey.random();
    zkApp = new LedgerContract(zkAppKey.toPublicKey());
    recipient = PrivateKey.random().toPublicKey();

    // main.ts: the sender holds 100 at index 10, the recipient 7 at 500.
    tree = new MerkleTree(height);
    tree.setLeaf(senderIndex, leaf(Field(100), sender));
    tree.setLeaf(recipientIndex, leaf(Field(7), recipient));

    if (proofsEnabled) await LedgerContract.compile();
    const tx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      await zkApp.deploy();
      await zkApp.initState(tree.getRoot());
    });
    await tx.prove();
    await tx.sign([deployer.key, zkAppKey]).send();
  });

  it('moves 12 from the sender to an existing recipient', async () => {
    await send({
      senderBalance: Field(100),
      to: recipient,
      toIndex: recipientIndex,
      recipientBalance: Field(7),
      amount: Field(12),
    });
    expect(tree.getLeaf(senderIndex)).toEqual(leaf(Field(88), sender));
    expect(tree.getLeaf(recipientIndex)).toEqual(leaf(Field(19), recipient));
    expect(zkApp.ledgerRoot.get()).toEqual(tree.getRoot());
  });

  it('moves 12 to a recipient that was not in the ledger before', async () => {
    // main.ts send2: a new account at index 10000 starts from balance 0.
    const newcomer = PrivateKey.random().toPublicKey();
    await send({
      senderBalance: Field(100),
      to: newcomer,
      toIndex: 10000n,
      recipientBalance: Field(0),
      amount: Field(12),
    });
    expect(tree.getLeaf(10000n)).toEqual(leaf(Field(12), newcomer));
    expect(zkApp.ledgerRoot.get()).toEqual(tree.getRoot());
  });

  it('rejects a transfer that someone else signed', async () => {
    // The page: the contract "checks that the sender has signed their
    // transaction".
    const rootBefore = zkApp.ledgerRoot.get();
    await expect(
      send({
        senderBalance: Field(100),
        to: recipient,
        toIndex: recipientIndex,
        recipientBalance: Field(7),
        amount: Field(12),
        signer: PrivateKey.random(),
      })
    ).rejects.toThrow();
    expect(zkApp.ledgerRoot.get()).toEqual(rootBefore);
  });

  it('rejects a transfer of the whole balance or more', async () => {
    // senderBalanceBefore.assertGreaterThan(sendAmount): 100 cannot send 100.
    await expect(
      send({
        senderBalance: Field(100),
        to: recipient,
        toIndex: recipientIndex,
        recipientBalance: Field(7),
        amount: Field(100),
      })
    ).rejects.toThrow();
  });

  it('rejects a new recipient that claims a non-zero opening balance', async () => {
    // A new account must start at 0, or the sender could mint tokens for it.
    await expect(
      send({
        senderBalance: Field(100),
        to: PrivateKey.random().toPublicKey(),
        toIndex: 10000n,
        recipientBalance: Field(50),
        amount: Field(12),
      })
    ).rejects.toThrow();
  });
});

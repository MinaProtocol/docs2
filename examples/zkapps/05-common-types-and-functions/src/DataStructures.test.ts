import {
  AccountUpdate,
  Field,
  IndexedMerkleMap,
  Mina,
  PrivateKey,
  UInt32,
} from 'o1js';
import { BasicMerkleMapContract } from './BasicMerkleMapContract';
import { DynamicArrayContract, Scores } from './DynamicArrayContract';
import { IndexedMerkleMapContract, Map33 } from './IndexedMerkleMapContract';
import {
  FieldList,
  MAX_SUM_LENGTH,
  MerkleListContract,
} from './MerkleListContract';

// The provable data structures section of
// docs/zkapps/tutorials/05-common-types-and-functions.mdx. Each claim that the
// page makes about a structure has a test here that fails if the claim is
// wrong. Proofs are off, as in CommonTypes.test.ts.
const proofsEnabled = false;

async function setup() {
  const Local = await Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);
  return { deployer: Local.testAccounts[0] };
}

async function deploy<T extends { deploy(): Promise<void> }>(
  deployer: Mina.TestPublicKey,
  zkApp: T,
  zkAppKey: PrivateKey
) {
  const tx = await Mina.transaction(deployer, async () => {
    AccountUpdate.fundNewAccount(deployer);
    await zkApp.deploy();
  });
  await tx.prove();
  await tx.sign([deployer.key, zkAppKey]).send();
}

describe('IndexedMerkleMap outside a contract', () => {
  it('reads back a value by key', () => {
    const map = new Map33();
    map.insert(100n, 50n);
    expect(map.get(100n)).toEqual(Field(50)); // value for key 100: 50
  });

  it('is 2 fields in the circuit', () => {
    // Fields in Map33: 2 (the internal root and the length)
    expect(Map33.provable.sizeInFields()).toBe(2);
  });

  it('returns None from getOption for a key that is not in the map', () => {
    const map = new Map33();
    map.insert(100n, 50n);
    expect(map.getOption(101n).isSome.toBoolean()).toBe(false);
    expect(map.getOption(101n).orElse(0n)).toEqual(Field(0));
    expect(map.isIncluded(100n).toBoolean()).toBe(true);
  });

  it('rejects get() for a missing key', () => {
    const map = new Map33();
    expect(() => map.get(101n)).toThrow();
  });

  it('rejects insert() of a key that is already in the map', () => {
    const map = new Map33();
    map.insert(100n, 50n);
    expect(() => map.insert(100n, 51n)).toThrow(/Key already exists/);
  });

  it('rejects update() of a key that is not in the map', () => {
    const map = new Map33();
    expect(() => map.update(100n, 50n)).toThrow();
  });

  it('starts with key 0 and holds 2^(height-1) keys in total', () => {
    // height 3: 2^(3-1) = 4 leaves. Key 0 is already in the map, so three
    // more keys fit and the fourth is rejected.
    class Map3 extends IndexedMerkleMap(3) {}
    const map = new Map3();
    expect(map.isIncluded(0n).toBoolean()).toBe(true);
    map.insert(1n, 1n);
    map.insert(2n, 2n);
    map.insert(3n, 3n);
    expect(map.length).toEqual(Field(4));
    expect(() => map.insert(4n, 4n)).toThrow();
  });

  it('rejects a height of 53 or more', () => {
    expect(() => IndexedMerkleMap(53)).toThrow(/less than 53/);
    expect(() => IndexedMerkleMap(52)).not.toThrow();
  });
});

describe('IndexedMerkleMapContract', () => {
  let deployer: Mina.TestPublicKey;
  let zkApp: IndexedMerkleMapContract;
  let map: Map33;

  async function insert(key: bigint, value: bigint) {
    const tx = await Mina.transaction(deployer, async () => {
      await zkApp.insert(map, Field(key), Field(value));
    });
    await tx.prove();
    await tx.sign([deployer.key]).send();
    map.insert(key, value);
  }

  async function update(key: bigint, value: bigint) {
    const tx = await Mina.transaction(deployer, async () => {
      await zkApp.update(map, Field(key), Field(value));
    });
    await tx.prove();
    await tx.sign([deployer.key]).send();
    map.update(key, value);
  }

  beforeEach(async () => {
    ({ deployer } = await setup());
    const zkAppKey = PrivateKey.random();
    zkApp = new IndexedMerkleMapContract(zkAppKey.toPublicKey());
    map = new Map33();
    if (proofsEnabled) await IndexedMerkleMapContract.compile();
    await deploy(deployer, zkApp, zkAppKey);
  });

  it('starts with the root of an empty map', () => {
    expect(zkApp.mapRoot.get()).toEqual(new Map33().root);
  });

  it('matches the local map root after an insert and an update', async () => {
    await insert(100n, 50n);
    expect(zkApp.mapRoot.get()).toEqual(map.root);
    await update(100n, 51n);
    expect(map.get(100n)).toEqual(Field(51));
    expect(zkApp.mapRoot.get()).toEqual(map.root);
  });

  it('does not change the map of the caller', async () => {
    // The method changes a clone. The caller applies the change itself.
    const tx = await Mina.transaction(deployer, async () => {
      await zkApp.insert(map, Field(100), Field(50));
    });
    await tx.prove();
    await tx.sign([deployer.key]).send();
    expect(map.isIncluded(100n).toBoolean()).toBe(false);
    expect(map.root).toEqual(new Map33().root);
    expect(map.data.get().sortedLeaves.length).toBe(1);
  });

  it('rejects an insert of a key that is already in the map', async () => {
    await insert(100n, 50n);
    const rootBefore = zkApp.mapRoot.get();
    await expect(insert(100n, 51n)).rejects.toThrow(/Key already exists/);
    // The rejected transaction did not change the map of the caller.
    expect(map.data.get().sortedLeaves.length).toBe(2);
    expect(zkApp.mapRoot.get()).toEqual(rootBefore);
  });

  it('rejects an update of a key that is not in the map', async () => {
    await expect(update(100n, 50n)).rejects.toThrow();
  });

  it('rejects a map that does not match the root on chain', async () => {
    // The local map has a key that the contract never saw.
    map.insert(7n, 7n);
    await expect(insert(100n, 50n)).rejects.toThrow();
  });

  it('uses fewer rows than the MerkleMap update', async () => {
    // The page compares the circuit size of the two maps.
    const indexed = await IndexedMerkleMapContract.analyzeMethods();
    const legacy = await BasicMerkleMapContract.analyzeMethods();
    expect(indexed.insert.rows * 4).toBeLessThan(legacy.update.rows);
    expect(indexed.update.rows * 6).toBeLessThan(legacy.update.rows);
  });
});

describe('MerkleList outside a contract', () => {
  it('prints the elements in push order and is 1 field in the circuit', () => {
    const list = FieldList.empty();
    list.push(Field(1));
    list.push(Field(2));
    list.push(Field(3));
    // list elements: 1,2,3
    expect(`${list.toArrayUnconstrained().get()}`).toBe('1,2,3');
    // Fields in the list: 1
    expect(FieldList.provable.sizeInFields()).toBe(1);
  });

  it('pops the element that was pushed last', () => {
    const list = FieldList.empty();
    list.push(Field(1));
    list.push(Field(2));
    list.push(Field(3));
    expect(list.popExn()).toEqual(Field(3));
    expect(list.popExn()).toEqual(Field(2));
  });

  it('gets the same hash for the same elements in the same order', () => {
    const a = FieldList.empty();
    const b = FieldList.empty();
    const c = FieldList.empty();
    [1, 2].forEach((x) => a.push(Field(x)));
    [1, 2].forEach((x) => b.push(Field(x)));
    [2, 1].forEach((x) => c.push(Field(x)));
    expect(a.hash).toEqual(b.hash);
    expect(a.hash).not.toEqual(c.hash);
  });

  it('rejects popExn() on an empty list', () => {
    expect(() => FieldList.empty().popExn()).toThrow();
  });
});

describe('MerkleListContract', () => {
  let deployer: Mina.TestPublicKey;
  let zkApp: MerkleListContract;
  let list: FieldList;

  async function run(f: () => Promise<void>) {
    const tx = await Mina.transaction(deployer, f);
    await tx.prove();
    await tx.sign([deployer.key]).send();
  }

  async function push(x: number) {
    await run(() => zkApp.push(list, Field(x)));
    list.push(Field(x));
  }

  beforeEach(async () => {
    ({ deployer } = await setup());
    const zkAppKey = PrivateKey.random();
    zkApp = new MerkleListContract(zkAppKey.toPublicKey());
    list = FieldList.empty();
    if (proofsEnabled) await MerkleListContract.compile();
    await deploy(deployer, zkApp, zkAppKey);
  });

  it('matches the local list hash after three pushes', async () => {
    await push(1);
    await push(2);
    await push(3);
    expect(zkApp.listHash.get()).toEqual(list.hash);
  });

  it('does not change the list of the caller', async () => {
    // Without the clone, the hash stays the same but the data of the caller
    // gets the pushed element, once for each run of the method body.
    await run(() => zkApp.push(list, Field(1)));
    expect(list.hash).toEqual(FieldList.empty().hash);
    expect(list.lengthUnconstrained().get()).toBe(0);
  });

  it('pops the element that was pushed last', async () => {
    await push(1);
    await push(2);
    await run(() => zkApp.pop(list));
    list.popExn();
    expect(zkApp.lastPopped.get()).toEqual(Field(2));
    expect(zkApp.listHash.get()).toEqual(list.hash);
  });

  it('rejects a pop from an empty list', async () => {
    await expect(run(() => zkApp.pop(list))).rejects.toThrow();
  });

  it('adds up a list that is not longer than MAX_SUM_LENGTH', async () => {
    await push(1);
    await push(2);
    await push(3);
    await run(() => zkApp.sum(list));
    expect(zkApp.total.get()).toEqual(Field(6));
  });

  it('adds up 5 and 7 as main.ts does', async () => {
    // MerkleList: contract total: 12
    await push(5);
    await push(7);
    await run(() => zkApp.sum(list));
    expect(zkApp.total.get()).toEqual(Field(12));
  });

  it('rejects sum() for a list longer than MAX_SUM_LENGTH', async () => {
    for (let i = 1; i <= MAX_SUM_LENGTH + 1; i++) await push(i);
    await expect(run(() => zkApp.sum(list))).rejects.toThrow();
  });

  it('rejects a list that does not match the hash on chain', async () => {
    await push(1);
    const other = FieldList.empty();
    other.push(Field(9));
    await expect(run(() => zkApp.push(other, Field(2)))).rejects.toThrow();
  });
});

describe('DynamicArray outside a contract', () => {
  it('has a dynamic length and a fixed size in the circuit', () => {
    const short = Scores.from([UInt32.from(3)]);
    const long = Scores.from([3, 4, 5, 6, 7].map((x) => UInt32.from(x)));
    expect(short.length).toEqual(Field(1));
    expect(long.length).toEqual(Field(5));
    // length: 3, capacity: 8 and element at index 2: 5
    const scores = Scores.from([3, 4, 5].map((x) => UInt32.from(x)));
    expect(`${scores.length}, ${scores.capacity}`).toBe('3, 8');
    expect(`${scores.get(Field(2))}`).toBe('5');
    // 8 slots of 1 field each, plus 1 field for the length.
    expect(Scores.provable.sizeInFields()).toBe(9);
  });

  it('rejects more elements than the capacity', () => {
    const nine = new Array(9).fill(0).map(() => UInt32.from(1));
    expect(() => Scores.from(nine)).toThrow();
  });

  it('rejects get() at an index that is not less than the length', () => {
    const scores = Scores.from([UInt32.from(3), UInt32.from(4)]);
    expect(scores.get(Field(1))).toEqual(UInt32.from(4));
    expect(() => scores.get(Field(2))).toThrow();
  });
});

describe('DynamicArrayContract', () => {
  let deployer: Mina.TestPublicKey;
  let zkApp: DynamicArrayContract;

  async function run(f: () => Promise<void>) {
    const tx = await Mina.transaction(deployer, f);
    await tx.prove();
    await tx.sign([deployer.key]).send();
  }

  const scores = () => Scores.from([3, 4, 5].map((x) => UInt32.from(x)));

  beforeEach(async () => {
    ({ deployer } = await setup());
    const zkAppKey = PrivateKey.random();
    zkApp = new DynamicArrayContract(zkAppKey.toPublicKey());
    if (proofsEnabled) await DynamicArrayContract.compile();
    await deploy(deployer, zkApp, zkAppKey);
  });

  it('adds up only the real elements', async () => {
    await run(() => zkApp.addAll(scores()));
    expect(zkApp.total.get()).toEqual(UInt32.from(12));
  });

  it('ignores values in the empty slots', async () => {
    // A prover can put any value in a slot past the length. forEach marks
    // those slots with isDummy, so they do not count.
    const s = scores();
    s.array[5] = UInt32.from(1000);
    await run(() => zkApp.addAll(s));
    expect(zkApp.total.get()).toEqual(UInt32.from(12));
  });

  it('stores the element at an index in range', async () => {
    await run(() => zkApp.pick(scores(), Field(2)));
    expect(zkApp.picked.get()).toEqual(UInt32.from(5));
  });

  it('rejects an index that is not less than the length', async () => {
    await expect(run(() => zkApp.pick(scores(), Field(3)))).rejects.toThrow();
  });

  it('builds the circuit of each method', async () => {
    // compile() and analyzeMethods() copy the method arguments. Without
    // rebuild() in the contract, this throws "Cannot read private member".
    const methods = await DynamicArrayContract.analyzeMethods();
    expect(methods.addAll.rows).toBeGreaterThan(0);
    expect(methods.pick.rows).toBeGreaterThan(0);
  });
});

import { jest } from '@jest/globals';
import {
  AccountUpdate,
  Field,
  MerkleMap,
  MerkleMapWitness,
  Mina,
  PrivateKey,
  Proof,
  PublicKey,
} from 'o1js';
import { Rollup, RollupContract, RollupProof, RollupState } from './rollup';

// Proofs are off, for the ZkProgram and for the local blockchain. Compiling
// the rollup and the contract takes minutes; the recursion itself is tested
// with real proofs in Add.test.ts. Here, every `assertEquals` in `oneStep`,
// `merge`, `createOneStep` and `update` still runs, so each rejection is real.
const proofsEnabled = false;
Rollup.setProofsEnabled(proofsEnabled);

// With proofs off, a method call still analyzes the program the first time,
// and a test makes up to six proofs, so tests need more than jest's default
// 5 seconds.
jest.setTimeout(5 * 60 * 1000);

// The transitions of `main()` in rollup.ts.
const transitions = [
  { key: Field(8), increment: Field(3) },
  { key: Field(43), increment: Field(2) },
  { key: Field(6), increment: Field(3999) },
  { key: Field(8), increment: Field(400) },
];

type Step = {
  initialRoot: Field;
  latestRoot: Field;
  key: Field;
  currentValue: Field;
  increment: Field;
  witness: MerkleMapWitness;
};

let map: MerkleMap;
let steps: Step[];

function buildSteps() {
  map = new MerkleMap();
  steps = transitions.map(({ key, increment }) => {
    const witness = map.getWitness(key);
    const initialRoot = map.getRoot();
    const currentValue = map.get(key);
    map.set(key, currentValue.add(increment));
    return {
      initialRoot,
      latestRoot: map.getRoot(),
      key,
      currentValue,
      increment,
      witness,
    };
  });
}

async function oneStep(s: Step) {
  const rollup = RollupState.createOneStep(
    s.initialRoot,
    s.latestRoot,
    s.key,
    s.currentValue,
    s.increment,
    s.witness
  );
  const { proof } = await Rollup.oneStep(
    rollup,
    s.initialRoot,
    s.latestRoot,
    s.key,
    s.currentValue,
    s.increment,
    s.witness
  );
  return proof;
}

// One at a time, as `main()` does.
async function oneSteps(list: Step[]) {
  const proofs: Proof<RollupState, void>[] = [];
  for (const s of list) proofs.push(await oneStep(s));
  return proofs;
}

async function merge(a: Proof<RollupState, void>, b: Proof<RollupState, void>) {
  const { proof } = await Rollup.merge(
    RollupState.createMerged(a.publicInput, b.publicInput),
    a,
    b
  );
  return proof;
}

// Merge left to right, as `main()` does.
async function rollUp(proofs: Proof<RollupState, void>[]) {
  let proof = proofs[0];
  for (let i = 1; i < proofs.length; i++) proof = await merge(proof, proofs[i]);
  return proof;
}

describe('Rollup ZkProgram', () => {
  beforeEach(buildSteps);

  it('makes one proof per transition, from one root to the next', async () => {
    // The page: "This step of the rollup checks that the value at an account
    // was incremented by a particular amount."
    for (const s of steps) {
      const proof = await oneStep(s);
      expect(proof.publicInput.initialRoot).toEqual(s.initialRoot);
      expect(proof.publicInput.latestRoot).toEqual(s.latestRoot);
    }
  });

  it('merges the proofs into one from the empty root to the latest root', async () => {
    // The page: a `merge()` proof shows "a valid sequence of transactions"
    // that gets "from an `initialRoot`" "to a `latestRoot` root of the
    // Merkle map after transactions are applied". `main()` prints latestRoot.
    const proof = await rollUp(await oneSteps(steps));
    expect(proof.publicInput.initialRoot).toEqual(new MerkleMap().getRoot());
    expect(proof.publicInput.latestRoot).toEqual(map.getRoot());
    // Key 8 is incremented twice: 3, then 400.
    expect(map.get(Field(8))).toEqual(Field(403));
  });

  it('rejects a step that claims a different increment', async () => {
    // `createOneStep` asserts `latestRoot` equals the root after
    // `currentValue.add(incrementAmount)`. The claimed latest root is right
    // for 3, not for 4.
    const s = steps[0];
    const claimed = new RollupState({
      initialRoot: s.initialRoot,
      latestRoot: s.latestRoot,
    });
    await expect(
      Rollup.oneStep(
        claimed,
        s.initialRoot,
        s.latestRoot,
        s.key,
        s.currentValue,
        Field(4),
        s.witness
      )
    ).rejects.toThrow();
  });

  it('rejects a step whose witness is for another key', async () => {
    // `createOneStep` asserts `witnessKey.assertEquals(key)`.
    const s = steps[0];
    await expect(
      Rollup.oneStep(
        new RollupState({
          initialRoot: s.initialRoot,
          latestRoot: s.latestRoot,
        }),
        s.initialRoot,
        s.latestRoot,
        Field(9),
        s.currentValue,
        s.increment,
        s.witness
      )
    ).rejects.toThrow();
  });

  it('rejects a merge of two proofs in the wrong order', async () => {
    // `merge` asserts that the second proof starts where the first ends.
    const [p0, p1] = await oneSteps(steps.slice(0, 2));
    await expect(merge(p1, p0)).rejects.toThrow();
  });

  it('rejects a merge that claims a different latest root', async () => {
    // `merge` asserts `rollup2proof.publicInput.latestRoot.assertEquals(newState.latestRoot)`.
    const [p0, p1] = await oneSteps(steps.slice(0, 2));
    const claimed = new RollupState({
      initialRoot: p0.publicInput.initialRoot,
      latestRoot: p0.publicInput.latestRoot,
    });
    await expect(Rollup.merge(claimed, p0, p1)).rejects.toThrow();
  });
});

describe('RollupContract', () => {
  let deployer: Mina.TestPublicKey;
  let sender: Mina.TestPublicKey;
  let zkAppKey: PrivateKey;
  let zkAppAddress: PublicKey;
  let zkApp: RollupContract;

  async function send(fn: () => Promise<void>) {
    const tx = await Mina.transaction(sender, fn);
    await tx.prove();
    await tx.sign([sender.key]).send();
  }

  async function rollupProof(from: number, to: number) {
    const proof = await rollUp(await oneSteps(steps.slice(from, to)));
    return new RollupProof({
      proof: proof.proof,
      publicInput: proof.publicInput,
      publicOutput: undefined,
      maxProofsVerified: proof.maxProofsVerified,
    });
  }

  beforeEach(async () => {
    buildSteps();
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [deployer, sender] = Local.testAccounts;
    zkAppKey = PrivateKey.random();
    zkAppAddress = zkAppKey.toPublicKey();
    zkApp = new RollupContract(zkAppAddress);

    const tx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      await zkApp.deploy({});
    });
    await tx.prove();
    await tx.sign([deployer.key, zkAppKey]).send();

    await send(() => zkApp.initStateRoot(new MerkleMap().getRoot()));
  });

  it('stores the root of the empty map after initStateRoot', () => {
    expect(zkApp.state.get()).toEqual(new MerkleMap().getRoot());
  });

  it('moves the state to the latest root of a rollup proof', async () => {
    // The page: "The zkApp will store the Merkle root of this MerkleMap of
    // accounts on chain", and `update` sets it to `latestRoot`.
    await send(async () => zkApp.update(await rollupProof(0, 4)));
    expect(zkApp.state.get()).toEqual(map.getRoot());
  });

  it('accepts two rollup proofs, one after the other', async () => {
    const first = await rollupProof(0, 2);
    await send(() => zkApp.update(first));
    expect(zkApp.state.get()).toEqual(first.publicInput.latestRoot);

    await send(async () => zkApp.update(await rollupProof(2, 4)));
    expect(zkApp.state.get()).toEqual(map.getRoot());
  });

  it('rejects a proof that does not start at the stored root, and keeps the state', async () => {
    // The page: "Updates occur only when authorized by a recursive zero
    // knowledge proof", and `update` asserts
    // `rollupStateProof.publicInput.initialRoot.assertEquals(currentState)`.
    const later = await rollupProof(2, 4);
    await expect(send(() => zkApp.update(later))).rejects.toThrow();
    expect(zkApp.state.get()).toEqual(new MerkleMap().getRoot());
  });

  it('rejects the same proof twice, and keeps the state', async () => {
    const proof = await rollupProof(0, 4);
    await send(() => zkApp.update(proof));
    await expect(send(() => zkApp.update(proof))).rejects.toThrow();
    expect(zkApp.state.get()).toEqual(map.getRoot());
  });
});

import {
  Field,
  SelfProof,
  Struct,
  MerkleMap,
  MerkleWitness,
  MerkleMapWitness,
  verify,
  SmartContract,
  state,
  State,
  method,
  DeployArgs,
  Proof,
  Permissions,
  ZkProgram,
} from 'o1js';

class MerkleWitness20 extends MerkleWitness(20) {}

// ===============================================================

async function main() {
  console.log('compiling...');

  const { verificationKey } = await Rollup.compile();

  console.log('generating transition information');

  const transitions = [
    { key: Field(8), increment: Field(3) },
    { key: Field(43), increment: Field(2) },
    { key: Field(6), increment: Field(3999) },
    { key: Field(8), increment: Field(400) },
  ];

  let map = new MerkleMap();

  const rollupStepInfo: any[] = [];

  transitions.forEach(({ key, increment }) => {
    const witness = map.getWitness(key);
    const initialRoot = map.getRoot();

    const currentValue = map.get(key);
    const updatedValue = currentValue.add(increment);

    map.set(key, updatedValue);
    const latestRoot = map.getRoot();

    rollupStepInfo.push({
      initialRoot,
      latestRoot,
      key,
      currentValue,
      increment,
      witness,
    });
  });

  console.log('making first set of proofs');

  // These could all be done in parallel in a real rollup
  // If T is the time to make a proof this could take time T
  // const rollupProofs = rollupStepInfo.map(async ({ initialRoot, latestRoot, key, currentValue, increment, witness }) => {
  //   const rollup = RollupState.createOneStep(initialRoot, latestRoot, key, currentValue, increment, witness);
  //   const proof = await Rollup.oneStep(rollup, initialRoot, latestRoot, key, currentValue, increment, witness);
  //   return proof;
  // });
  const rollupProofs: Proof<RollupState, void>[] = [];
  for (let {
    initialRoot,
    latestRoot,
    key,
    currentValue,
    increment,
    witness,
  } of rollupStepInfo) {
    const rollup = RollupState.createOneStep(
      initialRoot,
      latestRoot,
      key,
      currentValue,
      increment,
      witness
    );
    const { proof } = await Rollup.oneStep(
      rollup,
      initialRoot,
      latestRoot,
      key,
      currentValue,
      increment,
      witness
    );
    rollupProofs.push(proof);
  }

  console.log('merging proofs');

  // These could also all be done in parallel in a real rollup
  // If T is the time to make a proof this could take time log(n)*T
  // const proof = await rollupProofs.reduce(async (a, b) => {
  //   const rollup = RollupState.createMerged((await a).publicInput, (await b).publicInput);
  //   return await Rollup.merge(rollup, (await a), (await b));
  // });
  var proof: Proof<RollupState, void> = rollupProofs[0];
  for (let i = 1; i < rollupProofs.length; i++) {
    const rollup = RollupState.createMerged(
      proof.publicInput,
      rollupProofs[i].publicInput
    );
    let { proof: mergedProof } = await Rollup.merge(
      rollup,
      proof,
      rollupProofs[i]
    );
    proof = mergedProof;
  }

  console.log('verifying rollup');
  console.log(proof.publicInput.latestRoot.toString());

  const ok = await verify(proof.toJSON(), verificationKey);
  console.log('ok', ok);
}

// ===============================================================

class RollupState extends Struct({
  initialRoot: Field,
  latestRoot: Field,
}) {
  static createOneStep(
    initialRoot: Field,
    latestRoot: Field,
    key: Field,
    currentValue: Field,
    incrementAmount: Field,
    merkleMapWitness: MerkleMapWitness
  ) {
    const [witnessRootBefore, witnessKey] =
      merkleMapWitness.computeRootAndKey(currentValue);
    initialRoot.assertEquals(witnessRootBefore);

    witnessKey.assertEquals(key);

    const [witnessRootAfter] = merkleMapWitness.computeRootAndKey(
      currentValue.add(incrementAmount)
    );

    latestRoot.assertEquals(witnessRootAfter);

    return new RollupState({
      initialRoot,
      latestRoot,
    });
  }

  static createMerged(state1: RollupState, state2: RollupState) {
    return new RollupState({
      initialRoot: state1.initialRoot,
      latestRoot: state2.latestRoot,
    });
  }

  static assertEquals(state1: RollupState, state2: RollupState) {
    state1.initialRoot.assertEquals(state2.initialRoot);
    state1.latestRoot.assertEquals(state2.latestRoot);
  }
}

// ===============================================================

const Rollup = ZkProgram({
  name: 'rollup',
  publicInput: RollupState,

  methods: {
    oneStep: {
      privateInputs: [Field, Field, Field, Field, Field, MerkleMapWitness],

      async method(
        state: RollupState,
        initialRoot: Field,
        latestRoot: Field,
        key: Field,
        currentValue: Field,
        incrementAmount: Field,
        merkleMapWitness: MerkleMapWitness
      ) {
        const computedState = RollupState.createOneStep(
          initialRoot,
          latestRoot,
          key,
          currentValue,
          incrementAmount,
          merkleMapWitness
        );
        RollupState.assertEquals(computedState, state);
      },
    },

    merge: {
      privateInputs: [SelfProof, SelfProof],

      async method(
        newState: RollupState,
        rollup1proof: SelfProof<RollupState, void>,
        rollup2proof: SelfProof<RollupState, void>
      ) {
        rollup1proof.verify();
        rollup2proof.verify();

        rollup2proof.publicInput.initialRoot.assertEquals(
          rollup1proof.publicInput.latestRoot
        );
        rollup1proof.publicInput.initialRoot.assertEquals(newState.initialRoot);
        rollup2proof.publicInput.latestRoot.assertEquals(newState.latestRoot);
      },
    },
  },
});

export let RollupProof_ = ZkProgram.Proof(Rollup);
export class RollupProof extends RollupProof_ {}

// ===============================================================

class RollupContract extends SmartContract {
  @state(Field) state = State<Field>();

  async deploy(args: DeployArgs) {
    await super.deploy(args);
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }

  @method async initStateRoot(stateRoot: Field) {
    this.state.set(stateRoot);
  }

  @method async update(rollupStateProof: RollupProof) {
    const currentState = this.state.get();
    this.state.requireEquals(currentState);

    rollupStateProof.publicInput.initialRoot.assertEquals(currentState);

    rollupStateProof.verify();

    this.state.set(rollupStateProof.publicInput.latestRoot);
  }
}

// ===============================================================

main();

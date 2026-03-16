import {
  Field,
  PrivateKey,
  SelfProof,
  ZkProgram,
  Struct,
  Bool,
  Provable,
  Poseidon,
  MerkleMap,
  MerkleTree,
  MerkleWitness,
  MerkleMapWitness,
} from 'o1js';

class MerkleWitness20 extends MerkleWitness(20) {}

// ===============================================================

async function main() {
  console.log('compiling...');

  const { verificationKey } = await Vote.compile();

  console.log('making proof 0');

  const votersTree = new MerkleTree(20);
  const nullifierMap = new MerkleMap();

  const voters = new Array(10).fill(null).map(PrivateKey.random);
  voters.forEach((v, i) =>
    votersTree.setLeaf(BigInt(i), Poseidon.hash(v.toPublicKey().toFields()))
  );

  const vote0 = VoteState.newVote(votersTree.getRoot());
  const { proof: proof0 } = await Vote.create(vote0);

  console.log('making proof 1');

  const voterIndex1 = 3;
  const nullifierKey1 = Poseidon.hash(voters[voterIndex1].toFields());
  const nullifierWitness1 = nullifierMap.getWitness(nullifierKey1);
  const voterTreeWitness1 = new MerkleWitness20(
    votersTree.getWitness(BigInt(voterIndex1))
  );

  const vote1 = VoteState.applyVote(
    vote0,
    Bool(true),
    voters[voterIndex1],
    voterTreeWitness1,
    nullifierWitness1
  );
  const { proof: proof1 } = await Vote.applyVote(
    vote1,
    proof0,
    Bool(true),
    voters[voterIndex1],
    voterTreeWitness1,
    nullifierWitness1
  );
  nullifierMap.set(nullifierKey1, Field(1));

  console.log('making proof 2');

  const voterIndex2 = 5;
  const nullifierKey2 = Poseidon.hash(voters[voterIndex2].toFields());
  const nullifierWitness2 = nullifierMap.getWitness(nullifierKey2);
  const voterTreeWitness2 = new MerkleWitness20(
    votersTree.getWitness(BigInt(voterIndex2))
  );

  const vote2 = VoteState.applyVote(
    vote1,
    Bool(false),
    voters[voterIndex2],
    voterTreeWitness2,
    nullifierWitness2
  );
  const { proof: proof2 } = await Vote.applyVote(
    vote2,
    proof1,
    Bool(false),
    voters[voterIndex2],
    voterTreeWitness2,
    nullifierWitness2
  );
  nullifierMap.set(nullifierKey2, Field(1));

  console.log('verifying proof 2');
  console.log(
    proof2.publicInput.voteFor.toString(),
    proof2.publicInput.voteAgainst.toString()
  );

  const ok = await Vote.verify(proof2);
  console.log('ok', ok);
}

// ===============================================================

class VoteState extends Struct({
  voteFor: Field,
  voteAgainst: Field,
  votersTreeRoot: Field,
  nullifierMapRoot: Field,
}) {
  static newVote(votersTreeRoot: Field) {
    const emptyMap = new MerkleMap();

    return new VoteState({
      voteFor: Field(0),
      voteAgainst: Field(0),
      votersTreeRoot,
      nullifierMapRoot: emptyMap.getRoot(),
    });
  }

  static applyVote(
    state: VoteState,
    voteFor: Bool,
    privateKey: PrivateKey,
    voterWitness: MerkleWitness20,
    nullifierWitness: MerkleMapWitness
  ) {
    const publicKey = privateKey.toPublicKey();

    const voterRoot = voterWitness.calculateRoot(
      Poseidon.hash(publicKey.toFields())
    );
    voterRoot.assertEquals(state.votersTreeRoot);

    let nullifier = Poseidon.hash(privateKey.toFields());

    const [nullifierRootBefore, key] = nullifierWitness.computeRootAndKey(
      Field(0)
    );
    key.assertEquals(nullifier);
    nullifierRootBefore.assertEquals(state.nullifierMapRoot);

    const [nullifierRootAfter] = nullifierWitness.computeRootAndKey(Field(1));

    return new VoteState({
      voteFor: state.voteFor.add(Provable.if(voteFor, Field(1), Field(0))),
      voteAgainst: state.voteAgainst.add(
        Provable.if(voteFor, Field(0), Field(1))
      ),
      votersTreeRoot: state.votersTreeRoot,
      nullifierMapRoot: nullifierRootAfter,
    });
  }

  static assertInitialState(state: VoteState) {
    state.voteFor.assertEquals(Field(0));
    state.voteAgainst.assertEquals(Field(0));

    const emptyMap = new MerkleMap();
    state.nullifierMapRoot.assertEquals(emptyMap.getRoot());
  }

  static assertEquals(state1: VoteState, state2: VoteState) {
    state1.voteFor.assertEquals(state2.voteFor);
    state1.voteAgainst.assertEquals(state2.voteAgainst);
    state1.voteAgainst.assertEquals(state2.voteAgainst);
    state1.votersTreeRoot.assertEquals(state2.votersTreeRoot);
    state1.nullifierMapRoot.assertEquals(state2.nullifierMapRoot);
  }
}

// ===============================================================

const Vote = ZkProgram({
  name: 'vote-example',
  publicInput: VoteState,

  methods: {
    create: {
      privateInputs: [],

      async method(state: VoteState) {
        VoteState.assertInitialState(state);
      },
    },

    applyVote: {
      privateInputs: [
        SelfProof,
        Bool,
        PrivateKey,
        MerkleWitness20,
        MerkleMapWitness,
      ],

      async method(
        newState: VoteState,
        earlierProof: SelfProof<VoteState, void>,
        voteFor: Bool,
        voter: PrivateKey,
        voterWitness: MerkleWitness20,
        nullifierWitness: MerkleMapWitness
      ) {
        earlierProof.verify();
        const computedState = VoteState.applyVote(
          earlierProof.publicInput,
          voteFor,
          voter,
          voterWitness,
          nullifierWitness
        );
        VoteState.assertEquals(computedState, newState);
      },
    },
  },
});

// ===============================================================

main();

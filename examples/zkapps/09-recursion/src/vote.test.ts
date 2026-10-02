import { jest } from '@jest/globals';
import {
  Bool,
  Field,
  MerkleMap,
  MerkleTree,
  Poseidon,
  PrivateKey,
  Proof,
} from 'o1js';
import { MerkleWitness20, Vote, VoteState } from './vote';

// Proofs are off. The page only links vote.ts, as "another example of
// off-chain multi-party proof construction". The recursion is tested with
// real proofs in Add.test.ts; here every `assertEquals` in `create`,
// `applyVote` and `VoteState` still runs, so each rejection is real.
Vote.setProofsEnabled(false);

// With proofs off, a method call still analyzes the program the first time,
// which takes longer than jest's default 5 seconds.
jest.setTimeout(5 * 60 * 1000);

let voters: PrivateKey[];
let votersTree: MerkleTree;
let nullifierMap: MerkleMap;
let proof0: Proof<VoteState, void>;

function witnesses(voter: PrivateKey, index: number) {
  return {
    voterWitness: new MerkleWitness20(votersTree.getWitness(BigInt(index))),
    nullifierWitness: nullifierMap.getWitness(Poseidon.hash(voter.toFields())),
  };
}

// One vote, as in `main()`: compute the new state outside the circuit, prove
// it inside, then record the nullifier.
async function castVote(
  earlier: Proof<VoteState, void>,
  voteFor: boolean,
  index: number
) {
  const voter = voters[index];
  const { voterWitness, nullifierWitness } = witnesses(voter, index);
  const newState = VoteState.applyVote(
    earlier.publicInput,
    Bool(voteFor),
    voter,
    voterWitness,
    nullifierWitness
  );
  const { proof } = await Vote.applyVote(
    newState,
    earlier,
    Bool(voteFor),
    voter,
    voterWitness,
    nullifierWitness
  );
  nullifierMap.set(Poseidon.hash(voter.toFields()), Field(1));
  return proof;
}

describe('Vote ZkProgram', () => {
  beforeEach(async () => {
    votersTree = new MerkleTree(20);
    nullifierMap = new MerkleMap();
    voters = new Array(10).fill(null).map(() => PrivateKey.random());
    voters.forEach((v, i) =>
      votersTree.setLeaf(BigInt(i), Poseidon.hash(v.toPublicKey().toFields()))
    );
    ({ proof: proof0 } = await Vote.create(
      VoteState.newVote(votersTree.getRoot())
    ));
  });

  it('starts with 0 votes for and 0 votes against', () => {
    expect(proof0.publicInput.voteFor).toEqual(Field(0));
    expect(proof0.publicInput.voteAgainst).toEqual(Field(0));
  });

  it('counts one vote for and one against, as main() prints "1 1"', async () => {
    // `main()` lets voter 3 vote for and voter 5 vote against, then prints
    // `proof2.publicInput.voteFor` and `proof2.publicInput.voteAgainst`.
    const proof1 = await castVote(proof0, true, 3);
    const proof2 = await castVote(proof1, false, 5);
    expect(proof2.publicInput.voteFor.toString()).toBe('1');
    expect(proof2.publicInput.voteAgainst.toString()).toBe('1');
  });

  it('rejects a vote that did not start at 0', async () => {
    // `create` runs `VoteState.assertInitialState`.
    const state = VoteState.newVote(votersTree.getRoot());
    state.voteFor = Field(1);
    await expect(Vote.create(state)).rejects.toThrow();
  });

  it('rejects a second vote from the same voter', async () => {
    // The nullifier of voter 3 is set after the first vote, so the witness
    // no longer opens to 0 at the nullifier map root.
    const proof1 = await castVote(proof0, true, 3);
    const { voterWitness, nullifierWitness } = witnesses(voters[3], 3);
    const claimed = new VoteState({
      ...proof1.publicInput,
      voteFor: Field(2),
    });
    await expect(
      Vote.applyVote(
        claimed,
        proof1,
        Bool(true),
        voters[3],
        voterWitness,
        nullifierWitness
      )
    ).rejects.toThrow();
  });

  it('rejects a voter who is not in the voters tree', async () => {
    const outsider = PrivateKey.random();
    const { voterWitness, nullifierWitness } = witnesses(outsider, 3);
    const claimed = new VoteState({
      ...proof0.publicInput,
      voteFor: Field(1),
    });
    await expect(
      Vote.applyVote(
        claimed,
        proof0,
        Bool(true),
        outsider,
        voterWitness,
        nullifierWitness
      )
    ).rejects.toThrow();
  });

  it('rejects a new state that counts the vote twice', async () => {
    // `applyVote` asserts that the claimed state equals the computed one.
    const voter = voters[3];
    const { voterWitness, nullifierWitness } = witnesses(voter, 3);
    const honest = VoteState.applyVote(
      proof0.publicInput,
      Bool(true),
      voter,
      voterWitness,
      nullifierWitness
    );
    const claimed = new VoteState({ ...honest, voteFor: Field(2) });
    await expect(
      Vote.applyVote(
        claimed,
        proof0,
        Bool(true),
        voter,
        voterWitness,
        nullifierWitness
      )
    ).rejects.toThrow();
  });

  it('keeps counting from the last good proof after a rejection', async () => {
    const proof1 = await castVote(proof0, true, 3);
    const { voterWitness, nullifierWitness } = witnesses(voters[3], 3);
    await expect(
      Vote.applyVote(
        new VoteState({ ...proof1.publicInput, voteFor: Field(2) }),
        proof1,
        Bool(true),
        voters[3],
        voterWitness,
        nullifierWitness
      )
    ).rejects.toThrow();

    // The rejected vote changed nothing: proof 1 still says 1 for, 0
    // against, and voter 5 can vote on top of it.
    expect(proof1.publicInput.voteFor).toEqual(Field(1));
    const proof2 = await castVote(proof1, false, 5);
    expect(proof2.publicInput.voteFor).toEqual(Field(1));
    expect(proof2.publicInput.voteAgainst).toEqual(Field(1));
  });
});

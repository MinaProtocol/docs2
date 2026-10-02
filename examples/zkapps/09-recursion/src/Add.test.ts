import { jest } from '@jest/globals';
import { Field, JsonProof, Proof, VerificationKey, verify } from 'o1js';
import { Add } from './Add';

// This suite makes real proofs. With proofs off, a ZkProgram method returns a
// dummy proof and `earlierProof.verify()` checks nothing, so the recursion
// that this page is about would not be tested. Compiling is the slow part,
// so it happens once, and the page's three proofs are made once, in
// `beforeAll`.
const SETUP_TIMEOUT = 30 * 60 * 1000;

// A rejected proof fails before the prover does the expensive work, and a
// verification takes seconds, but both are above jest's default 5 seconds on
// a busy machine.
jest.setTimeout(10 * 60 * 1000);

let verificationKey: VerificationKey;
let proof0: Proof<Field, void>;
let proof1: Proof<Field, void>;
let proof2: Proof<Field, void>;

describe('Add', () => {
  beforeAll(async () => {
    ({ verificationKey } = await Add.compile());

    // The same three calls as `main()` on the page.
    ({ proof: proof0 } = await Add.init(Field(0)));
    ({ proof: proof1 } = await Add.addNumber(Field(4), proof0, Field(4)));
    ({ proof: proof2 } = await Add.add(Field(4), proof1, proof0));
  }, SETUP_TIMEOUT);

  it('makes proof 0 for the state 0', () => {
    // The page: `init` runs `state.assertEquals(Field(0))`, and `main()`
    // calls `Add.init(Field(0))`.
    expect(proof0.publicInput).toEqual(Field(0));
  });

  it('makes proof 1 by adding 4 to proof 0', () => {
    // The page: `addNumber` "takes an existing proof, adds a new number to
    // it, and produces a new proof". `main()` adds 4 to proof 0.
    expect(proof1.publicInput).toEqual(Field(4));
  });

  it('prints "proof 2 data 4" for the merge of proof 1 and proof 0', () => {
    // The page: `add` uses "recursion to combine two proofs", and `main()`
    // prints `'proof 2 data', proof2.publicInput.toString()`. 4 + 0 = 4.
    expect(proof2.publicInput.toString()).toBe('4');
  });

  it('prints "ok true": proof 2 verifies off-chain against the key', async () => {
    // The page: "Verification of the proof can occur off-chain using the
    // `verify()` method." `main()` prints `'ok', ok`.
    const ok = await verify(proof2.toJSON(), verificationKey);
    expect(ok).toBe(true);
  });

  it('verifies every proof in the chain, not only the last one', async () => {
    expect(await Add.verify(proof0)).toBe(true);
    expect(await Add.verify(proof1)).toBe(true);
    expect(await Add.verify(proof2)).toBe(true);
  });

  it('does not verify proof 2 with a changed public input', async () => {
    // A proof is bound to its public input. If a reader changes "4" to "5"
    // in the JSON, `verify()` must say no, or the printed "ok true" would
    // mean nothing.
    const forged: JsonProof = { ...proof2.toJSON(), publicInput: ['5'] };
    expect(await verify(forged, verificationKey)).toBe(false);
  });

  it('does not verify a dummy proof, which is what proofs-off makes', async () => {
    // This is why the suite makes real proofs: a dummy proof carries any
    // public input, but it does not verify.
    const dummy = await Add.Proof.dummy(Field(4), undefined, 2);
    expect(await verify(dummy.toJSON(), verificationKey)).toBe(false);
  });

  it('rejects init with a state that is not 0', async () => {
    // The page: `init` runs `state.assertEquals(Field(0))`. The prover
    // reports the failed constraint with both numbers ("Equal 1 0"), so the
    // rejection comes from that assertion and not from something else.
    await expect(Add.init(Field(1))).rejects.toThrow(/Equal 1 0/);
  });

  it('rejects addNumber when the new state is not the sum', async () => {
    // The page: `newState.assertEquals(earlierProof.publicInput.add(numberToAdd))`.
    // 0 + 4 is not 5.
    await expect(Add.addNumber(Field(5), proof0, Field(4))).rejects.toThrow(
      /Equal 5 4/
    );
  });

  it('rejects add when the new state is not the sum of the two proofs', async () => {
    // The page: `newState.assertEquals(earlierProof1.publicInput.add(earlierProof2.publicInput))`.
    // 4 + 0 is not 8.
    await expect(Add.add(Field(8), proof1, proof0)).rejects.toThrow(
      /Equal 8 4/
    );
  });

  it('leaves the earlier proofs valid after a rejection', async () => {
    // A ZkProgram holds no state. What a rejection must not change is the
    // proofs that exist: they still verify, and still carry their inputs.
    await expect(Add.addNumber(Field(5), proof0, Field(4))).rejects.toThrow(
      /Equal 5 4/
    );
    expect(proof1.publicInput).toEqual(Field(4));
    expect(await Add.verify(proof1)).toBe(true);
    expect(await verify(proof2.toJSON(), verificationKey)).toBe(true);
  });
});

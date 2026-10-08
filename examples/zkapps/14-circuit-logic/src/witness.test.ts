import { Field, VerificationKey, verify } from 'o1js';
import { SafeSqrt, UnsafeSqrt, hints } from './witness';

const honestSqrt = hints.sqrt;

describe('Provable.witness', () => {
  let unsafeKey: VerificationKey;
  let safeKey: VerificationKey;

  beforeAll(async () => {
    hints.sqrt = honestSqrt;
    ({ verificationKey: unsafeKey } = await UnsafeSqrt.compile());
    ({ verificationKey: safeKey } = await SafeSqrt.compile());
  });

  afterEach(() => {
    hints.sqrt = honestSqrt;
  });

  it('gives an honest prover a square root', async () => {
    const { proof } = await SafeSqrt.sqrt(Field(9));
    const y = proof.publicOutput;

    expect(y.mul(y).toBigInt()).toBe(9n);
    expect(await verify(proof, safeKey)).toBe(true);
  });

  it('accepts any witness when there is no constraint: a malicious prover proves that 7 is the square root of 9', async () => {
    hints.sqrt = () => Field(7);
    const { proof } = await UnsafeSqrt.sqrt(Field(9));

    expect(proof.publicOutput.toBigInt()).toBe(7n);
    expect(await verify(proof, unsafeKey)).toBe(true);
  });

  it('does not put the witness code in the verification key', async () => {
    hints.sqrt = () => Field(7);
    const { verificationKey } = await UnsafeSqrt.compile({
      forceRecompile: true,
    });

    expect(verificationKey.hash.toString()).toBe(unsafeKey.hash.toString());
  });

  it('rejects the same malicious witness when a constraint checks it', async () => {
    hints.sqrt = () => Field(7);

    await expect(SafeSqrt.sqrt(Field(9))).rejects.toThrow(
      'y is not a square root of x'
    );
  });
});

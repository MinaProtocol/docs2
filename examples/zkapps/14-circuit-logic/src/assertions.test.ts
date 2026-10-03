import { Field, VerificationKey, verify } from 'o1js';
import { AssertAdult, IsAdult } from './assertions';

describe('assertions and returned Bools', () => {
  let isAdultKey: VerificationKey;
  let assertAdultKey: VerificationKey;

  beforeAll(async () => {
    ({ verificationKey: isAdultKey } = await IsAdult.compile());
    ({ verificationKey: assertAdultKey } = await AssertAdult.compile());
  });

  it('gives a valid proof for an age of 12 when the method returns a Bool: the output is false', async () => {
    const { proof } = await IsAdult.check(Field(12));

    expect(await verify(proof, isAdultKey)).toBe(true);
    expect(proof.publicOutput.toBoolean()).toBe(false);
  });

  it('cannot prove an age of 12 when the method asserts', async () => {
    await expect(AssertAdult.check(Field(12))).rejects.toThrow(
      'age is less than 18'
    );
  });

  it('proves an age of 30 when the method asserts', async () => {
    const { proof } = await AssertAdult.check(Field(30));

    expect(await verify(proof, assertAdultKey)).toBe(true);
  });
});

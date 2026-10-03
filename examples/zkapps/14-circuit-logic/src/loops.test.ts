import { Field, VerificationKey, verify } from 'o1js';
import { MAX_LENGTH, SumFirst, SumFirstWrong, sumOfSquares } from './loops';

describe('loops', () => {
  it('fails at compile time when the loop bound depends on a variable', async () => {
    await expect(SumFirstWrong.compile()).rejects.toThrow(
      'x.toBigInt() was called on a variable field element `x` in provable code.'
    );
  });

  it('unrolls a JavaScript loop: twice the steps give twice the rows', async () => {
    const rows: number[] = [];
    for (const length of [4, 8, 16]) {
      const { sum } = await sumOfSquares(length).analyzeMethods();
      rows.push(sum.rows);
    }

    expect(rows[1]).toBe(2 * rows[0]);
    expect(rows[2]).toBe(2 * rows[1]);
  });
});

describe('a variable count with a fixed maximum', () => {
  let verificationKey: VerificationKey;
  const xs = [1, 2, 3, 4, 5, 6, 7, 8].map((x) => Field(x));

  beforeAll(async () => {
    ({ verificationKey } = await SumFirst.compile());
  });

  it('sums the first n items for n from 0 to MAX_LENGTH, with one circuit', async () => {
    const sums: bigint[] = [];
    for (const n of [0, 5, MAX_LENGTH]) {
      const { proof } = await SumFirst.sum(Field(n), xs);
      expect(await verify(proof, verificationKey)).toBe(true);
      sums.push(proof.publicOutput.toBigInt());
    }

    expect(sums).toEqual([0n, 15n, 36n]);
  });

  it('cannot prove for n more than MAX_LENGTH', async () => {
    await expect(SumFirst.sum(Field(MAX_LENGTH + 1), xs)).rejects.toThrow(
      'n is more than MAX_LENGTH'
    );
  });
});

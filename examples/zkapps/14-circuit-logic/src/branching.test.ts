import { Field, Provable, VerificationKey, verify } from 'o1js';
import {
  BonusWithJsIf,
  BonusWithProvableIf,
  BonusWithToBoolean,
  divideOrZero,
  divideOrZeroWrong,
} from './branching';

describe('a JavaScript if on a provable value', () => {
  beforeAll(async () => {
    await BonusWithJsIf.compile();
  });

  it('compiles with no error', async () => {
    const { verificationKey } = await BonusWithJsIf.compile();

    expect(verificationKey.hash.toString()).toBeTruthy();
  });

  it('always takes the true branch, so a score of 5 gets the bonus', async () => {
    const { proof } = await BonusWithJsIf.bonus(Field(5));

    expect(proof.publicOutput.toBigInt()).toBe(10n);
  });

  it('fails at compile time with toBoolean()', async () => {
    await expect(BonusWithToBoolean.compile()).rejects.toThrow(
      'b.toBoolean() was called on a variable Bool `b` in provable code.'
    );
  });
});

describe('Provable.if', () => {
  let verificationKey: VerificationKey;

  beforeAll(async () => {
    ({ verificationKey } = await BonusWithProvableIf.compile());
  });

  it('selects the bonus in the proof for each score', async () => {
    const { proof: low } = await BonusWithProvableIf.bonus(Field(5));
    const { proof: high } = await BonusWithProvableIf.bonus(Field(150));

    expect(low.publicOutput.toBigInt()).toBe(0n);
    expect(high.publicOutput.toBigInt()).toBe(10n);
    expect(await verify(low, verificationKey)).toBe(true);
    expect(await verify(high, verificationKey)).toBe(true);
  });

  it('computes both branches, so a division by 0 in the branch that is not selected fails', async () => {
    await expect(
      Provable.runAndCheck(() => {
        const x = Provable.witness(Field, () => Field(10));
        const y = Provable.witness(Field, () => Field(0));
        divideOrZeroWrong(x, y);
      })
    ).rejects.toThrow(/Constraint unsatisfied/);
  });

  it('gives 0 for y = 0 and x / y otherwise when each branch is safe', async () => {
    const results: bigint[] = [];
    for (const yValue of [0, 5]) {
      await Provable.runAndCheck(() => {
        const x = Provable.witness(Field, () => Field(10));
        const y = Provable.witness(Field, () => Field(yValue));
        const result = divideOrZero(x, y);
        Provable.asProver(() => {
          results.push(result.toBigInt());
        });
      });
    }

    expect(results).toEqual([0n, 2n]);
  });
});

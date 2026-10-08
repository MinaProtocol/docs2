import { Field, VerificationKey, verify } from 'o1js';
import {
  IsEven,
  IsEvenWrong,
  LogWrong,
  Square,
  SquareNoDebug,
  seenByProver,
} from './conversions';

describe('reading JavaScript values from variables', () => {
  it('fails at compile time with toBigInt()', async () => {
    await expect(IsEvenWrong.compile()).rejects.toThrow(
      'x.toBigInt() was called on a variable field element `x` in provable code.'
    );
  });

  it('fails at compile time with toString()', async () => {
    await expect(LogWrong.compile()).rejects.toThrow(
      'x.toString() was called on a variable field element `x` in provable code.'
    );
  });
});

describe('the right ways', () => {
  let isEvenKey: VerificationKey;

  beforeAll(async () => {
    ({ verificationKey: isEvenKey } = await IsEven.compile());
    seenByProver.length = 0;
    await Square.compile();
  });

  it('proves if a number is even with constrained bits', async () => {
    const { proof: ten } = await IsEven.isEven(Field(10));
    const { proof: seven } = await IsEven.isEven(Field(7));

    // Outside the circuit, toBoolean() and toBigInt() work
    expect(ten.publicOutput.toBoolean()).toBe(true);
    expect(seven.publicOutput.toBoolean()).toBe(false);
    expect(await verify(ten, isEvenKey)).toBe(true);
  });

  it('runs Provable.asProver only when proving, with the values', async () => {
    // Compiling did not run the callback
    expect(seenByProver).toEqual([]);

    await Square.square(Field(7));

    expect(seenByProver).toEqual([7n]);
  });

  it('adds no constraints for Provable.asProver and Provable.log', async () => {
    const withDebug = await Square.analyzeMethods();
    const withoutDebug = await SquareNoDebug.analyzeMethods();

    expect(withDebug.square.rows).toBe(withoutDebug.square.rows);
  });
});

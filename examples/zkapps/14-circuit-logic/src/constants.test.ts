import { Field, Provable, VerificationKey, verify } from 'o1js';
import {
  BakedMinimum,
  InputMinimum,
  config,
  constantMath,
  linearMath,
  variableMath,
} from './constants';

describe('constants and variables', () => {
  it('adds no constraints for arithmetic on constants', async () => {
    const constants = await Provable.constraintSystem(() => {
      constantMath();
    });
    const variables = await Provable.constraintSystem(() => {
      variableMath();
    });

    expect(constants.rows).toBe(0);
    expect(variables.rows).toBeGreaterThan(0);
  });

  it('adds no constraints for a variable times a constant plus a constant', async () => {
    const linear = await Provable.constraintSystem(() => {
      linearMath();
    });

    expect(linear.rows).toBe(0);
  });

  it('marks a Field made from a JavaScript value as a constant, and a witness as a variable', async () => {
    let flags: boolean[] = [];
    await Provable.runAndCheck(() => {
      const constant = Field(3);
      const variable = Provable.witness(Field, () => Field(3));
      flags = [
        constant.isConstant(),
        constant.add(constant).isConstant(),
        variable.isConstant(),
        variable.add(constant).isConstant(),
      ];
    });

    expect(flags).toEqual([true, true, false, false]);
  });
});

describe('a JavaScript value is a constant of the circuit', () => {
  let bakedKey: VerificationKey;

  beforeAll(async () => {
    config.minimum = 10;
    ({ verificationKey: bakedKey } = await BakedMinimum.compile());
  });

  afterAll(() => {
    config.minimum = 10;
  });

  it('proves a secret more than the minimum that was compiled in', async () => {
    const { proof } = await BakedMinimum.check(Field(15));

    expect(await verify(proof, bakedKey)).toBe(true);
  });

  it('cannot prove a secret that is not more than the minimum', async () => {
    await expect(BakedMinimum.check(Field(5))).rejects.toThrow(
      /Constraint unsatisfied/
    );
  });

  it('cannot prove after the JavaScript value changes, until the program is compiled again', async () => {
    config.minimum = 20;

    await expect(BakedMinimum.check(Field(25))).rejects.toThrow(
      'the proof could not be constructed'
    );
  });

  it('gives a different verification key for a different constant', async () => {
    config.minimum = 20;
    const { verificationKey } = await BakedMinimum.compile({
      forceRecompile: true,
    });
    const { proof } = await BakedMinimum.check(Field(25));

    expect(verificationKey.hash.toString()).not.toBe(
      bakedKey.hash.toString()
    );
    expect(await verify(proof, verificationKey)).toBe(true);
    expect(await verify(proof, bakedKey)).toBe(false);
  });
});

describe('a provable input can change for each proof', () => {
  let verificationKey: VerificationKey;

  beforeAll(async () => {
    ({ verificationKey } = await InputMinimum.compile());
  });

  it('proves against different minimums with one verification key', async () => {
    const { proof: proof10 } = await InputMinimum.check(Field(10), Field(15));
    const { proof: proof20 } = await InputMinimum.check(Field(20), Field(25));

    expect(await verify(proof10, verificationKey)).toBe(true);
    expect(await verify(proof20, verificationKey)).toBe(true);
    expect(proof10.publicInput.toBigInt()).toBe(10n);
    expect(proof20.publicInput.toBigInt()).toBe(20n);
  });

  it('cannot prove a secret that is not more than the minimum input', async () => {
    await expect(InputMinimum.check(Field(20), Field(15))).rejects.toThrow(
      /Constraint unsatisfied/
    );
  });
});

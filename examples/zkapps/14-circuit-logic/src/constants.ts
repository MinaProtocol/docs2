import { Field, Provable, ZkProgram } from 'o1js';

// docs:start constant-math
// Each argument is a constant: o1js computes the result in JavaScript and
// adds no constraint
export function constantMath() {
  return Field(2).mul(3).add(4);
}

// `x` is a variable: the product of two variables needs a constraint
export function variableMath() {
  const x = Provable.witness(Field, () => Field(2));
  return x.mul(x).add(4);
}

// A variable times a constant, plus a constant, is a linear combination.
// o1js keeps it as a formula and adds no constraint for it.
export function linearMath() {
  const x = Provable.witness(Field, () => Field(2));
  return x.mul(3).add(4);
}
// docs:end constant-math

// docs:start baked
// A JavaScript value. The circuit reads it once, when the program is
// compiled, and keeps it as a constant.
export const config = { minimum: 10 };

export const BakedMinimum = ZkProgram({
  name: 'baked-minimum',
  methods: {
    check: {
      privateInputs: [Field],
      async method(secret: Field) {
        secret.assertGreaterThan(config.minimum);
      },
    },
  },
});
// docs:end baked

// docs:start input
// The minimum is a public input: the prover chooses it for each proof, and the
// verifier sees which minimum the proof is for
export const InputMinimum = ZkProgram({
  name: 'input-minimum',
  publicInput: Field,
  methods: {
    check: {
      privateInputs: [Field],
      async method(minimum: Field, secret: Field) {
        secret.assertGreaterThan(minimum);
      },
    },
  },
});
// docs:end input

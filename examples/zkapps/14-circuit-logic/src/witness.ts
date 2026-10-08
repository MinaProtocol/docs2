import { Field, Provable, ZkProgram } from 'o1js';

// docs:start hints
// Code that runs only in the prover. An honest prover uses this function;
// a malicious prover can replace it with any code.
export const hints = {
  sqrt: (x: Field): Field => x.sqrt(),
};
// docs:end hints

// docs:start unsafe-sqrt
export const UnsafeSqrt = ZkProgram({
  name: 'unsafe-sqrt',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    sqrt: {
      privateInputs: [],
      async method(x: Field) {
        // WRONG: nothing connects y to x
        const y = Provable.witness(Field, () => hints.sqrt(x));
        return { publicOutput: y };
      },
    },
  },
});
// docs:end unsafe-sqrt

// docs:start safe-sqrt
export const SafeSqrt = ZkProgram({
  name: 'safe-sqrt',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    sqrt: {
      privateInputs: [],
      async method(x: Field) {
        const y = Provable.witness(Field, () => hints.sqrt(x));
        // The constraint: y * y must equal x
        y.mul(y).assertEquals(x, 'y is not a square root of x');
        return { publicOutput: y };
      },
    },
  },
});
// docs:end safe-sqrt

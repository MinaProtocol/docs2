import { Bool, Field, Provable, ZkProgram } from 'o1js';

// docs:start to-bigint-wrong
export const IsEvenWrong = ZkProgram({
  name: 'is-even-wrong',
  publicInput: Field,
  publicOutput: Bool,
  methods: {
    isEven: {
      privateInputs: [],
      async method(x: Field) {
        // WRONG: reads a JavaScript value from a variable
        return { publicOutput: Bool(x.toBigInt() % 2n === 0n) };
      },
    },
  },
});
// docs:end to-bigint-wrong

// docs:start to-string-wrong
export const LogWrong = ZkProgram({
  name: 'log-wrong',
  publicInput: Field,
  methods: {
    log: {
      privateInputs: [],
      async method(x: Field) {
        // WRONG: the same error as toBigInt()
        console.log('x is', x.toString());
      },
    },
  },
});
// docs:end to-string-wrong

// docs:start to-bits-right
// The bits of x are variables too, and toBits() adds the constraints that
// connect them to x
export const IsEven = ZkProgram({
  name: 'is-even',
  publicInput: Field,
  publicOutput: Bool,
  methods: {
    isEven: {
      privateInputs: [],
      async method(x: Field) {
        const lowestBit = x.toBits(64)[0];
        return { publicOutput: lowestBit.not() };
      },
    },
  },
});
// docs:end to-bits-right

// docs:start as-prover
// Values that the prover saw, to show what Provable.asProver() can read
export const seenByProver: bigint[] = [];

export const Square = ZkProgram({
  name: 'square',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    square: {
      privateInputs: [],
      async method(x: Field) {
        // Runs only when the prover has values. It adds no constraints.
        Provable.asProver(() => {
          seenByProver.push(x.toBigInt());
        });
        // Prints the value when proving
        Provable.log('x is', x);
        return { publicOutput: x.mul(x) };
      },
    },
  },
});
// docs:end as-prover

// The same circuit without the debug lines, to compare the constraint count
export const SquareNoDebug = ZkProgram({
  name: 'square-no-debug',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    square: {
      privateInputs: [],
      async method(x: Field) {
        return { publicOutput: x.mul(x) };
      },
    },
  },
});

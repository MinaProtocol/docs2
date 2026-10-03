import { Bool, Field, Provable, ZkProgram } from 'o1js';

// docs:start loop-wrong
export const SumFirstWrong = ZkProgram({
  name: 'sum-first-wrong',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    sum: {
      privateInputs: [Provable.Array(Field, 8)],
      async method(n: Field, xs: Field[]) {
        let sum = Field(0);
        // WRONG: the number of steps depends on a variable
        for (let i = 0; i < n.toBigInt(); i++) {
          sum = sum.add(xs[i]);
        }
        return { publicOutput: sum };
      },
    },
  },
});
// docs:end loop-wrong

// docs:start loop-unrolls
// A loop with a bound that is known at compile time. Compiling runs the loop,
// and each step adds its own constraints, so the circuit grows with `length`.
export function sumOfSquares(length: number) {
  return ZkProgram({
    name: `sum-of-squares-${length}`,
    publicOutput: Field,
    methods: {
      sum: {
        privateInputs: [Provable.Array(Field, length)],
        async method(xs: Field[]) {
          let sum = Field(0);
          for (let i = 0; i < length; i++) {
            sum = sum.add(xs[i].mul(xs[i]));
          }
          return { publicOutput: sum };
        },
      },
    },
  });
}
// docs:end loop-unrolls

// docs:start loop-right
export const MAX_LENGTH = 8;

// Always run MAX_LENGTH steps. A Bool switches off the steps after the first n.
export const SumFirst = ZkProgram({
  name: 'sum-first',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    sum: {
      privateInputs: [Provable.Array(Field, MAX_LENGTH)],
      async method(n: Field, xs: Field[]) {
        n.assertLessThanOrEqual(MAX_LENGTH, 'n is more than MAX_LENGTH');
        let sum = Field(0);
        let active = Bool(true);
        for (let i = 0; i < MAX_LENGTH; i++) {
          active = active.and(n.equals(i).not());
          sum = sum.add(Provable.if(active, xs[i], Field(0)));
        }
        return { publicOutput: sum };
      },
    },
  },
});
// docs:end loop-right

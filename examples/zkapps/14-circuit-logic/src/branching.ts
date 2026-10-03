import { Field, Provable, ZkProgram } from 'o1js';

// docs:start js-if
export const BonusWithJsIf = ZkProgram({
  name: 'bonus-with-js-if',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    bonus: {
      privateInputs: [],
      async method(score: Field) {
        let bonus = Field(0);
        // WRONG: `score.greaterThan(100)` returns a Bool object, and
        // JavaScript treats every object as true
        if (score.greaterThan(100)) {
          bonus = Field(10);
        }
        return { publicOutput: bonus };
      },
    },
  },
});
// docs:end js-if

// docs:start to-boolean
export const BonusWithToBoolean = ZkProgram({
  name: 'bonus-with-to-boolean',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    bonus: {
      privateInputs: [],
      async method(score: Field) {
        let bonus = Field(0);
        // WRONG: a variable has no JavaScript value at compile time
        if (score.greaterThan(100).toBoolean()) {
          bonus = Field(10);
        }
        return { publicOutput: bonus };
      },
    },
  },
});
// docs:end to-boolean

// docs:start provable-if
export const BonusWithProvableIf = ZkProgram({
  name: 'bonus-with-provable-if',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    bonus: {
      privateInputs: [],
      async method(score: Field) {
        const bonus = Provable.if(score.greaterThan(100), Field(10), Field(0));
        return { publicOutput: bonus };
      },
    },
  },
});
// docs:end provable-if

// docs:start both-branches-wrong
// WRONG: Provable.if computes both branches. When y is 0, `x.div(y)` fails,
// although its result is not selected.
export function divideOrZeroWrong(x: Field, y: Field) {
  return Provable.if(y.equals(0), Field(0), x.div(y));
}
// docs:end both-branches-wrong

// docs:start both-branches-right
// Make each branch safe for all inputs: divide by 1 when y is 0, then select
export function divideOrZero(x: Field, y: Field) {
  const yIsZero = y.equals(0);
  const safeY = Provable.if(yIsZero, Field(1), y);
  return Provable.if(yIsZero, Field(0), x.div(safeY));
}
// docs:end both-branches-right

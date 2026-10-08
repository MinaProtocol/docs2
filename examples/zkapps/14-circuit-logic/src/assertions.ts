import { Bool, Field, ZkProgram } from 'o1js';

// docs:start returns-bool
// A proof of this method is valid for every age. The output says if the age
// is 18 or more, so the verifier must read it.
export const IsAdult = ZkProgram({
  name: 'is-adult',
  publicInput: Field,
  publicOutput: Bool,
  methods: {
    check: {
      privateInputs: [],
      async method(age: Field) {
        return { publicOutput: age.greaterThanOrEqual(18) };
      },
    },
  },
});
// docs:end returns-bool

// docs:start asserts
// There is no proof of this method for an age less than 18
export const AssertAdult = ZkProgram({
  name: 'assert-adult',
  publicInput: Field,
  methods: {
    check: {
      privateInputs: [],
      async method(age: Field) {
        age.assertGreaterThanOrEqual(18, 'age is less than 18');
      },
    },
  },
});
// docs:end asserts

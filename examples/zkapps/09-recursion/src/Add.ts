import { Field, SelfProof, ZkProgram, verify } from 'o1js';

const Add = ZkProgram({
  name: 'add-example',
  publicInput: Field,

  methods: {
    init: {
      privateInputs: [],

      async method(state: Field) {
        state.assertEquals(Field(0));
      },
    },

    addNumber: {
      privateInputs: [SelfProof, Field],

      async method(
        newState: Field,
        earlierProof: SelfProof<Field, void>,
        numberToAdd: Field
      ) {
        earlierProof.verify();
        newState.assertEquals(earlierProof.publicInput.add(numberToAdd));
      },
    },

    add: {
      privateInputs: [SelfProof, SelfProof],

      async method(
        newState: Field,
        earlierProof1: SelfProof<Field, void>,
        earlierProof2: SelfProof<Field, void>
      ) {
        earlierProof1.verify();
        earlierProof2.verify();
        newState.assertEquals(
          earlierProof1.publicInput.add(earlierProof2.publicInput)
        );
      },
    },
  },
});

async function main() {
  console.log('compiling...');

  const { verificationKey } = await Add.compile();

  console.log('making proof 0');

  const { proof: proof0 } = await Add.init(Field(0));

  console.log('making proof 1');

  const { proof: proof1 } = await Add.addNumber(Field(4), proof0, Field(4));

  console.log('making proof 2');

  const { proof: proof2 } = await Add.add(Field(4), proof1, proof0);

  console.log('verifying proof 2');
  console.log('proof 2 data', proof2.publicInput.toString());

  const ok = await verify(proof2.toJSON(), verificationKey);
  console.log('ok', ok);
}

main();

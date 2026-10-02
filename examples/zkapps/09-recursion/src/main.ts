import { Field, verify } from 'o1js';
import { Add } from './Add.js';

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

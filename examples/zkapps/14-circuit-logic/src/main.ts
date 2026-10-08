import { fileURLToPath } from 'node:url';
import { Field, Provable, verify } from 'o1js';
import { AssertAdult, IsAdult } from './assertions.js';
import { BonusWithJsIf, BonusWithProvableIf } from './branching.js';
import { constantMath, variableMath } from './constants.js';
import { includes, includesWithSomeWrong, includesWrong } from './includes.js';
import { SumFirst, sumOfSquares } from './loops.js';
import { SafeSqrt, UnsafeSqrt, hints } from './witness.js';

async function errorOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'no error';
  } catch (error) {
    return (error as Error).message.split('\n')[0];
  }
}

export async function main() {
  console.log('1. Constants and variables');
  const constants = await Provable.constraintSystem(() => {
    constantMath();
  });
  const variables = await Provable.constraintSystem(() => {
    variableMath();
  });
  console.log(`   rows for constant math: ${constants.rows}`);
  console.log(`   rows for variable math: ${variables.rows}`);

  console.log('2. A JavaScript if against Provable.if, for a score of 5');
  await BonusWithJsIf.compile();
  await BonusWithProvableIf.compile();
  const jsIf = (await BonusWithJsIf.bonus(Field(5))).proof.publicOutput;
  const provableIf = (await BonusWithProvableIf.bonus(Field(5))).proof
    .publicOutput;
  console.log(`   bonus with a JavaScript if: ${jsIf} (wrong)`);
  console.log(`   bonus with Provable.if:     ${provableIf}`);

  console.log('3. Loops');
  for (const length of [4, 8, 16]) {
    const { sum } = await sumOfSquares(length).analyzeMethods();
    console.log(`   rows for a loop of ${length} steps: ${sum.rows}`);
  }
  await SumFirst.compile();
  const xs = [1, 2, 3, 4, 5, 6, 7, 8].map((x) => Field(x));
  const sum = (await SumFirst.sum(Field(5), xs)).proof.publicOutput;
  console.log(`   sum of the first 5 of 1..8: ${sum}`);

  console.log('4. A malicious witness for the square root of 9');
  const { verificationKey: unsafeKey } = await UnsafeSqrt.compile();
  await SafeSqrt.compile();
  const honestSqrt = hints.sqrt;
  hints.sqrt = () => Field(7);
  const { proof } = await UnsafeSqrt.sqrt(Field(9));
  const valid = await verify(proof, unsafeKey);
  console.log(`   no constraint:   output ${proof.publicOutput}, valid ${valid}`);
  console.log(`   with constraint: ${await errorOf(SafeSqrt.sqrt(Field(9)))}`);
  hints.sqrt = honestSqrt;

  console.log('5. Is 7 in [1, 2, 3]? Is 2?');
  await Provable.runAndCheck(() => {
    const list = [1, 2, 3].map((v) => Provable.witness(Field, () => Field(v)));
    const two = Provable.witness(Field, () => Field(2));
    const seven = Provable.witness(Field, () => Field(7));
    const found2 = includes(list, two);
    const found7 = includes(list, seven);
    console.log(`   Array.includes(2): ${includesWrong(list, two)} (wrong)`);
    console.log(`   Array.some(7):     ${includesWithSomeWrong(list, seven)} (wrong)`);
    Provable.asProver(() => {
      console.log(`   includes(2):       ${found2.toBoolean()}`);
      console.log(`   includes(7):       ${found7.toBoolean()}`);
    });
  });

  console.log('6. A returned Bool against an assertion, for an age of 12');
  await IsAdult.compile();
  await AssertAdult.compile();
  const isAdult = (await IsAdult.check(Field(12))).proof.publicOutput;
  console.log(`   returned Bool: proof made, output ${isAdult}`);
  console.log(`   assertion:     ${await errorOf(AssertAdult.check(Field(12)))}`);
}

// Run main() only when this file is the entry point, not when a test imports it
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}

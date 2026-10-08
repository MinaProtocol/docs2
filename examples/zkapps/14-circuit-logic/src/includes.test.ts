import { Field, Provable } from 'o1js';
import { includes, includesWithSomeWrong, includesWrong } from './includes';

// Run `check` in a circuit, with the list [1, 2, 3] and x as variables
async function inCircuit<T>(
  x: number,
  check: (list: Field[], x: Field) => T
): Promise<T> {
  let result!: T;
  await Provable.runAndCheck(() => {
    const list = [1, 2, 3].map((v) => Provable.witness(Field, () => Field(v)));
    const value = Provable.witness(Field, () => Field(x));
    result = check(list, value);
  });
  return result;
}

describe('a value in a list', () => {
  it('is not found by Array.includes(), although the list has it', async () => {
    expect(await inCircuit(2, includesWrong)).toBe(false);
  });

  it('is found by Array.some() with equals(), although the list does not have it', async () => {
    expect(await inCircuit(7, includesWithSomeWrong)).toBe(true);
  });

  it('is found by includes() with or() only when the list has it', async () => {
    const results: boolean[] = [];
    for (const x of [2, 7]) {
      await inCircuit(x, (list, value) => {
        const found = includes(list, value);
        Provable.asProver(() => {
          results.push(found.toBoolean());
        });
      });
    }

    expect(results).toEqual([true, false]);
  });
});

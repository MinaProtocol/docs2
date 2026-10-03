# Tutorial 14: Logic in a Circuit

Worked example for [Tutorial 14: Logic in a Circuit](https://docs.minaprotocol.com/zkapps/tutorials/circuit-logic).

Each file in `src` shows a wrong way and a right way to write logic in an o1js
circuit:

- `constants.ts`: a JavaScript value is a constant of the circuit; a method
  input can change for each proof.
- `branching.ts`: a JavaScript `if` on a `Bool` against `Provable.if`, and why
  each branch of `Provable.if` must be correct for all inputs.
- `loops.ts`: a loop bound must be known at compile time; a variable count
  with a fixed maximum.
- `includes.ts`: find a value in a list, with `Array.includes()` (wrong) and
  with `equals()` and `or()` (right).
- `witness.ts`: a witness with no constraint lets a malicious prover prove a
  false result.
- `conversions.ts`: `toBigInt()` and `toString()` in a circuit, and debugging
  with `Provable.asProver` and `Provable.log`.
- `assertions.ts`: an assertion against a returned `Bool`.

## Run it

```sh
npm install
npm start
```

`main.ts` prints the wrong result and the right result for most topics.

## Test it

```sh
npm test
```

There is one test file for each source file. The name of each test is the
claim that it proves. The tests compile the programs and make real proofs, so
they take some minutes.

## Requirements

Node 22 or later, which is what o1js 3 requires.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)

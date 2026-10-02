import {
  Field,
  SmartContract,
  state,
  State,
  method,
  MerkleMapWitness,
} from 'o1js';

// `docs:start` / `docs:end` comments mark the regions that
// docs/zkapps/tutorials/05-common-types-and-functions.mdx includes with
// #include_code.
// docs:start merkle-map-contract
export class BasicMerkleMapContract extends SmartContract {
  @state(Field) mapRoot = State<Field>();

  @method async initState(initialRoot: Field) {
    this.mapRoot.set(initialRoot);
  }

  @method async update(
    keyWitness: MerkleMapWitness,
    keyToChange: Field,
    valueBefore: Field,
    incrementAmount: Field
  ) {
    const initialRoot = this.mapRoot.get();
    this.mapRoot.requireEquals(initialRoot);

    incrementAmount.assertLessThan(Field(10));

    // check the initial state matches what we expect
    const [rootBefore, key] = keyWitness.computeRootAndKey(valueBefore);
    rootBefore.assertEquals(initialRoot);

    key.assertEquals(keyToChange);

    // compute the root after incrementing
    const [rootAfter] = keyWitness.computeRootAndKey(
      valueBefore.add(incrementAmount)
    );

    // set the new root
    this.mapRoot.set(rootAfter);
  }
}
// docs:end merkle-map-contract

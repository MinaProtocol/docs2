import {
  DynamicArray,
  Field,
  Provable,
  SmartContract,
  State,
  UInt32,
  method,
  state,
} from 'o1js';

// `docs:start` / `docs:end` comments mark the regions that
// docs/zkapps/tutorials/05-common-types-and-functions.mdx includes with
// #include_code.
// docs:start dynamic-array-contract
// Between 0 and 8 scores. The circuit always holds 8 slots.
export class Scores extends DynamicArray(UInt32, { capacity: 8 }) {}

// When o1js 3.0.0 builds the circuit (compile(), analyzeMethods(), prove()),
// it copies each SmartContract method argument. The copy of a DynamicArray
// loses its private fields, and forEach() and get() then throw "Cannot read
// private member". Make a new array from the copy before you use it.
function rebuild(scores: Scores) {
  return new Scores(scores.array, scores.length);
}

export class DynamicArrayContract extends SmartContract {
  @state(UInt32) total = State<UInt32>();
  @state(UInt32) picked = State<UInt32>();

  // Add up the real elements. The callback also sees the empty slots,
  // with isDummy set to true.
  @method async addAll(scores: Scores) {
    let total = UInt32.zero;
    rebuild(scores).forEach((score, isDummy) => {
      total = total.add(Provable.if(isDummy, UInt32.zero, score));
    });
    this.total.set(total);
  }

  // Store the element at `index`. Fails if `index` is not less than the length.
  @method async pick(scores: Scores, index: Field) {
    this.picked.set(rebuild(scores).get(index));
  }
}
// docs:end dynamic-array-contract

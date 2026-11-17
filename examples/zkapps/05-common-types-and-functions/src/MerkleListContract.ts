import {
  Field,
  MerkleList,
  Provable,
  SmartContract,
  State,
  method,
  state,
} from 'o1js';

// `docs:start` / `docs:end` comments mark the regions that
// docs/zkapps/tutorials/05-common-types-and-functions.mdx includes with
// #include_code.
// docs:start merkle-list-contract
export class FieldList extends MerkleList.create(Field) {}

// The number of steps that `sum` takes. A longer list fails.
export const MAX_SUM_LENGTH = 4;

export class MerkleListContract extends SmartContract {
  // Only the hash of the list goes on chain. The elements stay with the caller.
  @state(Field) listHash = State<Field>();
  @state(Field) lastPopped = State<Field>();
  @state(Field) total = State<Field>();

  init() {
    super.init();
    this.listHash.set(FieldList.empty().hash);
  }

  @method async push(list: FieldList, element: Field) {
    // Change a copy, for the same reason as in IndexedMerkleMapContract.
    const copy = list.clone();
    this.listHash.requireEquals(copy.hash);
    copy.push(element);
    this.listHash.set(copy.hash);
  }

  // Remove the element that was pushed last. Fails if the list is empty.
  @method async pop(list: FieldList) {
    const copy = list.clone();
    this.listHash.requireEquals(copy.hash);
    this.lastPopped.set(copy.popExn());
    this.listHash.set(copy.hash);
  }

  // Add up all elements in MAX_SUM_LENGTH steps.
  @method async sum(list: FieldList) {
    this.listHash.requireEquals(list.hash);
    let total = Field(0);
    list.clone().forEach(MAX_SUM_LENGTH, (element, isDummy) => {
      total = total.add(Provable.if(isDummy, Field(0), element));
    });
    this.total.set(total);
  }
}
// docs:end merkle-list-contract

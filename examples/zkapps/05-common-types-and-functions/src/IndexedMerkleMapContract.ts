import {
  Field,
  IndexedMerkleMap,
  SmartContract,
  State,
  method,
  state,
} from 'o1js';

// `docs:start` / `docs:end` comments mark the regions that
// docs/zkapps/tutorials/05-common-types-and-functions.mdx includes with
// #include_code.
// docs:start indexed-merkle-map-contract
// A map with 2^(33-1) leaves. The initial key 0 uses one leaf.
export class Map33 extends IndexedMerkleMap(33) {}

export class IndexedMerkleMapContract extends SmartContract {
  // Only the root goes on chain. The map data stays with the caller.
  @state(Field) mapRoot = State<Field>();

  init() {
    super.init();
    this.mapRoot.set(new Map33().root);
  }

  // Add a new key. Fails if the key is already in the map.
  @method async insert(map: Map33, key: Field, value: Field) {
    // Change a copy. The method body can run more than one time for
    // each transaction, and a change to `map` itself also changes the
    // map of the caller.
    const copy = map.clone();
    this.mapRoot.requireEquals(copy.root);
    copy.insert(key, value);
    this.mapRoot.set(copy.root);
  }

  // Change the value of a key. Fails if the key is not in the map.
  @method async update(map: Map33, key: Field, value: Field) {
    const copy = map.clone();
    this.mapRoot.requireEquals(copy.root);
    copy.update(key, value);
    this.mapRoot.set(copy.root);
  }
}
// docs:end indexed-merkle-map-contract

// docs:start declaration
import {
  Experimental,
  Field,
  method,
  SmartContract,
  state,
  UInt64,
} from 'o1js';

const { OffchainState } = Experimental;

/**
 * The offchain state this contract keeps.
 *
 * `numbers` is a map from an index to a value, the same shape the earlier
 * version of this tutorial kept in a Merkle tree on a storage server. `total`
 * counts how many entries have been written.
 *
 * Only a commitment to all of this lives on chain. The data itself travels as
 * actions, and a settlement proof folds those actions into the commitment.
 */
export const offchainState = OffchainState(
  {
    numbers: OffchainState.Map(Field, Field),
    total: OffchainState.Field(UInt64),
  },
  {
    // 2^10 entries is plenty for a tutorial and keeps proving quick.
    logTotalCapacity: 10,
    maxActionsPerUpdate: 4,
  }
);

/** The proof that `settle()` consumes. */
export class StateProof extends offchainState.Proof {}
// docs:end declaration

// docs:start contract-class
export class NumberStorageContract extends SmartContract {
  /** The only onchain state: commitments to everything held offchain. */
  @state(OffchainState.Commitments) offchainStateCommitments =
    offchainState.emptyCommitments();

  offchainState = offchainState.init(this);
  // docs:end contract-class

  /**
   * Write `value` at `index`, requiring that the entry is currently empty.
   *
   * `update` takes the previous value it expects. If the entry has been written
   * since the caller read it, the settlement drops this action rather than
   * overwriting someone else's write.
   */
  // docs:start set-number
  @method async setNumber(index: Field, value: Field) {
    this.offchainState.fields.numbers.update(index, {
      from: undefined,
      to: value,
    });

    const total = await this.offchainState.fields.total.get();
    this.offchainState.fields.total.update({
      from: total,
      to: total.orElse(0n).add(1),
    });
  }
  // docs:end set-number

  /**
   * Replace the value at `index`, requiring the caller to name the value being
   * replaced. This is the concurrency-safe update the tutorial cares about.
   */
  // docs:start update-number
  @method async updateNumber(index: Field, from: Field, to: Field) {
    this.offchainState.fields.numbers.update(index, { from, to });
  }
  // docs:end update-number

  /**
   * Fold the pending actions into the onchain commitment.
   *
   * Until this runs, a write is an action and nothing else; afterwards it is
   * part of the state the contract commits to.
   */
  // docs:start settle
  @method async settle(proof: StateProof) {
    await this.offchainState.settle(proof);
  }
  // docs:end settle
}

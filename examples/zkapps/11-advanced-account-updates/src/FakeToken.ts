import {
  AccountUpdateForest,
  AccountUpdateTree,
  PublicKey,
  TokenContract,
  UInt64,
  method,
} from 'o1js';

// For the tests only, not part of the tutorial. A contract with the same
// method names as MyToken, but approveTransfer() has no checks: it approves
// any update and mints 1000 tokens. The tests call it at the MyToken address,
// to show that the network checks the proof of the token manager account
// against the verification key that is stored in that account.
export class FakeToken extends TokenContract {
  @method async approveBase(forest: AccountUpdateForest) {
    this.checkZeroBalanceChange(forest);
  }

  @method async approveTransfer(
    transferUpdate: AccountUpdateTree,
    receiver: PublicKey
  ) {
    this.approve(transferUpdate);
    this.internal.mint({ address: receiver, amount: UInt64.from(1000) });
  }
}

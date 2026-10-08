import {
  AccountUpdateForest,
  AccountUpdateTree,
  Int64,
  PublicKey,
  TokenContract,
  UInt64,
  assert,
  method,
} from 'o1js';

// docs:start my-token
// The token contract. Its account is the token manager account: it approves
// every account update that uses its token.
export class MyToken extends TokenContract {
  // The token supply. init() mints all of it to the token account that has
  // the same address as this contract.
  static SUPPLY = UInt64.from(1_000);

  @method async init() {
    super.init();
    this.internal.mint({ address: this.address, amount: MyToken.SUPPLY });
  }

  // docs:start approve-base
  // The default approval: approve any tree of account updates in which the
  // token balance changes add up to zero, so that no tokens are made or
  // destroyed. `transfer()` and `approveAccountUpdate()` call this method.
  @method async approveBase(forest: AccountUpdateForest) {
    this.checkZeroBalanceChange(forest);
  }
  // docs:end approve-base

  // docs:start approve-deploy
  // Approve the deployment of a zkApp on a token account. The update can
  // change anything on its own account, but not the token balance.
  @method async approveDeploy(deployUpdate: AccountUpdateTree) {
    // The update must have no children. A child could set its `mayUseToken`
    // to inherit the token permission from this update.
    assert(deployUpdate.children.isEmpty(), 'the update must have no children');

    // Read the fields of the update. unhash() proves that they are the fields
    // of the update that this method approves.
    const update = deployUpdate.accountUpdate.unhash();
    update.tokenId.assertEquals(this.deriveTokenId(), 'wrong token');
    update.balanceChange.assertEquals(
      Int64.zero,
      'the balance change must be zero'
    );

    this.approve(deployUpdate);
  }
  // docs:end approve-deploy

  // docs:start approve-transfer
  // Approve an update that takes tokens away from a token account, and mint
  // the same amount to `receiver`.
  @method async approveTransfer(
    transferUpdate: AccountUpdateTree,
    receiver: PublicKey
  ) {
    assert(
      transferUpdate.children.isEmpty(),
      'the update must have no children'
    );
    const update = transferUpdate.accountUpdate.unhash();
    update.tokenId.assertEquals(this.deriveTokenId(), 'wrong token');

    // The balance change must be negative: tokens leave the account
    const balanceChange = update.balanceChange;
    balanceChange.isPositive().assertFalse('the balance change must be negative');

    this.approve(transferUpdate);

    // Move the same amount to the receiver
    this.internal.mint({ address: receiver, amount: balanceChange.magnitude });
  }
  // docs:end approve-transfer
}
// docs:end my-token

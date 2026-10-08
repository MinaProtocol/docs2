import {
  AccountUpdate,
  AccountUpdateForest,
  AccountUpdateTree,
  Bool,
  Field,
  Int64,
  Permissions,
  Provable,
  PublicKey,
  Reducer,
  State,
  TokenContract,
  TokenId,
  Types,
  UInt64,
  assert,
  method,
  state,
} from 'o1js';

// The token ID of MINA
const MINA = TokenId.default;

// docs:start wrapped-mina
// A token contract that wraps MINA: send it MINA and get the same amount of
// wrapped MINA (wMINA) tokens; burn wMINA and get the MINA back.
export class WrappedMina extends TokenContract {
  // docs:start state
  // The total wMINA supply, up to the last call to settleTotalSupply()
  @state(UInt64) totalSupply = State<UInt64>();
  // The point in the action history that `totalSupply` is at
  @state(Field) actionState = State<Field>();

  // Each action is a change of the total supply: positive when wrap() mints,
  // negative when unwrap() burns. The property must be called `reducer`.
  reducer = Reducer({ actionType: Int64 });

  @method async init() {
    super.init();
    this.totalSupply.set(UInt64.zero);
    this.actionState.set(Reducer.initialActionState);
  }
  // docs:end state

  // The token ID of wMINA
  get wMINA() {
    return this.deriveTokenId();
  }

  // docs:start approve-base
  // Approve any tree of account updates that leaves the wMINA supply
  // unchanged and does not lock a token account
  @method async approveBase(forest: AccountUpdateForest) {
    let sum = Int64.zero;

    this.forEachUpdate(forest, (update, usesToken) => {
      // Add the balance change of each update that uses wMINA
      sum = Provable.if(usesToken, sum.add(update.balanceChange), sum);
      checkPermissionsUpdate(update);
    });

    sum.assertEquals(Int64.zero, 'the wMINA balance changes must add up to 0');
  }
  // docs:end approve-base

  // docs:start wrap
  // Take MINA from the sender and mint the same amount of wMINA to them.
  // `sender` is an account update on the MINA token, signed by the sender,
  // with a negative balance change.
  @method async wrap(sender: AccountUpdateTree) {
    assert(sender.children.isEmpty(), 'the sender update must have no children');
    const senderUpdate = sender.accountUpdate.unhash();
    this.approve(sender);

    // The sender must give away a positive amount of MINA
    senderUpdate.tokenId.assertEquals(MINA, 'the sender must send MINA');
    const amount = senderUpdate.balanceChange.neg();
    assert(amount.isPositive(), 'the sender must send a positive amount');

    // Move the MINA from the sender to this contract
    this.balance.addInPlace(amount);

    // Mint the same amount of wMINA to the sender
    this.internal.mint({
      address: senderUpdate.publicKey,
      amount: amount.magnitude,
    });

    // Record the change of the total supply
    this.reducer.dispatch(amount);
  }
  // docs:end wrap

  // docs:start unwrap
  // Burn wMINA from the sender and send the same amount of MINA to them.
  // `sender` is an account update on the wMINA token, signed by the sender,
  // with a negative balance change.
  @method async unwrap(sender: AccountUpdateTree) {
    assert(sender.children.isEmpty(), 'the sender update must have no children');
    const senderTokenUpdate = sender.accountUpdate.unhash();
    checkPermissionsUpdate(senderTokenUpdate);
    this.approve(sender);

    // The sender must burn a positive amount of wMINA
    senderTokenUpdate.tokenId.assertEquals(this.wMINA, 'the sender must burn wMINA');
    const amount = senderTokenUpdate.balanceChange.neg();
    assert(amount.isPositive(), 'the sender must burn a positive amount');

    // Send the same amount of MINA to the sender. If the sender has no MINA
    // account, the account creation fee comes out of the amount.
    const receiver = this.send({
      to: senderTokenUpdate.publicKey,
      amount: amount.magnitude,
    });
    receiver.body.implicitAccountCreationFee = Bool(true);

    // Record the change of the total supply
    this.reducer.dispatch(amount.neg());
  }
  // docs:end unwrap

  // docs:start settle
  // Apply the pending supply changes to `totalSupply`
  @method async settleTotalSupply() {
    const totalSupply = this.totalSupply.getAndRequireEquals();
    const actionState = this.actionState.getAndRequireEquals();

    // The actions that were dispatched after `actionState`
    const pending = this.reducer.getActions({ fromActionState: actionState });

    // Add them up
    const change = this.reducer.reduce(
      pending,
      Int64,
      (sum: Int64, action: Int64) => sum.add(action),
      Int64.zero,
      { maxUpdatesWithActions: 8 }
    );

    const newSupply = Int64.from(totalSupply).add(change);
    newSupply.isNonNegative().assertTrue('the total supply cannot be negative');

    this.totalSupply.set(newSupply.magnitude);
    this.actionState.set(pending.hash);
  }
  // docs:end settle

  // docs:start get-balance
  // Return the wMINA balance of `publicKey`, and require that it is the
  // balance when the transaction is applied
  @method.returns(UInt64)
  async getBalance(publicKey: PublicKey) {
    const accountUpdate = AccountUpdate.create(publicKey, this.wMINA);
    return accountUpdate.account.balance.getAndRequireEquals();
  }
  // docs:end get-balance
}
// docs:end wrapped-mina

// docs:start check-permissions
// A wMINA account update may change the permissions of its account only if
// `access` and `receive` stay `none`. So no token account can refuse to
// receive wMINA, or require an extra authorization to use it.
function checkPermissionsUpdate(update: AccountUpdate) {
  const permissions = update.update.permissions;

  const { access, receive } = permissions.value;
  const accessIsNone = permissionEquals(access, Permissions.none());
  const receiveIsNone = permissionEquals(receive, Permissions.none());
  const updateAllowed = accessIsNone.and(receiveIsNone);

  // Either the update keeps `access` and `receive` at `none`, or it does not
  // change the permissions
  assert(
    updateAllowed.or(permissions.isSome.not()),
    'a wMINA account must keep access and receive at none'
  );
}

function permissionEquals(p1: Types.AuthRequired, p2: Types.AuthRequired) {
  return p1.constant
    .equals(p2.constant)
    .and(p1.signatureNecessary.equals(p2.signatureNecessary))
    .and(p1.signatureSufficient.equals(p2.signatureSufficient));
}
// docs:end check-permissions

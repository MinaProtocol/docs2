import {
  AccountUpdateForest,
  Bool,
  DeployArgs,
  Field,
  method,
  Permissions,
  Poseidon,
  Provable,
  PublicKey,
  Signature,
  State,
  state,
  Struct,
  TokenContract,
  UInt64,
} from 'o1js';

/** How many addresses the whitelist holds. */
const WHITELIST_SIZE = 3;

/**
 * The whitelist itself, passed to a method as an argument.
 *
 * Only its hash lives in contract state, because on-chain state is eight field
 * elements and a public key already costs two. The contract checks the hash of
 * the list it is given before trusting the list.
 */
export class Whitelist extends Struct({
  addresses: Provable.Array(PublicKey, WHITELIST_SIZE),
}) {
  static from(addresses: PublicKey[]) {
    if (addresses.length > WHITELIST_SIZE) {
      throw Error(`a whitelist holds at most ${WHITELIST_SIZE} addresses`);
    }

    // Pad with the empty key so the list is always the same length, which a
    // circuit requires.
    const padded = [...addresses];
    while (padded.length < WHITELIST_SIZE) padded.push(PublicKey.empty());

    return new Whitelist({ addresses: padded });
  }

  hash(): Field {
    return Poseidon.hash(
      this.addresses.flatMap((address) => address.toFields())
    );
  }

  contains(address: PublicKey): Bool {
    return this.addresses
      .map((allowed) => allowed.equals(address))
      .reduce(Bool.or);
  }
}

const tokenSymbol = 'WLTKN';

/**
 * A token with a rule around it: only whitelisted addresses may hold or move it.
 *
 * This is the same shape as `BasicTokenContract`, with a membership check added
 * to `mint()` and `sendTokens()`.
 */
export class WhitelistedTokenContract extends TokenContract {
  @state(UInt64) totalAmountInCirculation = State<UInt64>();
  @state(Field) whitelistCommitment = State<Field>();

  async deploy(args?: DeployArgs) {
    await super.deploy(args);

    const permissionToEdit = Permissions.proof();

    this.account.permissions.set({
      ...Permissions.default(),
      editState: permissionToEdit,
      setTokenSymbol: permissionToEdit,
      send: permissionToEdit,
      receive: permissionToEdit,
    });
  }

  @method async init() {
    await super.init();
    this.account.tokenSymbol.set(tokenSymbol);
    this.totalAmountInCirculation.set(UInt64.zero);
    this.whitelistCommitment.set(Field(0));
  }

  async approveBase(forest: AccountUpdateForest) {
    this.checkZeroBalanceChange(forest);
  }

  /** Replace the whitelist. Only the holder of the zkApp key may do this. */
  @method async setWhitelist(commitment: Field, adminSignature: Signature) {
    adminSignature.verify(this.address, [commitment]).assertTrue();
    this.whitelistCommitment.set(commitment);
  }

  /** Mint to a whitelisted address. */
  @method async mint(
    receiverAddress: PublicKey,
    amount: UInt64,
    whitelist: Whitelist,
    adminSignature: Signature
  ) {
    this.assertWhitelisted(whitelist, receiverAddress);

    adminSignature
      .verify(
        this.address,
        amount.toFields().concat(receiverAddress.toFields())
      )
      .assertTrue();

    const totalAmountInCirculation =
      this.totalAmountInCirculation.getAndRequireEquals();

    this.internal.mint({ address: receiverAddress, amount });
    this.totalAmountInCirculation.set(totalAmountInCirculation.add(amount));
  }

  /** Move tokens, where both ends of the transfer must be whitelisted. */
  @method async sendTokens(
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    amount: UInt64,
    whitelist: Whitelist
  ) {
    this.assertWhitelisted(whitelist, senderAddress);
    this.assertWhitelisted(whitelist, receiverAddress);

    this.internal.send({
      from: senderAddress,
      to: receiverAddress,
      amount,
    });
  }

  /**
   * Check that the list given is the list the contract committed to, and that
   * `address` is on it.
   */
  private assertWhitelisted(whitelist: Whitelist, address: PublicKey) {
    whitelist
      .hash()
      .assertEquals(
        this.whitelistCommitment.getAndRequireEquals(),
        'the whitelist given is not the one this contract committed to'
      );

    whitelist
      .contains(address)
      .assertTrue('the address is not on the whitelist');
  }
}

export { tokenSymbol as whitelistedTokenSymbol, WHITELIST_SIZE };

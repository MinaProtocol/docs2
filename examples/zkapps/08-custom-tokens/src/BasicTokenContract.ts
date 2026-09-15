import {
  AccountUpdateForest,
  DeployArgs,
  method,
  Permissions,
  PublicKey,
  Signature,
  SmartContract,
  State,
  state,
  TokenContract,
  UInt64,
} from 'o1js';

const tokenSymbol = 'MYTKN';

/**
 * A token manager: a smart contract whose methods create the account updates
 * that mint and move a custom token.
 *
 * It extends `TokenContract` rather than `SmartContract`, which is what
 * supplies `this.internal.mint` / `.send` and the `Approvable` API.
 */
export class BasicTokenContract extends TokenContract {
  /** How many tokens exist. */
  @state(UInt64) totalAmountInCirculation = State<UInt64>();

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
  }

  /**
   * Approve the account updates of a transaction that moves this token.
   *
   * `checkZeroBalanceChange` proves that the balance changes of the approved
   * updates sum to zero, so a transaction cannot create tokens out of nothing.
   * Minting goes through `mint()` below, which is the only method that raises
   * the supply.
   */
  async approveBase(forest: AccountUpdateForest) {
    this.checkZeroBalanceChange(forest);
  }

  /**
   * Mint `amount` tokens to `receiverAddress`.
   *
   * The admin signature is over the amount and the receiver, checked against
   * this contract's own address, so only the holder of the zkApp key can mint.
   */
  @method async mint(
    receiverAddress: PublicKey,
    amount: UInt64,
    adminSignature: Signature
  ) {
    const totalAmountInCirculation = this.totalAmountInCirculation.getAndRequireEquals();
    const newTotalAmountInCirculation = totalAmountInCirculation.add(amount);

    adminSignature
      .verify(
        this.address,
        amount.toFields().concat(receiverAddress.toFields())
      )
      .assertTrue();

    this.internal.mint({ address: receiverAddress, amount });

    this.totalAmountInCirculation.set(newTotalAmountInCirculation);
  }

  /**
   * Send `amount` tokens from one account to another.
   *
   * Holders of MYTKN call this to move the token. The supply does not change,
   * so `totalAmountInCirculation` is untouched.
   */
  @method async sendTokens(
    senderAddress: PublicKey,
    receiverAddress: PublicKey,
    amount: UInt64
  ) {
    this.internal.send({
      from: senderAddress,
      to: receiverAddress,
      amount,
    });
  }
}

export { tokenSymbol };

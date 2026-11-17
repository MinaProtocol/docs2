// docs:start vault-structure
import {
  DeployArgs,
  method,
  Permissions,
  PublicKey,
  SmartContract,
  State,
  state,
  UInt64,
} from 'o1js';

/**
 * A zkApp that holds a custom token.
 *
 * Deploy it on a token account: `new TokenVault(address, tokenId)`, where
 * `tokenId` is the id of the token that it holds. Any account can deposit
 * tokens. Only the owner can withdraw them, and never more than the total
 * deposited.
 *
 * The vault cannot move a token by itself. Each of its account updates uses
 * the token, so the token manager must approve it.
 */
export class TokenVault extends SmartContract {
  /** The only account that can withdraw. */
  @state(PublicKey) owner = State<PublicKey>();
  /** How many tokens the vault holds. */
  @state(UInt64) totalDeposited = State<UInt64>();

  async deploy(args: DeployArgs & { owner: PublicKey }) {
    await super.deploy(args);
    this.owner.set(args.owner);
    this.totalDeposited.set(UInt64.zero);

    this.account.permissions.set({
      ...Permissions.default(),
      // Only a proof of deposit() can add tokens, so `totalDeposited` counts
      // every token in the vault.
      receive: Permissions.proof(),
      // Nobody can change these rules after deployment, not even the holder
      // of the vault key.
      setPermissions: Permissions.impossible(),
      setVerificationKey:
        Permissions.VerificationKey.impossibleDuringCurrentVersion(),
    });
  }
  // docs:end vault-structure

  // docs:start vault-deposit-withdraw
  /**
   * Add `amount` to the balance of the vault.
   *
   * The tokens must come from an account in the same transaction. The token
   * manager checks that: its `approveBase()` requires the balance changes to
   * sum to zero.
   */
  @method async deposit(amount: UInt64) {
    const total = this.totalDeposited.getAndRequireEquals();
    this.totalDeposited.set(total.add(amount));
    this.balance.addInPlace(amount);
  }

  /**
   * Take `amount` from the balance of the vault. The caller sends it on with
   * the token manager.
   */
  @method async withdraw(amount: UInt64) {
    const owner = this.owner.getAndRequireEquals();
    this.sender
      .getAndRequireSignature()
      .equals(owner)
      .assertTrue('only the owner can withdraw');

    const total = this.totalDeposited.getAndRequireEquals();
    total.assertGreaterThanOrEqual(
      amount,
      'cannot withdraw more than the total deposited'
    );
    this.totalDeposited.set(total.sub(amount));
    this.balance.subInPlace(amount);
  }
}
// docs:end vault-deposit-withdraw

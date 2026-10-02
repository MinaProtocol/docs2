import {
  Field,
  SmartContract,
  state,
  State,
  method,
  DeployArgs,
  Permissions,
} from 'o1js';

// docs:start secondary
export class SecondaryZkApp extends SmartContract {
  @state(Field) num = State<Field>();

  async deploy() {
    await super.deploy();
    this.account.permissions.set({
      ...Permissions.default(),
    });
  }

  @method async init() {
    this.account.provedState.getAndRequireEquals();
    this.account.provedState.get().assertFalse();

    super.init();
    this.num.set(Field(12));
  }

  @method async add(incrementBy: Field) {
    this.account.provedState.getAndRequireEquals();
    this.account.provedState.get().assertTrue();

    const num = this.num.getAndRequireEquals();
    this.num.set(num.add(incrementBy));
  }
}
// docs:end secondary

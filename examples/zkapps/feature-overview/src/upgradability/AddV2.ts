import { Field, SmartContract, state, State, method } from 'o1js';

export class AddV2 extends SmartContract {
  @state(Field) num = State<Field>();

  init() {
    super.init();
    this.num.set(Field(1));
  }

  @method async update() {
    const currentState = this.num.getAndRequireEquals();
    const newState = currentState.add(4);
    this.num.set(newState);
  }
}

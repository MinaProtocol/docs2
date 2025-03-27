import { Field, SmartContract, state, State, method } from 'o1js';

export class Square extends SmartContract {
  @state(Field) num = State<Field>();

  init() {
    super.init();
    this.num.set(Field(3));
  }

  @method async update(from: Field) {
    const currentState = this.num.get();
    this.num.requireEquals(from);
    from.assertEquals(currentState);
    const square = from.mul(from);
    this.num.set(square);
  }
}

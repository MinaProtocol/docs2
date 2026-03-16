import { Field, SmartContract, state, State, method } from 'o1js';

export class AddV3Unsafe extends SmartContract {
  @state(Field) callCount = State<Field>();
  @state(Field) num = State<Field>();

  init() {
    super.init();
    this.num.set(Field(1));
  }

  @method async add2() {
    this.add(2);
  }

  @method async add5() {
    this.add(5);
  }

  @method async add10() {
    this.add(10);
  }

  async add(n: number) {
    const callCount = this.callCount.getAndRequireEquals();
    const currentState = this.num.getAndRequireEquals();
    const newState = currentState.add(n);
    this.callCount.set(callCount.add(1));
    this.num.set(newState);
  }
}

export class AddV3 extends SmartContract {
  @state(Field) num = State<Field>();
  @state(Field) callCount = State<Field>();

  init() {
    super.init();
    this.num.set(Field(1));
  }

  @method async add2() {
    this.add(2);
  }

  @method async add5() {
    this.add(5);
  }

  @method async add10() {
    this.add(10);
  }

  async add(n: number) {
    const callCount = this.callCount.getAndRequireEquals();
    const currentState = this.num.getAndRequireEquals();
    const newState = currentState.add(n);
    this.callCount.set(callCount.add(1));
    this.num.set(newState);
  }
}

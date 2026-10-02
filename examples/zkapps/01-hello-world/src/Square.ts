// `docs:start` / `docs:end` comments mark the regions that
// docs/zkapps/tutorials/01-hello-world.mdx includes with #include_code.
// docs:start imports
import { Field, SmartContract, state, State, method } from 'o1js';
// docs:end imports

// docs:start class-init
// docs:start class-state
export class Square extends SmartContract {
  @state(Field) num = State<Field>();
  // docs:end class-state

  init() {
    super.init();
    this.num.set(Field(3));
  }
  // docs:end class-init

  // docs:start update
  @method async update(square: Field) {
    const currentState = this.num.get();
    this.num.requireEquals(currentState);
    square.assertEquals(currentState.mul(currentState));
    this.num.set(square);
  }
}
// docs:end update

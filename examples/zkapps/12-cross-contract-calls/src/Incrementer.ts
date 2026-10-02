// docs:start incrementer
import { Field, SmartContract, method } from 'o1js';

// A contract that adds 1 to a number and returns the result.
export class Incrementer extends SmartContract {
  // `@method.returns` declares the type of the value that the method returns.
  // A caller can use that value only because it is declared here.
  @method.returns(Field)
  async increment(x: Field) {
    return x.add(1);
  }
}
// docs:end incrementer

// docs:start adder
import { Field, PublicKey, SmartContract, method } from 'o1js';
import { Incrementer } from './Incrementer.js';

// A contract that adds two numbers, adds 1 to the sum, and returns the result.
// It does not add the 1 itself: it calls the Incrementer contract to do it.
export class Adder extends SmartContract {
  @method.returns(Field)
  async addPlus1(incrementerAddress: PublicKey, x: Field, y: Field) {
    // Compute the sum
    const sum = x.add(y);

    // Call the Incrementer contract at `incrementerAddress` to add 1
    const incrementer = new Incrementer(incrementerAddress);
    return await incrementer.increment(sum);
  }
}
// docs:end adder

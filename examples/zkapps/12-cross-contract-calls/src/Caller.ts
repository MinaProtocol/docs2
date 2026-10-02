import { Field, PublicKey, SmartContract, State, method, state } from 'o1js';
import { Adder } from './Adder.js';

// A contract that calls the Adder contract, stores the result on chain and
// emits it as an event.
export class Caller extends SmartContract {
  @state(Field) sum = State<Field>();

  events = { sum: Field };

  @method async callAddAndEmit(
    adderAddress: PublicKey,
    incrementerAddress: PublicKey,
    x: Field,
    y: Field
  ) {
    // Call the Adder contract, which calls the Incrementer contract
    const adder = new Adder(adderAddress);
    const sum = await adder.addPlus1(incrementerAddress, x, y);

    // Emit the result as an event and store it on chain
    this.emitEvent('sum', sum);
    this.sum.set(sum);
  }
}

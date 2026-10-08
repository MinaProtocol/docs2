// `docs:start` / `docs:end` comments mark the regions that
// docs/zkapps/tutorials/02-private-inputs-hash-functions.mdx includes with
// #include_code.
// docs:start imports
import { Field, SmartContract, state, State, method, Poseidon } from 'o1js';
// docs:end imports

// docs:start class-state
export class IncrementSecret extends SmartContract {
  @state(Field) x = State<Field>();
  // docs:end class-state

  // docs:start init-state
  @method async initState(salt: Field, firstSecret: Field) {
    this.x.set(Poseidon.hash([salt, firstSecret]));
  }
  // docs:end init-state

  // docs:start increment-secret
  @method async incrementSecret(salt: Field, secret: Field) {
    const x = this.x.get();
    this.x.requireEquals(x);

    Poseidon.hash([salt, secret]).assertEquals(x);
    this.x.set(Poseidon.hash([salt, secret.add(1)]));
  }
}
// docs:end increment-secret

// docs:start scaffold
import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  Signature,
} from 'o1js';

// The public key of our trusted data provider
const ORACLE_PUBLIC_KEY =
  'B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy';

export class OracleExample extends SmartContract {
  // Define zkApp state
  // Define zkApp events

  init() {
    // Initialize zkApp state
    super.init();
  }

  @method async verify(id: Field, creditScore: Field, signature: Signature) {
    // Get the oracle public key from the zkApp state
    // Evaluate whether the signature is valid for the provided data
    // Check that the signature is valid
    // Check that the provided credit score is 700 or higher
    // Emit an event containing the verified user's id
  }
}
// docs:end scaffold

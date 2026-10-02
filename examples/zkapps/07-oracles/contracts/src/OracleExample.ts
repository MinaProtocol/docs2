// docs:start contract
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
  // docs:start state
  // Define zkApp state
  @state(PublicKey) oraclePublicKey = State<PublicKey>();
  // docs:end state

  // docs:start events
  // Define zkApp events
  events = {
    verified: Field,
  };
  // docs:end events

  // docs:start init
  init() {
    // Initialize zkApp state
    super.init();
    // Set the oracle public key as zkApp on-chain state
    this.oraclePublicKey.set(PublicKey.fromBase58(ORACLE_PUBLIC_KEY));
  }
  // docs:end init

  @method async verify(id: Field, creditScore: Field, signature: Signature) {
    // docs:start get-public-key
    // Get the oracle public key from the zkApp state
    const oraclePublicKey = this.oraclePublicKey.get();
    this.oraclePublicKey.requireEquals(oraclePublicKey);
    // docs:end get-public-key
    // docs:start verify-signature
    // Evaluate whether the signature is valid for the provided data
    const validSignature = signature.verify(oraclePublicKey, [id, creditScore]);
    // docs:end verify-signature
    // docs:start assert-signature
    // Check that the signature is valid
    validSignature.assertTrue();
    // docs:end assert-signature
    // docs:start assert-score
    // Check that the provided credit score is 700 or higher
    creditScore.assertGreaterThanOrEqual(Field(700));
    // docs:end assert-score
    // docs:start emit
    // Emit an event containing the verified user's id
    this.emitEvent('verified', id);
    // docs:end emit
  }
}
// docs:end contract

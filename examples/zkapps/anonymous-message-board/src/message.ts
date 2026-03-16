import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PrivateKey,
  PublicKey,
  Poseidon,
} from 'o1js';

// These private keys are exported so that experimenting with the contract is
// easy. Three of them (the Bobs) are used when the contract is deployed to
// generate the public keys that are allowed to post new messages. Jack's key
// is never added to the contract. So he won't be able to add new messages. In
// real life, we would only use the Bobs' public keys to configure the contract,
// and only they would know their private keys.

export const users = {
  Bob: PrivateKey.fromBase58(
    'EKFAdBGSSXrBbaCVqy4YjwWHoGEnsqYRQTqz227Eb5bzMx2bWu3F'
  ),
  SuperBob: PrivateKey.fromBase58(
    'EKEitxmNYYMCyumtKr8xi1yPpY3Bq6RZTEQsozu2gGf44cNxowmg'
  ),
  MegaBob: PrivateKey.fromBase58(
    'EKE9qUDcfqf6Gx9z6CNuuDYPe4XQQPzFBCfduck2X4PeFQJkhXtt'
  ), // This one says duck in it :)
  Jack: PrivateKey.fromBase58(
    'EKFS9v8wxyrrEGfec4HXycCC2nH7xf79PtQorLXXsut9WUrav4Nw'
  ),
};

export class Message extends SmartContract {
  // On-chain state definitions
  @state(Field) message = State<Field>();
  @state(Field) messageHistoryHash = State<Field>();
  @state(PublicKey) user1 = State<PublicKey>();
  @state(PublicKey) user2 = State<PublicKey>();
  @state(PublicKey) user3 = State<PublicKey>();

  init() {
    // Define initial values of on-chain state
    this.user1.set(users['Bob'].toPublicKey());
    this.user2.set(users['SuperBob'].toPublicKey());
    this.user3.set(users['MegaBob'].toPublicKey());
    this.message.set(Field(0));
    this.messageHistoryHash.set(Field(0));
  }

  @method async publishMessage(message: Field, signerPrivateKey: PrivateKey) {
    // Compute signerPublicKey from signerPrivateKey argument
    const signerPublicKey = signerPrivateKey.toPublicKey();

    // Get approved public keys
    const user1 = this.user1.getAndRequireEquals();
    const user2 = this.user2.getAndRequireEquals();
    const user3 = this.user3.getAndRequireEquals();

    // Assert that signerPublicKey is one of the approved public keys
    signerPublicKey
      .equals(user1)
      .or(signerPublicKey.equals(user2))
      .or(signerPublicKey.equals(user3))
      .assertTrue();

    // Update on-chain message state
    this.message.set(message);

    // Compute new messageHistoryHash
    const oldHash = this.messageHistoryHash.getAndRequireEquals();
    const newHash = Poseidon.hash([message, oldHash]);

    // Update on-chain messageHistoryHash
    this.messageHistoryHash.set(newHash);
  }
}

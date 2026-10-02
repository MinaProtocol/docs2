import { AccountUpdate, Field, Mina, Poseidon, PrivateKey } from 'o1js';
import { Message, users } from './message.js';

/**
 * The message board, end to end, on a local blockchain.
 *
 * Nothing here needs a network, a faucet or funded accounts: the local
 * blockchain provides pre-funded test accounts.
 */
const Local = await Mina.LocalBlockchain({ proofsEnabled: false });
Mina.setActiveInstance(Local);

const deployer = Local.testAccounts[0];

const zkAppKey = PrivateKey.random();
const zkAppAddress = zkAppKey.toPublicKey();
const zkApp = new Message(zkAppAddress);

console.log('deploying the message board...');
// docs:start deploy
const deployTx = await Mina.transaction(deployer, async () => {
  AccountUpdate.fundNewAccount(deployer);
  await zkApp.deploy();
});
await deployTx.prove();
await deployTx.sign([deployer.key, zkAppKey]).send();
// docs:end deploy

// init() put the three approved public keys on chain.
console.log('approved posters:');
console.log('  user1:', zkApp.user1.get().toBase58());
console.log('  user2:', zkApp.user2.get().toBase58());
console.log('  user3:', zkApp.user3.get().toBase58());
console.log('message:', zkApp.message.get().toString());

async function publish(message: Field, signer: PrivateKey) {
  const tx = await Mina.transaction(deployer, async () => {
    await zkApp.publishMessage(message, signer);
  });
  await tx.prove();
  await tx.sign([deployer.key]).send();
}

console.log('\nBob publishes a message...');
await publish(Field(42), users.Bob);
console.log('message:', zkApp.message.get().toString());
console.log('history hash:', zkApp.messageHistoryHash.get().toString());

console.log('\nSuperBob publishes another...');
await publish(Field(99), users.SuperBob);
console.log('message:', zkApp.message.get().toString());
console.log('history hash:', zkApp.messageHistoryHash.get().toString());

// The hash chains: each message is hashed together with the hash before it,
// so the on-chain value commits to the whole sequence, not just the last one.
const expected = Poseidon.hash([
  Field(99),
  Poseidon.hash([Field(42), Field(0)]),
]);
console.log('history hash is the chain of both messages:',
  zkApp.messageHistoryHash.get().toString() === expected.toString());

// Jack's key was never written to the contract, so the method's assertion
// fails and the transaction is rejected.
console.log('\nJack tries to publish...');
try {
  await publish(Field(7), users.Jack);
  console.log('Jack published, which should not happen');
} catch (error) {
  console.log('rejected, as it should be');
}

console.log('message is still:', zkApp.message.get().toString());

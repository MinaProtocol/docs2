import { AccountUpdate, Field, Mina, PrivateKey, Types } from 'o1js';
import { Square } from './Square.js';

/**
 * What `zk deploy` does, on a local blockchain.
 *
 * The tutorial deploys to devnet with the zkApp CLI, which needs a funded fee
 * payer and tMINA from the faucet. The mechanics are the same either way, and
 * here they are visible: an account is created, a verification key is written
 * to it, and the permissions decide what may change it afterwards.
 */
const Local = await Mina.LocalBlockchain({ proofsEnabled: true });
Mina.setActiveInstance(Local);

const feePayer = Local.testAccounts[0];

// `zk config` writes a key pair for the zkApp account; this is the same thing.
const zkAppKey = PrivateKey.random();
const zkAppAddress = zkAppKey.toPublicKey();
const zkApp = new Square(zkAppAddress);

console.log('compiling, which produces the verification key...');
const { verificationKey } = await Square.compile();
console.log('verification key hash:', verificationKey.hash.toString());

const balanceBefore = Mina.getBalance(feePayer);
console.log('fee payer balance before:', balanceBefore.toString());

console.log('\ndeploying...');
const deployTx = await Mina.transaction(
  { sender: feePayer, fee: 1e8 },
  async () => {
    // A new account costs 1 MINA, which the fee payer covers.
    AccountUpdate.fundNewAccount(feePayer);
    await zkApp.deploy();
  }
);
await deployTx.prove();
await deployTx.sign([feePayer.key, zkAppKey]).send();

const account = Mina.getAccount(zkAppAddress);
console.log('\nthe zkApp account now holds:');
console.log('  verification key hash:', account.zkapp?.verificationKey?.hash.toString());
console.log(
  '  editState permission: ',
  Types.AuthRequired.toJSON(account.permissions.editState)
);
console.log('  initial state num:    ', zkApp.num.get().toString());

const balanceAfter = Mina.getBalance(feePayer);
console.log(
  '\nfee payer paid:',
  balanceBefore.sub(balanceAfter).toString(),
  'nanomina (1 MINA account creation + the transaction fee)'
);

// The contract's editState permission is proof, so an update has to carry a
// proof that satisfies the method. 3 * 3 = 9 does.
console.log('\nupdating state to 9, which needs a proof...');
const updateTx = await Mina.transaction(feePayer, async () => {
  await zkApp.update(Field(9));
});
await updateTx.prove();
await updateTx.sign([feePayer.key]).send();

console.log('state is now:', zkApp.num.get().toString());

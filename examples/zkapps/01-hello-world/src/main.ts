import { Square } from './Square.js';
import { Field, Mina, PrivateKey, AccountUpdate } from 'o1js';

const useProof = false;

const Local = await Mina.LocalBlockchain({ proofsEnabled: useProof });
Mina.setActiveInstance(Local);

const deployerAccount = Local.testAccounts[0];
const deployerKey = deployerAccount.key;
const senderAccount = Local.testAccounts[1];
const senderKey = senderAccount.key;
// ----------------------------------------------------

// Create a public/private key pair. The public key is your address and where you deploy the zkApp to
const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();

// create an instance of Square - and deploy it to zkAppAddress
const zkAppInstance = new Square(zkAppAddress);
const deployTxn = await Mina.transaction(deployerAccount, async () => {
  // 1 Mina fee is required to create a new account for the zkApp
  // This line means the deployer account will pay the fee for any account created in this transaction
  AccountUpdate.fundNewAccount(deployerAccount);
  await zkAppInstance.deploy();
});
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

// get the initial state of Square after deployment
const num0 = zkAppInstance.num.get();
console.log('state after init:', num0.toString());

// ----------------------------------------------------

const txn1 = await Mina.transaction(senderAccount, async () => {
  await zkAppInstance.update(Field(9));
});
await txn1.prove();
await txn1.sign([senderKey]).send();

const num1 = zkAppInstance.num.get();
console.log('state after txn1:', num1.toString());

// ----------------------------------------------------

try {
  const txn2 = await Mina.transaction(senderAccount, async () => {
    await zkAppInstance.update(Field(75));
  });
  await txn2.prove();
  await txn2.sign([senderKey]).send();
} catch (error: any) {
  console.log(error.message);
}
const num2 = zkAppInstance.num.get();
console.log('state after txn2:', num2.toString());

// ----------------------------------------------------

const txn3 = await Mina.transaction(senderAccount, async () => {
  await zkAppInstance.update(Field(81));
});
await txn3.prove();
await txn3.sign([senderKey]).send();

const num3 = zkAppInstance.num.get();
console.log('state after txn3:', num3.toString());

// ----------------------------------------------------

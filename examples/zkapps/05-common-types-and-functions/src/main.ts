import {
  Mina,
  UInt32,
  UInt64,
  Int64,
  Character,
  CircuitString,
  PrivateKey,
  Signature,
  Poseidon,
  Field,
  Provable,
  MerkleWitness,
  MerkleTree,
  AccountUpdate,
  Struct,
  MerkleMap,
  Bool,
} from 'o1js';

import { LedgerContract } from './LedgerContract.js';
import { BasicMerkleTreeContract } from './BasicMerkleTreeContract.js';

// --------------------------------------
console.log('--------------------------------------');

const num1 = UInt32.from(40);
const num2 = UInt64.from(40);

const num1EqualsNum2: Bool = num1.toUInt64().equals(num2);

console.log(`num1 === num2: ${num1EqualsNum2.toString()}`);
console.log(`Fields in num1: ${num1.toFields().length}`);

// --------------------------------------

const signedNum1 = Int64.from(-3);
const signedNum2 = Int64.from(45);

const signedNumSum = signedNum1.add(signedNum2);

console.log(`signedNum1 + signedNum2: ${signedNumSum}`);
console.log(`Fields in signedNum1: ${signedNum1.toFields().length}`);

// --------------------------------------

const char1 = Character.fromString('c');
const char2 = Character.fromString('d');
const char1EqualsChar2: Bool = char1.toField().equals(char2.toField());

console.log(`char1: ${char1}`);
console.log(`char1 === char2: ${char1EqualsChar2.toString()}`);
console.log(`Fields in char1: ${Character.toFields(char1).length}`);

console.log('--------------------------------------');

// --------------------------------------

const str1 = CircuitString.fromString('abc..xyz');
console.log(`str1: ${str1}`);
console.log(`Fields in str1: ${CircuitString.toFields(str1).length}`);

// --------------------------------------

const zkAppPrivateKey = PrivateKey.random();
const zkAppPublicKey = zkAppPrivateKey.toPublicKey();

const data1 = Character.toFields(char2).concat(signedNumSum.toFields());
const data2 = Character.toFields(char1).concat(CircuitString.toFields(str1));

const signature = Signature.create(zkAppPrivateKey, data2);

const verifiedData1 = signature.verify(zkAppPublicKey, data1).toString();
const verifiedData2 = signature.verify(zkAppPublicKey, data2).toString();

console.log(`private key: ${zkAppPrivateKey.toBase58()}`);
console.log(`public key: ${zkAppPublicKey.toBase58()}`);
console.log(`Fields in private key: ${zkAppPrivateKey.toFields().length}`);
console.log(`Fields in public key: ${zkAppPublicKey.toFields().length}`);

console.log(`signature verified for data1: ${verifiedData1}`);
console.log(`signature verified for data2: ${verifiedData2}`);

console.log(`Fields in signature: ${signature.toFields().length}`);
console.log('--------------------------------------');

// --------------------------------------

class Point extends Struct({ x: Field, y: Field }) {
  static add(a: Point, b: Point) {
    return { x: a.x.add(b.x), y: a.y.add(b.y) };
  }
}

const point1 = { x: Field(10), y: Field(4) };
const point2 = { x: Field(1), y: Field(2) };

const pointSum = Point.add(point1, point2);

console.log(`pointSum Fields: ${Point.toFields(pointSum)}`);

class Points8 extends Struct({
  points: [Point, Point, Point, Point, Point, Point, Point, Point],
}) {}

const points = new Array(8)
  .fill(null)
  .map((_, i) => ({ x: Field(i), y: Field(i * 10) }));
const points8: Points8 = { points };

console.log(`points8 JSON: ${JSON.stringify(points8)}`);
console.log('--------------------------------------');

// --------------------------------------

const input1 = Int64.from(10);
const input2 = Int64.from(-15);

const inputSum = input1.add(input2);

const inputSumAbs = Provable.if(
  inputSum.isPositive(),
  inputSum,
  inputSum.mul(Int64.minusOne)
);

console.log(`inputSum: ${inputSum}`);
console.log(`inputSumAbs: ${inputSumAbs}`);

const input3 = Int64.from(22);

const input1largest = input1
  .sub(input2)
  .isPositive()
  .and(input1.sub(input3).isPositive());
const input2largest = input2
  .sub(input1)
  .isPositive()
  .and(input2.sub(input3).isPositive());
const input3largest = input3
  .sub(input1)
  .isPositive()
  .and(input3.sub(input2).isPositive());

const largest = Provable.switch(
  [input1largest, input2largest, input3largest],
  Int64,
  [input1, input2, input3]
);

console.log(`largest: ${largest}`);
console.log('--------------------------------------');

// --------------------------------------

const Local = await Mina.LocalBlockchain();
Mina.setActiveInstance(Local);

const deployerAccount = Local.testAccounts[0];
const deployerKey = deployerAccount.key;
const senderPublicKey = Local.testAccounts[1];
const senderPrivateKey = senderPublicKey.key;

//  --------------------------------------
// create a new merkle tree and BasicMerkleTreeContract zkapp account

{
  const basicTreeZkAppPrivateKey = PrivateKey.random();
  const basicTreeZkAppAddress = basicTreeZkAppPrivateKey.toPublicKey();

  // initialize the zkapp
  const zkApp = new BasicMerkleTreeContract(basicTreeZkAppAddress);
  await BasicMerkleTreeContract.compile();

  // create a new tree
  const height = 20;
  const tree = new MerkleTree(height);
  class MerkleWitness20 extends MerkleWitness(height) {}

  // deploy the smart contract
  const deployTxn = await Mina.transaction(deployerAccount, async () => {
    // 1 Mina fee is required to create a new account for the zkApp
    // This line means the deployer account will pay the fee for any account created in this transaction
    AccountUpdate.fundNewAccount(deployerAccount);
    await zkApp.deploy();
    // get the root of the new tree to use as the initial tree root
    await zkApp.initState(tree.getRoot());
  });
  await deployTxn.prove();
  deployTxn.sign([deployerKey, basicTreeZkAppPrivateKey]);

  const pendingDeployTx = await deployTxn.send();
  /**
   * `txn.send()` returns a pending transaction with two methods - `.wait()` and `.hash`
   * `.hash` returns the transaction hash
   * `.wait()` automatically resolves once the transaction has been included in a block. this is redundant for the LocalBlockchain, but very helpful for live testnets
   */
  await pendingDeployTx.wait();

  const incrementIndex = 522n;
  const incrementAmount = Field(9);

  // get the witness for the current tree
  const witness = new MerkleWitness20(tree.getWitness(incrementIndex));

  // update the leaf locally
  tree.setLeaf(incrementIndex, incrementAmount);

  // update the smart contract
  const txn1 = await Mina.transaction(senderPublicKey, async () => {
    await zkApp.update(
      witness,
      Field(0), // leafs in new trees start at a state of 0
      incrementAmount
    );
  });
  await txn1.prove();
  const pendingTx = await txn1
    .sign([senderPrivateKey])
    .send();
  await pendingTx.wait();

  // compare the root of the smart contract tree to our local tree
  console.log(
    `BasicMerkleTree: local tree root hash after send1: ${tree.getRoot()}`
  );
  console.log(
    `BasicMerkleTree: smart contract root hash after send1: ${zkApp.treeRoot.get()}`
  );
}

console.log('--------------------------------------');
// --------------------------------------
// create a new merkle tree and LedgerContract zkapp account

{
  const ledgerZkAppPrivateKey = PrivateKey.random();
  const ledgerZkAppAddress = ledgerZkAppPrivateKey.toPublicKey();

  const height = 20;
  const tree = new MerkleTree(height);
  class MerkleWitness20 extends MerkleWitness(height) {}

  const senderInitialBalance = Field(100);
  const recipientInitialBalance = Field(7);

  const recipientPrivateKey = PrivateKey.random();
  const recipientPublicKey = recipientPrivateKey.toPublicKey();

  const senderAccount = 10n;
  const recipientAccount = 500n;

  tree.setLeaf(
    senderAccount,
    Poseidon.hash([
      senderInitialBalance,
      Poseidon.hash(senderPublicKey.toFields()),
    ])
  );
  tree.setLeaf(
    recipientAccount,
    Poseidon.hash([
      recipientInitialBalance,
      Poseidon.hash(recipientPublicKey.toFields()),
    ])
  );

  const zkApp = new LedgerContract(ledgerZkAppAddress);
  await LedgerContract.compile();

  const deployTxn = await Mina.transaction(deployerAccount, async () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    await zkApp.deploy();
    await zkApp.initState(tree.getRoot());
  });
  await deployTxn.prove();
  await deployTxn.sign([deployerKey, ledgerZkAppPrivateKey]).send();

  // --------------------------------------
  // send from the sender to the recipient

  const amount = Field(12);

  const newSenderBalance = senderInitialBalance.sub(amount);

  const sendWitness1 = new MerkleWitness20(tree.getWitness(senderAccount));
  tree.setLeaf(
    senderAccount,
    Poseidon.hash([newSenderBalance, Poseidon.hash(senderPublicKey.toFields())])
  );
  const recipientWitness1 = new MerkleWitness20(
    tree.getWitness(recipientAccount)
  );

  tree.setLeaf(
    recipientAccount,
    Poseidon.hash([
      recipientInitialBalance.add(amount),
      Poseidon.hash(recipientPublicKey.toFields()),
    ])
  );

  const signature1 = Signature.create(
    senderPrivateKey,
    [zkApp.ledgerRoot.get(), amount].concat(recipientPublicKey.toFields())
  );

  const txn1 = await Mina.transaction(senderPublicKey, async () => {
    await zkApp.sendBalance(
      sendWitness1,
      recipientWitness1,
      senderInitialBalance,
      recipientInitialBalance,
      senderPublicKey,
      recipientPublicKey,
      signature1,
      amount
    );
  });

  await txn1.prove();

  await txn1.sign([senderPrivateKey, ledgerZkAppPrivateKey]).send();

  console.log(
    `LedgerContract: local tree root hash after send1: ${tree.getRoot()}`
  );
  console.log(
    `LedgerContract: smart contract root hash after send1: ${zkApp.ledgerRoot.get()}`
  );

  // --------------------------------------
  // send from the sender to a recipient that wasn't in the account before

  const newRecipientPublicKey = PrivateKey.random().toPublicKey();
  const newRecipientAccount = 10000n;

  const sendWitness2 = new MerkleWitness20(tree.getWitness(senderAccount));
  tree.setLeaf(
    senderAccount,
    Poseidon.hash([
      newSenderBalance.sub(amount),
      Poseidon.hash(senderPublicKey.toFields()),
    ])
  );
  const recipientWitness2 = new MerkleWitness20(
    tree.getWitness(newRecipientAccount)
  );

  tree.setLeaf(
    newRecipientAccount,
    Poseidon.hash([amount, Poseidon.hash(newRecipientPublicKey.toFields())])
  );

  const signature2 = Signature.create(
    senderPrivateKey,
    [zkApp.ledgerRoot.get(), amount].concat(newRecipientPublicKey.toFields())
  );

  const txn2 = await Mina.transaction(senderPublicKey, async () => {
    await zkApp.sendBalance(
      sendWitness2,
      recipientWitness2,
      newSenderBalance,
      Field(0),
      senderPublicKey,
      newRecipientPublicKey,
      signature2,
      amount
    );
  });
  await txn2.prove();
  await txn2.sign([senderPrivateKey, ledgerZkAppPrivateKey]).send();

  console.log(
    `LedgerContract: local tree root hash after send2: ${tree.getRoot()}`
  );
  console.log(
    `LedgerContract: smart contract root hash after send2: ${zkApp.ledgerRoot.get()}`
  );
}

// --------------------------------------
console.log('--------------------------------------');

const map = new MerkleMap();

const key = Field(100);
const value = Field(50);

map.set(key, value);

console.log(`value for key ${key}: ${map.get(key)}`);

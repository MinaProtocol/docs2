import { AccountUpdate, Bool, Mina } from 'o1js';
import { AddV1 } from './AddV1.js';
import { AddV2 } from './AddV2.js';
import { AddV3, AddV3Unsafe } from './AddV3.js';

import { test } from 'node:test';
import assert from 'assert';

const Network = await Mina.LocalBlockchain({ proofsEnabled: true });
Mina.setActiveInstance(Network);

const sender = Network.testAccounts[0];
const zkappAccount = Network.testAccounts[1];

let senderKey = sender.key;
let addKey = zkappAccount.key;
let feepayerAddress = senderKey.toPublicKey();
let addAddress = addKey.toPublicKey();
let zkApp = new AddV1(addAddress);

const fee = 1e9;

// compile the contract to create prover functions and verification keys
const v1Contract = await AddV1.compile();
const v2Contract = await AddV2.compile();
const v3Contract = await AddV3.compile();
const v3ContractUnsafe = await AddV3Unsafe.compile();

test('Compiled ZkApps have the correct verification keys', () => {
  assert(
    v1Contract.verificationKey.hash.toString() ===
      '27729068461170601362912907281403262888852363473424470267835507636847418791713'
  );
  assert(
    v2Contract.verificationKey.hash.toString() ===
      '18150279532259194644722165513074833862035641840431153413486908511595437348455'
  );
  assert(
    v3Contract.verificationKey.hash.toString() ===
      '1506085513050586213214677404600577260206748125662881436145933448267982347548'
  );
  assert(
    v3ContractUnsafe.verificationKey.hash.toString() ===
      '17290804741578456408307855134893698043927309834541841443824450909276443460626'
  );
});

let tx = await Mina.transaction({ sender, fee }, async () => {
  await zkApp.deploy();
});
await tx.sign([senderKey, addKey]).prove();
await tx.send().wait();

tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
  zkApp.update();
});
await tx.sign([senderKey, addKey]).prove();
await tx.send().wait();

let account = Mina.getAccount(zkApp.address);
let currentVK = account.zkapp?.verificationKey?.hash.toString();

test('Initial verification key is set to the V1 contract', () => {
  assert(currentVK === v1Contract.verificationKey.hash.toString());
});

test('Initial contract data has correct state', async () => {
  assert(account.zkapp?.appState[0].toString() === '3'); // Initialized as 1, then add 2
  assert(account.zkapp?.appState[1].toString() === '0'); // Uninitialized
});

tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
  const update = AccountUpdate.createSigned(zkApp.address);
  update.account.verificationKey.set(v2Contract.verificationKey);
});
await tx.sign([senderKey, addKey]).prove();
await tx.send().wait();

zkApp = new AddV2(addAddress); // After updating the key on-chain, use the new contract to generate proofs
tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
  zkApp.update();
});
await tx.sign([senderKey, addKey]).prove();
await tx.send().wait();

account = Mina.getAccount(zkApp.address);
currentVK = account.zkapp?.verificationKey?.hash.toString();

test('Verification key is updated to the V2 contract', () => {
  assert(currentVK === v2Contract.verificationKey.hash.toString());
});

test('Initial contract data has correct state', async () => {
  assert(account.zkapp?.appState[0].toString() === '7'); // Initialized as 1, then add 2, then add 4
  assert(account.zkapp?.appState[1].toString() === '0'); // Uninitialized
});

tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
  const update = AccountUpdate.createSigned(zkApp.address);
  update.account.verificationKey.set(v3Contract.verificationKey);
});
await tx.sign([senderKey, addKey]).prove();
await tx.send().wait();

let zkAppV3 = new AddV3(addAddress); // After updating the key on-chain, use the new contract to generate proofs
tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
  zkAppV3.add10();
});
await tx.sign([senderKey, addKey]).prove();
await tx.send().wait();

account = Mina.getAccount(zkAppV3.address);
currentVK = account.zkapp?.verificationKey?.hash.toString();

test('Verification key is updated to the V2 contract', () => {
  assert(currentVK === v3Contract.verificationKey.hash.toString());
});

test('Initial contract data has correct state', async () => {
  assert(account.zkapp?.appState[0].toString() === '17'); // Initialized as 1, then add 2, then add 4, then add 10
  assert(account.zkapp?.appState[1].toString() === '1'); // Initialized as 0, then add 1
});

/**
 * Deploy a new contract to demonstrate unsafe upgrade behavior
 */

const unsafeZkAppAccount = Network.testAccounts[2];
const unsafeAddKey = unsafeZkAppAccount.key;
const unsafeAddAddress = unsafeAddKey.toPublicKey();

let unsafeZkApp = new AddV1(unsafeAddAddress);

tx = await Mina.transaction({ sender, fee }, async () => {
  await unsafeZkApp.deploy();
});
await tx.sign([senderKey, unsafeAddKey]).prove();
await tx.send().wait();

tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
  unsafeZkApp.update();
});
await tx.sign([senderKey, unsafeAddKey]).prove();
await tx.send().wait();

account = Mina.getAccount(unsafeAddAddress);

test('Initial contract data has correct state', async () => {
  assert(account.zkapp?.appState[0].toString() === '3'); // Initialized as 1, then add 2
  assert(account.zkapp?.appState[1].toString() === '0'); // Uninitialized
});

tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
  const update = AccountUpdate.createSigned(unsafeAddAddress);
  update.account.verificationKey.set(v3ContractUnsafe.verificationKey);
});
await tx.sign([senderKey, unsafeZkAppAccount.key]).prove();
await tx.send().wait();

let unsafeZkAppV3 = new AddV3Unsafe(unsafeZkAppAccount);
tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
  unsafeZkAppV3.add5();
});
await tx.sign([senderKey, unsafeZkAppAccount.key]).prove();
await tx.send().wait();

account = Mina.getAccount(unsafeAddAddress);

test('Initial contract data has correct state', async () => {
  // The state variables have shifted due to the unsafe upgrade, but there is no error
  assert(account.zkapp?.appState[0].toString() === '4'); // Previously `num` = 3, then add 1 to `callCount`
  assert(account.zkapp?.appState[1].toString() === '5'); // Previously uninitialized, then add 5 to `num`
});

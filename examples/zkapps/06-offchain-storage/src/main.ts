import { AccountUpdate, Field, Mina, PrivateKey } from 'o1js';
import {
  NumberStorageContract,
  offchainState,
} from './NumberStorageContract.js';

// A local blockchain: no network, no faucet, no funded accounts.
const Local = await Mina.LocalBlockchain({ proofsEnabled: false });
Mina.setActiveInstance(Local);

const deployer = Local.testAccounts[0];
const zkAppKey = PrivateKey.random();
const contract = new NumberStorageContract(zkAppKey.toPublicKey());

// `init()` in the contract binds the offchain state to the contract class;
// the instance has to be named too, so the state knows which account to read
// actions from.
const state = contract.offchainState;
state.setContractInstance(contract);

console.log('compiling...');
await offchainState.compile();
await NumberStorageContract.compile();

console.log('deploying...');
const deployTx = await Mina.transaction(deployer, async () => {
  AccountUpdate.fundNewAccount(deployer);
  await contract.deploy();
});
await deployTx.prove();
await deployTx.sign([deployer.key, zkAppKey]).send();

async function settle() {
  const proof = await state.createSettlementProof();
  const tx = await Mina.transaction(deployer, async () => {
    await contract.settle(proof);
  });
  await tx.prove();
  await tx.sign([deployer.key]).send();
}

// A write is an action first. Nothing is readable until it is settled.
console.log('writing 42 at index 1...');
const writeTx = await Mina.transaction(deployer, async () => {
  await contract.setNumber(Field(1), Field(42));
});
await writeTx.prove();
await writeTx.sign([deployer.key]).send();

const beforeSettle = await state.fields.numbers.get(Field(1));
console.log(
  'before settling, index 1 is:',
  beforeSettle.isSome.toBoolean() ? beforeSettle.value.toString() : 'not set yet'
);

console.log('settling...');
await settle();

const stored = await state.fields.numbers.get(Field(1));
console.log('after settling, index 1 is:', stored.value.toString());
console.log(
  'entries written:',
  (await state.fields.total.get()).value.toString()
);

// An update names the value it replaces, so a stale writer cannot clobber a
// newer value by accident.
console.log('updating index 1 from 42 to 43...');
const updateTx = await Mina.transaction(deployer, async () => {
  await contract.updateNumber(Field(1), Field(42), Field(43));
});
await updateTx.prove();
await updateTx.sign([deployer.key]).send();
await settle();

console.log(
  'index 1 is now:',
  (await state.fields.numbers.get(Field(1))).value.toString()
);

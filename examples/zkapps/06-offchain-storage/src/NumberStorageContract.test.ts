import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { AccountUpdate, Field, Mina, PrivateKey } from 'o1js';
import {
  NumberStorageContract,
  offchainState,
} from './NumberStorageContract.js';

let deployer: Mina.TestPublicKey;
let contract: NumberStorageContract;
let state: NumberStorageContract['offchainState'];

async function settle() {
  const proof = await state.createSettlementProof();
  const tx = await Mina.transaction(deployer, async () => {
    await contract.settle(proof);
  });
  await tx.prove();
  await tx.sign([deployer.key]).send();
}

async function call(body: () => Promise<void>) {
  const tx = await Mina.transaction(deployer, body);
  await tx.prove();
  await tx.sign([deployer.key]).send();
}

async function numberAt(index: number) {
  return state.fields.numbers.get(Field(index));
}

describe('NumberStorageContract', () => {
  before(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(Local);

    deployer = Local.testAccounts[0];
    const zkAppKey = PrivateKey.random();
    contract = new NumberStorageContract(zkAppKey.toPublicKey());
    state = contract.offchainState;
    state.setContractInstance(contract);

    await offchainState.compile();
    await NumberStorageContract.compile();

    // The deployment also needs the zkApp key, so it does not go through
    // `call()`, which signs as the deployer alone.
    const deployTx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      await contract.deploy();
    });
    await deployTx.prove();
    await deployTx.sign([deployer.key, zkAppKey]).send();
  });

  it('starts with nothing stored', async () => {
    assert.strictEqual((await numberAt(1)).isSome.toBoolean(), false);
  });

  it('does not expose a write before it is settled', async () => {
    await call(async () => contract.setNumber(Field(1), Field(42)));

    assert.strictEqual(
      (await numberAt(1)).isSome.toBoolean(),
      false,
      'the value was readable before a settlement proof was produced'
    );
  });

  it('exposes the write once settled', async () => {
    await settle();

    const stored = await numberAt(1);
    assert.strictEqual(stored.isSome.toBoolean(), true);
    assert.strictEqual(stored.value.toString(), '42');
  });

  it('counts the entries written', async () => {
    assert.strictEqual(
      (await state.fields.total.get()).value.toString(),
      '1'
    );
  });

  it('stores a second entry without disturbing the first', async () => {
    await call(async () => contract.setNumber(Field(2), Field(7)));
    await settle();

    assert.strictEqual((await numberAt(1)).value.toString(), '42');
    assert.strictEqual((await numberAt(2)).value.toString(), '7');
    assert.strictEqual(
      (await state.fields.total.get()).value.toString(),
      '2'
    );
  });

  it('applies an update that names the current value', async () => {
    await call(async () => contract.updateNumber(Field(1), Field(42), Field(43)));
    await settle();

    assert.strictEqual((await numberAt(1)).value.toString(), '43');
  });

  it('drops an update that names a stale value', async () => {
    // 42 is what index 1 held before the previous test. A writer working from
    // that stale read must not clobber the newer value.
    await call(async () => contract.updateNumber(Field(1), Field(42), Field(99)));
    await settle();

    assert.strictEqual(
      (await numberAt(1)).value.toString(),
      '43',
      'a stale update overwrote a newer value'
    );
  });

  it('drops a set on an index that already holds a value', async () => {
    // setNumber requires the entry to be empty, so this action is dropped.
    await call(async () => contract.setNumber(Field(2), Field(123)));
    await settle();

    assert.strictEqual(
      (await numberAt(2)).value.toString(),
      '7',
      'a set on an occupied index overwrote the value'
    );
  });

  it('leaves an untouched index empty', async () => {
    assert.strictEqual((await numberAt(3)).isSome.toBoolean(), false);
  });
});

import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import {
  AccountUpdate,
  Field,
  method,
  Mina,
  Permissions,
  PrivateKey,
  PublicKey,
  SmartContract,
  state,
  State,
  Types,
  UInt64,
} from 'o1js';
import { Square } from './Square.js';

// Proofs are on: this tutorial is about what a deployment writes to an
// account, and the verification key only means something with proving on.
const proofsEnabled = true;

let feePayer: Mina.TestPublicKey;
let zkAppKey: PrivateKey;
let zkAppAddress: PublicKey;
let zkApp: Square;
let verificationKeyHash: string;
let balanceBeforeDeploy: UInt64;

describe('deploying a zkApp', () => {
  before(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);

    feePayer = Local.testAccounts[0];
    zkAppKey = PrivateKey.random();
    zkAppAddress = zkAppKey.toPublicKey();
    zkApp = new Square(zkAppAddress);

    const { verificationKey } = await Square.compile();
    verificationKeyHash = verificationKey.hash.toString();
  });

  it('has no account at the zkApp address before deployment', () => {
    assert.throws(
      () => Mina.getAccount(zkAppAddress),
      'an account existed before anything was deployed to it'
    );
  });

  it('deploys, paying the account creation fee and the transaction fee', async () => {
    balanceBeforeDeploy = Mina.getBalance(feePayer);

    const fee = 1e8;
    const tx = await Mina.transaction({ sender: feePayer, fee }, async () => {
      AccountUpdate.fundNewAccount(feePayer);
      await zkApp.deploy();
    });
    await tx.prove();
    await tx.sign([feePayer.key, zkAppKey]).send();

    const paid = balanceBeforeDeploy.sub(Mina.getBalance(feePayer));

    // 1 MINA to create the account, plus the fee named above.
    assert.strictEqual(paid.toString(), String(1e9 + fee));
  });

  it('writes the verification key to the zkApp account', () => {
    const account = Mina.getAccount(zkAppAddress);

    assert.ok(account.zkapp?.verificationKey, 'no verification key was written');
    assert.strictEqual(
      account.zkapp.verificationKey.hash.toString(),
      verificationKeyHash,
      'the key on the account is not the one compilation produced'
    );
  });

  it('runs init(), so the state is set', () => {
    assert.strictEqual(zkApp.num.get().toString(), '3');
  });

  it('leaves editState requiring a proof', () => {
    const { permissions } = Mina.getAccount(zkAppAddress);

    assert.strictEqual(
      Types.AuthRequired.toJSON(permissions.editState),
      Types.AuthRequired.toJSON(Permissions.proof())
    );
  });

  it('accepts an update carrying a valid proof', async () => {
    const tx = await Mina.transaction(feePayer, async () => {
      await zkApp.update(Field(9));
    });
    await tx.prove();
    await tx.sign([feePayer.key]).send();

    assert.strictEqual(zkApp.num.get().toString(), '9');
  });

  it('refuses an update whose method assertion does not hold', async () => {
    // The method requires square === current * current. 9 * 9 is 81, not 75.
    await assert.rejects(async () => {
      const tx = await Mina.transaction(feePayer, async () => {
        await zkApp.update(Field(75));
      });
      await tx.prove();
      await tx.sign([feePayer.key]).send();
    }, 'a proof was produced for a state transition the method forbids');

    assert.strictEqual(zkApp.num.get().toString(), '9');
  });

  it('refuses a signed state change, because editState needs a proof', async () => {
    await assert.rejects(async () => {
      const tx = await Mina.transaction(feePayer, async () => {
        const update = AccountUpdate.createSigned(zkAppAddress);
        update.body.update.appState[0].isSome = Types.Bool(true);
        update.body.update.appState[0].value = Field(1234);
      });
      await tx.prove();
      await tx.sign([feePayer.key, zkAppKey]).send();
    }, 'a signature was accepted where a proof is required');

    assert.strictEqual(zkApp.num.get().toString(), '9');
  });

  it('produces a different verification key for different contract code', async () => {
    // The tutorial says that changing the contract changes its verification
    // key, which is why a change means redeploying.
    class Cube extends SmartContract {
      @state(Field) num = State<Field>();

      init() {
        super.init();
        this.num.set(Field(3));
      }

      @method async update(cube: Field) {
        const currentState = this.num.getAndRequireEquals();
        cube.assertEquals(currentState.mul(currentState).mul(currentState));
        this.num.set(cube);
      }
    }

    const { verificationKey } = await Cube.compile();

    assert.notStrictEqual(
      verificationKey.hash.toString(),
      verificationKeyHash,
      'two contracts with different method bodies shared a verification key'
    );
  });
});

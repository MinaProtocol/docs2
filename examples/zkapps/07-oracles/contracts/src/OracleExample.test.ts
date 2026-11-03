// docs:start test
import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import {
  AccountUpdate,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  Signature,
} from 'o1js';
import { OracleExample } from './OracleExample.js';

let proofsEnabled = false;

// The public key of our trusted data provider
const ORACLE_PUBLIC_KEY =
  'B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy';

describe('OracleExample', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: OracleExample;

  beforeEach(async () => {
    if (proofsEnabled) await OracleExample.compile();
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    deployerAccount = Local.testAccounts[0];
    deployerKey = deployerAccount.key;
    senderAccount = Local.testAccounts[1];
    senderKey = senderAccount.key;
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new OracleExample(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  // Calls verify() and returns the id in the emitted `verified` event.
  async function verifyAndReadEvent(
    id: Field,
    creditScore: Field,
    signature: Signature
  ) {
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.verify(id, creditScore, signature);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const events = await zkApp.fetchEvents();
    return events[0].event.data.toFields(null)[0];
  }

  it('generates and deploys the `OracleExample` smart contract', async () => {
    await localDeploy();
    const oraclePublicKey = zkApp.oraclePublicKey.get();
    assert.deepStrictEqual(
      oraclePublicKey,
      PublicKey.fromBase58(ORACLE_PUBLIC_KEY)
    );
  });

  describe('hardcoded values', () => {
    it('emits an `id` event containing the users id if their credit score is 700 or higher and the provided signature is valid', async () => {
      await localDeploy();

      const id = Field(1);
      const creditScore = Field(787);
      const signature = Signature.fromBase58(
        '7mXGPCbSJUiYgZnGioezZm7GCy46CEUbgcCH9nrJYXQQiwwVrA5wemBX4T1XFHUw62oR2324QNnkUVXW6yYQLsPsqxZ3nsYR'
      );

      const verifiedEventValue = await verifyAndReadEvent(
        id,
        creditScore,
        signature
      );
      assert.deepStrictEqual(verifiedEventValue, id);
    });

    it('throws an error if the credit score is below 700 even if the provided signature is valid', async () => {
      await localDeploy();

      const id = Field(2);
      const creditScore = Field(536);
      const signature = Signature.fromBase58(
        '7mXXnqMx6YodEkySD3yQ5WK7CCqRL1MBRTASNhrm48oR4EPmenD2NjJqWpFNZnityFTZX5mWuHS1WhRnbdxSTPzytuCgMGuL'
      );

      await assert.rejects(
        Mina.transaction(senderAccount, async () => {
          await zkApp.verify(id, creditScore, signature);
        }),
        /expected 700 <= 536/
      );
    });

    it('throws an error if the credit score is 700 or higher and the provided signature is invalid', async () => {
      await localDeploy();

      const id = Field(1);
      const creditScore = Field(787);
      const signature = Signature.fromBase58(
        '7mXPv97hRN7AiUxBjuHgeWjzoSgL3z61a5QZacVgd1PEGain6FmyxQ8pbAYd5oycwLcAbqJLdezY7PRAUVtokFaQP8AJDEGX'
      );

      await assert.rejects(
        Mina.transaction(senderAccount, async () => {
          await zkApp.verify(id, creditScore, signature);
        }),
        /Bool\.assertTrue/
      );
    });
  });

  describe('actual API requests', () => {
    it('emits an `id` event containing the users id if their credit score is 700 or higher and the provided signature is valid', async () => {
      await localDeploy();

      const response = await fetch(
        'https://07-oracles.vercel.app/api/credit-score?user=1'
      );
      const data = await response.json();

      const id = Field(data.data.id);
      const creditScore = Field(data.data.creditScore);
      const signature = Signature.fromBase58(data.signature);

      const verifiedEventValue = await verifyAndReadEvent(
        id,
        creditScore,
        signature
      );
      assert.deepStrictEqual(verifiedEventValue, id);
    });

    it('throws an error if the credit score is below 700 even if the provided signature is valid', async () => {
      await localDeploy();

      const response = await fetch(
        'https://07-oracles.vercel.app/api/credit-score?user=2'
      );
      const data = await response.json();

      const id = Field(data.data.id);
      const creditScore = Field(data.data.creditScore);
      const signature = Signature.fromBase58(data.signature);

      await assert.rejects(
        Mina.transaction(senderAccount, async () => {
          await zkApp.verify(id, creditScore, signature);
        }),
        /expected 700 <= 536/
      );
    });
  });
});
// docs:end test

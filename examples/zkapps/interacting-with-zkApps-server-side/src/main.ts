// docs:start imports
import { Mina, PrivateKey } from 'o1js';
import { Square } from './Square.js';

import fs from 'fs';
import { deploy, loopUntilAccountExists } from './utils.js';
// docs:end imports

// docs:start config
// `zk config` (Tutorial 3) wrote a deploy alias to config.json. The alias names
// the GraphQL endpoint, the network kind, the fee, the zkApp key file and the
// fee payer key file.
const deployAlias = process.argv[2];
if (!deployAlias) {
  throw Error('usage: node build/src/main.js <deploy-alias>');
}
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const alias = config.deployAliases?.[deployAlias];
if (!alias) {
  throw Error(`config.json has no deploy alias "${deployAlias}"`);
}
// docs:end config

// docs:start network
const Network = Mina.Network({ networkId: alias.networkId, mina: alias.url });
Mina.setActiveInstance(Network);

// The fee in config.json is in MINA. Transaction fees in code are in nanomina.
const transactionFee = Math.round(Number(alias.fee) * 1e9);
// docs:end network

// docs:start keys
function readPrivateKey(path: string) {
  return PrivateKey.fromBase58(JSON.parse(fs.readFileSync(path, 'utf8')).privateKey);
}

// The fee payer pays for every transaction. It is the account that you funded
// at the faucet in Tutorial 3.
const deployerPrivateKey = readPrivateKey(alias.feepayerKeyPath);
const deployerPublicKey = deployerPrivateKey.toPublicKey();

// The zkApp has its own key, not the fee payer's. `zk deploy` deployed the
// Square contract to this key in Tutorial 3.
const zkAppPrivateKey = readPrivateKey(alias.keyPath);
// docs:end keys

// ----------------------------------------------------

// docs:start wait-for-fee-payer
let account = await loopUntilAccountExists({
  account: deployerPublicKey,
  eachTimeNotExist: () => {
    console.log(
      'Deployer account does not exist. ' +
        'Request funds at faucet ' +
        'https://faucet.minaprotocol.com/?address=' +
        deployerPublicKey.toBase58()
    );
  },
  isZkAppAccount: false,
});

console.log(
  `Using fee payer account with nonce ${account.nonce}, balance ${account.balance}`
);
// docs:end wait-for-fee-payer

// ----------------------------------------------------

// docs:start deploy
console.log('Compiling smart contract...');
let { verificationKey } = await Square.compile();

const zkAppPublicKey = zkAppPrivateKey.toPublicKey();
let zkapp = new Square(zkAppPublicKey);

// Programmatic deploy:
//   Besides the CLI, you can also create accounts programmatically. This is useful if you need
//   more custom account creation - say deploying a zkApp to a different key than the fee payer
//   key, programmatically parameterizing a zkApp before initializing it, or creating Smart
//   Contracts programmatically for users as part of an application.
await deploy(deployerPrivateKey, zkAppPrivateKey, zkapp, verificationKey);

await loopUntilAccountExists({
  account: zkAppPublicKey,
  eachTimeNotExist: () =>
    console.log('waiting for zkApp account to be deployed...'),
  isZkAppAccount: true,
});

let num = (await zkapp.num.fetch())!;
console.log(`current value of num is ${num}`);
// docs:end deploy

// ----------------------------------------------------

// docs:start update
let transaction = await Mina.transaction(
  { sender: deployerPublicKey, fee: transactionFee },
  async () => {
    await zkapp.update(num.mul(num));
  }
);

// fill in the proof - this can take a while...
console.log('Creating an execution proof...');
let time0 = performance.now();
await transaction.prove();
let time1 = performance.now();
console.log(`creating proof took ${(time1 - time0) / 1e3} seconds`);

// sign transaction with the deployer account
transaction.sign([deployerPrivateKey]);

console.log('Sending the transaction...');
let pendingTransaction = await transaction.send();
// docs:end update

// ----------------------------------------------------

// docs:start wait-for-inclusion
if (pendingTransaction.status === 'rejected') {
  console.log('error sending transaction (see above)');
  process.exit(0);
}

console.log(
  `See transaction at https://minascan.io/devnet/tx/${pendingTransaction.hash}
Waiting for transaction to be included...`
);
await pendingTransaction.wait();

console.log(`updated state! ${await zkapp.num.fetch()}`);
// docs:end wait-for-inclusion

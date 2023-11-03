import { TokenUser, TokenHolder } from './TokenUser.js';
import { MyToken } from './MyToken.js';

import {
  Mina,
  PrivateKey,
  AccountUpdate,
  UInt64,
} from 'o1js';

import { showTxn, saveTxn } from 'mina-transaction-visualizer';

await (async function main() {

  const proofsEnabled = true;
  const Local = Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);
  const { privateKey: deployerKey, publicKey: deployerAddr } =
    Local.testAccounts[0];

  let accountFee = Mina.accountCreationFee();

  // ----------------------------------------------------

  const myTokenSk = PrivateKey.random();
  const myTokenAddr = myTokenSk.toPublicKey();

  const tokenUserSk = PrivateKey.random();
  const tokenUserAddr = tokenUserSk.toPublicKey();

  const legend = {
    [myTokenAddr.toBase58()]: 'myToken',
    [tokenUserAddr.toBase58()]: 'tokenUser',
    [deployerAddr.toBase58()]: 'deployer',
  };
  console.log(legend);

  TokenUser.tokenSmartContractAddress = myTokenAddr;
  TokenHolder.tokenSmartContractAddress = myTokenAddr;

  const myTokenInstance = new MyToken(myTokenAddr);
  const tokenUserInstance = new TokenUser(tokenUserAddr);
  const tokenHolderInstance = new TokenHolder(
    tokenUserAddr,
    myTokenInstance.token.id
  );

  if (proofsEnabled) {
    console.log('compile contracts');
    await MyToken.compile();
    await TokenUser.compile();
    await TokenHolder.compile();
  }

  // ----------------------------------------------------

  const deployTxn = await Mina.transaction(deployerAddr, () => {
    let feePayerUpdate = AccountUpdate.fundNewAccount(deployerAddr, 4);
    feePayerUpdate.send({ to: myTokenAddr, amount: accountFee });

    myTokenInstance.deploy();
    tokenUserInstance.deploy();
    tokenHolderInstance.deploy();

    myTokenInstance.approveDeploy(tokenHolderInstance.self);
  });

  await deployTxn.prove();
  deployTxn.sign([deployerKey, myTokenSk, tokenUserSk]);

  //await showTxn(deploy_txn, 'deploy_txn', legend);
  //await saveTxn(deploy_txn, 'deploy_txn', legend, './deploy_txn.png');

  await deployTxn.send();

  console.log('sent deploy txn');

  // ----------------------------------------------------

  const txn1 = await Mina.transaction(deployerAddr, () => {
    myTokenInstance.mintTokens(tokenUserAddr, UInt64.from(500));
  });

  txn1.sign([deployerKey, myTokenSk, tokenUserSk]);
  await txn1.prove();

  //await showTxn(txn1, 'txn1', legend);
  //saveTxn(txn1, 'txn1', legend, './txn1.png');

  await txn1.send();

  console.log('sent txn1');

  // ----------------------------------------------------

  const txn2 = await Mina.transaction(deployerAddr, () => {
    AccountUpdate.fundNewAccount(deployerAddr, 1);
    tokenUserInstance.sendMyTokens(UInt64.from(100), deployerAddr);
  });

  await txn2.prove();
  txn2.sign([deployerKey]);

  await showTxn(txn2, 'txn2', legend);
  saveTxn(txn2, 'txn2', legend, './txn2.png');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await txn2.send();

  console.log('sent txn2');

})();

import {
  AccountUpdate,
  Mina,
  PrivateKey,
  Signature,
  UInt64,
} from 'o1js';
import { BasicTokenContract } from './BasicTokenContract.js';

// A local blockchain, so this runs with no network, no faucet and no funds.
const useProof = false;
const Local = await Mina.LocalBlockchain({ proofsEnabled: useProof });
Mina.setActiveInstance(Local);

const deployer = Local.testAccounts[0];
const alice = Local.testAccounts[1];
const bob = Local.testAccounts[2];

// The zkApp account that manages the token.
const tokenPrivateKey = PrivateKey.random();
const tokenAddress = tokenPrivateKey.toPublicKey();
const token = new BasicTokenContract(tokenAddress);

console.log('deploying the token contract...');
const deployTx = await Mina.transaction(deployer, async () => {
  AccountUpdate.fundNewAccount(deployer);
  await token.deploy();
});
await deployTx.prove();
await deployTx.sign([deployer.key, tokenPrivateKey]).send();

console.log('total in circulation:', token.totalAmountInCirculation.get().toString());

// Minting is gated by a signature from the zkApp key over (amount, receiver).
const mintAmount = UInt64.from(100_000);
const mintSignature = Signature.create(
  tokenPrivateKey,
  mintAmount.toFields().concat(alice.toFields())
);

console.log('minting to alice...');
const mintTx = await Mina.transaction(deployer, async () => {
  // Alice does not hold this token yet, so her token account must be created.
  AccountUpdate.fundNewAccount(deployer);
  await token.mint(alice, mintAmount, mintSignature);
});
await mintTx.prove();
await mintTx.sign([deployer.key]).send();

console.log('total in circulation:', token.totalAmountInCirculation.get().toString());
console.log('alice balance:', Mina.getBalance(alice, token.deriveTokenId()).toString());

console.log('sending from alice to bob...');
const sendAmount = UInt64.from(40_000);
const sendTx = await Mina.transaction(alice, async () => {
  AccountUpdate.fundNewAccount(alice);
  await token.sendTokens(alice, bob, sendAmount);
});
await sendTx.prove();
await sendTx.sign([alice.key]).send();

console.log('alice balance:', Mina.getBalance(alice, token.deriveTokenId()).toString());
console.log('bob balance:', Mina.getBalance(bob, token.deriveTokenId()).toString());
console.log(
  'total in circulation is unchanged by a transfer:',
  token.totalAmountInCirculation.get().toString()
);

import {
  AccountUpdate,
  Mina,
  PrivateKey,
  Signature,
  UInt64,
} from 'o1js';
import { BasicTokenContract } from './BasicTokenContract.js';
import { TokenVault } from './TokenVault.js';

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

// A zkApp that holds MYTKN: a vault on the token account
// (vault address, token id). Alice owns it.
const tokenId = token.deriveTokenId();
const vaultPrivateKey = PrivateKey.random();
const vaultAddress = vaultPrivateKey.toPublicKey();

// docs:start vault-deploy
const vault = new TokenVault(vaultAddress, tokenId);

console.log('deploying the vault on a token account...');
const deployVaultTx = await Mina.transaction(deployer, async () => {
  // One new account: the vault's token account.
  AccountUpdate.fundNewAccount(deployer);
  await vault.deploy({ owner: alice });
  // The vault's deploy update uses the token, so the token manager approves it.
  await token.approveAccountUpdate(vault.self);
});
await deployVaultTx.prove();
await deployVaultTx.sign([deployer.key, vaultPrivateKey]).send();
// docs:end vault-deploy

// docs:start vault-deposit
console.log('bob deposits into the vault...');
const depositAmount = UInt64.from(15_000);
const depositTx = await Mina.transaction(bob, async () => {
  await vault.deposit(depositAmount);
  // The token manager moves the tokens from bob to the vault update that
  // deposit() made, and approves both updates.
  await token.transfer(bob, vault.self, depositAmount);
});
await depositTx.prove();
await depositTx.sign([bob.key]).send();
// docs:end vault-deposit

console.log('bob balance:', Mina.getBalance(bob, tokenId).toString());
console.log('vault balance:', Mina.getBalance(vaultAddress, tokenId).toString());
console.log('total deposited:', vault.totalDeposited.get().toString());

// docs:start vault-withdraw
console.log('alice, the owner, withdraws from the vault...');
const withdrawAmount = UInt64.from(10_000);
const withdrawTx = await Mina.transaction(alice, async () => {
  await vault.withdraw(withdrawAmount);
  await token.transfer(vault.self, alice, withdrawAmount);
});
await withdrawTx.prove();
await withdrawTx.sign([alice.key]).send();
// docs:end vault-withdraw

console.log('alice balance:', Mina.getBalance(alice, tokenId).toString());
console.log('vault balance:', Mina.getBalance(vaultAddress, tokenId).toString());
console.log('total deposited:', vault.totalDeposited.get().toString());
console.log(
  'total in circulation is unchanged by the vault:',
  token.totalAmountInCirculation.get().toString()
);

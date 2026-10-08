import { fileURLToPath } from 'node:url';
import {
  AccountUpdate,
  Mina,
  PrivateKey,
  PublicKey,
  TokenId,
  UInt64,
} from 'o1js';
import { MyToken } from './MyToken.js';
import { TokenHolder, TokenUser } from './TokenUser.js';
import { WrappedMina } from './WrappedMina.js';

// 1 MINA is 10^9 nanomina. Balances are in nanomina.
const MINA = 1_000_000_000n;

// docs:start progress
// Print each step with the time since the start, so that you can see that a
// long step (compile or prove) is still running and not stuck
const start = Date.now();
function step(message: string) {
  const seconds = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[${seconds.padStart(6)}s] ${message}`);
}
// docs:end progress

export async function main(proofsEnabled = false) {
  // docs:start setup
  // A local blockchain, so this runs with no network, no faucet and no funds
  const Local = await Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);

  // Two test accounts: one pays the fees, the other wraps MINA
  const [feePayer, user] = Local.testAccounts;

  const tokenKey = PrivateKey.randomKeypair();
  const tokenUserKey = PrivateKey.randomKeypair();
  const wrappedMinaKey = PrivateKey.randomKeypair();

  const token = new MyToken(tokenKey.publicKey);
  const tokenId = token.deriveTokenId();
  const tokenUser = new TokenUser(tokenUserKey.publicKey);
  // TokenHolder has the TokenUser address, on the MyToken token
  const tokenHolder = new TokenHolder(tokenUserKey.publicKey, tokenId);
  const wrappedMina = new WrappedMina(wrappedMinaKey.publicKey);

  step(proofsEnabled ? 'proofs are on' : 'proofs are off');
  if (proofsEnabled) {
    step('compiling MyToken, TokenHolder, TokenUser and WrappedMina...');
    await MyToken.compile();
    await TokenHolder.compile();
    await TokenUser.compile();
    await WrappedMina.compile();
    step('compiled');
  }
  // docs:end setup

  // docs:start deploy
  // Deploy MyToken, TokenUser and TokenHolder. TokenHolder is on a MyToken
  // token account, so MyToken must approve its deployment.
  step('deploying MyToken, TokenUser and TokenHolder...');
  const deployTx = await Mina.transaction(feePayer, async () => {
    // Four new accounts: MyToken, the MyToken token account that init()
    // mints the supply to, TokenUser and TokenHolder
    AccountUpdate.fundNewAccount(feePayer, 4);
    await token.deploy();
    await tokenUser.deploy();
    await tokenHolder.deploy();
    await token.approveDeploy(tokenHolder.self.extractTree());
  });
  await deployTx.prove();
  await deployTx
    .sign([feePayer.key, tokenKey.privateKey, tokenUserKey.privateKey])
    .send();
  // docs:end deploy
  printTokenBalances(tokenId, {
    MyToken: tokenKey.publicKey,
    TokenHolder: tokenUserKey.publicKey,
  });

  // docs:start fund-holder
  // Move 500 tokens from the MyToken token account to TokenHolder.
  // transfer() calls approveBase(). The `from` account signs.
  step('transferring 500 tokens to TokenHolder...');
  const fundTx = await Mina.transaction(feePayer, async () => {
    await token.transfer(tokenKey.publicKey, tokenUserKey.publicKey, 500);
  });
  await fundTx.prove();
  await fundTx.sign([feePayer.key, tokenKey.privateKey]).send();
  // docs:end fund-holder
  printTokenBalances(tokenId, {
    MyToken: tokenKey.publicKey,
    TokenHolder: tokenUserKey.publicKey,
  });

  // docs:start send-my-tokens
  // TokenUser sends 100 of the tokens that TokenHolder holds to the fee
  // payer. The fee payer has no MyToken token account yet, so the
  // transaction pays for one.
  step('TokenUser.sendMyTokens(100) to the fee payer...');
  const sendTx = await Mina.transaction(feePayer, async () => {
    AccountUpdate.fundNewAccount(feePayer);
    await tokenUser.sendMyTokens(
      tokenKey.publicKey,
      UInt64.from(100),
      feePayer
    );
  });
  await sendTx.prove();
  await sendTx.sign([feePayer.key]).send();
  // docs:end send-my-tokens
  printTree(sendTx);
  printTokenBalances(tokenId, {
    TokenHolder: tokenUserKey.publicKey,
    'fee payer': feePayer,
  });

  // docs:start wrap
  // Deploy WrappedMina, then wrap 10 MINA for `user`
  step('deploying WrappedMina...');
  const deployWMinaTx = await Mina.transaction(feePayer, async () => {
    AccountUpdate.fundNewAccount(feePayer);
    await wrappedMina.deploy();
  });
  await deployWMinaTx.prove();
  await deployWMinaTx.sign([feePayer.key, wrappedMinaKey.privateKey]).send();

  step('wrapping 10 MINA...');
  const wrapTx = await Mina.transaction(feePayer, async () => {
    // The user has no wMINA token account yet
    AccountUpdate.fundNewAccount(feePayer);

    // The user's MINA account update: it sends 10 MINA, so it needs the
    // user's signature
    const sender = AccountUpdate.createSigned(user);
    sender.label = 'user sends MINA';
    sender.balance.subInPlace(10n * MINA);
    await wrappedMina.wrap(sender.extractTree());
  });
  await wrapTx.prove();
  await wrapTx.sign([feePayer.key, user.key]).send();
  // docs:end wrap
  printTree(wrapTx);
  printWMinaBalances(wrappedMina, user, wrappedMinaKey.publicKey);

  // docs:start unwrap
  // Unwrap 4 wMINA. The user's wMINA account update burns 4 wMINA, so it
  // needs the user's signature.
  step('unwrapping 4 wMINA...');
  const unwrapTx = await Mina.transaction(feePayer, async () => {
    const sender = AccountUpdate.createSigned(user, wrappedMina.wMINA);
    sender.label = 'user burns wMINA';
    sender.balance.subInPlace(4n * MINA);
    await wrappedMina.unwrap(sender.extractTree());
  });
  await unwrapTx.prove();
  await unwrapTx.sign([feePayer.key, user.key]).send();
  // docs:end unwrap
  printTree(unwrapTx);
  printWMinaBalances(wrappedMina, user, wrappedMinaKey.publicKey);

  // docs:start settle
  // Apply the two supply changes, +10 and -4, to totalSupply
  step('settling the total supply...');
  const settleTx = await Mina.transaction(feePayer, async () => {
    await wrappedMina.settleTotalSupply();
  });
  await settleTx.prove();
  await settleTx.sign([feePayer.key]).send();
  // docs:end settle

  const totalSupply = wrappedMina.totalSupply.get();
  step(`wMINA total supply: ${formatMina(totalSupply)}`);
  step('done');

  return {
    totalSupply,
    userWMina: Mina.getBalance(user, wrappedMina.wMINA),
    feePayerTokens: Mina.getBalance(feePayer, tokenId),
  };
}

// The account updates of a transaction, one line for each, indented by
// call depth
function printTree(tx: Mina.Transaction<boolean, boolean>) {
  for (const update of tx.transaction.accountUpdates) {
    const indent = '  '.repeat(update.body.callDepth + 1);
    const token = update.body.tokenId.equals(TokenId.default).toBoolean()
      ? 'MINA'
      : 'token';
    const change = update.body.balanceChange.toString();
    console.log(`         ${indent}${update.label} [${token} ${change}]`);
  }
}

function printTokenBalances(
  tokenId: ReturnType<MyToken['deriveTokenId']>,
  accounts: Record<string, PublicKey>
) {
  for (const [name, address] of Object.entries(accounts)) {
    const balance = Mina.getBalance(address, tokenId).toString();
    console.log(`           ${name}: ${balance} tokens`);
  }
}

function printWMinaBalances(
  wrappedMina: WrappedMina,
  user: PublicKey,
  wrappedMinaAddress: PublicKey
) {
  console.log(
    `           user: ${formatMina(Mina.getBalance(user, wrappedMina.wMINA))} wMINA`
  );
  console.log(
    `           WrappedMina: ${formatMina(Mina.getBalance(wrappedMinaAddress))} MINA`
  );
}

function formatMina(amount: UInt64) {
  return (Number(amount.toBigInt()) / Number(MINA)).toString();
}

// Run main() only when this file is the entry point, not when a test imports
// it. `npm start` runs with proofs off; `npm run start:proofs` turns them on.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main(process.argv.includes('--proofs'));
}

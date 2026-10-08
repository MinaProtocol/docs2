import { AccountUpdate, Mina, PrivateKey, PublicKey, UInt64 } from 'o1js';
import { FakeToken } from './FakeToken';
import { MyToken } from './MyToken';
import { TokenHolder, TokenUser } from './TokenUser';
import { WrappedMina } from './WrappedMina';

// Proofs are on. The claims in this file depend on proving: the network
// checks the proof of each account update against the verification key of
// its account. Compiling and proving take minutes, so these tests have a
// long timeout (jest.config.js), and each step prints how long it took.
const proofsEnabled = true;

// 1 MINA is 10^9 nanomina
const MINA = 1_000_000_000n;

let feePayer: Mina.TestPublicKey;
let user: Mina.TestPublicKey;
let other: Mina.TestPublicKey;
let tokenKey: { privateKey: PrivateKey; publicKey: PublicKey };
let tokenUserKey: { privateKey: PrivateKey; publicKey: PublicKey };
let wrappedMinaKey: { privateKey: PrivateKey; publicKey: PublicKey };
let token: MyToken;
let tokenId: ReturnType<MyToken['deriveTokenId']>;
let tokenUser: TokenUser;
let tokenHolder: TokenHolder;
let wrappedMina: WrappedMina;

// Run `fn` and print how long it took
async function timed<T>(label: string, fn: () => Promise<T>) {
  const start = Date.now();
  const result = await fn();
  console.log(`${label}: ${((Date.now() - start) / 1000).toFixed(1)} s`);
  return result;
}

function tokens(address: PublicKey) {
  return Mina.getBalance(address, tokenId).toString();
}

describe('advanced account updates, with proofs', () => {
  beforeAll(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [feePayer, user, other] = Local.testAccounts;

    tokenKey = PrivateKey.randomKeypair();
    tokenUserKey = PrivateKey.randomKeypair();
    wrappedMinaKey = PrivateKey.randomKeypair();
    token = new MyToken(tokenKey.publicKey);
    tokenId = token.deriveTokenId();
    tokenUser = new TokenUser(tokenUserKey.publicKey);
    tokenHolder = new TokenHolder(tokenUserKey.publicKey, tokenId);
    wrappedMina = new WrappedMina(wrappedMinaKey.publicKey);

    await timed('compile MyToken', () => MyToken.compile());
    await timed('compile TokenHolder', () => TokenHolder.compile());
    await timed('compile TokenUser', () => TokenUser.compile());
    await timed('compile WrappedMina', () => WrappedMina.compile());
    await timed('compile FakeToken', () => FakeToken.compile());
  });

  it('deploys MyToken, TokenUser and TokenHolder, and funds TokenHolder', async () => {
    const deployTx = await Mina.transaction(feePayer, async () => {
      AccountUpdate.fundNewAccount(feePayer, 4);
      await token.deploy();
      await tokenUser.deploy();
      await tokenHolder.deploy();
      await token.approveDeploy(tokenHolder.self.extractTree());
    });
    await timed('prove deploy', () => deployTx.prove());
    await deployTx
      .sign([feePayer.key, tokenKey.privateKey, tokenUserKey.privateKey])
      .send();

    const fundTx = await Mina.transaction(feePayer, async () => {
      await token.transfer(tokenKey.publicKey, tokenUserKey.publicKey, 500);
    });
    await timed('prove transfer', () => fundTx.prove());
    await fundTx.sign([feePayer.key, tokenKey.privateKey]).send();

    expect(tokens(tokenKey.publicKey)).toBe('500');
    expect(tokens(tokenUserKey.publicKey)).toBe('500');
  });

  it('proves sendMyTokens(100) with one proof for each contract', async () => {
    const tx = await Mina.transaction(feePayer, async () => {
      AccountUpdate.fundNewAccount(feePayer);
      await tokenUser.sendMyTokens(tokenKey.publicKey, UInt64.from(100), feePayer);
    });
    const proved = await timed('prove sendMyTokens', () => tx.prove());
    await tx.sign([feePayer.key]).send();

    // TokenUser, MyToken and TokenHolder each prove their own update. The
    // mint update has no proof: its parent, MyToken, authorizes it.
    const withProof = tx.transaction.accountUpdates
      .filter((_, i) => proved.proofs[i] !== undefined)
      .map((u) => u.label);
    expect(withProof).toEqual([
      'TokenUser.sendMyTokens()',
      'MyToken.approveTransfer()',
      'TokenHolder.transferAway()',
    ]);
    expect(tokens(tokenUserKey.publicKey)).toBe('400');
    expect(tokens(feePayer)).toBe('100');
  });

  it('rejects an approval from a different contract at the MyToken address', async () => {
    // The FakeToken proof is checked against the MyToken verification key
    // that is stored at the MyToken address, so it is invalid
    const tx = await Mina.transaction(feePayer, async () => {
      AccountUpdate.fundNewAccount(feePayer);
      await tokenHolder.transferAway(UInt64.from(1));
      await new FakeToken(tokenKey.publicKey).approveTransfer(
        tokenHolder.self.extractTree(),
        other
      );
    });
    await timed('prove fake approval', () => tx.prove());

    await expect(tx.sign([feePayer.key]).send()).rejects.toThrow(
      /Invalid proof for account update/
    );
    expect(tokens(tokenUserKey.publicKey)).toBe('400');
    expect(Mina.hasAccount(other, tokenId)).toBe(false);
  });

  it('wraps 10 MINA, unwraps 4 wMINA and settles a total supply of 6', async () => {
    const deployTx = await Mina.transaction(feePayer, async () => {
      AccountUpdate.fundNewAccount(feePayer);
      await wrappedMina.deploy();
    });
    await timed('prove WrappedMina deploy', () => deployTx.prove());
    await deployTx.sign([feePayer.key, wrappedMinaKey.privateKey]).send();

    const wrapTx = await Mina.transaction(feePayer, async () => {
      AccountUpdate.fundNewAccount(feePayer);
      const sender = AccountUpdate.createSigned(user);
      sender.balance.subInPlace(10n * MINA);
      await wrappedMina.wrap(sender.extractTree());
    });
    await timed('prove wrap', () => wrapTx.prove());
    await wrapTx.sign([feePayer.key, user.key]).send();

    const unwrapTx = await Mina.transaction(feePayer, async () => {
      const sender = AccountUpdate.createSigned(user, wrappedMina.wMINA);
      sender.balance.subInPlace(4n * MINA);
      await wrappedMina.unwrap(sender.extractTree());
    });
    await timed('prove unwrap', () => unwrapTx.prove());
    await unwrapTx.sign([feePayer.key, user.key]).send();

    const settleTx = await Mina.transaction(feePayer, async () => {
      await wrappedMina.settleTotalSupply();
    });
    await timed('prove settleTotalSupply', () => settleTx.prove());
    await settleTx.sign([feePayer.key]).send();

    expect(Mina.getBalance(user, wrappedMina.wMINA).toBigInt()).toBe(6n * MINA);
    expect(Mina.getBalance(wrappedMinaKey.publicKey).toBigInt()).toBe(6n * MINA);
    expect(wrappedMina.totalSupply.get().toBigInt()).toBe(6n * MINA);
  });
});

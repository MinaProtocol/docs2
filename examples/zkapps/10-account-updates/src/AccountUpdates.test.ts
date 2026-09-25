import {
  AccountUpdate,
  Field,
  Mina,
  Permissions,
  PrivateKey,
  PublicKey,
  TokenId,
} from 'o1js';
import { ProofsOnlyZkApp } from './ProofsOnlyZkApp';
import { SecondaryZkApp } from './SecondaryZkApp';

// Proofs are off so the suite runs in seconds. The account update structure,
// the preconditions, the state transitions and the rejections are all the
// same either way; only the proof bytes are dummies.
const proofsEnabled = false;

// The account creation fee on a LocalBlockchain: 1 MINA, in nanomina.
const ACCOUNT_CREATION_FEE = 1_000_000_000n;

let Local: Awaited<ReturnType<typeof Mina.LocalBlockchain>>;
let deployer: Mina.TestPublicKey;
let proofsOnlySk: PrivateKey;
let proofsOnlyAddr: PublicKey;
let secondarySk: PrivateKey;
let secondaryAddr: PublicKey;
let proofsOnly: ProofsOnlyZkApp;
let secondary: SecondaryZkApp;

type Txn = Awaited<ReturnType<typeof Mina.transaction>>;

// Summarise a transaction as the page describes it: one entry per account
// update, in pre-order, with its label and its depth in the call tree.
function shape(txn: Txn) {
  return txn.transaction.accountUpdates.map((au) => ({
    label: au.label,
    depth: au.body.callDepth,
  }));
}

// The values an account update writes to appState, by index.
function stateWrites(au: AccountUpdate) {
  const writes: Record<number, string> = {};
  au.body.update.appState.forEach((s, i) => {
    if (s.isSome.toBoolean()) writes[i] = s.value.toString();
  });
  return writes;
}

function readState() {
  return {
    num: proofsOnly.num.get().toString(),
    calls: proofsOnly.calls.get().toString(),
    secondaryNum: secondary.num.get().toString(),
  };
}

async function buildDeploy() {
  // The page's deployTxn, as written.
  const txn = await Mina.transaction(deployer, async () => {
    AccountUpdate.fundNewAccount(deployer, 2);
    await proofsOnly.deploy();
    await secondary.deploy();
  });
  await txn.prove();
  txn.sign([deployer.key, proofsOnlySk, secondarySk]);
  return txn;
}

async function add(n: number) {
  const txn = await Mina.transaction(deployer, async () => {
    await proofsOnly.add(Field(n));
  });
  await txn.prove();
  await txn.sign([deployer.key]).send();
  return txn;
}

async function callSecondary() {
  const txn = await Mina.transaction(deployer, async () => {
    await proofsOnly.callSecondary(secondaryAddr);
  });
  await txn.prove();
  await txn.sign([deployer.key]).send();
  return txn;
}

beforeEach(async () => {
  Local = await Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);
  deployer = Local.testAccounts[0];

  proofsOnlySk = PrivateKey.random();
  proofsOnlyAddr = proofsOnlySk.toPublicKey();
  secondarySk = PrivateKey.random();
  secondaryAddr = secondarySk.toPublicKey();
  proofsOnly = new ProofsOnlyZkApp(proofsOnlyAddr);
  secondary = new SecondaryZkApp(secondaryAddr);

  if (proofsEnabled) {
    await ProofsOnlyZkApp.compile();
    await SecondaryZkApp.compile();
  }
});

describe('deploy transaction', () => {
  it('has the five account updates the page lists, in order', async () => {
    // The page: "The deploy transaction includes 5 accountUpdates", from left
    // to right: new account fee, deploy and init of proofsOnlyZkApp, deploy
    // and init of secondaryZkApp. All five are top-level updates.
    const txn = await buildDeploy();
    expect(shape(txn)).toEqual([
      { label: 'AccountUpdate.fundNewAccount()', depth: 0 },
      { label: 'ProofsOnlyZkApp.deploy()', depth: 0 },
      { label: 'ProofsOnlyZkApp.init()', depth: 0 },
      { label: 'SecondaryZkApp.deploy()', depth: 0 },
      { label: 'SecondaryZkApp.init()', depth: 0 },
    ]);
  });

  it('charges the deployer the fee for two new accounts', async () => {
    // The page: "Takes the new account fee from the deployer [...] Note the
    // -2 on the balanceChange field." That is 2 MINA, in nanomina.
    const txn = await buildDeploy();
    const [fund] = txn.transaction.accountUpdates;
    expect(fund.publicKey).toEqual(deployer);
    expect(fund.body.balanceChange.isNegative().toBoolean()).toBe(true);
    expect(fund.body.balanceChange.magnitude.toBigInt()).toBe(
      2n * ACCOUNT_CREATION_FEE
    );

    const before = Mina.getBalance(deployer).toBigInt();
    await txn.send();
    // The transaction fee is 0 on a LocalBlockchain: only the account fees.
    expect(before - Mina.getBalance(deployer).toBigInt()).toBe(
      2n * ACCOUNT_CREATION_FEE
    );
  });

  it('sets proof-only permissions on proofsOnlyZkApp and defaults on the other', async () => {
    // The page: the proofsOnlyZkApp deploy has "the permissions [...] all set
    // to the values in the zkApp's deploy field"; for secondaryZkApp "the
    // permissions here are set to default values".
    const txn = await buildDeploy();
    const [, deployP, , deployS] = txn.transaction.accountUpdates;

    const p = deployP.body.update.permissions;
    expect(p.isSome.toBoolean()).toBe(true);
    const proof = Permissions.proof();
    for (const key of [
      'editState',
      'send',
      'setDelegate',
      'setPermissions',
      'setZkappUri',
      'setTokenSymbol',
      'incrementNonce',
      'setVotingFor',
      'setTiming',
    ] as const) {
      expect(p.value[key]).toEqual(proof);
    }
    expect(p.value.setVerificationKey.auth).toEqual(proof);

    const s = deployS.body.update.permissions;
    expect(s.isSome.toBoolean()).toBe(true);
    expect(s.value).toEqual(Permissions.default());
  });

  it('guards each deploy with a nonce precondition and each init with provedState false', async () => {
    // The page: the deploy has "the preconditions asserting the nonce, so the
    // transaction can't be applied more than once", and the init has "the
    // precondition that it can't already be in a proved state".
    const txn = await buildDeploy();
    const [, deployP, initP, deployS, initS] = txn.transaction.accountUpdates;

    for (const deploy of [deployP, deployS]) {
      const nonce = deploy.body.preconditions.account.nonce;
      expect(nonce.isSome.toBoolean()).toBe(true);
      expect(nonce.value.lower.toString()).toBe('0');
      expect(nonce.value.upper.toString()).toBe('0');
    }
    for (const init of [initP, initS]) {
      const proved = init.body.preconditions.account.provedState;
      expect(proved.isSome.toBoolean()).toBe(true);
      expect(proved.value.toBoolean()).toBe(false);
    }
  });

  it('initialises num to 1 and calls to 0, and the secondary num to 12', async () => {
    // The page's init() methods: num = 1, calls = 0; secondary num = 12. The
    // page: "provedState becomes true after init() is invoked".
    await (await buildDeploy()).send();
    expect(readState()).toEqual({ num: '1', calls: '0', secondaryNum: '12' });
    expect(Mina.getAccount(proofsOnlyAddr).zkapp?.provedState.toBoolean()).toBe(
      true
    );
    expect(Mina.getAccount(secondaryAddr).zkapp?.provedState.toBoolean()).toBe(
      true
    );
  });

  it('identifies the accounts with the default MINA token id, 1', async () => {
    // The page: "TokenId [...] Defaults to the MINA TokenId (1)."
    expect(TokenId.default.toString()).toBe('1');
    const txn = await buildDeploy();
    for (const au of txn.transaction.accountUpdates) {
      expect(au.tokenId).toEqual(TokenId.default);
    }
  });

  it('cannot be applied a second time', async () => {
    const txn = await buildDeploy();
    await txn.send();
    const before = readState();
    await expect(txn.send()).rejects.toThrow();
    expect(readState()).toEqual(before);
  });
});

describe('after deployment', () => {
  beforeEach(async () => {
    await (await buildDeploy()).send();
  });

  it('add(4) is a parent update with incrementCalls() as its child', async () => {
    // The page, "Two AccountUpdates": the parent corresponds to add(), and
    // the child to the this.incrementCalls() call that the parent makes.
    const txn = await add(4);
    expect(shape(txn)).toEqual([
      { label: 'ProofsOnlyZkApp.add()', depth: 0 },
      { label: 'ProofsOnlyZkApp.incrementCalls()', depth: 1 },
    ]);
  });

  it('add(4) sets appState[0] to 5 in the parent and appState[1] to 1 in the child', async () => {
    // The page: "The first AccountUpdate sets the state of appState[0] to 5
    // [...] In the second AccountUpdate, appState[1] is set to 1".
    const txn = await add(4);
    const [parent, child] = txn.transaction.accountUpdates;
    expect(stateWrites(parent)).toEqual({ 0: '5' });
    expect(stateWrites(child)).toEqual({ 1: '1' });
    expect(readState()).toEqual({ num: '5', calls: '1', secondaryNum: '12' });
  });

  it('callSecondary() makes three updates: the parent, secondary add(), then incrementCalls()', async () => {
    // The page: "This call produces three accountUpdates: callSecondary()
    // (the parent), secondaryZkApp.add() (the left child), incrementCalls()
    // (the right child)". Pre-order: parent, left child, right child.
    await add(4);
    const txn = await callSecondary();
    expect(shape(txn)).toEqual([
      { label: 'ProofsOnlyZkApp.callSecondary()', depth: 0 },
      { label: 'SecondaryZkApp.add()', depth: 1 },
      { label: 'ProofsOnlyZkApp.incrementCalls()', depth: 1 },
    ]);
    const [, left, right] = txn.transaction.accountUpdates;
    expect(left.publicKey).toEqual(secondaryAddr);
    expect(right.publicKey).toEqual(proofsOnlyAddr);
  });

  it('callSecondary() sets num to 12, the secondary value from the start of the transaction', async () => {
    // The page: "callSecondary sets this.num to 12 which is the value of
    // secondaryContract at the 'start' of the transaction." The secondary
    // add() itself does run: 12 + 5 = 17.
    await add(4);
    const txn = await callSecondary();
    expect(stateWrites(txn.transaction.accountUpdates[0])).toEqual({
      0: '12',
    });
    expect(stateWrites(txn.transaction.accountUpdates[1])).toEqual({
      0: '17',
    });
    expect(readState()).toEqual({ num: '12', calls: '2', secondaryNum: '17' });
  });

  it('rejects a second init() and leaves the state untouched', async () => {
    // The page: "By asserting that provedState is false in init(), you ensure
    // that init() cannot be called again [...] Without this assertion, your
    // zkApp could be reset by anyone".
    await add(4);
    const before = readState();
    await expect(
      Mina.transaction(deployer, async () => {
        await proofsOnly.init();
      })
    ).rejects.toThrow();
    expect(readState()).toEqual(before);
    expect(before).toEqual({ num: '5', calls: '1', secondaryNum: '12' });
  });

  it("rejects a signature from proofsOnlyZkApp's own private key", async () => {
    // The page: after the first deployment "the zkApp requires proof
    // authorization [...] The private key is no longer useful for anything."
    const uriBefore = Mina.getAccount(proofsOnlyAddr).zkapp?.zkappUri;
    const txn = await Mina.transaction(deployer, async () => {
      const au = AccountUpdate.createSigned(proofsOnlyAddr);
      au.account.zkappUri.set('https://example.com');
    });
    await txn.prove();
    await expect(txn.sign([deployer.key, proofsOnlySk]).send()).rejects.toThrow(
      /Update_not_permitted_zkapp_uri/
    );
    expect(Mina.getAccount(proofsOnlyAddr).zkapp?.zkappUri).toEqual(uriBefore);
  });

  it('accepts the same signed change on secondaryZkApp, which keeps default permissions', async () => {
    // The contrast the page draws: secondaryZkApp's permissions "are set to
    // default values", so its private key can still change it.
    const txn = await Mina.transaction(deployer, async () => {
      const au = AccountUpdate.createSigned(secondaryAddr);
      au.account.zkappUri.set('https://example.com');
    });
    await txn.prove();
    await txn.sign([deployer.key, secondarySk]).send();
    expect(Mina.getAccount(secondaryAddr).zkapp?.zkappUri).toBe(
      'https://example.com'
    );
  });

  it('rejects a stale add() whose state precondition no longer holds', async () => {
    // add() reads num with getAndRequireEquals(), a precondition on the
    // account. A transaction built on num = 1 must not apply once num is 5.
    // A second fee payer, so its nonce stays valid and only the state
    // precondition can fail.
    const other = Local.testAccounts[1];
    const stale = await Mina.transaction(other, async () => {
      await proofsOnly.add(Field(4));
    });
    await stale.prove();
    stale.sign([other.key]);

    await add(4);
    const before = readState();
    const otherBalance = Mina.getBalance(other);

    await expect(stale.send()).rejects.toThrow(/precondition/i);
    expect(readState()).toEqual(before);
    expect(Mina.getBalance(other)).toEqual(otherBalance);
  });

  it('rejects a proved transaction that the fee payer did not sign', async () => {
    // The page's snippets once sent txn1 and txn2 after prove() without
    // sign(). The network rejects that, and nothing changes.
    const balance = Mina.getBalance(deployer);
    const txn = await Mina.transaction(deployer, async () => {
      await proofsOnly.add(Field(4));
    });
    await txn.prove();
    await expect(txn.send()).rejects.toThrow(/Invalid signature on fee payer/);
    expect(readState()).toEqual({ num: '1', calls: '0', secondaryNum: '12' });
    expect(Mina.getBalance(deployer)).toEqual(balance);
  });
});

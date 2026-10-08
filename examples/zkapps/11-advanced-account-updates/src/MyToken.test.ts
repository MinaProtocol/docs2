import {
  AccountUpdate,
  AccountUpdateForest,
  Int64,
  Mina,
  Permissions,
  PrivateKey,
  PublicKey,
  UInt64,
} from 'o1js';
import { FakeToken } from './FakeToken';
import { MyToken } from './MyToken';
import { TokenHolder, TokenUser } from './TokenUser';

// Proofs are off. The claims that depend on proving are in
// src/AdvancedAccountUpdates.proofs.test.ts.
const proofsEnabled = false;

let feePayer: Mina.TestPublicKey;
let other: Mina.TestPublicKey;
let tokenKey: { privateKey: PrivateKey; publicKey: PublicKey };
let tokenUserKey: { privateKey: PrivateKey; publicKey: PublicKey };
let token: MyToken;
let tokenId: ReturnType<MyToken['deriveTokenId']>;
let tokenUser: TokenUser;
let tokenHolder: TokenHolder;

function balance(address: PublicKey) {
  return Mina.getBalance(address, tokenId).toString();
}

describe('MyToken, TokenUser and TokenHolder', () => {
  beforeAll(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [feePayer, other] = Local.testAccounts;

    tokenKey = PrivateKey.randomKeypair();
    tokenUserKey = PrivateKey.randomKeypair();
    token = new MyToken(tokenKey.publicKey);
    tokenId = token.deriveTokenId();
    tokenUser = new TokenUser(tokenUserKey.publicKey);
    tokenHolder = new TokenHolder(tokenUserKey.publicKey, tokenId);
  });

  describe('deploy', () => {
    it('deploys MyToken', async () => {
      // Two new accounts: MyToken, and the token account that init() mints to
      const tx = await Mina.transaction(feePayer, async () => {
        AccountUpdate.fundNewAccount(feePayer, 2);
        await token.deploy();
      });
      await tx.prove();
      await tx.sign([feePayer.key, tokenKey.privateKey]).send();
      expect(Mina.getAccount(tokenKey.publicKey).zkapp?.verificationKey).toBeDefined();
    });

    it('rejects a zkApp on a token account that the token contract did not approve', async () => {
      // TokenHolder uses the MyToken token, so its deploy update needs a
      // parent that is the token manager account
      const deployHolder = await Mina.transaction(feePayer, async () => {
        AccountUpdate.fundNewAccount(feePayer);
        await tokenHolder.deploy();
      });
      await deployHolder.prove();
      await expect(
        deployHolder.sign([feePayer.key, tokenUserKey.privateKey]).send()
      ).rejects.toThrow(/Token_owner_not_caller/);
      expect(Mina.hasAccount(tokenUserKey.publicKey, tokenId)).toBe(false);
    });

    it('init() mints the supply of 1000 to the MyToken token account', () => {
      expect(balance(tokenKey.publicKey)).toBe('1000');
    });

    it('sets the access permission of MyToken to proofOrSignature', () => {
      // TokenContract.deploy() does this, so that no one can use the token
      // without the token contract
      const { access } = Mina.getAccount(tokenKey.publicKey).permissions;
      expect(access).toEqual(Permissions.proofOrSignature());
    });

    it('approveDeploy() rejects a deploy update that mints tokens', async () => {
      await expect(
        Mina.transaction(feePayer, async () => {
          AccountUpdate.fundNewAccount(feePayer, 2);
          await tokenUser.deploy();
          await tokenHolder.deploy();
          // A positive balance change would make tokens out of nothing
          tokenHolder.self.balance.addInPlace(1);
          await token.approveDeploy(tokenHolder.self.extractTree());
        })
      ).rejects.toThrow(/the balance change must be zero/);
    });

    it('approveDeploy() rejects a deploy update that has children', async () => {
      await expect(
        Mina.transaction(feePayer, async () => {
          AccountUpdate.fundNewAccount(feePayer, 2);
          await tokenUser.deploy();
          await tokenHolder.deploy();
          // A child that could inherit the token permission from its parent
          const child = AccountUpdate.create(other, tokenId);
          child.body.mayUseToken = AccountUpdate.MayUseToken.InheritFromParent;
          tokenHolder.self.approve(child);
          await token.approveDeploy(tokenHolder.self.extractTree());
        })
      ).rejects.toThrow(/the update must have no children/);
    });

    it('approveDeploy() rejects an update on a different token', async () => {
      await expect(
        Mina.transaction(feePayer, async () => {
          await token.approveDeploy(
            AccountUpdate.create(other).extractTree()
          );
        })
      ).rejects.toThrow(/wrong token/);
    });

    it('deploys TokenUser and TokenHolder with approveDeploy()', async () => {
      const tx = await Mina.transaction(feePayer, async () => {
        AccountUpdate.fundNewAccount(feePayer, 2);
        await tokenUser.deploy();
        await tokenHolder.deploy();
        await token.approveDeploy(tokenHolder.self.extractTree());
      });
      await tx.prove();
      await tx
        .sign([feePayer.key, tokenKey.privateKey, tokenUserKey.privateKey])
        .send();

      // Two accounts with one address: TokenUser on MINA, TokenHolder on
      // the MyToken token. Each has its own verification key.
      const userAccount = Mina.getAccount(tokenUserKey.publicKey);
      const holderAccount = Mina.getAccount(tokenUserKey.publicKey, tokenId);
      expect(userAccount.zkapp?.verificationKey).toBeDefined();
      expect(holderAccount.zkapp?.verificationKey).toBeDefined();
      expect(holderAccount.tokenId.toString()).toBe(tokenId.toString());
      expect(balance(tokenUserKey.publicKey)).toBe('0');
    });
  });

  describe('approveBase()', () => {
    it('transfer() moves 500 tokens to TokenHolder', async () => {
      const tx = await Mina.transaction(feePayer, async () => {
        await token.transfer(tokenKey.publicKey, tokenUserKey.publicKey, 500);
      });
      await tx.prove();
      await tx.sign([feePayer.key, tokenKey.privateKey]).send();

      expect(balance(tokenKey.publicKey)).toBe('500');
      expect(balance(tokenUserKey.publicKey)).toBe('500');
    });

    it('rejects updates whose token balance changes do not add up to zero', async () => {
      // One update that adds 1 token, with no update that takes 1 away
      const mint = AccountUpdate.default(tokenKey.publicKey, tokenId);
      mint.balanceChange = Int64.from(1);
      const forest = AccountUpdateForest.fromFlatArray([mint]);

      await expect(
        Mina.transaction(feePayer, async () => {
          await token.approveBase(forest);
        })
      ).rejects.toThrow(/1 != 0/);
      expect(balance(tokenKey.publicKey)).toBe('500');
    });
  });

  describe('sendMyTokens()', () => {
    let sendTx: Mina.Transaction<boolean, boolean>;

    it('sends 100 tokens from TokenHolder to a new token account', async () => {
      const tx = await Mina.transaction(feePayer, async () => {
        AccountUpdate.fundNewAccount(feePayer);
        await tokenUser.sendMyTokens(
          tokenKey.publicKey,
          UInt64.from(100),
          feePayer
        );
      });
      await tx.prove();
      await tx.sign([feePayer.key]).send();
      sendTx = tx;

      expect(balance(tokenUserKey.publicKey)).toBe('400');
      expect(balance(feePayer)).toBe('100');
    });

    it('makes the token contract the parent of both token updates', () => {
      const updates = sendTx.transaction.accountUpdates.map((u) => [
        u.label,
        u.body.callDepth,
        u.body.balanceChange.toString(),
      ]);
      expect(updates).toEqual([
        ['AccountUpdate.fundNewAccount()', 0, '-1000000000'],
        ['TokenUser.sendMyTokens()', 0, '0'],
        ['MyToken.approveTransfer()', 1, '0'],
        ['TokenHolder.transferAway()', 2, '-100'],
        ['MyToken.approveTransfer().token.mint()', 2, '100'],
      ]);
    });

    it('gives both token updates the parentsOwnToken permission', () => {
      const tokenUpdates = sendTx.transaction.accountUpdates.filter((u) =>
        u.body.tokenId.equals(tokenId).toBoolean()
      );
      expect(tokenUpdates).toHaveLength(2);
      for (const update of tokenUpdates) {
        expect(update.body.mayUseToken.parentsOwnToken.toBoolean()).toBe(true);
        expect(update.body.mayUseToken.inheritFromParent.toBoolean()).toBe(
          false
        );
      }
    });

    it('rejects a send of more tokens than TokenHolder holds', async () => {
      const tx = await Mina.transaction(feePayer, async () => {
        await tokenUser.sendMyTokens(
          tokenKey.publicKey,
          UInt64.from(401),
          feePayer
        );
      });
      await tx.prove();
      await expect(tx.sign([feePayer.key]).send()).rejects.toThrow(
        /Overflow/
      );
      expect(balance(tokenUserKey.publicKey)).toBe('400');
      expect(balance(feePayer)).toBe('100');
    });
  });

  describe('approveTransfer()', () => {
    it('rejects an update with a positive balance change', async () => {
      await expect(
        Mina.transaction(feePayer, async () => {
          const update = AccountUpdate.create(other, tokenId);
          update.balance.addInPlace(5);
          await token.approveTransfer(update.extractTree(), other);
        })
      ).rejects.toThrow(/the balance change must be negative/);
    });

    it('rejects an update on a different token', async () => {
      // A MINA update that sends 5 MINA must not mint 5 tokens
      await expect(
        Mina.transaction(feePayer, async () => {
          const update = AccountUpdate.createSigned(other);
          update.balance.subInPlace(5);
          await token.approveTransfer(update.extractTree(), other);
        })
      ).rejects.toThrow(/wrong token/);
    });

    it('rejects an update with children', async () => {
      await expect(
        Mina.transaction(feePayer, async () => {
          const update = AccountUpdate.create(other, tokenId);
          update.balance.subInPlace(5);
          update.approve(AccountUpdate.create(other, tokenId));
          await token.approveTransfer(update.extractTree(), other);
        })
      ).rejects.toThrow(/the update must have no children/);
    });
  });

  describe('a token update without the token contract', () => {
    it('is refused by o1js when it asks for the token permission', async () => {
      // transferAway() at the top level of the transaction: no parent is the
      // token manager account, so its update cannot use the token
      const tx = await Mina.transaction(feePayer, async () => {
        await tokenHolder.transferAway(UInt64.from(10));
        AccountUpdate.create(feePayer, tokenId).balance.addInPlace(10);
      });
      await tx.prove();
      await expect(tx.sign([feePayer.key]).send()).rejects.toThrow(
        /Top-level account update can not use or pass on token permissions/
      );
      expect(balance(tokenUserKey.publicKey)).toBe('400');
    });

    it('is rejected by the network without the token permission', async () => {
      // The same updates with `mayUseToken` set to `No`, so o1js sends the
      // transaction and the network applies its own check
      const tx = await Mina.transaction(feePayer, async () => {
        await tokenHolder.transferAway(UInt64.from(10));
        tokenHolder.self.body.mayUseToken = AccountUpdate.MayUseToken.No;
        const receiver = AccountUpdate.create(feePayer, tokenId);
        receiver.body.mayUseToken = AccountUpdate.MayUseToken.No;
        receiver.balance.addInPlace(10);
      });
      await tx.prove();
      await expect(tx.sign([feePayer.key]).send()).rejects.toThrow(
        /Token_owner_not_caller/
      );
      expect(balance(tokenUserKey.publicKey)).toBe('400');
      expect(balance(feePayer)).toBe('100');
    });
  });

  describe('with proofs off', () => {
    it('accepts an approval from a different contract at the MyToken address', async () => {
      // FakeToken.approveTransfer() mints 1000 tokens for any update. With
      // proofs off, Mina.LocalBlockchain does not check its proof against
      // the MyToken verification key, so it accepts the transaction. A real
      // network rejects it: see src/AdvancedAccountUpdates.proofs.test.ts.
      const tx = await Mina.transaction(feePayer, async () => {
        AccountUpdate.fundNewAccount(feePayer);
        await tokenHolder.transferAway(UInt64.from(1));
        await new FakeToken(tokenKey.publicKey).approveTransfer(
          tokenHolder.self.extractTree(),
          other
        );
      });
      await tx.prove();
      await tx.sign([feePayer.key]).send();

      expect(balance(tokenUserKey.publicKey)).toBe('399');
      expect(balance(other)).toBe('1000');
    });
  });
});

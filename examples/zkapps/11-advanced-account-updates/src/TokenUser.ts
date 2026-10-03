import { PublicKey, SmartContract, TokenId, UInt64, method } from 'o1js';
import { MyToken } from './MyToken.js';

// docs:start token-holder
// A zkApp on a MyToken token account. It holds tokens for TokenUser: it is
// deployed at the TokenUser address, with the MyToken token ID.
export class TokenHolder extends SmartContract {
  @method async transferAway(amount: UInt64) {
    // A real zkApp does its own checks here, for example who can spend the
    // tokens. This example has none: any transaction can call this method,
    // but only the token contract can approve the update that it makes.
    this.balance.subInPlace(amount);
  }
}
// docs:end token-holder

// docs:start token-user
// A zkApp on the MINA token. It sends tokens that its TokenHolder holds.
export class TokenUser extends SmartContract {
  @method async sendMyTokens(
    tokenAddress: PublicKey,
    amount: UInt64,
    destination: PublicKey
  ) {
    const token = new MyToken(tokenAddress);
    const tokenId = TokenId.derive(tokenAddress);
    const tokenHolder = new TokenHolder(this.address, tokenId);

    // TokenHolder takes the tokens away from its account...
    await tokenHolder.transferAway(amount);

    // ...and the token contract approves that update and mints the same
    // amount to the destination
    await token.approveTransfer(tokenHolder.self.extractTree(), destination);
  }
}
// docs:end token-user

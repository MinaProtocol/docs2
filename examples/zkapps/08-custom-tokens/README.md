# Tutorial 8: Custom Tokens

Worked example for [Tutorial 8: Custom Tokens](https://docs.minaprotocol.com/zkapps/tutorials/custom-tokens).

`BasicTokenContract` is a token manager: a contract that owns a custom token and
decides who may mint it and how it moves. It extends `TokenContract`, the o1js
base class that supplies `this.internal.mint` / `.send` and the approval API.

Everything here runs against `Mina.LocalBlockchain`, so no network, no faucet
and no funded accounts are needed.

## Run it

```sh
npm install
npm start
```

`main.ts` deploys the contract, mints to one account, sends part of the balance
to another, and prints the balances and the amount in circulation at each step.
Then it deploys `TokenVault`, deposits tokens into it and withdraws them.

## Test it

```sh
npm test
```

The suite covers what the tutorial claims: the symbol is set on deployment, the
token id is not the MINA token id, minting raises the amount in circulation, a
transfer does not, and both the forged-signature and the overdraft cases are
rejected.

`WhitelistedTokenContract` adds a whitelist to the same design. Its
`approveBase()` is a `@method` that also checks the whitelist, so the inherited
`transfer()` helper works for whitelisted holders and cannot move the token to
or from any other address. `WhitelistedTokenContract.proofs.test.ts` checks
this with real proofs, so it compiles the contract and takes several minutes.

`TokenVault` is a zkApp that consumes the token. It is deployed on the token
account (vault address, token id of `BasicTokenContract`), so the token manager
must approve its deployment and every change to its balance. Any account can
`deposit()`; only the owner can `withdraw()`, and never more than the total
deposited. `main.ts` deploys it, deposits into it and withdraws from it.
`TokenVault.test.ts` checks each rule, and `TokenVault.proofs.test.ts` runs a
deposit and a withdrawal with real proofs.

## Requirements

Node 22.19.5 or later, which is what o1js 3 requires.

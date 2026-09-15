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

## Test it

```sh
npm test
```

The suite covers what the tutorial claims: the symbol is set on deployment, the
token id is not the MINA token id, minting raises the amount in circulation, a
transfer does not, and both the forged-signature and the overdraft cases are
rejected.

## Requirements

Node 22.19.5 or later, which is what o1js 3 requires.

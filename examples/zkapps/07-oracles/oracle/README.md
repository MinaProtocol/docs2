# Mina zkApp oracle example

A [Next.js](https://nextjs.org/) application that serves signed mock credit scores. It is the oracle of [Tutorial 7: Oracles](https://docs.minaprotocol.com/zkapps/tutorials/oracle); the smart contract in [../contracts](../contracts/) verifies its signatures. A deployment of this directory runs at `https://07-oracles.vercel.app`.

Requires Node.js 22.18 or later: the tests import the TypeScript source directly.

## Run the oracle

```sh
npm install
npm run dev
```

Open [http://localhost:3000/api/credit-score?user=1](http://localhost:3000/api/credit-score?user=1). User `1` has a credit score of 787; every other user has 536. The response contains the data, a signature over `[id, creditScore]`, and the public key that signed it.

## Keys

Without the `PRIVATE_KEY` environment variable the oracle signs with a built-in development key (public key `B62qphyUJg3TjMKi74T2rF8Yer5rQjBr1UyEG7Wg9XEYAHjaSiSqFv1`). The smart contract trusts a different key, so to use this oracle with the contract:

1. Generate a key pair: `npm run keygen`
2. Put the private key in `.env.local` (`PRIVATE_KEY=EK...`) or set it on the command line. Do not commit it.
3. Set `ORACLE_PUBLIC_KEY` in `../contracts/src/OracleExample.ts` to the public key.

Leave `NETWORK_KIND` unset or set to `testnet`. o1js `Signature.verify()` checks the devnet signature prefix only, so mainnet-prefixed signatures are rejected by the contract.

## Test

```sh
npm test
```

The tests in `test/` check the signing logic offline with o1js: the signature verifies for `[id, creditScore]`, it binds both values, a custom `PRIVATE_KEY` is honoured, and the demo oracle's published responses verify against the contract key. No server or network is needed.

## Deploy on Vercel

Deploy the directory as a Next.js project and set `PRIVATE_KEY` as a project environment variable.

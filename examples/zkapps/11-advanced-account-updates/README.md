# Tutorial 11: Advanced Account Updates

Worked example for [Tutorial 11: Advanced Account Updates](https://docs.minaprotocol.com/zkapps/tutorials/advanced-account-updates).

A token manager account approves every account update that uses its token.
This example has two token contracts that show how:

- `MyToken` (`src/MyToken.ts`) approves the deployment of a zkApp on one of
  its token accounts, and approves a transfer from that zkApp.
  `TokenUser` and `TokenHolder` (`src/TokenUser.ts`) are that zkApp: one
  address with a MINA account and a MyToken token account.
- `WrappedMina` (`src/WrappedMina.ts`) wraps MINA into a wMINA token and back,
  and keeps a total supply with a reducer.

Everything here runs against `Mina.LocalBlockchain`, so no network, no faucet
and no funded accounts are needed.

## Run it

```sh
npm install
npm start
```

`npm start` runs `src/main.ts` with proofs off. It finishes in less than a
minute.

```sh
npm run start:proofs
```

`npm run start:proofs` compiles the four contracts and makes real proofs. It
prints each step with the time since the start, so that you can see that it
is still running. It takes some minutes: see the tutorial for measured times.

## Test it

```sh
npm test
```

`src/MyToken.test.ts` and `src/WrappedMina.test.ts` run with proofs off. They
cover each contract method, and the transactions that the contracts or the
network must reject.

`src/AdvancedAccountUpdates.proofs.test.ts` compiles the contracts and makes
real proofs. It shows that the network rejects an approval from a different
contract at the token contract address, which a local blockchain with proofs
off does not check. It takes some minutes.

`src/FakeToken.ts` is used only by the tests.

## Requirements

Node 22 or later, which is what o1js 3 requires.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)

# Tutorial 6: Off-Chain Storage

Worked example for [Tutorial 6: Off-Chain Storage](https://docs.minaprotocol.com/zkapps/tutorials/offchain-storage).

A zkApp account holds eight field elements. `NumberStorageContract` keeps a map
and a counter beyond that, using the offchain state API in o1js: the data
travels as actions, a settlement proof folds them into a commitment, and only
the commitment lives on chain.

Everything runs against `Mina.LocalBlockchain`, so no network, no faucet and no
funded accounts are needed.

## Run it

```sh
npm install
npm start
```

`main.ts` writes a value, shows that it is not readable before settlement,
settles, reads it back, then updates it.

## Test it

```sh
npm test
```

The suite covers the properties the tutorial claims, including the two that are
easy to get wrong: a write is invisible until it is settled, and a settlement
drops an update that names a stale value instead of overwriting the newer one.

## Requirements

Node 22.19.5 or later, which is what o1js 3 requires.

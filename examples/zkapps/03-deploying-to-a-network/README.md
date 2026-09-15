# Tutorial 3: Deploy to a Live Network

Worked example for [Tutorial 3: Deploy to a Live Network](https://docs.minaprotocol.com/zkapps/tutorials/deploying-to-a-network).

The tutorial deploys to Devnet with the zkApp CLI, which needs a funded fee
payer and tMINA from the faucet. This example performs the same deployment
against `Mina.LocalBlockchain`, where the mechanics are visible and nothing has
to be funded: the account is created, the verification key is written to it, and
the permissions decide what may change it afterwards.

Proofs are enabled here, because a verification key means nothing without them.

## Run it

```sh
npm install
npm start
```

It prints the verification key hash from compilation, the same hash read back
off the deployed account, the permissions, the initial state, and what the fee
payer paid.

## Test it

```sh
npm test
```

The suite asserts what the tutorial's "Success" section claims: the account does
not exist beforehand, the deployment costs 1 MINA plus the fee, the verification
key on the account is the one compilation produced, `init()` ran, `editState`
requires a proof, a signed state change is refused, an update that breaks the
method's assertion is refused, and different contract code compiles to a
different verification key.

## Requirements

Node 22.19.5 or later, which is what o1js 3 requires.

# Tutorial 12: Cross-Contract Calls

Worked example for [Tutorial 12: Cross-Contract Calls](https://docs.minaprotocol.com/zkapps/tutorials/cross-contract-calls).

Three contracts call each other in one transaction:

- `Incrementer` adds 1 to a number and returns the result.
- `Adder` adds two numbers, then calls `Incrementer` to add 1 to the sum.
- `Caller` calls `Adder`, stores the result on chain, and emits it as an event.

Everything here runs against `Mina.LocalBlockchain`, so no network, no faucet
and no funded accounts are needed.

## Run it

```sh
npm install
npm start
```

`main.ts` deploys the three contracts, calls `Caller.callAddAndEmit(5, 6)`, and
prints the account update tree of the call, the sum on chain (`12`) and the
`sum` event.

## Test it

```sh
npm test
```

`src/CrossContractCalls.test.ts` runs with proofs off. It covers each method,
the return values, the account update tree, the event, and two rejected
transactions: a call to an address with no account, and a state change signed
with a key where the permissions require a proof.

`src/proofs.test.ts` compiles the contracts and makes real proofs. It shows
that a call to an address that holds a different contract is rejected, which a
local blockchain with proofs off does not check. It takes some minutes.

## Requirements

Node 22 or later, which is what o1js 3 requires.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)

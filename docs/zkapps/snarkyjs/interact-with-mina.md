---
title: Interacting With Mina
hide_title: true
description: How to create zero knowledge proofs and how users call zkApp methods. An account update can have proof, signature or none authorizations.
keywords:
  - smart contracts
  - zkapps
  - zkapp methods
  - zero knowledge proofs
  - zk proof
  - zk
  - snarkyjs
  - blockchain
  - transaction
  - mina
  - data structure
  - account updates
  - on-chain account
  - authorization types
---

:::info

zkApp programmability is not yet available on the Mina Mainnet. You can get started now by deploying zkApps to the Berkeley Testnet.

:::

# Interacting With Mina

## Transactions and account updates

Now that you have an idea about writing zkApp methods, it's time to learn how users can call these methods. Recall that smart contracts execute off-chain. The result of such an off-chain execution is a _transaction_, which can be sent to the Mina network to apply the changes made by the smart contract. In this section, you learn what a transaction looks like, and how you can create one.

The fundamental data structure that Mina transactions are built from is called an _account update_. An account update always contains updates to one specific on-chain account. For example, if you transfer MINA from one account to another, the balance on two accounts is updated – the sender and the receiver. Therefore, sending MINA requires two account updates. Account updates are a flexible and powerful data structure that can express all kinds of updates, events and preconditions that you use for developing smart contracts.

A _transaction_ is a JSON object of the form `{ feePayer, accountUpdates: [...], memo }`. Here, the `feePayer` is a special account update of slightly simpler structure. In particular, it contains a `fee` field which has to be used to specify the transaction fee. The `accountUpdates` array, on the other hand, is a list of normal account updates, which make up the bulk of the transaction. Finally, `memo` is an encoded string which can be used to attach an arbitrary short message. Ignore it for now.

You create transactions in SnarkyJS by calling `Mina.transaction(...)`, which takes the sender (a public key) and a callback that contains your transaction's logic.

```ts
const sender = PublicKey.fromBase58('B62..'); // the user address
const zkapp = new MyContract(address); // MyContract is a SmartContract

const tx = await Mina.transaction(sender, () => {
  zkapp.myMethod(someArgument);
});
```

In this example, the transaction consists of calling a single `SmartContract` method, called `myMethod`. You can inspect the transaction yourself by printing it out as JSON:

```ts
console.log(tx.toJSON());
```

If you try this, you see a massive JSON object with lots of fields, most of which are set to their default value. There's also a way to pretty-print transactions in a more human-readable, condensed format:

```ts
console.log(tx.toPretty());
```

Depending on the logic of `myMethod()`, this could print something like the following:

```ts
[
  {
    publicKey: '..VeLh',
    fee: '0',
    nonce: '0',
    authorization: '..EzRQ',
  },
  {
    label: 'MyContract.myMethod()',
    publicKey: '..Nq6w',
    update: { appState: '["1",null,null,null,null,null,null,null]' },
    preconditions: {
      account: '{"state":["0",null,null,null,null,null,null,null]}',
    },
    authorizationKind: 'Proof',
    authorization: undefined,
  },
];
```

From this output, there are several important things we can learn about transactions.

First of all, this is an array with two entries: the account updates that make up this transaction. The first one is always the fee payer, whose public key we passed in as `sender`. For the `fee`, which you didn't specify, SnarkyJS filled in 0; the `authorization` was filled with a dummy signature. In a user-facing zkApp, you typically don't care about setting those values – instead, you create a transaction like this, in the browser, and pass it on to the user's wallet. The wallet replaces your fee payer with one that represents the user account, with the user's settings for the fee. It would also fill the `authorization` field with a signature created from the user's private key. See [connecting your zkApp with a user's wallet](../how-to-write-a-zkapp-ui#connecting-your-zkapp-with-a-users-wallet).

The second account update in our list has a label: `'MyContract.myMethod()'` that tells you that it corresponds to the method call you performed. A `@method` call always results in the creation of an account update – namely, an update to the zkApp account itself. Other fields in this account update are:

- `publicKey` – the zkApp address (like other non-human-readable strings, this is truncated by `tx.toPretty()`)
- `update: { appState: [...] }` – shows how your method wants to update on-chain state, using `this.<state>.set()`. The names and pretty types you defined using `@state` are removed in this representation; instead, you see a raw list of 8 field elements, or `null` for state fields that aren't updated.
- `preconditions: { account: { state: [...] } }` – similar to the `update`, this has one entry per field of on-chain state. These are the preconditions that you created with `this.<state>.assertEquals()`. In this example, your transaction are accepted only if the first of the 8 state fields equals 0. The `null` values mean that there's no condition on the other 7 state fields.
- `authorizationKind: 'Proof'` – this means that this account update needs to be authorized with a proof. This is the default when you call a zkApp method, but not necessarily for other account updates.
- `authorization: undefined` – the proof that's needed on this update isn't there yet! You learn how to add it in a minute.

Note that there a many more fields that account updates can have, but `tx.toPretty()` only prints the ones that have actual content. Also, the ones above may be missing: For example, if our zkApp doesn't set any state, the `update` field might be missing. In that case, strictly speaking it wouldn't always be an "update" in the sense that the account is modified. The term "account update" is used for simplicity.

As you might have noticed, these account updates weren't created in a very explicit manner. Instead, SnarkyJS gives you an imperative API, with "commands" like `state.set()`. Under the hood, these commands create and modify account updates in a transaction, like you saw above. In the end, the entire transaction is sent to the network, as one atomic update. If something fails – for example, one of the account updates has insufficient authorization – the _entire_ transaction is rejected and doesn't get applied. This is in contrast to an EVM contract, where the initial steps of a method call could succeed even if the method fails at a later step.

## Creating proofs and what they mean

Let's finally see how to create zero-knowledge proofs!

```ts
await MyContract.compile(); // this might take a while

// ...

const tx = await Mina.transaction(sender, () => {
  zkapp.myMethod(someArgument);
});
await tx.prove(); // this might take a while
```

There are two new operations here:

- `MyContract.compile()` creates prover and verification keys from your smart contract.[^1] You need to do this before you can create any proofs!
- `tx.prove()` goes through your transaction, and creates proofs for all the account updates that came from method calls.

[^1]: The name `compile()` is a metaphor for what this function does: creating prover and verifier functions from your code. It doesn't refer to literal "compilation" of JS into a circuit representation. The circuit representation of your code is created by _executing_ it, not by compiling it. Also, the prover function still includes the execution of your JS code as one step.

Both of these are heavy cryptographic operations and can take between a few seconds and a few minutes, depending on the amount of logic you're proving and on how fast your machine is. If you print the transaction again with `tx.toPretty()`, it now has the proof as a base64 string inside the `authorization` field:

```ts
[
  // ...
  {
    label: 'MyContract.myMethod()',
    // ...
    authorization: { proof: '..KSkp' },
  },
];
```

You might wonder: what, exactly, is proved here? How is the proof linked to the account update it is part of?

The proof attests to two different things:

- The execution of `myMethod()`
- The public input of that execution

Recall that all method arguments are _private inputs_. So, the verifier doesn't get to see them, and the proof doesn't say anything about them (it only says that there were _some_ private inputs that satisfied all constraints). However, a zk proof can also have a public input. In the case of zkApps, **the public input is the account update**. It is passed in implicitly when you do `tx.prove()`. The prover function (i.e., your smart contract logic) creates its own account update and constrains it to equal the public input.

You can think of the public input as data that is shared between the prover and verifier. The verifier passes in the public input when verifying it, and the proof is valid only if it was created with _the same public input_. This means that this proof attests to the validity of exactly this account update. If you change the account update before sending it to the Mina network, the proof is no longer not be valid. In other words: The only valid account updates for a zkApp account are the ones created according to the logic of your `SmartContract`. This is the core of why we can have smart contracts that execute on the client side.

## Payments and more on public inputs

To continue the discussion of account updatess, this example is important on its own: Paying out MINA from a zkApp. To send MINA, you can use `this.send()` from your smart contract method:

```ts
class MyContract extends SmartContract {
  @method payout(amount: UInt64) {
    // TODO: logic that determines whether the user is allowed to claim this amount

    this.send({ to: this.sender, amount });
  }
}
```

This simple example `@method payout()` can be called by anyone to send a given amount of nanoMINA to themselves. Note that you get the sender of the transaction with `this.sender`. In a real zkApp, you add conditions that are checked in this method to determining who can call it with which amounts. To call this method in a transaction and print out the result:

```ts
const MINA = 1e9;

const tx = await Mina.transaction(sender, () => {
  zkapp.payout(UInt64.from(5 * MINA));
});
await tx.prove();
console.log(tx.toPretty());
```

:::info

MINA amounts, in all SnarkyJS APIs and elsewhere in the protocol, are always denominated in nanoMINA = `10^(-9)` MINA. This is why we set `const MINA = 1e9`.

:::

What's interesting is that the transaction now has 3 account updates:

```ts
[
  {
    // fee payer
  },
  {
    label: 'MyContract.payout()',
    publicKey: '..Nq6w',
    balanceChange: { magnitude: '5000000000', sgn: 'Negative' },
    authorizationKind: 'Proof',
    authorization: { proof: '..KSkp' },
  },
  {
    publicKey: '..VeLh',
    balanceChange: { magnitude: '5000000000', sgn: 'Positive' },
    callDepth: 1,
    caller: '..umxw',
    authorizationKind: 'None_given',
  },
];
```

The zkApp update with label `'MyContract.payout()'` has a negative `balanceChange` of 5 billion (= 5 MINA). This makes sense, because you are sending MINA away from the zkApp account.
Then, there's an additional account update, with a corresponding positive balance change – the user account that receives MINA.

Two quick observations:

- You didn't explicitly create the receiver account update. It was created, and attached to the transaction, by calling `this.send()`. SnarkyJS tries to abstract away the low-level language of account updates where possible and give you intuitive commands to create the right ones. However, you might sometimes have to create account updates explicitly.
- The user update has `authorizationKind: 'None_given'`. That means it's not authorized. This is possible because it doesn't include any changes that require authorization: It just receives MINA, and you're able to send someone MINA without their permission.

In general, there are three kinds of authorizations that an account update can have: a proof, a signature, or none. We'll learn about signatures in the next section.

<!-- TODO: link to permission section when it exists -->

Next, we observe that the user account update has a `callDepth: 1` and a non-default `caller` field. We won't explain this in detail, but it has to do with the fact that it was created from within a zkApp call. Account updates, even though displayed as a flat list here, are implicitly structured as a _list of trees_. Updates with a call depth of 1 or higher are child nodes of another update in that list of trees. In our case, the zkApp (sender) account update is at the top level (`callDepth: 0`) and the user (receiver) account update is a child of it.

So, what is the meaning of this tree structure? Recall that in the last section, we explained how the zkApp account update is public input to its proof. Now, the fully general version of that statement is:
**In a tree of account updates, all nodes are public inputs to the proof of the root node.** (If there is such a proof. This also holds for sub-trees of each tree.)

<!-- TODO: _ideal_ here would be a little picture of a tree, with a parent and a child node -->

Concretely, in our example, both the zkApp account update and the user account update are public input to the zkApp method call. Intuitively, being public input means that the zkApp can "see" and constrain the update as part of its proof. Here, it means that nobody could change the public key of the receiver, or amount they receive, without making the proof invalid. The update can only contain what the method specified.

All of this is true because `this.send()`, under the hood, placed the receiver update at call depth 1, under the zkApp update. As a counter-example: The fee payer is never part of the public input. It can be anything without affecting the validity of the proof.

A key takeaway is: If you want something to become part of your proof, you have to put it inside your `@method`.

<!-- TODO: This section got a bit long, so I commented out the content below. It educates about a frequent gotcha, but it's too much at this point and could live in some tutorial / deep-dive later -->

<!--
Let's try to mess around a bit, and see what happens if we move `.send()` _outside_ the `payout()` method, into the `Mina.transaction` callback:

```ts
class MyContract extends SmartContract {
  @method payout(amount: UInt64) {
    // this.send({ to: this.sender, amount }); // commented this out, placed it below
  }
}

// ...

const tx = await Mina.transaction(sender, () => {
  let amount = UInt64.from(5n * MINA);
  zkapp.payout(amount);
  zkapp.send({ to: sender, amount }); // here
});
await tx.prove();
```

If you run this, you'll see an error:

```
Error when proving MyContract.payout()
...
```

This error comes about as follows:

- The logic that's proven is what's contained in your method -- `payout()`
- The method doesn't contain the `this.send()` command, which is therefore not reflected in the account updates the method creates
- The actual account updates in your transaction do reflect the `send()` command
- The actual account updates are passed into your method prover as public input
- The method prover compares that public input to the account updates it itself creates (which makes them sort of a "public output")
- That comparison check fails, because the two sets of account updates are different
-->

## Signing transactions and explicit account updates

Let's recap: We have explained how to write a SmartContract. We've seen how to create a transaction which calls that contract, and how the transaction consists of account updates which were created by SnarkyJS under the hood. Now, we'll see an example of creating an account update explicitly. We'll also learn how to use signatures, for authorizing updates to user accounts.

We continue the payment topic of last section, where we paid out MINA from a zkApp. This time, we go the other direction: make a deposit from the user into the zkApp. Payments made from a user account will require a signature by the user. Here's the smart contract code:

```ts
class MyContract extends SmartContract {
  @method deposit(amount: UInt64) {
    let senderUpdate = AccountUpdate.create(this.sender);
    senderUpdate.requireSignature();
    senderUpdate.send({ to: this, amount });

    // TODO: logic that gives the user something in return for the deposit
  }
}
```

Let's unpack what happens here. The first line of our method creates a new, empty account update for the sender account:

```ts
let senderUpdate = AccountUpdate.create(this.sender);
```

`AccountUpdate` is the class in SnarkyJS that represents account udpates. `AccountUpdate.create()` not only instantiates this class, but also attaches the update to the current transaction, at the same level where `create` is called. If it is called inside a `@method`, the `AccountUpdate` is created as a child (public input) of the zkApp update.

The next line tells SnarkyJS that this update will be authorized with a signature:

```ts
senderUpdate.requireSignature();
```

We'll get into this later. We also could've used a shortcut which does both `AccountUpdate.create()` and `requireSignature()` in one command:

```ts
let senderUpdate = AccountUpdate.createSigned(this.sender); // create + requireSignature
```

Finally, we use `.send()` on the sender `AccountUpdate` to deposit into the zkApp, which has the same API as `this.send()`:

```ts
senderUpdate.send({ to: this, amount });
```

Note that instead of an address as the `to` field, we pass in `this`, which is a `SmartContract`. This is done so that `.send()` doesn't create an additional update, but uses the one that's already created for our zkApp.

If we create a transaction for calling this method like before, it looks like this:

```ts
[
  {
    // fee payer
  },
  {
    label: 'MyContract.deposit()',
    balanceChange: { magnitude: '5000000000', sgn: 'Positive' },
    // ...
  },
  {
    publicKey: '..VeLh',
    balanceChange: { magnitude: '5000000000', sgn: 'Negative' },
    callDepth: 1,
    useFullCommitment: true,
    caller: '..umxw',
    authorizationKind: 'Signature',
    authorization: undefined,
  },
];
```

The third account update is the one we created with `AccountUpdate.create()`. Two changes to it were caused by calling `requireSignature()`:

- `useFullCommitment: true`, which we won't explain here but has to do with replay protection if you're using signatures.
- `authorizationKind: 'Signature'`

Finally, `authorization: undefined` indicates that we didn't provide the signature yet.

In a user-facing zkApp, user signatures will typically be added by a wallet, not within SnarkyJS. In that case, the missing signature is fine. However, for testing and calling zkApps via node, you need to add the signatures yourself. The command to do that is `tx.sign([...privateKeys])`, called after `Mina.transaction` on the finished transaction. Here's an example:

```ts
const sender = senderPrivateKey.toPublicKey(); // public key from sender's private key

const tx = await Mina.transaction(sender, () => {
  zkapp.deposit(UInt64.from(5 * MINA));
});
await tx.prove();

tx.sign([senderPrivateKey]); // senderKey is a PrivateKey
```

The example first shows us how we can derive the sender's public key `sender` from its private key `senderPrivateKey`.

Note that `.sign()` takes an array, so you could provide multiple private keys for signing. `.sign()` will go through the transaction and add signatures on all account updates which 1) need a signature and 2) whose public key matches one of the private keys that were provided. In the example above, two account updates are signed with `tx.sign()`: The fee payer and the depositor account update. Both have the `sender` public key on them, which matches `senderPrivateKey.toPublicKey()`.

:::note

SnarkyJS allows you to load and store private and public keys in base58 format. Here's how the sender private key might be created in a script:

```ts
const senderPrivateKey = PrivateKey.fromBase58('EKEQc95...');
```

In a real server-side deployment, you probably want to load keys from a file or environment variable, instead of hard-coding them in your source code.
:::

To summarize, there are three types of authorization that account updates can have, which are typically used in different circumstances:

- Proof authorization – used for zkApp accounts when you do a `@method` call. Proofs are verified against the on-chain verification key.
- Signature authorization – used to update user accounts. Signatures are verified against the account's public key.
- No authorization – used on updates which don't require authorization, for example positive balance changes.

The list above just reflects common defaults. The full source of truth is given by the _account permissions_, see [Permissions](./permissions). Using permissions, account owners can decide on a fine-grained level which type of authorization is required on which kinds of updates.

## Sending transactions

The final step of creating a transaction is sending it to the network. Like signing, in a user-facing zkApp this is usually handled by a wallet. But you need to know how to do it yourself for testing and scripting.

To send a transaction, we need to specify what network we're interacting with. This is done by specifying a "Mina instance" at the beginning of your script:

```ts
const Network = Mina.Network('https://example.com/graphql');
Mina.setActiveInstance(Network);
```

The network URL has to be a GraphQL endpoint which exposes a compatible GraphQL API. This URL will not only determine where transactions are sent, but also where SnarkyJS gets account information from, when _creating_ transactions. For example, when you do something like `this.<state>.get()` in your smart contract, the Mina instance is asked for the account using `Mina.getAccount`, which in turn will cause the account to be fetched from the GraphQL endpoint.

To send a transaction, create it as before and then use `tx.send()`:

```ts
// set Mina instance
const Network = Mina.Network('https://example.com/graphql');
Mina.setActiveInstance(Network);

// create the transaction, add proofs and signatures
const tx = await Mina.transaction(sender, () => {
  // ...
});
await tx.prove();
tx.sign([senderPrivateKey]);

// send transaction
await tx.send();
```

The output of `tx.send()` can be used to wait for inclusion of this transaction in a block, and to get the transaction hash (which lets you look up the pending transaction on a block explorer):

```ts
// send transaction, log transaction hash
let pendingTx = await tx.send();
console.log(`Got pending transaction with hash ${pendingTx.hash()}`);

// wait until transaction is included in a block
await pendingTx.wait();

// our account updates are applied on chain!
```

Apart from `Mina.Metwork`, you can also use a mocked "Mina instance" for local testing:

```ts
const Local = Mina.LocalBlockchain();
Mina.setActiveInstance(Local);
```

Doing this means setting up a fresh, local ledger, which is pre-filled with a couple of accounts with funds on them that you have access to. "Sending" a transaction here just means applying your account updates to that local Mina instance. This is helpful for testing, especially because account updates go through the same validation logic locally that they would on-chain.[^2]

[^2]: Fun fact: `LocalBlockchain` literally uses the same OCaml code for transaction validation and application that the Mina node uses; it's compiled to JS with [js_of_ocaml](https://github.com/ocsigen/js_of_ocaml).

<!-- TODO commenting this out as it overlaps with the testing section

Everything else works the same locally as it would when interaction with a real network. You still need to properly sign your transactions and attach proofs, and then send them with `tx.send()` to apply them locally.

To help you iterate quicker when testing, there's an option to disable proof creation: `Mina.LocalBlockchain({ proofsEnabled: false })`. You can use it like this:

```ts
// local mock Mina instance
const proofsEnabled = false;
const Local = Mina.LocalBlockchain({ proofsEnabled });
Mina.setActiveInstance(Local);

// only need to compile smart contract when proofs are enabled
if (proofsEnabled) await MyContract.compile();

const tx = await Mina.transaction(sender, () => {
  // ...
});
await tx.prove();
tx.sign([senderKey]);

await tx.send();

// our accounts updates are applied locally!
```

Note that with `proofsEnabled: false`, you still need to call `await tx.prove()`. The only change is that `.prove()` creates a dummy proof instead of a real one, and runs in 0 seconds. Also, `tx.send()` will skip the usual step of verifying your proof. -->

You can learn more about testing in [How to test your zkApp](../how-to-test-a-zkapp).

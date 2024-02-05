---
title: Smart contracts
hide_title: true
description: How to create and interact with a smart contract. How to prove an on-chain value. Learn about the public state of a zkApp and private method parameters.
keywords:
  - smart contracts
  - zkapps
  - zero knowledge proof programming
  - zk proof
  - zk
  - zkapp account
  - o1js
  - blockchain
  - mina
  - typescript
  - public input
  - private input
  - on-chain state
---

:::info

The maximum number of zkApp transactions per block is currently capped at 24. This restriction will gradually be lifted following the mainnet upgrade.

:::

# Smart Contracts

<!-- TODOs
  IMO, needs to be fleshed out a bit more before sending users to "test your zkApp" or "advanced topics".
  Basics that are missing:
  * payments
  * Mina.transaction / at least hinting at the basic mechanics of how to compile / prove
  * the general notion of a transaction / of an account update (party)?
  * permissions? (probably an advanced topic)
 -->

Now that we have covered the basics of writing o1js programs, let's see how to create a smart contract.

If you haven't yet read [how zkApps work](../how-zkapps-work), please read it first to build your foundational knowledge.

## SmartContract

Smart contracts are written by extending the base class `SmartContract`:

```ts
class HelloWorld extends SmartContract {}
```

The `constructor` of a `SmartContract` is inherited from the base class and should not be overriden.
It takes the zkApp account address (a public key) as its only argument:

```ts
let zkAppKey = PrivateKey.random();
let zkAppAddress = PublicKey.fromPrivateKey(zkAppKey);

let zkApp = new HelloWorld(zkAppAddress);
```

Later, you learn how to deploy a smart contract to an on-chain account.

:::note
On Mina, there is no strong distinction between normal "user accounts" and
"zkApp accounts". A zkApp account is just a normal account that has a smart
contract deployed to it – which essentially just means there's a verification
key stored on the account, which can verify zero-knowledge proofs generated
with the smart contract.
:::

## Methods

Interaction with a smart contract happens by calling one or more of its _methods_. You declare methods using the `@method` decorator:

```ts
class HelloWorld extends SmartContract {
  @method myMethod(x: Field) {
    x.mul(2).assertEquals(5);
  }
}
```

Within a method, you can use o1js data types and methods to define your custom logic.

Later, you learn how you can...

- run a method (off-chain)
- create a proof that it executed successfully
- send that proof to the Mina network, to trigger actions like a state change or payment

To get an idea what "successful execution" means, look at this line in our example above:

```ts
x.mul(2).assertEquals(5);
```

Creating a proof for this method is be possible only if the input `x` satisfies the equation `x * 2 === 5`. This is called a "constraint".
Magically, the proof can be checked without seeing `x` – it's a _private input_.

The method above is not very meaningful yet. To make it more interesting, you need a way to interact with accounts, and record state on-chain.
Check out the next section for more on that!

One more note about private inputs: The method above has one input parameter, `x` of type `Field`. In general, arguments can be any of the built-in o1js type that you saw: `Bool`, `UInt64`, `PrivateKey`, etc. From now on, those types are referred to as [structs`](#custom-data-types).

<!-- TODO Gregor's note on the below alert box: too much? too early? I think little "deep dives" like this can be useful to answer questions that more advanced users often have after reading our docs, and spread more understanding of Mina to the internet
-->

:::info

Under the hood, every `@method` defines a zk-SNARK circuit. From the cryptography standpoint, a smart contract is a collection of circuits, all of which are compiled into a single prover & verification key. The proof says something to the effect of "I ran one of these methods, with some private input, and it produced this particular set of account updates". In ZKP terms, the account updates are the _public input_. The proof will only be accepted on the network if it verifies against the verification key stored in the account. This ensures that indeed, the same code that the zkApp developer wrote also ran on the user's device – thus, the account updates conform to the smart contract's rules.

:::

<!-- TODO: create at least a basic section about zk circuits below this subsection which contains (among other things) a more thourough explanation of what this tip hints at -->

:::tip

You will find that inside a `@method`, things sometimes behave a little differently. For example, the following code can't be used in a method where `x: Field` is an input parameter:

```ts
console.log(x.toString()); // don't do this inside a `@method`! 😬
```

This doesn't work because, when we compile the SmartContract into prover and verification keys, we will run your method in an environment where the method inputs don't have any concrete values attached to them. They are like mathematical variables `x`, `y`, `z` which are used to build up abstract computations like `x^2 + y^2`, just by running your method code.

Therefore, when executing your code and trying to read the value of `x` to turn it into a string via `x.toString()`, it will blow up because such a value can't be found. On the other hand, during proof generation all the variables _have_ actual values attached to them (cryptographers call them "witnesses"); and it makes perfect sense to want to log these values for debugging.
This is why we have a special function for logging stuff from inside your method:

```ts
Provable.log(x);
```

The API is like that of `console.log`, but it will automatically handle printing o1js data types in a nice format. During SmartContract compilation, it will simply do nothing.
:::

## On-chain state

A smart contract can contain **on-chain state**, which is declared as a property
on the class with the `@state` decorator:

```ts
class HelloWorld extends SmartContract {
  @state(Field) x = State<Field>();

  // ...
}
```

Here, `x` is of type `Field`. Like with method inputs, only o1js structs can be used for state variables.
In the current design, the state can consist of at most 8 Fields of 32 bytes each. These states are stored on the zkApp account.
Some structs take up more than one Field: for example, a `PublicKey` needs 2 of the 8 Fields.
States are initialized with the `State()` function.

A method can modify on-chain state by using `this.<state>.set()`:

```ts
class HelloWorld extends SmartContract {
  @state(Field) x = State<Field>();

  @method setX(x: Field) {
    this.x.set(x);
  }
}
```

As a zkApp developer, if you add this method to your smart contract, you are saying: "Anyone can call this method, to set `x` on the account to any value they want."

## Reading state

Often, we also want to _read_ state – check out this example:

```ts
class HelloWorld extends SmartContract {
  @state(Field) x = State<Field>();

  @method increment() {
    // read state
    const x = this.x.get();
    this.x.requireEquals(x);

    // write state
    this.x.set(x.add(1));
  }
}
```

The `increment()` method fetches the current on-chain state `x` with `this.x.get()`.
Later, it sets the new state to `x + 1` using `this.x.set()`. Simple!

There's another line though, which looks weird at first:

```ts
this.x.requireEquals(x);
```

To understand it, we have to take a step back, and understand what it means to "use an on-chain value" during off-chain execution.

For sure, when we use an on-chain value, we have to _prove_ that this is the on-chain value. Verification has to fail if it's a different value! Otherwise, a malicious user could modify o1js and make it just use any other value than the current on-chain state – breaking our zkApp.

To prevent that, we link "`x` at proving time" to be the same as "`x` at verification time". We call this a _precondition_ – a condition that is checked by the verifier (a Mina node) when it receives the proof in a transaction. This is what `this.x.requireEquals(x)` does: it adds the precondition that `this.x` – the on-chain state at verification time – has to equal `x` – the value we fetched from the chain on the client-side. In zkSNARK language, `x` becomes part of the public input.

Side note: `this.<state>.requireEquals` is more flexible than equating with the current value. For example, `this.x.requireEquals(10)` fixes the on-chain `x` to the number `10`.

:::note

Why didn't we just make `this.x.get()` add the precondition, automatically, so that you didn't have to write `this.x.requireEquals(x)`?
Well, we like to keep things explicit. The assertion reminds us that we add logic which can make the proof fail: If `x` isn't the same at verification time, the transaction will be rejected. So, reading on-chain values has to be done with care if many users are supposed to read and update state concurrently. It is applicable in some situations, but might cause races, and call for workarounds, in other situations.
One such workaround is the use of actions – see [Actions and Reducer](./actions-and-reducer).

:::

## Assertions

<!-- TODO: this is _slightly_ misplaced now, because I already had assertEquals earlier -->

Let's modify the `increment()` method to accept a parameter:

```ts
class HelloWorld extends SmartContract {
  @state(Field) x = State<Field>();

  @method increment(xPlus1: Field) {
    const x = this.x.get();
    this.x.requireEquals(x);

    x.add(1).assertEquals(xPlus1);

    this.x.set(xPlus1);
  }
}
```

Here, after obtaining the current state `x` and asserting that it equals the on-chain value, we make another assertion:

```ts
x.add(1).assertEquals(xPlus1);
```

If the assertion fails, o1js will throw an error and not submit the transaction.
On the other hand, if it succeeds, it becomes part of the proof that is verified on-chain.

Because of this, our new version of `increment()` is _guaranteed_ to behave like the previous version: It can only ever
update the state `x` to `x + 1`.

:::tip
You can add optional failure messages to assertions, to make debugging easier. For example, the above example could be written as:

```ts
x.add(1).assertEquals(xPlus1, 'x + 1 should equal xPlus1');
```

:::

Assertions can be incredibly useful to constrain state updates. Common assertions you may use are:

<!-- prettier-ignore -->
```ts
x.assertEquals(y); // x = y
x.assertBoolean(); // x = 0 or x = 1
x.assertLt(y);     // x < y
x.assertLte(y);    // x <= y
x.assertGt(y);     // x > y
x.assertGte(y);    // x >= y
```

For a full list, see the [o1js reference](../o1js-reference).

## Public and private inputs

While the state of a zkApp is **public**, method parameters are **private**.

When a smart contract method is called, the proof it produces uses zero-knowledge to hide inputs and details of the computation.

The only way method parameters can be exposed is when the computation explicitly exposes them, as
in the last example where the input was directly stored in the public state: `this.x.set(xPlus1);`

For example where this is not the case, define a new method called `incrementSecret()`:

```ts
class HelloWorld extends SmartContract {
  @state(Field) x = State<Field>();

  // ...

  @method incrementSecret(secret: Field) {
    const x = this.x.get();
    this.x.requireEquals(x);

    Poseidon.hash(secret).assertEquals(x);
    this.x.set(Poseidon.hash(secret.add(1)));
  }
}
```

This time, the input is called `secret`. Check that the hash of the secret is equal to the current state `x`.
If this is the case, add 1 to the secret and set `x` to the hash of that.

When running this successfully, it just proves that the code was run with _some_ input `secret` whose hash is `x`,
and that the new `x` is set to `hash(secret + 1)`.
However, the secret itself remains private, because it can't be deduced from its hash.

## Initializing state

You initialize on-chain state in the `init()` method.

Like the constructor, `init()` is predefined on the base `SmartContract` class.
It is called when you deploy your zkApp with the zkApp CLI, for the first time. It won't be called if you upgrade your contract and deploy a second time.
You can override this method to add initialization of your on-chain state:

```ts
class HelloWorld extends SmartContract {
  @state(Field) x = State<Field>();

  init() {
    super.init();
    this.x.set(Field(10)); // initial state
  }
}
```

You must call `super.init()` to set your entire state to 0.

If you don't have any state to initialize to values other than 0, then there's no need to override `init()`, you can just leave it out.
The previous example set the state `x` to `Field(10)`.

## Composing zkApps

A powerful feature of zkApps is that they are composable, just like Ethereum smart contracts. You can simply call smart contract methods from other smart contract methods:

```ts
class HelloWorld extends SmartContract {
  @method myMethod(otherAddress: PublicKey) {
    const calledContract = new OtherContract(otherAddress);
    calledContract.otherMethod();
  }
}

class OtherContract extends SmartContract {
  @method otherMethod() {}
}
```

When a user calls `HelloWorld.myMethod()`, o1js creates two separate proofs — one for the execution of `myMethod()` as usual, and a _separate_ proof for the execution of `OtherContract.otherMethod()`.

The `myMethod()` proof:

- Computes an appropriate hash of the function signature of `otherMethod()` plus any arguments and return values of that function call.
- Guarantees that this hash matches the `callData` field on the account update produced by `otherMethod()` that is made part of `myMethod()`'s public input.

Therefore, when you calling another zkApp method, you effectively prove: "I called a method with this name, on this zkApp account, with this particular arguments and return value."

To ensure other methods can use a return value of your `@method`, you must annotate the return value in your TypeScript function signature.

Here's an example of returning a `Bool` called `isSuccess`:

```ts
@method otherMethod(): Bool { // annotated return type
  // ...
  return isSuccess;
}
```

## Custom data types

Smart contract method arguments can be any of the built-in o1js types.

However, what if you want to define your own data type?

You can create a custom data type for your smart contract using the `Struct` function that o1js exposes. To do this, create a class that extends `Struct({ })`.
Then, inside the object `{ }`, define the fields that you want to use in your custom data type.

For example, if you want to create a custom data type called `Point` to represent a 2D point on a grid. The `Point` struct has no instance methods and is used only to hold information about the `x` and `y` points.
You can create a Point class by creating a new class that extends the `Struct` class:

```ts
class Point extends Struct({
  x: Field,
  y: Field,
}) {}
```

Now that you have defined your Struct, you can use it in your smart contract for any o1js built-in types.

For example, the following smart contract uses the `Point` Struct defined above as state and as a method argument:

```ts
export class Grid extends SmartContract {
  @state(Point) p = State<Point>();

  @method init() {
    this.p.set(new Point({ x: Field(1), y: Field(2) }));
  }

  @method move(newPoint: Point) {
    const point = this.p.get();
    this.p.requireEquals(point);

    const newX = point.x.add(newPoint.x);
    const newY = point.y.add(newPoint.y);

    this.p.set(new Point({ x: newX, y: newY }));
  }
}
```

Note that your Structs can contain o1js built-in types like `Field`, `Bool`, `UInt64`, etc or even other custom types that you've defined which are based on the `Struct` class.
This allows for great composability and reusability of structs.

---
title: o1js Basic Concepts
hide_title: true
sidebar_label: Basic Concepts
description: Field elements are the basic unit of data in zero knowledge proof programming. Learn about built-in data types, functions, and common methods.
keywords:
  - smart contracts
  - zkapps
  - fields
  - field elements
  - zero knowledge proof programming
  - zk proof
  - zk
  - data types
  - o1js
  - blockchain
  - mina
  - typescript
  - methods
pagination_prev: zkapps/o1js/index
---

# o1js Basic Concepts

o1js is a TypeScript (TS) library for writing general-purpose zero knowledge (zk) programs and writing zk smart contracts for Mina.

## Field

Field elements are the basic unit of data in zero knowledge proof programming. Each field element can store a number up to almost 256 bits in size. You can think of a field element as a `uint256` in Solidity.

:::note

For the cryptography inclined, the exact max value that a field can store is: 28,948,022,309,329,048,855,892,746,252,171,976,963,363,056,481,941,560,715,954,676,764,349,967,630,336.

:::

For example, in typical programming, you might use:

`const sum = 1 + 3`.

In o1js, you write this as:

`const sum = new Field(1).add(new Field(3))`

This can be simplified as:

`const sum = new Field(1).add(3)`

Note that the `3` is auto-promoted to a field type to make this cleaner.

## Built-in data types

Some common data types you may use are:

<!-- prettier-ignore -->
```ts
new Bool(x);   // accepts true or false
new Field(x);  // accepts an integer, or a numeric string if you want to represent a number greater than JavaScript can represent but within the max value that a field can store.
new UInt64(x); // accepts a Field - useful for constraining numbers to 64 bits
new UInt32(x); // accepts a Field - useful for constraining numbers to 32 bits

PrivateKey, PublicKey, Signature; // useful for accounts and signing
new Group(x, y); // a point on our elliptic curve, accepts two Fields/numbers/strings
Scalar; // the corresponding scalar field (different than Field)

CircuitString.from('some string'); // string of max length 128
```

In the case of `Field` and `Bool`, you can also call the constructor without `new`:

```ts
let x = Field(10);
let b = Bool(true);
```

## Conditionals

Traditional conditional statements are not supported by o1js:

```ts
// this will NOT work
if (foo) {
  x.assertEquals(y);
}
```

Instead, use the o1js built-in `Circuit.if()` method, which is a ternary operator:

```ts
const x = Circuit.if(new Bool(foo), a, b); // behaves like `foo ? a : b`
```

## Functions

Functions work as you would expect in TypeScript. For example:

```ts
function addOneAndDouble(x: Field): Field {
  return x.add(1).mul(2);
}
```

## Common methods

Some frequently used common methods are:

```ts
let x = new Field(4); // x = 4
x = x.add(3); // x = 7
x = x.sub(1); // x = 6
x = x.mul(3); // x = 18
x = x.div(2); // x = 9
x = x.square(); // x = 81
x = x.sqrt(); // x = -9

let b = x.equals(8); // b = Bool(false)
b = x.greaterThan(8); // b = Bool(true)
b = b.not().or(b).and(b); // b = Bool(true)
b.toBoolean(); // true

let hash = Poseidon.hash([x]); // takes array of Fields, returns Field

let privKey = PrivateKey.random(); // create a private key
let pubKey = PublicKey.fromPrivateKey(privKey); // derive public key
let msg = [hash];
let sig = Signature.create(privKey, msg); // sign a message
sig.verify(pubKey, msg); // Bool(true)
```

For a full list, see the [o1js reference](../o1js-reference).

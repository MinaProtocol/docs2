---
title: Introduction to o1js
hide_title: true
sidebar_label: Introduction
description: o1js is a general-purpose zk framework with the tools to create zk proofs. o1js is a TypeScript library for writing general-purpose zk programs and writing zk smart contracts for Mina.
keywords:
  - smart contracts
  - zkapps
  - zero knowledge proof programming
  - zk proof
  - zk
  - mina 
  - data types
  - what is o1js
  - blockchain
  - mina
  - typescript
  - typescript library
---

# Introduction to o1js

o1js, fka. SnarkyJS, is a TypeScript (TS) library for:

- Writing general-purpose zk programs
- Writing zk smart contracts for Mina

This is TS code that you might write when using o1js:

```ts
import { Field, Poseidon } from 'o1js';

function knowsPreimage(preimage: Field) {
  let hash = Poseidon.hash([preimage]);
  hash.assertEquals(expectedHash);
}

const expectedHash =
  Field(0x1d444102d9e8da6d566467defcc446e8c1c3a3616d059facadbfd674afbc37ecn);
```

In a zkApp, this code can be used to prove that you know a secret value whose hash is publicly known without revealing the secret.
The code is plain TypeScript (TS) and is executed as normal TS. You might call o1js an _embedded domain-specific language (DSL)_.

o1js provides data types and methods that are _provable_: You can prove their execution. 

In the previous example code, `Poseidon.hash()` and `Field.assertEquals()` are examples of provable method. Proofs are _zero-knowledge_, because they can be verified without learning their inputs and execution trace. Selected parts of the proof can be made public, if it suits your application.

o1js is a general-purpose zk framework that gives you the tools to create zk proofs. It lets you write arbitrary zk programs leveraging a rich set of built-in provable operations, like basic arithmetic, hashing, signatures, boolean operations, comparisons, and more. Use the o1js framework to write zkApps on Mina, smart contracts that execute client-side and have private inputs.

All of the o1js framework is packaged as a single TS library that can be used in major web browsers and Node.js. The best way to get started with o1js is [using the zkApp CLI](./how-to-write-a-zkapp). You can also install o1js from npm with `npm i o1js`.

Start your o1js journey by learning about [basic zk programming concepts](./o1js/basic-concepts).

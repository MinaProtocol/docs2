[o1js](../README.md) / [Modules](../modules.md) / Mina

# Namespace: Mina

## Table of contents

### Interfaces

- [TransactionId](../interfaces/Mina.TransactionId.md)

### Type Aliases

- [ActionStates](Mina.md#actionstates)
- [CurrentTransaction](Mina.md#currenttransaction)
- [FeePayerSpec](Mina.md#feepayerspec)
- [NetworkConstants](Mina.md#networkconstants)
- [Transaction](Mina.md#transaction)

### Variables

- [Transaction](Mina.md#transaction-1)
- [activeInstance](Mina.md#activeinstance)

### Functions

- [BerkeleyQANet](Mina.md#berkeleyqanet)
- [LocalBlockchain](Mina.md#localblockchain)
- [Network](Mina.md#network)
- [accountCreationFee](Mina.md#accountcreationfee)
- [createTransaction](Mina.md#createtransaction)
- [currentSlot](Mina.md#currentslot)
- [currentTransaction](Mina.md#currenttransaction-1)
- [faucet](Mina.md#faucet)
- [fetchActions](Mina.md#fetchactions)
- [fetchEvents](Mina.md#fetchevents)
- [filterGroups](Mina.md#filtergroups)
- [getAccount](Mina.md#getaccount)
- [getActions](Mina.md#getactions)
- [getBalance](Mina.md#getbalance)
- [getNetworkConstants](Mina.md#getnetworkconstants)
- [getNetworkId](Mina.md#getnetworkid)
- [getNetworkState](Mina.md#getnetworkstate)
- [getProofsEnabled](Mina.md#getproofsenabled)
- [hasAccount](Mina.md#hasaccount)
- [sendTransaction](Mina.md#sendtransaction)
- [sender](Mina.md#sender)
- [setActiveInstance](Mina.md#setactiveinstance)
- [transaction](Mina.md#transaction-2)
- [waitForFunding](Mina.md#waitforfunding)

## Type Aliases

### ActionStates

Ƭ **ActionStates**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `endActionState?` | [`Field`](../modules.md#field-1) |
| `fromActionState?` | [`Field`](../modules.md#field-1) |

#### Defined in

[lib/mina.ts:166](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L166)

___

### CurrentTransaction

Ƭ **CurrentTransaction**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `accountUpdates` | [`AccountUpdate`](../classes/AccountUpdate.md)[] |
| `fetchMode` | `FetchMode` |
| `isFinalRunOutsideCircuit` | `boolean` |
| `numberOfRuns` | ``0`` \| ``1`` \| `undefined` |
| `sender?` | [`PublicKey`](../classes/Types.PublicKey.md) |

#### Defined in

[lib/mina.ts:124](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L124)

___

### FeePayerSpec

Ƭ **FeePayerSpec**: [`PublicKey`](../classes/Types.PublicKey.md) \| \{ `fee?`: `number` \| `string` \| [`UInt64`](../classes/UInt64.md) ; `memo?`: `string` ; `nonce?`: `number` ; `sender`: [`PublicKey`](../classes/Types.PublicKey.md)  } \| `undefined`

Allows you to specify information about the fee payer account and the transaction.

#### Defined in

[lib/mina.ts:137](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L137)

___

### NetworkConstants

Ƭ **NetworkConstants**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `accountCreationFee` | [`UInt64`](../classes/UInt64.md) | - |
| `genesisTimestamp` | [`UInt64`](../classes/UInt64.md) | - |
| `slotTime` | [`UInt64`](../classes/UInt64.md) | Duration of 1 slot in milliseconds |

#### Defined in

[lib/mina.ts:171](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L171)

___

### Transaction

Ƭ **Transaction**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `transaction` | `ZkappCommand` | Transaction structure used to describe a state transition on the Mina blockchain. |
| `prove` | () => `Promise`\<(`undefined` \| [`Proof`](../classes/Proof.md)\<[`ZkappPublicInput`](../modules.md#zkapppublicinput-1), `undefined`\>)[]\> | Generates proofs for the [Transaction](Mina.md#transaction-1). This can take some time. |
| `send` | () => `Promise`\<[`TransactionId`](../interfaces/Mina.TransactionId.md)\> | Sends the [Transaction](Mina.md#transaction-1) to the network. |
| `sign` | (`additionalKeys?`: [`PrivateKey`](../classes/PrivateKey.md)[]) => [`Transaction`](Mina.md#transaction-1) | Signs all [AccountUpdate](../classes/AccountUpdate.md)s included in the [Transaction](Mina.md#transaction-1) that require a signature. [AccountUpdate](../classes/AccountUpdate.md)s that require a signature can be specified with `{AccountUpdate\|SmartContract}.requireSignature()`. |
| `toGraphqlQuery` | () => `string` | Returns the GraphQL query for the Mina daemon. |
| `toJSON` | () => `string` | Returns a JSON representation of the [Transaction](Mina.md#transaction-1). |
| `toPretty` | () => `any` | Returns a pretty-printed JSON representation of the [Transaction](Mina.md#transaction-1). |

#### Defined in

[lib/mina.ts:79](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L79)

[lib/mina.ts:116](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L116)

## Variables

### Transaction

• **Transaction**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `fromJSON` | (`json`: [`ZkappCommand`](Types.Json.md#zkappcommand)) => [`Transaction`](Mina.md#transaction-1) |

#### Defined in

[lib/mina.ts:79](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L79)

[lib/mina.ts:116](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L116)

___

### activeInstance

• **activeInstance**: `Mina`

#### Defined in

[lib/mina.ts:1029](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1029)

## Functions

### BerkeleyQANet

▸ **BerkeleyQANet**(`graphqlEndpoint`): `Mina`

#### Parameters

| Name | Type |
| :------ | :------ |
| `graphqlEndpoint` | `string` |

#### Returns

`Mina`

**`Deprecated`**

This is deprecated in favor of [Network](Mina.md#network), which is exactly the same function.
The name `BerkeleyQANet` was misleading because it suggested that this is specific to a particular network.

#### Defined in

[lib/mina.ts:1025](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1025)

___

### LocalBlockchain

▸ **LocalBlockchain**(`«destructured»?`): `Object`

A mock Mina blockchain running locally and useful for testing.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `enforceTransactionLimits` | `undefined` \| `boolean` |
| › `networkId` | `undefined` \| `NetworkId` |
| › `proofsEnabled` | `undefined` \| `boolean` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `accountCreationFee` | () => [`UInt64`](../classes/UInt64.md) |
| `addAccount` | (`publicKey`: [`PublicKey`](../classes/Types.PublicKey.md), `balance`: `string`) => `void` |
| `getNetworkId` | () => `NetworkId` |
| `proofsEnabled` | `boolean` |
| `testAccounts` | \{ `privateKey`: [`PrivateKey`](../classes/PrivateKey.md) ; `publicKey`: [`PublicKey`](../classes/Types.PublicKey.md)  }[] |
| `applyJsonTransaction` | (`json`: `string`) => `void` |
| `currentSlot` | () => [`UInt32`](../classes/UInt32.md) |
| `fetchActions` | (`publicKey`: [`PublicKey`](../classes/Types.PublicKey.md), `actionStates?`: [`ActionStates`](Mina.md#actionstates), `tokenId`: [`Field`](../classes/Field.md)) => `Promise`\<\{ `actions`: `string`[][] ; `hash`: `string`  }[]\> |
| `fetchEvents` | (`publicKey`: [`PublicKey`](../classes/Types.PublicKey.md), `tokenId`: [`Field`](../classes/Field.md)) => `Promise`\<`any`\> |
| `getAccount` | (`publicKey`: [`PublicKey`](../classes/Types.PublicKey.md), `tokenId`: [`Field`](../classes/Field.md)) => [`Account`](Types.md#account-1) |
| `getActions` | (`publicKey`: [`PublicKey`](../classes/Types.PublicKey.md), `actionStates?`: [`ActionStates`](Mina.md#actionstates), `tokenId`: [`Field`](../classes/Field.md)) => \{ `actions`: `string`[][] ; `hash`: `string`  }[] |
| `getNetworkConstants` | () => \{ `accountCreationFee`: [`UInt64`](../classes/UInt64.md) ; `genesisTimestamp`: [`UInt64`](../classes/UInt64.md) ; `slotTime`: [`UInt64`](../classes/UInt64.md)  } |
| `getNetworkState` | () => `PreconditionBaseTypes`\<\{ `blockchainLength`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `globalSlotSinceGenesis`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `minWindowDensity`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `nextEpochData`: \{ `epochLength`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `ledger`: \{ `hash`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `totalCurrency`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt64`](../classes/UInt64.md) ; `upper`: [`UInt64`](../classes/UInt64.md)  }  }  } ; `lockCheckpoint`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `seed`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `startCheckpoint`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  }  } ; `snarkedLedgerHash`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `stakingEpochData`: \{ `epochLength`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `ledger`: \{ `hash`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `totalCurrency`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt64`](../classes/UInt64.md) ; `upper`: [`UInt64`](../classes/UInt64.md)  }  }  } ; `lockCheckpoint`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `seed`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `startCheckpoint`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  }  } ; `totalCurrency`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt64`](../classes/UInt64.md) ; `upper`: [`UInt64`](../classes/UInt64.md)  }  }  }\> |
| `hasAccount` | (`publicKey`: [`PublicKey`](../classes/Types.PublicKey.md), `tokenId`: [`Field`](../classes/Field.md)) => `boolean` |
| `incrementGlobalSlot` | (`increment`: `number` \| [`UInt32`](../classes/UInt32.md)) => `void` |
| `sendTransaction` | (`txn`: [`Transaction`](Mina.md#transaction-1)) => `Promise`\<[`TransactionId`](../interfaces/Mina.TransactionId.md)\> |
| `setBlockchainLength` | (`height`: [`UInt32`](../classes/UInt32.md)) => `void` |
| `setGlobalSlot` | (`slot`: `number` \| [`UInt32`](../classes/UInt32.md)) => `void` |
| `setProofsEnabled` | (`newProofsEnabled`: `boolean`) => `void` |
| `setTotalCurrency` | (`currency`: [`UInt64`](../classes/UInt64.md)) => `void` |
| `transaction` | (`sender`: `DeprecatedFeePayerSpec`, `f`: () => `void`) => `Promise`\<[`Transaction`](Mina.md#transaction-1)\> |

#### Defined in

[lib/mina.ts:392](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L392)

___

### Network

▸ **Network**(`graphqlEndpoint`): `Mina`

Represents the Mina blockchain running on a real network

#### Parameters

| Name | Type |
| :------ | :------ |
| `graphqlEndpoint` | `string` |

#### Returns

`Mina`

#### Defined in

[lib/mina.ts:698](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L698)

▸ **Network**(`options`): `Mina`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `Object` |
| `options.archive?` | `string` \| `string`[] |
| `options.lightnetAccountManager?` | `string` |
| `options.mina` | `string` \| `string`[] |
| `options.networkId?` | `NetworkId` |

#### Returns

`Mina`

#### Defined in

[lib/mina.ts:699](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L699)

___

### accountCreationFee

▸ **accountCreationFee**(): [`UInt64`](../classes/UInt64.md)

Returns the default account creation fee.

#### Returns

[`UInt64`](../classes/UInt64.md)

**`Deprecated`**

use [getNetworkConstants](Mina.md#getnetworkconstants)

#### Defined in

[lib/mina.ts:1249](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1249)

___

### createTransaction

▸ **createTransaction**(`feePayer`, `f`, `numberOfRuns`, `«destructured»?`): [`Transaction`](Mina.md#transaction-1)

#### Parameters

| Name | Type |
| :------ | :------ |
| `feePayer` | `DeprecatedFeePayerSpec` |
| `f` | () => `unknown` |
| `numberOfRuns` | `undefined` \| ``0`` \| ``1`` |
| `«destructured»` | `Object` |
| › `fetchMode` | `undefined` \| `FetchMode` |
| › `isFinalRunOutsideCircuit` | `undefined` \| `boolean` |
| › `proofsEnabled` | `undefined` \| `boolean` |

#### Returns

[`Transaction`](Mina.md#transaction-1)

#### Defined in

[lib/mina.ts:188](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L188)

___

### currentSlot

▸ **currentSlot**(): [`UInt32`](../classes/UInt32.md)

#### Returns

[`UInt32`](../classes/UInt32.md)

The current slot number, according to the active Mina instance.

#### Defined in

[lib/mina.ts:1199](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1199)

___

### currentTransaction

▸ **currentTransaction**(): `undefined` \| [`CurrentTransaction`](Mina.md#currenttransaction)

#### Returns

`undefined` \| [`CurrentTransaction`](Mina.md#currenttransaction)

#### Defined in

[lib/global-context.ts:6](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/global-context.ts#L6)

___

### faucet

▸ **faucet**(`pub`, `network?`): `Promise`\<`void`\>

Requests the [testnet faucet](https://faucet.minaprotocol.com/api/v1/faucet) to fund a public key.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `pub` | [`PublicKey`](../classes/Types.PublicKey.md) | `undefined` |
| `network` | `string` | `'berkeley-qanet'` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/mina.ts:1630](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1630)

___

### fetchActions

▸ **fetchActions**(`publicKey`, `actionStates?`, `tokenId?`): `Promise`\<\{ `actions`: `string`[][] ; `hash`: `string`  }[] \| \{ `error`: \{ `statusCode`: `number` = 404; `statusText`: `string`  }  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `publicKey` | [`PublicKey`](../classes/Types.PublicKey.md) |
| `actionStates?` | [`ActionStates`](Mina.md#actionstates) |
| `tokenId?` | [`Field`](../classes/Field.md) |

#### Returns

`Promise`\<\{ `actions`: `string`[][] ; `hash`: `string`  }[] \| \{ `error`: \{ `statusCode`: `number` = 404; `statusText`: `string`  }  }\>

A list of emitted sequencing actions associated to the given public key.

#### Defined in

[lib/mina.ts:1271](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1271)

___

### fetchEvents

▸ **fetchEvents**(`publicKey`, `tokenId`, `filterOptions?`): `Promise`\<\{ `blockHash`: `string` = event.blockInfo.stateHash; `blockHeight`: [`UInt32`](../classes/UInt32.md) ; `chainStatus`: `string` = event.blockInfo.chainStatus; `events`: \{ `data`: `string`[] ; `transactionInfo`: \{ `hash`: `string` ; `memo`: `string` ; `status`: `string`  }  }[] ; `globalSlot`: [`UInt32`](../classes/UInt32.md) ; `parentBlockHash`: `string` = event.blockInfo.parentHash }[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `publicKey` | [`PublicKey`](../classes/Types.PublicKey.md) |
| `tokenId` | [`Field`](../classes/Field.md) |
| `filterOptions` | `EventActionFilterOptions` |

#### Returns

`Promise`\<\{ `blockHash`: `string` = event.blockInfo.stateHash; `blockHeight`: [`UInt32`](../classes/UInt32.md) ; `chainStatus`: `string` = event.blockInfo.chainStatus; `events`: \{ `data`: `string`[] ; `transactionInfo`: \{ `hash`: `string` ; `memo`: `string` ; `status`: `string`  }  }[] ; `globalSlot`: [`UInt32`](../classes/UInt32.md) ; `parentBlockHash`: `string` = event.blockInfo.parentHash }[]\>

A list of emitted events associated to the given public key.

#### Defined in

[lib/mina.ts:1260](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1260)

___

### filterGroups

▸ **filterGroups**(`xs`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `xs` | `AuthorizationKind`[] |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `proof` | `number` |
| `signedPair` | `number` |
| `signedSingle` | `number` |

#### Defined in

[lib/mina.ts:1587](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1587)

___

### getAccount

▸ **getAccount**(`publicKey`, `tokenId?`): `Account`

#### Parameters

| Name | Type |
| :------ | :------ |
| `publicKey` | [`PublicKey`](../classes/Types.PublicKey.md) |
| `tokenId?` | [`Field`](../classes/Field.md) |

#### Returns

`Account`

The account data associated to the given public key.

#### Defined in

[lib/mina.ts:1206](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1206)

___

### getActions

▸ **getActions**(`publicKey`, `actionStates?`, `tokenId?`): \{ `actions`: `string`[][] ; `hash`: `string`  }[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `publicKey` | [`PublicKey`](../classes/Types.PublicKey.md) |
| `actionStates?` | [`ActionStates`](Mina.md#actionstates) |
| `tokenId?` | [`Field`](../classes/Field.md) |

#### Returns

\{ `actions`: `string`[][] ; `hash`: `string`  }[]

A list of emitted sequencing actions associated to the given public key.

#### Defined in

[lib/mina.ts:1282](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1282)

___

### getBalance

▸ **getBalance**(`publicKey`, `tokenId?`): [`UInt64`](../classes/UInt64.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `publicKey` | [`PublicKey`](../classes/Types.PublicKey.md) |
| `tokenId?` | [`Field`](../classes/Field.md) |

#### Returns

[`UInt64`](../classes/UInt64.md)

The balance associated to the given public key.

#### Defined in

[lib/mina.ts:1241](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1241)

___

### getNetworkConstants

▸ **getNetworkConstants**(): [`NetworkConstants`](Mina.md#networkconstants)

#### Returns

[`NetworkConstants`](Mina.md#networkconstants)

Data associated with the current Mina network constants.

#### Defined in

[lib/mina.ts:1227](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1227)

___

### getNetworkId

▸ **getNetworkId**(): `NetworkId`

#### Returns

`NetworkId`

The current Mina network ID.

#### Defined in

[lib/mina.ts:1220](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1220)

___

### getNetworkState

▸ **getNetworkState**(): `PreconditionBaseTypes`\<\{ `blockchainLength`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `globalSlotSinceGenesis`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `minWindowDensity`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `nextEpochData`: \{ `epochLength`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `ledger`: \{ `hash`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `totalCurrency`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt64`](../classes/UInt64.md) ; `upper`: [`UInt64`](../classes/UInt64.md)  }  }  } ; `lockCheckpoint`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `seed`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `startCheckpoint`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  }  } ; `snarkedLedgerHash`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `stakingEpochData`: \{ `epochLength`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `ledger`: \{ `hash`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `totalCurrency`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt64`](../classes/UInt64.md) ; `upper`: [`UInt64`](../classes/UInt64.md)  }  }  } ; `lockCheckpoint`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `seed`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `startCheckpoint`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  }  } ; `totalCurrency`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt64`](../classes/UInt64.md) ; `upper`: [`UInt64`](../classes/UInt64.md)  }  }  }\>

#### Returns

`PreconditionBaseTypes`\<\{ `blockchainLength`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `globalSlotSinceGenesis`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `minWindowDensity`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `nextEpochData`: \{ `epochLength`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `ledger`: \{ `hash`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `totalCurrency`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt64`](../classes/UInt64.md) ; `upper`: [`UInt64`](../classes/UInt64.md)  }  }  } ; `lockCheckpoint`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `seed`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `startCheckpoint`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  }  } ; `snarkedLedgerHash`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `stakingEpochData`: \{ `epochLength`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt32`](../classes/UInt32.md) ; `upper`: [`UInt32`](../classes/UInt32.md)  }  } ; `ledger`: \{ `hash`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `totalCurrency`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt64`](../classes/UInt64.md) ; `upper`: [`UInt64`](../classes/UInt64.md)  }  }  } ; `lockCheckpoint`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `seed`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  } ; `startCheckpoint`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: [`Field`](../classes/Field.md)  }  } ; `totalCurrency`: \{ `isSome`: [`Bool`](../classes/Bool.md) ; `value`: \{ `lower`: [`UInt64`](../classes/UInt64.md) ; `upper`: [`UInt64`](../classes/UInt64.md)  }  }  }\>

Data associated with the current state of the Mina network.

#### Defined in

[lib/mina.ts:1234](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1234)

___

### getProofsEnabled

▸ **getProofsEnabled**(): `boolean`

#### Returns

`boolean`

#### Defined in

[lib/mina.ts:1290](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1290)

___

### hasAccount

▸ **hasAccount**(`publicKey`, `tokenId?`): `boolean`

Checks if an account exists within the ledger.

#### Parameters

| Name | Type |
| :------ | :------ |
| `publicKey` | [`PublicKey`](../classes/Types.PublicKey.md) |
| `tokenId?` | [`Field`](../classes/Field.md) |

#### Returns

`boolean`

#### Defined in

[lib/mina.ts:1213](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1213)

___

### sendTransaction

▸ **sendTransaction**(`txn`): `Promise`\<[`TransactionId`](../interfaces/Mina.TransactionId.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `txn` | [`Transaction`](Mina.md#transaction-1) |

#### Returns

`Promise`\<[`TransactionId`](../interfaces/Mina.TransactionId.md)\>

#### Defined in

[lib/mina.ts:1253](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1253)

___

### sender

▸ **sender**(): [`PublicKey`](../classes/Types.PublicKey.md)

Returns the public key of the current transaction's sender account.

Throws an error if not inside a transaction, or the sender wasn't passed in.

#### Returns

[`PublicKey`](../classes/Types.PublicKey.md)

#### Defined in

[lib/mina.ts:1175](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1175)

___

### setActiveInstance

▸ **setActiveInstance**(`m`): `void`

Set the currently used Mina instance.

#### Parameters

| Name | Type |
| :------ | :------ |
| `m` | `Mina` |

#### Returns

`void`

#### Defined in

[lib/mina.ts:1115](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1115)

___

### transaction

▸ **transaction**(`sender`, `f`): `Promise`\<[`Transaction`](Mina.md#transaction-1)\>

Construct a smart contract transaction. Within the callback passed to this function,
you can call into the methods of smart contracts.

```
let tx = await Mina.transaction(sender, () => {
  myZkapp.update();
  someOtherZkapp.someOtherMethod();
});
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `sender` | [`FeePayerSpec`](Mina.md#feepayerspec) |
| `f` | () => `void` |

#### Returns

`Promise`\<[`Transaction`](Mina.md#transaction-1)\>

A transaction that can subsequently be submitted to the chain.

#### Defined in

[lib/mina.ts:1132](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1132)

▸ **transaction**(`f`): `Promise`\<[`Transaction`](Mina.md#transaction-1)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `f` | () => `void` |

#### Returns

`Promise`\<[`Transaction`](Mina.md#transaction-1)\>

#### Defined in

[lib/mina.ts:1133](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1133)

▸ **transaction**(`sender`, `f`): `Promise`\<[`Transaction`](Mina.md#transaction-1)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `sender` | `DeprecatedFeePayerSpec` |
| `f` | () => `void` |

#### Returns

`Promise`\<[`Transaction`](Mina.md#transaction-1)\>

**`Deprecated`**

It's deprecated to pass in the fee payer's private key. Pass in the public key instead.
```
// good
Mina.transaction(publicKey, ...);
Mina.transaction({ sender: publicKey }, ...);

// deprecated
Mina.transaction(privateKey, ...);
Mina.transaction({ feePayerKey: privateKey }, ...);
```

#### Defined in

[lib/mina.ts:1146](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1146)

___

### waitForFunding

▸ **waitForFunding**(`address`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[lib/mina.ts:1606](https://github.com/o1-labs/o1js/blob/5d8e331/src/lib/mina.ts#L1606)

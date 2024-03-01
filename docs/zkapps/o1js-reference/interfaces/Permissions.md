[o1js](../README.md) / [Modules](../modules.md) / Permissions

# Interface: Permissions

Permissions specify how specific aspects of the zkapp account are allowed
to be modified. All fields are denominated by a Permission.

## Hierarchy

- `Permissions_`

  ↳ **`Permissions`**

## Table of contents

### Properties

- [access](Permissions.md#access)
- [editActionState](Permissions.md#editactionstate)
- [editState](Permissions.md#editstate)
- [incrementNonce](Permissions.md#incrementnonce)
- [receive](Permissions.md#receive)
- [send](Permissions.md#send)
- [setDelegate](Permissions.md#setdelegate)
- [setPermissions](Permissions.md#setpermissions)
- [setTiming](Permissions.md#settiming)
- [setTokenSymbol](Permissions.md#settokensymbol)
- [setVerificationKey](Permissions.md#setverificationkey)
- [setVotingFor](Permissions.md#setvotingfor)
- [setZkappUri](Permissions.md#setzkappuri)

## Properties

### access

• **access**: [`AuthRequired`](../modules/Types.md#authrequired-1)

Permission to control the ability to include _any_ account update for this
account in a transaction. Note that this is more restrictive than all other
permissions combined. For normal accounts it can safely be set to `none`,
but for token contracts this has to be more restrictive, to prevent
unauthorized token interactions -- for example, it could be
`proofOrSignature`.

#### Overrides

Permissions\_.access

#### Defined in

[lib/account-update.ts:271](https://github.com/o1-labs/o1js/blob/64a4beb/src/lib/account-update.ts#L271)

___

### editActionState

• **editActionState**: [`AuthRequired`](../modules/Types.md#authrequired-1)

The Permission corresponding to the ability to emit actions to the account.

#### Overrides

Permissions\_.editActionState

#### Defined in

[lib/account-update.ts:250](https://github.com/o1-labs/o1js/blob/64a4beb/src/lib/account-update.ts#L250)

___

### editState

• **editState**: [`AuthRequired`](../modules/Types.md#authrequired-1)

The Permission corresponding to the 8 state fields associated with
an account.

#### Overrides

Permissions\_.editState

#### Defined in

[lib/account-update.ts:203](https://github.com/o1-labs/o1js/blob/64a4beb/src/lib/account-update.ts#L203)

___

### incrementNonce

• **incrementNonce**: [`AuthRequired`](../modules/Types.md#authrequired-1)

#### Overrides

Permissions\_.incrementNonce

#### Defined in

[lib/account-update.ts:259](https://github.com/o1-labs/o1js/blob/64a4beb/src/lib/account-update.ts#L259)

___

### receive

• **receive**: [`AuthRequired`](../modules/Types.md#authrequired-1)

The Permission corresponding to the ability to receive transactions
to this account.

#### Overrides

Permissions\_.receive

#### Defined in

[lib/account-update.ts:215](https://github.com/o1-labs/o1js/blob/64a4beb/src/lib/account-update.ts#L215)

___

### send

• **send**: [`AuthRequired`](../modules/Types.md#authrequired-1)

The Permission corresponding to the ability to send transactions
from this account.

#### Overrides

Permissions\_.send

#### Defined in

[lib/account-update.ts:209](https://github.com/o1-labs/o1js/blob/64a4beb/src/lib/account-update.ts#L209)

___

### setDelegate

• **setDelegate**: [`AuthRequired`](../modules/Types.md#authrequired-1)

The Permission corresponding to the ability to set the delegate
field of the account.

#### Overrides

Permissions\_.setDelegate

#### Defined in

[lib/account-update.ts:221](https://github.com/o1-labs/o1js/blob/64a4beb/src/lib/account-update.ts#L221)

___

### setPermissions

• **setPermissions**: [`AuthRequired`](../modules/Types.md#authrequired-1)

The Permission corresponding to the ability to set the permissions
field of the account.

#### Overrides

Permissions\_.setPermissions

#### Defined in

[lib/account-update.ts:227](https://github.com/o1-labs/o1js/blob/64a4beb/src/lib/account-update.ts#L227)

___

### setTiming

• **setTiming**: [`AuthRequired`](../modules/Types.md#authrequired-1)

#### Overrides

Permissions\_.setTiming

#### Defined in

[lib/account-update.ts:261](https://github.com/o1-labs/o1js/blob/64a4beb/src/lib/account-update.ts#L261)

___

### setTokenSymbol

• **setTokenSymbol**: [`AuthRequired`](../modules/Types.md#authrequired-1)

The Permission corresponding to the ability to set the token symbol
for this account.

#### Overrides

Permissions\_.setTokenSymbol

#### Defined in

[lib/account-update.ts:256](https://github.com/o1-labs/o1js/blob/64a4beb/src/lib/account-update.ts#L256)

___

### setVerificationKey

• **setVerificationKey**: `Object`

The Permission corresponding to the ability to set the verification
key associated with the circuit tied to this account. Effectively
"upgradeability" of the smart contract.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `auth` | [`AuthRequired`](../modules/Types.md#authrequired-1) |
| `txnVersion` | [`UInt32`](../classes/UInt32.md) |

#### Overrides

Permissions\_.setVerificationKey

#### Defined in

[lib/account-update.ts:234](https://github.com/o1-labs/o1js/blob/64a4beb/src/lib/account-update.ts#L234)

___

### setVotingFor

• **setVotingFor**: [`AuthRequired`](../modules/Types.md#authrequired-1)

#### Overrides

Permissions\_.setVotingFor

#### Defined in

[lib/account-update.ts:260](https://github.com/o1-labs/o1js/blob/64a4beb/src/lib/account-update.ts#L260)

___

### setZkappUri

• **setZkappUri**: [`AuthRequired`](../modules/Types.md#authrequired-1)

The Permission corresponding to the ability to set the zkapp uri
typically pointing to the source code of the smart contract. Usually this
should be changed whenever the [setVerificationKey](Permissions.md#setverificationkey) is
changed. Effectively "upgradeability" of the smart contract.

#### Overrides

Permissions\_.setZkappUri

#### Defined in

[lib/account-update.ts:245](https://github.com/o1-labs/o1js/blob/64a4beb/src/lib/account-update.ts#L245)

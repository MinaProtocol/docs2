[o1js](../README.md) / [Modules](../modules.md) / Bool

# Class: Bool

A boolean value. You can use it like this:

```
const x = new Bool(true);
```

You can also combine multiple booleans via [[`not`]], [[`and`]], [[`or`]].

Use [[assertEquals]] to enforce the value of a Bool.

## Table of contents

### Constructors

- [constructor](Bool.md#constructor)

### Properties

- [value](Bool.md#value)
- [Unsafe](Bool.md#unsafe)
- [sizeInBytes](Bool.md#sizeinbytes)

### Methods

- [and](Bool.md#and)
- [assertEquals](Bool.md#assertequals)
- [assertFalse](Bool.md#assertfalse)
- [assertTrue](Bool.md#asserttrue)
- [equals](Bool.md#equals)
- [isConstant](Bool.md#isconstant)
- [not](Bool.md#not)
- [or](Bool.md#or)
- [sizeInFields](Bool.md#sizeinfields)
- [toBoolean](Bool.md#toboolean)
- [toField](Bool.md#tofield)
- [toFields](Bool.md#tofields)
- [toJSON](Bool.md#tojson)
- [toString](Bool.md#tostring)
- [and](Bool.md#and-1)
- [assertEqual](Bool.md#assertequal)
- [check](Bool.md#check)
- [empty](Bool.md#empty)
- [equal](Bool.md#equal)
- [fromBytes](Bool.md#frombytes)
- [fromFields](Bool.md#fromfields)
- [fromJSON](Bool.md#fromjson)
- [not](Bool.md#not-1)
- [or](Bool.md#or-1)
- [readBytes](Bool.md#readbytes)
- [sizeInFields](Bool.md#sizeinfields-1)
- [toAuxiliary](Bool.md#toauxiliary)
- [toBytes](Bool.md#tobytes)
- [toField](Bool.md#tofield-1)
- [toFields](Bool.md#tofields-1)
- [toInput](Bool.md#toinput)
- [toJSON](Bool.md#tojson-1)

## Constructors

### constructor

• **new Bool**(`x`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | `boolean` \| [`Bool`](Bool.md) \| [`FieldVar`](../modules.md#fieldvar-1) |

#### Defined in

[lib/bool.ts:36](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L36)

## Properties

### value

• **value**: [`FieldVar`](../modules.md#fieldvar-1)

#### Defined in

[lib/bool.ts:34](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L34)

___

### Unsafe

▪ `Static` **Unsafe**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `ofField` | (`x`: [`Field`](Field.md)) => [`Bool`](Bool.md) |

#### Defined in

[lib/bool.ts:327](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L327)

___

### sizeInBytes

▪ `Static` **sizeInBytes**: `number` = `1`

#### Defined in

[lib/bool.ts:321](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L321)

## Methods

### and

▸ **and**(`y`): [`Bool`](Bool.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `y` | `boolean` \| [`Bool`](Bool.md) | A [Bool](Bool.md) to AND with this [Bool](Bool.md). |

#### Returns

[`Bool`](Bool.md)

a new [Bool](Bool.md) that is set to true only if
this [Bool](Bool.md) and `y` are also true.

#### Defined in

[lib/bool.ts:74](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L74)

___

### assertEquals

▸ **assertEquals**(`y`, `message?`): `void`

Proves that this [Bool](Bool.md) is equal to `y`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `y` | `boolean` \| [`Bool`](Bool.md) | a [Bool](Bool.md). |
| `message?` | `string` | - |

#### Returns

`void`

#### Defined in

[lib/bool.ts:97](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L97)

___

### assertFalse

▸ **assertFalse**(`message?`): `void`

Proves that this [Bool](Bool.md) is `false`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

`void`

#### Defined in

[lib/bool.ts:128](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L128)

___

### assertTrue

▸ **assertTrue**(`message?`): `void`

Proves that this [Bool](Bool.md) is `true`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

`void`

#### Defined in

[lib/bool.ts:114](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L114)

___

### equals

▸ **equals**(`y`): [`Bool`](Bool.md)

Returns true if this [Bool](Bool.md) is equal to `y`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `y` | `boolean` \| [`Bool`](Bool.md) | a [Bool](Bool.md). |

#### Returns

[`Bool`](Bool.md)

#### Defined in

[lib/bool.ts:143](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L143)

___

### isConstant

▸ **isConstant**(): this is Object

#### Returns

this is Object

#### Defined in

[lib/bool.ts:48](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L48)

___

### not

▸ **not**(): [`Bool`](Bool.md)

#### Returns

[`Bool`](Bool.md)

a new [Bool](Bool.md) that is the negation of this [Bool](Bool.md).

#### Defined in

[lib/bool.ts:62](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L62)

___

### or

▸ **or**(`y`): [`Bool`](Bool.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `y` | `boolean` \| [`Bool`](Bool.md) | a [Bool](Bool.md) to OR with this [Bool](Bool.md). |

#### Returns

[`Bool`](Bool.md)

a new [Bool](Bool.md) that is set to true if either
this [Bool](Bool.md) or `y` is true.

#### Defined in

[lib/bool.ts:86](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L86)

___

### sizeInFields

▸ **sizeInFields**(): `number`

Returns the size of this type.

#### Returns

`number`

#### Defined in

[lib/bool.ts:153](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L153)

___

### toBoolean

▸ **toBoolean**(): `boolean`

This converts the [Bool](Bool.md) to a javascript [[boolean]].
This can only be called on non-witness values.

#### Returns

`boolean`

#### Defined in

[lib/bool.ts:184](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L184)

___

### toField

▸ **toField**(): [`Field`](Field.md)

Converts a [Bool](Bool.md) to a [Field](Field.md). `false` becomes 0 and `true` becomes 1.

#### Returns

[`Field`](Field.md)

#### Defined in

[lib/bool.ts:55](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L55)

___

### toFields

▸ **toFields**(): [`Field`](Field.md)[]

Serializes this [Bool](Bool.md) into [Field](Field.md) elements.

#### Returns

[`Field`](Field.md)[]

#### Defined in

[lib/bool.ts:160](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L160)

___

### toJSON

▸ **toJSON**(): `boolean`

Serialize the [Bool](Bool.md) to a JSON string.
This operation does _not_ affect the circuit and can't be used to prove anything about the string representation of the Field.

#### Returns

`boolean`

#### Defined in

[lib/bool.ts:176](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L176)

___

### toString

▸ **toString**(): `string`

Serialize the [Bool](Bool.md) to a string, e.g. for printing.
This operation does _not_ affect the circuit and can't be used to prove anything about the string representation of the Field.

#### Returns

`string`

#### Defined in

[lib/bool.ts:168](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L168)

___

### and

▸ `Static` **and**(`x`, `y`): [`Bool`](Bool.md)

Boolean AND operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | `boolean` \| [`Bool`](Bool.md) |
| `y` | `boolean` \| [`Bool`](Bool.md) |

#### Returns

[`Bool`](Bool.md)

#### Defined in

[lib/bool.ts:213](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L213)

___

### assertEqual

▸ `Static` **assertEqual**(`x`, `y`): `void`

Asserts if both [Bool](Bool.md) are equal.

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | [`Bool`](Bool.md) |
| `y` | `boolean` \| [`Bool`](Bool.md) |

#### Returns

`void`

#### Defined in

[lib/bool.ts:233](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L233)

___

### check

▸ `Static` **check**(`x`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | [`Bool`](Bool.md) |

#### Returns

`void`

#### Defined in

[lib/bool.ts:323](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L323)

___

### empty

▸ `Static` **empty**(): [`Bool`](Bool.md)

#### Returns

[`Bool`](Bool.md)

#### Defined in

[lib/bool.ts:298](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L298)

___

### equal

▸ `Static` **equal**(`x`, `y`): [`Bool`](Bool.md)

Checks two [Bool](Bool.md) for equality.

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | `boolean` \| [`Bool`](Bool.md) |
| `y` | `boolean` \| [`Bool`](Bool.md) |

#### Returns

[`Bool`](Bool.md)

#### Defined in

[lib/bool.ts:244](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L244)

___

### fromBytes

▸ `Static` **fromBytes**(`bytes`): [`Bool`](Bool.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `number`[] |

#### Returns

[`Bool`](Bool.md)

#### Defined in

[lib/bool.ts:310](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L310)

___

### fromFields

▸ `Static` **fromFields**(`fields`): [`Bool`](Bool.md)

Creates a data structure from an array of serialized [Field](Field.md) elements.

#### Parameters

| Name | Type |
| :------ | :------ |
| `fields` | [`Field`](Field.md)[] |

#### Returns

[`Bool`](Bool.md)

#### Defined in

[lib/bool.ts:268](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L268)

___

### fromJSON

▸ `Static` **fromJSON**(`b`): [`Bool`](Bool.md)

Deserialize a JSON structure into a [Bool](Bool.md).
This operation does _not_ affect the circuit and can't be used to prove anything about the string representation of the Field.

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | `boolean` |

#### Returns

[`Bool`](Bool.md)

#### Defined in

[lib/bool.ts:287](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L287)

___

### not

▸ `Static` **not**(`x`): [`Bool`](Bool.md)

Boolean negation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | `boolean` \| [`Bool`](Bool.md) |

#### Returns

[`Bool`](Bool.md)

#### Defined in

[lib/bool.ts:203](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L203)

___

### or

▸ `Static` **or**(`x`, `y`): [`Bool`](Bool.md)

Boolean OR operation.

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | `boolean` \| [`Bool`](Bool.md) |
| `y` | `boolean` \| [`Bool`](Bool.md) |

#### Returns

[`Bool`](Bool.md)

#### Defined in

[lib/bool.ts:223](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L223)

___

### readBytes

▸ `Static` **readBytes**\<`N`\>(`bytes`, `offset`): [value: Bool, offset: number]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `N` | extends `number` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `number`[] |
| `offset` | `NonNegativeInteger`\<`N`\> |

#### Returns

[value: Bool, offset: number]

#### Defined in

[lib/bool.ts:314](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L314)

___

### sizeInFields

▸ `Static` **sizeInFields**(): `number`

Returns the size of this type.

#### Returns

`number`

#### Defined in

[lib/bool.ts:294](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L294)

___

### toAuxiliary

▸ `Static` **toAuxiliary**(`_?`): []

Static method to serialize a [Bool](Bool.md) into its auxiliary data.

#### Parameters

| Name | Type |
| :------ | :------ |
| `_?` | [`Bool`](Bool.md) |

#### Returns

[]

#### Defined in

[lib/bool.ts:261](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L261)

___

### toBytes

▸ `Static` **toBytes**(`b`): `number`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `b` | [`Bool`](Bool.md) |

#### Returns

`number`[]

#### Defined in

[lib/bool.ts:306](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L306)

___

### toField

▸ `Static` **toField**(`x`): [`Field`](Field.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | `boolean` \| [`Bool`](Bool.md) |

#### Returns

[`Field`](Field.md)

#### Defined in

[lib/bool.ts:196](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L196)

___

### toFields

▸ `Static` **toFields**(`x`): [`Field`](Field.md)[]

Static method to serialize a [Bool](Bool.md) into an array of [Field](Field.md) elements.

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | [`Bool`](Bool.md) |

#### Returns

[`Field`](Field.md)[]

#### Defined in

[lib/bool.ts:254](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L254)

___

### toInput

▸ `Static` **toInput**(`x`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | [`Bool`](Bool.md) |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `packed` | [[`Field`](Field.md), `number`][] |

#### Defined in

[lib/bool.ts:302](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L302)

___

### toJSON

▸ `Static` **toJSON**(`x`): `boolean`

Serialize a [Bool](Bool.md) to a JSON string.
This operation does _not_ affect the circuit and can't be used to prove anything about the string representation of the Field.

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | [`Bool`](Bool.md) |

#### Returns

`boolean`

#### Defined in

[lib/bool.ts:279](https://github.com/o1-labs/o1js/blob/659a59e/src/lib/bool.ts#L279)

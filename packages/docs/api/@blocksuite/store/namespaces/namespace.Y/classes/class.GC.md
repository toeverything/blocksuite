[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > GC

# Class: GC

## Extends

- [`AbstractStruct`](class.AbstractStruct.md)

## Constructors

### constructor

> **new GC**(`id`, `length`): [`GC`](class.GC.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | [`ID`](class.ID.md) |
| `length` | `number` |

#### Returns

[`GC`](class.GC.md)

#### Inherited from

[`AbstractStruct`](class.AbstractStruct.md).[`constructor`](class.AbstractStruct.md#constructor)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:6

## Properties

### id

> **id**: [`ID`](class.ID.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:7

#### Inherited from

[`AbstractStruct`](class.AbstractStruct.md).[`id`](class.AbstractStruct.md#id)

***

### length

> **length**: `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:8

#### Inherited from

[`AbstractStruct`](class.AbstractStruct.md).[`length`](class.AbstractStruct.md#length)

## Accessors

### deleted

> `get` deleted(): `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:12

#### Inherited from

[`AbstractStruct`](class.AbstractStruct.md).[`deleted`](class.AbstractStruct.md#deleted)

## Methods

### delete

> **delete**(): `void`

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/GC.d.ts:6

***

### getMissing

> **getMissing**(`transaction`, `store`): `null` \| `number`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `transaction` | [`Transaction`](class.Transaction.md) |
| `store` | `StructStore` |

#### Returns

`null` \| `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/GC.d.ts:22

***

### integrate

> **integrate**(`transaction`, `offset`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `transaction` | [`Transaction`](class.Transaction.md) |
| `offset` | `number` |

#### Returns

`void`

#### Inherited from

[`AbstractStruct`](class.AbstractStruct.md).[`integrate`](class.AbstractStruct.md#integrate)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:31

***

### mergeWith

> **mergeWith**(`right`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `right` | [`GC`](class.GC.md) |

#### Returns

`boolean`

#### Overrides

[`AbstractStruct`](class.AbstractStruct.md).[`mergeWith`](class.AbstractStruct.md#mergewith)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/GC.d.ts:11

***

### write

> **write**(`encoder`, `offset`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `encoder` | [`UpdateEncoderV1`](class.UpdateEncoderV1.md) \| [`UpdateEncoderV2`](class.UpdateEncoderV2.md) |
| `offset` | `number` |

#### Returns

`void`

#### Overrides

[`AbstractStruct`](class.AbstractStruct.md).[`write`](class.AbstractStruct.md#write)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/GC.d.ts:16

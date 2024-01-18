[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > AbstractStruct

# Class: AbstractStruct

## Extended By

- [`Item`](class.Item.md)
- [`GC`](class.GC.md)
- [`Skip`](class.Skip.md)

## Constructors

### constructor

> **new AbstractStruct**(`id`, `length`): [`AbstractStruct`](class.AbstractStruct.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | [`ID`](class.ID.md) |
| `length` | `number` |

#### Returns

[`AbstractStruct`](class.AbstractStruct.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:6

## Properties

### id

> **id**: [`ID`](class.ID.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:7

***

### length

> **length**: `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:8

## Accessors

### deleted

> `get` deleted(): `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:12

## Methods

### integrate

> **integrate**(`transaction`, `offset`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `transaction` | [`Transaction`](class.Transaction.md) |
| `offset` | `number` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:31

***

### mergeWith

> **mergeWith**(`right`): `boolean`

Merge this struct with the item to the right.
This method is already assuming that `this.id.clock + this.length === this.id.clock`.
Also this method does *not* remove right from StructStore!

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `right` | [`AbstractStruct`](class.AbstractStruct.md) |

#### Returns

`boolean`

wether this merged with right

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:20

***

### write

> **write**(
  `encoder`,
  `offset`,
  `encodingRef`): `void`

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `encoder` | [`UpdateEncoderV1`](class.UpdateEncoderV1.md) \| [`UpdateEncoderV2`](class.UpdateEncoderV2.md) | The encoder to write data to. |
| `offset` | `number` | - |
| `encodingRef` | `number` | - |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:26

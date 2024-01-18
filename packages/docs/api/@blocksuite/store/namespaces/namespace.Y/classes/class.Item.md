[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > Item

# Class: Item

Abstract class that represents any content.

## Extends

- [`AbstractStruct`](class.AbstractStruct.md)

## Constructors

### constructor

> **new Item**(
  `id`,
  `left`,
  `origin`,
  `right`,
  `rightOrigin`,
  `parent`,
  `parentSub`,
  `content`): [`Item`](class.Item.md)

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `id` | [`ID`](class.ID.md) | - |
| `left` | `null` \| [`Item`](class.Item.md) | - |
| `origin` | `null` \| [`ID`](class.ID.md) | - |
| `right` | `null` \| [`Item`](class.Item.md) | - |
| `rightOrigin` | `null` \| [`ID`](class.ID.md) | - |
| `parent` | `null` \| [`AbstractType`](class.AbstractType.md)\< `any` \> \| [`ID`](class.ID.md) | Is a type if integrated, is null if it is possible to copy parent from left or right, is ID before integration to search for it. |
| `parentSub` | `null` \| `string` | - |
| `content` | `AbstractContent` | - |

#### Returns

[`Item`](class.Item.md)

#### Overrides

[`AbstractStruct`](class.AbstractStruct.md).[`constructor`](class.AbstractStruct.md#constructor)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:22

## Properties

### content

> **content**: `AbstractContent`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:64

***

### id

> **id**: [`ID`](class.ID.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:7

#### Inherited from

[`AbstractStruct`](class.AbstractStruct.md).[`id`](class.AbstractStruct.md#id)

***

### info

> **info**: `number`

bit1: keep
bit2: countable
bit3: deleted
bit4: mark - mark node as fast-search-marker

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:72

***

### left

> **left**: `null` \| [`Item`](class.Item.md)

The item that is currently to the left of this item.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:32

***

### length

> **length**: `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/AbstractStruct.d.ts:8

#### Inherited from

[`AbstractStruct`](class.AbstractStruct.md).[`length`](class.AbstractStruct.md#length)

***

### origin

> **origin**: `null` \| [`ID`](class.ID.md)

The item that was originally to the left of this item.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:27

***

### parent

> **parent**: `null` \| [`AbstractType`](class.AbstractType.md)\< `any` \> \| [`ID`](class.ID.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:46

***

### parentSub

> **parentSub**: `null` \| `string`

If the parent refers to this item with some kind of key (e.g. YMap, the
key is specified here. The key is then used to refer to the list in which
to insert this item. If `parentSub = null` type._start is the list in
which to insert to. Otherwise it is `parent._map`.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:54

***

### redone

> **redone**: `null` \| [`ID`](class.ID.md)

If this type's effect is redone this type refers to the type that undid
this operation.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:60

***

### right

> **right**: `null` \| [`Item`](class.Item.md)

The item that is currently to the right of this item.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:37

***

### rightOrigin

> **rightOrigin**: `null` \| [`ID`](class.ID.md)

The item that was originally to the right of this item.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:42

## Accessors

### countable

> `get` countable(): `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:85

***

### deleted

> `get` deleted(): `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:86

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:91

#### Overrides

[`AbstractStruct`](class.AbstractStruct.md).[`deleted`](class.AbstractStruct.md#deleted)

***

### keep

> `get` keep(): `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:80

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:84

***

### lastId

> `get` lastId(): [`ID`](class.ID.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:112

***

### marker

> `get` marker(): `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:78

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:79

***

### next

> `get` next(): `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:104

***

### prev

> `get` prev(): `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:108

## Methods

### delete

> **delete**(`transaction`): `void`

Mark this Item as deleted.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `transaction` | [`Transaction`](class.Transaction.md) |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:125

***

### gc

> **gc**(`store`, `parentGCd`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `store` | `StructStore` |
| `parentGCd` | `boolean` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:130

***

### getMissing

> **getMissing**(`transaction`, `store`): `null` \| `number`

Return the creator clientID of the missing op or define missing items and return null.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `transaction` | [`Transaction`](class.Transaction.md) |
| `store` | `StructStore` |

#### Returns

`null` \| `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:100

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

### markDeleted

> **markDeleted**(): `void`

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:92

***

### mergeWith

> **mergeWith**(`right`): `boolean`

Try to merge two items

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `right` | [`Item`](class.Item.md) |

#### Returns

`boolean`

#### Overrides

[`AbstractStruct`](class.AbstractStruct.md).[`mergeWith`](class.AbstractStruct.md#mergewith)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:119

***

### write

> **write**(`encoder`, `offset`): `void`

Transform the properties of this type to binary and write it to an
BinaryEncoder.

This is called when this Item is sent to a remote peer.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `encoder` | [`UpdateEncoderV1`](class.UpdateEncoderV1.md) \| [`UpdateEncoderV2`](class.UpdateEncoderV2.md) | The encoder to write data to. |
| `offset` | `number` | - |

#### Returns

`void`

#### Overrides

[`AbstractStruct`](class.AbstractStruct.md).[`write`](class.AbstractStruct.md#write)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/Item.d.ts:140

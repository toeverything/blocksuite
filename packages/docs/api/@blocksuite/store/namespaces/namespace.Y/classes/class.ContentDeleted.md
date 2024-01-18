[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > ContentDeleted

# Class: ContentDeleted

## Constructors

### constructor

> **new ContentDeleted**(`len`): [`ContentDeleted`](class.ContentDeleted.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `len` | `number` |

#### Returns

[`ContentDeleted`](class.ContentDeleted.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDeleted.d.ts:5

## Properties

### len

> **len**: `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDeleted.d.ts:6

## Methods

### copy

> **copy**(): [`ContentDeleted`](class.ContentDeleted.md)

#### Returns

[`ContentDeleted`](class.ContentDeleted.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDeleted.d.ts:22

***

### delete

> **delete**(`transaction`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `transaction` | [`Transaction`](class.Transaction.md) |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDeleted.d.ts:41

***

### gc

> **gc**(`store`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `store` | `StructStore` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDeleted.d.ts:45

***

### getContent

> **getContent**(): `any`[]

#### Returns

`any`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDeleted.d.ts:14

***

### getLength

> **getLength**(): `number`

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDeleted.d.ts:10

***

### getRef

> **getRef**(): `number`

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDeleted.d.ts:54

***

### integrate

> **integrate**(`transaction`, `item`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `transaction` | [`Transaction`](class.Transaction.md) |
| `item` | [`Item`](class.Item.md) |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDeleted.d.ts:37

***

### isCountable

> **isCountable**(): `boolean`

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDeleted.d.ts:18

***

### mergeWith

> **mergeWith**(`right`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `right` | [`ContentDeleted`](class.ContentDeleted.md) |

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDeleted.d.ts:32

***

### splice

> **splice**(`offset`): [`ContentDeleted`](class.ContentDeleted.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `offset` | `number` |

#### Returns

[`ContentDeleted`](class.ContentDeleted.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDeleted.d.ts:27

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

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDeleted.d.ts:50

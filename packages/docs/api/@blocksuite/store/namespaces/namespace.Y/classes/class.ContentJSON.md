[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > ContentJSON

# Class: ContentJSON

## Constructors

### constructor

> **new ContentJSON**(`arr`): [`ContentJSON`](class.ContentJSON.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `arr` | `any`[] |

#### Returns

[`ContentJSON`](class.ContentJSON.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentJSON.d.ts:8

## Properties

### arr

> **arr**: `any`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentJSON.d.ts:12

## Methods

### copy

> **copy**(): [`ContentJSON`](class.ContentJSON.md)

#### Returns

[`ContentJSON`](class.ContentJSON.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentJSON.d.ts:28

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentJSON.d.ts:47

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentJSON.d.ts:51

***

### getContent

> **getContent**(): `any`[]

#### Returns

`any`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentJSON.d.ts:20

***

### getLength

> **getLength**(): `number`

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentJSON.d.ts:16

***

### getRef

> **getRef**(): `number`

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentJSON.d.ts:60

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentJSON.d.ts:43

***

### isCountable

> **isCountable**(): `boolean`

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentJSON.d.ts:24

***

### mergeWith

> **mergeWith**(`right`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `right` | [`ContentJSON`](class.ContentJSON.md) |

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentJSON.d.ts:38

***

### splice

> **splice**(`offset`): [`ContentJSON`](class.ContentJSON.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `offset` | `number` |

#### Returns

[`ContentJSON`](class.ContentJSON.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentJSON.d.ts:33

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentJSON.d.ts:56

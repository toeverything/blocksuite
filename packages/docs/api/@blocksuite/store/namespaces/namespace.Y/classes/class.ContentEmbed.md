[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > ContentEmbed

# Class: ContentEmbed

## Constructors

### constructor

> **new ContentEmbed**(`embed`): [`ContentEmbed`](class.ContentEmbed.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `embed` | `Object` |

#### Returns

[`ContentEmbed`](class.ContentEmbed.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentEmbed.d.ts:8

## Properties

### embed

> **embed**: `Object`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentEmbed.d.ts:9

## Methods

### copy

> **copy**(): [`ContentEmbed`](class.ContentEmbed.md)

#### Returns

[`ContentEmbed`](class.ContentEmbed.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentEmbed.d.ts:25

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentEmbed.d.ts:44

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentEmbed.d.ts:48

***

### getContent

> **getContent**(): `any`[]

#### Returns

`any`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentEmbed.d.ts:17

***

### getLength

> **getLength**(): `number`

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentEmbed.d.ts:13

***

### getRef

> **getRef**(): `number`

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentEmbed.d.ts:57

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentEmbed.d.ts:40

***

### isCountable

> **isCountable**(): `boolean`

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentEmbed.d.ts:21

***

### mergeWith

> **mergeWith**(`right`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `right` | [`ContentEmbed`](class.ContentEmbed.md) |

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentEmbed.d.ts:35

***

### splice

> **splice**(`offset`): [`ContentEmbed`](class.ContentEmbed.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `offset` | `number` |

#### Returns

[`ContentEmbed`](class.ContentEmbed.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentEmbed.d.ts:30

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentEmbed.d.ts:53

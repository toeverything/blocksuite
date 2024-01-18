[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > ContentAny

# Class: ContentAny

## Constructors

### constructor

> **new ContentAny**(`arr`): [`ContentAny`](class.ContentAny.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `arr` | `any`[] |

#### Returns

[`ContentAny`](class.ContentAny.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentAny.d.ts:5

## Properties

### arr

> **arr**: `any`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentAny.d.ts:9

## Methods

### copy

> **copy**(): [`ContentAny`](class.ContentAny.md)

#### Returns

[`ContentAny`](class.ContentAny.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentAny.d.ts:25

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentAny.d.ts:44

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentAny.d.ts:48

***

### getContent

> **getContent**(): `any`[]

#### Returns

`any`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentAny.d.ts:17

***

### getLength

> **getLength**(): `number`

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentAny.d.ts:13

***

### getRef

> **getRef**(): `number`

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentAny.d.ts:57

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentAny.d.ts:40

***

### isCountable

> **isCountable**(): `boolean`

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentAny.d.ts:21

***

### mergeWith

> **mergeWith**(`right`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `right` | [`ContentAny`](class.ContentAny.md) |

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentAny.d.ts:35

***

### splice

> **splice**(`offset`): [`ContentAny`](class.ContentAny.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `offset` | `number` |

#### Returns

[`ContentAny`](class.ContentAny.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentAny.d.ts:30

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentAny.d.ts:53

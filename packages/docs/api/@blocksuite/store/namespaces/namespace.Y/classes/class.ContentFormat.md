[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > ContentFormat

# Class: ContentFormat

## Constructors

### constructor

> **new ContentFormat**(`key`, `value`): [`ContentFormat`](class.ContentFormat.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |
| `value` | `Object` |

#### Returns

[`ContentFormat`](class.ContentFormat.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:9

## Properties

### key

> **key**: `string`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:10

***

### value

> **value**: `Object`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:11

## Methods

### copy

> **copy**(): [`ContentFormat`](class.ContentFormat.md)

#### Returns

[`ContentFormat`](class.ContentFormat.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:27

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:46

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:50

***

### getContent

> **getContent**(): `any`[]

#### Returns

`any`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:19

***

### getLength

> **getLength**(): `number`

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:15

***

### getRef

> **getRef**(): `number`

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:59

***

### integrate

> **integrate**(`_transaction`, `item`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `_transaction` | [`Transaction`](class.Transaction.md) |
| `item` | [`Item`](class.Item.md) |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:42

***

### isCountable

> **isCountable**(): `boolean`

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:23

***

### mergeWith

> **mergeWith**(`_right`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `_right` | [`ContentFormat`](class.ContentFormat.md) |

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:37

***

### splice

> **splice**(`_offset`): [`ContentFormat`](class.ContentFormat.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `_offset` | `number` |

#### Returns

[`ContentFormat`](class.ContentFormat.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:32

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentFormat.d.ts:55

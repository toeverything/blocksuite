[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > ContentDoc

# Class: ContentDoc

## Constructors

### constructor

> **new ContentDoc**(`doc`): [`ContentDoc`](class.ContentDoc.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `doc` | [`Doc`](class.Doc.md) |

#### Returns

[`ContentDoc`](class.ContentDoc.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:8

## Properties

### doc

> **doc**: [`Doc`](class.Doc.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:12

***

### opts

> **opts**: `any`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:13

## Methods

### copy

> **copy**(): [`ContentDoc`](class.ContentDoc.md)

#### Returns

[`ContentDoc`](class.ContentDoc.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:29

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:48

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:52

***

### getContent

> **getContent**(): `any`[]

#### Returns

`any`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:21

***

### getLength

> **getLength**(): `number`

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:17

***

### getRef

> **getRef**(): `number`

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:61

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:44

***

### isCountable

> **isCountable**(): `boolean`

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:25

***

### mergeWith

> **mergeWith**(`right`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `right` | [`ContentDoc`](class.ContentDoc.md) |

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:39

***

### splice

> **splice**(`offset`): [`ContentDoc`](class.ContentDoc.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `offset` | `number` |

#### Returns

[`ContentDoc`](class.ContentDoc.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:34

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/structs/ContentDoc.d.ts:57

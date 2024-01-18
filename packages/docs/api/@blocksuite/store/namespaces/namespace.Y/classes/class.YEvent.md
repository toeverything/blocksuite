[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > YEvent

# Class: YEvent`<T>`

## Extended By

- [`YXmlEvent`](class.YXmlEvent.md)
- [`YMapEvent`](class.YMapEvent.md)
- [`YArrayEvent`](class.YArrayEvent.md)
- [`YTextEvent`](class.YTextEvent.md)

## Constructors

### constructor

> **new YEvent**<`T`>(`target`, `transaction`): [`YEvent`](class.YEvent.md)\< `T` \>

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* [`AbstractType`](class.AbstractType.md)\< `any` \> |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `target` | `T` | The changed type. |
| `transaction` | [`Transaction`](class.Transaction.md) | - |

#### Returns

[`YEvent`](class.YEvent.md)\< `T` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:10

## Properties

### \_changes

> **\_changes**: `null` \| `Object`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:29

***

### \_delta

> **\_delta**: `null` \| \{`attributes`: \{}; `delete`: `number`; `insert`: `string` \| `object` \| `any`[] \| [`AbstractType`](class.AbstractType.md)\< `any` \>; `retain`: `number`;}[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:41

***

### \_keys

> **\_keys**: `null` \| `Map`\< `string`, \{`action`: `"add"` \| `"update"` \| `"delete"`; `newValue`: `any`; `oldValue`: `any`;} \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:33

***

### \_path

> **\_path**: `null` \| (`string` \| `number`)[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:52

***

### currentTarget

> **currentTarget**: [`AbstractType`](class.AbstractType.md)\< `any` \>

The current target on which the observe callback is called.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:20

***

### target

> **target**: `T`

The type on which this event was created on.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:15

***

### transaction

> **transaction**: [`Transaction`](class.Transaction.md)

The transaction that triggered this event.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:25

## Accessors

### changes

> `get` changes(): `object`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:117

***

### delta

> `get` delta(): \{`attributes`: \{}; `delete`: `number`; `insert`: `string` \| `object` \| `any`[] \| [`AbstractType`](class.AbstractType.md)\< `any` \>; `retain`: `number`;}[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:92

***

### keys

> `get` keys(): `Map`\< `string`, \{`action`: `"add"` \| `"update"` \| `"delete"`; `newValue`: `any`; `oldValue`: `any`;} \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:79

***

### path

> `get` path(): (`string` \| `number`)[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:66

## Methods

### adds

> **adds**(`struct`): `boolean`

Check if a struct is added by this event.

In contrast to change.deleted, this method also returns true if the struct was added and then deleted.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `struct` | [`AbstractStruct`](class.AbstractStruct.md) |

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:108

***

### deletes

> **deletes**(`struct`): `boolean`

Check if a struct is deleted by this event.

In contrast to change.deleted, this method also returns true if the struct was added and then deleted.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `struct` | [`AbstractStruct`](class.AbstractStruct.md) |

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:75

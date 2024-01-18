[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > YTextEvent

# Class: YTextEvent

## Extends

- [`YEvent`](class.YEvent.md)\< [`Text`](class.Text.md) \>

## Constructors

### constructor

> **new YTextEvent**(
  `ytext`,
  `transaction`,
  `subs`): [`YTextEvent`](class.YTextEvent.md)

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `ytext` | [`Text`](class.Text.md) | - |
| `transaction` | [`Transaction`](class.Transaction.md) | - |
| `subs` | `Set`\< `any` \> | The keys that changed |

#### Returns

[`YTextEvent`](class.YTextEvent.md)

#### Overrides

[`YEvent`](class.YEvent.md).[`constructor`](class.YEvent.md#constructor)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:55

## Properties

### \_changes

> **\_changes**: `null` \| `Object`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:29

#### Inherited from

[`YEvent`](class.YEvent.md).[`_changes`](class.YEvent.md#_changes)

***

### \_delta

> **\_delta**: `null` \| \{`attributes`: \{}; `delete`: `number`; `insert`: `string` \| `object` \| `any`[] \| [`AbstractType`](class.AbstractType.md)\< `any` \>; `retain`: `number`;}[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:41

#### Inherited from

[`YEvent`](class.YEvent.md).[`_delta`](class.YEvent.md#_delta)

***

### \_keys

> **\_keys**: `null` \| `Map`\< `string`, \{`action`: `"add"` \| `"update"` \| `"delete"`; `newValue`: `any`; `oldValue`: `any`;} \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:33

#### Inherited from

[`YEvent`](class.YEvent.md).[`_keys`](class.YEvent.md#_keys)

***

### \_path

> **\_path**: `null` \| (`string` \| `number`)[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:52

#### Inherited from

[`YEvent`](class.YEvent.md).[`_path`](class.YEvent.md#_path)

***

### childListChanged

> `private` **childListChanged**: `any`

Whether the children changed.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:61

***

### currentTarget

> **currentTarget**: [`AbstractType`](class.AbstractType.md)\< `any` \>

The current target on which the observe callback is called.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:20

#### Inherited from

[`YEvent`](class.YEvent.md).[`currentTarget`](class.YEvent.md#currenttarget)

***

### keysChanged

> **keysChanged**: `Set`\< `string` \>

Set of all changed attributes.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:66

***

### target

> **target**: [`Text`](class.Text.md)

The type on which this event was created on.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:15

#### Inherited from

[`YEvent`](class.YEvent.md).[`target`](class.YEvent.md#target)

***

### transaction

> **transaction**: [`Transaction`](class.Transaction.md)

The transaction that triggered this event.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:25

#### Inherited from

[`YEvent`](class.YEvent.md).[`transaction`](class.YEvent.md#transaction)

## Accessors

### changes

> `get` changes(): `object`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:117

#### Inherited from

[`YEvent`](class.YEvent.md).[`changes`](class.YEvent.md#changes)

***

### delta

> `get` delta(): \{`attributes`: \{}; `delete`: `number`; `insert`: `string` \| `object` \| [`AbstractType`](class.AbstractType.md)\< `any` \>; `retain`: `number`;}[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:75

#### Overrides

[`YEvent`](class.YEvent.md).[`delta`](class.YEvent.md#delta)

***

### keys

> `get` keys(): `Map`\< `string`, \{`action`: `"add"` \| `"update"` \| `"delete"`; `newValue`: `any`; `oldValue`: `any`;} \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:79

#### Inherited from

[`YEvent`](class.YEvent.md).[`keys`](class.YEvent.md#keys)

***

### path

> `get` path(): (`string` \| `number`)[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:66

#### Inherited from

[`YEvent`](class.YEvent.md).[`path`](class.YEvent.md#path)

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

#### Inherited from

[`YEvent`](class.YEvent.md).[`adds`](class.YEvent.md#adds)

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

#### Inherited from

[`YEvent`](class.YEvent.md).[`deletes`](class.YEvent.md#deletes)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/YEvent.d.ts:75

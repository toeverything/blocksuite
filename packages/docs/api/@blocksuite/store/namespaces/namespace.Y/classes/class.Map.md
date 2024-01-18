[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > Map

# Class: Map`<MapType>`

## Implements

## Extends

- [`AbstractType`](class.AbstractType.md)\< [`YMapEvent`](class.YMapEvent.md)\< `MapType` \> \>

## Implements

- `Iterable`\< [`string`, `MapType`] \>

## Constructors

### constructor

> **new Map**<`MapType`>(`entries`?): [`Map`](class.Map.md)\< `MapType` \>

#### Type parameters

| Parameter |
| :------ |
| `MapType` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `entries`? | `Iterable`\< *readonly* [`string`, `any`] \> | an optional iterable to initialize the YMap |

#### Returns

[`Map`](class.Map.md)\< `MapType` \>

#### Overrides

[`AbstractType`](class.AbstractType.md).[`constructor`](class.AbstractType.md#constructor)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:27

## Properties

### \_dEH

> **\_dEH**: `EventHandler`\< [`YEvent`](class.YEvent.md)\< `any` \>[], [`Transaction`](class.Transaction.md) \>

Deep event handlers

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:46

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`_dEH`](class.AbstractType.md#_deh)

***

### \_eH

> **\_eH**: `EventHandler`\< [`YMapEvent`](class.YMapEvent.md)\< `MapType` \>, [`Transaction`](class.Transaction.md) \>

Event handlers

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:41

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`_eH`](class.AbstractType.md#_eh)

***

### \_item

> **\_item**: `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:23

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`_item`](class.AbstractType.md#_item)

***

### \_length

> **\_length**: `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:36

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`_length`](class.AbstractType.md#_length)

***

### \_map

> **\_map**: `Map`\< `string`, [`Item`](class.Item.md) \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:27

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`_map`](class.AbstractType.md#_map)

***

### \_prelimContent

> `private` **\_prelimContent**: `any`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:32

***

### \_searchMarker

> **\_searchMarker**: `null` \| `ArraySearchMarker`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:50

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`_searchMarker`](class.AbstractType.md#_searchmarker)

***

### \_start

> **\_start**: `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:31

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`_start`](class.AbstractType.md#_start)

***

### doc

> **doc**: `null` \| [`Doc`](class.Doc.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:35

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`doc`](class.AbstractType.md#doc)

## Accessors

### \_first

> `get` _first(): `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:81

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`_first`](class.AbstractType.md#_first)

***

### parent

> `get` parent(): `null` \| [`AbstractType`](class.AbstractType.md)\< `any` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:54

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`parent`](class.AbstractType.md#parent)

***

### size

> `get` size(): `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:65

## Methods

### [iterator]

> **[iterator]**(): `IterableIterator`\< [`string`, `MapType`] \>

Returns an Iterator of [key, value] pairs

#### Returns

`IterableIterator`\< [`string`, `MapType`] \>

#### Implementation of

Iterable.[iterator]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:128

***

### \_callObserver

> **\_callObserver**(`transaction`, `_parentSubs`): `void`

Creates YEvent and calls all type observers.
Must be implemented by each type.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `transaction` | [`Transaction`](class.Transaction.md) | - |
| `_parentSubs` | `Set`\< `null` \| `string` \> | Keys changed on this type. `null` if list was modified. |

#### Returns

`void`

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`_callObserver`](class.AbstractType.md#_callobserver)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:89

***

### \_copy

> **\_copy**(): [`Map`](class.Map.md)\< `MapType` \>

#### Returns

[`Map`](class.Map.md)\< `MapType` \>

#### Overrides

[`AbstractType`](class.AbstractType.md).[`_copy`](class.AbstractType.md#_copy)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:47

***

### \_integrate

> **\_integrate**(`y`, `item`): `void`

Integrate this type into the Yjs instance.

* Save this struct in the os
* This type is sent to other client
* Observer functions are fired

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `y` | [`Doc`](class.Doc.md) | The Yjs instance |
| `item` | [`Item`](class.Item.md) | - |

#### Returns

`void`

#### Overrides

[`AbstractType`](class.AbstractType.md).[`_integrate`](class.AbstractType.md#_integrate)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:43

***

### \_write

> **\_write**(`_encoder`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `_encoder` | [`UpdateEncoderV1`](class.UpdateEncoderV1.md) \| [`UpdateEncoderV2`](class.UpdateEncoderV2.md) |

#### Returns

`void`

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`_write`](class.AbstractType.md#_write)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:77

***

### clear

> **clear**(): `void`

Removes all elements from this YMap.

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:122

***

### clone

> **clone**(): [`Map`](class.Map.md)\< `MapType` \>

#### Returns

[`Map`](class.Map.md)\< `MapType` \>

#### Overrides

[`AbstractType`](class.AbstractType.md).[`clone`](class.AbstractType.md#clone)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:51

***

### delete

> **delete**(`key`): `void`

Remove a specified element from this YMap.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `key` | `string` | The key of the element to remove. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:95

***

### entries

> **entries**(): `IterableIterator`\< [`string`, `MapType`] \>

Returns an Iterator of [key, value] pairs

#### Returns

`IterableIterator`\< [`string`, `MapType`] \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:83

***

### forEach

> **forEach**(`f`): `void`

Executes a provided function on once on every key-value pair.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `f` | `function` | A function to execute on every element of this YArray. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:89

***

### get

> **get**(`key`): `undefined` \| `MapType`

Returns a specified element from this YMap.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`undefined` \| `MapType`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:111

***

### has

> **has**(`key`): `boolean`

Returns a boolean indicating whether the specified key exists or not.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `key` | `string` | The key to test. |

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:118

***

### keys

> **keys**(): `IterableIterator`\< `string` \>

Returns the keys for each element in the YMap Type.

#### Returns

`IterableIterator`\< `string` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:71

***

### observe

> **observe**(`f`): `void`

Observe all events that are created on this type.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `f` | `function` | Observer function |

#### Returns

`void`

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`observe`](class.AbstractType.md#observe)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:95

***

### observeDeep

> **observeDeep**(`f`): `void`

Observe all events that are created by this type and its children.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `f` | `function` | Observer function |

#### Returns

`void`

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`observeDeep`](class.AbstractType.md#observedeep)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:101

***

### set

> **set**<`VAL`>(`key`, `value`): `VAL`

Adds or updates an element with a specified key and value.

#### Type parameters

| Parameter |
| :------ |
| `VAL` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `key` | `string` | The key of the element to add to this YMap |
| `value` | `VAL` | The value of the element to add |

#### Returns

`VAL`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:104

***

### toJSON

> **toJSON**(): `object`

Transforms this Shared Type to a JSON object.

#### Returns

`object`

#### Overrides

[`AbstractType`](class.AbstractType.md).[`toJSON`](class.AbstractType.md#tojson)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:57

***

### unobserve

> **unobserve**(`f`): `void`

Unregister an observer function.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `f` | `function` | Observer function |

#### Returns

`void`

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`unobserve`](class.AbstractType.md#unobserve)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:107

***

### unobserveDeep

> **unobserveDeep**(`f`): `void`

Unregister an observer function.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `f` | `function` | Observer function |

#### Returns

`void`

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`unobserveDeep`](class.AbstractType.md#unobservedeep)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:113

***

### values

> **values**(): `IterableIterator`\< `MapType` \>

Returns the values for each element in the YMap Type.

#### Returns

`IterableIterator`\< `MapType` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:77

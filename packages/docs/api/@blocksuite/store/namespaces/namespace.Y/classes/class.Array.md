[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > Array

# Class: Array`<T>`

A shared Array implementation.

## Implements

## Extends

- [`AbstractType`](class.AbstractType.md)\< [`YArrayEvent`](class.YArrayEvent.md)\< `T` \> \>

## Implements

- `Iterable`\< `T` \>

## Constructors

### constructor

> **new Array**<`T`>(): [`Array`](class.Array.md)\< `T` \>

#### Type parameters

| Parameter |
| :------ |
| `T` |

#### Returns

[`Array`](class.Array.md)\< `T` \>

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`constructor`](class.AbstractType.md#constructor)

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

> **\_eH**: `EventHandler`\< [`YArrayEvent`](class.YArrayEvent.md)\< `T` \>, [`Transaction`](class.Transaction.md) \>

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:34

***

### \_searchMarker

> **\_searchMarker**: `ArraySearchMarker`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:38

#### Overrides

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

### length

> `get` length(): `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:58

***

### parent

> `get` parent(): `null` \| [`AbstractType`](class.AbstractType.md)\< `any` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:54

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`parent`](class.AbstractType.md#parent)

## Methods

### [iterator]

> **[iterator]**(): `IterableIterator`\< `T` \>

#### Returns

`IterableIterator`\< `T` \>

#### Implementation of

Iterable.[iterator]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:143

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

> **\_copy**(): [`Array`](class.Array.md)\< `T` \>

#### Returns

[`Array`](class.Array.md)\< `T` \>

#### Overrides

[`AbstractType`](class.AbstractType.md).[`_copy`](class.AbstractType.md#_copy)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:53

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:49

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

### clone

> **clone**(): [`Array`](class.Array.md)\< `T` \>

#### Returns

[`Array`](class.Array.md)\< `T` \>

#### Overrides

[`AbstractType`](class.AbstractType.md).[`clone`](class.AbstractType.md#clone)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:57

***

### delete

> **delete**(`index`, `length`?): `void`

Deletes elements starting from an index.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | Index at which to start deleting elements |
| `length`? | `number` | The number of elements to remove. Defaults to 1. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:96

***

### forEach

> **forEach**(`f`): `void`

Executes a provided function once on overy element of this YArray.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `f` | `function` | A function to execute on every element of this YArray. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:139

***

### get

> **get**(`index`): `T`

Returns the i-th element from a YArray.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | The index of the element to return from the YArray |

#### Returns

`T`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:103

***

### insert

> **insert**(`index`, `content`): `void`

Inserts new content at an index.

Important: This function expects an array of content. Not just a content
object. The reason for this "weirdness" is that inserting several elements
is very efficient when it is done as a single operation.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | The index to insert content at. |
| `content` | `T`[] | The array of content |

#### Returns

`void`

#### Example

```ts
// Insert character 'a' at position 0
 yarray.insert(0, ['a'])
 // Insert numbers 1, 2 at position 1
 yarray.insert(1, [1, 2])
```

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:75

***

### map

> **map**<`M`>(`f`): `M`[]

Returns an Array with the result of calling a provided function on every
element of this YArray.

#### Type parameters

| Parameter |
| :------ |
| `M` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `f` | `function` | Function that produces an element of the new Array |

#### Returns

`M`[]

A new array with each element being the result of the
                callback function

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:133

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

### push

> **push**(`content`): `void`

Appends content to this YArray.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `content` | `T`[] | Array of content to append. |

#### Returns

`void`

#### Todo

Use the following implementation in all types.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:83

***

### slice

> **slice**(`start`?, `end`?): `T`[]

Transforms this YArray to a JavaScript Array.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `start`? | `number` |
| `end`? | `number` |

#### Returns

`T`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:117

***

### toArray

> **toArray**(): `T`[]

Transforms this YArray to a JavaScript Array.

#### Returns

`T`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:109

***

### toJSON

> **toJSON**(): `any`[]

Transforms this Shared Type to a JSON object.

#### Returns

`any`[]

#### Overrides

[`AbstractType`](class.AbstractType.md).[`toJSON`](class.AbstractType.md#tojson)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:123

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

### unshift

> **unshift**(`content`): `void`

Preppends content to this YArray.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `content` | `T`[] | Array of content to preppend. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:89

***

### from

> `static` **from**<`T_1`>(`items`): [`Array`](class.Array.md)\< `T_1` \>

Construct a new YArray containing the specified items.

#### Type parameters

| Parameter |
| :------ |
| `T_1` *extends* `null` \| `string` \| `number` \| `any`[] \| `Uint8Array` \| \{} |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `items` | `T_1`[] |

#### Returns

[`Array`](class.Array.md)\< `T_1` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YArray.d.ts:27

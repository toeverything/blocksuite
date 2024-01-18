[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > XmlHook

# Class: XmlHook

You can manage binding to a custom type with YXmlHook.

## Extends

- [`Map`](class.Map.md)\< `any` \>

## Constructors

### constructor

> **new XmlHook**(`hookName`): [`XmlHook`](class.XmlHook.md)

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `hookName` | `string` | nodeName of the Dom Node. |

#### Returns

[`XmlHook`](class.XmlHook.md)

#### Overrides

[`Map`](class.Map.md).[`constructor`](class.Map.md#constructor)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlHook.d.ts:10

## Properties

### \_dEH

> **\_dEH**: `EventHandler`\< [`YEvent`](class.YEvent.md)\< `any` \>[], [`Transaction`](class.Transaction.md) \>

Deep event handlers

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:46

#### Inherited from

[`Map`](class.Map.md).[`_dEH`](class.Map.md#_deh)

***

### \_eH

> **\_eH**: `EventHandler`\< [`YMapEvent`](class.YMapEvent.md)\< `any` \>, [`Transaction`](class.Transaction.md) \>

Event handlers

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:41

#### Inherited from

[`Map`](class.Map.md).[`_eH`](class.Map.md#_eh)

***

### \_item

> **\_item**: `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:23

#### Inherited from

[`Map`](class.Map.md).[`_item`](class.Map.md#_item)

***

### \_length

> **\_length**: `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:36

#### Inherited from

[`Map`](class.Map.md).[`_length`](class.Map.md#_length)

***

### \_map

> **\_map**: `Map`\< `string`, [`Item`](class.Item.md) \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:27

#### Inherited from

[`Map`](class.Map.md).[`_map`](class.Map.md#_map)

***

### \_searchMarker

> **\_searchMarker**: `null` \| `ArraySearchMarker`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:50

#### Inherited from

[`Map`](class.Map.md).[`_searchMarker`](class.Map.md#_searchmarker)

***

### \_start

> **\_start**: `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:31

#### Inherited from

[`Map`](class.Map.md).[`_start`](class.Map.md#_start)

***

### doc

> **doc**: `null` \| [`Doc`](class.Doc.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:35

#### Inherited from

[`Map`](class.Map.md).[`doc`](class.Map.md#doc)

***

### hookName

> **hookName**: `string`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlHook.d.ts:14

## Accessors

### \_first

> `get` _first(): `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:81

#### Inherited from

[`Map`](class.Map.md).[`_first`](class.Map.md#_first)

***

### parent

> `get` parent(): `null` \| [`AbstractType`](class.AbstractType.md)\< `any` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:54

#### Inherited from

[`Map`](class.Map.md).[`parent`](class.Map.md#parent)

***

### size

> `get` size(): `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:65

#### Inherited from

[`Map`](class.Map.md).[`size`](class.Map.md#size)

## Methods

### [iterator]

> **[iterator]**(): `IterableIterator`\< [`string`, `any`] \>

Returns an Iterator of [key, value] pairs

#### Returns

`IterableIterator`\< [`string`, `any`] \>

#### Inherited from

[`Map`](class.Map.md).[`[iterator]`](class.Map.md#%5Biterator%5D)

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

[`Map`](class.Map.md).[`_callObserver`](class.Map.md#_callobserver)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:89

***

### \_copy

> **\_copy**(): [`XmlHook`](class.XmlHook.md)

Creates an Item with the same effect as this Item (without position effect)

#### Returns

[`XmlHook`](class.XmlHook.md)

#### Overrides

[`Map`](class.Map.md).[`_copy`](class.Map.md#_copy)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlHook.d.ts:18

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

#### Inherited from

[`Map`](class.Map.md).[`_integrate`](class.Map.md#_integrate)

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

[`Map`](class.Map.md).[`_write`](class.Map.md#_write)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:77

***

### clear

> **clear**(): `void`

Removes all elements from this YMap.

#### Returns

`void`

#### Inherited from

[`Map`](class.Map.md).[`clear`](class.Map.md#clear)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:122

***

### clone

> **clone**(): [`XmlHook`](class.XmlHook.md)

#### Returns

[`XmlHook`](class.XmlHook.md)

#### Overrides

[`Map`](class.Map.md).[`clone`](class.Map.md#clone)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlHook.d.ts:22

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

#### Inherited from

[`Map`](class.Map.md).[`delete`](class.Map.md#delete)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:95

***

### entries

> **entries**(): `IterableIterator`\< [`string`, `any`] \>

Returns an Iterator of [key, value] pairs

#### Returns

`IterableIterator`\< [`string`, `any`] \>

#### Inherited from

[`Map`](class.Map.md).[`entries`](class.Map.md#entries)

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

#### Inherited from

[`Map`](class.Map.md).[`forEach`](class.Map.md#foreach)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:89

***

### get

> **get**(`key`): `any`

Returns a specified element from this YMap.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`any`

#### Inherited from

[`Map`](class.Map.md).[`get`](class.Map.md#get)

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

#### Inherited from

[`Map`](class.Map.md).[`has`](class.Map.md#has)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:118

***

### keys

> **keys**(): `IterableIterator`\< `string` \>

Returns the keys for each element in the YMap Type.

#### Returns

`IterableIterator`\< `string` \>

#### Inherited from

[`Map`](class.Map.md).[`keys`](class.Map.md#keys)

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

[`Map`](class.Map.md).[`observe`](class.Map.md#observe)

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

[`Map`](class.Map.md).[`observeDeep`](class.Map.md#observedeep)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:101

***

### set

> **set**<`VAL`>(`key`, `value`): `VAL`

Adds or updates an element with a specified key and value.

#### Type parameters

| Parameter |
| :------ |
| `VAL` *extends* `any` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `key` | `string` | The key of the element to add to this YMap |
| `value` | `VAL` | The value of the element to add |

#### Returns

`VAL`

#### Inherited from

[`Map`](class.Map.md).[`set`](class.Map.md#set)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:104

***

### toDOM

> **toDOM**(
  `_document`?,
  `hooks`?,
  `binding`?): `Element`

Creates a Dom Element that mirrors this YXmlElement.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `_document`? | `Document` | The document object (you must define<br />                                       this when calling this method in<br />                                       nodejs) |
| `hooks`? | `object` | Optional property to customize how hooks<br />                                            are presented in the DOM |
| `binding`? | `any` | You should not set this property. This is<br />                              used if DomBinding wants to create a<br />                              association to the created DOM type |

#### Returns

`Element`

The [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlHook.d.ts:38

***

### toJSON

> **toJSON**(): `object`

Transforms this Shared Type to a JSON object.

#### Returns

`object`

#### Inherited from

[`Map`](class.Map.md).[`toJSON`](class.Map.md#tojson)

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

[`Map`](class.Map.md).[`unobserve`](class.Map.md#unobserve)

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

[`Map`](class.Map.md).[`unobserveDeep`](class.Map.md#unobservedeep)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:113

***

### values

> **values**(): `IterableIterator`\< `any` \>

Returns the values for each element in the YMap Type.

#### Returns

`IterableIterator`\< `any` \>

#### Inherited from

[`Map`](class.Map.md).[`values`](class.Map.md#values)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YMap.d.ts:77

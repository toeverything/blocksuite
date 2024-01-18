[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > Text

# Class: Text

Type that represents text with formatting information.

This type replaces y-richtext as this implementation is able to handle
block formats (format information on a paragraph), embeds (complex elements
like pictures and videos), and text formats (**bold**, *italic*).

## Extends

- [`AbstractType`](class.AbstractType.md)\< [`YTextEvent`](class.YTextEvent.md) \>

## Constructors

### constructor

> **new Text**(`string`?): [`Text`](class.Text.md)

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `string`? | `string` | The initial value of the YText. |

#### Returns

[`Text`](class.Text.md)

#### Overrides

[`AbstractType`](class.AbstractType.md).[`constructor`](class.AbstractType.md#constructor)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:97

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

> **\_eH**: `EventHandler`\< [`YTextEvent`](class.YTextEvent.md), [`Transaction`](class.Transaction.md) \>

Event handlers

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:41

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`_eH`](class.AbstractType.md#_eh)

***

### \_hasFormatting

> **\_hasFormatting**: `boolean`

Whether this YText contains formatting attributes.
This flag is updated when a formatting item is integrated (see ContentFormat.integrate)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:107

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

### \_pending

> **\_pending**: `null` \| () => `void`[]

Array of pending operations on this type

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:102

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

### length

> `get` length(): `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:113

***

### parent

> `get` parent(): `null` \| [`AbstractType`](class.AbstractType.md)\< `any` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:54

#### Inherited from

[`AbstractType`](class.AbstractType.md).[`parent`](class.AbstractType.md#parent)

## Methods

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

> **\_copy**(): [`Text`](class.Text.md)

#### Returns

[`Text`](class.Text.md)

#### Overrides

[`AbstractType`](class.AbstractType.md).[`_copy`](class.AbstractType.md#_copy)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:119

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:118

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

### applyDelta

> **applyDelta**(`delta`, `opts`?): `void`

Apply a Delta on this shared YText type.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `delta` | `any` | The changes to apply on this element. |
| `opts`? | `object` | - |
| `opts.sanitize`? | `boolean` | Sanitize input delta. Removes ending newlines if set to true. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:141

***

### clone

> **clone**(): [`Text`](class.Text.md)

#### Returns

[`Text`](class.Text.md)

#### Overrides

[`AbstractType`](class.AbstractType.md).[`clone`](class.AbstractType.md#clone)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:123

***

### delete

> **delete**(`index`, `length`): `void`

Deletes text starting from an index.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | Index at which to start deleting. |
| `length` | `number` | The number of characters to remove. Defaults to 1. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:185

***

### format

> **format**(
  `index`,
  `length`,
  `attributes`): `void`

Assigns properties to a range of text.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | The position where to start formatting. |
| `length` | `number` | The amount of characters to assign properties to. |
| `attributes` | `Object` | Attribute information to apply on the<br />                                   text. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:196

***

### getAttribute

> **getAttribute**(`attributeName`): `any`

Returns an attribute value that belongs to the attribute name.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `attributeName` | `string` | The attribute name that identifies the<br />                              queried value. |

#### Returns

`any`

The queried attribute value.

#### Note

Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:229

***

### getAttributes

> **getAttributes**(): `object`

Returns all attribute name/value pairs in a JSON Object.

#### Returns

`object`

A JSON Object that describes the attributes.

#### Note

Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:239

***

### insert

> **insert**(
  `index`,
  `text`,
  `attributes`?): `void`

Insert text at a given index.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | The index at which to start inserting. |
| `text` | `string` | The text to insert at the specified position. |
| `attributes`? | `Object` | Optionally define some formatting<br />                                   information to apply on the inserted<br />                                   Text. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:165

***

### insertEmbed

> **insertEmbed**(
  `index`,
  `embed`,
  `attributes`?): `void`

Inserts an embed at a index.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | The index to insert the embed at. |
| `embed` | `Object` \| [`AbstractType`](class.AbstractType.md)\< `any` \> | The Object that represents the embed. |
| `attributes`? | `Object` | Attribute information to apply on the<br />                                   embed |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:176

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

### removeAttribute

> **removeAttribute**(`attributeName`): `void`

Removes an attribute.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `attributeName` | `string` | The attribute name that is to be removed. |

#### Returns

`void`

#### Note

Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:206

***

### setAttribute

> **setAttribute**(`attributeName`, `attributeValue`): `void`

Sets or updates an attribute.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `attributeName` | `string` | The attribute name that is to be set. |
| `attributeValue` | `any` | The attribute value that is to be set. |

#### Returns

`void`

#### Note

Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:217

***

### toDelta

> **toDelta**(
  `snapshot`?,
  `prevSnapshot`?,
  `computeYChange`?): `any`

Returns the Delta representation of this YText type.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `snapshot`? | [`Snapshot`](class.Snapshot.md) |
| `prevSnapshot`? | [`Snapshot`](class.Snapshot.md) |
| `computeYChange`? | `function` |

#### Returns

`any`

The Delta representation of this type.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:154

***

### toJSON

> **toJSON**(): `string`

Returns the unformatted string representation of this YText type.

#### Returns

`string`

#### Overrides

[`AbstractType`](class.AbstractType.md).[`toJSON`](class.AbstractType.md#tojson)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:130

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

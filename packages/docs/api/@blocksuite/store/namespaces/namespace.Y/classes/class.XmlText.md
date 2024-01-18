[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > XmlText

# Class: XmlText

Represents text in a Dom Element. In the future this type will also handle
simple formatting information like bold and italic.

## Extends

- [`Text`](class.Text.md)

## Constructors

### constructor

> **new XmlText**(`string`?): [`XmlText`](class.XmlText.md)

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `string`? | `string` | The initial value of the YText. |

#### Returns

[`XmlText`](class.XmlText.md)

#### Inherited from

[`Text`](class.Text.md).[`constructor`](class.Text.md#constructor)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:97

## Properties

### \_dEH

> **\_dEH**: `EventHandler`\< [`YEvent`](class.YEvent.md)\< `any` \>[], [`Transaction`](class.Transaction.md) \>

Deep event handlers

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:46

#### Inherited from

[`Text`](class.Text.md).[`_dEH`](class.Text.md#_deh)

***

### \_eH

> **\_eH**: `EventHandler`\< [`YTextEvent`](class.YTextEvent.md), [`Transaction`](class.Transaction.md) \>

Event handlers

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:41

#### Inherited from

[`Text`](class.Text.md).[`_eH`](class.Text.md#_eh)

***

### \_hasFormatting

> **\_hasFormatting**: `boolean`

Whether this YText contains formatting attributes.
This flag is updated when a formatting item is integrated (see ContentFormat.integrate)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:107

#### Inherited from

[`Text`](class.Text.md).[`_hasFormatting`](class.Text.md#_hasformatting)

***

### \_item

> **\_item**: `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:23

#### Inherited from

[`Text`](class.Text.md).[`_item`](class.Text.md#_item)

***

### \_length

> **\_length**: `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:36

#### Inherited from

[`Text`](class.Text.md).[`_length`](class.Text.md#_length)

***

### \_map

> **\_map**: `Map`\< `string`, [`Item`](class.Item.md) \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:27

#### Inherited from

[`Text`](class.Text.md).[`_map`](class.Text.md#_map)

***

### \_pending

> **\_pending**: `null` \| () => `void`[]

Array of pending operations on this type

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:102

#### Inherited from

[`Text`](class.Text.md).[`_pending`](class.Text.md#_pending)

***

### \_searchMarker

> **\_searchMarker**: `null` \| `ArraySearchMarker`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:50

#### Inherited from

[`Text`](class.Text.md).[`_searchMarker`](class.Text.md#_searchmarker)

***

### \_start

> **\_start**: `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:31

#### Inherited from

[`Text`](class.Text.md).[`_start`](class.Text.md#_start)

***

### doc

> **doc**: `null` \| [`Doc`](class.Doc.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:35

#### Inherited from

[`Text`](class.Text.md).[`doc`](class.Text.md#doc)

## Accessors

### \_first

> `get` _first(): `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:81

#### Inherited from

[`Text`](class.Text.md).[`_first`](class.Text.md#_first)

***

### length

> `get` length(): `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:113

#### Inherited from

[`Text`](class.Text.md).[`length`](class.Text.md#length)

***

### nextSibling

> `get` nextSibling(): `null` \| [`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlText.d.ts:9

***

### parent

> `get` parent(): `null` \| [`AbstractType`](class.AbstractType.md)\< `any` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:54

#### Inherited from

[`Text`](class.Text.md).[`parent`](class.Text.md#parent)

***

### prevSibling

> `get` prevSibling(): `null` \| [`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlText.d.ts:15

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

[`Text`](class.Text.md).[`_callObserver`](class.Text.md#_callobserver)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:89

***

### \_copy

> **\_copy**(): [`XmlText`](class.XmlText.md)

#### Returns

[`XmlText`](class.XmlText.md)

#### Overrides

[`Text`](class.Text.md).[`_copy`](class.Text.md#_copy)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlText.d.ts:18

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

[`Text`](class.Text.md).[`_integrate`](class.Text.md#_integrate)

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

[`Text`](class.Text.md).[`_write`](class.Text.md#_write)

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

#### Inherited from

[`Text`](class.Text.md).[`applyDelta`](class.Text.md#applydelta)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:141

***

### clone

> **clone**(): [`XmlText`](class.XmlText.md)

#### Returns

[`XmlText`](class.XmlText.md)

#### Overrides

[`Text`](class.Text.md).[`clone`](class.Text.md#clone)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlText.d.ts:22

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

#### Inherited from

[`Text`](class.Text.md).[`delete`](class.Text.md#delete)

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

#### Inherited from

[`Text`](class.Text.md).[`format`](class.Text.md#format)

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

#### Inherited from

[`Text`](class.Text.md).[`getAttribute`](class.Text.md#getattribute)

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

#### Inherited from

[`Text`](class.Text.md).[`getAttributes`](class.Text.md#getattributes)

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

#### Inherited from

[`Text`](class.Text.md).[`insert`](class.Text.md#insert)

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

#### Inherited from

[`Text`](class.Text.md).[`insertEmbed`](class.Text.md#insertembed)

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

[`Text`](class.Text.md).[`observe`](class.Text.md#observe)

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

[`Text`](class.Text.md).[`observeDeep`](class.Text.md#observedeep)

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

#### Inherited from

[`Text`](class.Text.md).[`removeAttribute`](class.Text.md#removeattribute)

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

#### Inherited from

[`Text`](class.Text.md).[`setAttribute`](class.Text.md#setattribute)

#### Note

Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:217

***

### toDOM

> **toDOM**(
  `_document`?,
  `hooks`?,
  `binding`?): `Text`

Creates a Dom Element that mirrors this YXmlText.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `_document`? | `Document` | The document object (you must define<br />                                       this when calling this method in<br />                                       nodejs) |
| `hooks`? | `object` | Optional property to customize how hooks<br />                                            are presented in the DOM |
| `binding`? | `any` | You should not set this property. This is<br />                              used if DomBinding wants to create a<br />                              association to the created DOM type. |

#### Returns

`Text`

The [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlText.d.ts:38

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

#### Inherited from

[`Text`](class.Text.md).[`toDelta`](class.Text.md#todelta)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:154

***

### toJSON

> **toJSON**(): `string`

Returns the unformatted string representation of this YText type.

#### Returns

`string`

#### Inherited from

[`Text`](class.Text.md).[`toJSON`](class.Text.md#tojson)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YText.d.ts:130

***

### toString

> **toString**(): `any`

#### Returns

`any`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlText.d.ts:41

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

[`Text`](class.Text.md).[`unobserve`](class.Text.md#unobserve)

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

[`Text`](class.Text.md).[`unobserveDeep`](class.Text.md#unobservedeep)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:113

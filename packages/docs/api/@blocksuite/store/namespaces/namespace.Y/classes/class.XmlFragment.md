[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > XmlFragment

# Class: XmlFragment

Represents a list of [YXmlElement](class.XmlElement.md).and [YXmlText](class.XmlText.md) types.
A YxmlFragment is similar to a [YXmlElement](class.XmlElement.md), but it does not have a
nodeName and it does not have attributes. Though it can be bound to a DOM
element - in this case the attributes and the nodeName are not shared.

## Extends

- [`AbstractType`](class.AbstractType.md)\< [`YXmlEvent`](class.YXmlEvent.md) \>

## Constructors

### constructor

> **new XmlFragment**(): [`XmlFragment`](class.XmlFragment.md)

#### Returns

[`XmlFragment`](class.XmlFragment.md)

#### Overrides

[`AbstractType`](class.AbstractType.md).[`constructor`](class.AbstractType.md#constructor)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:64

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

> **\_eH**: `EventHandler`\< [`YXmlEvent`](class.YXmlEvent.md), [`Transaction`](class.Transaction.md) \>

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

> **\_prelimContent**: `null` \| `any`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:68

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

### firstChild

> `get` firstChild(): `null` \| [`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:72

***

### length

> `get` length(): `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:91

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

> **\_copy**(): [`XmlFragment`](class.XmlFragment.md)

#### Returns

[`XmlFragment`](class.XmlFragment.md)

#### Overrides

[`AbstractType`](class.AbstractType.md).[`_copy`](class.AbstractType.md#_copy)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:86

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:85

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

> **clone**(): [`XmlFragment`](class.XmlFragment.md)

#### Returns

[`XmlFragment`](class.XmlFragment.md)

#### Overrides

[`AbstractType`](class.AbstractType.md).[`clone`](class.AbstractType.md#clone)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:90

***

### createTreeWalker

> **createTreeWalker**(`filter`): `YXmlTreeWalker`

Create a subtree of childNodes.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `filter` | `function` | Function that is called on each child element and<br />                         returns a Boolean indicating whether the child<br />                         is to be included in the subtree. |

#### Returns

`YXmlTreeWalker`

A subtree and a position within it.

#### Example

```ts
const walker = elem.createTreeWalker(dom => dom.nodeName === 'div')
for (let node in walker) {
  // `node` is a div node
  nop(node)
}
```

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:109

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:188

***

### forEach

> **forEach**(`f`): `void`

Executes a provided function on once on overy child element.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `f` | `function` | A function to execute on every element of this YArray. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:227

***

### get

> **get**(`index`): [`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>

Returns the i-th element from a YArray.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | The index of the element to return from the YArray |

#### Returns

[`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:213

***

### insert

> **insert**(`index`, `content`): `void`

Inserts new content at an index.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | The index to insert content at |
| `content` | ([`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[] | The array of content |

#### Returns

`void`

#### Example

```ts
// Insert character 'a' at position 0
 xml.insert(0, [new Y.XmlText('text')])
```

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:170

***

### insertAfter

> **insertAfter**(`ref`, `content`): `void`

Inserts new content at an index.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `ref` | `null` \| [`Item`](class.Item.md) \| [`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \> | The index to insert content at |
| `content` | ([`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[] | The array of content |

#### Returns

`void`

#### Example

```ts
// Insert character 'a' at position 0
 xml.insert(0, [new Y.XmlText('text')])
```

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:181

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
| `content` | ([`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[] | Array of content to append. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:200

***

### querySelector

> **querySelector**(`query`): `null` \| [`XmlText`](class.XmlText.md) \| [`XmlHook`](class.XmlHook.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>

Returns the first YXmlElement that matches the query.
Similar to DOM's [querySelector](class.XmlFragment.md#queryselector).

Query support:
  - tagname
TODO:
  - id
  - attribute

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `query` | `string` | The query on the children. |

#### Returns

`null` \| [`XmlText`](class.XmlText.md) \| [`XmlHook`](class.XmlHook.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>

The first element that matches the query or null.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:125

***

### querySelectorAll

> **querySelectorAll**(`query`): (`null` \| [`XmlText`](class.XmlText.md) \| [`XmlHook`](class.XmlHook.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[]

Returns all YXmlElements that match the query.
Similar to Dom's [querySelectorAll](class.XmlFragment.md#queryselectorall).

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `query` | `string` | The query on the children |

#### Returns

(`null` \| [`XmlText`](class.XmlText.md) \| [`XmlHook`](class.XmlHook.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[]

The elements that match this query.

#### Todo

Does not yet support all queries. Currently only query by tagName.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:137

***

### slice

> **slice**(`start`?, `end`?): ([`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[]

Transforms this YArray to a JavaScript Array.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `start`? | `number` |
| `end`? | `number` |

#### Returns

([`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:221

***

### toArray

> **toArray**(): ([`XmlText`](class.XmlText.md) \| [`XmlHook`](class.XmlHook.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[]

Transforms this YArray to a JavaScript Array.

#### Returns

([`XmlText`](class.XmlText.md) \| [`XmlHook`](class.XmlHook.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:194

***

### toDOM

> **toDOM**(
  `_document`?,
  `hooks`?,
  `binding`?): `Node`

Creates a Dom Element that mirrors this YXmlElement.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `_document`? | `Document` | The document object (you must define<br />                                       this when calling this method in<br />                                       nodejs) |
| `hooks`? | `object` | Optional property to customize how hooks<br />                                            are presented in the DOM |
| `binding`? | `any` | You should not set this property. This is<br />                              used if DomBinding wants to create a<br />                              association to the created DOM type. |

#### Returns

`Node`

The [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:157

***

### toJSON

> **toJSON**(): `string`

#### Returns

`string`

#### Overrides

[`AbstractType`](class.AbstractType.md).[`toJSON`](class.AbstractType.md#tojson)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:141

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
| `content` | ([`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[] | Array of content to preppend. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:206

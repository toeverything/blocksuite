[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > XmlElement

# Class: XmlElement`<KV>`

An YXmlElement imitates the behavior of a
[Element](https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom).

* An YXmlElement has attributes (key value pairs)
* An YXmlElement has childElements that must inherit from YXmlElement

## Extends

- [`XmlFragment`](class.XmlFragment.md)

## Constructors

### constructor

> **new XmlElement**<`KV`>(`nodeName`?): [`XmlElement`](class.XmlElement.md)\< `KV` \>

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `KV` *extends* \{} | \{} |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `nodeName`? | `string` |

#### Returns

[`XmlElement`](class.XmlElement.md)\< `KV` \>

#### Overrides

[`XmlFragment`](class.XmlFragment.md).[`constructor`](class.XmlFragment.md#constructor)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlElement.d.ts:18

## Properties

### \_dEH

> **\_dEH**: `EventHandler`\< [`YEvent`](class.YEvent.md)\< `any` \>[], [`Transaction`](class.Transaction.md) \>

Deep event handlers

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:46

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`_dEH`](class.XmlFragment.md#_deh)

***

### \_eH

> **\_eH**: `EventHandler`\< [`YXmlEvent`](class.YXmlEvent.md), [`Transaction`](class.Transaction.md) \>

Event handlers

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:41

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`_eH`](class.XmlFragment.md#_eh)

***

### \_item

> **\_item**: `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:23

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`_item`](class.XmlFragment.md#_item)

***

### \_length

> **\_length**: `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:36

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`_length`](class.XmlFragment.md#_length)

***

### \_map

> **\_map**: `Map`\< `string`, [`Item`](class.Item.md) \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:27

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`_map`](class.XmlFragment.md#_map)

***

### \_prelimAttrs

> **\_prelimAttrs**: `null` \| `Map`\< `string`, `any` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlElement.d.ts:23

***

### \_prelimContent

> **\_prelimContent**: `null` \| `any`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:68

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`_prelimContent`](class.XmlFragment.md#_prelimcontent)

***

### \_searchMarker

> **\_searchMarker**: `null` \| `ArraySearchMarker`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:50

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`_searchMarker`](class.XmlFragment.md#_searchmarker)

***

### \_start

> **\_start**: `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:31

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`_start`](class.XmlFragment.md#_start)

***

### doc

> **doc**: `null` \| [`Doc`](class.Doc.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:35

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`doc`](class.XmlFragment.md#doc)

***

### nodeName

> **nodeName**: `string`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlElement.d.ts:19

## Accessors

### \_first

> `get` _first(): `null` \| [`Item`](class.Item.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:81

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`_first`](class.XmlFragment.md#_first)

***

### firstChild

> `get` firstChild(): `null` \| [`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:72

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`firstChild`](class.XmlFragment.md#firstchild)

***

### length

> `get` length(): `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:91

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`length`](class.XmlFragment.md#length)

***

### nextSibling

> `get` nextSibling(): `null` \| [`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlElement.d.ts:27

***

### parent

> `get` parent(): `null` \| [`AbstractType`](class.AbstractType.md)\< `any` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:54

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`parent`](class.XmlFragment.md#parent)

***

### prevSibling

> `get` prevSibling(): `null` \| [`XmlText`](class.XmlText.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlElement.d.ts:33

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

[`XmlFragment`](class.XmlFragment.md).[`_callObserver`](class.XmlFragment.md#_callobserver)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:89

***

### \_copy

> **\_copy**(): [`XmlElement`](class.XmlElement.md)\< \{} \>

Creates an Item with the same effect as this Item (without position effect)

#### Returns

[`XmlElement`](class.XmlElement.md)\< \{} \>

#### Overrides

[`XmlFragment`](class.XmlFragment.md).[`_copy`](class.XmlFragment.md#_copy)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlElement.d.ts:41

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

[`XmlFragment`](class.XmlFragment.md).[`_integrate`](class.XmlFragment.md#_integrate)

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

[`XmlFragment`](class.XmlFragment.md).[`_write`](class.XmlFragment.md#_write)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/AbstractType.d.ts:77

***

### clone

> **clone**(): [`XmlElement`](class.XmlElement.md)\< `KV` \>

#### Returns

[`XmlElement`](class.XmlElement.md)\< `KV` \>

#### Overrides

[`XmlFragment`](class.XmlFragment.md).[`clone`](class.XmlFragment.md#clone)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlElement.d.ts:45

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

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`createTreeWalker`](class.XmlFragment.md#createtreewalker)

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

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`delete`](class.XmlFragment.md#delete)

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

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`forEach`](class.XmlFragment.md#foreach)

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

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`get`](class.XmlFragment.md#get)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:213

***

### getAttribute

> **getAttribute**<`KEY_1`>(`attributeName`): `undefined` \| `KV`[`KEY_1`]

Returns an attribute value that belongs to the attribute name.

#### Type parameters

| Parameter |
| :------ |
| `KEY_1` *extends* `string` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `attributeName` | `KEY_1` | The attribute name that identifies the<br />                              queried value. |

#### Returns

`undefined` \| `KV`[`KEY_1`]

The queried attribute value.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlElement.d.ts:76

***

### getAttributes

> **getAttributes**(`snapshot`?): `{ [Key in string]?: KV[Key] }`

Returns all attribute name/value pairs in a JSON Object.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `snapshot`? | [`Snapshot`](class.Snapshot.md) |

#### Returns

`{ [Key in string]?: KV[Key] }`

A JSON Object that describes the attributes.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlElement.d.ts:94

***

### hasAttribute

> **hasAttribute**(`attributeName`): `boolean`

Returns whether an attribute exists

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `attributeName` | `string` | The attribute name to check for existence. |

#### Returns

`boolean`

whether the attribute exists.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlElement.d.ts:85

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

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`insert`](class.XmlFragment.md#insert)

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

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`insertAfter`](class.XmlFragment.md#insertafter)

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

[`XmlFragment`](class.XmlFragment.md).[`observe`](class.XmlFragment.md#observe)

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

[`XmlFragment`](class.XmlFragment.md).[`observeDeep`](class.XmlFragment.md#observedeep)

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

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`push`](class.XmlFragment.md#push)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:200

***

### querySelector

> **querySelector**(`query`): `null` \| [`XmlText`](class.XmlText.md) \| [`XmlHook`](class.XmlHook.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>

Returns the first YXmlElement that matches the query.
Similar to DOM's [querySelector](class.XmlElement.md#queryselector).

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

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`querySelector`](class.XmlFragment.md#queryselector)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:125

***

### querySelectorAll

> **querySelectorAll**(`query`): (`null` \| [`XmlText`](class.XmlText.md) \| [`XmlHook`](class.XmlHook.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[]

Returns all YXmlElements that match the query.
Similar to Dom's [querySelectorAll](class.XmlElement.md#queryselectorall).

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `query` | `string` | The query on the children |

#### Returns

(`null` \| [`XmlText`](class.XmlText.md) \| [`XmlHook`](class.XmlHook.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[]

The elements that match this query.

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`querySelectorAll`](class.XmlFragment.md#queryselectorall)

#### Todo

Does not yet support all queries. Currently only query by tagName.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:137

***

### removeAttribute

> **removeAttribute**(`attributeName`): `void`

Removes an attribute from this YXmlElement.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `attributeName` | `string` | The attribute name that is to be removed. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlElement.d.ts:53

***

### setAttribute

> **setAttribute**<`KEY`>(`attributeName`, `attributeValue`): `void`

Sets or updates an attribute.

#### Type parameters

| Parameter |
| :------ |
| `KEY` *extends* `string` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `attributeName` | `KEY` | The attribute name that is to be set. |
| `attributeValue` | `KV`[`KEY`] | The attribute value that is to be set. |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlElement.d.ts:64

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

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`slice`](class.XmlFragment.md#slice)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:221

***

### toArray

> **toArray**(): ([`XmlText`](class.XmlText.md) \| [`XmlHook`](class.XmlHook.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[]

Transforms this YArray to a JavaScript Array.

#### Returns

([`XmlText`](class.XmlText.md) \| [`XmlHook`](class.XmlHook.md) \| [`XmlElement`](class.XmlElement.md)\< \{} \>)[]

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`toArray`](class.XmlFragment.md#toarray)

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

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`toDOM`](class.XmlFragment.md#todom)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:157

***

### toJSON

> **toJSON**(): `string`

#### Returns

`string`

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`toJSON`](class.XmlFragment.md#tojson)

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

[`XmlFragment`](class.XmlFragment.md).[`unobserve`](class.XmlFragment.md#unobserve)

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

[`XmlFragment`](class.XmlFragment.md).[`unobserveDeep`](class.XmlFragment.md#unobservedeep)

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

#### Inherited from

[`XmlFragment`](class.XmlFragment.md).[`unshift`](class.XmlFragment.md#unshift)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/types/YXmlFragment.d.ts:206

[API](../../../index.md) > [@blocksuite/store](../index.md) > BlockSuiteDoc

# Class: BlockSuiteDoc

A Yjs instance handles the state of shared data.

## Extends

- [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md)

## Constructors

### constructor

> **new BlockSuiteDoc**(`opts`?): [`BlockSuiteDoc`](class.BlockSuiteDoc.md)

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `opts`? | `DocOpts` | configuration |

#### Returns

[`BlockSuiteDoc`](class.BlockSuiteDoc.md)

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`constructor`](../namespaces/namespace.Y/classes/class.Doc.md#constructor)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:20

## Properties

### \_item

> **\_item**: `null` \| [`Item`](../namespaces/namespace.Y/classes/class.Item.md)

If this document is a subdocument - a document integrated into another document - then _item is defined.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:47

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`_item`](../namespaces/namespace.Y/classes/class.Doc.md#_item)

***

### \_observers

> **\_observers**: `Map`\< `string`, `any` \>

Some desc.

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:58

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`_observers`](../namespaces/namespace.Y/classes/class.Doc.md#_observers)

***

### \_spaces

> `private` **\_spaces**: [`Map`](../namespaces/namespace.Y/classes/class.Map.md)\< [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md) \>

#### Defined In

[packages/store/src/yjs/doc.ts:13](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/doc.ts#L13)

***

### \_transaction

> **\_transaction**: `null` \| [`Transaction`](../namespaces/namespace.Y/classes/class.Transaction.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:34

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`_transaction`](../namespaces/namespace.Y/classes/class.Doc.md#_transaction)

***

### \_transactionCleanups

> **\_transactionCleanups**: [`Transaction`](../namespaces/namespace.Y/classes/class.Transaction.md)[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:38

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`_transactionCleanups`](../namespaces/namespace.Y/classes/class.Doc.md#_transactioncleanups)

***

### autoLoad

> **autoLoad**: `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:49

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`autoLoad`](../namespaces/namespace.Y/classes/class.Doc.md#autoload)

***

### clientID

> **clientID**: `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:23

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`clientID`](../namespaces/namespace.Y/classes/class.Doc.md#clientid)

***

### collectionid

> **collectionid**: `null` \| `string`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:25

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`collectionid`](../namespaces/namespace.Y/classes/class.Doc.md#collectionid)

***

### gc

> **gc**: `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:21

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`gc`](../namespaces/namespace.Y/classes/class.Doc.md#gc)

***

### gcFilter

> **gcFilter**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `arg0` | [`Item`](../namespaces/namespace.Y/classes/class.Item.md) |

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:22

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`gcFilter`](../namespaces/namespace.Y/classes/class.Doc.md#gcfilter)

***

### guid

> **guid**: `string`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:24

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`guid`](../namespaces/namespace.Y/classes/class.Doc.md#guid)

***

### isLoaded

> **isLoaded**: `boolean`

This is set to true when the persistence provider loaded the document from the database or when the `sync` event fires.
Note that not all providers implement this feature. Provider authors are encouraged to fire the `load` event when the doc content is loaded from the database.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:57

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`isLoaded`](../namespaces/namespace.Y/classes/class.Doc.md#isloaded)

***

### isSynced

> **isSynced**: `boolean`

This is set to true when the connection provider has successfully synced with a backend.
Note that when using peer-to-peer providers this event may not provide very useful.
Also note that not all providers implement this feature. Provider authors are encouraged to fire
the `sync` event when the doc has been synced (with `true` as a parameter) or if connection is
lost (with false as a parameter).

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:65

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`isSynced`](../namespaces/namespace.Y/classes/class.Doc.md#issynced)

***

### meta

> **meta**: `any`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:50

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`meta`](../namespaces/namespace.Y/classes/class.Doc.md#meta)

***

### share

> **share**: `Map`\< `string`, [`AbstractType`](../namespaces/namespace.Y/classes/class.AbstractType.md)\< [`YEvent`](../namespaces/namespace.Y/classes/class.YEvent.md)\< `any` \> \> \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:29

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`share`](../namespaces/namespace.Y/classes/class.Doc.md#share)

***

### shouldLoad

> **shouldLoad**: `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:48

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`shouldLoad`](../namespaces/namespace.Y/classes/class.Doc.md#shouldload)

***

### store

> **store**: `StructStore`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:30

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`store`](../namespaces/namespace.Y/classes/class.Doc.md#store)

***

### subdocs

> **subdocs**: `Set`\< [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md) \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:42

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`subdocs`](../namespaces/namespace.Y/classes/class.Doc.md#subdocs)

***

### whenLoaded

> **whenLoaded**: `Promise`\< `any` \>

Promise that resolves once the document has been loaded from a presistence provider.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:69

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`whenLoaded`](../namespaces/namespace.Y/classes/class.Doc.md#whenloaded)

***

### whenSynced

> **whenSynced**: `Promise`\< `any` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:70

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`whenSynced`](../namespaces/namespace.Y/classes/class.Doc.md#whensynced)

## Accessors

### spaces

> `get` spaces(): [`Map`](../namespaces/namespace.Y/classes/class.Map.md)\< [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md) \>

#### Defined In

[packages/store/src/yjs/doc.ts:15](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/doc.ts#L15)

## Methods

### destroy

> **destroy**(): `void`

#### Returns

`void`

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`destroy`](../namespaces/namespace.Y/classes/class.Doc.md#destroy)

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:84

***

### emit

> **emit**(`name`, `args`): `void`

Emit a named event. All registered event listeners that listen to the
specified name will receive the event.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The event name. |
| `args` | `any`[] | The arguments that are applied to the event listener. |

#### Returns

`void`

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`emit`](../namespaces/namespace.Y/classes/class.Doc.md#emit)

#### Todo

This should catch exceptions

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:83

***

### get

> **get**(`name`, `TypeConstructor`?): [`AbstractType`](../namespaces/namespace.Y/classes/class.AbstractType.md)\< `any` \>

Define a shared data type.

Multiple calls of `y.get(name, TypeConstructor)` yield the same result
and do not overwrite each other. I.e.
`y.define(name, Y.Array) === y.define(name, Y.Array)`

After this method is called, the type is also available on `y.share.get(name)`.

*Best Practices:*
Define all types right after the Yjs instance is created and store them in a separate object.
Also use the typed methods `getText(name)`, `getArray(name)`, ..

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | - |
| `TypeConstructor`? | `Function` | The constructor of the type definition. E.g. Y.Text, Y.Array, Y.Map, ... |

#### Returns

[`AbstractType`](../namespaces/namespace.Y/classes/class.AbstractType.md)\< `any` \>

The created type. Constructed with TypeConstructor

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`get`](../namespaces/namespace.Y/classes/class.Doc.md#get)

#### Example

```ts
const y = new Y(..)
  const appState = {
    document: y.getText('document')
    comments: y.getArray('comments')
  }
```

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:121

***

### getArray

> **getArray**<`T_1`>(`name`?): [`Array`](../namespaces/namespace.Y/classes/class.Array.md)\< `T_1` \>

#### Type parameters

| Parameter |
| :------ |
| `T_1` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name`? | `string` |

#### Returns

[`Array`](../namespaces/namespace.Y/classes/class.Array.md)\< `T_1` \>

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`getArray`](../namespaces/namespace.Y/classes/class.Doc.md#getarray)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:129

***

### getArrayProxy

> **getArrayProxy**<`Key`, `Value`>(`key`): `Value`

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `Key` *extends* `string` | - |
| `Value` *extends* `unknown`[] | `never` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `Key` |

#### Returns

`Value`

#### Defined In

[packages/store/src/yjs/doc.ts:46](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/doc.ts#L46)

***

### getMap

> **getMap**<`T_2`>(`name`?): [`Map`](../namespaces/namespace.Y/classes/class.Map.md)\< `T_2` \>

#### Type parameters

| Parameter |
| :------ |
| `T_2` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name`? | `string` |

#### Returns

[`Map`](../namespaces/namespace.Y/classes/class.Map.md)\< `T_2` \>

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`getMap`](../namespaces/namespace.Y/classes/class.Doc.md#getmap)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:144

***

### getMapProxy

> **getMapProxy**<`Key`, `Value`>(`key`): `Value`

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `Key` *extends* `string` | - |
| `Value` *extends* `Record`\< `string`, `unknown` \> | `never` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `Key` |

#### Returns

`Value`

#### Defined In

[packages/store/src/yjs/doc.ts:33](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/doc.ts#L33)

***

### getSubdocGuids

> **getSubdocGuids**(): `Set`\< `string` \>

#### Returns

`Set`\< `string` \>

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`getSubdocGuids`](../namespaces/namespace.Y/classes/class.Doc.md#getsubdocguids)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:80

***

### getSubdocs

> **getSubdocs**(): `Set`\< [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md) \>

#### Returns

`Set`\< [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md) \>

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`getSubdocs`](../namespaces/namespace.Y/classes/class.Doc.md#getsubdocs)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:79

***

### getText

> **getText**(`name`?): [`Text`](../namespaces/namespace.Y/classes/class.Text.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name`? | `string` |

#### Returns

[`Text`](../namespaces/namespace.Y/classes/class.Text.md)

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`getText`](../namespaces/namespace.Y/classes/class.Doc.md#gettext)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:136

***

### getXmlFragment

> **getXmlFragment**(`name`?): [`XmlFragment`](../namespaces/namespace.Y/classes/class.XmlFragment.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name`? | `string` |

#### Returns

[`XmlFragment`](../namespaces/namespace.Y/classes/class.XmlFragment.md)

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`getXmlFragment`](../namespaces/namespace.Y/classes/class.Doc.md#getxmlfragment)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:151

***

### load

> **load**(): `void`

Notify the parent document that you request to load data into this subdocument (if it is a subdocument).

`load()` might be used in the future to request any provider to load the most current data.

It is safe to call `load()` multiple times.

#### Returns

`void`

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`load`](../namespaces/namespace.Y/classes/class.Doc.md#load)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:78

***

### off

> **off**(`name`, `f`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `string` |
| `f` | `Function` |

#### Returns

`void`

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`off`](../namespaces/namespace.Y/classes/class.Doc.md#off)

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:73

***

### on

> **on**(`eventName`, `f`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `eventName` | `string` |
| `f` | `function` |

#### Returns

`void`

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`on`](../namespaces/namespace.Y/classes/class.Doc.md#on)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:167

***

### once

> **once**(`name`, `f`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `string` |
| `f` | `Function` |

#### Returns

`void`

#### Inherited from

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`once`](../namespaces/namespace.Y/classes/class.Doc.md#once)

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:68

***

### toJSON

> **toJSON**(): `Record`\< `string`, `any` \>

Converts the entire document into a js object, recursively traversing each yjs type
Doesn't log types that have not been defined (using ydoc.getType(..)).

#### Returns

`Record`\< `string`, `any` \>

#### Overrides

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`toJSON`](../namespaces/namespace.Y/classes/class.Doc.md#tojson)

#### Deprecated

Do not use this method and rather call toJSON directly on the shared types.

#### Defined In

[packages/store/src/yjs/doc.ts:20](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/doc.ts#L20)

***

### transact

> **transact**<`T`>(`f`, `origin`?): `T`

Changes that happen inside of a transaction are bundled. This means that
the observer fires _after_ the transaction is finished and that all changes
that happened inside of the transaction are sent as one message to the
other peers.

#### Type parameters

| Parameter |
| :------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `f` | `function` | The function that should be executed as a transaction |
| `origin`? | `string` \| `number` | Origin of who started the transaction. Will be stored on transaction.origin |

#### Returns

`T`

T

#### Overrides

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md).[`transact`](../namespaces/namespace.Y/classes/class.Doc.md#transact)

#### Defined In

[packages/store/src/yjs/doc.ts:56](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/doc.ts#L56)

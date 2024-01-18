[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > Doc

# Class: Doc

A Yjs instance handles the state of shared data.

## Extends

- `Observable`\< `string` \>

## Constructors

### constructor

> **new Doc**(`opts`?): [`Doc`](class.Doc.md)

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `opts`? | `DocOpts` | configuration |

#### Returns

[`Doc`](class.Doc.md)

#### Overrides

Observable\<string\>.constructor

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:20

## Properties

### \_item

> **\_item**: `null` \| [`Item`](class.Item.md)

If this document is a subdocument - a document integrated into another document - then _item is defined.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:47

***

### \_observers

> **\_observers**: `Map`\< `string`, `any` \>

Some desc.

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:58

#### Inherited from

Observable.\_observers

***

### \_transaction

> **\_transaction**: `null` \| [`Transaction`](class.Transaction.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:34

***

### \_transactionCleanups

> **\_transactionCleanups**: [`Transaction`](class.Transaction.md)[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:38

***

### autoLoad

> **autoLoad**: `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:49

***

### clientID

> **clientID**: `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:23

***

### collectionid

> **collectionid**: `null` \| `string`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:25

***

### gc

> **gc**: `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:21

***

### gcFilter

> **gcFilter**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `arg0` | [`Item`](class.Item.md) |

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:22

***

### guid

> **guid**: `string`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:24

***

### isLoaded

> **isLoaded**: `boolean`

This is set to true when the persistence provider loaded the document from the database or when the `sync` event fires.
Note that not all providers implement this feature. Provider authors are encouraged to fire the `load` event when the doc content is loaded from the database.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:57

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

***

### meta

> **meta**: `any`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:50

***

### share

> **share**: `Map`\< `string`, [`AbstractType`](class.AbstractType.md)\< [`YEvent`](class.YEvent.md)\< `any` \> \> \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:29

***

### shouldLoad

> **shouldLoad**: `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:48

***

### store

> **store**: `StructStore`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:30

***

### subdocs

> **subdocs**: `Set`\< [`Doc`](class.Doc.md) \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:42

***

### whenLoaded

> **whenLoaded**: `Promise`\< `any` \>

Promise that resolves once the document has been loaded from a presistence provider.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:69

***

### whenSynced

> **whenSynced**: `Promise`\< `any` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:70

## Methods

### destroy

> **destroy**(): `void`

#### Returns

`void`

#### Inherited from

Observable.destroy

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

Observable.emit

#### Todo

This should catch exceptions

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:83

***

### get

> **get**(`name`, `TypeConstructor`?): [`AbstractType`](class.AbstractType.md)\< `any` \>

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

[`AbstractType`](class.AbstractType.md)\< `any` \>

The created type. Constructed with TypeConstructor

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

> **getArray**<`T_1`>(`name`?): [`Array`](class.Array.md)\< `T_1` \>

#### Type parameters

| Parameter |
| :------ |
| `T_1` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name`? | `string` |

#### Returns

[`Array`](class.Array.md)\< `T_1` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:129

***

### getMap

> **getMap**<`T_2`>(`name`?): [`Map`](class.Map.md)\< `T_2` \>

#### Type parameters

| Parameter |
| :------ |
| `T_2` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name`? | `string` |

#### Returns

[`Map`](class.Map.md)\< `T_2` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:144

***

### getSubdocGuids

> **getSubdocGuids**(): `Set`\< `string` \>

#### Returns

`Set`\< `string` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:80

***

### getSubdocs

> **getSubdocs**(): `Set`\< [`Doc`](class.Doc.md) \>

#### Returns

`Set`\< [`Doc`](class.Doc.md) \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:79

***

### getText

> **getText**(`name`?): [`Text`](class.Text.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name`? | `string` |

#### Returns

[`Text`](class.Text.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:136

***

### getXmlFragment

> **getXmlFragment**(`name`?): [`XmlFragment`](class.XmlFragment.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name`? | `string` |

#### Returns

[`XmlFragment`](class.XmlFragment.md)

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

Observable.off

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

#### Overrides

Observable.on

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

Observable.once

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:68

***

### toJSON

> **toJSON**(): `object`

Converts the entire document into a js object, recursively traversing each yjs type
Doesn't log types that have not been defined (using ydoc.getType(..)).

#### Returns

`object`

#### Deprecated

Do not use this method and rather call toJSON directly on the shared types.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:160

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
| `origin`? | `any` | Origin of who started the transaction. Will be stored on transaction.origin |

#### Returns

`T`

T

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Doc.d.ts:94

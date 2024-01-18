[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > Transaction

# Class: Transaction

A transaction is created for every change on the Yjs model. It is possible
to bundle changes on the Yjs model in a single transaction to
minimize the number on messages sent and the number of observer calls.
If possible the user of this library should bundle as many changes as
possible. Here is an example to illustrate the advantages of bundling:

## Example

```ts
const map = y.define('map', YMap)
// Log content when change is triggered
map.observe(() => {
  console.log('change triggered')
})
// Each change on the map type triggers a log message:
map.set('a', 0) // => "change triggered"
map.set('b', 0) // => "change triggered"
// When put in a transaction, it will trigger the log after the transaction:
y.transact(() => {
  map.set('a', 1)
  map.set('b', 1)
}) // => "change triggered"

@public
```

## Constructors

### constructor

> **new Transaction**(
  `doc`,
  `origin`,
  `local`): [`Transaction`](class.Transaction.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `doc` | [`Doc`](class.Doc.md) |
| `origin` | `any` |
| `local` | `boolean` |

#### Returns

[`Transaction`](class.Transaction.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:31

## Properties

### \_mergeStructs

> **\_mergeStructs**: [`AbstractStruct`](class.AbstractStruct.md)[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:68

***

### \_needFormattingCleanup

> **\_needFormattingCleanup**: `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:98

***

### afterState

> **afterState**: `Map`\< `number`, `number` \>

Holds the state after the transaction.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:51

***

### beforeState

> **beforeState**: `Map`\< `number`, `number` \>

Holds the state before the transaction started.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:46

***

### changed

> **changed**: `Map`\< [`AbstractType`](class.AbstractType.md)\< [`YEvent`](class.YEvent.md)\< `any` \> \>, `Set`\< `null` \| `string` \> \>

All types that were directly modified (property added or child
inserted/deleted). New types are not included in this Set.
Maps from type to parentSubs (`item.parentSub = null` for YArray)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:58

***

### changedParentTypes

> **changedParentTypes**: `Map`\< [`AbstractType`](class.AbstractType.md)\< [`YEvent`](class.YEvent.md)\< `any` \> \>, [`YEvent`](class.YEvent.md)\< `any` \>[] \>

Stores the events for the types that observe also child elements.
It is mainly used by `observeDeep`.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:64

***

### deleteSet

> **deleteSet**: `DeleteSet`

Describes the set of deleted items by ids

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:41

***

### doc

> **doc**: [`Doc`](class.Doc.md)

The Yjs instance.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:36

***

### local

> **local**: `boolean`

Whether this change originates from this doc.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:82

***

### meta

> **meta**: `Map`\< `any`, `any` \>

Stores meta information on the transaction

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:77

***

### origin

> **origin**: `any`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:72

***

### subdocsAdded

> **subdocsAdded**: `Set`\< [`Doc`](class.Doc.md) \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:86

***

### subdocsLoaded

> **subdocsLoaded**: `Set`\< [`Doc`](class.Doc.md) \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:94

***

### subdocsRemoved

> **subdocsRemoved**: `Set`\< [`Doc`](class.Doc.md) \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/Transaction.d.ts:90

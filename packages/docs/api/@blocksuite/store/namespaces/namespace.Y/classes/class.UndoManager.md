[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > UndoManager

# Class: UndoManager

Fires 'stack-item-added' event when a stack item was added to either the undo- or
the redo-stack. You may store additional stack information via the
metadata property on `event.stackItem.meta` (it is a `Map` of metadata properties).
Fires 'stack-item-popped' event when a stack item was popped from either the
undo- or the redo-stack. You may restore the saved stack information from `event.stackItem.meta`.

## Extends

- `Observable`\< `"stack-item-added"` \| `"stack-item-popped"` \| `"stack-cleared"` \| `"stack-item-updated"` \>

## Constructors

### constructor

> **new UndoManager**(`typeScope`, `options`?): [`UndoManager`](class.UndoManager.md)

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `typeScope` | [`AbstractType`](class.AbstractType.md)\< `any` \> \| [`AbstractType`](class.AbstractType.md)\< `any` \>[] | Accepts either a single type, or an array of types |
| `options`? | `UndoManagerOptions` | - |

#### Returns

[`UndoManager`](class.UndoManager.md)

#### Overrides

Observable\<"stack-item-added" \| "stack-item-popped" \| "stack-cleared" \| "stack-item-updated"\>.constructor

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:40

## Properties

### \_observers

> **\_observers**: `Map`\< `"stack-item-added"` \| `"stack-item-popped"` \| `"stack-cleared"` \| `"stack-item-updated"`, `any` \>

Some desc.

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:58

#### Inherited from

Observable.\_observers

***

### afterTransactionHandler

> **afterTransactionHandler**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `transaction` | [`Transaction`](class.Transaction.md) |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:70

***

### captureTimeout

> **captureTimeout**: `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:66

***

### captureTransaction

> **captureTransaction**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `arg0` | [`Transaction`](class.Transaction.md) |

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:48

***

### deleteFilter

> **deleteFilter**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `arg0` | [`Item`](class.Item.md) |

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:46

***

### doc

> **doc**: [`Doc`](class.Doc.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:45

***

### ignoreRemoteMapChanges

> **ignoreRemoteMapChanges**: `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:65

***

### lastChange

> **lastChange**: `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:64

***

### redoStack

> **redoStack**: `StackItem`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:56

***

### redoing

> **redoing**: `boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:63

***

### scope

> **scope**: [`AbstractType`](class.AbstractType.md)\< `any` \>[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:44

***

### trackedOrigins

> **trackedOrigins**: `Set`\< `any` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:47

***

### undoStack

> **undoStack**: `StackItem`[]

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:52

***

### undoing

> **undoing**: `boolean`

Whether the client is currently undoing (calling UndoManager.undo)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:62

## Methods

### addToScope

> **addToScope**(`ytypes`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `ytypes` | [`AbstractType`](class.AbstractType.md)\< `any` \> \| [`AbstractType`](class.AbstractType.md)\< `any` \>[] |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:74

***

### addTrackedOrigin

> **addTrackedOrigin**(`origin`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `origin` | `any` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:78

***

### canRedo

> **canRedo**(): `boolean`

Are redo steps available?

#### Returns

`boolean`

`true` if redo is possible

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:128

***

### canUndo

> **canUndo**(): `boolean`

Are undo steps available?

#### Returns

`boolean`

`true` if undo is possible

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:122

***

### clear

> **clear**(`clearUndoStack`?, `clearRedoStack`?): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `clearUndoStack`? | `boolean` |
| `clearRedoStack`? | `boolean` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:83

***

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
| `name` | `"stack-item-added"` \| `"stack-item-popped"` \| `"stack-cleared"` \| `"stack-item-updated"` | The event name. |
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

### off

> **off**(`name`, `f`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `"stack-item-added"` \| `"stack-item-popped"` \| `"stack-cleared"` \| `"stack-item-updated"` |
| `f` | `Function` |

#### Returns

`void`

#### Inherited from

Observable.off

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:73

***

### on

> **on**(`name`, `f`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `"stack-item-added"` \| `"stack-item-popped"` \| `"stack-cleared"` \| `"stack-item-updated"` |
| `f` | `Function` |

#### Returns

`void`

#### Inherited from

Observable.on

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:63

***

### once

> **once**(`name`, `f`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `"stack-item-added"` \| `"stack-item-popped"` \| `"stack-cleared"` \| `"stack-item-updated"` |
| `f` | `Function` |

#### Returns

`void`

#### Inherited from

Observable.once

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:68

***

### redo

> **redo**(): `null` \| `StackItem`

Redo last undo operation.

#### Returns

`null` \| `StackItem`

Returns StackItem if a change was applied

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:116

***

### removeTrackedOrigin

> **removeTrackedOrigin**(`origin`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `origin` | `any` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:82

***

### stopCapturing

> **stopCapturing**(): `void`

UndoManager merges Undo-StackItem if they are created within time-gap
smaller than `options.captureTimeout`. Call `um.stopCapturing()` so that the next
StackItem won't be merged.

#### Returns

`void`

#### Example

```ts
// without stopCapturing
    ytext.insert(0, 'a')
    ytext.insert(1, 'b')
    um.undo()
    ytext.toString() // => '' (note that 'ab' was removed)
    // with stopCapturing
    ytext.insert(0, 'a')
    um.stopCapturing()
    ytext.insert(0, 'b')
    um.undo()
    ytext.toString() // => 'a' (note that only 'b' was removed)
```

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:104

***

### undo

> **undo**(): `null` \| `StackItem`

Undo last changes on type.

#### Returns

`null` \| `StackItem`

Returns StackItem if a change was applied

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UndoManager.d.ts:110

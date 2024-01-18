[API](../../../index.md) > [@blocksuite/block-std](../index.md) > ClipboardEventState

# Class: ClipboardEventState

## Extends

- [`UIEventState`](class.UIEventState.md)

## Constructors

### constructor

> **new ClipboardEventState**(`__namedParameters`): [`ClipboardEventState`](class.ClipboardEventState.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | `ClipboardEventStateOptions` |

#### Returns

[`ClipboardEventState`](class.ClipboardEventState.md)

#### Overrides

[`UIEventState`](class.UIEventState.md).[`constructor`](class.UIEventState.md#constructor)

#### Defined In

[block-std/src/event/state/clipboard.ts:12](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/clipboard.ts#L12)

## Properties

### event

> **event**: `Event`

#### Defined In

[block-std/src/event/base.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/base.ts#L11)

#### Inherited from

[`UIEventState`](class.UIEventState.md).[`event`](class.UIEventState.md#event)

***

### raw

> **raw**: `ClipboardEvent`

#### Defined In

[block-std/src/event/state/clipboard.ts:10](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/clipboard.ts#L10)

***

### type

> **type**: `string` = `'clipboardState'`

when extends, override it with pattern `xxxState`

#### Defined In

[block-std/src/event/state/clipboard.ts:8](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/clipboard.ts#L8)

#### Overrides

[`UIEventState`](class.UIEventState.md).[`type`](class.UIEventState.md#type)

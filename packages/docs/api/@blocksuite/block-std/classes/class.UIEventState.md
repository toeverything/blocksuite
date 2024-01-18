[API](../../../index.md) > [@blocksuite/block-std](../index.md) > UIEventState

# Class: UIEventState

## Extended By

- [`ClipboardEventState`](class.ClipboardEventState.md)
- [`KeyboardEventState`](class.KeyboardEventState.md)
- [`PointerEventState`](class.PointerEventState.md)

## Constructors

### constructor

> **new UIEventState**(`event`): [`UIEventState`](class.UIEventState.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `event` | `Event` |

#### Returns

[`UIEventState`](class.UIEventState.md)

#### Defined In

[block-std/src/event/base.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/base.ts#L11)

## Properties

### event

> **event**: `Event`

#### Defined In

[block-std/src/event/base.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/base.ts#L11)

***

### type

> **type**: `string` = `'defaultState'`

when extends, override it with pattern `xxxState`

#### Defined In

[block-std/src/event/base.ts:9](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/base.ts#L9)

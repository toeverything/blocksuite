[API](../../../index.md) > [@blocksuite/block-std](../index.md) > KeyboardEventState

# Class: KeyboardEventState

## Extends

- [`UIEventState`](class.UIEventState.md)

## Constructors

### constructor

> **new KeyboardEventState**(`__namedParameters`): [`KeyboardEventState`](class.KeyboardEventState.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | `KeyboardEventStateOptions` |

#### Returns

[`KeyboardEventState`](class.KeyboardEventState.md)

#### Overrides

[`UIEventState`](class.UIEventState.md).[`constructor`](class.UIEventState.md#constructor)

#### Defined In

[block-std/src/event/state/keyboard.ts:15](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/keyboard.ts#L15)

## Properties

### composing

> **composing**: `boolean`

#### Defined In

[block-std/src/event/state/keyboard.ts:13](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/keyboard.ts#L13)

***

### event

> **event**: `Event`

#### Defined In

[block-std/src/event/base.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/base.ts#L11)

#### Inherited from

[`UIEventState`](class.UIEventState.md).[`event`](class.UIEventState.md#event)

***

### raw

> **raw**: `KeyboardEvent`

#### Defined In

[block-std/src/event/state/keyboard.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/keyboard.ts#L11)

***

### type

> **type**: `string` = `'keyboardState'`

when extends, override it with pattern `xxxState`

#### Defined In

[block-std/src/event/state/keyboard.ts:9](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/keyboard.ts#L9)

#### Overrides

[`UIEventState`](class.UIEventState.md).[`type`](class.UIEventState.md#type)

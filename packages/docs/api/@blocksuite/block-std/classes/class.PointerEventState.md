[API](../../../index.md) > [@blocksuite/block-std](../index.md) > PointerEventState

# Class: PointerEventState

## Extends

- [`UIEventState`](class.UIEventState.md)

## Constructors

### constructor

> **new PointerEventState**(`__namedParameters`): [`PointerEventState`](class.PointerEventState.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | `PointerEventStateOptions` |

#### Returns

[`PointerEventState`](class.PointerEventState.md)

#### Overrides

[`UIEventState`](class.UIEventState.md).[`constructor`](class.UIEventState.md#constructor)

#### Defined In

[block-std/src/event/state/pointer.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/pointer.ts#L37)

## Properties

### button

> **button**: `number`

#### Defined In

[block-std/src/event/state/pointer.ts:26](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/pointer.ts#L26)

***

### containerOffset

> **containerOffset**: `Point`

#### Defined In

[block-std/src/event/state/pointer.ts:18](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/pointer.ts#L18)

***

### delta

> **delta**: `Point`

#### Defined In

[block-std/src/event/state/pointer.ts:20](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/pointer.ts#L20)

***

### dragging

> **dragging**: `boolean`

#### Defined In

[block-std/src/event/state/pointer.ts:27](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/pointer.ts#L27)

***

### event

> **event**: `Event`

#### Defined In

[block-std/src/event/base.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/base.ts#L11)

#### Inherited from

[`UIEventState`](class.UIEventState.md).[`event`](class.UIEventState.md#event)

***

### keys

> **keys**: `object`

#### Type declaration

> ##### `keys.alt`
>
> > **alt**: `boolean`
>
> ##### `keys.cmd`
>
> > **cmd**: `boolean`
>
> ##### `keys.shift`
>
> > **shift**: `boolean`
>
>

#### Defined In

[block-std/src/event/state/pointer.ts:21](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/pointer.ts#L21)

***

### point

> **point**: `Point`

#### Defined In

[block-std/src/event/state/pointer.ts:17](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/pointer.ts#L17)

***

### raw

> **raw**: `PointerEvent`

#### Defined In

[block-std/src/event/state/pointer.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/pointer.ts#L16)

***

### start

> **start**: `Point`

#### Defined In

[block-std/src/event/state/pointer.ts:19](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/pointer.ts#L19)

***

### type

> **type**: `string` = `'pointerState'`

when extends, override it with pattern `xxxState`

#### Defined In

[block-std/src/event/state/pointer.ts:14](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/pointer.ts#L14)

#### Overrides

[`UIEventState`](class.UIEventState.md).[`type`](class.UIEventState.md#type)

## Accessors

### x

> `get` x(): `number`

#### Defined In

[block-std/src/event/state/pointer.ts:29](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/pointer.ts#L29)

***

### y

> `get` y(): `number`

#### Defined In

[block-std/src/event/state/pointer.ts:33](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/state/pointer.ts#L33)

[API](../../../index.md) > [@blocksuite/virgo](../index.md) > VirgoEventService

# Class: VirgoEventService`<TextAttributes>`

## Constructors

### constructor

> **new VirgoEventService**<`TextAttributes`>(`editor`): [`VirgoEventService`](class.VirgoEventService.md)\< `TextAttributes` \>

#### Type parameters

| Parameter |
| :------ |
| `TextAttributes` *extends* \{`bold`: `null` \| `true`; `code`: `null` \| `true`; `italic`: `null` \| `true`; `link`: `null` \| `string`; `strike`: `null` \| `true`; `underline`: `null` \| `true`;} |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `editor` | [`VEditor`](class.VEditor.md)\< `TextAttributes` \> |

#### Returns

[`VirgoEventService`](class.VirgoEventService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/services/event.ts:21](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L21)

## Properties

### \_isComposing

> `private` **\_isComposing**: `boolean` = `false`

#### Defined In

[packages/virgo/src/services/event.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L16)

***

### \_previousAnchor

> `private` **\_previousAnchor**: `null` \| [`NativePoint`](../type-aliases/type-alias.NativePoint.md) = `null`

#### Defined In

[packages/virgo/src/services/event.ts:18](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L18)

***

### \_previousFocus

> `private` **\_previousFocus**: `null` \| [`NativePoint`](../type-aliases/type-alias.NativePoint.md) = `null`

#### Defined In

[packages/virgo/src/services/event.ts:19](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L19)

***

### editor

> `readonly` **editor**: [`VEditor`](class.VEditor.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/services/event.ts:21](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L21)

## Accessors

### vRangeProvider

> `get` vRangeProvider(): `null` \| [`VRangeProvider`](../interfaces/interface.VRangeProvider.md)

#### Defined In

[packages/virgo/src/services/event.ts:23](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L23)

## Methods

### \_isRangeCompletelyInRoot

> `private` **\_isRangeCompletelyInRoot**(): `boolean`

#### Returns

`boolean`

#### Defined In

[packages/virgo/src/services/event.ts:61](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L61)

***

### \_onBeforeInput

> `private` **\_onBeforeInput**(`event`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `event` | `InputEvent` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/event.ts:258](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L258)

***

### \_onClick

> `private` **\_onClick**(`event`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `event` | `MouseEvent` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/event.ts:364](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L364)

***

### \_onCompositionEnd

> `private` **\_onCompositionEnd**(`event`): `Promise`\< `void` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `event` | `CompositionEvent` |

#### Returns

`Promise`\< `void` \>

#### Defined In

[packages/virgo/src/services/event.ts:174](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L174)

***

### \_onCompositionStart

> `private` **\_onCompositionStart**(): `void`

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/event.ts:163](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L163)

***

### \_onKeyDown

> `private` **\_onKeyDown**(`event`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `event` | `KeyboardEvent` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/event.ts:309](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L309)

***

### \_onSelectionChange

> `private` **\_onSelectionChange**(): `void`

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/event.ts:87](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L87)

***

### mount

> **mount**(): `void`

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/event.ts:27](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/event.ts#L27)

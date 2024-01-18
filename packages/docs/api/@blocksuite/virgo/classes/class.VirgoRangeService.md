[API](../../../index.md) > [@blocksuite/virgo](../index.md) > VirgoRangeService

# Class: VirgoRangeService`<TextAttributes>`

## Constructors

### constructor

> **new VirgoRangeService**<`TextAttributes`>(`editor`): [`VirgoRangeService`](class.VirgoRangeService.md)\< `TextAttributes` \>

#### Type parameters

| Parameter |
| :------ |
| `TextAttributes` *extends* \{`bold`: `null` \| `true`; `code`: `null` \| `true`; `italic`: `null` \| `true`; `link`: `null` \| `string`; `strike`: `null` \| `true`; `underline`: `null` \| `true`;} |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `editor` | [`VEditor`](class.VEditor.md)\< `TextAttributes` \> |

#### Returns

[`VirgoRangeService`](class.VirgoRangeService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/services/range.ts:18](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L18)

## Properties

### \_vRange

> `private` **\_vRange**: `null` \| [`VRange`](../interfaces/interface.VRange.md) = `null`

#### Defined In

[packages/virgo/src/services/range.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L16)

***

### editor

> `readonly` **editor**: [`VEditor`](class.VEditor.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/services/range.ts:18](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L18)

## Accessors

### rootElement

> `get` rootElement(): [`VirgoRootElement`](../type-aliases/type-alias.VirgoRootElement.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/services/range.ts:24](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L24)

***

### vRangeProvider

> `get` vRangeProvider(): `null` \| [`VRangeProvider`](../interfaces/interface.VRangeProvider.md)

#### Defined In

[packages/virgo/src/services/range.ts:20](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L20)

## Methods

### \_applyVRange

> `private` **\_applyVRange**(`vRange`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) |

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/range.ts:340](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L340)

***

### focusEnd

> **focusEnd**(): `void`

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/range.ts:262](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L262)

***

### focusIndex

> **focusIndex**(`index`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `index` | `number` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/range.ts:283](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L283)

***

### focusStart

> **focusStart**(): `void`

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/range.ts:269](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L269)

***

### getLine

> **getLine**(`rangeIndex`): *readonly* [[`VirgoLine`](class.VirgoLine.md), `number`]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `rangeIndex` | `number` |

#### Returns

*readonly* [[`VirgoLine`](class.VirgoLine.md), `number`]

#### Defined In

[packages/virgo/src/services/range.ts:127](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L127)

***

### getNativeSelection

> **getNativeSelection**(): `null` \| `Selection`

#### Returns

`null` \| `Selection`

#### Defined In

[packages/virgo/src/services/range.ts:72](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L72)

***

### getTextPoint

> **getTextPoint**(`rangeIndex`): [`TextPoint`](../type-aliases/type-alias.TextPoint.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `rangeIndex` | `number` |

#### Returns

[`TextPoint`](../type-aliases/type-alias.TextPoint.md)

#### Defined In

[packages/virgo/src/services/range.ts:103](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L103)

***

### getVRange

> **getVRange**(): `null` \| [`VRange`](../interfaces/interface.VRange.md)

#### Returns

`null` \| [`VRange`](../interfaces/interface.VRange.md)

#### Defined In

[packages/virgo/src/services/range.ts:81](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L81)

***

### getVRangeFromElement

> **getVRangeFromElement**(`element`): `null` \| [`VRange`](../interfaces/interface.VRange.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `element` | `Element` |

#### Returns

`null` \| [`VRange`](../interfaces/interface.VRange.md)

#### Defined In

[packages/virgo/src/services/range.ts:89](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L89)

***

### isFirstLine

> **isFirstLine**(`vRange`): `boolean`

There are two cases to have the second line:
1. long text auto wrap in span element
2. soft break

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `vRange` | `null` \| [`VRange`](../interfaces/interface.VRange.md) |

#### Returns

`boolean`

#### Defined In

[packages/virgo/src/services/range.ts:162](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L162)

***

### isLastLine

> **isLastLine**(`vRange`): `boolean`

There are two cases to have the second line:
1. long text auto wrap in span element
2. soft break

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `vRange` | `null` \| [`VRange`](../interfaces/interface.VRange.md) |

#### Returns

`boolean`

#### Defined In

[packages/virgo/src/services/range.ts:206](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L206)

***

### isVRangeValid

> **isVRangeValid**(`vRange`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `vRange` | `null` \| [`VRange`](../interfaces/interface.VRange.md) |

#### Returns

`boolean`

#### Defined In

[packages/virgo/src/services/range.ts:149](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L149)

***

### onVRangeUpdated

> **onVRangeUpdated**(`__namedParameters`): `Promise`\< `void` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | [`VRangeUpdatedProp`](../type-aliases/type-alias.VRangeUpdatedProp.md) |

#### Returns

`Promise`\< `void` \>

#### Defined In

[packages/virgo/src/services/range.ts:28](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L28)

***

### selectAll

> **selectAll**(): `void`

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/range.ts:276](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L276)

***

### setVRange

> **setVRange**(`vRange`, `sync` = `true`): `void`

the vRange is synced to the native selection asynchronically
if sync is true, the native selection will be synced immediately

#### Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `vRange` | `null` \| [`VRange`](../interfaces/interface.VRange.md) | `undefined` |
| `sync` | `boolean` | `true` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/range.ts:249](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L249)

***

### syncVRange

> **syncVRange**(): `void`

sync the dom selection from vRange for **this Editor**

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/range.ts:293](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L293)

***

### toDomRange

> **toDomRange**(`vRange`): `null` \| `Range`

calculate the dom selection from vRange for **this Editor**

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) |

#### Returns

`null` \| `Range`

#### Defined In

[packages/virgo/src/services/range.ts:303](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L303)

***

### toVRange

> **toVRange**(`range`): `null` \| [`VRange`](../interfaces/interface.VRange.md)

calculate the vRange from dom selection for **this Editor**
there are three cases when the vRange of this Editor is not null:
(In the following, "|" mean anchor and focus, each line is a separate Editor)
1. anchor and focus are in this Editor
   aaaaaa
   b|bbbb|b
   cccccc
   the vRange of second Editor is {index: 1, length: 4}, the others are null
2. anchor and focus one in this Editor, one in another Editor
   aaa|aaa    aaaaaa
   bbbbb|b or bbbbb|b
   cccccc     cc|cccc
   2.1
       the vRange of first Editor is {index: 3, length: 3}, the second is {index: 0, length: 5},
       the third is null
   2.2
       the vRange of first Editor is null, the second is {index: 5, length: 1},
       the third is {index: 0, length: 2}
3. anchor and focus are in another Editor
   aa|aaaa
   bbbbbb
   cccc|cc
   the vRange of first Editor is {index: 2, length: 4},
   the second is {index: 0, length: 6}, the third is {index: 0, length: 4}

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `range` | `Range` |

#### Returns

`null` \| [`VRange`](../interfaces/interface.VRange.md)

#### Defined In

[packages/virgo/src/services/range.ts:334](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/range.ts#L334)

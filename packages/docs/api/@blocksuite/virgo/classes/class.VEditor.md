[API](../../../index.md) > [@blocksuite/virgo](../index.md) > VEditor

# Class: VEditor`<TextAttributes>`

## Constructors

### constructor

> **new VEditor**<`TextAttributes`>(`yText`, `ops` = `{}`): [`VEditor`](class.VEditor.md)\< `TextAttributes` \>

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `TextAttributes` *extends* \{`bold`: `null` \| `true`; `code`: `null` \| `true`; `italic`: `null` \| `true`; `link`: `null` \| `string`; `strike`: `null` \| `true`; `underline`: `null` \| `true`;} | \{`bold`: `null` \| `true`; `code`: `null` \| `true`; `italic`: `null` \| `true`; `link`: `null` \| `string`; `strike`: `null` \| `true`; `underline`: `null` \| `true`;} |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `yText` | [`Text`](../../store/namespaces/namespace.Y/classes/class.Text.md) |
| `ops` | `object` |
| `ops.hooks`? | `object` |
| `ops.hooks.beforeinput`? | `function` |
| `ops.hooks.compositionEnd`? | `function` |
| `ops.isEmbed`? | `function` |
| `ops.vRangeProvider`? | [`VRangeProvider`](../interfaces/interface.VRangeProvider.md) |

#### Returns

[`VEditor`](class.VEditor.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/virgo.ts:158](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L158)

## Properties

### \_attributeService

> `private` **\_attributeService**: [`VirgoAttributeService`](class.VirgoAttributeService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/virgo.ts:56](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L56)

***

### \_deltaService

> `private` **\_deltaService**: [`VirgoDeltaService`](class.VirgoDeltaService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/virgo.ts:59](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L59)

***

### \_disposables

> `private` **\_disposables**: `DisposableGroup`

#### Defined In

[packages/virgo/src/virgo.ts:41](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L41)

***

### \_eventService

> `private` **\_eventService**: [`VirgoEventService`](class.VirgoEventService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/virgo.ts:50](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L50)

***

### \_hooksService

> `private` **\_hooksService**: [`VirgoHookService`](class.VirgoHookService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/virgo.ts:62](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L62)

***

### \_isReadonly

> `private` **\_isReadonly**: `boolean` = `false`

#### Defined In

[packages/virgo/src/virgo.ts:48](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L48)

***

### \_mounted

> `private` **\_mounted**: `boolean` = `false`

#### Defined In

[packages/virgo/src/virgo.ts:64](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L64)

***

### \_rangeService

> `private` **\_rangeService**: [`VirgoRangeService`](class.VirgoRangeService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/virgo.ts:53](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L53)

***

### \_rootElement

> `private` **\_rootElement**: `null` \| [`VirgoRootElement`](../type-aliases/type-alias.VirgoRootElement.md)\< `TextAttributes` \> = `null`

#### Defined In

[packages/virgo/src/virgo.ts:47](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L47)

***

### \_yText

> `private` `readonly` **\_yText**: [`Text`](../../store/namespaces/namespace.Y/classes/class.Text.md)

#### Defined In

[packages/virgo/src/virgo.ts:46](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L46)

***

### focusEnd

> **focusEnd**: `function`

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:142](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L142)

***

### focusIndex

> **focusIndex**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `index` | `number` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:144](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L144)

***

### focusStart

> **focusStart**: `function`

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:141](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L141)

***

### getDeltaByRangeIndex

> **getDeltaByRangeIndex**: `function`

Here are examples of how this function computes and gets the delta.

We have such a text:
```
[
  {
     insert: 'aaa',
     attributes: { bold: true },
  },
  {
     insert: 'bbb',
     attributes: { italic: true },
  },
]
```

`getDeltaByRangeIndex(0)` returns `{ insert: 'aaa', attributes: { bold: true } }`.

`getDeltaByRangeIndex(1)` returns `{ insert: 'aaa', attributes: { bold: true } }`.

`getDeltaByRangeIndex(3)` returns `{ insert: 'aaa', attributes: { bold: true } }`.

`getDeltaByRangeIndex(4)` returns `{ insert: 'bbb', attributes: { italic: true } }`.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `rangeIndex` | `number` |

#### Returns

`null` \| [`DeltaInsert`](../type-aliases/type-alias.DeltaInsert.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/virgo.ts:149](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L149)

***

### getDeltasByVRange

> **getDeltasByVRange**: `function`

Here are examples of how this function computes and gets the deltas.

We have such a text:
```
[
  {
     insert: 'aaa',
     attributes: { bold: true },
  },
  {
     insert: 'bbb',
     attributes: { italic: true },
  },
  {
     insert: 'ccc',
     attributes: { underline: true },
  },
]
```

`getDeltasByVRange({ index: 0, length: 0 })` returns
```
[{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }]]
```

`getDeltasByVRange({ index: 0, length: 1 })` returns
```
[{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }]]
```

`getDeltasByVRange({ index: 0, length: 4 })` returns
```
[{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }],
 [{ insert: 'bbb', attributes: { italic: true }, }, { index: 3, length: 3, }]]
```

`getDeltasByVRange({ index: 3, length: 1 })` returns
```
[{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }],
 [{ insert: 'bbb', attributes: { italic: true }, }, { index: 3, length: 3, }]]
```

`getDeltasByVRange({ index: 3, length: 3 })` returns
```
[{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }],
 [{ insert: 'bbb', attributes: { italic: true }, }, { index: 3, length: 3, }]]
```

 `getDeltasByVRange({ index: 3, length: 4 })` returns
```
[{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }],
 [{ insert: 'bbb', attributes: { italic: true }, }, { index: 3, length: 3, }],
 [{ insert: 'ccc', attributes: { underline: true }, }, { index: 6, length: 3, }]]
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) |

#### Returns

[`DeltaEntry`](../type-aliases/type-alias.DeltaEntry.md)\< `TextAttributes` \>[]

#### Defined In

[packages/virgo/src/virgo.ts:148](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L148)

***

### getFormat

> **getFormat**: `function`

#### Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) | `undefined` |
| `loose` | `boolean` | `false` |

#### Returns

`TextAttributes`

#### Defined In

[packages/virgo/src/virgo.ts:127](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L127)

***

### getLine

> **getLine**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `rangeIndex` | `number` |

#### Returns

*readonly* [[`VirgoLine`](class.VirgoLine.md), `number`]

#### Defined In

[packages/virgo/src/virgo.ts:136](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L136)

***

### getNativeSelection

> **getNativeSelection**: `function`

#### Returns

`null` \| `Selection`

#### Defined In

[packages/virgo/src/virgo.ts:134](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L134)

***

### getTextPoint

> **getTextPoint**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `rangeIndex` | `number` |

#### Returns

[`TextPoint`](../type-aliases/type-alias.TextPoint.md)

#### Defined In

[packages/virgo/src/virgo.ts:135](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L135)

***

### getVRange

> **getVRange**: `function`

#### Returns

`null` \| [`VRange`](../interfaces/interface.VRange.md)

#### Defined In

[packages/virgo/src/virgo.ts:132](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L132)

***

### getVRangeFromElement

> **getVRangeFromElement**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `element` | `Element` |

#### Returns

`null` \| [`VRange`](../interfaces/interface.VRange.md)

#### Defined In

[packages/virgo/src/virgo.ts:133](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L133)

***

### isEmbed

> `readonly` **isEmbed**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `delta` | [`DeltaInsert`](../type-aliases/type-alias.DeltaInsert.md)\< `TextAttributes` \> |

#### Returns

`boolean`

#### Defined In

[packages/virgo/src/virgo.ts:66](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L66)

***

### isFirstLine

> **isFirstLine**: `function`

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

[packages/virgo/src/virgo.ts:138](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L138)

***

### isLastLine

> **isLastLine**: `function`

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

[packages/virgo/src/virgo.ts:139](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L139)

***

### isNormalizedDeltaSelected

> **isNormalizedDeltaSelected**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `normalizedDeltaIndex` | `number` |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) |

#### Returns

`boolean`

#### Defined In

[packages/virgo/src/virgo.ts:151](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L151)

***

### isVRangeValid

> **isVRangeValid**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `vRange` | `null` \| [`VRange`](../interfaces/interface.VRange.md) |

#### Returns

`boolean`

#### Defined In

[packages/virgo/src/virgo.ts:137](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L137)

***

### mapDeltasInVRange

> **mapDeltasInVRange**: `function`

#### Type parameters

| Parameter |
| :------ |
| `Result` |

#### Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) | `undefined` |
| `callback` | `function` | `undefined` |
| `normalize` | `boolean` | `false` |

#### Returns

`Result`[]

#### Defined In

[packages/virgo/src/virgo.ts:150](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L150)

***

### resetMarks

> **resetMarks**: `function`

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:126](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L126)

***

### selectAll

> **selectAll**: `function`

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:143](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L143)

***

### setAttributeRenderer

> **setAttributeRenderer**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `renderer` | [`AttributeRenderer`](../type-aliases/type-alias.AttributeRenderer.md)\< `TextAttributes` \> |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:124](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L124)

***

### setAttributeSchema

> **setAttributeSchema**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `schema` | `ZodType`\< `TextAttributes`, `ZodTypeDef`, `unknown` \> |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:123](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L123)

***

### setMarks

> **setMarks**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `marks` | `TextAttributes` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:125](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L125)

***

### setVRange

> **setVRange**: `function`

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

[packages/virgo/src/virgo.ts:140](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L140)

***

### slots

> **slots**: `object`

#### Type declaration

> ##### `slots.mounted`
>
> > **mounted**: `Slot`\< `void` \>
>
> ##### `slots.rangeUpdated`
>
> > **rangeUpdated**: `Slot`\< `Range` \>
>
> ##### `slots.unmounted`
>
> > **unmounted**: `Slot`\< `void` \>
>
> ##### `slots.updated`
>
> > **updated**: `Slot`\< `void` \>
>
> ##### `slots.vRangeUpdated`
>
> > **vRangeUpdated**: `Slot`\< [`VRangeUpdatedProp`](../type-aliases/type-alias.VRangeUpdatedProp.md) \>
>
>

#### Defined In

[packages/virgo/src/virgo.ts:69](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L69)

***

### syncVRange

> **syncVRange**: `function`

sync the dom selection from vRange for **this Editor**

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:145](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L145)

***

### toDomRange

> **toDomRange**: `function`

calculate the dom selection from vRange for **this Editor**

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) |

#### Returns

`null` \| `Range`

#### Defined In

[packages/virgo/src/virgo.ts:130](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L130)

***

### toVRange

> **toVRange**: `function`

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

[packages/virgo/src/virgo.ts:131](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L131)

***

### vRangeProvider

> `readonly` **vRangeProvider**: `null` \| [`VRangeProvider`](../interfaces/interface.VRangeProvider.md)

#### Defined In

[packages/virgo/src/virgo.ts:67](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L67)

***

### getTextNodesFromElement

> `static` **getTextNodesFromElement**: `function` = `getTextNodesFromElement`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `element` | `Element` |

#### Returns

`Text`[]

#### Defined In

[packages/virgo/src/virgo.ts:39](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L39)

***

### nativePointToTextPoint

> `static` **nativePointToTextPoint**: `function` = `nativePointToTextPoint`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | `unknown` |
| `offset` | `number` |

#### Returns

[`TextPoint`](../type-aliases/type-alias.TextPoint.md) \| `null`

#### Defined In

[packages/virgo/src/virgo.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L37)

***

### textPointToDomPoint

> `static` **textPointToDomPoint**: `function` = `textPointToDomPoint`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `text` | `Text` |
| `offset` | `number` |
| `rootElement` | `HTMLElement` |

#### Returns

[`DomPoint`](../interfaces/interface.DomPoint.md) \| `null`

#### Defined In

[packages/virgo/src/virgo.ts:38](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L38)

## Accessors

### attributeService

> `get` attributeService(): [`VirgoAttributeService`](class.VirgoAttributeService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/virgo.ts:106](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L106)

***

### deltaService

> `get` deltaService(): [`VirgoDeltaService`](class.VirgoDeltaService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/virgo.ts:110](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L110)

***

### disposables

> `get` disposables(): `DisposableGroup`

#### Defined In

[packages/virgo/src/virgo.ts:42](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L42)

***

### eventService

> `get` eventService(): [`VirgoEventService`](class.VirgoEventService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/virgo.ts:98](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L98)

***

### hooks

> `get` hooks(): `object`

#### Defined In

[packages/virgo/src/virgo.ts:154](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L154)

***

### isReadonly

> `get` isReadonly(): `boolean`

#### Defined In

[packages/virgo/src/virgo.ts:238](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L238)

***

### marks

> `get` marks(): `null` \| `TextAttributes`

#### Defined In

[packages/virgo/src/virgo.ts:119](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L119)

***

### mounted

> `get` mounted(): `boolean`

#### Defined In

[packages/virgo/src/virgo.ts:114](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L114)

***

### rangeService

> `get` rangeService(): [`VirgoRangeService`](class.VirgoRangeService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/virgo.ts:102](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L102)

***

### rootElement

> `get` rootElement(): [`VirgoRootElement`](../type-aliases/type-alias.VirgoRootElement.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/virgo.ts:93](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L93)

***

### yText

> `get` yText(): [`Text`](../../store/namespaces/namespace.Y/classes/class.Text.md)

#### Defined In

[packages/virgo/src/virgo.ts:77](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L77)

***

### yTextDeltas

> `get` yTextDeltas(): `any`

#### Defined In

[packages/virgo/src/virgo.ts:89](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L89)

***

### yTextLength

> `get` yTextLength(): `number`

#### Defined In

[packages/virgo/src/virgo.ts:85](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L85)

***

### yTextString

> `get` yTextString(): `string`

#### Defined In

[packages/virgo/src/virgo.ts:81](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L81)

## Methods

### \_bindYTextObserver

> `private` **\_bindYTextObserver**(): `void`

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:371](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L371)

***

### \_onYTextChange

> `private` **\_onYTextChange**(): `void`

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:350](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L350)

***

### \_transact

> `private` **\_transact**(`fn`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `fn` | `function` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:362](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L362)

***

### deleteText

> **deleteText**(`vRange`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:242](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L242)

***

### formatText

> **formatText**(
  `vRange`,
  `attributes`,
  `options` = `{}`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) |
| `attributes` | `TextAttributes` |
| `options` | `object` |
| `options.match`? | `function` |
| `options.mode`? | `"replace"` \| `"merge"` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:276](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L276)

***

### insertLineBreak

> **insertLineBreak**(`vRange`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:269](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L269)

***

### insertText

> **insertText**(
  `vRange`,
  `text`,
  `attributes` = `...`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) |
| `text` | `string` |
| `attributes` | `TextAttributes` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:248](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L248)

***

### mount

> **mount**(`rootElement`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `rootElement` | `HTMLElement` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:198](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L198)

***

### requestUpdate

> **requestUpdate**(`syncVRange` = `true`): `void`

#### Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `syncVRange` | `boolean` | `true` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:224](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L224)

***

### rerenderWholeEditor

> **rerenderWholeEditor**(): `void`

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:345](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L345)

***

### resetText

> **resetText**(`vRange`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:311](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L311)

***

### setReadonly

> **setReadonly**(`isReadonly`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `isReadonly` | `boolean` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:233](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L233)

***

### setText

> **setText**(`text`, `attributes` = `...`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `text` | `string` |
| `attributes` | `TextAttributes` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:335](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L335)

***

### unmount

> **unmount**(): `void`

#### Returns

`void`

#### Defined In

[packages/virgo/src/virgo.ts:215](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L215)

***

### waitForUpdate

> **waitForUpdate**(): `Promise`\< `void` \>

#### Returns

`Promise`\< `void` \>

#### Defined In

[packages/virgo/src/virgo.ts:228](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/virgo.ts#L228)

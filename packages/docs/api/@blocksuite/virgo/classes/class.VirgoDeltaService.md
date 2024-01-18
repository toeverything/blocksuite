[API](../../../index.md) > [@blocksuite/virgo](../index.md) > VirgoDeltaService

# Class: VirgoDeltaService`<TextAttributes>`

## Constructors

### constructor

> **new VirgoDeltaService**<`TextAttributes`>(`editor`): [`VirgoDeltaService`](class.VirgoDeltaService.md)\< `TextAttributes` \>

#### Type parameters

| Parameter |
| :------ |
| `TextAttributes` *extends* \{`bold`: `null` \| `true`; `code`: `null` \| `true`; `italic`: `null` \| `true`; `link`: `null` \| `string`; `strike`: `null` \| `true`; `underline`: `null` \| `true`;} |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `editor` | [`VEditor`](class.VEditor.md)\< `TextAttributes` \> |

#### Returns

[`VirgoDeltaService`](class.VirgoDeltaService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/services/delta.ts:12](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/delta.ts#L12)

## Properties

### editor

> `readonly` **editor**: [`VEditor`](class.VEditor.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/services/delta.ts:12](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/delta.ts#L12)

## Accessors

### deltas

> `get` deltas(): [`DeltaInsert`](../type-aliases/type-alias.DeltaInsert.md)\< `TextAttributes` \>[]

#### Defined In

[packages/virgo/src/services/delta.ts:14](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/delta.ts#L14)

***

### normalizedDeltas

> `get` normalizedDeltas(): [`DeltaInsert`](../type-aliases/type-alias.DeltaInsert.md)\< `TextAttributes` \>[]

#### Defined In

[packages/virgo/src/services/delta.ts:18](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/delta.ts#L18)

## Methods

### getDeltaByRangeIndex

> **getDeltaByRangeIndex**(`rangeIndex`): `null` \| [`DeltaInsert`](../type-aliases/type-alias.DeltaInsert.md)\< `TextAttributes` \>

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

[packages/virgo/src/services/delta.ts:119](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/delta.ts#L119)

***

### getDeltasByVRange

> **getDeltasByVRange**(`vRange`): [`DeltaEntry`](../type-aliases/type-alias.DeltaEntry.md)\< `TextAttributes` \>[]

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

[packages/virgo/src/services/delta.ts:189](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/delta.ts#L189)

***

### isNormalizedDeltaSelected

> **isNormalizedDeltaSelected**(`normalizedDeltaIndex`, `vRange`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `normalizedDeltaIndex` | `number` |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) |

#### Returns

`boolean`

#### Defined In

[packages/virgo/src/services/delta.ts:70](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/delta.ts#L70)

***

### mapDeltasInVRange

> **mapDeltasInVRange**<`Result`>(
  `vRange`,
  `callback`,
  `normalize` = `false`): `Result`[]

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

[packages/virgo/src/services/delta.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/delta.ts#L37)

***

### render

> **render**(`syncVRange` = `true`): `Promise`\< `void` \>

#### Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `syncVRange` | `boolean` | `true` |

#### Returns

`Promise`\< `void` \>

#### Defined In

[packages/virgo/src/services/delta.ts:200](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/delta.ts#L200)

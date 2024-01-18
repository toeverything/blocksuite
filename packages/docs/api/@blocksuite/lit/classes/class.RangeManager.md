[API](../../../index.md) > [@blocksuite/lit](../index.md) > RangeManager

# Class: RangeManager

CRUD for Range and TextSelection

## Constructors

### constructor

> **new RangeManager**(`root`): [`RangeManager`](class.RangeManager.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `root` | [`BlockSuiteRoot`](class.BlockSuiteRoot.md) |

#### Returns

[`RangeManager`](class.RangeManager.md)

#### Defined In

[packages/lit/src/utils/range-manager.ts:28](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L28)

## Properties

### \_isRangeReversed

> `private` **\_isRangeReversed**: `boolean` = `false`

#### Defined In

[packages/lit/src/utils/range-manager.ts:35](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L35)

***

### \_range

> `private` **\_range**: `null` \| `Range` = `null`

#### Defined In

[packages/lit/src/utils/range-manager.ts:34](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L34)

***

### rangeSynchronizer

> `readonly` **rangeSynchronizer**: [`RangeSynchronizer`](class.RangeSynchronizer.md)

#### Defined In

[packages/lit/src/utils/range-manager.ts:26](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L26)

***

### root

> **root**: [`BlockSuiteRoot`](class.BlockSuiteRoot.md)

#### Defined In

[packages/lit/src/utils/range-manager.ts:28](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L28)

## Accessors

### value

> `get` value(): `null` \| `Range`

#### Defined In

[packages/lit/src/utils/range-manager.ts:30](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L30)

## Methods

### \_calculateVirgo

> `private` **\_calculateVirgo**(`point`): `null` \| [[`VEditor`](../../virgo/classes/class.VEditor.md)\< \{`bold`: `null` \| `true`; `code`: `null` \| `true`; `italic`: `null` \| `true`; `link`: `null` \| `string`; `strike`: `null` \| `true`; `underline`: `null` \| `true`;} \>, [`VRange`](../../virgo/interfaces/interface.VRange.md)]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `point` | [`TextRangePoint`](../../block-std/type-aliases/type-alias.TextRangePoint.md) |

#### Returns

`null` \| [[`VEditor`](../../virgo/classes/class.VEditor.md)\< \{`bold`: `null` \| `true`; `code`: `null` \| `true`; `italic`: `null` \| `true`; `link`: `null` \| `string`; `strike`: `null` \| `true`; `underline`: `null` \| `true`;} \>, [`VRange`](../../virgo/interfaces/interface.VRange.md)]

#### Defined In

[packages/lit/src/utils/range-manager.ts:212](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L212)

***

### \_getBlock

> `private` **\_getBlock**(`element`): [`BlockElement`](class.BlockElement.md)\< [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \>, [`BlockService`](../../block-std/classes/class.BlockService.md)\< [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \> \>, `string` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `element` | `HTMLElement` |

#### Returns

[`BlockElement`](class.BlockElement.md)\< [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \>, [`BlockService`](../../block-std/classes/class.BlockService.md)\< [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \> \>, `string` \>

#### Defined In

[packages/lit/src/utils/range-manager.ts:356](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L356)

***

### \_getNearestVirgo

> `private` **\_getNearestVirgo**(`node`): `undefined` \| [`VirgoRootElement`](../../virgo/type-aliases/type-alias.VirgoRootElement.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | `Node` |

#### Returns

`undefined` \| [`VirgoRootElement`](../../virgo/type-aliases/type-alias.VirgoRootElement.md)

#### Defined In

[packages/lit/src/utils/range-manager.ts:342](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L342)

***

### \_mergeRanges

> `private` **\_mergeRanges**(`ranges`): `null` \| \{`range`: `Range`; `reversed`: `boolean`;}

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `ranges` | `RangeSnapshot`[] |

#### Returns

`null` \| \{`range`: `Range`; `reversed`: `boolean`;}

#### Defined In

[packages/lit/src/utils/range-manager.ts:270](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L270)

***

### \_nodeToPoint

> `private` **\_nodeToPoint**(`node`): `null` \| \{`blockId`: `string`; `index`: `number`; `length`: `number`; `path`: `string`[];}

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | `Node` |

#### Returns

`null` \| \{`blockId`: `string`; `index`: `number`; `length`: `number`; `path`: `string`[];}

#### Defined In

[packages/lit/src/utils/range-manager.ts:239](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L239)

***

### \_renderRange

> `private` **\_renderRange**(): `void`

#### Returns

`void`

#### Defined In

[packages/lit/src/utils/range-manager.ts:323](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L323)

***

### \_snapshotToRange

> `private` **\_snapshotToRange**(`snapshot`): `Range`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `snapshot` | `RangeSnapshot` |

#### Returns

`Range`

#### Defined In

[packages/lit/src/utils/range-manager.ts:263](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L263)

***

### clearRange

> **clearRange**(`sync` = `true`): `void`

#### Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `sync` | `boolean` | `true` |

#### Returns

`void`

#### Defined In

[packages/lit/src/utils/range-manager.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L37)

***

### getSelectedBlockElementsByRange

> **getSelectedBlockElementsByRange**(`range`, `options` = `{}`): [`BlockElement`](class.BlockElement.md)\< [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \>, [`BlockService`](../../block-std/classes/class.BlockService.md)\< [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \> \>, `string` \>[]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `range` | `Range` |
| `options` | `object` |
| `options.match`? | `function` |
| `options.mode`? | `"all"` \| `"flat"` \| `"highest"` |

#### Returns

[`BlockElement`](class.BlockElement.md)\< [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \>, [`BlockService`](../../block-std/classes/class.BlockService.md)\< [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \> \>, `string` \>[]

#### Example

```ts
aaa
  b[bb
    ccc
ddd
  ee]e

all mode: [aaa, bbb, ccc, ddd, eee]
flat mode: [bbb, ccc, ddd, eee]
highest mode: [bbb, ddd]

match function will be evaluated before filtering using mode
```

#### Defined In

[packages/lit/src/utils/range-manager.ts:126](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L126)

***

### pointToRange

> **pointToRange**(`point`): `null` \| `Range`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `point` | [`TextRangePoint`](../../block-std/type-aliases/type-alias.TextRangePoint.md) |

#### Returns

`null` \| `Range`

#### Defined In

[packages/lit/src/utils/range-manager.ts:202](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L202)

***

### renderRange

> **renderRange**(`start`, `end`?): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `start` | `Range` |
| `end`? | `null` \| `Range` |

#### Returns

`void`

#### Defined In

[packages/lit/src/utils/range-manager.ts:46](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L46)

***

### syncRangeToTextSelection

> **syncRangeToTextSelection**(`range`, `isRangeReversed`): `null` \| [`TextSelection`](../../block-std/classes/class.TextSelection.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `range` | `null` \| `Range` |
| `isRangeReversed` | `boolean` |

#### Returns

`null` \| [`TextSelection`](../../block-std/classes/class.TextSelection.md)

#### Defined In

[packages/lit/src/utils/range-manager.ts:82](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L82)

***

### syncTextSelectionToRange

> **syncTextSelectionToRange**(`selection`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `selection` | `null` \| [`TextSelection`](../../block-std/classes/class.TextSelection.md) |

#### Returns

`void`

#### Defined In

[packages/lit/src/utils/range-manager.ts:59](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L59)

***

### textSelectionToRange

> **textSelectionToRange**(`selection`): `null` \| `Range`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `selection` | [`TextSelection`](../../block-std/classes/class.TextSelection.md) |

#### Returns

`null` \| `Range`

#### Defined In

[packages/lit/src/utils/range-manager.ts:179](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-manager.ts#L179)

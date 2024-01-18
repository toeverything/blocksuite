[API](../../../index.md) > [@blocksuite/lit](../index.md) > RangeSyncFilter

# Interface: RangeSyncFilter

## Properties

### rangeToTextSelection

> `optional` **rangeToTextSelection**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `range` | `null` \| `Range` |

#### Returns

`boolean`

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:15](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L15)

***

### textSelectionToRange

> `optional` **textSelectionToRange**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `selection` | `null` \| [`TextSelection`](../../block-std/classes/class.TextSelection.md) |

#### Returns

`boolean`

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L16)

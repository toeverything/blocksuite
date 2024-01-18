[API](../../../index.md) > [@blocksuite/virgo](../index.md) > domRangeToVirgoRange

# Function: domRangeToVirgoRange

> **domRangeToVirgoRange**(
  `range`,
  `rootElement`,
  `yText`): [`VRange`](../interfaces/interface.VRange.md) \| `null`

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

## Parameters

| Parameter | Type |
| :------ | :------ |
| `range` | `Range` |
| `rootElement` | `HTMLElement` |
| `yText` | [`Text`](../../store/namespaces/namespace.Y/classes/class.Text.md) |

## Returns

[`VRange`](../interfaces/interface.VRange.md) \| `null`

## Defined In

[packages/virgo/src/utils/range-conversion.ts:194](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/utils/range-conversion.ts#L194)

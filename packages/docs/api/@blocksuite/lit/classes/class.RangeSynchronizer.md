[API](../../../index.md) > [@blocksuite/lit](../index.md) > RangeSynchronizer

# Class: RangeSynchronizer

Two-way binding between native range and text selection

## Constructors

### constructor

> **new RangeSynchronizer**(`manager`): [`RangeSynchronizer`](class.RangeSynchronizer.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `manager` | [`RangeManager`](class.RangeManager.md) |

#### Returns

[`RangeSynchronizer`](class.RangeSynchronizer.md)

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:48](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L48)

## Properties

### \_filter

> `private` **\_filter**: [`RangeSyncFilter`](../interfaces/interface.RangeSyncFilter.md) = `{}`

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:25](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L25)

***

### \_isComposing

> `private` **\_isComposing**: `boolean` = `false`

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:42](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L42)

***

### \_prevSelection

> `private` **\_prevSelection**: `null` \| [`BaseSelection`](../../block-std/classes/class.BaseSelection.md) = `null`

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:23](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L23)

***

### manager

> **manager**: [`RangeManager`](class.RangeManager.md)

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:48](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L48)

## Accessors

### \_rangeManager

> `private` `get` _rangeManager(): [`RangeManager`](class.RangeManager.md)

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L37)

***

### \_selectionManager

> `private` `get` _selectionManager(): [`SelectionManager`](../../block-std/classes/class.SelectionManager.md)

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:33](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L33)

***

### filter

> `get` filter(): [`RangeSyncFilter`](../interfaces/interface.RangeSyncFilter.md)

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:26](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L26)

***

### root

> `get` root(): [`BlockSuiteRoot`](class.BlockSuiteRoot.md)

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:44](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L44)

## Methods

### \_beforeTextInput

> `private` **\_beforeTextInput**(`selection`, `event`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `selection` | [`TextSelection`](../../block-std/classes/class.TextSelection.md) |
| `event` | `InputEvent` |

#### Returns

`void`

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:145](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L145)

***

### \_onSelectionModelChanged

> `private` **\_onSelectionModelChanged**(`selections`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `selections` | [`BaseSelection`](../../block-std/classes/class.BaseSelection.md)[] |

#### Returns

`void`

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:114](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L114)

***

### \_shamefullyResetIMERangeBeforeInput

> `private` **\_shamefullyResetIMERangeBeforeInput**(
  `startText`,
  `startElement`,
  `from`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `startText` | [`Text`](../../store/classes/class.Text.md) |
| `startElement` | [`BlockElement`](class.BlockElement.md)\< [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \>, [`BlockService`](../../block-std/classes/class.BlockService.md)\< [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \> \>, `string` \> |
| `from` | [`TextRangePoint`](../../block-std/type-aliases/type-alias.TextRangePoint.md) |

#### Returns

`void`

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:208](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L208)

***

### setFilter

> **setFilter**(`filter`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `filter` | [`RangeSyncFilter`](../interfaces/interface.RangeSyncFilter.md) |

#### Returns

`void`

#### Defined In

[packages/lit/src/utils/range-synchronizer.ts:29](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/utils/range-synchronizer.ts#L29)

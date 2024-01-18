[API](../../../index.md) > [@blocksuite/store](../index.md) > Slice

# Class: Slice

## Constructors

### constructor

> **new Slice**(`data`): [`Slice`](class.Slice.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `data` | `SliceData` |

#### Returns

[`Slice`](class.Slice.md)

#### Defined In

[packages/store/src/transformer/slice.ts:31](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/slice.ts#L31)

## Properties

### data

> `readonly` **data**: `SliceData`

#### Defined In

[packages/store/src/transformer/slice.ts:31](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/slice.ts#L31)

## Accessors

### blockVersions

> `get` blockVersions(): `Record`\< `string`, `number` \>

#### Defined In

[packages/store/src/transformer/slice.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/slice.ts#L37)

***

### content

> `get` content(): [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>[]

#### Defined In

[packages/store/src/transformer/slice.ts:33](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/slice.ts#L33)

***

### pageId

> `get` pageId(): `string`

#### Defined In

[packages/store/src/transformer/slice.ts:53](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/slice.ts#L53)

***

### pageVersion

> `get` pageVersion(): `number`

#### Defined In

[packages/store/src/transformer/slice.ts:41](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/slice.ts#L41)

***

### workspaceId

> `get` workspaceId(): `string`

#### Defined In

[packages/store/src/transformer/slice.ts:49](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/slice.ts#L49)

***

### workspaceVersion

> `get` workspaceVersion(): `number`

#### Defined In

[packages/store/src/transformer/slice.ts:45](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/slice.ts#L45)

## Methods

### fromModels

> `static` **fromModels**(`page`, `models`): [`Slice`](class.Slice.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `page` | [`Page`](class.Page.md) |
| `models` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>[] |

#### Returns

[`Slice`](class.Slice.md)

#### Defined In

[packages/store/src/transformer/slice.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/slice.ts#L16)

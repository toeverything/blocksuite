[API](../../../index.md) > [@blocksuite/block-std](../index.md) > BlockSuiteViewSpec

# Interface: BlockSuiteViewSpec`<T>`

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` | `any` |

## Properties

### fromDOM

> **fromDOM**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | `Node` |

#### Returns

`null` \| [`NodeView`](../type-aliases/type-alias.NodeView.md)\< `T` \>

#### Defined In

[block-std/src/view/view-store.ts:9](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L9)

***

### getChildren

> **getChildren**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | `Element` |

#### Returns

`Element`[]

#### Defined In

[block-std/src/view/view-store.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L11)

***

### toDOM

> **toDOM**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `nodeView` | [`NodeView`](../type-aliases/type-alias.NodeView.md)\< `T` \> |

#### Returns

`Element`

#### Defined In

[block-std/src/view/view-store.ts:10](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L10)

***

### type

> **type**: `never`

#### Defined In

[block-std/src/view/view-store.ts:8](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L8)

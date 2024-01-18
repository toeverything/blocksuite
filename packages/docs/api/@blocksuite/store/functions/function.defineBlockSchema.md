[API](../../../index.md) > [@blocksuite/store](../index.md) > defineBlockSchema

# Function: defineBlockSchema

> **defineBlockSchema**<`Flavour`, `Role`, `Props`, `Ext`, `Metadata`, `Model`, `Transformer`>(`options`): `object`

## Type parameters

| Parameter |
| :------ |
| `Flavour` *extends* `string` |
| `Role` *extends* `"root"` \| `"hub"` \| `"content"` |
| `Props` *extends* `object` |
| `Ext` *extends* `Record`\< `string`, `unknown` \> |
| `Metadata` *extends* `Readonly`\< \{`children`: `string`[]; `parent`: `string`[]; `role`: `Role`; `version`: `number`;} \> |
| `Model` *extends* [`BaseBlockModel`](../classes/class.BaseBlockModel.md)\< `Props` \> |
| `Transformer` *extends* [`BaseBlockTransformer`](../classes/class.BaseBlockTransformer.md)\< `Props` \> |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `options` | `object` |
| `options.flavour` | `Flavour` |
| `options.metadata` | `Metadata` |
| `options.onUpgrade`? | `function` |
| `options.props`? | `function` |
| `options.toModel`? | `function` |
| `options.transformer`? | `function` |

## Returns

### `model`

> **model**: \{`flavour`: `Flavour`; `props`: [`PropsGetter`](../type-aliases/type-alias.PropsGetter.md)\< `Props` \>; `role`: `Role`;} & `Metadata`

> #### `model.flavour`
>
> > **flavour**: `Flavour`
>
> #### `model.props`
>
> > **props**: [`PropsGetter`](../type-aliases/type-alias.PropsGetter.md)\< `Props` \>
>
> #### `model.role`
>
> > **role**: `Role`
>
>

### `onUpgrade`

> `optional` **onUpgrade**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `data` | `Props` |
| `previousVersion` | `number` |
| `latestVersion` | `number` |

#### Returns

`void`

### `transformer`

> `optional` **transformer**: `function`

#### Returns

`Transformer`

### `version`

> **version**: `number`

## Defined In

[packages/store/src/schema/base.ts:76](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L76)

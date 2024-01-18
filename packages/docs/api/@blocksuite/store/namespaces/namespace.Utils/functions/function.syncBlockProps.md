[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Utils](../index.md) > syncBlockProps

# Function: syncBlockProps

> **syncBlockProps**(
  `schema`,
  `yBlock`,
  `props`): `void`

## Parameters

| Parameter | Type |
| :------ | :------ |
| `schema` | `object` |
| `schema.model` | `{ flavour: string; role: "root" | "hub" | "content"; parent?: string[] | undefined; children?: string[] | undefined; props?: ((args_0: InternalPrimitives, ...args_1: unknown[]) => Record<...>) | undefined; toModel?: ((...args: unknown[]) => BaseBlockModel<...>) | undefined; }` |
| `schema.onUpgrade`? | `function` |
| `schema.transformer`? | `function` |
| `schema.version` | `number` |
| `yBlock` | `YBlock` |
| `props` | `Partial`\< [`BlockProps`](../../../type-aliases/type-alias.BlockProps.md) \> |

## Returns

`void`

## Defined In

[packages/store/src/utils/utils.ts:26](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/utils/utils.ts#L26)

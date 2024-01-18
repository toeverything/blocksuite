[API](../../../index.md) > [@blocksuite/block-std](../index.md) > Command

# Type alias: Command`<In, Out, InData>`

> **Command**: <`In`, `Out`, `InData`> `function`

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `In` *extends* `BlockSuite.CommandDataName` | `never` |
| `Out` *extends* `BlockSuite.CommandDataName` | `never` |
| `InData` *extends* `object` | \{} |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `ctx` | [`CommandKeyToData`](type-alias.CommandKeyToData.md)\< `In` \> & [`InitCommandCtx`](../interfaces/interface.InitCommandCtx.md) & `InData` |
| `next` | `function` |

## Returns

`void`

## Defined In

[block-std/src/command/index.ts:22](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/command/index.ts#L22)

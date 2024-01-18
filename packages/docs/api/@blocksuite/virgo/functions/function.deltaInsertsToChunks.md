[API](../../../index.md) > [@blocksuite/virgo](../index.md) > deltaInsertsToChunks

# Function: deltaInsertsToChunks

> **deltaInsertsToChunks**<`TextAttributes`>(`delta`): [`DeltaInsert`](../type-aliases/type-alias.DeltaInsert.md)\< `TextAttributes` \>[][]

convert a delta insert array to chunks, each chunk is a line

## Type parameters

| Parameter |
| :------ |
| `TextAttributes` *extends* \{`bold`: `null` \| `true`; `code`: `null` \| `true`; `italic`: `null` \| `true`; `link`: `null` \| `string`; `strike`: `null` \| `true`; `underline`: `null` \| `true`;} |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `delta` | [`DeltaInsert`](../type-aliases/type-alias.DeltaInsert.md)\< `TextAttributes` \>[] |

## Returns

[`DeltaInsert`](../type-aliases/type-alias.DeltaInsert.md)\< `TextAttributes` \>[][]

## Defined In

[packages/virgo/src/utils/delta-convert.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/utils/delta-convert.ts#L37)

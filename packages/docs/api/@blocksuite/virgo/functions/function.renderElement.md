[API](../../../index.md) > [@blocksuite/virgo](../index.md) > renderElement

# Function: renderElement

> **renderElement**<`TextAttributes`>(
  `delta`,
  `parseAttributes`,
  `selected`): `TemplateResult`\< `1` \>

## Type parameters

| Parameter |
| :------ |
| `TextAttributes` *extends* \{`bold`: `null` \| `true`; `code`: `null` \| `true`; `italic`: `null` \| `true`; `link`: `null` \| `string`; `strike`: `null` \| `true`; `underline`: `null` \| `true`;} |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `delta` | [`DeltaInsert`](../type-aliases/type-alias.DeltaInsert.md)\< `TextAttributes` \> |
| `parseAttributes` | `function` |
| `selected` | `boolean` |

## Returns

`TemplateResult`\< `1` \>

## Defined In

[packages/virgo/src/utils/renderer.ts:6](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/utils/renderer.ts#L6)

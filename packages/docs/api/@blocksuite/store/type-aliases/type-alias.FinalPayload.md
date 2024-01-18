[API](../../../index.md) > [@blocksuite/store](../index.md) > FinalPayload

# Type alias: FinalPayload

> **FinalPayload**: \{`index`: `number`; `model`: [`BaseBlockModel`](../classes/class.BaseBlockModel.md); `parent`: `string`; `snapshot`: [`BlockSnapshot`](type-alias.BlockSnapshot.md); `type`: `"block"`;} \| \{`page`: [`Page`](../classes/class.Page.md); `snapshot`: [`PageSnapshot`](type-alias.PageSnapshot.md); `type`: `"page"`;} \| \{`slice`: [`Slice`](../classes/class.Slice.md); `snapshot`: [`SliceSnapshot`](type-alias.SliceSnapshot.md); `type`: `"slice"`;} \| \{`snapshot`: [`WorkspaceInfoSnapshot`](type-alias.WorkspaceInfoSnapshot.md); `type`: `"info"`;}

## Defined In

[packages/store/src/transformer/middleware.ts:51](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/middleware.ts#L51)

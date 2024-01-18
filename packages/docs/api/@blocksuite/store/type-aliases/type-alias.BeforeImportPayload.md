[API](../../../index.md) > [@blocksuite/store](../index.md) > BeforeImportPayload

# Type alias: BeforeImportPayload

> **BeforeImportPayload**: \{`index`: `number`; `parent`: `string`; `snapshot`: [`BlockSnapshot`](type-alias.BlockSnapshot.md); `type`: `"block"`;} \| \{`snapshot`: [`SliceSnapshot`](type-alias.SliceSnapshot.md); `type`: `"slice"`;} \| \{`snapshot`: [`PageSnapshot`](type-alias.PageSnapshot.md); `type`: `"page"`;} \| \{`snapshot`: [`WorkspaceInfoSnapshot`](type-alias.WorkspaceInfoSnapshot.md); `type`: `"info"`;}

## Defined In

[packages/store/src/transformer/middleware.ts:14](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/middleware.ts#L14)

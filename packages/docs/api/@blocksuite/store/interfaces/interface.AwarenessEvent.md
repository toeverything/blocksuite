[API](../../../index.md) > [@blocksuite/store](../index.md) > AwarenessEvent

# Interface: AwarenessEvent`<Flags>`

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `Flags` *extends* `Record`\< `string`, `unknown` \> | `BlockSuiteFlags` |

## Properties

### id

> **id**: `number`

#### Defined In

[packages/store/src/yjs/awareness.ts:25](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L25)

***

### state

> `optional` **state**: [`RawAwarenessState`](../type-aliases/type-alias.RawAwarenessState.md)\< `Flags` \>

#### Defined In

[packages/store/src/yjs/awareness.ts:27](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L27)

***

### type

> **type**: `"add"` \| `"update"` \| `"remove"`

#### Defined In

[packages/store/src/yjs/awareness.ts:26](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L26)

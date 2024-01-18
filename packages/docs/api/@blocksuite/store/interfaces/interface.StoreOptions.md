[API](../../../index.md) > [@blocksuite/store](../index.md) > StoreOptions

# Interface: StoreOptions`<Flags>`

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `Flags` *extends* `Record`\< `string`, `unknown` \> | `BlockSuiteFlags` |

## Properties

### awareness

> `optional` **awareness**: `Awareness`\< [`RawAwarenessState`](../type-aliases/type-alias.RawAwarenessState.md)\< `Flags` \> \>

#### Defined In

[packages/store/src/workspace/store.ts:49](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L49)

***

### blobStorages

> `optional` **blobStorages**: (`id`) => [`BlobStorage`](interface.BlobStorage.md)[]

#### Defined In

[packages/store/src/workspace/store.ts:52](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L52)

***

### defaultFlags

> `optional` **defaultFlags**: `Partial`\< `Flags` \>

#### Defined In

[packages/store/src/workspace/store.ts:51](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L51)

***

### id

> **id**: `string`

#### Defined In

[packages/store/src/workspace/store.ts:47](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L47)

***

### idGenerator

> `optional` **idGenerator**: [`IdGenerator`](../type-aliases/type-alias.IdGenerator.md) \| [`Generator`](../enumerations/enumeration.Generator.md)

#### Defined In

[packages/store/src/workspace/store.ts:50](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L50)

***

### providerCreators

> `optional` **providerCreators**: [`DocProviderCreator`](../type-aliases/type-alias.DocProviderCreator.md)[]

#### Defined In

[packages/store/src/workspace/store.ts:48](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L48)

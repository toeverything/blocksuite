[API](../../../index.md) > [@blocksuite/store](../index.md) > Store

# Class: Store

## Constructors

### constructor

> **new Store**(`__namedParameters` = `...`): [`Store`](class.Store.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | [`StoreOptions`](../interfaces/interface.StoreOptions.md)\< `BlockSuiteFlags` \> |

#### Returns

[`Store`](class.Store.md)

#### Defined In

[packages/store/src/workspace/store.ts:70](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L70)

## Properties

### awarenessStore

> `readonly` **awarenessStore**: [`AwarenessStore`](class.AwarenessStore.md)\< `BlockSuiteFlags` \>

#### Defined In

[packages/store/src/workspace/store.ts:67](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L67)

***

### doc

> `readonly` **doc**: [`BlockSuiteDoc`](class.BlockSuiteDoc.md)

#### Defined In

[packages/store/src/workspace/store.ts:64](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L64)

***

### id

> `readonly` **id**: `string`

#### Defined In

[packages/store/src/workspace/store.ts:63](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L63)

***

### idGenerator

> `readonly` **idGenerator**: [`IdGenerator`](../type-aliases/type-alias.IdGenerator.md)

#### Defined In

[packages/store/src/workspace/store.ts:68](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L68)

***

### providers

> `readonly` **providers**: [`DocProvider`](../type-aliases/type-alias.DocProvider.md)[] = `[]`

#### Defined In

[packages/store/src/workspace/store.ts:65](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L65)

***

### spaces

> `readonly` **spaces**: `Map`\< `string`, [`Space`](class.Space.md)\< `Record`\< `string`, `any` \> \> \>

#### Defined In

[packages/store/src/workspace/store.ts:66](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L66)

## Methods

### addSpace

> **addSpace**(`space`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `space` | [`Space`](class.Space.md)\< `Record`\< `string`, `any` \> \> |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/store.ts:129](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L129)

***

### registerProvider

> **registerProvider**(`providerCreator`, `id`?): [`DocProvider`](../type-aliases/type-alias.DocProvider.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `providerCreator` | [`DocProviderCreator`](../type-aliases/type-alias.DocProviderCreator.md) |
| `id`? | `string` |

#### Returns

[`DocProvider`](../type-aliases/type-alias.DocProvider.md)

#### Defined In

[packages/store/src/workspace/store.ts:120](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L120)

***

### removeSpace

> **removeSpace**(`space`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `space` | [`Space`](class.Space.md)\< `Record`\< `string`, `any` \> \> |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/store.ts:133](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L133)

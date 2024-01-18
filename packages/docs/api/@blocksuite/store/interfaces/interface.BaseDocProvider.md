[API](../../../index.md) > [@blocksuite/store](../index.md) > BaseDocProvider

# Interface: BaseDocProvider

Different examples of providers could include broadcast channel,
database like SQLite, LevelDB or IndexedDB.
Usually a provider will also implement [DocProviderCreator](../type-aliases/type-alias.DocProviderCreator.md).

## Extended By

- [`PassiveDocProvider`](interface.PassiveDocProvider.md)
- [`ActiveDocProvider`](interface.ActiveDocProvider.md)

## Properties

### cleanup

> `optional` **cleanup**: `function`

#### Returns

`void`

#### Description

Cleanup data when doc is removed.

#### Defined In

[packages/store/src/providers/type.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/providers/type.ts#L16)

***

### flavour

> **flavour**: `string`

#### Defined In

[packages/store/src/providers/type.ts:10](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/providers/type.ts#L10)

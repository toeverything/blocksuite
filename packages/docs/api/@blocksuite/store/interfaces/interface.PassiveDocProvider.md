[API](../../../index.md) > [@blocksuite/store](../index.md) > PassiveDocProvider

# Interface: PassiveDocProvider

## Description

If a provider is marked as passive, it's supposed to be connected in the background.
This means that the data might be stale when you use it.

## Extends

- [`BaseDocProvider`](interface.BaseDocProvider.md)

## Properties

### cleanup

> `optional` **cleanup**: `function`

#### Returns

`void`

#### Description

Cleanup data when doc is removed.

#### Defined In

[packages/store/src/providers/type.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/providers/type.ts#L16)

#### Inherited from

[`BaseDocProvider`](interface.BaseDocProvider.md).[`cleanup`](interface.BaseDocProvider.md#cleanup)

***

### flavour

> **flavour**: `string`

#### Defined In

[packages/store/src/providers/type.ts:10](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/providers/type.ts#L10)

#### Inherited from

[`BaseDocProvider`](interface.BaseDocProvider.md).[`flavour`](interface.BaseDocProvider.md#flavour)

***

### passive

> **passive**: `true`

#### Defined In

[packages/store/src/providers/type.ts:25](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/providers/type.ts#L25)

## Accessors

### connected

> `get` connected(): `boolean`

#### Defined In

[packages/store/src/providers/type.ts:26](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/providers/type.ts#L26)

## Methods

### connect

> **connect**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/providers/type.ts:27](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/providers/type.ts#L27)

***

### disconnect

> **disconnect**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/providers/type.ts:28](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/providers/type.ts#L28)

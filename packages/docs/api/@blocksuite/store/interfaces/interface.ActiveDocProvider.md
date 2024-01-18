[API](../../../index.md) > [@blocksuite/store](../index.md) > ActiveDocProvider

# Interface: ActiveDocProvider

## Description

If a provider is marked as active, it's supposed to be connected before you can use it.
This means that the data will be fresh before you use it.

## Extends

- [`BaseDocProvider`](interface.BaseDocProvider.md)

## Properties

### active

> **active**: `true`

#### Defined In

[packages/store/src/providers/type.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/providers/type.ts#L37)

***

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

## Accessors

### whenReady

> `get` whenReady(): `Promise`\< `void` \>

#### Defined In

[packages/store/src/providers/type.ts:44](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/providers/type.ts#L44)

## Methods

### sync

> **sync**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/providers/type.ts:38](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/providers/type.ts#L38)

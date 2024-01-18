[API](../../../index.md) > [@blocksuite/store](../index.md) > MemoryBlobManager

# Class: MemoryBlobManager

## Constructors

### constructor

> **new MemoryBlobManager**(): [`MemoryBlobManager`](class.MemoryBlobManager.md)

#### Returns

[`MemoryBlobManager`](class.MemoryBlobManager.md)

## Properties

### \_blobsRef

> `private` `readonly` **\_blobsRef**: `Map`\< `string`, `number` \>

#### Defined In

[packages/store/src/adapter/assets.ts:7](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/assets.ts#L7)

***

### \_map

> `private` `readonly` **\_map**: `Map`\< `string`, `Blob` \>

#### Defined In

[packages/store/src/adapter/assets.ts:6](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/assets.ts#L6)

## Methods

### decreaseRef

> **decreaseRef**(`blobId`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `blobId` | `string` |

#### Returns

`void`

#### Defined In

[packages/store/src/adapter/assets.ts:43](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/assets.ts#L43)

***

### delete

> **delete**(`key`): `Promise`\< `void` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`Promise`\< `void` \>

#### Defined In

[packages/store/src/adapter/assets.ts:19](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/assets.ts#L19)

***

### gc

> **gc**(): `Promise`\< `void` \>

#### Returns

`Promise`\< `void` \>

#### Defined In

[packages/store/src/adapter/assets.ts:27](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/assets.ts#L27)

***

### get

> **get**(`key`): `Promise`\< `null` \| `Blob` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`Promise`\< `null` \| `Blob` \>

#### Defined In

[packages/store/src/adapter/assets.ts:9](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/assets.ts#L9)

***

### increaseRef

> **increaseRef**(`blobId`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `blobId` | `string` |

#### Returns

`void`

#### Defined In

[packages/store/src/adapter/assets.ts:38](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/assets.ts#L38)

***

### list

> **list**(): `Promise`\< `string`[] \>

#### Returns

`Promise`\< `string`[] \>

#### Defined In

[packages/store/src/adapter/assets.ts:23](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/assets.ts#L23)

***

### set

> **set**(`value`, `key`?): `Promise`\< `string` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `Blob` |
| `key`? | `string` |

#### Returns

`Promise`\< `string` \>

#### Defined In

[packages/store/src/adapter/assets.ts:13](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/assets.ts#L13)

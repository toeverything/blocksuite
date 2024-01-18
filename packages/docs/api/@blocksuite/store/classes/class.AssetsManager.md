[API](../../../index.md) > [@blocksuite/store](../index.md) > AssetsManager

# Class: AssetsManager

## Constructors

### constructor

> **new AssetsManager**(`options`): [`AssetsManager`](class.AssetsManager.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `options` | `AssetsManagerConfig` |

#### Returns

[`AssetsManager`](class.AssetsManager.md)

#### Defined In

[packages/store/src/transformer/assets.ts:13](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/assets.ts#L13)

## Properties

### \_assetsMap

> `private` `readonly` **\_assetsMap**: `Map`\< `string`, `Blob` \>

#### Defined In

[packages/store/src/transformer/assets.ts:10](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/assets.ts#L10)

***

### \_blob

> `private` `readonly` **\_blob**: [`BlobManager`](../interfaces/interface.BlobManager.md)

#### Defined In

[packages/store/src/transformer/assets.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/assets.ts#L11)

## Methods

### cleanup

> **cleanup**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/transformer/assets.ts:21](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/assets.ts#L21)

***

### getAssets

> **getAssets**(): `Map`\< `string`, `Blob` \>

#### Returns

`Map`\< `string`, `Blob` \>

#### Defined In

[packages/store/src/transformer/assets.ts:17](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/assets.ts#L17)

***

### readFromBlob

> **readFromBlob**(`blobId`): `Promise`\< `void` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `blobId` | `string` |

#### Returns

`Promise`\< `void` \>

#### Defined In

[packages/store/src/transformer/assets.ts:25](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/assets.ts#L25)

***

### writeToBlob

> **writeToBlob**(`blobId`): `Promise`\< `void` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `blobId` | `string` |

#### Returns

`Promise`\< `void` \>

#### Defined In

[packages/store/src/transformer/assets.ts:32](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/assets.ts#L32)

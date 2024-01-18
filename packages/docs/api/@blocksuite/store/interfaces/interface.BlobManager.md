[API](../../../index.md) > [@blocksuite/store](../index.md) > BlobManager

# Interface: BlobManager

## Properties

### decreaseRef

> **decreaseRef**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `blobId` | `string` |

#### Returns

`void`

#### Defined In

[packages/store/src/persistence/blob/types.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/persistence/blob/types.ts#L16)

***

### delete

> **delete**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`Promise`\< `void` \>

#### Defined In

[packages/store/src/persistence/blob/types.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/persistence/blob/types.ts#L11)

***

### gc

> **gc**: `function`

#### Returns

`Promise`\< `void` \>

#### Defined In

[packages/store/src/persistence/blob/types.ts:14](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/persistence/blob/types.ts#L14)

***

### get

> **get**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`Promise`\< `null` \| `Blob` \>

#### Defined In

[packages/store/src/persistence/blob/types.ts:9](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/persistence/blob/types.ts#L9)

***

### increaseRef

> **increaseRef**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `blobId` | `string` |

#### Returns

`void`

#### Defined In

[packages/store/src/persistence/blob/types.ts:15](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/persistence/blob/types.ts#L15)

***

### list

> **list**: `function`

#### Returns

`Promise`\< `string`[] \>

#### Defined In

[packages/store/src/persistence/blob/types.ts:12](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/persistence/blob/types.ts#L12)

***

### set

> **set**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `Blob` |
| `key`? | `string` |

#### Returns

`Promise`\< `string` \>

#### Defined In

[packages/store/src/persistence/blob/types.ts:10](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/persistence/blob/types.ts#L10)

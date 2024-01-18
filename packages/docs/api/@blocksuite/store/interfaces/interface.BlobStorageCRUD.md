[API](../../../index.md) > [@blocksuite/store](../index.md) > BlobStorageCRUD

# Interface: BlobStorageCRUD

## Properties

### delete

> **delete**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`Promise`\< `void` \>

#### Defined In

[packages/store/src/persistence/blob/types.ts:4](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/persistence/blob/types.ts#L4)

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

[packages/store/src/persistence/blob/types.ts:2](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/persistence/blob/types.ts#L2)

***

### list

> **list**: `function`

#### Returns

`Promise`\< `string`[] \>

#### Defined In

[packages/store/src/persistence/blob/types.ts:5](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/persistence/blob/types.ts#L5)

***

### set

> **set**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |
| `value` | `Blob` |

#### Returns

`Promise`\< `string` \>

#### Defined In

[packages/store/src/persistence/blob/types.ts:3](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/persistence/blob/types.ts#L3)

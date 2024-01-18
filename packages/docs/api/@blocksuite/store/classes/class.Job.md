[API](../../../index.md) > [@blocksuite/store](../index.md) > Job

# Class: Job

## Constructors

### constructor

> **new Job**(`__namedParameters`): [`Job`](class.Job.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | [`JobConfig`](../type-aliases/type-alias.JobConfig.md) |

#### Returns

[`Job`](class.Job.md)

#### Defined In

[packages/store/src/transformer/job.ts:47](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L47)

## Properties

### \_assetsManager

> `private` `readonly` **\_assetsManager**: [`AssetsManager`](class.AssetsManager.md)

#### Defined In

[packages/store/src/transformer/job.ts:38](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L38)

***

### \_slots

> `private` `readonly` **\_slots**: [`JobSlots`](../type-aliases/type-alias.JobSlots.md)

#### Defined In

[packages/store/src/transformer/job.ts:40](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L40)

***

### \_workspace

> `private` `readonly` **\_workspace**: [`Workspace`](class.Workspace.md)

#### Defined In

[packages/store/src/transformer/job.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L37)

## Accessors

### assets

> `get` assets(): `Map`\< `string`, `Blob` \>

#### Defined In

[packages/store/src/transformer/job.ts:64](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L64)

***

### assetsManager

> `get` assetsManager(): [`AssetsManager`](class.AssetsManager.md)

#### Defined In

[packages/store/src/transformer/job.ts:60](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L60)

## Methods

### \_blockToSnapshot

> `private` **\_blockToSnapshot**(`model`): `Promise`\< [`BlockSnapshot`](../type-aliases/type-alias.BlockSnapshot.md) \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |

#### Returns

`Promise`\< [`BlockSnapshot`](../type-aliases/type-alias.BlockSnapshot.md) \>

#### Defined In

[packages/store/src/transformer/job.ts:126](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L126)

***

### \_exportPageMeta

> `private` **\_exportPageMeta**(`page`): [`PageMeta`](../interfaces/interface.PageMeta.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `page` | [`Page`](class.Page.md) |

#### Returns

[`PageMeta`](../interfaces/interface.PageMeta.md)

#### Defined In

[packages/store/src/transformer/job.ts:100](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L100)

***

### \_getSchema

> `private` **\_getSchema**(`flavour`): `object`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `flavour` | `string` |

#### Returns

##### `model`

> **model**: `{ flavour: string; role: "root" | "hub" | "content"; parent?: string[] | undefined; children?: string[] | undefined; props?: ((args_0: InternalPrimitives, ...args_1: unknown[]) => Record<...>) | undefined; toModel?: ((...args: unknown[]) => BaseBlockModel<...>) | undefined; }`

##### `onUpgrade`

> `optional` **onUpgrade**: `function`

###### Parameters

| Parameter | Type |
| :------ | :------ |
| ...`args` | [`any`, `number`, `number`, `...unknown[]`] |

###### Returns

`void`

##### `transformer`

> `optional` **transformer**: `function`

###### Parameters

| Parameter | Type |
| :------ | :------ |
| ...`args` | `unknown`[] |

###### Returns

[`BaseBlockTransformer`](class.BaseBlockTransformer.md)\< `object` \>

##### `version`

> **version**: `number`

#### Defined In

[packages/store/src/transformer/job.ts:72](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L72)

***

### \_getTransformer

> `private` **\_getTransformer**(`schema`): [`BaseBlockTransformer`](class.BaseBlockTransformer.md)\< `object` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `schema` | `object` |
| `schema.model` | `{ flavour: string; role: "root" | "hub" | "content"; parent?: string[] | undefined; children?: string[] | undefined; props?: ((args_0: InternalPrimitives, ...args_1: unknown[]) => Record<...>) | undefined; toModel?: ((...args: unknown[]) => BaseBlockModel<...>) | undefined; }` |
| `schema.onUpgrade`? | `function` |
| `schema.transformer`? | `function` |
| `schema.version` | `number` |

#### Returns

[`BaseBlockTransformer`](class.BaseBlockTransformer.md)\< `object` \>

#### Defined In

[packages/store/src/transformer/job.ts:78](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L78)

***

### \_getWorkspaceMeta

> `private` **\_getWorkspaceMeta**(): `object`

#### Returns

##### `blockVersions`

> **blockVersions**: `object`

##### `pageVersion`

> **pageVersion**: `number`

##### `pages`

> **pages**: [`PageMeta`](../interfaces/interface.PageMeta.md)[]

##### `properties`

> **properties**: `PagesPropertiesMeta`

##### `workspaceVersion`

> **workspaceVersion**: `number`

#### Defined In

[packages/store/src/transformer/job.ts:82](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L82)

***

### \_importPageMeta

> `private` **\_importPageMeta**(`page`, `meta`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `page` | [`Page`](class.Page.md) |
| `meta` | [`PageMeta`](../interfaces/interface.PageMeta.md) |

#### Returns

`void`

#### Defined In

[packages/store/src/transformer/job.ts:112](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L112)

***

### \_snapshotToBlock

> `private` **\_snapshotToBlock**(
  `snapshot`,
  `page`,
  `parent`?,
  `index`?): `Promise`\< [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `snapshot` | [`BlockSnapshot`](../type-aliases/type-alias.BlockSnapshot.md) |
| `page` | [`Page`](class.Page.md) |
| `parent`? | `string` |
| `index`? | `number` |

#### Returns

`Promise`\< [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> \>

#### Defined In

[packages/store/src/transformer/job.ts:165](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L165)

***

### blockToSnapshot

> **blockToSnapshot**(`model`): `Promise`\< [`BlockSnapshot`](../type-aliases/type-alias.BlockSnapshot.md) \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |

#### Returns

`Promise`\< [`BlockSnapshot`](../type-aliases/type-alias.BlockSnapshot.md) \>

#### Defined In

[packages/store/src/transformer/job.ts:158](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L158)

***

### pageToSnapshot

> **pageToSnapshot**(`page`): `Promise`\< [`PageSnapshot`](../type-aliases/type-alias.PageSnapshot.md) \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `page` | [`Page`](class.Page.md) |

#### Returns

`Promise`\< [`PageSnapshot`](../type-aliases/type-alias.PageSnapshot.md) \>

#### Defined In

[packages/store/src/transformer/job.ts:228](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L228)

***

### reset

> **reset**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/transformer/job.ts:68](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L68)

***

### sliceToSnapshot

> **sliceToSnapshot**(`slice`): `Promise`\< [`SliceSnapshot`](../type-aliases/type-alias.SliceSnapshot.md) \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `slice` | [`Slice`](class.Slice.md) |

#### Returns

`Promise`\< [`SliceSnapshot`](../type-aliases/type-alias.SliceSnapshot.md) \>

#### Defined In

[packages/store/src/transformer/job.ts:313](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L313)

***

### snapshotToBlock

> **snapshotToBlock**(
  `snapshot`,
  `page`,
  `parent`?,
  `index`?): `Promise`\< [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `snapshot` | [`BlockSnapshot`](../type-aliases/type-alias.BlockSnapshot.md) |
| `page` | [`Page`](class.Page.md) |
| `parent`? | `string` |
| `index`? | `number` |

#### Returns

`Promise`\< [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> \>

#### Defined In

[packages/store/src/transformer/job.ts:216](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L216)

***

### snapshotToPage

> **snapshotToPage**(`snapshot`): `Promise`\< [`Page`](class.Page.md) \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `snapshot` | [`PageSnapshot`](../type-aliases/type-alias.PageSnapshot.md) |

#### Returns

`Promise`\< [`Page`](class.Page.md) \>

#### Defined In

[packages/store/src/transformer/job.ts:252](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L252)

***

### snapshotToSlice

> **snapshotToSlice**(
  `snapshot`,
  `page`,
  `parent`?,
  `index`?): `Promise`\< [`Slice`](class.Slice.md) \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `snapshot` | [`SliceSnapshot`](../type-aliases/type-alias.SliceSnapshot.md) |
| `page` | [`Page`](class.Page.md) |
| `parent`? | `string` |
| `index`? | `number` |

#### Returns

`Promise`\< [`Slice`](class.Slice.md) \>

#### Defined In

[packages/store/src/transformer/job.ts:348](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L348)

***

### snapshotToWorkspaceInfo

> **snapshotToWorkspaceInfo**(`snapshot`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `snapshot` | [`WorkspaceInfoSnapshot`](../type-aliases/type-alias.WorkspaceInfoSnapshot.md) |

#### Returns

`void`

#### Defined In

[packages/store/src/transformer/job.ts:291](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L291)

***

### workspaceInfoToSnapshot

> **workspaceInfoToSnapshot**(): [`WorkspaceInfoSnapshot`](../type-aliases/type-alias.WorkspaceInfoSnapshot.md)

#### Returns

[`WorkspaceInfoSnapshot`](../type-aliases/type-alias.WorkspaceInfoSnapshot.md)

#### Defined In

[packages/store/src/transformer/job.ts:272](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/job.ts#L272)

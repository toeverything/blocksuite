[API](../../../index.md) > [@blocksuite/store](../index.md) > BaseAdapter

# Class: BaseAdapter`<AdapterTarget>`

## Constructors

### constructor

> **new BaseAdapter**<`AdapterTarget`>(): [`BaseAdapter`](class.BaseAdapter.md)\< `AdapterTarget` \>

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `AdapterTarget` | `unknown` |

#### Returns

[`BaseAdapter`](class.BaseAdapter.md)\< `AdapterTarget` \>

## Methods

### fromBlockSnapshot

> `abstract` **fromBlockSnapshot**(`payload`): `Promise`\< [`FromBlockSnapshotResult`](../type-aliases/type-alias.FromBlockSnapshotResult.md)\< `AdapterTarget` \> \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `payload` | [`FromBlockSnapshotPayload`](../type-aliases/type-alias.FromBlockSnapshotPayload.md) |

#### Returns

`Promise`\< [`FromBlockSnapshotResult`](../type-aliases/type-alias.FromBlockSnapshotResult.md)\< `AdapterTarget` \> \>

#### Defined In

[packages/store/src/adapter/base.ts:52](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L52)

***

### fromPageSnapshot

> `abstract` **fromPageSnapshot**(`payload`): `Promise`\< [`FromPageSnapshotResult`](../type-aliases/type-alias.FromPageSnapshotResult.md)\< `AdapterTarget` \> \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `payload` | [`FromPageSnapshotPayload`](../type-aliases/type-alias.FromPageSnapshotPayload.md) |

#### Returns

`Promise`\< [`FromPageSnapshotResult`](../type-aliases/type-alias.FromPageSnapshotResult.md)\< `AdapterTarget` \> \>

#### Defined In

[packages/store/src/adapter/base.ts:49](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L49)

***

### fromSliceSnapshot

> `abstract` **fromSliceSnapshot**(`payload`): `Promise`\< [`FromSliceSnapshotResult`](../type-aliases/type-alias.FromSliceSnapshotResult.md)\< `AdapterTarget` \> \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `payload` | [`FromSliceSnapshotPayload`](../type-aliases/type-alias.FromSliceSnapshotPayload.md) |

#### Returns

`Promise`\< [`FromSliceSnapshotResult`](../type-aliases/type-alias.FromSliceSnapshotResult.md)\< `AdapterTarget` \> \>

#### Defined In

[packages/store/src/adapter/base.ts:55](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L55)

***

### toBlockSnapshot

> `abstract` **toBlockSnapshot**(`payload`): `Promise`\< [`BlockSnapshot`](../type-aliases/type-alias.BlockSnapshot.md) \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `payload` | [`ToBlockSnapshotPayload`](../type-aliases/type-alias.ToBlockSnapshotPayload.md)\< `AdapterTarget` \> |

#### Returns

`Promise`\< [`BlockSnapshot`](../type-aliases/type-alias.BlockSnapshot.md) \>

#### Defined In

[packages/store/src/adapter/base.ts:61](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L61)

***

### toPageSnapshot

> `abstract` **toPageSnapshot**(`payload`): `Promise`\< [`PageSnapshot`](../type-aliases/type-alias.PageSnapshot.md) \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `payload` | [`ToPageSnapshotPayload`](../type-aliases/type-alias.ToPageSnapshotPayload.md)\< `AdapterTarget` \> |

#### Returns

`Promise`\< [`PageSnapshot`](../type-aliases/type-alias.PageSnapshot.md) \>

#### Defined In

[packages/store/src/adapter/base.ts:58](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L58)

***

### toSliceSnapshot

> `abstract` **toSliceSnapshot**(`payload`): `Promise`\< [`SliceSnapshot`](../type-aliases/type-alias.SliceSnapshot.md) \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `payload` | [`ToSliceSnapshotPayload`](../type-aliases/type-alias.ToSliceSnapshotPayload.md)\< `AdapterTarget` \> |

#### Returns

`Promise`\< [`SliceSnapshot`](../type-aliases/type-alias.SliceSnapshot.md) \>

#### Defined In

[packages/store/src/adapter/base.ts:64](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L64)

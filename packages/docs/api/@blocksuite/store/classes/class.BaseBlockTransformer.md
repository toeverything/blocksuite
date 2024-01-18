[API](../../../index.md) > [@blocksuite/store](../index.md) > BaseBlockTransformer

# Class: BaseBlockTransformer`<Props>`

## Constructors

### constructor

> **new BaseBlockTransformer**<`Props`>(): [`BaseBlockTransformer`](class.BaseBlockTransformer.md)\< `Props` \>

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `Props` *extends* `object` | `object` |

#### Returns

[`BaseBlockTransformer`](class.BaseBlockTransformer.md)\< `Props` \>

## Properties

### \_internal

> `protected` **\_internal**: [`InternalPrimitives`](../interfaces/interface.InternalPrimitives.md) = `internalPrimitives`

#### Defined In

[packages/store/src/transformer/base.ts:27](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/base.ts#L27)

## Methods

### \_propsFromSnapshot

> `protected` **\_propsFromSnapshot**(`propsJson`): `Props`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `propsJson` | `Record`\< `string`, `unknown` \> |

#### Returns

`Props`

#### Defined In

[packages/store/src/transformer/base.ts:29](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/base.ts#L29)

***

### \_propsToSnapshot

> `protected` **\_propsToSnapshot**(`model`): `object`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |

#### Returns

`object`

#### Defined In

[packages/store/src/transformer/base.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/base.ts#L37)

***

### fromSnapshot

> **fromSnapshot**(`__namedParameters`): `Promise`\< [`SnapshotReturn`](../type-aliases/type-alias.SnapshotReturn.md)\< `Props` \> \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | [`FromSnapshotPayload`](../type-aliases/type-alias.FromSnapshotPayload.md) |

#### Returns

`Promise`\< [`SnapshotReturn`](../type-aliases/type-alias.SnapshotReturn.md)\< `Props` \> \>

#### Defined In

[packages/store/src/transformer/base.ts:46](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/base.ts#L46)

***

### toSnapshot

> **toSnapshot**(`__namedParameters`): `Promise`\< `BlockSnapshotLeaf` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | [`ToSnapshotPayload`](../type-aliases/type-alias.ToSnapshotPayload.md)\< `Props` \> |

#### Returns

`Promise`\< `BlockSnapshotLeaf` \>

#### Defined In

[packages/store/src/transformer/base.ts:60](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/transformer/base.ts#L60)

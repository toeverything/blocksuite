[API](../../../index.md) > [@blocksuite/block-std](../index.md) > SpecStore

# Class: SpecStore

## Constructors

### constructor

> **new SpecStore**(`std`): [`SpecStore`](class.SpecStore.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `std` | [`BlockStdProvider`](class.BlockStdProvider.md) |

#### Returns

[`SpecStore`](class.SpecStore.md)

#### Defined In

[block-std/src/spec/spec-store.ts:8](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/spec/spec-store.ts#L8)

## Properties

### \_services

> `private` **\_services**: `Map`\< `string`, [`BlockService`](class.BlockService.md)\< [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \> \> \>

#### Defined In

[block-std/src/spec/spec-store.ts:6](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/spec/spec-store.ts#L6)

***

### \_specs

> `private` **\_specs**: `Map`\< `string`, [`BlockSpec`](../interfaces/interface.BlockSpec.md)\< `string` \> \>

#### Defined In

[block-std/src/spec/spec-store.ts:5](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/spec/spec-store.ts#L5)

***

### std

> **std**: [`BlockStdProvider`](class.BlockStdProvider.md)

#### Defined In

[block-std/src/spec/spec-store.ts:8](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/spec/spec-store.ts#L8)

## Methods

### \_buildSpecMap

> `private` **\_buildSpecMap**(`specs`): `Map`\< `string`, [`BlockSpec`](../interfaces/interface.BlockSpec.md)\< `string` \> \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `specs` | [`BlockSpec`](../interfaces/interface.BlockSpec.md)\< `string` \>[] |

#### Returns

`Map`\< `string`, [`BlockSpec`](../interfaces/interface.BlockSpec.md)\< `string` \> \>

#### Defined In

[block-std/src/spec/spec-store.ts:75](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/spec/spec-store.ts#L75)

***

### \_diffServices

> `private` **\_diffServices**(`oldSpecs`, `newSpecs`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `oldSpecs` | `Map`\< `string`, [`BlockSpec`](../interfaces/interface.BlockSpec.md)\< `string` \> \> |
| `newSpecs` | `Map`\< `string`, [`BlockSpec`](../interfaces/interface.BlockSpec.md)\< `string` \> \> |

#### Returns

`void`

#### Defined In

[block-std/src/spec/spec-store.ts:38](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/spec/spec-store.ts#L38)

***

### applySpecs

> **applySpecs**(`specs`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `specs` | [`BlockSpec`](../interfaces/interface.BlockSpec.md)\< `string` \>[] |

#### Returns

`void`

#### Defined In

[block-std/src/spec/spec-store.ts:18](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/spec/spec-store.ts#L18)

***

### dispose

> **dispose**(): `void`

#### Returns

`void`

#### Defined In

[block-std/src/spec/spec-store.ts:10](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/spec/spec-store.ts#L10)

***

### getService

> **getService**(`flavour`): `undefined` \| [`BlockService`](class.BlockService.md)\< [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \> \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `flavour` | `string` |

#### Returns

`undefined` \| [`BlockService`](class.BlockService.md)\< [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \> \>

#### Defined In

[block-std/src/spec/spec-store.ts:34](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/spec/spec-store.ts#L34)

***

### getView

> **getView**(`flavour`): `null` \| [`BlockView`](../interfaces/interface.BlockView.md)\< `string` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `flavour` | `string` |

#### Returns

`null` \| [`BlockView`](../interfaces/interface.BlockView.md)\< `string` \>

#### Defined In

[block-std/src/spec/spec-store.ts:25](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/spec/spec-store.ts#L25)

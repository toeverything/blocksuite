[API](../../../index.md) > [@blocksuite/block-std](../index.md) > BlockSelection

# Class: BlockSelection

## Extends

- [`BaseSelection`](class.BaseSelection.md)

## Constructors

### constructor

> **new BlockSelection**(`__namedParameters`): [`BlockSelection`](class.BlockSelection.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | [`BaseSelectionOptions`](../type-aliases/type-alias.BaseSelectionOptions.md) |

#### Returns

[`BlockSelection`](class.BlockSelection.md)

#### Inherited from

[`BaseSelection`](class.BaseSelection.md).[`constructor`](class.BaseSelection.md#constructor)

#### Defined In

[block-std/src/selection/base.ts:18](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L18)

## Properties

### path

> `readonly` **path**: `string`[]

#### Defined In

[block-std/src/selection/base.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L16)

#### Inherited from

[`BaseSelection`](class.BaseSelection.md).[`path`](class.BaseSelection.md#path)

***

### group

> `static` **group**: `string` = `'note'`

#### Defined In

[block-std/src/selection/variants/block.ts:12](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/block.ts#L12)

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`group`](class.BaseSelection.md#group)

***

### type

> `static` **type**: `string` = `'block'`

#### Defined In

[block-std/src/selection/variants/block.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/block.ts#L11)

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`type`](class.BaseSelection.md#type)

## Accessors

### blockId

> `get` blockId(): `string`

#### Defined In

[block-std/src/selection/base.ts:22](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L22)

#### Inherited from

[`BaseSelection`](class.BaseSelection.md).[`blockId`](class.BaseSelection.md#blockid)

***

### group

> `get` group(): `string`

#### Defined In

[block-std/src/selection/base.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L37)

#### Inherited from

[`BaseSelection`](class.BaseSelection.md).[`group`](class.BaseSelection.md#group-2)

***

### type

> `get` type(): *keyof* `Selection`

#### Defined In

[block-std/src/selection/base.ts:32](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L32)

#### Inherited from

[`BaseSelection`](class.BaseSelection.md).[`type`](class.BaseSelection.md#type-2)

## Methods

### equals

> **equals**(`other`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `other` | [`BaseSelection`](class.BaseSelection.md) |

#### Returns

`boolean`

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`equals`](class.BaseSelection.md#equals)

#### Defined In

[block-std/src/selection/variants/block.ts:14](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/block.ts#L14)

***

### is

> **is**<`T`>(`type`): `this is SelectionInstance[T]`

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* *keyof* `Selection` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `T` |

#### Returns

`this is SelectionInstance[T]`

#### Inherited from

[`BaseSelection`](class.BaseSelection.md).[`is`](class.BaseSelection.md#is)

#### Defined In

[block-std/src/selection/base.ts:26](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L26)

***

### toJSON

> **toJSON**(): `Record`\< `string`, `unknown` \>

#### Returns

`Record`\< `string`, `unknown` \>

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`toJSON`](class.BaseSelection.md#tojson)

#### Defined In

[block-std/src/selection/variants/block.ts:21](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/block.ts#L21)

***

### fromJSON

> `static` **fromJSON**(`json`): [`BlockSelection`](class.BlockSelection.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `json` | `Record`\< `string`, `unknown` \> |

#### Returns

[`BlockSelection`](class.BlockSelection.md)

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`fromJSON`](class.BaseSelection.md#fromjson)

#### Defined In

[block-std/src/selection/variants/block.ts:28](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/block.ts#L28)

[API](../../../index.md) > [@blocksuite/block-std](../index.md) > BaseSelection

# Class: BaseSelection

## Extended By

- [`BlockSelection`](class.BlockSelection.md)
- [`CursorSelection`](class.CursorSelection.md)
- [`SurfaceSelection`](class.SurfaceSelection.md)
- [`TextSelection`](class.TextSelection.md)

## Constructors

### constructor

> **new BaseSelection**(`__namedParameters`): [`BaseSelection`](class.BaseSelection.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | [`BaseSelectionOptions`](../type-aliases/type-alias.BaseSelectionOptions.md) |

#### Returns

[`BaseSelection`](class.BaseSelection.md)

#### Defined In

[block-std/src/selection/base.ts:18](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L18)

## Properties

### path

> `readonly` **path**: `string`[]

#### Defined In

[block-std/src/selection/base.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L16)

***

### group

> `static` `readonly` **group**: `string`

#### Defined In

[block-std/src/selection/base.ts:15](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L15)

***

### type

> `static` `readonly` **type**: `string`

#### Defined In

[block-std/src/selection/base.ts:14](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L14)

## Accessors

### blockId

> `get` blockId(): `string`

#### Defined In

[block-std/src/selection/base.ts:22](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L22)

***

### group

> `get` group(): `string`

#### Defined In

[block-std/src/selection/base.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L37)

***

### type

> `get` type(): *keyof* `Selection`

#### Defined In

[block-std/src/selection/base.ts:32](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L32)

## Methods

### equals

> `abstract` **equals**(`other`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `other` | [`BaseSelection`](class.BaseSelection.md) |

#### Returns

`boolean`

#### Defined In

[block-std/src/selection/base.ts:41](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L41)

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

#### Defined In

[block-std/src/selection/base.ts:26](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L26)

***

### toJSON

> `abstract` **toJSON**(): `Record`\< `string`, `unknown` \>

#### Returns

`Record`\< `string`, `unknown` \>

#### Defined In

[block-std/src/selection/base.ts:43](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L43)

***

### fromJSON

> `static` **fromJSON**(`_`): [`BaseSelection`](class.BaseSelection.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `_` | `Record`\< `string`, `unknown` \> |

#### Returns

[`BaseSelection`](class.BaseSelection.md)

#### Defined In

[block-std/src/selection/base.ts:45](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L45)

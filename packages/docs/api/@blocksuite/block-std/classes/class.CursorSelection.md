[API](../../../index.md) > [@blocksuite/block-std](../index.md) > CursorSelection

# Class: CursorSelection

## Extends

- [`BaseSelection`](class.BaseSelection.md)

## Constructors

### constructor

> **new CursorSelection**(`x`, `y`): [`CursorSelection`](class.CursorSelection.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `x` | `number` |
| `y` | `number` |

#### Returns

[`CursorSelection`](class.CursorSelection.md)

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`constructor`](class.BaseSelection.md#constructor)

#### Defined In

[block-std/src/selection/variants/cursor.ts:17](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/cursor.ts#L17)

## Properties

### path

> `readonly` **path**: `string`[]

#### Defined In

[block-std/src/selection/base.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L16)

#### Inherited from

[`BaseSelection`](class.BaseSelection.md).[`path`](class.BaseSelection.md#path)

***

### x

> `readonly` **x**: `number`

#### Defined In

[block-std/src/selection/variants/cursor.ts:14](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/cursor.ts#L14)

***

### y

> `readonly` **y**: `number`

#### Defined In

[block-std/src/selection/variants/cursor.ts:15](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/cursor.ts#L15)

***

### group

> `static` **group**: `string` = `'edgeless'`

#### Defined In

[block-std/src/selection/variants/cursor.ts:12](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/cursor.ts#L12)

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`group`](class.BaseSelection.md#group)

***

### type

> `static` **type**: `string` = `'cursor'`

#### Defined In

[block-std/src/selection/variants/cursor.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/cursor.ts#L11)

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

[block-std/src/selection/variants/cursor.ts:23](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/cursor.ts#L23)

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

[block-std/src/selection/variants/cursor.ts:31](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/cursor.ts#L31)

***

### fromJSON

> `static` **fromJSON**(`json`): [`CursorSelection`](class.CursorSelection.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `json` | `Record`\< `string`, `unknown` \> |

#### Returns

[`CursorSelection`](class.CursorSelection.md)

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`fromJSON`](class.BaseSelection.md#fromjson)

#### Defined In

[block-std/src/selection/variants/cursor.ts:39](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/cursor.ts#L39)

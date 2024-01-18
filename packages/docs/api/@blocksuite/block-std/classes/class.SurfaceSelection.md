[API](../../../index.md) > [@blocksuite/block-std](../index.md) > SurfaceSelection

# Class: SurfaceSelection

## Extends

- [`BaseSelection`](class.BaseSelection.md)

## Constructors

### constructor

> **new SurfaceSelection**(`elements`, `editing`): [`SurfaceSelection`](class.SurfaceSelection.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `elements` | `string`[] |
| `editing` | `boolean` |

#### Returns

[`SurfaceSelection`](class.SurfaceSelection.md)

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`constructor`](class.BaseSelection.md#constructor)

#### Defined In

[block-std/src/selection/variants/surface.ts:17](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/surface.ts#L17)

## Properties

### editing

> `readonly` **editing**: `boolean`

#### Defined In

[block-std/src/selection/variants/surface.ts:15](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/surface.ts#L15)

***

### elements

> `readonly` **elements**: `string`[]

#### Defined In

[block-std/src/selection/variants/surface.ts:14](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/surface.ts#L14)

***

### path

> `readonly` **path**: `string`[]

#### Defined In

[block-std/src/selection/base.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L16)

#### Inherited from

[`BaseSelection`](class.BaseSelection.md).[`path`](class.BaseSelection.md#path)

***

### group

> `static` **group**: `string` = `'edgeless'`

#### Defined In

[block-std/src/selection/variants/surface.ts:12](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/surface.ts#L12)

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`group`](class.BaseSelection.md#group)

***

### type

> `static` **type**: `string` = `'surface'`

#### Defined In

[block-std/src/selection/variants/surface.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/surface.ts#L11)

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

[block-std/src/selection/variants/surface.ts:27](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/surface.ts#L27)

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

### isEmpty

> **isEmpty**(): `boolean`

#### Returns

`boolean`

#### Defined In

[block-std/src/selection/variants/surface.ts:23](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/surface.ts#L23)

***

### toJSON

> **toJSON**(): `Record`\< `string`, `unknown` \>

#### Returns

`Record`\< `string`, `unknown` \>

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`toJSON`](class.BaseSelection.md#tojson)

#### Defined In

[block-std/src/selection/variants/surface.ts:40](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/surface.ts#L40)

***

### fromJSON

> `static` **fromJSON**(`json`): [`SurfaceSelection`](class.SurfaceSelection.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `json` | `Record`\< `string`, `unknown` \> \| \{`editing`: `boolean`; `elements`: `string`[];} |

#### Returns

[`SurfaceSelection`](class.SurfaceSelection.md)

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`fromJSON`](class.BaseSelection.md#fromjson)

#### Defined In

[block-std/src/selection/variants/surface.ts:49](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/surface.ts#L49)

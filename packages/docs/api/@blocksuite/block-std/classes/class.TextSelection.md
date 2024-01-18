[API](../../../index.md) > [@blocksuite/block-std](../index.md) > TextSelection

# Class: TextSelection

## Extends

- [`BaseSelection`](class.BaseSelection.md)

## Constructors

### constructor

> **new TextSelection**(`__namedParameters`): [`TextSelection`](class.TextSelection.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | [`TextSelectionProps`](../type-aliases/type-alias.TextSelectionProps.md) |

#### Returns

[`TextSelection`](class.TextSelection.md)

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`constructor`](class.BaseSelection.md#constructor)

#### Defined In

[block-std/src/selection/variants/text.ts:46](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L46)

## Properties

### from

> **from**: [`TextRangePoint`](../type-aliases/type-alias.TextRangePoint.md)

#### Defined In

[block-std/src/selection/variants/text.ts:40](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L40)

***

### isReverse

> **isReverse**: `boolean`

#### Defined In

[block-std/src/selection/variants/text.ts:44](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L44)

***

### path

> `readonly` **path**: `string`[]

#### Defined In

[block-std/src/selection/base.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L16)

#### Inherited from

[`BaseSelection`](class.BaseSelection.md).[`path`](class.BaseSelection.md#path)

***

### to

> **to**: `null` \| [`TextRangePoint`](../type-aliases/type-alias.TextRangePoint.md)

#### Defined In

[block-std/src/selection/variants/text.ts:42](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L42)

***

### group

> `static` **group**: `string` = `'note'`

#### Defined In

[block-std/src/selection/variants/text.ts:38](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L38)

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`group`](class.BaseSelection.md#group)

***

### type

> `static` **type**: `string` = `'text'`

#### Defined In

[block-std/src/selection/variants/text.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L37)

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

### end

> `get` end(): [`TextRangePoint`](../type-aliases/type-alias.TextRangePoint.md)

#### Defined In

[block-std/src/selection/variants/text.ts:61](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L61)

***

### group

> `get` group(): `string`

#### Defined In

[block-std/src/selection/base.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L37)

#### Inherited from

[`BaseSelection`](class.BaseSelection.md).[`group`](class.BaseSelection.md#group-2)

***

### start

> `get` start(): [`TextRangePoint`](../type-aliases/type-alias.TextRangePoint.md)

#### Defined In

[block-std/src/selection/variants/text.ts:57](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L57)

***

### type

> `get` type(): *keyof* `Selection`

#### Defined In

[block-std/src/selection/base.ts:32](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/base.ts#L32)

#### Inherited from

[`BaseSelection`](class.BaseSelection.md).[`type`](class.BaseSelection.md#type-2)

## Methods

### \_equalPoint

> `private` **\_equalPoint**(`a`, `b`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `a` | `null` \| [`TextRangePoint`](../type-aliases/type-alias.TextRangePoint.md) |
| `b` | `null` \| [`TextRangePoint`](../type-aliases/type-alias.TextRangePoint.md) |

#### Returns

`boolean`

#### Defined In

[block-std/src/selection/variants/text.ts:69](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L69)

***

### empty

> **empty**(): `boolean`

#### Returns

`boolean`

#### Defined In

[block-std/src/selection/variants/text.ts:65](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L65)

***

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

[block-std/src/selection/variants/text.ts:84](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L84)

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

### isCollapsed

> **isCollapsed**(): `boolean`

#### Returns

`boolean`

#### Defined In

[block-std/src/selection/variants/text.ts:112](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L112)

***

### isInSameBlock

> **isInSameBlock**(): `boolean`

#### Returns

`boolean`

#### Defined In

[block-std/src/selection/variants/text.ts:116](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L116)

***

### toJSON

> **toJSON**(): `Record`\< `string`, `unknown` \>

#### Returns

`Record`\< `string`, `unknown` \>

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`toJSON`](class.BaseSelection.md#tojson)

#### Defined In

[block-std/src/selection/variants/text.ts:94](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L94)

***

### fromJSON

> `static` **fromJSON**(`json`): [`TextSelection`](class.TextSelection.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `json` | `Record`\< `string`, `unknown` \> |

#### Returns

[`TextSelection`](class.TextSelection.md)

#### Overrides

[`BaseSelection`](class.BaseSelection.md).[`fromJSON`](class.BaseSelection.md#fromjson)

#### Defined In

[block-std/src/selection/variants/text.ts:103](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/variants/text.ts#L103)

[API](../../../index.md) > [@blocksuite/virgo](../index.md) > VirgoAttributeService

# Class: VirgoAttributeService`<TextAttributes>`

## Constructors

### constructor

> **new VirgoAttributeService**<`TextAttributes`>(`editor`): [`VirgoAttributeService`](class.VirgoAttributeService.md)\< `TextAttributes` \>

#### Type parameters

| Parameter |
| :------ |
| `TextAttributes` *extends* \{`bold`: `null` \| `true`; `code`: `null` \| `true`; `italic`: `null` \| `true`; `link`: `null` \| `string`; `strike`: `null` \| `true`; `underline`: `null` \| `true`;} |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `editor` | [`VEditor`](class.VEditor.md)\< `TextAttributes` \> |

#### Returns

[`VirgoAttributeService`](class.VirgoAttributeService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/services/attribute.ts:21](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/attribute.ts#L21)

## Properties

### \_attributeRenderer

> `private` **\_attributeRenderer**: [`AttributeRenderer`](../type-aliases/type-alias.AttributeRenderer.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/services/attribute.ts:15](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/attribute.ts#L15)

***

### \_attributeSchema

> `private` **\_attributeSchema**: `ZodType`\< `TextAttributes`, `ZodTypeDef`, `unknown` \>

#### Defined In

[packages/virgo/src/services/attribute.ts:18](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/attribute.ts#L18)

***

### \_marks

> `private` **\_marks**: `null` \| `TextAttributes` = `null`

#### Defined In

[packages/virgo/src/services/attribute.ts:13](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/attribute.ts#L13)

***

### editor

> `readonly` **editor**: [`VEditor`](class.VEditor.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/services/attribute.ts:21](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/attribute.ts#L21)

## Accessors

### attributeRenderer

> `get` attributeRenderer(): [`AttributeRenderer`](../type-aliases/type-alias.AttributeRenderer.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/services/attribute.ts:27](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/attribute.ts#L27)

***

### marks

> `get` marks(): `null` \| `TextAttributes`

#### Defined In

[packages/virgo/src/services/attribute.ts:23](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/attribute.ts#L23)

## Methods

### getFormat

> **getFormat**(`vRange`, `loose` = `false`): `TextAttributes`

#### Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `vRange` | [`VRange`](../interfaces/interface.VRange.md) | `undefined` |
| `loose` | `boolean` | `false` |

#### Returns

`TextAttributes`

#### Defined In

[packages/virgo/src/services/attribute.ts:49](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/attribute.ts#L49)

***

### normalizeAttributes

> **normalizeAttributes**(`textAttributes`?): `undefined` \| `TextAttributes`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `textAttributes`? | `TextAttributes` |

#### Returns

`undefined` \| `TextAttributes`

#### Defined In

[packages/virgo/src/services/attribute.ts:89](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/attribute.ts#L89)

***

### resetMarks

> **resetMarks**(): `void`

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/attribute.ts:35](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/attribute.ts#L35)

***

### setAttributeRenderer

> **setAttributeRenderer**(`renderer`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `renderer` | [`AttributeRenderer`](../type-aliases/type-alias.AttributeRenderer.md)\< `TextAttributes` \> |

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/attribute.ts:45](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/attribute.ts#L45)

***

### setAttributeSchema

> **setAttributeSchema**(`schema`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `schema` | `ZodType`\< `TextAttributes`, `ZodTypeDef`, `unknown` \> |

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/attribute.ts:39](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/attribute.ts#L39)

***

### setMarks

> **setMarks**(`marks`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `marks` | `TextAttributes` |

#### Returns

`void`

#### Defined In

[packages/virgo/src/services/attribute.ts:31](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/attribute.ts#L31)

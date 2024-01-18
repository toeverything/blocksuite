[API](../../../index.md) > [@blocksuite/store](../index.md) > Text

# Class: Text

## Constructors

### constructor

> **new Text**(`input`?): [`Text`](class.Text.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `input`? | `string` \| [`Text`](../namespaces/namespace.Y/classes/class.Text.md) |

#### Returns

[`Text`](class.Text.md)

#### Defined In

[packages/store/src/reactive/text.ts:19](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L19)

## Properties

### \_yText

> `private` `readonly` **\_yText**: [`Text`](../namespaces/namespace.Y/classes/class.Text.md)

#### Defined In

[packages/store/src/reactive/text.ts:17](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L17)

## Accessors

### length

> `get` length(): `number`

#### Defined In

[packages/store/src/reactive/text.ts:35](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L35)

***

### yText

> `get` yText(): [`Text`](../namespaces/namespace.Y/classes/class.Text.md)

#### Defined In

[packages/store/src/reactive/text.ts:39](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L39)

## Methods

### \_transact

> `private` **\_transact**(`callback`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `callback` | `function` |

#### Returns

`void`

#### Defined In

[packages/store/src/reactive/text.ts:43](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L43)

***

### applyDelta

> **applyDelta**(`delta`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `delta` | [`DeltaOperation`](../type-aliases/type-alias.DeltaOperation.md)[] |

#### Returns

`void`

#### Defined In

[packages/store/src/reactive/text.ts:242](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L242)

***

### clear

> **clear**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/reactive/text.ts:233](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L233)

***

### clone

> **clone**(): [`Text`](class.Text.md)

#### Returns

[`Text`](class.Text.md)

#### Defined In

[packages/store/src/reactive/text.ts:55](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L55)

***

### delete

> **delete**(`index`, `length`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `index` | `number` |
| `length` | `number` |

#### Returns

`void`

#### Defined In

[packages/store/src/reactive/text.ts:191](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L191)

***

### format

> **format**(
  `index`,
  `length`,
  `format`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `index` | `number` |
| `length` | `number` |
| `format` | `any` |

#### Returns

`void`

#### Defined In

[packages/store/src/reactive/text.ts:172](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L172)

***

### insert

> **insert**(
  `content`,
  `index`,
  `attributes`?): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `content` | `string` |
| `index` | `number` |
| `attributes`? | `Record`\< `string`, `unknown` \> |

#### Returns

`void`

#### Defined In

[packages/store/src/reactive/text.ts:121](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L121)

***

### insertList

> **insertList**(`insertTexts`, `index`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `insertTexts` | [`DeltaOperation`](../type-aliases/type-alias.DeltaOperation.md)[] |
| `index` | `number` |

#### Returns

`void`

#### Deprecated

Use [insert](class.Text.md#insert) or [applyDelta](class.Text.md#applydelta) instead.

#### Defined In

[packages/store/src/reactive/text.ts:143](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L143)

***

### join

> **join**(`other`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `other` | [`Text`](class.Text.md) |

#### Returns

`void`

#### Defined In

[packages/store/src/reactive/text.ts:159](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L159)

***

### replace

> **replace**(
  `index`,
  `length`,
  `content`,
  `attributes`?): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `index` | `number` |
| `length` | `number` |
| `content` | `string` |
| `attributes`? | `object` |
| `attributes.bold`? | `null` \| `true` |
| `attributes.code`? | `null` \| `true` |
| `attributes.italic`? | `null` \| `true` |
| `attributes.link`? | `null` \| `string` |
| `attributes.strike`? | `null` \| `true` |
| `attributes.underline`? | `null` \| `true` |

#### Returns

`void`

#### Defined In

[packages/store/src/reactive/text.ts:210](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L210)

***

### sliceToDelta

> **sliceToDelta**(`begin`, `end`?): [`DeltaOperation`](../type-aliases/type-alias.DeltaOperation.md)[]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `begin` | `number` |
| `end`? | `number` |

#### Returns

[`DeltaOperation`](../type-aliases/type-alias.DeltaOperation.md)[]

#### Defined In

[packages/store/src/reactive/text.ts:252](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L252)

***

### split

> **split**(`index`, `length` = `0`): [`Text`](class.Text.md)

NOTE: The string included in [index, index + length) will be deleted.

Here are three cases for point position(index + length):
[{insert: 'abc', ...}, {insert: 'def', ...}, {insert: 'ghi', ...}]
1. abc|de|fghi
   left: [{insert: 'abc', ...}]
   right: [{insert: 'f', ...}, {insert: 'ghi', ...}]
2. abc|def|ghi
   left: [{insert: 'abc', ...}]
   right: [{insert: 'ghi', ...}]
3. abc|defg|hi
   left: [{insert: 'abc', ...}]
   right: [{insert: 'hi', ...}]

#### Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `index` | `number` | `undefined` |
| `length` | `number` | `0` |

#### Returns

[`Text`](class.Text.md)

#### Defined In

[packages/store/src/reactive/text.ts:74](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L74)

***

### toDelta

> **toDelta**(): [`DeltaOperation`](../type-aliases/type-alias.DeltaOperation.md)[]

#### Returns

[`DeltaOperation`](../type-aliases/type-alias.DeltaOperation.md)[]

#### Defined In

[packages/store/src/reactive/text.ts:248](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L248)

***

### toString

> **toString**(): `string`

#### Returns

`string`

#### Defined In

[packages/store/src/reactive/text.ts:302](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L302)

***

### fromDelta

> `static` **fromDelta**(`delta`): [`Text`](class.Text.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `delta` | [`DeltaOperation`](../type-aliases/type-alias.DeltaOperation.md)[] |

#### Returns

[`Text`](class.Text.md)

#### Defined In

[packages/store/src/reactive/text.ts:29](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/text.ts#L29)

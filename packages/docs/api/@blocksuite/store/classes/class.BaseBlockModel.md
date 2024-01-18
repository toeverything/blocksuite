[API](../../../index.md) > [@blocksuite/store](../index.md) > BaseBlockModel

# Class: BaseBlockModel`<Props>`

## Extends

- `Props`

## Constructors

### constructor

> **new BaseBlockModel**<`Props`>(): [`BaseBlockModel`](class.BaseBlockModel.md)\< `Props` \>

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `Props` *extends* `object` | `object` |

#### Returns

[`BaseBlockModel`](class.BaseBlockModel.md)\< `Props` \>

#### Inherited from

MagicProps()\<Props\>.constructor

#### Defined In

[packages/store/src/schema/base.ts:168](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L168)

## Properties

### childrenUpdated

> **childrenUpdated**: `Slot`\< `void` \>

#### Defined In

[packages/store/src/schema/base.ts:191](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L191)

***

### created

> **created**: `Slot`\< `void` \>

#### Defined In

[packages/store/src/schema/base.ts:188](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L188)

***

### deleted

> **deleted**: `Slot`\< `void` \>

#### Defined In

[packages/store/src/schema/base.ts:189](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L189)

***

### flavour

> **flavour**: `string`

#### Defined In

[packages/store/src/schema/base.ts:178](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L178)

***

### id

> **id**: `string`

#### Defined In

[packages/store/src/schema/base.ts:181](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L181)

***

### keys

> **keys**: `string`[]

#### Defined In

[packages/store/src/schema/base.ts:183](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L183)

***

### page

> **page**: [`Page`](class.Page.md)

#### Defined In

[packages/store/src/schema/base.ts:180](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L180)

***

### propsUpdated

> **propsUpdated**: `Slot`\< \{`key`: `string`;} \>

#### Defined In

[packages/store/src/schema/base.ts:190](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L190)

***

### role

> **role**: `"root"` \| `"hub"` \| `"content"`

#### Defined In

[packages/store/src/schema/base.ts:179](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L179)

***

### text

> `optional` **text**: [`Text`](class.Text.md)

#### Defined In

[packages/store/src/schema/base.ts:186](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L186)

***

### yBlock

> **yBlock**: `YBlock`

#### Defined In

[packages/store/src/schema/base.ts:182](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L182)

## Accessors

### childMap

> `get` childMap(): `Map`\< `string`, `number` \>

#### Defined In

[packages/store/src/schema/base.ts:193](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L193)

***

### children

> `get` children(): [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>[]

#### Defined In

[packages/store/src/schema/base.ts:200](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L200)

## Methods

### clone

> **clone**(): [`BaseBlockModel`](class.BaseBlockModel.md)\< `Props` \>

#### Returns

[`BaseBlockModel`](class.BaseBlockModel.md)\< `Props` \>

#### Defined In

[packages/store/src/schema/base.ts:247](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L247)

***

### dispose

> **dispose**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/schema/base.ts:240](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L240)

***

### firstChild

> **firstChild**(): `null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Returns

`null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Defined In

[packages/store/src/schema/base.ts:222](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L222)

***

### isEmpty

> **isEmpty**(): `boolean`

#### Returns

`boolean`

#### Defined In

[packages/store/src/schema/base.ts:218](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L218)

***

### lastChild

> **lastChild**(): `null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Returns

`null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Defined In

[packages/store/src/schema/base.ts:226](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L226)

***

### lastItem

> **lastItem**(): `null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Returns

`null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Defined In

[packages/store/src/schema/base.ts:233](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L233)

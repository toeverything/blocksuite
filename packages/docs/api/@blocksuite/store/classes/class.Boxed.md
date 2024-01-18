[API](../../../index.md) > [@blocksuite/store](../index.md) > Boxed

# Class: Boxed`<T>`

## Constructors

### constructor

> **new Boxed**<`T`>(`value`): [`Boxed`](class.Boxed.md)\< `T` \>

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` | `unknown` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `T` |

#### Returns

[`Boxed`](class.Boxed.md)\< `T` \>

#### Defined In

[packages/store/src/reactive/boxed.ts:17](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/boxed.ts#L17)

## Properties

### \_map

> `private` `readonly` **\_map**: [`Map`](../namespaces/namespace.Y/classes/class.Map.md)\< `T` \>

#### Defined In

[packages/store/src/reactive/boxed.ts:6](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/boxed.ts#L6)

## Accessors

### yMap

> `get` yMap(): [`Map`](../namespaces/namespace.Y/classes/class.Map.md)\< `T` \>

#### Defined In

[packages/store/src/reactive/boxed.ts:30](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/boxed.ts#L30)

## Methods

### getValue

> **getValue**(): `undefined` \| `T`

#### Returns

`undefined` \| `T`

#### Defined In

[packages/store/src/reactive/boxed.ts:38](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/boxed.ts#L38)

***

### setValue

> **setValue**(`value`): `T`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `T` |

#### Returns

`T`

#### Defined In

[packages/store/src/reactive/boxed.ts:34](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/boxed.ts#L34)

***

### from

> `static` **from**<`T`>(`map`): [`Boxed`](class.Boxed.md)\< `T` \>

#### Type parameters

| Parameter |
| :------ |
| `T` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `map` | [`Map`](../namespaces/namespace.Y/classes/class.Map.md)\< `T` \> |

#### Returns

[`Boxed`](class.Boxed.md)\< `T` \>

#### Defined In

[packages/store/src/reactive/boxed.ts:13](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/boxed.ts#L13)

***

### is

> `static` **is**(`value`): `value is Boxed<unknown>`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `value` | `unknown` |

#### Returns

`value is Boxed<unknown>`

#### Defined In

[packages/store/src/reactive/boxed.ts:7](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/reactive/boxed.ts#L7)

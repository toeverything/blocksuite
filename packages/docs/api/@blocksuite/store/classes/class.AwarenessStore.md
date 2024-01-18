[API](../../../index.md) > [@blocksuite/store](../index.md) > AwarenessStore

# Class: AwarenessStore`<Flags>`

## Constructors

### constructor

> **new AwarenessStore**<`Flags`>(
  `store`,
  `awareness`,
  `defaultFlags`): [`AwarenessStore`](class.AwarenessStore.md)\< `Flags` \>

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `Flags` *extends* `Record`\< `string`, `unknown` \> | `BlockSuiteFlags` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `store` | [`Store`](class.Store.md) |
| `awareness` | `Awareness`\< [`RawAwarenessState`](../type-aliases/type-alias.RawAwarenessState.md)\< `Flags` \> \> |
| `defaultFlags` | `Flags` |

#### Returns

[`AwarenessStore`](class.AwarenessStore.md)\< `Flags` \>

#### Defined In

[packages/store/src/yjs/awareness.ts:40](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L40)

## Properties

### awareness

> `readonly` **awareness**: `Awareness`\< [`RawAwarenessState`](../type-aliases/type-alias.RawAwarenessState.md)\< `Flags` \> \>

#### Defined In

[packages/store/src/yjs/awareness.ts:33](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L33)

***

### slots

> `readonly` **slots**: `object`

#### Type declaration

> ##### `slots.update`
>
> > **update**: `Slot`\< [`AwarenessEvent`](../interfaces/interface.AwarenessEvent.md)\< `Flags` \> \>
>
>

#### Defined In

[packages/store/src/yjs/awareness.ts:36](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L36)

***

### store

> `readonly` **store**: [`Store`](class.Store.md)

#### Defined In

[packages/store/src/yjs/awareness.ts:34](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L34)

## Methods

### \_initFlags

> `private` **\_initFlags**(`defaultFlags`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `defaultFlags` | `Flags` |

#### Returns

`void`

#### Defined In

[packages/store/src/yjs/awareness.ts:52](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L52)

***

### \_onAwarenessChange

> `private` **\_onAwarenessChange**(`diff`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diff` | `object` |
| `diff.added` | `number`[] |
| `diff.removed` | `number`[] |
| `diff.updated` | `number`[] |

#### Returns

`void`

#### Defined In

[packages/store/src/yjs/awareness.ts:99](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L99)

***

### destroy

> **destroy**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/yjs/awareness.ts:129](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L129)

***

### getFlag

> **getFlag**<`Key`>(`field`): `undefined` \| `Flags`[`Key`]

#### Type parameters

| Parameter |
| :------ |
| `Key` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `field` | `Key` |

#### Returns

`undefined` \| `Flags`[`Key`]

#### Defined In

[packages/store/src/yjs/awareness.ts:65](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L65)

***

### getLocalSelection

> **getLocalSelection**(): *readonly* `Record`\< `string`, `unknown` \>[]

#### Returns

*readonly* `Record`\< `string`, `unknown` \>[]

#### Defined In

[packages/store/src/yjs/awareness.ts:91](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L91)

***

### getStates

> **getStates**(): `Map`\< `number`, [`RawAwarenessState`](../type-aliases/type-alias.RawAwarenessState.md)\< `Flags` \> \>

#### Returns

`Map`\< `number`, [`RawAwarenessState`](../type-aliases/type-alias.RawAwarenessState.md)\< `Flags` \> \>

#### Defined In

[packages/store/src/yjs/awareness.ts:95](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L95)

***

### isReadonly

> **isReadonly**(`space`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `space` | [`Space`](class.Space.md)\< `Record`\< `string`, `any` \> \> |

#### Returns

`boolean`

#### Defined In

[packages/store/src/yjs/awareness.ts:78](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L78)

***

### setFlag

> **setFlag**<`Key`>(`field`, `value`): `void`

#### Type parameters

| Parameter |
| :------ |
| `Key` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `field` | `Key` |
| `value` | `Flags`[`Key`] |

#### Returns

`void`

#### Defined In

[packages/store/src/yjs/awareness.ts:60](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L60)

***

### setLocalSelection

> **setLocalSelection**(`selection`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `selection` | `Record`\< `string`, `unknown` \>[] |

#### Returns

`void`

#### Defined In

[packages/store/src/yjs/awareness.ts:87](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L87)

***

### setReadonly

> **setReadonly**(`space`, `value`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `space` | [`Space`](class.Space.md)\< `Record`\< `string`, `any` \> \> |
| `value` | `boolean` |

#### Returns

`void`

#### Defined In

[packages/store/src/yjs/awareness.ts:70](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/yjs/awareness.ts#L70)

[API](../../../index.md) > [@blocksuite/block-std](../index.md) > SelectionManager

# Class: SelectionManager

## Constructors

### constructor

> **new SelectionManager**(`std`): [`SelectionManager`](class.SelectionManager.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `std` | [`BlockStdProvider`](class.BlockStdProvider.md) |

#### Returns

[`SelectionManager`](class.SelectionManager.md)

#### Defined In

[block-std/src/selection/manager.ts:29](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L29)

## Properties

### \_selectionConstructors

> `private` **\_selectionConstructors**: `Record`\< `string`, `SelectionConstructor` \> = `{}`

#### Defined In

[block-std/src/selection/manager.ts:22](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L22)

***

### disposables

> **disposables**: `DisposableGroup`

#### Defined In

[block-std/src/selection/manager.ts:21](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L21)

***

### slots

> **slots**: `object`

#### Type declaration

> ##### `slots.changed`
>
> > **changed**: `Slot`\< [`BaseSelection`](class.BaseSelection.md)[] \>
>
> ##### `slots.remoteChanged`
>
> > **remoteChanged**: `Slot`\< `Map`\< `number`, [`BaseSelection`](class.BaseSelection.md)[] \> \>
>
>

#### Defined In

[block-std/src/selection/manager.ts:24](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L24)

***

### std

> **std**: [`BlockStdProvider`](class.BlockStdProvider.md)

#### Defined In

[block-std/src/selection/manager.ts:29](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L29)

## Accessors

### \_store

> `private` `get` _store(): [`AwarenessStore`](../../store/classes/class.AwarenessStore.md)\< `BlockSuiteFlags` \>

#### Defined In

[block-std/src/selection/manager.ts:40](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L40)

***

### remoteSelections

> `get` remoteSelections(): `Map`\< `number`, [`BaseSelection`](class.BaseSelection.md)[] \>

#### Defined In

[block-std/src/selection/manager.ts:127](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L127)

***

### value

> `get` value(): [`BaseSelection`](class.BaseSelection.md)[]

#### Defined In

[block-std/src/selection/manager.ts:72](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L72)

## Methods

### \_itemAdded

> `private` **\_itemAdded**(`event`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `event` | `object` |
| `event.stackItem` | [`StackItem`](../../store/interfaces/interface.StackItem.md) |

#### Returns

`void`

#### Defined In

[block-std/src/selection/manager.ts:146](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L146)

***

### \_itemPopped

> `private` **\_itemPopped**(`event`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `event` | `object` |
| `event.stackItem` | [`StackItem`](../../store/interfaces/interface.StackItem.md) |

#### Returns

`void`

#### Defined In

[block-std/src/selection/manager.ts:150](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L150)

***

### \_jsonToSelection

> `private` **\_jsonToSelection**(`json`): [`BaseSelection`](class.BaseSelection.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `json` | `Record`\< `string`, `unknown` \> |

#### Returns

[`BaseSelection`](class.BaseSelection.md)

#### Defined In

[block-std/src/selection/manager.ts:53](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L53)

***

### \_setupDefaultSelections

> `private` **\_setupDefaultSelections**(): `void`

#### Returns

`void`

#### Defined In

[block-std/src/selection/manager.ts:44](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L44)

***

### clear

> **clear**(`types`?): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `types`? | `string`[] |

#### Returns

`void`

#### Defined In

[block-std/src/selection/manager.ts:104](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L104)

***

### dispose

> **dispose**(): `void`

#### Returns

`void`

#### Defined In

[block-std/src/selection/manager.ts:179](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L179)

***

### filter

> **filter**<`T`>(`type`): `SelectionInstance`[`T`][]

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* *keyof* `Selection` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `T` |

#### Returns

`SelectionInstance`[`T`][]

#### Defined In

[block-std/src/selection/manager.ts:121](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L121)

***

### find

> **find**<`T`>(`type`): `undefined` \| `SelectionInstance`[`T`]

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* *keyof* `Selection` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `T` |

#### Returns

`undefined` \| `SelectionInstance`[`T`]

#### Defined In

[block-std/src/selection/manager.ts:115](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L115)

***

### fromJSON

> **fromJSON**(`json`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `json` | `Record`\< `string`, `unknown` \>[] |

#### Returns

`void`

#### Defined In

[block-std/src/selection/manager.ts:78](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L78)

***

### getGroup

> **getGroup**(`group`): [`BaseSelection`](class.BaseSelection.md)[]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `group` | `string` |

#### Returns

[`BaseSelection`](class.BaseSelection.md)[]

#### Defined In

[block-std/src/selection/manager.ts:95](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L95)

***

### getInstance

> **getInstance**<`T`>(`type`, ...`args`): `SelectionInstance`[`T`]

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* *keyof* `Selection` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `T` |
| ...`args` | `ConstructorParameters`\< `Selection`[`T`] \> |

#### Returns

`SelectionInstance`[`T`]

#### Defined In

[block-std/src/selection/manager.ts:61](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L61)

***

### mount

> **mount**(): `void`

#### Returns

`void`

#### Defined In

[block-std/src/selection/manager.ts:157](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L157)

***

### register

> **register**(`ctor`): [`SelectionManager`](class.SelectionManager.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `ctor` | `SelectionConstructor` \| `SelectionConstructor`[] |

#### Returns

[`SelectionManager`](class.SelectionManager.md)

#### Defined In

[block-std/src/selection/manager.ts:33](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L33)

***

### set

> **set**(`selections`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `selections` | [`BaseSelection`](class.BaseSelection.md)[] |

#### Returns

`void`

#### Defined In

[block-std/src/selection/manager.ts:85](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L85)

***

### setGroup

> **setGroup**(`group`, `selections`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `group` | `string` |
| `selections` | [`BaseSelection`](class.BaseSelection.md)[] |

#### Returns

`void`

#### Defined In

[block-std/src/selection/manager.ts:90](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L90)

***

### unmount

> **unmount**(): `void`

#### Returns

`void`

#### Defined In

[block-std/src/selection/manager.ts:171](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L171)

***

### update

> **update**(`fn`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `fn` | `function` |

#### Returns

`void`

#### Defined In

[block-std/src/selection/manager.ts:99](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/selection/manager.ts#L99)

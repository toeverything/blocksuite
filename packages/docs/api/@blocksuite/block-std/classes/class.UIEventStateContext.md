[API](../../../index.md) > [@blocksuite/block-std](../index.md) > UIEventStateContext

# Class: UIEventStateContext

## Constructors

### constructor

> **new UIEventStateContext**(): [`UIEventStateContext`](class.UIEventStateContext.md)

#### Returns

[`UIEventStateContext`](class.UIEventStateContext.md)

## Properties

### \_map

> `private` **\_map**: `Record`\< `string`, [`UIEventState`](class.UIEventState.md) \> = `{}`

#### Defined In

[block-std/src/event/base.ts:15](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/base.ts#L15)

## Methods

### add

> **add**<`State`>(`state`): `void`

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `State` *extends* [`UIEventState`](class.UIEventState.md) | [`UIEventState`](class.UIEventState.md) |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `state` | `State` |

#### Returns

`void`

#### Defined In

[block-std/src/event/base.ts:25](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/base.ts#L25)

***

### get

> **get**<`Type`>(`type`): `MatchEvent`\< `Type` \>

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `Type` *extends* *keyof* `BlockSuiteUIEventState` | *keyof* `BlockSuiteUIEventState` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `Type` |

#### Returns

`MatchEvent`\< `Type` \>

#### Defined In

[block-std/src/event/base.ts:38](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/base.ts#L38)

***

### has

> **has**(`type`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | *keyof* `BlockSuiteUIEventState` |

#### Returns

`boolean`

#### Defined In

[block-std/src/event/base.ts:34](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/base.ts#L34)

***

### from

> `static` **from**(...`states`): [`UIEventStateContext`](class.UIEventStateContext.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| ...`states` | [`UIEventState`](class.UIEventState.md)[] |

#### Returns

[`UIEventStateContext`](class.UIEventStateContext.md)

#### Defined In

[block-std/src/event/base.ts:17](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/base.ts#L17)

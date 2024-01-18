[API](../../../index.md) > [@blocksuite/store](../index.md) > Space

# Class: Space`<State>`

## Constructors

### constructor

> **new Space**<`State`>(
  `id`,
  `doc`,
  `awarenessStore`): [`Space`](class.Space.md)\< `State` \>

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `State` *extends* `Record`\< `string`, `unknown` \> | `Record`\< `string`, `any` \> |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | `string` |
| `doc` | [`BlockSuiteDoc`](class.BlockSuiteDoc.md) |
| `awarenessStore` | [`AwarenessStore`](class.AwarenessStore.md)\< `BlockSuiteFlags` \> |

#### Returns

[`Space`](class.Space.md)\< `State` \>

#### Defined In

[packages/store/src/workspace/space.ts:31](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L31)

## Properties

### \_loaded

> `private` **\_loaded**: `boolean`

#### Defined In

[packages/store/src/workspace/space.ts:20](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L20)

***

### \_onLoadSlot

> `private` **\_onLoadSlot**: `Slot`\< `void` \>

#### Defined In

[packages/store/src/workspace/space.ts:22](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L22)

***

### \_yBlocks

> `protected` `readonly` **\_yBlocks**: [`Map`](../namespaces/namespace.Y/classes/class.Map.md)\< `State`[*keyof* `State`] \>

#### Defined In

[packages/store/src/workspace/space.ts:29](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L29)

***

### \_ySpaceDoc

> `protected` `readonly` **\_ySpaceDoc**: [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md)

Used for convenient access to the underlying Yjs map,
can be used interchangeably with ySpace

#### Defined In

[packages/store/src/workspace/space.ts:28](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L28)

***

### awarenessStore

> `readonly` **awarenessStore**: [`AwarenessStore`](class.AwarenessStore.md)\< `BlockSuiteFlags` \>

#### Defined In

[packages/store/src/workspace/space.ts:18](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L18)

***

### doc

> `readonly` **doc**: [`BlockSuiteDoc`](class.BlockSuiteDoc.md)

#### Defined In

[packages/store/src/workspace/space.ts:17](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L17)

***

### id

> `readonly` **id**: `string`

#### Defined In

[packages/store/src/workspace/space.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L16)

## Accessors

### loaded

> `get` loaded(): `boolean`

#### Defined In

[packages/store/src/workspace/space.ts:41](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L41)

***

### spaceDoc

> `get` spaceDoc(): [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md)

#### Defined In

[packages/store/src/workspace/space.ts:45](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L45)

## Methods

### \_initSubDoc

> `private` **\_initSubDoc**(): [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md)

#### Returns

[`Doc`](../namespaces/namespace.Y/classes/class.Doc.md)

#### Defined In

[packages/store/src/workspace/space.ts:82](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L82)

***

### \_onSubdocEvent

> `private` **\_onSubdocEvent**(`__namedParameters`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | `object` |
| `__namedParameters.loaded` | `Set`\< [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md) \> |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/space.ts:99](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L99)

***

### clear

> **clear**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/space.ts:78](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L78)

***

### destroy

> **destroy**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/space.ts:72](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L72)

***

### load

> **load**(): `Promise`\< [`Space`](class.Space.md)\< `State` \> \>

#### Returns

`Promise`\< [`Space`](class.Space.md)\< `State` \> \>

#### Defined In

[packages/store/src/workspace/space.ts:49](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L49)

***

### remove

> **remove**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/space.ts:67](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L67)

***

### transact

> **transact**(`fn`, `shouldTransact` = `true`): `void`

If `shouldTransact` is `false`, the transaction will not be push to the history stack.

#### Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `fn` | `function` | `undefined` |
| `shouldTransact` | `boolean` | `true` |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/space.ts:114](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L114)

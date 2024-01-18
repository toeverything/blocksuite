[API](../../../index.md) > [@blocksuite/block-std](../index.md) > ViewStore

# Class: ViewStore

## Constructors

### constructor

> **new ViewStore**(`std`): [`ViewStore`](class.ViewStore.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `std` | [`BlockStdProvider`](class.BlockStdProvider.md) |

#### Returns

[`ViewStore`](class.ViewStore.md)

#### Defined In

[block-std/src/view/view-store.ts:25](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L25)

## Properties

### \_cachedPath

> `private` **\_cachedPath**: `Map`\< `Node`, [`NodeView`](../type-aliases/type-alias.NodeView.md)[] \>

#### Defined In

[block-std/src/view/view-store.ts:21](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L21)

***

### \_cachedTree

> `private` **\_cachedTree**: `null` \| [`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md) = `null`

#### Defined In

[block-std/src/view/view-store.ts:20](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L20)

***

### \_observer

> `private` **\_observer**: `MutationObserver`

#### Defined In

[block-std/src/view/view-store.ts:22](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L22)

***

### std

> **std**: [`BlockStdProvider`](class.BlockStdProvider.md)

#### Defined In

[block-std/src/view/view-store.ts:25](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L25)

***

### viewSpec

> `readonly` **viewSpec**: `Set`\< [`BlockSuiteViewSpec`](../interfaces/interface.BlockSuiteViewSpec.md)\< `any` \> \>

#### Defined In

[block-std/src/view/view-store.ts:23](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L23)

## Methods

### \_calculateNodeViewPath

> `private` **\_calculateNodeViewPath**(`node`): [`NodeView`](../type-aliases/type-alias.NodeView.md)[]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | `Node` |

#### Returns

[`NodeView`](../type-aliases/type-alias.NodeView.md)[]

#### Defined In

[block-std/src/view/view-store.ts:65](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L65)

***

### \_getViewSpec

> `private` **\_getViewSpec**(`type`): `undefined` \| [`BlockSuiteViewSpec`](../interfaces/interface.BlockSuiteViewSpec.md)\< `any` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `string` |

#### Returns

`undefined` \| [`BlockSuiteViewSpec`](../interfaces/interface.BlockSuiteViewSpec.md)\< `any` \>

#### Defined In

[block-std/src/view/view-store.ts:61](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L61)

***

### \_indexOf

> `private` **\_indexOf**(`path`, `parent`): `number`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string`[] |
| `parent` | [`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md) |

#### Returns

`number`

#### Defined In

[block-std/src/view/view-store.ts:321](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L321)

***

### calculatePath

> **calculatePath**(`node`): `string`[]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | `Node` |

#### Returns

`string`[]

#### Defined In

[block-std/src/view/view-store.ts:56](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L56)

***

### findNext

> **findNext**(`path`, `fn`): `null` \| [`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string`[] |
| `fn` | `function` |

#### Returns

`null` \| [`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md)

#### Defined In

[block-std/src/view/view-store.ts:247](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L247)

***

### findPrev

> **findPrev**(`path`, `fn`): `null` \| [`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string`[] |
| `fn` | `function` |

#### Returns

`null` \| [`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md)

#### Defined In

[block-std/src/view/view-store.ts:192](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L192)

***

### fromPath

> **fromPath**(`path`): `null` \| [`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md)\< `unknown` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string`[] |

#### Returns

`null` \| [`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md)\< `unknown` \>

#### Defined In

[block-std/src/view/view-store.ts:129](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L129)

***

### getChildren

> **getChildren**(`path`): [`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md)[]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string`[] |

#### Returns

[`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md)[]

#### Defined In

[block-std/src/view/view-store.ts:32](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L32)

***

### getNodeView

> **getNodeView**(`node`): `null` \| [`NodeView`](../type-aliases/type-alias.NodeView.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | `Node` |

#### Returns

`null` \| [`NodeView`](../type-aliases/type-alias.NodeView.md)

#### Defined In

[block-std/src/view/view-store.ts:44](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L44)

***

### getNodeViewTree

> **getNodeViewTree**(): [`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md)

#### Returns

[`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md)

#### Defined In

[block-std/src/view/view-store.ts:94](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L94)

***

### getParent

> **getParent**(`path`): `null` \| [`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md)\< `unknown` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string`[] |

#### Returns

`null` \| [`NodeViewTree`](../type-aliases/type-alias.NodeViewTree.md)\< `unknown` \>

#### Defined In

[block-std/src/view/view-store.ts:185](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L185)

***

### indexOf

> **indexOf**(`path`): `number`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string`[] |

#### Returns

`number`

#### Defined In

[block-std/src/view/view-store.ts:302](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L302)

***

### mount

> **mount**(): `void`

#### Returns

`void`

#### Defined In

[block-std/src/view/view-store.ts:310](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L310)

***

### register

> **register**<`T`>(`spec`): `void`

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* `never` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `spec` | `View`[`T`] |

#### Returns

`void`

#### Defined In

[block-std/src/view/view-store.ts:40](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L40)

***

### unmount

> **unmount**(): `void`

#### Returns

`void`

#### Defined In

[block-std/src/view/view-store.ts:314](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L314)

***

### viewFromPath

> **viewFromPath**<`T`>(`type`, `path`): `null` \| [`SpecToNodeView`](../type-aliases/type-alias.SpecToNodeView.md)\< `View`[`T`] \>

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* `never` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `T` |
| `path` | `string`[] |

#### Returns

`null` \| [`SpecToNodeView`](../type-aliases/type-alias.SpecToNodeView.md)\< `View`[`T`] \>

#### Defined In

[block-std/src/view/view-store.ts:143](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L143)

> **viewFromPath**<`T`>(`type`, `path`): `null` \| [`SpecToNodeView`](../type-aliases/type-alias.SpecToNodeView.md)\< `T` \>

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* [`BlockSuiteViewSpec`](../interfaces/interface.BlockSuiteViewSpec.md)\< `any` \> |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `string` |
| `path` | `string`[] |

#### Returns

`null` \| [`SpecToNodeView`](../type-aliases/type-alias.SpecToNodeView.md)\< `T` \>

#### Defined In

[block-std/src/view/view-store.ts:147](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L147)

***

### walkThrough

> **walkThrough**(`fn`, `path` = `[]`): `void`

#### Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `fn` | `function` | `undefined` |
| `path` | `string`[] | `[]` |

#### Returns

`void`

#### Defined In

[block-std/src/view/view-store.ts:162](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/view/view-store.ts#L162)

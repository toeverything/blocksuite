[API](../../../index.md) > [@blocksuite/store](../index.md) > ASTWalker

# Class: ASTWalker`<ONode, TNode>`

## Constructors

### constructor

> **new ASTWalker**<`ONode`, `TNode`>(): [`ASTWalker`](class.ASTWalker.md)\< `ONode`, `TNode` \>

#### Type parameters

| Parameter |
| :------ |
| `ONode` *extends* `object` |
| `TNode` *extends* `object` |

#### Returns

[`ASTWalker`](class.ASTWalker.md)\< `ONode`, `TNode` \>

#### Defined In

[packages/store/src/adapter/base.ts:91](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L91)

## Properties

### \_enter

> `private` **\_enter**: `undefined` \| `WalkerFn`\< `ONode`, `TNode` \>

#### Defined In

[packages/store/src/adapter/base.ts:85](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L85)

***

### \_isONode

> `private` **\_isONode**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `node` | `unknown` |

#### Returns

`node is ONode`

#### Defined In

[packages/store/src/adapter/base.ts:87](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L87)

***

### \_leave

> `private` **\_leave**: `undefined` \| `WalkerFn`\< `ONode`, `TNode` \>

#### Defined In

[packages/store/src/adapter/base.ts:86](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L86)

***

### context

> `private` **context**: `ASTWalkerContext`\< `TNode` \>

#### Defined In

[packages/store/src/adapter/base.ts:89](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L89)

## Methods

### \_visit

> `private` **\_visit**(`o`): `Promise`\< `void` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `o` | `NodeProps`\< `ONode` \> |

#### Returns

`Promise`\< `void` \>

#### Defined In

[packages/store/src/adapter/base.ts:114](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L114)

***

### setEnter

> **setEnter**(`fn`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `fn` | `WalkerFn`\< `ONode`, `TNode` \> |

#### Returns

`void`

#### Defined In

[packages/store/src/adapter/base.ts:95](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L95)

***

### setLeave

> **setLeave**(`fn`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `fn` | `WalkerFn`\< `ONode`, `TNode` \> |

#### Returns

`void`

#### Defined In

[packages/store/src/adapter/base.ts:99](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L99)

***

### setONodeTypeGuard

> **setONodeTypeGuard**(`fn`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `fn` | `function` |

#### Returns

`void`

#### Defined In

[packages/store/src/adapter/base.ts:103](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L103)

***

### walk

> **walk**(`oNode`, `tNode`): `Promise`\< `TNode` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `oNode` | `ONode` |
| `tNode` | `TNode` |

#### Returns

`Promise`\< `TNode` \>

#### Defined In

[packages/store/src/adapter/base.ts:107](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/adapter/base.ts#L107)

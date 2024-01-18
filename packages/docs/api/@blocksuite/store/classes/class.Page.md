[API](../../../index.md) > [@blocksuite/store](../index.md) > Page

# Class: Page

## Extends

- `BlockTree`

## Constructors

### constructor

> **new Page**(`__namedParameters`): [`Page`](class.Page.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | `PageOptions` |

#### Returns

[`Page`](class.Page.md)

#### Overrides

BlockTree.constructor

#### Defined In

[packages/store/src/workspace/page.ts:83](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L83)

## Properties

### \_blocks

> `protected` **\_blocks**: `Map`\< `string`, `Block` \>

#### Defined In

[packages/store/src/workspace/block/block-tree.ts:22](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/block/block-tree.ts#L22)

#### Inherited from

BlockTree.\_blocks

***

### \_docLoaded

> `private` **\_docLoaded**: `boolean` = `false`

Indicate whether the underlying subdoc has been loaded.

#### Defined In

[packages/store/src/workspace/page.ts:42](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L42)

***

### \_history

> `private` **\_history**: [`UndoManager`](../namespaces/namespace.Y/classes/class.UndoManager.md)

#### Defined In

[packages/store/src/workspace/page.ts:39](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L39)

***

### \_idGenerator

> `private` `readonly` **\_idGenerator**: [`IdGenerator`](../type-aliases/type-alias.IdGenerator.md)

#### Defined In

[packages/store/src/workspace/page.ts:38](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L38)

***

### \_ready

> `private` **\_ready**: `boolean` = `false`

Indicate whether the block tree is ready

#### Defined In

[packages/store/src/workspace/page.ts:44](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L44)

***

### \_root

> `private` **\_root**: `null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> = `null`

#### Defined In

[packages/store/src/workspace/page.ts:40](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L40)

***

### \_schema

> `protected` `readonly` **\_schema**: [`Schema`](class.Schema.md)

#### Defined In

[packages/store/src/workspace/block/block-tree.ts:21](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/block/block-tree.ts#L21)

#### Inherited from

BlockTree.\_schema

***

### \_shouldTransact

> `private` **\_shouldTransact**: `boolean` = `true`

#### Defined In

[packages/store/src/workspace/page.ts:45](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L45)

***

### \_workspace

> `private` `readonly` **\_workspace**: [`Workspace`](class.Workspace.md)

#### Defined In

[packages/store/src/workspace/page.ts:37](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L37)

***

### \_yBlocks

> `protected` `readonly` **\_yBlocks**: [`Map`](../namespaces/namespace.Y/classes/class.Map.md)\< `YBlock` \>

#### Defined In

[packages/store/src/workspace/space.ts:29](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L29)

#### Inherited from

BlockTree.\_yBlocks

***

### \_ySpaceDoc

> `protected` `readonly` **\_ySpaceDoc**: [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md)

Used for convenient access to the underlying Yjs map,
can be used interchangeably with ySpace

#### Defined In

[packages/store/src/workspace/space.ts:28](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L28)

#### Inherited from

BlockTree.\_ySpaceDoc

***

### awarenessStore

> `readonly` **awarenessStore**: [`AwarenessStore`](class.AwarenessStore.md)\< `BlockSuiteFlags` \>

#### Defined In

[packages/store/src/workspace/space.ts:18](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L18)

#### Inherited from

BlockTree.awarenessStore

***

### doc

> `readonly` **doc**: [`BlockSuiteDoc`](class.BlockSuiteDoc.md)

#### Defined In

[packages/store/src/workspace/space.ts:17](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L17)

#### Inherited from

BlockTree.doc

***

### id

> `readonly` **id**: `string`

#### Defined In

[packages/store/src/workspace/space.ts:16](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L16)

#### Inherited from

BlockTree.id

***

### slots

> `readonly` **slots**: `object`

#### Type declaration

> ##### `slots.blockUpdated`
>
> > **blockUpdated**: `Slot`\< \{`flavour`: `string`; `id`: `string`; `type`: `"add"`;} \| \{`flavour`: `string`; `id`: `string`; `model`: [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>; `parent`: `string`; `type`: `"delete"`;} \| \{`flavour`: `string`; `id`: `string`; `type`: `"update"`;} \>
>
> ##### `slots.historyUpdated`
>
> > **historyUpdated**: `Slot`\< `void` \>
>
> ##### `slots.ready`
>
> > **ready**: `Slot`\< `void` \>
>
> This fires when the block tree is initialized via API call or underlying existing ydoc binary.
> Note that this is different with the `doc.loaded` field,
> since `loaded` only indicates that the ydoc is loaded, not the block tree.
>
> ##### `slots.rootAdded`
>
> > **rootAdded**: `Slot`\< [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> \>
>
> This fires when the root block is added via API call or has just been initialized from existing ydoc.
> useful for internal block UI components to start subscribing following up events.
> Note that at this moment, the whole block tree may not be fully initialized yet.
>
> ##### `slots.rootDeleted`
>
> > **rootDeleted**: `Slot`\< `string` \| `string`[] \>
>
>

#### Defined In

[packages/store/src/workspace/page.ts:47](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L47)

## Accessors

### Text

> `get` Text(): *typeof* [`Text`](class.Text.md)

#### Defined In

[packages/store/src/workspace/page.ts:145](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L145)

***

### blob

> `get` blob(): [`BlobManager`](../interfaces/interface.BlobManager.md)

#### Defined In

[packages/store/src/workspace/page.ts:119](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L119)

***

### canRedo

> `get` canRedo(): `boolean`

#### Defined In

[packages/store/src/workspace/page.ts:138](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L138)

***

### canUndo

> `get` canUndo(): `boolean`

#### Defined In

[packages/store/src/workspace/page.ts:131](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L131)

***

### history

> `get` history(): [`UndoManager`](../namespaces/namespace.Y/classes/class.UndoManager.md)

#### Defined In

[packages/store/src/workspace/page.ts:103](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L103)

***

### isEmpty

> `get` isEmpty(): `boolean`

#### Defined In

[packages/store/src/workspace/page.ts:127](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L127)

***

### loaded

> `get` loaded(): `boolean`

#### Defined In

[packages/store/src/workspace/space.ts:41](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L41)

#### Inherited from

BlockTree.loaded

***

### meta

> `get` meta(): [`PageMeta`](../interfaces/interface.PageMeta.md)

#### Defined In

[packages/store/src/workspace/page.ts:115](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L115)

***

### readonly

> `get` readonly(): `boolean`

#### Defined In

[packages/store/src/workspace/page.ts:95](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L95)

***

### ready

> `get` ready(): `boolean`

#### Defined In

[packages/store/src/workspace/page.ts:99](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L99)

***

### root

> `get` root(): `null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Defined In

[packages/store/src/workspace/page.ts:123](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L123)

***

### schema

> `get` schema(): [`Schema`](class.Schema.md)

#### Defined In

[packages/store/src/workspace/page.ts:111](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L111)

***

### spaceDoc

> `get` spaceDoc(): [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md)

#### Defined In

[packages/store/src/workspace/space.ts:45](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L45)

#### Inherited from

BlockTree.spaceDoc

***

### workspace

> `get` workspace(): [`Workspace`](class.Workspace.md)

#### Defined In

[packages/store/src/workspace/page.ts:107](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L107)

## Methods

### \_addBlock

> `protected` **\_addBlock**(
  `id`,
  `flavour`,
  `initialProps`): [`Map`](../namespaces/namespace.Y/classes/class.Map.md)\< `unknown` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | `string` |
| `flavour` | `string` |
| `initialProps` | `Record`\< `string`, `unknown` \> |

#### Returns

[`Map`](../namespaces/namespace.Y/classes/class.Map.md)\< `unknown` \>

#### Inherited from

BlockTree.\_addBlock

#### Defined In

[packages/store/src/workspace/block/block-tree.ts:58](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/block/block-tree.ts#L58)

***

### \_getYBlock

> `private` **\_getYBlock**(`id`): `null` \| `YBlock`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`null` \| `YBlock`

#### Defined In

[packages/store/src/workspace/page.ts:671](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L671)

***

### \_handleVersion

> `private` **\_handleVersion**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:778](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L778)

***

### \_handleYBlockAdd

> `private` **\_handleYBlockAdd**(`id`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:681](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L681)

***

### \_handleYBlockDelete

> `private` **\_handleYBlockDelete**(`id`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:732](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L732)

***

### \_handleYEvent

> `private` **\_handleYEvent**(`event`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `event` | [`YEvent`](../namespaces/namespace.Y/classes/class.YEvent.md)\< [`Text`](../namespaces/namespace.Y/classes/class.Text.md) \| [`Array`](../namespaces/namespace.Y/classes/class.Array.md)\< `unknown` \> \| `YBlock` \> |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:749](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L749)

***

### \_handleYEvents

> `private` **\_handleYEvents**(`events`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `events` | [`YEvent`](../namespaces/namespace.Y/classes/class.YEvent.md)\< [`Text`](../namespaces/namespace.Y/classes/class.Text.md) \| `YBlock` \>[] |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:768](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L768)

***

### \_historyObserver

> `private` **\_historyObserver**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:677](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L677)

***

### \_initYBlocks

> `private` **\_initYBlocks**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:658](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L658)

***

### \_onBlockAdded

> `protected` **\_onBlockAdded**(`id`, `options` = `{}`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | `string` |
| `options` | `Partial`\< \{`onChange`: (`block`, `key`, `value`) => `void`; `onYBlockUpdated`: (`block`) => `void`;} \> |

#### Returns

`void`

#### Inherited from

BlockTree.\_onBlockAdded

#### Defined In

[packages/store/src/workspace/block/block-tree.ts:33](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/block/block-tree.ts#L33)

***

### \_onBlockRemoved

> `protected` **\_onBlockRemoved**(`id`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`void`

#### Inherited from

BlockTree.\_onBlockRemoved

#### Defined In

[packages/store/src/workspace/block/block-tree.ts:47](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/block/block-tree.ts#L47)

***

### \_removeBlock

> `protected` **\_removeBlock**(`id`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`void`

#### Inherited from

BlockTree.\_removeBlock

#### Defined In

[packages/store/src/workspace/block/block-tree.ts:96](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/block/block-tree.ts#L96)

***

### addBlock

> **addBlock**(
  `flavour`,
  `blockProps` = `{}`,
  `parent`?,
  `parentIndex`?): `string`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `flavour` | `string` |
| `blockProps` | `Partial`\< `BlockSysProps` & \{} & `Omit`\< [`BlockProps`](../type-aliases/type-alias.BlockProps.md), `"flavour"` \> \> |
| `parent`? | `null` \| `string` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |
| `parentIndex`? | `number` |

#### Returns

`string`

#### Defined In

[packages/store/src/workspace/page.ts:318](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L318)

***

### addBlocks

> **addBlocks**(
  `blocks`,
  `parent`?,
  `parentIndex`?): `string`[]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `blocks` | \{`blockProps`: `Partial`\< `BlockSysProps` & \{} & `Omit`\< [`BlockProps`](../type-aliases/type-alias.BlockProps.md), `"id"` \| `"flavour"` \> \>; `flavour`: `string`;}[] |
| `parent`? | `null` \| `string` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |
| `parentIndex`? | `number` |

#### Returns

`string`[]

#### Defined In

[packages/store/src/workspace/page.ts:295](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L295)

***

### addSiblingBlocks

> **addSiblingBlocks**(
  `targetModel`,
  `props`,
  `place` = `'after'`): `string`[]

#### Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `targetModel` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> | `undefined` |
| `props` | `Partial`\< [`BlockProps`](../type-aliases/type-alias.BlockProps.md) \>[] | `undefined` |
| `place` | `"after"` \| `"before"` | `'after'` |

#### Returns

`string`[]

#### Defined In

[packages/store/src/workspace/page.ts:513](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L513)

***

### captureSync

> **captureSync**(): `void`

Capture current operations to undo stack synchronously.

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:179](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L179)

***

### clear

> **clear**(): `void`

#### Returns

`void`

#### Inherited from

BlockTree.clear

#### Defined In

[packages/store/src/workspace/space.ts:78](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L78)

***

### deleteBlock

> **deleteBlock**(`model`, `options` = `...`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |
| `options` | `object` |
| `options.bringChildrenTo`? | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |
| `options.deleteChildren`? | `boolean` |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:545](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L545)

***

### destroy

> **destroy**(): `void`

#### Returns

`void`

#### Inherited from

BlockTree.destroy

#### Defined In

[packages/store/src/workspace/space.ts:72](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L72)

***

### dispose

> **dispose**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:646](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L646)

***

### generateBlockId

> **generateBlockId**(): `string`

#### Returns

`string`

#### Defined In

[packages/store/src/workspace/page.ts:187](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L187)

***

### getBlock

> **getBlock**(`id`): `undefined` \| `Block`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`undefined` \| `Block`

#### Inherited from

BlockTree.getBlock

#### Defined In

[packages/store/src/workspace/block/block-tree.ts:24](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/block/block-tree.ts#L24)

***

### getBlockByFlavour

> **getBlockByFlavour**(`blockFlavour`): [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>[]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `blockFlavour` | `string` \| `string`[] |

#### Returns

[`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>[]

#### Defined In

[packages/store/src/workspace/page.ts:195](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L195)

***

### getBlockById

> **getBlockById**(`id`): `null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Defined In

[packages/store/src/workspace/page.ts:191](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L191)

***

### getInitialPropsByFlavour

> **getInitialPropsByFlavour**(`flavour`): `Record`\< `string`, `any` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `flavour` | `string` |

#### Returns

`Record`\< `string`, `any` \>

#### Defined In

[packages/store/src/workspace/page.ts:289](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L289)

***

### getNextSibling

> **getNextSibling**(`block`): `null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `block` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |

#### Returns

`null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Defined In

[packages/store/src/workspace/page.ts:257](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L257)

***

### getNextSiblings

> **getNextSiblings**(`block`): [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>[]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `block` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |

#### Returns

[`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>[]

#### Defined In

[packages/store/src/workspace/page.ts:271](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L271)

***

### getParent

> **getParent**(`target`): `null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `target` | `string` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |

#### Returns

`null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Defined In

[packages/store/src/workspace/page.ts:204](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L204)

***

### getPreviousSibling

> **getPreviousSibling**(`block`): `null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `block` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |

#### Returns

`null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>

#### Defined In

[packages/store/src/workspace/page.ts:229](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L229)

***

### getPreviousSiblings

> **getPreviousSiblings**(`block`): [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>[]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `block` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |

#### Returns

[`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>[]

#### Defined In

[packages/store/src/workspace/page.ts:243](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L243)

***

### getSchemaByFlavour

> **getSchemaByFlavour**(`flavour`): `undefined` \| \{`model`: `{ flavour: string; role: "root" | "hub" | "content"; parent?: string[] | undefined; children?: string[] | undefined; props?: ((args_0: InternalPrimitives, ...args_1: unknown[]) => Record<...>) | undefined; toModel?: ((...args: unknown[]) => BaseBlockModel<...>) | undefined; }`; `onUpgrade`: (...`args`) => `void`; `transformer`: (...`args`) => [`BaseBlockTransformer`](class.BaseBlockTransformer.md)\< `object` \>; `version`: `number`;}

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `flavour` | `string` |

#### Returns

`undefined` \| \{`model`: `{ flavour: string; role: "root" | "hub" | "content"; parent?: string[] | undefined; children?: string[] | undefined; props?: ((args_0: InternalPrimitives, ...args_1: unknown[]) => Record<...>) | undefined; toModel?: ((...args: unknown[]) => BaseBlockModel<...>) | undefined; }`; `onUpgrade`: (...`args`) => `void`; `transformer`: (...`args`) => [`BaseBlockTransformer`](class.BaseBlockTransformer.md)\< `object` \>; `version`: `number`;}

#### Defined In

[packages/store/src/workspace/page.ts:285](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L285)

***

### load

> **load**(`initFn`?): `Promise`\< [`Page`](class.Page.md) \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `initFn`? | `function` |

#### Returns

`Promise`\< [`Page`](class.Page.md) \>

#### Overrides

BlockTree.load

#### Defined In

[packages/store/src/workspace/page.ts:788](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L788)

***

### moveBlocks

> **moveBlocks**(
  `blocksToMove`,
  `newParent`,
  `targetSibling` = `null`,
  `shouldInsertBeforeSibling` = `true`): `void`

#### Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `blocksToMove` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \>[] | `undefined` |
| `newParent` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> | `undefined` |
| `targetSibling` | `null` \| [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> | `null` |
| `shouldInsertBeforeSibling` | `boolean` | `true` |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:369](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L369)

***

### redo

> **redo**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:170](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L170)

***

### remove

> **remove**(): `void`

#### Returns

`void`

#### Inherited from

BlockTree.remove

#### Defined In

[packages/store/src/workspace/space.ts:67](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/space.ts#L67)

***

### resetHistory

> **resetHistory**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:183](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L183)

***

### transact

> **transact**(`fn`, `shouldTransact` = `...`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `fn` | `function` |
| `shouldTransact` | `boolean` |

#### Returns

`void`

#### Overrides

BlockTree.transact

#### Defined In

[packages/store/src/workspace/page.ts:155](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L155)

***

### trySyncFromExistingDoc

> **trySyncFromExistingDoc**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:623](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L623)

***

### undo

> **undo**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:162](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L162)

***

### updateBlock

> **updateBlock**<`T`>(`model`, `props`): `void`

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* `Partial`\< [`BlockProps`](../type-aliases/type-alias.BlockProps.md) \> |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |
| `props` | `T` |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:461](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L461)

> **updateBlock**(`model`, `callback`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `model` | [`BaseBlockModel`](class.BaseBlockModel.md)\< `object` \> |
| `callback` | `function` |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:465](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L465)

***

### validateVersion

> **validateVersion**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:774](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L774)

***

### waitForLoaded

> **waitForLoaded**(): `Promise`\< `void` \>

#### Returns

`Promise`\< `void` \>

#### Deprecated

use page.load() instead

#### Defined In

[packages/store/src/workspace/page.ts:804](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L804)

***

### withoutTransact

> **withoutTransact**(`callback`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `callback` | `function` |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/page.ts:149](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/page.ts#L149)

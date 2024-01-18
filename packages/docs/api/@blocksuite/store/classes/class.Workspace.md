[API](../../../index.md) > [@blocksuite/store](../index.md) > Workspace

# Class: Workspace

## Extends

- `WorkspaceAddonType`

## Constructors

### constructor

> **new Workspace**(`storeOptions`): [`Workspace`](class.Workspace.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `storeOptions` | [`WorkspaceOptions`](../type-aliases/type-alias.WorkspaceOptions.md) |

#### Returns

[`Workspace`](class.Workspace.md)

#### Overrides

WorkspaceAddonType.constructor

#### Defined In

[packages/store/src/workspace/workspace.ts:33](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L33)

## Properties

### \_schema

> `protected` `readonly` **\_schema**: [`Schema`](class.Schema.md)

#### Defined In

[packages/store/src/workspace/workspace.ts:23](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L23)

***

### \_store

> `protected` **\_store**: [`Store`](class.Store.md)

#### Defined In

[packages/store/src/workspace/workspace.ts:21](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L21)

***

### blob

> **blob**: [`BlobManager`](../interfaces/interface.BlobManager.md)

#### Defined In

[packages/store/src/workspace/addon/type.ts:6](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/addon/type.ts#L6)

#### Inherited from

WorkspaceAddonType.blob

***

### exportJSX

> **exportJSX**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `blockId`? | `string` |
| `pageId`? | `string` |

#### Returns

`JSXElement`

#### Defined In

[packages/store/src/workspace/addon/type.ts:14](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/addon/type.ts#L14)

#### Inherited from

WorkspaceAddonType.exportJSX

***

### exportPageSnapshot

> **exportPageSnapshot**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `pageId` | `string` |

#### Returns

`Record`\< `string`, `unknown` \>

#### Defined In

[packages/store/src/workspace/addon/type.ts:12](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/addon/type.ts#L12)

#### Inherited from

WorkspaceAddonType.exportPageSnapshot

***

### exportPageYDoc

> **exportPageYDoc**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `pageId` | `string` |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/addon/type.ts:13](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/addon/type.ts#L13)

#### Inherited from

WorkspaceAddonType.exportPageYDoc

***

### importPageSnapshot

> **importPageSnapshot**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `json` | `unknown` |
| `pageId` | `string` |

#### Returns

`Promise`\< `void` \>

#### Defined In

[packages/store/src/workspace/addon/type.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/addon/type.ts#L11)

#### Inherited from

WorkspaceAddonType.importPageSnapshot

***

### indexer

> **indexer**: `Indexer`

#### Defined In

[packages/store/src/workspace/addon/type.ts:8](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/addon/type.ts#L8)

#### Inherited from

WorkspaceAddonType.indexer

***

### meta

> **meta**: `WorkspaceMeta`

#### Defined In

[packages/store/src/workspace/workspace.ts:25](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L25)

***

### search

> **search**: `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `query` | `QueryContent` |

#### Returns

`Map`\< `string`, `string` \>

#### Defined In

[packages/store/src/workspace/addon/type.ts:9](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/addon/type.ts#L9)

#### Inherited from

WorkspaceAddonType.search

***

### slots

> **slots**: `object`

#### Type declaration

> ##### `slots.pageAdded`
>
> > **pageAdded**: `Slot`\< `string` \>
>
> ##### `slots.pageRemoved`
>
> > **pageRemoved**: `Slot`\< `string` \>
>
> ##### `slots.pagesUpdated`
>
> > **pagesUpdated**: `Slot`\< `void` \>
>
>

#### Defined In

[packages/store/src/workspace/workspace.ts:27](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L27)

***

### Y

> `static` **Y**: [`Y`](../namespaces/namespace.Y/index.md) = `Y`

#### Defined In

[packages/store/src/workspace/workspace.ts:20](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L20)

## Accessors

### awarenessStore

> `get` awarenessStore(): [`AwarenessStore`](class.AwarenessStore.md)\< `BlockSuiteFlags` \>

#### Defined In

[packages/store/src/workspace/workspace.ts:61](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L61)

***

### doc

> `get` doc(): [`BlockSuiteDoc`](class.BlockSuiteDoc.md)

#### Defined In

[packages/store/src/workspace/workspace.ts:73](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L73)

***

### id

> `get` id(): `string`

#### Defined In

[packages/store/src/workspace/workspace.ts:43](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L43)

***

### idGenerator

> `get` idGenerator(): [`IdGenerator`](../type-aliases/type-alias.IdGenerator.md)

#### Defined In

[packages/store/src/workspace/workspace.ts:77](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L77)

***

### isEmpty

> `get` isEmpty(): `boolean`

#### Defined In

[packages/store/src/workspace/workspace.ts:47](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L47)

***

### pages

> `get` pages(): `Map`\< `string`, [`Page`](class.Page.md) \>

#### Defined In

[packages/store/src/workspace/workspace.ts:69](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L69)

***

### providers

> `get` providers(): [`DocProvider`](../type-aliases/type-alias.DocProvider.md)[]

#### Defined In

[packages/store/src/workspace/workspace.ts:65](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L65)

***

### schema

> `get` schema(): [`Schema`](class.Schema.md)

#### Defined In

[packages/store/src/workspace/workspace.ts:81](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L81)

## Methods

### \_bindPageMetaEvents

> `private` **\_bindPageMetaEvents**(): `void`

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/workspace.ts:99](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L99)

***

### \_hasPage

> `private` **\_hasPage**(`pageId`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `pageId` | `string` |

#### Returns

`boolean`

#### Defined In

[packages/store/src/workspace/workspace.ts:89](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L89)

***

### createPage

> **createPage**(`options` = `{}`): [`Page`](class.Page.md)

By default, only an empty page will be created.
If the `init` parameter is passed, a `surface`, `note`, and `paragraph` block
will be created in the page simultaneously.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `options` | `string` \| \{`id`: `string`;} |

#### Returns

[`Page`](class.Page.md)

#### Defined In

[packages/store/src/workspace/workspace.ts:127](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L127)

***

### getPage

> **getPage**(`pageId`): `null` \| [`Page`](class.Page.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `pageId` | `string` |

#### Returns

`null` \| [`Page`](class.Page.md)

#### Defined In

[packages/store/src/workspace/workspace.ts:93](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L93)

***

### registerProvider

> **registerProvider**(`providerCreator`, `id`?): [`DocProvider`](../type-aliases/type-alias.DocProvider.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `providerCreator` | [`DocProviderCreator`](../type-aliases/type-alias.DocProviderCreator.md) |
| `id`? | `string` |

#### Returns

[`DocProvider`](../type-aliases/type-alias.DocProvider.md)

#### Defined In

[packages/store/src/workspace/workspace.ts:85](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L85)

***

### removePage

> **removePage**(`pageId`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `pageId` | `string` |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/workspace.ts:163](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L163)

***

### setPageMeta

> **setPageMeta**(`pageId`, `props`): `void`

Update page meta state. Note that this intentionally does not mutate page state.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `pageId` | `string` |
| `props` | `Partial`\< [`PageMeta`](../interfaces/interface.PageMeta.md) \> |

#### Returns

`void`

#### Defined In

[packages/store/src/workspace/workspace.ts:155](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/workspace.ts#L155)

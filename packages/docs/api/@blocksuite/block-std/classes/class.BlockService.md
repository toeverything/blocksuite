[API](../../../index.md) > [@blocksuite/block-std](../index.md) > BlockService

# Class: BlockService`<_Model>`

## Constructors

### constructor

> **new BlockService**<`_Model`>(`options`): [`BlockService`](class.BlockService.md)\< `_Model` \>

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `_Model` *extends* [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \> | [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \> |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `options` | [`BlockServiceOptions`](../interfaces/interface.BlockServiceOptions.md) |

#### Returns

[`BlockService`](class.BlockService.md)\< `_Model` \>

#### Defined In

[block-std/src/service/index.ts:17](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/service/index.ts#L17)

## Properties

### disposables

> `readonly` **disposables**: `DisposableGroup`

#### Defined In

[block-std/src/service/index.ts:15](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/service/index.ts#L15)

***

### flavour

> `readonly` **flavour**: `string`

#### Defined In

[block-std/src/service/index.ts:14](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/service/index.ts#L14)

***

### std

> `readonly` **std**: [`BlockStdProvider`](class.BlockStdProvider.md)

#### Defined In

[block-std/src/service/index.ts:13](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/service/index.ts#L13)

## Accessors

### page

> `get` page(): [`Page`](../../store/classes/class.Page.md)

#### Defined In

[block-std/src/service/index.ts:26](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/service/index.ts#L26)

***

### selectionManager

> `get` selectionManager(): [`SelectionManager`](class.SelectionManager.md)

#### Defined In

[block-std/src/service/index.ts:30](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/service/index.ts#L30)

***

### uiEventDispatcher

> `get` uiEventDispatcher(): [`UIEventDispatcher`](class.UIEventDispatcher.md)

#### Defined In

[block-std/src/service/index.ts:34](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/service/index.ts#L34)

***

### workspace

> `get` workspace(): [`Workspace`](../../store/classes/class.Workspace.md)

#### Defined In

[block-std/src/service/index.ts:22](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/service/index.ts#L22)

## Methods

### bindHotKey

> **bindHotKey**(`keymap`, `options`?): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `keymap` | `Record`\< `string`, [`UIEventHandler`](../type-aliases/type-alias.UIEventHandler.md) \> |
| `options`? | `object` |
| `options.global`? | `boolean` |

#### Returns

`void`

#### Defined In

[block-std/src/service/index.ts:65](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/service/index.ts#L65)

***

### dispose

> **dispose**(): `void`

#### Returns

`void`

#### Defined In

[block-std/src/service/index.ts:39](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/service/index.ts#L39)

***

### handleEvent

> **handleEvent**(
  `name`,
  `fn`,
  `options`?): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `"cut"` \| `"blur"` \| `"click"` \| `"copy"` \| `"drop"` \| `"focus"` \| `"paste"` \| `"wheel"` \| `"doubleClick"` \| `"tripleClick"` \| `"pointerDown"` \| `"pointerMove"` \| `"pointerUp"` \| `"pointerOut"` \| `"dragStart"` \| `"dragMove"` \| `"dragEnd"` \| `"keyDown"` \| `"keyUp"` \| `"selectionChange"` \| `"compositionStart"` \| `"compositionUpdate"` \| `"compositionEnd"` \| `"beforeInput"` \| `"contextMenu"` |
| `fn` | [`UIEventHandler`](../type-aliases/type-alias.UIEventHandler.md) |
| `options`? | `object` |
| `options.global`? | `boolean` |

#### Returns

`void`

#### Defined In

[block-std/src/service/index.ts:53](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/service/index.ts#L53)

***

### mounted

> **mounted**(): `void`

#### Returns

`void`

#### Defined In

[block-std/src/service/index.ts:43](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/service/index.ts#L43)

***

### unmounted

> **unmounted**(): `void`

#### Returns

`void`

#### Defined In

[block-std/src/service/index.ts:47](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/service/index.ts#L47)

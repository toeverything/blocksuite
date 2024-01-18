[API](../../../index.md) > [@blocksuite/block-std](../index.md) > UIEventDispatcher

# Class: UIEventDispatcher

## Constructors

### constructor

> **new UIEventDispatcher**(`std`): [`UIEventDispatcher`](class.UIEventDispatcher.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `std` | [`BlockStdProvider`](class.BlockStdProvider.md) |

#### Returns

[`UIEventDispatcher`](class.UIEventDispatcher.md)

#### Defined In

[block-std/src/event/dispatcher.ts:80](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L80)

## Properties

### \_clipboardControl

> `private` **\_clipboardControl**: `ClipboardControl`

#### Defined In

[block-std/src/event/dispatcher.ts:78](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L78)

***

### \_handlersMap

> `private` **\_handlersMap**: `Record`\< `"cut"` \| `"blur"` \| `"click"` \| `"copy"` \| `"drop"` \| `"focus"` \| `"paste"` \| `"wheel"` \| `"doubleClick"` \| `"tripleClick"` \| `"pointerDown"` \| `"pointerMove"` \| `"pointerUp"` \| `"pointerOut"` \| `"dragStart"` \| `"dragMove"` \| `"dragEnd"` \| `"keyDown"` \| `"keyUp"` \| `"selectionChange"` \| `"compositionStart"` \| `"compositionUpdate"` \| `"compositionEnd"` \| `"beforeInput"` \| `"contextMenu"`, [`EventHandlerRunner`](../type-aliases/type-alias.EventHandlerRunner.md)[] \>

#### Defined In

[block-std/src/event/dispatcher.ts:71](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L71)

***

### \_keyboardControl

> `private` **\_keyboardControl**: `KeyboardControl`

#### Defined In

[block-std/src/event/dispatcher.ts:76](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L76)

***

### \_pointerControl

> `private` **\_pointerControl**: `PointerControl`

#### Defined In

[block-std/src/event/dispatcher.ts:75](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L75)

***

### \_rangeControl

> `private` **\_rangeControl**: `RangeControl`

#### Defined In

[block-std/src/event/dispatcher.ts:77](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L77)

***

### disposables

> **disposables**: `DisposableGroup`

#### Defined In

[block-std/src/event/dispatcher.ts:69](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L69)

***

### std

> **std**: [`BlockStdProvider`](class.BlockStdProvider.md)

#### Defined In

[block-std/src/event/dispatcher.ts:80](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L80)

## Accessors

### \_currentSelections

> `private` `get` _currentSelections(): [`BaseSelection`](class.BaseSelection.md)[]

#### Defined In

[block-std/src/event/dispatcher.ts:139](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L139)

***

### root

> `get` root(): `HTMLElement`

#### Defined In

[block-std/src/event/dispatcher.ts:98](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L98)

## Methods

### \_bindEvents

> `private` **\_bindEvents**(): `void`

#### Returns

`void`

#### Defined In

[block-std/src/event/dispatcher.ts:235](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L235)

***

### \_buildEventScopeBySelection

> `private` **\_buildEventScopeBySelection**(`name`): `undefined` \| [`EventScope`](../type-aliases/type-alias.EventScope.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `"cut"` \| `"blur"` \| `"click"` \| `"copy"` \| `"drop"` \| `"focus"` \| `"paste"` \| `"wheel"` \| `"doubleClick"` \| `"tripleClick"` \| `"pointerDown"` \| `"pointerMove"` \| `"pointerUp"` \| `"pointerOut"` \| `"dragStart"` \| `"dragMove"` \| `"dragEnd"` \| `"keyDown"` \| `"keyUp"` \| `"selectionChange"` \| `"compositionStart"` \| `"compositionUpdate"` \| `"compositionEnd"` \| `"beforeInput"` \| `"contextMenu"` |

#### Returns

`undefined` \| [`EventScope`](../type-aliases/type-alias.EventScope.md)

#### Defined In

[block-std/src/event/dispatcher.ts:208](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L208)

***

### \_buildEventScopeByTarget

> `private` **\_buildEventScopeByTarget**(`name`, `target`): `undefined` \| [`EventScope`](../type-aliases/type-alias.EventScope.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `"cut"` \| `"blur"` \| `"click"` \| `"copy"` \| `"drop"` \| `"focus"` \| `"paste"` \| `"wheel"` \| `"doubleClick"` \| `"tripleClick"` \| `"pointerDown"` \| `"pointerMove"` \| `"pointerUp"` \| `"pointerOut"` \| `"dragStart"` \| `"dragMove"` \| `"dragEnd"` \| `"keyDown"` \| `"keyUp"` \| `"selectionChange"` \| `"compositionStart"` \| `"compositionUpdate"` \| `"compositionEnd"` \| `"beforeInput"` \| `"contextMenu"` |
| `target` | `Node` |

#### Returns

`undefined` \| [`EventScope`](../type-aliases/type-alias.EventScope.md)

#### Defined In

[block-std/src/event/dispatcher.ts:189](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L189)

***

### \_getEventScope

> `private` **\_getEventScope**(`name`, `event`): `undefined` \| [`EventScope`](../type-aliases/type-alias.EventScope.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `"cut"` \| `"blur"` \| `"click"` \| `"copy"` \| `"drop"` \| `"focus"` \| `"paste"` \| `"wheel"` \| `"doubleClick"` \| `"tripleClick"` \| `"pointerDown"` \| `"pointerMove"` \| `"pointerUp"` \| `"pointerOut"` \| `"dragStart"` \| `"dragMove"` \| `"dragEnd"` \| `"keyDown"` \| `"keyUp"` \| `"selectionChange"` \| `"compositionStart"` \| `"compositionUpdate"` \| `"compositionEnd"` \| `"beforeInput"` \| `"contextMenu"` |
| `event` | `Event` |

#### Returns

`undefined` \| [`EventScope`](../type-aliases/type-alias.EventScope.md)

#### Defined In

[block-std/src/event/dispatcher.ts:143](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L143)

***

### add

> **add**(
  `name`,
  `handler`,
  `options`?): `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `"cut"` \| `"blur"` \| `"click"` \| `"copy"` \| `"drop"` \| `"focus"` \| `"paste"` \| `"wheel"` \| `"doubleClick"` \| `"tripleClick"` \| `"pointerDown"` \| `"pointerMove"` \| `"pointerUp"` \| `"pointerOut"` \| `"dragStart"` \| `"dragMove"` \| `"dragEnd"` \| `"keyDown"` \| `"keyUp"` \| `"selectionChange"` \| `"compositionStart"` \| `"compositionUpdate"` \| `"compositionEnd"` \| `"beforeInput"` \| `"contextMenu"` |
| `handler` | [`UIEventHandler`](../type-aliases/type-alias.UIEventHandler.md) |
| `options`? | [`EventOptions`](../type-aliases/type-alias.EventOptions.md) |

#### Returns

> > (): `void`
>
> ##### Returns
>
> `void`
>
>
>
> ##### Defined In
>
> [block-std/src/event/dispatcher.ts:127](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L127)

#### Defined In

[block-std/src/event/dispatcher.ts:120](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L120)

***

### bindHotkey

> **bindHotkey**(...`args`): `function`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| ...`args` | [`Record`\< `string`, [`UIEventHandler`](../type-aliases/type-alias.UIEventHandler.md) \>, [`EventOptions`](../type-aliases/type-alias.EventOptions.md)] |

#### Returns

> > (): `void`
>
> ##### Returns
>
> `void`
>
>
>
> ##### Defined In
>
> [block-std/src/event/dispatcher.ts:127](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L127)

#### Defined In

[block-std/src/event/dispatcher.ts:136](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L136)

***

### buildEventScope

> **buildEventScope**(
  `name`,
  `flavours`,
  `paths`): `undefined` \| [`EventScope`](../type-aliases/type-alias.EventScope.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `"cut"` \| `"blur"` \| `"click"` \| `"copy"` \| `"drop"` \| `"focus"` \| `"paste"` \| `"wheel"` \| `"doubleClick"` \| `"tripleClick"` \| `"pointerDown"` \| `"pointerMove"` \| `"pointerUp"` \| `"pointerOut"` \| `"dragStart"` \| `"dragMove"` \| `"dragEnd"` \| `"keyDown"` \| `"keyUp"` \| `"selectionChange"` \| `"compositionStart"` \| `"compositionUpdate"` \| `"compositionEnd"` \| `"beforeInput"` \| `"contextMenu"` |
| `flavours` | `string`[] |
| `paths` | `string`[][] |

#### Returns

`undefined` \| [`EventScope`](../type-aliases/type-alias.EventScope.md)

#### Defined In

[block-std/src/event/dispatcher.ts:160](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L160)

***

### mount

> **mount**(): `void`

#### Returns

`void`

#### Defined In

[block-std/src/event/dispatcher.ts:87](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L87)

***

### run

> **run**(
  `name`,
  `context`,
  `scope`?): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `"cut"` \| `"blur"` \| `"click"` \| `"copy"` \| `"drop"` \| `"focus"` \| `"paste"` \| `"wheel"` \| `"doubleClick"` \| `"tripleClick"` \| `"pointerDown"` \| `"pointerMove"` \| `"pointerUp"` \| `"pointerOut"` \| `"dragStart"` \| `"dragMove"` \| `"dragEnd"` \| `"keyDown"` \| `"keyUp"` \| `"selectionChange"` \| `"compositionStart"` \| `"compositionUpdate"` \| `"compositionEnd"` \| `"beforeInput"` \| `"contextMenu"` |
| `context` | [`UIEventStateContext`](class.UIEventStateContext.md) |
| `scope`? | [`EventScope`](../type-aliases/type-alias.EventScope.md) |

#### Returns

`void`

#### Defined In

[block-std/src/event/dispatcher.ts:102](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L102)

***

### unmount

> **unmount**(): `void`

#### Returns

`void`

#### Defined In

[block-std/src/event/dispatcher.ts:94](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/event/dispatcher.ts#L94)

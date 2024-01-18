[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > AbstractConnector

# Class: AbstractConnector

This is an abstract interface that all Connectors should implement to keep them interchangeable.

## Note

This interface is experimental and it is not advised to actually inherit this class.
      It just serves as typing information.

## Extends

- `Observable`\< `any` \>

## Constructors

### constructor

> **new AbstractConnector**(`ydoc`, `awareness`): [`AbstractConnector`](class.AbstractConnector.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `ydoc` | [`Doc`](class.Doc.md) |
| `awareness` | `any` |

#### Returns

[`AbstractConnector`](class.AbstractConnector.md)

#### Overrides

Observable\<any\>.constructor

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/AbstractConnector.d.ts:14

## Properties

### \_observers

> **\_observers**: `Map`\< `any`, `any` \>

Some desc.

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:58

#### Inherited from

Observable.\_observers

***

### awareness

> **awareness**: `any`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/AbstractConnector.d.ts:16

***

### doc

> **doc**: [`Doc`](class.Doc.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/AbstractConnector.d.ts:15

## Methods

### destroy

> **destroy**(): `void`

#### Returns

`void`

#### Inherited from

Observable.destroy

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:84

***

### emit

> **emit**(`name`, `args`): `void`

Emit a named event. All registered event listeners that listen to the
specified name will receive the event.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `name` | `any` | The event name. |
| `args` | `any`[] | The arguments that are applied to the event listener. |

#### Returns

`void`

#### Inherited from

Observable.emit

#### Todo

This should catch exceptions

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:83

***

### off

> **off**(`name`, `f`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `any` |
| `f` | `Function` |

#### Returns

`void`

#### Inherited from

Observable.off

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:73

***

### on

> **on**(`name`, `f`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `any` |
| `f` | `Function` |

#### Returns

`void`

#### Inherited from

Observable.on

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:63

***

### once

> **once**(`name`, `f`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `any` |
| `f` | `Function` |

#### Returns

`void`

#### Inherited from

Observable.once

#### Defined In

node\_modules/.pnpm/lib0@0.2.87/node\_modules/lib0/observable.d.ts:68

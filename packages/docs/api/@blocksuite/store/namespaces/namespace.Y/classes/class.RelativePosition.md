[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > RelativePosition

# Class: RelativePosition

A relative position is based on the Yjs model and is not affected by document changes.
E.g. If you place a relative position before a certain character, it will always point to this character.
If you place a relative position at the end of a type, it will always point to the end of the type.

A numeric position is often unsuited for user selections, because it does not change when content is inserted
before or after.

```Insert(0, 'x')('a|bc') = 'xa|bc'``` Where | is the relative position.

One of the properties must be defined.

## Example

```ts
// Current cursor position is at position 10
  const relativePosition = createRelativePositionFromIndex(yText, 10)
  // modify yText
  yText.insert(0, 'abc')
  yText.delete(3, 10)
  // Compute the cursor position
  const absolutePosition = createAbsolutePositionFromRelativePosition(y, relativePosition)
  absolutePosition.type === yText // => true
  console.log('cursor location is ' + absolutePosition.index) // => cursor location is 3
```

## Constructors

### constructor

> **new RelativePosition**(
  `type`,
  `tname`,
  `item`,
  `assoc`?): [`RelativePosition`](class.RelativePosition.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `type` | `null` \| [`ID`](class.ID.md) |
| `tname` | `null` \| `string` |
| `item` | `null` \| [`ID`](class.ID.md) |
| `assoc`? | `number` |

#### Returns

[`RelativePosition`](class.RelativePosition.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/RelativePosition.d.ts:32

## Properties

### assoc

> **assoc**: `number`

A relative position is associated to a specific character. By default
assoc >= 0, the relative position is associated to the character
after the meant position.
I.e. position 1 in 'ab' is associated to character 'b'.

If assoc < 0, then the relative position is associated to the caharacter
before the meant position.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/RelativePosition.d.ts:56

***

### item

> **item**: `null` \| [`ID`](class.ID.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/RelativePosition.d.ts:44

***

### tname

> **tname**: `null` \| `string`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/RelativePosition.d.ts:40

***

### type

> **type**: `null` \| [`ID`](class.ID.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/RelativePosition.d.ts:36

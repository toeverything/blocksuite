[**@blocksuite/block-std**](../../../../@blocksuite/block-std/README.md)

***

[BlockSuite API Documentation](../../../../README.md) / [@blocksuite/block-std](../../README.md) / [gfx](../README.md) / GfxCompatibleInterface

# Interface: GfxCompatibleInterface

All the model that can be rendered in graphics mode should implement this interface.

## Extends

- `IBound`.[`GfxElementGeometry`](GfxElementGeometry.md)

## Extended by

- [`GfxGroupCompatibleInterface`](GfxGroupCompatibleInterface.md)

## Properties

### elementBound

> `readonly` **elementBound**: `Bound`

The bound of the element without considering the response extension.

***

### lockedBySelf?

> `optional` **lockedBySelf**: `boolean`

Indicates whether the current block is explicitly locked by self.
For checking the lock status of the element, use `isLocked` instead.
For (un)locking the element, use `(un)lock` instead.

***

### responseBound

> `readonly` **responseBound**: `Bound`

The bound of the element considering the response extension.

***

### responseExtension

> **responseExtension**: \[`number`, `number`\]

Defines the extension of the response area beyond the element's bounding box.
This tuple specifies the horizontal and vertical margins to be added to the element's bound.

The first value represents the horizontal extension (added to both left and right sides),
and the second value represents the vertical extension (added to both top and bottom sides).

The response area is computed as:
`[x - horizontal, y - vertical, w + 2 * horizontal, h + 2 * vertical]`.

Example:
- xywh: `[0, 0, 100, 100]`, `responseExtension: [10, 20]`
  Resulting response area: `[-10, -20, 120, 140]`.
- `responseExtension: [0, 0]` keeps the response area equal to the bounding box.

## Methods

### isLocked()

> **isLocked**(): `boolean`

Check if the element is locked. It will check the lock status of the element and its ancestors.

#### Returns

`boolean`

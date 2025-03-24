[**@blocksuite/block-std**](../../../../@blocksuite/block-std/README.md)

***

[BlockSuite API Documentation](../../../../README.md) / [@blocksuite/block-std](../../README.md) / [gfx](../README.md) / generateNKeysBetween

# Function: generateNKeysBetween()

> **generateNKeysBetween**(`a`, `b`, `n`, `digits`?): `string`[]

same preconditions as generateKeysBetween.
n >= 0.
Returns an array of n distinct keys in sorted order.
If a and b are both null, returns [a0, a1, ...]
If one or the other is null, returns consecutive "integer"
keys.  Otherwise, returns relatively short keys between
a and b.

## Parameters

### a

`undefined` | `null` | `string`

### b

`undefined` | `null` | `string`

### n

`number`

### digits?

`string`

## Returns

`string`[]

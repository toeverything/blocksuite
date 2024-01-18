[API](../../../index.md) > [@blocksuite/block-std](../index.md) > PathFinder

# Class: PathFinder

## Constructors

### constructor

> `private` **new PathFinder**(): [`PathFinder`](class.PathFinder.md)

#### Returns

[`PathFinder`](class.PathFinder.md)

#### Defined In

[block-std/src/utils/path-finder.ts:2](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/utils/path-finder.ts#L2)

## Methods

### equals

> `static` **equals**(`path1`, `path2`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path1` | *readonly* `string`[] |
| `path2` | *readonly* `string`[] |

#### Returns

`boolean`

#### Defined In

[block-std/src/utils/path-finder.ts:22](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/utils/path-finder.ts#L22)

***

### id

> `static` **id**(`path`): `string`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | *readonly* `string`[] |

#### Returns

`string`

#### Defined In

[block-std/src/utils/path-finder.ts:6](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/utils/path-finder.ts#L6)

***

### includes

> `static` **includes**(`path1`, `path2`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path1` | `string`[] |
| `path2` | `string`[] |

#### Returns

`boolean`

#### Defined In

[block-std/src/utils/path-finder.ts:27](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/utils/path-finder.ts#L27)

***

### keyToPath

> `static` **keyToPath**(`key`): `string`[]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`string`[]

#### Defined In

[block-std/src/utils/path-finder.ts:18](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/utils/path-finder.ts#L18)

***

### parent

> `static` **parent**(`path`): `string`[]

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | *readonly* `string`[] |

#### Returns

`string`[]

#### Defined In

[block-std/src/utils/path-finder.ts:10](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/utils/path-finder.ts#L10)

***

### pathToKey

> `static` **pathToKey**(`path`): `string`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | *readonly* `string`[] |

#### Returns

`string`

#### Defined In

[block-std/src/utils/path-finder.ts:14](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/utils/path-finder.ts#L14)

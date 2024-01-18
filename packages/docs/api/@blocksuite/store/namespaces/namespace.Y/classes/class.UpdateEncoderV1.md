[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > UpdateEncoderV1

# Class: UpdateEncoderV1

## Extends

- `DSEncoderV1`

## Constructors

### constructor

> **new UpdateEncoderV1**(): [`UpdateEncoderV1`](class.UpdateEncoderV1.md)

#### Returns

[`UpdateEncoderV1`](class.UpdateEncoderV1.md)

#### Inherited from

DSEncoderV1.constructor

## Properties

### restEncoder

> **restEncoder**: `Encoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:2

#### Inherited from

DSEncoderV1.restEncoder

## Methods

### resetDsCurVal

> **resetDsCurVal**(): `void`

#### Returns

`void`

#### Inherited from

DSEncoderV1.resetDsCurVal

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:4

***

### toUint8Array

> **toUint8Array**(): `Uint8Array`

#### Returns

`Uint8Array`

#### Inherited from

DSEncoderV1.toUint8Array

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:3

***

### writeAny

> **writeAny**(`any`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `any` | `any` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:53

***

### writeBuf

> **writeBuf**(`buf`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `buf` | `Uint8Array` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:57

***

### writeClient

> **writeClient**(`client`): `void`

Use writeClient and writeClock instead of writeID if possible.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `client` | `number` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:27

***

### writeDsClock

> **writeDsClock**(`clock`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `clock` | `number` |

#### Returns

`void`

#### Inherited from

DSEncoderV1.writeDsClock

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:8

***

### writeDsLen

> **writeDsLen**(`len`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `len` | `number` |

#### Returns

`void`

#### Inherited from

DSEncoderV1.writeDsLen

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:12

***

### writeInfo

> **writeInfo**(`info`): `void`

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `info` | `number` | An unsigned 8-bit integer |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:31

***

### writeJSON

> **writeJSON**(`embed`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `embed` | `any` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:61

***

### writeKey

> **writeKey**(`key`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:65

***

### writeLeftID

> **writeLeftID**(`id`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | [`ID`](class.ID.md) |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:18

***

### writeLen

> **writeLen**(`len`): `void`

Write len of a struct - well suited for Opt RLE encoder.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `len` | `number` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:49

***

### writeParentInfo

> **writeParentInfo**(`isYKey`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `isYKey` | `boolean` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:39

***

### writeRightID

> **writeRightID**(`id`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | [`ID`](class.ID.md) |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:22

***

### writeString

> **writeString**(`s`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `s` | `string` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:35

***

### writeTypeRef

> **writeTypeRef**(`info`): `void`

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `info` | `number` | An unsigned 8-bit integer |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:43

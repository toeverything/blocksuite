[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > UpdateDecoderV1

# Class: UpdateDecoderV1

## Extends

- `DSDecoderV1`

## Constructors

### constructor

> **new UpdateDecoderV1**(`decoder`): [`UpdateDecoderV1`](class.UpdateDecoderV1.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `decoder` | `Decoder` |

#### Returns

[`UpdateDecoderV1`](class.UpdateDecoderV1.md)

#### Inherited from

DSDecoderV1.constructor

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:5

## Properties

### restDecoder

> **restDecoder**: `Decoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:6

#### Inherited from

DSDecoderV1.restDecoder

## Methods

### readAny

> **readAny**(): `any`

#### Returns

`any`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:56

***

### readBuf

> **readBuf**(): `Uint8Array`

#### Returns

`Uint8Array`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:60

***

### readClient

> **readClient**(): `number`

Read the next client id.
Use this in favor of readID whenever possible to reduce the number of objects created.

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:30

***

### readDsClock

> **readDsClock**(): `number`

#### Returns

`number`

#### Inherited from

DSDecoderV1.readDsClock

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:11

***

### readDsLen

> **readDsLen**(): `number`

#### Returns

`number`

#### Inherited from

DSDecoderV1.readDsLen

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:15

***

### readInfo

> **readInfo**(): `number`

#### Returns

`number`

info An unsigned 8-bit integer

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:34

***

### readJSON

> **readJSON**(): `any`

Legacy implementation uses JSON parse. We use any-decoding in v2.

#### Returns

`any`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:66

***

### readKey

> **readKey**(): `string`

#### Returns

`string`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:70

***

### readLeftID

> **readLeftID**(): [`ID`](class.ID.md)

#### Returns

[`ID`](class.ID.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:21

***

### readLen

> **readLen**(): `number`

Write len of a struct - well suited for Opt RLE encoder.

#### Returns

`number`

len

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:52

***

### readParentInfo

> **readParentInfo**(): `boolean`

#### Returns

`boolean`

isKey

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:42

***

### readRightID

> **readRightID**(): [`ID`](class.ID.md)

#### Returns

[`ID`](class.ID.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:25

***

### readString

> **readString**(): `string`

#### Returns

`string`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:38

***

### readTypeRef

> **readTypeRef**(): `number`

#### Returns

`number`

info An unsigned 8-bit integer

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:46

***

### resetDsCurVal

> **resetDsCurVal**(): `void`

#### Returns

`void`

#### Inherited from

DSDecoderV1.resetDsCurVal

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:7

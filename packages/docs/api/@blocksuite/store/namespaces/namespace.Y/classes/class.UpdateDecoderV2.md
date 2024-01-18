[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > UpdateDecoderV2

# Class: UpdateDecoderV2

## Extends

- `DSDecoderV2`

## Constructors

### constructor

> **new UpdateDecoderV2**(`decoder`): [`UpdateDecoderV2`](class.UpdateDecoderV2.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `decoder` | `Decoder` |

#### Returns

[`UpdateDecoderV2`](class.UpdateDecoderV2.md)

#### Inherited from

DSDecoderV2.constructor

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:76

## Properties

### clientDecoder

> **clientDecoder**: `UintOptRleDecoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:101

***

### infoDecoder

> **infoDecoder**: `RleDecoder`\< `number` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:104

***

### keyClockDecoder

> **keyClockDecoder**: `IntDiffOptRleDecoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:100

***

### keys

> **keys**: `string`[]

List of cached keys. If the keys[id] does not exist, we read a new key
from stringEncoder and push it to keys.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:99

***

### leftClockDecoder

> **leftClockDecoder**: `IntDiffOptRleDecoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:102

***

### lenDecoder

> **lenDecoder**: `UintOptRleDecoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:108

***

### parentInfoDecoder

> **parentInfoDecoder**: `RleDecoder`\< `number` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:106

***

### restDecoder

> **restDecoder**: `Decoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:81

#### Inherited from

DSDecoderV2.restDecoder

***

### rightClockDecoder

> **rightClockDecoder**: `IntDiffOptRleDecoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:103

***

### stringDecoder

> **stringDecoder**: `StringDecoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:105

***

### typeRefDecoder

> **typeRefDecoder**: `UintOptRleDecoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:107

## Methods

### readAny

> **readAny**(): `any`

#### Returns

`any`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:147

***

### readBuf

> **readBuf**(): `Uint8Array`

#### Returns

`Uint8Array`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:151

***

### readClient

> **readClient**(): `number`

Read the next client id.
Use this in favor of readID whenever possible to reduce the number of objects created.

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:121

***

### readDsClock

> **readDsClock**(): `number`

#### Returns

`number`

#### Inherited from

DSDecoderV2.readDsClock

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:86

***

### readDsLen

> **readDsLen**(): `number`

#### Returns

`number`

#### Inherited from

DSDecoderV2.readDsLen

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:90

***

### readInfo

> **readInfo**(): `number`

#### Returns

`number`

info An unsigned 8-bit integer

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:125

***

### readJSON

> **readJSON**(): `any`

This is mainly here for legacy purposes.

Initial we incoded objects using JSON. Now we use the much faster lib0/any-encoder. This method mainly exists for legacy purposes for the v1 encoder.

#### Returns

`any`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:159

***

### readKey

> **readKey**(): `string`

#### Returns

`string`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:163

***

### readLeftID

> **readLeftID**(): [`ID`](class.ID.md)

#### Returns

[`ID`](class.ID.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:112

***

### readLen

> **readLen**(): `number`

Write len of a struct - well suited for Opt RLE encoder.

#### Returns

`number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:143

***

### readParentInfo

> **readParentInfo**(): `boolean`

#### Returns

`boolean`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:133

***

### readRightID

> **readRightID**(): [`ID`](class.ID.md)

#### Returns

[`ID`](class.ID.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:116

***

### readString

> **readString**(): `string`

#### Returns

`string`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:129

***

### readTypeRef

> **readTypeRef**(): `number`

#### Returns

`number`

An unsigned 8-bit integer

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:137

***

### resetDsCurVal

> **resetDsCurVal**(): `void`

#### Returns

`void`

#### Inherited from

DSDecoderV2.resetDsCurVal

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateDecoder.d.ts:82

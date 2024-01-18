[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > UpdateEncoderV2

# Class: UpdateEncoderV2

## Extends

- `DSEncoderV2`

## Constructors

### constructor

> **new UpdateEncoderV2**(): [`UpdateEncoderV2`](class.UpdateEncoderV2.md)

#### Returns

[`UpdateEncoderV2`](class.UpdateEncoderV2.md)

#### Inherited from

DSEncoderV2.constructor

## Properties

### clientEncoder

> **clientEncoder**: `UintOptRleEncoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:94

***

### dsCurrVal

> **dsCurrVal**: `number`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:69

#### Inherited from

DSEncoderV2.dsCurrVal

***

### infoEncoder

> **infoEncoder**: `RleEncoder`\< `number` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:97

***

### keyClock

> **keyClock**: `number`

Refers to the next uniqe key-identifier to me used.
See writeKey method for more information.

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:92

***

### keyClockEncoder

> **keyClockEncoder**: `IntDiffOptRleEncoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:93

***

### keyMap

> **keyMap**: `Map`\< `string`, `number` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:85

***

### leftClockEncoder

> **leftClockEncoder**: `IntDiffOptRleEncoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:95

***

### lenEncoder

> **lenEncoder**: `UintOptRleEncoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:101

***

### parentInfoEncoder

> **parentInfoEncoder**: `RleEncoder`\< `number` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:99

***

### restEncoder

> **restEncoder**: `Encoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:68

#### Inherited from

DSEncoderV2.restEncoder

***

### rightClockEncoder

> **rightClockEncoder**: `IntDiffOptRleEncoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:96

***

### stringEncoder

> **stringEncoder**: `StringEncoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:98

***

### typeRefEncoder

> **typeRefEncoder**: `UintOptRleEncoder`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:100

## Methods

### resetDsCurVal

> **resetDsCurVal**(): `void`

#### Returns

`void`

#### Inherited from

DSEncoderV2.resetDsCurVal

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:71

***

### toUint8Array

> **toUint8Array**(): `Uint8Array`

#### Returns

`Uint8Array`

#### Inherited from

DSEncoderV2.toUint8Array

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:70

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:139

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:143

***

### writeClient

> **writeClient**(`client`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `client` | `number` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:113

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

DSEncoderV2.writeDsClock

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:75

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

DSEncoderV2.writeDsLen

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:79

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:117

***

### writeJSON

> **writeJSON**(`embed`): `void`

This is mainly here for legacy purposes.

Initial we incoded objects using JSON. Now we use the much faster lib0/any-encoder. This method mainly exists for legacy purposes for the v1 encoder.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `embed` | `any` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:151

***

### writeKey

> **writeKey**(`key`): `void`

Property keys are often reused. For example, in y-prosemirror the key `bold` might
occur very often. For a 3d application, the key `position` might occur very often.

We cache these keys in a Map and refer to them via a unique number.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:160

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:105

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:135

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:125

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:109

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:121

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

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/UpdateEncoder.d.ts:129

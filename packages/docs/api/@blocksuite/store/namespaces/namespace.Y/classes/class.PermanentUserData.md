[API](../../../../../index.md) > [@blocksuite/store](../../../index.md) > [Y](../index.md) > PermanentUserData

# Class: PermanentUserData

## Constructors

### constructor

> **new PermanentUserData**(`doc`, `storeType`?): [`PermanentUserData`](class.PermanentUserData.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `doc` | [`Doc`](class.Doc.md) |
| `storeType`? | [`Map`](class.Map.md)\< `any` \> |

#### Returns

[`PermanentUserData`](class.PermanentUserData.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/PermanentUserData.d.ts:6

## Properties

### clients

> **clients**: `Map`\< `number`, `string` \>

Maps from clientid to userDescription

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/PermanentUserData.d.ts:14

***

### doc

> **doc**: [`Doc`](class.Doc.md)

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/PermanentUserData.d.ts:8

***

### dss

> **dss**: `Map`\< `string`, `DeleteSet` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/PermanentUserData.d.ts:15

***

### yusers

> **yusers**: [`Map`](class.Map.md)\< `any` \>

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/PermanentUserData.d.ts:7

## Methods

### getUserByClientId

> **getUserByClientId**(`clientid`): `any`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `clientid` | `number` |

#### Returns

`any`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/PermanentUserData.d.ts:30

***

### getUserByDeletedId

> **getUserByDeletedId**(`id`): `null` \| `string`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | [`ID`](class.ID.md) |

#### Returns

`null` \| `string`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/PermanentUserData.d.ts:35

***

### setUserMapping

> **setUserMapping**(
  `doc`,
  `clientid`,
  `userDescription`,
  `conf`?): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `doc` | [`Doc`](class.Doc.md) |
| `clientid` | `number` |
| `userDescription` | `string` |
| `conf`? | `object` |
| `conf.filter`? | `function` |

#### Returns

`void`

#### Defined In

node\_modules/.pnpm/yjs@13.6.10/node\_modules/yjs/dist/src/utils/PermanentUserData.d.ts:23

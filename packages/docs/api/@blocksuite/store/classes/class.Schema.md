[API](../../../index.md) > [@blocksuite/store](../index.md) > Schema

# Class: Schema

## Constructors

### constructor

> **new Schema**(): [`Schema`](class.Schema.md)

#### Returns

[`Schema`](class.Schema.md)

## Properties

### flavourSchemaMap

> `readonly` **flavourSchemaMap**: `Map`\< `string`, \{`model`: `{ flavour: string; role: "root" | "hub" | "content"; parent?: string[] | undefined; children?: string[] | undefined; props?: ((args_0: InternalPrimitives, ...args_1: unknown[]) => Record<...>) | undefined; toModel?: ((...args: unknown[]) => BaseBlockModel<...>) | undefined; }`; `onUpgrade`: (...`args`) => `void`; `transformer`: (...`args`) => [`BaseBlockTransformer`](class.BaseBlockTransformer.md)\< `object` \>; `version`: `number`;} \>

#### Defined In

[packages/store/src/schema/schema.ts:13](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/schema.ts#L13)

## Accessors

### versions

> `get` versions(): `object`

#### Defined In

[packages/store/src/schema/schema.ts:15](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/schema.ts#L15)

## Methods

### \_matchFlavour

> `private` **\_matchFlavour**(`childFlavour`, `parentFlavour`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `childFlavour` | `string` |
| `parentFlavour` | `string` |

#### Returns

`boolean`

#### Defined In

[packages/store/src/schema/schema.ts:218](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/schema.ts#L218)

***

### \_upgradeBlockVersions

> `private` **\_upgradeBlockVersions**(`rootData`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `rootData` | [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md) |

#### Returns

`void`

#### Defined In

[packages/store/src/schema/schema.ts:176](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/schema.ts#L176)

***

### \_validateParent

> `private` **\_validateParent**(`child`, `parent`): `boolean`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `child` | `object` |
| `child.model` | `{ flavour: string; role: "root" | "hub" | "content"; parent?: string[] | undefined; children?: string[] | undefined; props?: ((args_0: InternalPrimitives, ...args_1: unknown[]) => Record<...>) | undefined; toModel?: ((...args: unknown[]) => BaseBlockModel<...>) | undefined; }` |
| `child.onUpgrade`? | `function` |
| `child.transformer`? | `function` |
| `child.version` | `number` |
| `parent` | `object` |
| `parent.model` | `{ flavour: string; role: "root" | "hub" | "content"; parent?: string[] | undefined; children?: string[] | undefined; props?: ((args_0: InternalPrimitives, ...args_1: unknown[]) => Record<...>) | undefined; toModel?: ((...args: unknown[]) => BaseBlockModel<...>) | undefined; }` |
| `parent.onUpgrade`? | `function` |
| `parent.transformer`? | `function` |
| `parent.version` | `number` |

#### Returns

`boolean`

#### Defined In

[packages/store/src/schema/schema.ts:225](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/schema.ts#L225)

***

### \_validateRole

> `private` **\_validateRole**(`child`, `parent`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `child` | `object` |
| `child.model` | `{ flavour: string; role: "root" | "hub" | "content"; parent?: string[] | undefined; children?: string[] | undefined; props?: ((args_0: InternalPrimitives, ...args_1: unknown[]) => Record<...>) | undefined; toModel?: ((...args: unknown[]) => BaseBlockModel<...>) | undefined; }` |
| `child.onUpgrade`? | `function` |
| `child.transformer`? | `function` |
| `child.version` | `number` |
| `parent` | `object` |
| `parent.model` | `{ flavour: string; role: "root" | "hub" | "content"; parent?: string[] | undefined; children?: string[] | undefined; props?: ((args_0: InternalPrimitives, ...args_1: unknown[]) => Record<...>) | undefined; toModel?: ((...args: unknown[]) => BaseBlockModel<...>) | undefined; }` |
| `parent.onUpgrade`? | `function` |
| `parent.transformer`? | `function` |
| `parent.version` | `number` |

#### Returns

`void`

#### Defined In

[packages/store/src/schema/schema.ts:190](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/schema.ts#L190)

***

### register

> **register**(`blockSchema`): [`Schema`](class.Schema.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `blockSchema` | \{`model`: `{ flavour: string; role: "root" | "hub" | "content"; parent?: string[] | undefined; children?: string[] | undefined; props?: ((args_0: InternalPrimitives, ...args_1: unknown[]) => Record<...>) | undefined; toModel?: ((...args: unknown[]) => BaseBlockModel<...>) | undefined; }`; `onUpgrade`: (...`args`) => `void`; `transformer`: (...`args`) => [`BaseBlockTransformer`](class.BaseBlockTransformer.md)\< `object` \>; `version`: `number`;}[] |

#### Returns

[`Schema`](class.Schema.md)

#### Defined In

[packages/store/src/schema/schema.ts:38](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/schema.ts#L38)

***

### toJSON

> **toJSON**(): `object`

#### Returns

`object`

#### Defined In

[packages/store/src/schema/schema.ts:23](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/schema.ts#L23)

***

### upgradeBlock

> **upgradeBlock**(
  `flavour`,
  `oldVersion`,
  `blockData`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `flavour` | `string` |
| `oldVersion` | `number` |
| `blockData` | [`Map`](../namespaces/namespace.Y/classes/class.Map.md)\< `unknown` \> |

#### Returns

`void`

#### Defined In

[packages/store/src/schema/schema.ts:154](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/schema.ts#L154)

***

### upgradePage

> **upgradePage**(
  `oldPageVersion`,
  `oldBlockVersions`,
  `pageData`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `oldPageVersion` | `number` |
| `oldBlockVersions` | `Record`\< `string`, `number` \> |
| `pageData` | [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md) |

#### Returns

`void`

#### Defined In

[packages/store/src/schema/schema.ts:124](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/schema.ts#L124)

***

### upgradeWorkspace

> **upgradeWorkspace**(`rootData`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `rootData` | [`Doc`](../namespaces/namespace.Y/classes/class.Doc.md) |

#### Returns

`void`

#### Defined In

[packages/store/src/schema/schema.ts:110](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/schema.ts#L110)

***

### validate

> **validate**(
  `flavour`,
  `parentFlavour`?,
  `childFlavours`?): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `flavour` | `string` |
| `parentFlavour`? | `string` |
| `childFlavours`? | `string`[] |

#### Returns

`void`

#### Defined In

[packages/store/src/schema/schema.ts:46](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/schema.ts#L46)

***

### validateSchema

> **validateSchema**(`child`, `parent`): `void`

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `child` | `object` |
| `child.model` | `{ flavour: string; role: "root" | "hub" | "content"; parent?: string[] | undefined; children?: string[] | undefined; props?: ((args_0: InternalPrimitives, ...args_1: unknown[]) => Record<...>) | undefined; toModel?: ((...args: unknown[]) => BaseBlockModel<...>) | undefined; }` |
| `child.onUpgrade`? | `function` |
| `child.transformer`? | `function` |
| `child.version` | `number` |
| `parent` | `object` |
| `parent.model` | `{ flavour: string; role: "root" | "hub" | "content"; parent?: string[] | undefined; children?: string[] | undefined; props?: ((args_0: InternalPrimitives, ...args_1: unknown[]) => Record<...>) | undefined; toModel?: ((...args: unknown[]) => BaseBlockModel<...>) | undefined; }` |
| `parent.onUpgrade`? | `function` |
| `parent.transformer`? | `function` |
| `parent.version` | `number` |

#### Returns

`void`

#### Defined In

[packages/store/src/schema/schema.ts:97](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/schema.ts#L97)

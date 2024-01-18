[API](../../../index.md) > [@blocksuite/block-std](../index.md) > CommandManager

# Class: CommandManager

## Constructors

### constructor

> **new CommandManager**(`std`): [`CommandManager`](class.CommandManager.md)

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `std` | [`BlockStdProvider`](class.BlockStdProvider.md) |

#### Returns

[`CommandManager`](class.CommandManager.md)

#### Defined In

[block-std/src/command/index.ts:72](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/command/index.ts#L72)

## Properties

### \_commands

> `private` **\_commands**: `Map`\< `string`, [`Command`](../type-aliases/type-alias.Command.md)\< `never`, `never`, \{} \> \>

#### Defined In

[block-std/src/command/index.ts:70](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/command/index.ts#L70)

***

### std

> **std**: [`BlockStdProvider`](class.BlockStdProvider.md)

#### Defined In

[block-std/src/command/index.ts:72](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/command/index.ts#L72)

## Methods

### \_getCommandCtx

> `private` **\_getCommandCtx**(): [`InitCommandCtx`](../interfaces/interface.InitCommandCtx.md)

#### Returns

[`InitCommandCtx`](../interfaces/interface.InitCommandCtx.md)

#### Defined In

[block-std/src/command/index.ts:74](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/command/index.ts#L74)

***

### add

> **add**<`N`>(`name`, `command`): [`CommandManager`](class.CommandManager.md)

#### Type parameters

| Parameter |
| :------ |
| `N` *extends* `never` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `N` |
| `command` | `Commands`[`N`] |

#### Returns

[`CommandManager`](class.CommandManager.md)

#### Defined In

[block-std/src/command/index.ts:80](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/command/index.ts#L80)

***

### createChain

> **createChain**(`methods`, `_cmds`): `Chain`\< \{} \>

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `methods` | `Record`\< `never`, `unknown` \> |
| `_cmds` | [`Command`](../type-aliases/type-alias.Command.md)\< `never`, `never`, \{} \>[] |

#### Returns

`Chain`\< \{} \>

#### Defined In

[block-std/src/command/index.ts:89](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/command/index.ts#L89)

***

### pipe

> **pipe**(): `Chain`\< [`InitCommandCtx`](../interfaces/interface.InitCommandCtx.md) \>

#### Returns

`Chain`\< [`InitCommandCtx`](../interfaces/interface.InitCommandCtx.md) \>

#### Defined In

[block-std/src/command/index.ts:204](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/command/index.ts#L204)

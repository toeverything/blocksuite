[API](../../../index.md) > [@blocksuite/block-std](../index.md) > BlockSpec

# Interface: BlockSpec`<WidgetNames>`

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `WidgetNames` *extends* `string` | `string` |

## Properties

### schema

> **schema**: `object`

#### Type declaration

> ##### `schema.model`
>
> > **model**: `object`
>
> ###### Type declaration
>
> > ###### `model.children`
> >
> > > `optional` **children**: `string`[]
> >
> > ###### `model.flavour`
> >
> > > **flavour**: `string`
> >
> > ###### `model.parent`
> >
> > > `optional` **parent**: `string`[]
> >
> > ###### `model.props`
> >
> > > `optional` **props**: `function`
> >
> > ###### Parameters
> >
> >
> > | Parameter | Type |
> > | :------ | :------ |
> > | `args_0` | [`InternalPrimitives`](../../store/interfaces/interface.InternalPrimitives.md) |
> > | ...`args_1` | `unknown`[] |
> >
> >
> > ###### Returns
> >
> > `Record`\< `string`, `any` \>
> >
> >
> >
> > ###### `model.role`
> >
> > > **role**: `"root"` \| `"hub"` \| `"content"`
> >
> > ###### `model.toModel`
> >
> > > `optional` **toModel**: `function`
> >
> > ###### Parameters
> >
> >
> > | Parameter | Type |
> > | :------ | :------ |
> > | ...`args` | `unknown`[] |
> >
> >
> > ###### Returns
> >
> > [`BaseBlockModel`](../../store/classes/class.BaseBlockModel.md)\< `object` \>
> >
> >
> >
> >
>
> ##### `schema.onUpgrade`
>
> > `optional` **onUpgrade**: `function`
>
> ###### Parameters
>
>
> | Parameter | Type |
> | :------ | :------ |
> | `args_0` | `any` |
> | `args_1` | `number` |
> | `args_2` | `number` |
> | ...`args_3` | `unknown`[] |
>
>
> ###### Returns
>
> `void`
>
>
>
> ##### `schema.transformer`
>
> > `optional` **transformer**: `function`
>
> ###### Parameters
>
>
> | Parameter | Type |
> | :------ | :------ |
> | ...`args` | `unknown`[] |
>
>
> ###### Returns
>
> [`BaseBlockTransformer`](../../store/classes/class.BaseBlockTransformer.md)\< `object` \>
>
>
>
> ##### `schema.version`
>
> > **version**: `number`
>
>

#### Defined In

[block-std/src/spec/type.ts:11](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/spec/type.ts#L11)

***

### service

> `optional` **service**: [`BlockServiceConstructor`](../type-aliases/type-alias.BlockServiceConstructor.md)

#### Defined In

[block-std/src/spec/type.ts:12](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/spec/type.ts#L12)

***

### view

> **view**: [`BlockView`](interface.BlockView.md)\< `WidgetNames` \>

#### Defined In

[block-std/src/spec/type.ts:13](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/block-std/src/spec/type.ts#L13)

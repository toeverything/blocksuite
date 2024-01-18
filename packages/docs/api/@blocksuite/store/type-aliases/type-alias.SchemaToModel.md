[API](../../../index.md) > [@blocksuite/store](../index.md) > SchemaToModel

# Type alias: SchemaToModel`<Schema>`

> **SchemaToModel**: <`Schema`> [`BaseBlockModel`](../classes/class.BaseBlockModel.md)\< [`PropsFromGetter`](type-alias.PropsFromGetter.md)\< `Schema`[`"model"`][`"props"`] \> \> & `ReturnType`\< `Schema`[`"model"`][`"props"`] \> & \{`flavour`: `Schema`[`"model"`][`"flavour"`];}

> ## `SchemaToModel.flavour`
>
> > **flavour**: `Schema`[`"model"`][`"flavour"`]
>
>

## Type parameters

| Parameter |
| :------ |
| `Schema` *extends* \{`model`: \{`flavour`: `string`; `props`: [`PropsGetter`](type-alias.PropsGetter.md)\< `object` \>;};} |

## Defined In

[packages/store/src/schema/base.ts:64](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/schema/base.ts#L64)

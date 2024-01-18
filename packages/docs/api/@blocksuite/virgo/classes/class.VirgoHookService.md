[API](../../../index.md) > [@blocksuite/virgo](../index.md) > VirgoHookService

# Class: VirgoHookService`<TextAttributes>`

## Constructors

### constructor

> **new VirgoHookService**<`TextAttributes`>(`editor`, `hooks` = `{}`): [`VirgoHookService`](class.VirgoHookService.md)\< `TextAttributes` \>

#### Type parameters

| Parameter |
| :------ |
| `TextAttributes` *extends* \{`bold`: `null` \| `true`; `code`: `null` \| `true`; `italic`: `null` \| `true`; `link`: `null` \| `string`; `strike`: `null` \| `true`; `underline`: `null` \| `true`;} |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `editor` | [`VEditor`](class.VEditor.md)\< `TextAttributes` \> |
| `hooks` | `object` |
| `hooks.beforeinput`? | `function` |
| `hooks.compositionEnd`? | `function` |

#### Returns

[`VirgoHookService`](class.VirgoHookService.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/services/hook.ts:29](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/hook.ts#L29)

## Properties

### editor

> `readonly` **editor**: [`VEditor`](class.VEditor.md)\< `TextAttributes` \>

#### Defined In

[packages/virgo/src/services/hook.ts:30](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/hook.ts#L30)

***

### hooks

> `readonly` **hooks**: `object` = `{}`

#### Type declaration

> ##### `hooks.beforeinput`
>
> > `optional` **beforeinput**: `function`
>
> ###### Parameters
>
>
> | Parameter | Type |
> | :------ | :------ |
> | `props` | [`VBeforeinputHookCtx`](../interfaces/interface.VBeforeinputHookCtx.md)\< `TextAttributes` \> |
>
>
> ###### Returns
>
> `null` \| [`VBeforeinputHookCtx`](../interfaces/interface.VBeforeinputHookCtx.md)\< `TextAttributes` \>
>
>
>
> ##### `hooks.compositionEnd`
>
> > `optional` **compositionEnd**: `function`
>
> ###### Parameters
>
>
> | Parameter | Type |
> | :------ | :------ |
> | `props` | [`VCompositionEndHookCtx`](../interfaces/interface.VCompositionEndHookCtx.md)\< `TextAttributes` \> |
>
>
> ###### Returns
>
> `null` \| [`VCompositionEndHookCtx`](../interfaces/interface.VCompositionEndHookCtx.md)\< `TextAttributes` \>
>
>
>
>

#### Defined In

[packages/virgo/src/services/hook.ts:31](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/virgo/src/services/hook.ts#L31)

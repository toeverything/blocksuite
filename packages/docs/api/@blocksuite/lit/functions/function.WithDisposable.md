[API](../../../index.md) > [@blocksuite/lit](../index.md) > WithDisposable

# Function: WithDisposable

> **WithDisposable**<`T`>(`SuperClass`): `T` & `Constructor`\< [`DisposableClass`](../classes/class.DisposableClass.md) \>

Mixin that adds a `_disposables: DisposableGroup` property to the class.

The `_disposables` property is initialized in `connectedCallback` and disposed in `disconnectedCallback`.

see https://lit.dev/docs/composition/mixins/

## Type parameters

| Parameter |
| :------ |
| `T` *extends* `Constructor`\< `LitElement` \> |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `SuperClass` | `T` |

## Returns

`T` & `Constructor`\< [`DisposableClass`](../classes/class.DisposableClass.md) \>

## Example

```ts
class MyElement extends WithDisposable(ShadowlessElement) {
  onClick() {
    this._disposables.add(...);
  }
}
```

## Defined In

[packages/lit/src/with-disposable.ts:30](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/lit/src/with-disposable.ts#L30)

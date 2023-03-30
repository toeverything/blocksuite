import { DisposableGroup } from '@blocksuite/global/utils';
import {
  CSSResult,
  type CSSResultGroup,
  type CSSResultOrNative,
  LitElement,
} from 'lit';

export class DisposableLitElement extends LitElement {
  protected _disposables = new DisposableGroup();

  connectedCallback(): void {
    super.connectedCallback();
    if (this._disposables.disposed) {
      this._disposables = new DisposableGroup();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._disposables.dispose();
  }
}

// see https://lit.dev/docs/composition/mixins/#mixins-in-typescript
declare class DisposableMixinInterface {
  protected _disposables: DisposableGroup;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Mixin that adds a `_disposables: DisposableGroup` property to the class.
 *
 * The `_disposables` property is initialized in `connectedCallback` and disposed in `disconnectedCallback`.
 *
 * see https://lit.dev/docs/composition/mixins/
 *
 * @example
 * ```ts
 * class MyElement extends DisposableMixin(NonShadowLitElement) {
 *   onClick() {
 *     this.disposableGroup.add(...);
 *   }
 * }
 * ```
 */
export const DisposableMixin = <T extends Constructor<LitElement>>(
  superClass: T
) => {
  class DisposableMixinClass extends superClass {
    protected _disposables = new DisposableGroup();

    connectedCallback(): void {
      super.connectedCallback();
      if (this._disposables.disposed) {
        this._disposables = new DisposableGroup();
      }
    }

    disconnectedCallback(): void {
      super.disconnectedCallback();
      this._disposables.dispose();
    }
  }
  return DisposableMixinClass as unknown as T &
    Constructor<DisposableMixinInterface>;
};

export class NonShadowLitElement extends LitElement {
  static disableShadowRoot = true;

  protected static finalizeStyles(
    styles?: CSSResultGroup
  ): CSSResultOrNative[] {
    let elementStyles = super.finalizeStyles(styles);
    const styleRoot = document.head;
    if (this.disableShadowRoot) {
      // WARNING: This break component encapsulation and applies styles to the document.
      // These styles should be manually scoped.
      elementStyles.forEach((s: CSSResultOrNative) => {
        if (s instanceof CSSResult) {
          const style = document.createElement('style');
          style.textContent = s.cssText;
          styleRoot.appendChild(style);
        } else {
          console.error('unreachable');
        }
      });
      elementStyles = [];
    }
    return elementStyles;
  }

  createRenderRoot() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.constructor as any).disableShadowRoot
      ? this
      : super.createRenderRoot();
  }
}

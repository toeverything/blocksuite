import {
  CSSResult,
  type CSSResultGroup,
  type CSSResultOrNative,
  LitElement,
} from 'lit';

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

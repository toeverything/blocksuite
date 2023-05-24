import type { CSSResultGroup, CSSResultOrNative } from 'lit';
import { CSSResult, LitElement } from 'lit';

export class ShadowlessElement extends LitElement {
  static disableShadowRoot = true;

  protected static override finalizeStyles(
    styles?: CSSResultGroup
  ): CSSResultOrNative[] {
    let elementStyles = super.finalizeStyles(styles);
    const styleRoot = document.head;
    if (this.disableShadowRoot) {
      // XXX: This breaks component encapsulation and applies styles to the document.
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

  override createRenderRoot() {
    return (this.constructor as typeof ShadowlessElement).disableShadowRoot
      ? this
      : super.createRenderRoot();
  }
}

import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

// FIXME: horizontal
export class MenuDivider extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
    }

    .divider {
      background-color: var(--affine-border-color);
    }

    .divider.vertical {
      width: 1px;
      height: 100%;
      margin: 0 var(--divider-margin);
    }

    .divider.horizontal {
      width: 100%;
      height: 1px;
      margin: var(--divider-margin) 0;
    }
  `;

  override render() {
    const dividerStyles = styleMap({
      '--divider-margin': `${this.dividerMargin}px`,
    });
    return html`<div
      class="divider ${this.vertical ? 'vertical' : 'horizontal'}"
      style=${dividerStyles}
    ></div>`;
  }

  @property({ attribute: false })
  accessor dividerMargin = 7;

  @property({ attribute: false })
  accessor vertical = false;
}

declare global {
  interface HTMLElementTagNameMap {
    'menu-divider': MenuDivider;
  }
}

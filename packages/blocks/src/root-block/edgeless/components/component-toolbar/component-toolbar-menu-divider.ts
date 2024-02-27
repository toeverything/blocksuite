import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('component-toolbar-menu-divider')
export class ComponentToolbarMenuDivider extends LitElement {
  static override styles = css`
    .divider-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .divider {
      background-color: var(--affine-border-color);
    }

    .vertical {
      width: 4px;
      height: 100%;
    }

    .vertical .divider {
      width: 1px;
      height: 100%;
    }

    .horizontal {
      width: 100%;
      height: 4px;
    }

    .horizontal .divider {
      width: 100%;
      height: 1px;
    }
  `;

  @property({ type: Boolean })
  vertical = true;

  override render() {
    return html`<div
      class="divider-container ${this.vertical ? 'vertical' : 'horizontal'}"
    >
      <div class="divider"></div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'component-toolbar-menu-divider': ComponentToolbarMenuDivider;
  }
}

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// FIXME: horizontal
@customElement('component-toolbar-menu-divider')
export class ComponentToolbarMenuDivider extends LitElement {
  static override styles = css`
    .divider-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 4px;
      height: 24px;
    }

    .divider {
      width: 1px;
      height: 100%;
      background-color: var(--affine-border-color);
    }
  `;

  @property({ attribute: false })
  vertical = false;

  override render() {
    return html` <div class="divider-container">
      <div class="divider"></div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'component-toolbar-menu-divider': ComponentToolbarMenuDivider;
  }
}

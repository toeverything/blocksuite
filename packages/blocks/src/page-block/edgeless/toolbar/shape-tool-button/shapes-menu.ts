import '../tool-icon-button.js';

import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { ShapeComponentConfig } from './shapes-menu-config.js';

@customElement('edgeless-shapes-menu')
export class EdgelessShapesMenu extends LitElement {
  static styles = css`
    .shape-menu-container {
      display: flex;
      align-items: center;
      width: 240px;
      height: 48px;
      background: var(--affine-page-background);
      box-shadow: 0 0 12px rgba(66, 65, 73, 0.14);
      border-radius: 8px;
      fill: none;
      stroke: var(--affine-line-number-color);
    }
  `;

  render() {
    return html`
      <div class="shape-menu-container">
        ${ShapeComponentConfig.map(({ name, icon, tooltip, disabled }) => {
          return html`
            <edgeless-tool-icon-button
              .disabled=${disabled}
              .tooltips=${tooltip}
              @tool.click=${() => console.log('click', name)}
            >
              ${icon}
            </edgeless-tool-icon-button>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shapes-menu': EdgelessShapesMenu;
  }
}

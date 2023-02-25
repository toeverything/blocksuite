import '../tool-icon-button.js';

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { MouseMode } from '../../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { ShapeComponentConfig } from './shape-menu-config.js';

@customElement('edgeless-shape-menu')
export class EdgelessShapeMenu extends LitElement {
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
      stroke: currentColor;
    }
  `;

  @property()
  mouseMode!: MouseMode;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  render() {
    const shapeType =
      this.mouseMode.type === 'shape' ? this.mouseMode.shape : null;

    return html`
      <div class="shape-menu-container">
        ${ShapeComponentConfig.map(({ name, icon, tooltips, disabled }) => {
          return html`
            <edgeless-tool-icon-button
              .disabled=${disabled}
              .tooltips=${tooltips}
              .active=${shapeType === name}
              @tool.click=${() => {
                if (disabled) {
                  return;
                }
                this.edgeless.signals.mouseModeUpdated.emit({
                  type: 'shape',
                  shape: name,
                  color: '#000000',
                });
              }}
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
    'edgeless-shape-menu': EdgelessShapeMenu;
  }
}

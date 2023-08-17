import '../buttons/tool-icon-button.js';

import { Slot } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { ShapeTool } from '../../../../__internal__/index.js';
import { ShapeComponentConfig } from '../toolbar/shape/shape-menu-config.js';

@customElement('edgeless-shape-panel')
export class EdgelessShapePanel extends LitElement {
  static override styles = css`
    .shape-panel-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 40px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      padding: 0 8px;
      gap: 8px;
      z-index: 2;
    }

    .shape-panel-container svg {
      fill: var(--affine-icon-color);
      stroke: none;
    }
  `;

  @property({ attribute: false })
  selectedShape?: ShapeTool['shape'] | null;

  slots = {
    select: new Slot<ShapeTool['shape']>(),
  };

  private _onSelect(value: ShapeTool['shape']) {
    this.selectedShape = value;
    this.slots.select.emit(value);
  }

  override disconnectedCallback(): void {
    this.slots.select.dispose();
    super.disconnectedCallback();
  }

  override render() {
    return html`
      <div class="shape-panel-container">
        ${ShapeComponentConfig.map(({ name, icon, tooltip, disabled }) => {
          return html`
            <edgeless-tool-icon-button
              .disabled=${disabled}
              .tooltip=${tooltip}
              .active=${this.selectedShape === name}
              .activeMode=${'background'}
              .iconContainerPadding=${2}
              @click=${() => {
                if (disabled) return;
                this._onSelect(name);
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
    'edgeless-shape-panel': EdgelessShapePanel;
  }
}

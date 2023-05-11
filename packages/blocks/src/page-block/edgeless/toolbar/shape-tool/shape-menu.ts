import '../../components/tool-icon-button.js';

import { Slot } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { ShapeMouseMode } from '../../../../__internal__/index.js';
import { ShapeComponentConfig } from './shape-menu-config.js';

@customElement('edgeless-shape-menu')
export class EdgelessShapeMenu extends LitElement {
  static override styles = css`
    :host {
      display: block;
      z-index: 2;
    }
    .shape-menu-container {
      display: flex;
      align-items: center;
      width: 240px;
      height: 48px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      fill: none;
      stroke: currentColor;
    }
  `;

  @property()
  selectedShape?: ShapeMouseMode['shape'] | null;

  slots = {
    select: new Slot<ShapeMouseMode['shape']>(),
  };

  private _onSelect(value: ShapeMouseMode['shape']) {
    this.selectedShape = value;
    this.slots.select.emit(value);
  }

  override disconnectedCallback(): void {
    this.slots.select.dispose();
    super.disconnectedCallback();
  }

  override render() {
    return html`
      <div class="shape-menu-container">
        ${ShapeComponentConfig.map(({ name, icon, tooltip, disabled }) => {
          return html`
            <edgeless-tool-icon-button
              .disabled=${disabled}
              .tooltip=${tooltip}
              .active=${this.selectedShape === name}
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
    'edgeless-shape-menu': EdgelessShapeMenu;
  }
}

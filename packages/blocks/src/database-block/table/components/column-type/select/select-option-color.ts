import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { selectOptionColors } from '../../../../utils.js';

@customElement('affine-database-select-option-color')
export class SelectOptionColor extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
    }
    .affine-database-select-option-color {
      width: 200px;
      padding: 8px;
      border: 1px solid var(--affine-divider-color);
      box-shadow: var(--affine-menu-shadow);
      border-radius: 8px;
      background: var(--affine-white);
    }

    .option-color-header {
      height: 30px;
      color: var(--affine-text-secondary-color);
    }

    .action-divider {
      height: 0.5px;
      background: var(--affine-divider-color);
      margin: 8px 0;
    }

    .action-color-content {
      padding-right: 8px;
    }
    .option-color {
      display: flex;
      align-items: center;
      height: 32px;
      border-radius: 5px;
    }
    .option-color:hover {
      background: var(--affine-hover-color);
    }
    .option-color-circle {
      width: 20px;
      height: 20px;
      margin-left: 8px;
      margin-right: 12px;
      border-radius: 50%;
    }
    .option-color-text {
      color: var(--affine-text-color);
      font-size: 16px;
    }
  `;

  @property()
  onChange!: (color: string) => void;

  protected override render() {
    return html`<div class="affine-database-select-option-color">
      <div class="option-color-header">Colors</div>
      <div class="action-divider"></div>
      <div class="action-color-content">
        ${selectOptionColors.map(item => {
          const styles = styleMap({
            backgroundColor: item.color,
          });
          return html`<div
            class="option-color"
            @click=${() => this.onChange(item.color)}
          >
            <div class="option-color-circle" style=${styles}></div>
            <div class="option-color-text">${item.name}</div>
          </div>`;
        })}
      </div>
    </div>`;
  }
}

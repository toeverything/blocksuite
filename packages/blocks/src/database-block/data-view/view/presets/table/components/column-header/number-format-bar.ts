import { WithDisposable } from '@blocksuite/block-std';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { DataViewColumnManager } from '../../../../data-view-manager.js';

import { formatNumber } from '../../../../../column/presets/number/utils/formatter.js';
import {
  DecreaseDecimalPlacesIcon,
  IncreaseDecimalPlacesIcon,
} from '../../../../../common/icons/index.js';

@customElement('affine-database-number-format-bar')
export class DatabaseNumberFormatBar extends WithDisposable(LitElement) {
  private _decrementDecimalPlaces = () => {
    this.column.updateData(data => ({
      decimal: Math.max(((data.decimal as number) ?? 0) - 1, 0),
    }));
    this.requestUpdate();
  };

  private _incrementDecimalPlaces = () => {
    this.column.updateData(data => ({
      decimal: Math.min(((data.decimal as number) ?? 0) + 1, 8),
    }));
    this.requestUpdate();
  };

  static override styles = css`
    .number-format-toolbar-container {
      padding: 4px 12px;
      display: flex;
      gap: 7px;
      flex-direction: column;
    }

    .number-format-decimal-places {
      display: flex;
      gap: 4px;
      align-items: center;
      justify-content: flex-start;
    }

    .number-format-toolbar-button {
      box-sizing: border-box;
      background-color: transparent;
      border: none;
      border-radius: 4px;
      color: var(--affine-icon-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      position: relative;

      user-select: none;
    }

    .number-format-toolbar-button svg {
      width: 16px;
      height: 16px;
    }

    .number-formatting-sample {
      font-size: var(--affine-font-xs);
      color: var(--affine-icon-color);
      margin-left: auto;
    }
    .number-format-toolbar-button:hover {
      background-color: var(--affine-hover-color);
    }
    .divider {
      width: 100%;
      height: 1px;
      background-color: var(--affine-border-color);
    }
  `;

  override render() {
    return html`
      <div class="number-format-toolbar-container">
        <div class="number-format-decimal-places">
          <button
            class="number-format-toolbar-button"
            aria-label="decrease decimal places"
            @click=${this._decrementDecimalPlaces}
          >
            ${DecreaseDecimalPlacesIcon}
          </button>

          <button
            class="number-format-toolbar-button"
            aria-label="increase decimal places"
            @click=${this._incrementDecimalPlaces}
          >
            ${IncreaseDecimalPlacesIcon}
          </button>
          <span class="number-formatting-sample">
            &lpar;&nbsp;${formatNumber(
              1,
              'number',
              (this.column.data.decimal as number) ?? 0
            )}&nbsp;&rpar;
          </span>
        </div>
        <div class="divider"></div>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor column!: DataViewColumnManager;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-number-format-bar': DatabaseNumberFormatBar;
  }
}

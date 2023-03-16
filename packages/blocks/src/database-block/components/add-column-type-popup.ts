import type { ColumnSchema } from '@blocksuite/global/database';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { listColumnSchemaRenderer } from '../register.js';
import { onClickOutside } from '../utils.js';

export const DATABASE_ADD_COLUMN_TYPE_POPUP =
  'affine-database-add-column-type-popup' as const;
@customElement(DATABASE_ADD_COLUMN_TYPE_POPUP)
export class DatabaseAddColumnTypePopup extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      right: 0;
      top: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      border-left: 1px solid rgb(233, 233, 231);
      background-color: var(--affine-page-background);
    }

    :host > * {
      padding-left: 14px;
    }

    .affine-database-add-column-type-popup-subtitle {
      color: rgba(55, 53, 47, 0.65);
      padding-top: 14px;
      padding-bottom: 14px;
      font-size: 12px;
      font-weight: 500;
      line-height: 120%;
      user-select: none;
    }

    .affine-database-add-column-type-popup-title {
      padding-top: 12px;
      font-size: 14px;
      font-weight: 600;
    }

    .affine-database-add-column-type-popup-list {
      font-size: 14px;
    }

    .affine-database-add-column-type-popup-list > div {
      min-height: 28px;
    }
  `;

  @property()
  show = false;

  @property()
  onSelectType!: (type: ColumnSchema['type']) => void;

  private _handleSelectType = (e: MouseEvent) => {
    if (e.target instanceof HTMLElement) {
      const type = e.target.getAttribute('data-type');
      this.onSelectType(type as ColumnSchema['type']);
      this.show = false;
    }
  };

  private _handleClose = () => {
    this.show = false;
  };

  private _cleanup: () => void = () => void 0;
  protected update(changedProperties: Map<string, unknown>) {
    super.update(changedProperties);
    if (changedProperties.has('show')) {
      if (this.show) {
        this.style.minWidth = `290px`;
        this.style.maxWidth = `290px`;
        setTimeout(() => {
          this._cleanup = onClickOutside(
            this,
            () => {
              this._handleClose();
            },
            'mousedown'
          );
        });
      } else {
        this.style.minWidth = '0';
        this.style.maxWidth = `0`;
        this._cleanup();
      }
    }
  }

  protected render() {
    if (!this.show) {
      return null;
    }
    return html`
      <div class="affine-database-add-column-type-popup-title">
        New column
        <button @click=${this._handleClose}>X</button>
      </div>
      <div class="affine-database-add-column-type-popup-subtitle">Type</div>
      <div class="affine-database-add-column-type-popup-list">
        ${repeat(
          listColumnSchemaRenderer(),
          renderer => renderer.type,
          renderer =>
            html`
              <div
                data-type="${renderer.type}"
                @click=${this._handleSelectType}
              >
                ${renderer.displayName}
              </div>
            `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [DATABASE_ADD_COLUMN_TYPE_POPUP]: DatabaseAddColumnTypePopup;
  }
}

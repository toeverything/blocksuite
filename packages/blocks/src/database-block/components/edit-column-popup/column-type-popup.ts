import {
  DatabaseDone,
  DatabaseMultiSelect,
  DatabaseNumber,
  DatabaseProgress,
  DatabaseSelect,
  TextIcon,
} from '@blocksuite/global/config';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { ColumnHeader, ColumnType } from '../../types.js';
import { actionStyles } from './styles.js';

const columnTypes: ColumnHeader[] = [
  {
    type: 'rich-text',
    text: 'Text',
    icon: TextIcon,
  },
  {
    type: 'select',
    text: 'Select',
    icon: DatabaseSelect,
  },
  {
    type: 'multi-select',
    text: 'Multi-select',
    icon: DatabaseMultiSelect,
  },
  {
    type: 'number',
    text: 'Number',
    icon: DatabaseNumber,
  },
  {
    type: 'checkbox',
    text: 'Checkbox',
    icon: DatabaseNumber,
  },
  {
    type: 'progress',
    text: 'Progress',
    icon: DatabaseProgress,
  },
];

const styles = css`
  :host {
    z-index: 1;
    width: 200px;
    padding: 8px;
    border: 1px solid var(--affine-border-color);
    border-radius: 4px;
    background: var(--affine-background-primary-color);
    box-shadow: var(--affine-menu-shadow);
  }
  ${actionStyles}
  .action > svg {
    width: 16px;
    height: 16px;
  }

  .rich-text {
    fill: var(--affine-icon-color);
  }
  .column-type {
    padding: 0;
    color: var(--affine-text-secondary-color);
    font-size: 14px;
    cursor: unset;
  }
  .column-type:hover {
    background: none;
  }
  .selected {
    color: var(--affine-text-emphasis-color);
    background: rgba(0, 0, 0, 0.02);
  }
  .selected svg {
    color: var(--affine-text-emphasis-color);
  }
  .selected.rich-text svg {
    fill: var(--affine-text-emphasis-color);
  }
  .action.disabled {
    cursor: not-allowed;
  }
  .action.disabled:hover {
    background: unset;
  }
`;

@customElement('affine-database-column-type-popup')
export class ColumnTypePopup extends LitElement {
  static override styles = styles;

  @property()
  columnType: ColumnType | undefined;

  @property()
  columnId!: string;

  @property()
  changeColumnType!: (columnId: string, type: ColumnType) => void;

  override render() {
    return html`
      <div class="affine-database-column-type-popup">
        <div class="action column-type">
          <div class="action-content"><span>Column type</span></div>
        </div>
        <div class="action-divider"></div>
        ${columnTypes.map(column => {
          const isProgress = column.type === 'progress';
          const selected = column.type === this.columnType && !isProgress;
          const onChangeColumnType = () => {
            if (isProgress) return;
            if (!selected) {
              this.changeColumnType(this.columnId, column.type);
            }
          };

          return html`
            <div
              class="action ${column.type} ${selected
                ? 'selected'
                : ''} ${isProgress ? 'disabled' : ''}"
              @click=${onChangeColumnType}
            >
              <div class="action-content">
                ${column.icon}<span>${column.text}</span>
              </div>
              ${selected ? DatabaseDone : null}
            </div>
          `;
        })}
      </div>
    `;
  }
}

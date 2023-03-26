import {
  ArrowDownIcon,
  DatabaseDuplicate,
  DatabaseInsertLeft,
  DatabaseInsertRight,
  DatabaseMoveLeft,
  DatabaseMoveRight,
  DatabaseMultiSelect,
  DatabaseNumber,
  DatabaseProgress,
  DatabaseSelect,
  DeleteIcon,
  PenIcon,
  TextIcon,
} from '@blocksuite/global/config';
import type { ColumnSchema } from '@blocksuite/global/database';
import { createPopper } from '@popperjs/core';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { DatabaseBlockModel } from '../database-model.js';

const actionStyles = css`
  .action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 32px;
    padding: 4px 8px;
    border-radius: 5px;
    cursor: pointer;
  }
  .action:hover {
    background: rgba(0, 0, 0, 0.04);
  }
  .action-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .action-content > svg {
    width: 20px;
    height: 20px;
  }
  .action-divider {
    height: 1px;
    background: #e3e2e4;
    margin: 8px 0;
  }
`;

const columnTypes = [
  {
    text: 'Text',
    icon: TextIcon,
  },
  {
    text: 'Select',
    icon: DatabaseSelect,
  },
  {
    text: 'Multi-select',
    icon: DatabaseMultiSelect,
  },
  {
    text: 'Number',
    icon: DatabaseNumber,
  },
  {
    text: 'Progress',
    icon: DatabaseProgress,
  },
];

const columnActions = [
  {
    type: 'column-type',
    text: 'Column type',
    icon: TextIcon,
  },
  {
    type: 'duplicate',
    text: 'Duplicate column',
    icon: DatabaseDuplicate,
  },
  {
    type: 'insert-left',
    text: 'Insert left column',
    icon: DatabaseInsertLeft,
  },
  {
    type: 'insert-right',
    text: 'Insert right column',
    icon: DatabaseInsertRight,
  },
  {
    type: 'move-left',
    text: 'Move left',
    icon: DatabaseMoveLeft,
  },
  {
    type: 'move-right',
    text: 'Move Right',
    icon: DatabaseMoveRight,
  },
];

@customElement('affine-database-column-type-popup')
class ColumnTypePopup extends LitElement {
  static styles = css`
    :host {
      width: 200px;
      padding: 8px;
      border: 1px solid #e3e2e4;
      border-radius: 4px;
      background: var(--affine-popover-background);
      box-shadow: var(--affine-popover-shadow);
    }
    ${actionStyles}
    .action > svg {
      width: 16px;
      height: 16px;
    }
    .column-type {
      padding: 0;
      color: #8e8d91;
      font-size: 14px;
      cursor: unset;
    }
    .column-type:hover {
      background: none;
    }
    .selected {
      color: #5438ff;
      fill: #5438ff;
      background: rgba(0, 0, 0, 0.02);
    }
  `;

  render() {
    return html`
      <div class="affine-database-column-type-popup">
        <div class="action column-type">
          <div class="action-content"><span>Column type</span></div>
          <!-- TODO: update icon -->
        </div>
        <div class="action-divider"></div>
        ${columnTypes.map((type, index) => {
          return html`
            <div class="action ${index === 0 ? 'selected' : ''}">
              <div class="action-content">
                ${type.icon}<span>${type.text}</span>
              </div>
              ${TextIcon}
            </div>
          `;
        })}
      </div>
    `;
  }
}

@customElement('affine-database-edit-column-popup')
export class EditColumnPopup extends LitElement {
  static styles = css`
    :host {
      background: var(--affine-popover-background);
      box-shadow: var(--affine-popover-shadow);
      padding: 8px;
      border: 1px solid #e3e2e4;
      border-radius: 4px;
    }

    .affine-database-edit-column-popup {
      display: flex;
      flex-direction: column;
      color: var(--affine-text-color);
      font-family: 'Avenir Next';
    }
    .affine-database-edit-column-popup * {
      box-sizing: border-box;
    }
    .rename,
    .delete,
    .text {
      fill: #77757d;
    }
    .text > svg {
      transform: rotate(-90deg);
    }
    ${actionStyles}
  `;

  @property()
  targetModel!: DatabaseBlockModel;

  @property()
  targetColumnSchema!: ColumnSchema;

  @query('input')
  titleInput!: HTMLInputElement;

  @query('.affine-database-edit-column-popup')
  private _container!: HTMLDivElement;

  private _columnTypePopup!: ColumnTypePopup | null;

  private _onShowColumnType = () => {
    if (this._columnTypePopup) return;
    this._columnTypePopup = new ColumnTypePopup();
    this._container.appendChild(this._columnTypePopup);
    createPopper(this._container, this._columnTypePopup, {
      placement: 'right-start',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [-9, 12],
          },
        },
      ],
    });
  };

  private _onHideColumnType = () => {
    if (this._columnTypePopup) {
      this._columnTypePopup?.remove();
      this._columnTypePopup = null;
    }
  };

  protected render() {
    return html`
      <div class="affine-database-edit-column-popup">
        <div class="action rename">
          <div class="action-content">${PenIcon}<span>Rename</span></div>
        </div>
        <div class="action-divider"></div>
        ${columnActions.map(action => {
          if (action.type === 'column-type') {
            return html`
              <div class="action text" @mouseover=${this._onShowColumnType}>
                <div class="action-content">
                  ${TextIcon}<span>Column type</span>
                </div>
                ${ArrowDownIcon}
              </div>
            `;
          }

          return html`
            <div class="action" @mouseover=${this._onHideColumnType}>
              <div class="action-content">
                ${action.icon}<span>${action.text}</span>
              </div>
            </div>
          `;
        })}

        <div class="action-divider"></div>
        <div class="action delete">
          <div class="action-content">
            ${DeleteIcon}<span>Delete column</span>
          </div>
        </div>
        <!-- TODO: refactor rename logic -->
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-edit-column-popup': EditColumnPopup;
  }
}

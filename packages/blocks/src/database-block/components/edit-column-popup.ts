import {
  ArrowDownIcon,
  DatabaseDone,
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
import {
  type Column,
  ColumnInsertPosition,
  type ColumnType,
} from '@blocksuite/global/database';
import { assertExists } from '@blocksuite/global/utils';
import { createPopper } from '@popperjs/core';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { DatabaseBlockModel } from '../database-model.js';
import { getColumnRenderer } from '../register.js';
import type {
  ColumnAction,
  ColumnActionType,
  ColumnHeader,
  TitleColumnAction,
} from '../types.js';
import { isDivider } from '../utils.js';

export const actionStyles = css`
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
    background: var(--affine-hover-background);
  }
  .action-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .action-content > svg {
    width: 20px;
    height: 20px;
    fill: var(--affine-icon-color);
  }
  .action-divider {
    height: 0.5px;
    background: var(--affine-divider-color);
    margin: 8px 0;
  }
`;

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
    type: 'progress',
    text: 'Progress',
    icon: DatabaseProgress,
  },
];

const columnActions: ColumnAction[] = [
  {
    type: 'rename',
    text: 'Rename',
    icon: PenIcon,
  },
  {
    type: 'divider',
  },
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
  {
    type: 'divider',
  },
  {
    type: 'delete',
    text: 'Delete column',
    icon: DeleteIcon,
  },
];

const titleColumnActions: TitleColumnAction[] = [
  {
    type: 'rename',
    text: 'Rename',
    icon: PenIcon,
  },
  {
    type: 'insert-right',
    text: 'Insert right column',
    icon: DatabaseInsertRight,
  },
];

function isTitleColumn(column: Column | string): column is string {
  return typeof column === 'string';
}

@customElement('affine-database-column-type-popup')
class ColumnTypePopup extends LitElement {
  static override styles = css`
    :host {
      width: 200px;
      padding: 8px;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      background: var(--affine-popover-background);
      box-shadow: var(--affine-popover-shadow);
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

@customElement('affine-database-edit-column-popup')
export class EditColumnPopup extends LitElement {
  static override styles = css`
    :host {
      background: var(--affine-popover-background);
      box-shadow: var(--affine-popover-shadow);
      padding: 8px;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      z-index: 1;
    }

    .affine-database-edit-column-popup {
      display: flex;
      flex-direction: column;
      color: var(--affine-text-color);
    }
    .affine-database-edit-column-popup * {
      box-sizing: border-box;
    }
    .rename,
    .delete,
    .column-type {
      fill: var(--affine-icon-color);
    }
    .column-type > svg {
      transform: rotate(-90deg);
    }
    ${actionStyles}
  `;

  @property()
  targetModel!: DatabaseBlockModel;

  @property()
  targetColumn!: Column | string;

  /** base on database column index */
  @property()
  columnIndex!: number;

  @property()
  closePopup!: () => void;

  @property()
  setTitleColumnEditId!: (columnId: string) => void;

  @property()
  insertColumn!: (position: ColumnInsertPosition) => void;

  @query('input')
  titleInput!: HTMLInputElement;

  @query('.affine-database-edit-column-popup')
  private _container!: HTMLDivElement;
  private _columnTypePopup!: ColumnTypePopup | null;

  private _onShowColumnType = (columnId: string) => {
    if (this._columnTypePopup) return;
    this._columnTypePopup = new ColumnTypePopup();
    this._columnTypePopup.changeColumnType = this._changeColumnType;
    this._columnTypePopup.columnId = columnId;

    if (!isTitleColumn(this.targetColumn)) {
      this._columnTypePopup.columnType = this.targetColumn.type;
    }
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

  private _updateColumn = (
    columnId: string,
    schemaProperties: Partial<Column>
  ) => {
    const currentSchema = this.targetModel.getColumn(columnId);
    assertExists(currentSchema);
    const schema = { ...currentSchema, ...schemaProperties };
    this.targetModel.updateColumn(schema);
  };

  private _changeColumnType = (columnId: string, targetType: ColumnType) => {
    if (isTitleColumn(this.targetColumn)) return;

    const currentType = this.targetColumn.type;
    this.targetModel.page.captureSync();

    // select -> multi-select
    if (currentType === 'select' && targetType === 'multi-select') {
      this._updateColumn(columnId, { type: targetType });
    }
    // multi-select -> select
    else if (currentType === 'multi-select' && targetType === 'select') {
      this._updateColumn(columnId, { type: targetType });
      this.targetModel.convertCellsByColumn(columnId, 'select');
    }
    // number -> rich-text
    else if (currentType === 'number' && targetType === 'rich-text') {
      this._updateColumn(columnId, { type: targetType });
      this.targetModel.convertCellsByColumn(columnId, 'rich-text');
    } else {
      // incompatible types: clear the value of the column
      const renderer = getColumnRenderer(targetType);
      this._updateColumn(columnId, {
        ...renderer.propertyCreator(),
        type: targetType,
      });
      this.targetModel.deleteCellsByColumn(columnId);
    }

    this.closePopup();
  };

  private _onActionClick = (actionType: ColumnActionType, columnId: string) => {
    if (actionType === 'rename') {
      this.setTitleColumnEditId(columnId);
      this.closePopup();
      return;
    }
    if (actionType === 'insert-right' || actionType === 'insert-left') {
      if (actionType === 'insert-right') {
        this.insertColumn(ColumnInsertPosition.Right);
      } else {
        this.insertColumn(ColumnInsertPosition.Left);
      }
      this.closePopup();
      return;
    }

    if (actionType === 'delete') {
      this.targetModel.page.captureSync();
      this.targetModel.deleteColumn(columnId);
      this.targetModel.deleteCellsByColumn(columnId);
      const columns = this.targetModel.columns.filter(id => id !== columnId);
      this.targetModel.page.updateBlock(this.targetModel, {
        columns,
      });
      this.closePopup();
      return;
    }

    if (actionType === 'move-left' || actionType === 'move-right') {
      this.targetModel.page.captureSync();
      const targetIndex =
        actionType === 'move-left'
          ? this.columnIndex - 1
          : this.columnIndex + 1;
      const columns = [...this.targetModel.columns];
      [columns[this.columnIndex], columns[targetIndex]] = [
        columns[targetIndex],
        columns[this.columnIndex],
      ];
      this.targetModel.page.updateBlock(this.targetModel, {
        columns,
      });
      this.closePopup();
      return;
    }

    if (actionType === 'duplicate') {
      this.targetModel.page.captureSync();
      const currentSchema = this.targetModel.getColumn(columnId);
      assertExists(currentSchema);
      const { id: copyId, ...nonIdProps } = currentSchema;
      const schema = { ...nonIdProps };
      const id = this.targetModel.updateColumn(schema);
      const newColumns = [...this.targetModel.columns];
      newColumns.splice(this.columnIndex + 1, 0, id);
      this.targetModel.page.updateBlock(this.targetModel, {
        columns: newColumns,
      });
      this.targetModel.copyCellsByColumn(copyId, id);
      this.closePopup();
      return;
    }
  };

  private _renderActions = () => {
    const actions = isTitleColumn(this.targetColumn)
      ? titleColumnActions
      : columnActions;

    return html`
      ${actions.map(action => {
        if (isDivider(action)) {
          return html`<div class="action-divider"></div>`;
        }

        // boundary
        if (
          (this.columnIndex === 0 && action.type === 'move-left') ||
          (this.columnIndex === this.targetModel.columns.length - 1 &&
            action.type === 'move-right')
        ) {
          return null;
        }

        const columnId = isTitleColumn(this.targetColumn)
          ? '-1'
          : this.targetColumn.id;

        const onMouseOver = isTitleColumn(this.targetColumn)
          ? undefined
          : action.type === 'column-type'
          ? () => this._onShowColumnType(columnId)
          : this._onHideColumnType;

        return html`
          <div
            class="action ${action.type}"
            @mouseover=${onMouseOver}
            @click=${() => this._onActionClick(action.type, columnId)}
          >
            <div class="action-content">
              ${action.icon}<span>${action.text}</span>
            </div>
            ${action.type === 'column-type' ? ArrowDownIcon : html``}
          </div>
        `;
      })}
    `;
  };

  protected override render() {
    return html`
      <div class="affine-database-edit-column-popup">
        ${this._renderActions()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-edit-column-popup': EditColumnPopup;
  }
}

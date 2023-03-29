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
import {
  ColumnInsertPosition,
  type ColumnSchema,
  type ColumnSchemaType,
} from '@blocksuite/global/database';
import { assertExists } from '@blocksuite/global/utils';
import { createPopper } from '@popperjs/core';
import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { DatabaseBlockModel } from '../database-model.js';
import { getColumnSchemaRenderer } from '../register.js';

type ColumnType = {
  type: ColumnSchemaType;
  text: string;
  icon: TemplateResult;
};

type NormalAction = {
  type: string;
  text: string;
  icon: TemplateResult;
};
type Divider = {
  type: 'divider';
};
export type ColumnAction = NormalAction | Divider;

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
    color: #77757d;
  }
  .action-divider {
    height: 0.5px;
    background: #e3e2e4;
    margin: 8px 0;
  }
`;

const columnTypes: ColumnType[] = [
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

const titleColumnActions: ColumnAction[] = [
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

export const isDivider = (action: ColumnAction): action is Divider => {
  return action.type === 'divider';
};

const isTitleColumn = (
  columnSchema: ColumnSchema | string
): columnSchema is string => {
  return typeof columnSchema === 'string';
};

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
      fill: #77757d;
    }
    /* TODO: svg color */
    .rich-text {
      fill: #77757d;
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
      background: rgba(0, 0, 0, 0.02);
    }
    .selected svg {
      color: #5438ff;
    }
    .selected.rich-text svg {
      fill: #5438ff;
    }
    .action.disabled {
      cursor: not-allowed;
    }
    .action.disabled:hover {
      background: unset;
    }
  `;

  @property()
  columnType: ColumnSchemaType | undefined;

  @property()
  titleId!: string;

  @property()
  changeColumnType!: (titleId: string, type: ColumnSchemaType) => void;

  render() {
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
              this.changeColumnType(this.titleId, column.type);
            }
          };

          const className = classMap({
            action: true,
            [column.type]: true,
            selected: selected,
            disabled: isProgress,
          });

          return html`
            <div class=${className} @click=${onChangeColumnType}>
              <div class="action-content">
                ${column.icon}<span>${column.text}</span>
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
    .column-type {
      fill: #77757d;
    }
    .column-type > svg {
      transform: rotate(-90deg);
    }
    ${actionStyles}
  `;

  @property()
  targetModel!: DatabaseBlockModel;

  @property()
  targetColumnSchema!: ColumnSchema | string;

  /** base on database column index */
  @property()
  columnIndex!: number;

  @property()
  closePopup!: () => void;

  @property()
  setTitleColumnEditId!: (titleId: string) => void;

  @property()
  insertColumn!: (position: ColumnInsertPosition) => void;

  @query('input')
  titleInput!: HTMLInputElement;

  @query('.affine-database-edit-column-popup')
  private _container!: HTMLDivElement;
  private _columnTypePopup!: ColumnTypePopup | null;

  private _onShowColumnType = (titleId: string) => {
    if (this._columnTypePopup) return;
    this._columnTypePopup = new ColumnTypePopup();
    this._columnTypePopup.changeColumnType = this._changeColumnType;
    this._columnTypePopup.titleId = titleId;
    if (!isTitleColumn(this.targetColumnSchema)) {
      this._columnTypePopup.columnType = this.targetColumnSchema.type;
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

  private _updateColumnSchema = (
    titleId: string,
    schemaProperties: Partial<ColumnSchema>
  ) => {
    const currentSchema = this.targetModel.page.getColumnSchema(titleId);
    assertExists(currentSchema);
    const schema = { ...currentSchema, ...schemaProperties };
    this.targetModel.page.setColumnSchema(schema);
  };

  private _changeColumnType = (
    titleId: string,
    targetType: ColumnSchemaType
  ) => {
    if (isTitleColumn(this.targetColumnSchema)) return;

    const currentType = this.targetColumnSchema.type;
    this.targetModel.page.captureSync();
    if (currentType === 'select' && targetType === 'multi-select') {
      this._updateColumnSchema(titleId, { type: targetType });
    } else if (currentType === 'multi-select' && targetType === 'select') {
      this._updateColumnSchema(titleId, { type: targetType });
      this.targetModel.page.updateBlockColumnsToSelect(titleId);
    } else if (currentType === 'number' && targetType === 'rich-text') {
      this._updateColumnSchema(titleId, { type: targetType });
      this.targetModel.page.updateBlockColumnsToRichText(titleId);
    } else {
      // incompatible types: clear the value of the column
      const renderer = getColumnSchemaRenderer(targetType);
      this._updateColumnSchema(titleId, {
        type: targetType,
        property: renderer.propertyCreator(),
      });
      this.targetModel.page.deleteBlockColumns(titleId);
    }

    this.closePopup();
  };

  private _onActionClick = (action: NormalAction, titleId: string) => {
    if (action.type === 'rename') {
      this.setTitleColumnEditId(titleId);
      this.closePopup();
      return;
    }
    if (action.type === 'insert-right' || action.type === 'insert-left') {
      if (action.type === 'insert-right') {
        this.insertColumn(ColumnInsertPosition.Right);
      } else {
        this.insertColumn(ColumnInsertPosition.Left);
      }
      this.closePopup();
      return;
    }

    if (action.type === 'delete') {
      this.targetModel.page.captureSync();
      this.targetModel.page.deleteColumnSchema(titleId);
      const columns = this.targetModel.columns.filter(id => id !== titleId);
      this.targetModel.page.updateBlock(this.targetModel, {
        columns,
      });
      this.closePopup();
      return;
    }

    if (action.type === 'move-left' || action.type === 'move-right') {
      this.targetModel.page.captureSync();
      const targetIndex =
        action.type === 'move-left'
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

    if (action.type === 'duplicate') {
      this.targetModel.page.captureSync();
      const currentSchema = this.targetModel.page.getColumnSchema(titleId);
      assertExists(currentSchema);
      const { id: copyId, ...nonIdProps } = currentSchema;
      const schema = { ...nonIdProps };
      const id = this.targetModel.page.setColumnSchema(schema);
      const newColumns = [...this.targetModel.columns];
      newColumns.splice(this.columnIndex + 1, 0, id);
      this.targetModel.page.updateBlock(this.targetModel, {
        columns: newColumns,
      });
      this.targetModel.page.copyBlockColumnById(copyId, id);
      this.closePopup();
      return;
    }
  };

  private _renderActions = () => {
    const actions = isTitleColumn(this.targetColumnSchema)
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

        const titleId = isTitleColumn(this.targetColumnSchema)
          ? '-1'
          : this.targetColumnSchema.id;

        const onMouseOver = isTitleColumn(this.targetColumnSchema)
          ? undefined
          : action.type === 'column-type'
          ? () => this._onShowColumnType(titleId)
          : this._onHideColumnType;

        return html`
          <div
            class="action ${action.type}"
            @mouseover=${onMouseOver}
            @click=${() => this._onActionClick(action, titleId)}
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

  protected render() {
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

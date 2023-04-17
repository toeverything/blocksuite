import {
  ArrowDownIcon,
  DatabaseDuplicate,
  DatabaseInsertLeft,
  DatabaseInsertRight,
  DatabaseMoveLeft,
  DatabaseMoveRight,
  DeleteIcon,
  PenIcon,
  TextIcon,
} from '@blocksuite/global/config';
import type { ColumnInsertPosition } from '@blocksuite/global/database';
import { type Column, type ColumnType } from '@blocksuite/global/database';
import { createPopper } from '@popperjs/core';
import { html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { DatabaseBlockModel } from '../../database-model.js';
import type {
  ColumnAction,
  ColumnActionType,
  TitleColumnAction,
} from '../../types.js';
import { isDivider } from '../../utils.js';
import { ColumnTypePopup } from './column-type-popup.js';
import { styles } from './styles.js';
import { changeColumnType, isTitleColumn, onActionClick } from './utils.js';

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

@customElement('affine-database-edit-column-popup')
export class EditColumnPopup extends LitElement {
  static override styles = styles;

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

  private _changeColumnType = (columnId: string, targetType: ColumnType) => {
    changeColumnType(columnId, targetType, this.targetColumn, this.targetModel);
    this.closePopup();
  };

  private _onActionClick = (actionType: ColumnActionType, columnId: string) => {
    onActionClick(
      actionType,
      columnId,
      this.targetModel,
      this.columnIndex,
      this.setTitleColumnEditId,
      this.insertColumn
    );
    this.closePopup();
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

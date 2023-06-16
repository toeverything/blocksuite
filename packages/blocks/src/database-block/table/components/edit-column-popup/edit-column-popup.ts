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
import { computePosition, offset } from '@floating-ui/dom';
import type { TemplateResult } from 'lit';
import { html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type {
  TableMixColumn,
  TableViewData,
} from '../../../common/view-manager.js';
import type { DatabaseBlockModel } from '../../../database-model.js';
import type { ColumnType } from '../../types.js';
import { ColumnTypePopup } from './column-type-popup.js';
import { styles } from './styles.js';

type MenuCommon = {
  hide?: () => boolean;
};
type Menu = MenuCommon &
  (
    | {
        type: 'action';
        text: string;
        icon: TemplateResult;
        select: () => void;
      }
    | {
        type: 'divider';
      }
    | {
        type: 'group';
        text: string;
        icon: TemplateResult;
        children: () => Menu[];
      }
  );

@customElement('affine-database-edit-column-popup')
export class EditColumnPopup extends LitElement {
  static override styles = styles;
  @property()
  view!: TableViewData;
  @property()
  column!: TableMixColumn;
  @property()
  targetModel!: DatabaseBlockModel;

  /** base on database column index */
  @property()
  index!: number;
  @property()
  isFirst!: boolean;
  @property()
  isLast!: boolean;

  @property()
  closePopup!: () => void;

  @property()
  setTitleColumnEditId!: (columnId: string) => void;

  @property()
  insertColumn!: (position: 'left' | 'right') => void;

  @query('input')
  titleInput!: HTMLInputElement;

  @query('.affine-database-edit-column-popup')
  private _container!: HTMLDivElement;
  private _columnTypePopup!: ColumnTypePopup | null;

  private _options(): Menu[] {
    return [
      {
        type: 'action',
        text: 'Rename',
        icon: PenIcon,
        select: () => {
          this.setTitleColumnEditId(this.column.id);
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'group',
        text: 'Column type',
        icon: TextIcon,
        hide: () => !this.column.updateType,
        children: () => {
          return [];
        },
      },
      {
        type: 'action',
        text: 'Duplicate column',
        icon: DatabaseDuplicate,
        hide: () => !this.column.duplicate,
        select: () => {
          this.column.duplicate?.();
        },
      },
      {
        type: 'action',
        text: 'Insert left column',
        icon: DatabaseInsertLeft,
        select: () => {
          this.view.newColumn(this.view.preColumn(this.column.id)?.id);
        },
      },
      {
        type: 'action',
        text: 'Insert right column',
        icon: DatabaseInsertRight,
        select: () => {
          this.view.newColumn(this.column.id);
        },
      },
      {
        type: 'action',
        text: 'Move left',
        icon: DatabaseMoveLeft,
        hide: () => this.isFirst,
        select: () => {
          const preId = this.view.preColumn(this.column.id)?.id;
          const prepreId = preId ? this.view.preColumn(preId)?.id : undefined;
          this.view.moveColumn(this.column.id, prepreId);
        },
      },
      {
        type: 'action',
        text: 'Move Right',
        icon: DatabaseMoveRight,
        hide: () => this.isLast,
        select: () => {
          this.view.moveColumn(
            this.column.id,
            this.view.nextColumn(this.column.id)?.id
          );
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'action',
        text: 'Delete column',
        icon: DeleteIcon,
        hide: () => !this.column.delete,
        select: () => {
          this.column.delete?.();
        },
      },
    ];
  }

  private _onShowColumnType = () => {
    if (this._columnTypePopup) return;
    const columnTypePopup = new ColumnTypePopup();

    columnTypePopup.select = this._changeColumnType;
    columnTypePopup.columnType = this.column.type;
    this._columnTypePopup = columnTypePopup;
    this._container.appendChild(columnTypePopup);

    computePosition(this._container, columnTypePopup, {
      placement: 'right-start',
      middleware: [
        offset({
          mainAxis: 9,
          crossAxis: -9,
        }),
      ],
    }).then(({ x, y }) => {
      Object.assign(columnTypePopup.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  };

  private _onHideColumnType = () => {
    if (this._columnTypePopup) {
      this._columnTypePopup?.remove();
      this._columnTypePopup = null;
    }
  };

  private _changeColumnType = (targetType: ColumnType) => {
    this.column.updateType?.(targetType);
    this.closePopup();
  };

  private _renderActions = () => {
    return html`
      ${this._options().map(action => {
        if (action.hide?.()) {
          return null;
        }
        if (action.type === 'divider') {
          return html` <div class="action-divider"></div>`;
        }

        const onMouseOver =
          action.type === 'group'
            ? this._onShowColumnType
            : this._onHideColumnType;

        return html`
          <div
            class="action ${action.type}"
            @mouseover="${onMouseOver}"
            @click="${() => {
              if (action.type === 'action') {
                action.select();
                this.closePopup();
              }
            }}"
          >
            <div class="action-content">
              ${action.icon}<span>${action.text}</span>
            </div>
            ${action.type === 'group' ? ArrowDownIcon : html``}
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

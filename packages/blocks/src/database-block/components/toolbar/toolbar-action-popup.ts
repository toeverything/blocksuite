import {
  ArrowDownIcon,
  CopyIcon,
  DatabaseKanbanViewIcon,
  DatabaseTableViewIcon,
  DeleteIcon,
} from '@blocksuite/global/config';
import { createPopper } from '@popperjs/core';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { copy } from '../../../__internal__/clipboard/utils.js';
import { toast } from '../../../components/toast.js';
import type { DatabaseBlockModel } from '../../database-model.js';
import type {
  SwitchViewAction,
  SwitchViewActionType,
  ToolbarAction,
  ToolbarActionType,
} from '../../types.js';
import { isDivider } from '../../utils.js';
import { actionStyles } from '../edit-column-popup.js';

const toolbarActions: ToolbarAction[] = [
  {
    type: 'database-type',
    text: 'Database type',
    icon: DatabaseTableViewIcon,
  },
  {
    type: 'copy',
    text: 'Copy',
    icon: CopyIcon,
  },
  {
    type: 'divider',
  },
  {
    type: 'delete-database',
    text: 'Delete database',
    icon: DeleteIcon,
  },
];

const databaseTypes: SwitchViewAction[] = [
  {
    type: 'table-view',
    text: 'Table view',
    icon: DatabaseTableViewIcon,
  },
  {
    type: 'kanban-view',
    text: 'Kanban view',
    icon: DatabaseKanbanViewIcon,
  },
];

@customElement('affine-database-type-popup')
class DatabaseTypePopup extends LitElement {
  static styles = css`
    :host {
      width: 200px;
      padding: 8px;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      background: var(--affine-popover-background);
      box-shadow: var(--affine-popover-shadow);
    }
    :host * {
      box-sizing: border-box;
    }
    ${actionStyles}
    .action > svg {
      width: 16px;
      height: 16px;
      fill: var(--affine-icon-color);
    }
    .database-type {
      height: 30px;
      padding: 0;
      color: var(--affine-text-secondary-color);
      font-size: 14px;
      cursor: unset;
    }
    .database-type:hover {
      background: none;
    }
    .selected {
      color: var(--affine-text-emphasis-color);
      background: rgba(0, 0, 0, 0.02);
    }
    .selected svg {
      color: var(--affine-text-emphasis-color);
    }
    .selected.table-view svg {
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
  dbType!: SwitchViewActionType;

  render() {
    return html`
      <div class="affine-database-type-popup">
        <div class="action database-type">
          <div class="action-content"><span>Database type</span></div>
        </div>
        <div class="action-divider"></div>
        ${databaseTypes.map(column => {
          const isKanban = column.type === 'kanban-view';
          const selected = column.type === this.dbType && !isKanban;

          return html`
            <div
              class="action ${column.type} ${selected
                ? 'selected'
                : ''} ${isKanban ? 'disabled' : ''}"
            >
              <div class="action-content">
                ${column.icon}<span>${column.text}</span>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}

@customElement('affine-database-toolbar-action-popup')
export class ToolbarActionPopup extends LitElement {
  static styles = css`
    :host {
      width: 200px;
      height: 128px;
      padding: 8px;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      box-shadow: 0px 0px 12px rgba(66, 65, 73, 0.14),
        inset 0px 0px 0px 0.5px var(--affine-white);
      z-index: var(--affine-z-index-popover);
      background: var(--affine-page-background);
    }
    :host * {
      box-sizing: border-box;
    }
    ${actionStyles}
    .action-content > svg {
      width: 20px;
      height: 20px;
      fill: var(--affine-icon-color);
    }
    .action > svg {
      width: 16px;
      height: 16px;
      fill: var(--affine-icon-color);
    }
    .database-type > svg {
      transform: rotate(-90deg);
    }
  `;

  targetModel!: DatabaseBlockModel;

  @property()
  close!: () => void;

  @query('.affine-database-toolbar-action-popup')
  private _container!: HTMLDivElement;

  private _databaseTypePopup!: DatabaseTypePopup | null;

  private _onActionClick = (
    event: MouseEvent,
    actionType: ToolbarActionType
  ) => {
    event.stopPropagation();

    if (actionType === 'delete-database') {
      const models = [this.targetModel, ...this.targetModel.children];
      models.forEach(model => this.targetModel.page.deleteBlock(model));
    } else if (actionType === 'copy') {
      copy({
        type: 'Block',
        models: [this.targetModel],
        startOffset: 0,
        endOffset: 0,
      });
      toast('Copied Database to clipboard');
    }

    this.close();
  };

  private _onShowDatabaseType = () => {
    if (this._databaseTypePopup) return;
    this._databaseTypePopup = new DatabaseTypePopup();
    this._databaseTypePopup.dbType = 'table-view';
    this._container.appendChild(this._databaseTypePopup);
    createPopper(this._container, this._databaseTypePopup, {
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

  private _onHideDatabaseType = () => {
    if (this._databaseTypePopup) {
      this._databaseTypePopup?.remove();
      this._databaseTypePopup = null;
    }
  };

  private _renderActions = () => {
    return html`
      ${toolbarActions.map(action => {
        if (isDivider(action)) {
          return html`<div class="action-divider"></div>`;
        }

        const onMouseOver =
          action.type === 'database-type'
            ? this._onShowDatabaseType
            : this._onHideDatabaseType;

        return html`
          <div
            class="action ${action.type}"
            @mouseover=${onMouseOver}
            @click=${(event: MouseEvent) =>
              this._onActionClick(event, action.type)}
          >
            <div class="action-content">
              ${action.icon}<span>${action.text}</span>
            </div>
            ${action.type === 'database-type' ? ArrowDownIcon : html``}
          </div>
        `;
      })}
    `;
  };

  render() {
    return html`<div class="affine-database-toolbar-action-popup">
      ${this._renderActions()}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-toolbar-action-popup': ToolbarActionPopup;
  }
}

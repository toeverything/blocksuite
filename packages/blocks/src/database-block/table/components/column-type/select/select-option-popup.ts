import {
  ArrowDownIcon,
  DatabaseSelectionColor,
  DeleteIcon,
  PenIcon,
} from '@blocksuite/global/config';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { isDivider } from '../../../../utils.js';
import type { SelectTagAction, SelectTagActionType } from '../../../types.js';
import { actionStyles } from '../../edit-column-popup/styles.js';

const tagActions: SelectTagAction[] = [
  {
    type: 'rename',
    text: 'Rename',
    icon: PenIcon,
  },
  {
    type: 'change-color',
    text: 'Change Color',
    icon: DatabaseSelectionColor,
  },
  {
    type: 'divider',
  },
  {
    type: 'delete',
    text: 'Delete',
    icon: DeleteIcon,
  },
];

@customElement('affine-database-select-action-popup')
export class SelectActionPopup extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      z-index: 11;
    }
    .affine-database-select-action {
      width: 200px;
      padding: 8px;
      border: 1px solid var(--affine-border-color);
      border-radius: 8px;
      background: var(--affine-white);
      box-shadow: var(--affine-menu-shadow);
    }
    ${actionStyles}
    .action {
      color: var(--affine-text-primary-color);
    }
    .action svg {
      width: 20px;
      height: 20px;
    }
    .rename,
    .delete {
      fill: var(--affine-icon-color);
    }

    .extra-icon {
      display: flex;
      align-items: center;
    }
    .extra-icon svg {
      fill: var(--affine-icon-color);
      transform: rotate(-90deg);
    }
  `;

  @property()
  index!: number;

  @property()
  onAction!: (type: SelectTagActionType, index: number) => void;

  private _onAction = (e: Event, type: SelectTagActionType) => {
    e.stopPropagation();
    this.onAction(type, this.index);
  };

  override render() {
    return html`
      <div class="affine-database-select-action">
        <div class="action-container">
          ${tagActions.map(action => {
            if (isDivider(action))
              return html`<div class="action-divider"></div>`;

            return html`
              <div
                class="action ${action.type}"
                @mousedown=${(e: Event) => this._onAction(e, action.type)}
              >
                <div class="action-content">
                  ${action.icon}<span>${action.text}</span>
                </div>
                ${action.type === 'change-color'
                  ? html`<div class="extra-icon">${ArrowDownIcon}</div>`
                  : null}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}

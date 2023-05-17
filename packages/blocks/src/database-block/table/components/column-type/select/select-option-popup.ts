import { DeleteIcon, PenIcon } from '@blocksuite/global/config';
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
      z-index: 11;
    }

    .affine-database-select-action {
      width: 200px;
      padding: 8px;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
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
  `;

  @property()
  index!: number;

  @property()
  tagId!: string;

  @property()
  onAction!: (type: SelectTagActionType, id: string) => void;

  @property()
  onClose!: () => void;

  private _onAction = (e: Event, type: SelectTagActionType) => {
    e.stopPropagation();
    this.onAction(type, this.tagId);
    this.onClose();
  };

  override render() {
    return html`
      <div class="affine-database-select-action">
        ${tagActions.map(action => {
          if (isDivider(action))
            return html` <div class="action-divider"></div>`;

          return html`
            <div
              class="action ${action.type}"
              @mousedown="${(e: Event) => this._onAction(e, action.type)}"
            >
              <div class="action-content">
                ${action.icon}<span>${action.text}</span>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}

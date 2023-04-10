import { DeleteIcon, PenIcon } from '@blocksuite/global/config';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { SelectTagAction, SelectTagActionType } from '../../../types.js';
import { isDivider } from '../../../utils.js';
import { actionStyles } from '../../edit-column-popup.js';

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
  static styles = css`
    :host {
      z-index: 11;
    }
    .affine-database-select-action {
      width: 200px;
      padding: 8px;
      border: 1px solid #e3e2e4;
      border-radius: 4px;
      background: #fff;
      box-shadow: 0px 0px 12px rgba(66, 65, 73, 0.14),
        inset 0px 0px 0px 0.5px #e3e3e4;
    }
    ${actionStyles}
    .action {
      color: #424149;
    }
    .action svg {
      width: 20px;
      height: 20px;
    }
    .rename,
    .delete {
      fill: #77757d;
    }
  `;

  @property()
  index!: number;

  @property()
  onAction!: (type: SelectTagActionType, index: number) => void;

  render() {
    return html`
      <div class="affine-database-select-action">
        ${tagActions.map(action => {
          if (isDivider(action))
            return html`<div class="action-divider"></div>`;

          return html`
            <div
              class="action ${action.type}"
              @mousedown=${() => this.onAction(action.type, this.index)}
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

import {
  CopyIcon,
  DeleteIcon,
  MoreHorizontalIcon,
} from '@blocksuite/global/config';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { popFilterableSimpleMenu } from '../../../../components/menu/menu.js';
import type { DataViewTableManager } from '../../../table/table-view-manager.js';

const styles = css`
  .affine-database-toolbar-item.more-action {
    width: 32px;
    height: 32px;
    border-radius: 4px;
  }

  .more-action.active {
    background: var(--affine-hover-color);
  }
`;

@customElement('data-view-header-tools-view-options')
export class DataViewHeaderToolsViewOptions extends WithDisposable(
  ShadowlessElement
) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewTableManager;

  @query('.more-action')
  private _moreActionContainer!: HTMLDivElement;

  showToolBar(show: boolean) {
    const tools = this.closest('data-view-header-tools');
    if (tools) {
      tools.showToolBar = show;
    }
  }

  private _clickMoreAction = () => {
    this.showToolBar(true);
    popFilterableSimpleMenu(
      this._moreActionContainer,
      [
        {
          type: 'action',
          name: 'Copy',
          icon: CopyIcon,
          select: () => {
            //
          },
        },
        {
          type: 'action',
          name: 'Delete database',
          icon: DeleteIcon,
          select: () => {
            //
          },
          class: 'delete-item',
        },
      ],
      () => {
        this.showToolBar(false);
      }
    );
  };

  override render() {
    return html` <div
      class="affine-database-toolbar-item more-action"
      @click="${this._clickMoreAction}"
    >
      ${MoreHorizontalIcon}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-view-options': DataViewHeaderToolsViewOptions;
  }
}

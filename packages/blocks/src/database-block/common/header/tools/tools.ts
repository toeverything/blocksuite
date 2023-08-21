import './search.js';
import './filter.js';
import './view-options.js';
import './add-row.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import type { TableViewSelection } from '../../../../index.js';
import type { DataViewTableManager } from '../../../table/table-view-manager.js';
import type { BaseDataView } from '../../base-data-view.js';
import { viewRendererManager } from '../../data-view.js';

const styles = css`
  .affine-database-toolbar {
    display: none;
    align-items: center;
    gap: 6px;
  }

  .toolbar-hover-container:hover .affine-database-toolbar {
    display: flex;
  }

  .show-toolbar {
    display: flex;
  }

  @media print {
    .affine-database-toolbar {
      display: none;
    }
  }
`;

@customElement('data-view-header-tools')
export class DataViewHeaderTools extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  viewEle!: BaseDataView;

  @property({ attribute: false })
  copyBlock!: () => void;

  @property({ attribute: false })
  deleteSelf!: () => void;

  @property({ attribute: false })
  getSelection!: () => TableViewSelection | undefined;

  @property({ attribute: false })
  view!: DataViewTableManager;

  @state()
  public showToolBar = false;

  override render() {
    if (this.view.isDeleted) {
      return;
    }
    const classList = classMap({
      'show-toolbar': this.showToolBar,
      'affine-database-toolbar': true,
    });
    const tools = viewRendererManager.getView(this.view.type).tools;
    return html` <div class="${classList}">
      ${repeat(tools ?? [], uni => {
        const props = {
          view: this.view,
          viewMethod: this.viewEle,
          getSelection: this.getSelection,
        };
        return html` <uni-lit .uni="${uni}" .props=${props}></uni-lit>`;
      })}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools': DataViewHeaderTools;
  }
}

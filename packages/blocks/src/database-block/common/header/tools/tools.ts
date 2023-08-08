import './search.js';
import './filter.js';
import './view-options.js';
import './add-row.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import type { DataViewTableManager } from '../../../table/table-view-manager.js';
import type { BaseDataView } from '../../base-data-view.js';
import { viewRendererManager } from '../../data-view.js';

const styles = css`
  .affine-database-toolbar {
    display: none;
    align-items: center;
    gap: 26px;
  }

  .toolbar-hover-container:hover .affine-database-toolbar {
    display: flex;
  }

  .affine-database-toolbar-search svg,
  .affine-database-toolbar svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
  }

  .affine-database-toolbar-item {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .search-container.hidden {
    overflow: hidden;
  }

  .affine-database-toolbar-item.more-action {
    width: 32px;
    height: 32px;
    border-radius: 4px;
  }

  .affine-database-toolbar-item.more-action:hover,
  .more-action.active {
    background: var(--affine-hover-color);
  }

  .affine-database-toolbar-item.new-record {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 120px;
    height: 32px;
    padding: 6px 8px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05),
      0px 0px 0px 0.5px var(--affine-black-10);
    background: linear-gradient(
        0deg,
        var(--affine-hover-color),
        var(--affine-hover-color)
      ),
      var(--affine-white);
  }

  .new-record > tool-tip {
    max-width: 280px;
  }

  .edgeless .new-record > tool-tip {
    display: none;
  }

  .show-toolbar {
    display: flex;
  }

  @media print {
    affine-database-toolbar {
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
  view!: DataViewTableManager;

  @state()
  public showToolBar = false;

  override render() {
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

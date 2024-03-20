import './search.js';
import './filter.js';
import './view-options.js';
import './add-row/add-row.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import { renderUniLit } from '../../../../_common/components/uni-component/uni-component.js';
import { type DataViewExpose, viewRendererManager } from '../../data-view.js';
import type { DataViewManager } from '../../data-view-manager.js';

const styles = css`
  .affine-database-toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    visibility: hidden;
    opacity: 0;
    transition: opacity 150ms cubic-bezier(0.42, 0, 1, 1);
  }

  .toolbar-hover-container:hover .affine-database-toolbar {
    visibility: visible;
    opacity: 1;
  }

  .show-toolbar {
    visibility: visible;
    opacity: 1;
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
  viewMethod!: DataViewExpose;

  @property({ attribute: false })
  view!: DataViewManager;

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
          viewMethod: this.viewMethod,
        };
        return renderUniLit(uni, props);
      })}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools': DataViewHeaderTools;
  }
}
export const renderTools = (
  view: DataViewManager,
  viewMethod: DataViewExpose
) => {
  return html` <data-view-header-tools
    .viewMethod="${viewMethod}"
    .view="${view}"
  ></data-view-header-tools>`;
};

import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import type { DataViewExpose } from '../../view/data-view.js';
import type { SingleView } from '../../view-manager/single-view.js';
import type { ViewManager } from '../../view-manager/view-manager.js';
import type { DataViewWidget, DataViewWidgetProps } from '../types.js';

import { renderUniLit } from '../../utils/uni-component/index.js';
import { WidgetBase } from '../widget-base.js';
import './presets/filter/filter.js';
import './presets/search/search.js';
import './presets/table-add-row/add-row.js';
import './presets/view-options/view-options.js';

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
export class DataViewHeaderTools extends WidgetBase {
  static override styles = styles;

  override render() {
    const classList = classMap({
      'show-toolbar': this.showToolBar,
      'affine-database-toolbar': true,
    });
    const tools = this.toolsMap[this.view.type];
    return html` <div class="${classList}">
      ${repeat(tools ?? [], uni => {
        const props: DataViewWidgetProps = {
          view: this.view,
          viewMethods: this.viewMethods,
        };
        return renderUniLit(uni, props);
      })}
    </div>`;
  }

  @state()
  accessor showToolBar = false;

  @property({ attribute: false })
  accessor toolsMap!: Record<string, DataViewWidget[]>;
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools': DataViewHeaderTools;
  }
}
export const renderTools = (
  view: SingleView,
  viewMethods: DataViewExpose,
  viewSource: ViewManager
) => {
  return html` <data-view-header-tools
    .viewMethods="${viewMethods}"
    .view="${view}"
    .viewSource="${viewSource}"
  ></data-view-header-tools>`;
};

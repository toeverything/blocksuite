import {
  DatabaseKanbanViewIcon,
  DatabaseSearchClose,
  DatabaseTableViewIcon,
} from '@blocksuite/global/config';
import { WidgetElement } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';
import { html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { columnManager } from '../../database-block/common/columns/manager.js';
import { multiSelectPureColumnConfig } from '../../database-block/common/columns/multi-select/define.js';
import type { DatabaseBlockModel } from '../../database-block/database-model.js';
import { styles } from './styles.js';

type DatabaseViewName = 'table' | 'kanban';

interface DatabaseView {
  type: DatabaseViewName;
  text: string;
  icon: TemplateResult;
  description?: string;
  isComingSoon?: boolean;
}

const databaseViews: DatabaseView[] = [
  {
    type: 'table',
    text: 'Table view',
    icon: DatabaseTableViewIcon,
  },
  {
    type: 'kanban',
    text: 'Kanban view',
    icon: DatabaseKanbanViewIcon,
    description: 'Coming soon',
    isComingSoon: true,
  },
];

export const AFFINE_DATABASE_CONVERT_WIDGET_TAG =
  'affine-database-convert-widget';

export const DATABASE_CONVERT_WHITE_LIST = ['affine:list', 'affine:paragraph'];

@customElement(AFFINE_DATABASE_CONVERT_WIDGET_TAG)
export class AffineDatabaseConvertWidget extends WidgetElement {
  static override styles = styles;

  @property({ attribute: false })
  selectedView: DatabaseViewName = 'table';

  @property({ attribute: false })
  selectedBlocks: BaseBlockModel[] = [];

  private _convertToDatabase(viewType: DatabaseViewName) {
    //TODO: kanban view
    if (viewType !== 'table' || this.selectedBlocks.length === 0) return;

    this.page.captureSync();

    const parentModel = this.page.getParent(this.selectedBlocks[0]);
    assertExists(parentModel);

    const id = this.page.addBlock(
      'affine:database',
      {
        columns: [],
        titleColumnName: 'Title',
      },
      parentModel,
      parentModel.children.indexOf(this.selectedBlocks[0])
    );

    const databaseModel = this.page.getBlockById(id) as DatabaseBlockModel;
    assertExists(databaseModel);

    // default column
    databaseModel.addColumn(
      'end',
      columnManager
        .getColumn(multiSelectPureColumnConfig.type)
        .create('Tag', { options: [] })
    );
    databaseModel.applyColumnUpdate();

    this.page.moveBlocks(this.selectedBlocks, databaseModel);

    this.remove();
  }

  override render() {
    return html`<div class=${AFFINE_DATABASE_CONVERT_WIDGET_TAG}>
      <div class="overlay-mask"></div>
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-header-title">Select Database View</div>
          <div class="modal-header-close-icon">${DatabaseSearchClose}</div>
        </div>
        <div class="modal-body">
          <div class="modal-desc">
            Group as Database can quickly convert selected blocks into Database
            for easy structuring of data.
          </div>
          <div class="modal-view-container">
            ${databaseViews.map(view => {
              const isSelected = view.type === this.selectedView;
              return html`
                <div
                  class="modal-view-item ${view.type} ${view.isComingSoon
                    ? 'coming-soon'
                    : ''}"
                  @click=${() => this._convertToDatabase(view.type)}
                >
                  <div
                    class="modal-view-item-content ${isSelected
                      ? 'selected'
                      : ''}"
                  >
                    <div class="modal-view-item-icon">${view.icon}</div>
                    <div class="modal-view-item-text">${view.text}</div>
                  </div>
                  <div class="modal-view-item-description">
                    ${view.description}
                  </div>
                </div>
              `;
            })}
          </div>
        </div>
        <div class="modal-footer">More views are on the way.</div>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_DATABASE_CONVERT_WIDGET_TAG]: AffineDatabaseConvertWidget;
  }
}

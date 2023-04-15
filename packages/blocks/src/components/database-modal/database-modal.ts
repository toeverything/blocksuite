import {
  DatabaseKanbanViewIcon,
  DatabaseSearchClose,
  DatabaseTableViewIcon,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  getCurrentBlockRange,
  getDefaultPage,
} from '../../__internal__/index.js';
import type { DatabaseBlockModel } from '../../database-block/index.js';
import { styles } from './styles.js';

type DatabaseViewName = 'table' | 'kanban';

type DatabaseView = {
  type: DatabaseViewName;
  text: string;
  icon: TemplateResult;
  description?: string;
  isComingSoon?: boolean;
};

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

@customElement('affine-database-modal')
export class DatabaseModal extends LitElement {
  static override styles = styles;

  @property()
  page!: Page;

  @state()
  private _selectedView: DatabaseViewName = 'table';

  @property()
  abortController!: AbortController;

  private _convertToDatabase(viewType: DatabaseViewName) {
    if (viewType !== 'table') return;
    this._hide();
    this.page.captureSync();

    const range = getCurrentBlockRange(this.page);
    assertExists(range);
    const models = range.models;

    const parentModel = this.page.getParent(models[0]);
    assertExists(parentModel);

    const id = this.page.addBlock(
      'affine:database',
      {
        columns: [],
        titleColumnName: 'Title',
      },
      parentModel,
      parentModel.children.indexOf(models[0])
    );

    const databaseModel = this.page.getBlockById(id) as DatabaseBlockModel;
    assertExists(databaseModel);

    // default column
    databaseModel.updateColumn({
      name: 'Tag',
      type: 'multi-select',
      width: 200,
      hide: false,
      selection: [],
    });
    databaseModel.applyColumnUpdate();

    this.page.moveBlocks(models, databaseModel);

    // Try clean block selection
    const defaultPageBlock = getDefaultPage(this.page);
    assertExists(defaultPageBlock);
    if (!defaultPageBlock.selection) {
      // In the edgeless mode
      return;
    }
    defaultPageBlock.selection.clear();
  }

  private _hide() {
    this.abortController.abort();
  }

  override render() {
    return html`<div class="overlay-root">
      <div class="overlay-mask" @click=${this._hide}></div>
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-header-title">Select Database View</div>
          <div class="modal-header-close-icon" @click=${this._hide}>
            ${DatabaseSearchClose}
          </div>
        </div>
        <div class="modal-body">
          ${databaseViews.map(view => {
            const isSelected = view.type === this._selectedView;
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
        <div class="modal-footer">More views are on the way.</div>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-modal': DatabaseModal;
  }
}

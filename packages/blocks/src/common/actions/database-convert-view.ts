import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { DataViewTypes } from '../../database-block/common/data-view.js';
import type { DatabaseBlockModel } from '../../database-block/database-model.js';
import { DatabaseSearchClose } from '../../icons/database.js';
import {
  DatabaseKanbanViewIcon,
  DatabaseTableViewIcon,
} from '../../icons/text.js';
import { getSelectedContentModels } from '../../page-block/utils/selection.js';

interface DatabaseView {
  type: DataViewTypes;
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
  },
];

export const DATABASE_CONVERT_WHITE_LIST = ['affine:list', 'affine:paragraph'];

@customElement('database-convert-view')
export class DatabaseConvertView extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: var(--affine-z-index-modal);
    }
    .overlay-mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: var(--affine-z-index-modal);
    }
    .modal-container {
      position: absolute;
      z-index: var(--affine-z-index-modal);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 720px;
      padding: 24px 40px;
      border-radius: 24px;
      background: var(--affine-background-overlay-panel-color);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header-title {
      color: var(--affine-text-primary-color);
      font-size: 20px;
      font-weight: 600;
    }
    .modal-header-close-icon {
      display: flex;
      align-items: center;
      color: var(--affine-icon-color);
      cursor: pointer;
    }
    .modal-header-close-icon svg {
      width: 24px;
      height: 24px;
    }
    .modal-footer {
      color: var(--affine-text-secondary-color);
      font-size: 14px;
      text-align: center;
    }
    .modal-body {
      padding: 24px 0;
    }
    .modal-desc {
      margin-bottom: 38px;
      color: var(--affine-text-primary-color);
      font-size: 14px;
    }
    .modal-view-container {
      display: flex;
      justify-content: center;
      gap: 18px;
    }
    .modal-view-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      cursor: pointer;
    }
    .modal-view-item.coming-soon {
      cursor: not-allowed;
    }
    .modal-view-item.coming-soon .modal-view-item-content {
      pointer-events: none;
    }
    .modal-view-item-content:hover {
      background: var(--affine-hover-color);
    }
    .modal-view-item-content:hover .modal-view-item-text,
    .modal-view-item-content:hover svg {
      fill: var(--affine-primary-color);
      color: var(--affine-primary-color);
    }
    .modal-view-item-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 18px 0;
      gap: 6px;
      width: 108px;
      border: 2px solid var(--affine-border-color);
      border-radius: 8px;
    }
    .modal-view-item-icon {
      width: 42px;
      height: 42px;
    }
    .modal-view-item-icon svg {
      width: 42px;
      height: 42px;
      fill: var(--affine-black-50);
    }
    .modal-view-item-text {
      font-size: 14px;
      color: var(--affine-black-50);
    }
    .modal-view-item-description {
      font-size: 12px;
      color: var(--affine-text-secondary-color);
      text-align: center;
    }
  `;

  @property({ attribute: false })
  root!: BlockSuiteRoot;

  get page() {
    return this.root.page;
  }

  private _convertToDatabase(viewType: DataViewTypes) {
    const selectedModels = getSelectedContentModels(this.root, [
      'text',
      'block',
    ]);

    if (selectedModels.length === 0) return;

    this.page.captureSync();

    const parentModel = this.page.getParent(selectedModels[0]);
    assertExists(parentModel);

    const id = this.page.addBlock(
      'affine:database',
      {},
      parentModel,
      parentModel.children.indexOf(selectedModels[0])
    );
    const databaseModel = this.page.getBlockById(id) as DatabaseBlockModel;
    assertExists(databaseModel);
    databaseModel.initConvert(viewType);
    databaseModel.applyColumnUpdate();
    this.page.moveBlocks(selectedModels, databaseModel);

    const selectionManager = this.root.selection;
    selectionManager.clear();

    this.remove();
  }

  override render() {
    return html`<div>
      <div
        @click="${() => {
          this.remove();
        }}"
        class="overlay-mask"
      ></div>
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
              return html`
                <div
                  class="modal-view-item ${view.type}"
                  @mousedown="${(e: Event) => {
                    // prevent range reset
                    e.preventDefault();
                  }}"
                  @click="${() => {
                    this._convertToDatabase(view.type);
                  }}"
                >
                  <div class="modal-view-item-content">
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
    'database-convert-view': DatabaseConvertView;
  }
}

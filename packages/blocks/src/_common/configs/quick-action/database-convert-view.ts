import type { EditorHost } from '@blocksuite/block-std';

import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { LitElement, type TemplateResult, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { ViewMeta } from '../../../database-block/data-view/index.js';
import type { DatabaseBlockModel } from '../../../database-block/index.js';

import { DatabaseSearchClose } from '../../../database-block/data-view/common/icons/index.js';
import { viewPresets } from '../../../database-block/data-view/index.js';
import { databaseViewInitConvert } from '../../../database-block/utils.js';
import {
  DatabaseKanbanViewIcon,
  DatabaseTableViewIcon,
} from '../../icons/text.js';

interface DatabaseView {
  meta: ViewMeta;
  text: string;
  icon: TemplateResult;
  description?: string;
  isComingSoon?: boolean;
}

const databaseViews: DatabaseView[] = [
  {
    meta: viewPresets.tableViewConfig,
    text: 'Table view',
    icon: DatabaseTableViewIcon,
  },
  {
    meta: viewPresets.kanbanViewConfig,
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

  private _convertToDatabase(viewMeta: ViewMeta) {
    const [_, ctx] = this.host.std.command
      .chain()
      .getSelectedModels({
        types: ['block', 'text'],
      })
      .run();
    const { selectedModels } = ctx;
    if (!selectedModels || selectedModels.length === 0) return;

    this.doc.captureSync();

    const parentModel = this.doc.getParent(selectedModels[0]);
    assertExists(parentModel);

    const id = this.doc.addBlock(
      'affine:database',
      {},
      parentModel,
      parentModel.children.indexOf(selectedModels[0])
    );
    const databaseModel = this.doc.getBlockById(id) as DatabaseBlockModel;
    assertExists(databaseModel);
    databaseViewInitConvert(databaseModel, viewMeta);
    databaseModel.applyColumnUpdate();
    this.doc.moveBlocks(selectedModels, databaseModel);

    const selectionManager = this.host.selection;
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
                  class="modal-view-item ${view.meta.type}"
                  @mousedown="${(e: Event) => {
                    // prevent range reset
                    e.preventDefault();
                  }}"
                  @click="${() => {
                    this._convertToDatabase(view.meta);
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

  get doc() {
    return this.host.doc;
  }

  @property({ attribute: false })
  accessor host!: EditorHost;
}

declare global {
  interface HTMLElementTagNameMap {
    'database-convert-view': DatabaseConvertView;
  }
}

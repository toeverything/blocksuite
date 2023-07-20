// related component
import '../database-block/table/table-view.js';
import '../database-block/common/database-view-header.js';

import { assertExists } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { Text } from '@blocksuite/store';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html, literal, unsafeStatic } from 'lit/static-html.js';

import { copyBlocks } from '../__internal__/clipboard/index.js';
import type { DatabaseBlockDatasourceConfig } from '../__internal__/datasource/base.js';
import {
  createDatasource,
  getDatasourceTitle,
} from '../__internal__/datasource/datasource-manager.js';
import { registerService } from '../__internal__/service.js';
import type { DataViewManager } from '../database-block/common/data-view-manager.js';
import type { BlockOperation } from '../database-block/index.js';
import { DatabaseBlockSchema } from '../database-block/index.js';
import { DataViewTableManager } from '../database-block/table/table-view-manager.js';
import type { DataViewBlockModel } from './data-view-model.js';
import { DataViewBlockService } from './data-view-service.js';

@customElement('affine-data-view')
export class DataViewBlockComponent extends BlockElement<DataViewBlockModel> {
  override connectedCallback() {
    super.connectedCallback();

    registerService('affine:data-view', DataViewBlockService);
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.currentView = this.model.views[0].id;
  }

  @property({ attribute: false })
  modalMode?: boolean;

  @state()
  currentView?: string;

  _setViewId = (viewId: string) => {
    this.currentView = viewId;
  };

  private viewMap: Record<string, DataViewManager> = {};

  private getView(id: string): DataViewManager {
    if (!this.viewMap[id]) {
      const view = this.model.views.find(v => v.id === id);
      assertExists(view);
      assertExists(view.dataSource);
      this.viewMap[id] = new DataViewTableManager(
        () => {
          const view = this.model.views.find(v => v.id === id);
          if (!view || view.mode !== 'table') {
            throw new Error(`view ${id} not found`);
          }
          return view;
        },
        update => this.model.updateView(id, update as never),
        this.model.propsUpdated,
        createDatasource(this.root, view.dataSource)
      );
    }
    return this.viewMap[id];
  }

  private allDatabaseBlockDatasourceConfig = () => {
    const result: DatabaseBlockDatasourceConfig[] = [];
    this.page.workspace.pages.forEach(page => {
      const findDatabase = (model?: BaseBlockModel) => {
        if (!model) {
          return;
        }
        if (model.flavour === DatabaseBlockSchema.model.flavour) {
          result.push({
            type: 'database-block',
            pageId: page.id,
            blockId: model.id,
          });
        }
        model.children.forEach(findDatabase);
      };
      findDatabase(page.root ?? undefined);
    });
    return result;
  };
  private datasourceList = () => {
    return [
      ...this.allDatabaseBlockDatasourceConfig(),
      { type: 'all-pages' } as const,
      { type: 'tags' } as const,
    ];
  };

  override render() {
    const views = this.model.views;
    const current = views.find(v => v.id === this.currentView) ?? views[0];
    const databaseTag = literal`affine-database-${unsafeStatic(current.mode)}`;
    const view = this.root.page.awarenessStore.getFlag('enable_database_filter')
      ? html` <database-view-header
          .currentView="${current.id}"
          .setViewId="${this._setViewId}"
          .model="${this.model}"
        ></database-view-header>`
      : '';
    const blockOperation: BlockOperation = {
      copy: () => {
        copyBlocks({
          type: 'Block',
          models: [this.model],
          startOffset: 0,
          endOffset: 0,
        });
      },
      delete: () => {
        const models = [this.model, ...this.model.children];
        models.forEach(model => this.page.deleteBlock(model));
      },
    };
    if (!current.dataSource) {
      return html`
        <div class="toolbar-hover-container">
          ${view}
          <div>
            select datasource
            ${repeat(this.datasourceList(), v => {
              const title = getDatasourceTitle(this.root, v);
              const click = () => {
                this.model.updateView(current.id, () => ({ dataSource: v }));
              };
              return html` <div @click="${click}">${title}</div> `;
            })}
          </div>
        </div>
      `;
    }
    const currentViewManager = this.getView(current.id);
    /* eslint-disable lit/binding-positions, lit/no-invalid-html */
    return html`
      <div class='toolbar-hover-container data-view-root'>
        ${view}
        <${databaseTag}
          .titleText='${new Text(
            getDatasourceTitle(this.root, current.dataSource)
          )}'
          .root='${this.root}'
          .blockOperation='${blockOperation}'
          .tableViewManager='${currentViewManager}'
          .modalMode='${this.modalMode}'
          class='affine-block-element'
        ></${databaseTag}>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view': DataViewBlockComponent;
  }
}

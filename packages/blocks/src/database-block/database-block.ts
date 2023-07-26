// related component
import './table/table-view.js';
import './kanban/kanban-view.js';
import './common/database-view-header.js';

import { BlockElement } from '@blocksuite/lit';
import { customElement, property, state } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';

import { copyBlocks } from '../__internal__/clipboard/index.js';
import type { DataSource } from '../__internal__/datasource/base.js';
import { DatabaseBlockDatasource } from '../__internal__/datasource/database-block-datasource.js';
import { registerService } from '../__internal__/service.js';
import type { DataViewManager } from './common/data-view-manager.js';
import type { ViewSource } from './common/view-source.js';
import type { DatabaseBlockModel } from './database-model.js';
import { LegacyDatabaseBlockService } from './database-service.js';
import { DataViewKanbanManager } from './kanban/kanban-view-manager.js';
import { DataViewTableManager } from './table/table-view-manager.js';
import type { BlockOperation } from './types.js';

@customElement('affine-database')
export class DatabaseBlockComponent extends BlockElement<DatabaseBlockModel> {
  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:database', LegacyDatabaseBlockService);
    this.currentView = this.model.getViewList()[0].id;
  }

  @property({ attribute: false })
  modalMode?: boolean;

  @state()
  currentView?: string;

  _setViewId = (viewId: string) => {
    this.currentView = viewId;
  };
  private _dataSource?: DataSource;
  public get dataSource(): DataSource {
    if (!this._dataSource) {
      this._dataSource = new DatabaseBlockDatasource(this.root, {
        type: 'database-block',
        pageId: this.root.page.id,
        blockId: this.model.id,
        path: this.path,
      });
    }
    return this._dataSource;
  }

  private viewMap: Record<string, DataViewManager> = {};
  private getViewDataById = (id: string) => {
    return this.model.views.find(v => v.id === id);
  };

  private viewSource(id: string): ViewSource {
    const getViewDataById = this.getViewDataById;
    return {
      get view() {
        const view = getViewDataById(id);
        if (!view) {
          throw new Error(`view ${id} not found`);
        }
        return view as never;
      },
      updateView: updater => {
        this.model.updateView(id, updater as never);
      },
      updateSlot: this.model.propsUpdated,
    };
  }

  private getView(id: string): DataViewManager {
    if (!this.viewMap[id]) {
      this.viewMap[id] = new {
        table: DataViewTableManager,
        kanban: DataViewKanbanManager,
      }[this.getViewDataById(id)?.mode ?? 'table'](
        this.viewSource(id) as never,
        this.dataSource
      );
    }
    return this.viewMap[id];
  }

  override render() {
    const views = this.model.views;
    const current = views.find(v => v.id === this.currentView) ?? views[0];
    const databaseTag = {
      table: literal`affine-database-table`,
      kanban: literal`affine-data-view-kanban`,
    }[current.mode];
    const view = this.root.page.awarenessStore.getFlag('enable_database_filter')
      ? html` <database-view-header
          .currentView="${current.id}"
          .setViewId="${this._setViewId}"
          .model="${this.model}"
        ></database-view-header>`
      : '';
    const currentViewManager = this.getView(current.id);
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
    /* eslint-disable lit/binding-positions, lit/no-invalid-html */
    return html`
      <div class='toolbar-hover-container data-view-root'>
        ${view}
        <${databaseTag}
          .titleText='${this.model.title}'
          .root='${this.root}'
          .blockOperation='${blockOperation}'
          .view='${currentViewManager}'
          .modalMode='${this.modalMode}'
          .path='${this.path}'
          class='affine-block-element'
        ></${databaseTag}>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlockComponent;
  }
}

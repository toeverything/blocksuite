// related component
import './common/group-by/define.js';
import './common/header/views.js';
import './common/header/title.js';
import './common/header/tools/tools.js';
import './table/define.js';
import './table/renderer.js';
import './kanban/define.js';
import './kanban/renderer.js';

import { PathFinder } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import { copyBlocks } from '../__internal__/clipboard/index.js';
import type { DataSource } from '../__internal__/datasource/base.js';
import { DatabaseBlockDatasource } from '../__internal__/datasource/database-block-datasource.js';
import type { DataViewSelectionState } from '../__internal__/index.js';
import { registerService } from '../__internal__/service/index.js';
import type { BaseDataView } from './common/base-data-view.js';
import { viewRendererManager } from './common/data-view.js';
import type { DataViewManager } from './common/data-view-manager.js';
import { DatabaseSelection } from './common/selection.js';
import type { ViewSource } from './common/view-source.js';
import type { DatabaseBlockModel } from './database-model.js';
import { LegacyDatabaseBlockService } from './database-service.js';
import { KanbanViewClipboard } from './kanban/clipboard.js';
import { DataViewKanbanManager } from './kanban/kanban-view-manager.js';
import { TableViewClipboard } from './table/clipboard.js';
import { DataViewTableManager } from './table/table-view-manager.js';
import type { BlockOperation } from './types.js';

type ViewData = {
  view: DataViewManager;
  selectionUpdated: Slot<DataViewSelectionState>;
  setSelection: (selection?: DataViewSelectionState) => void;
  bindHotkey: BaseDataView['bindHotkey'];
  handleEvent: BaseDataView['handleEvent'];
};

@customElement('affine-database')
export class DatabaseBlockComponent extends BlockElement<DatabaseBlockModel> {
  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:database', LegacyDatabaseBlockService);
    this.currentView = this.model.getViewList()[0].id;
    this._disposables.add(
      this.root.selectionManager.slots.changed.on(selections => {
        const databaseSelection = selections.find(
          (selection): selection is DatabaseSelection => {
            if (!PathFinder.equals(selection.path, this.path)) {
              return false;
            }
            return selection instanceof DatabaseSelection;
          }
        );
        Object.entries(this.viewMap).forEach(([id, v]) => {
          if (!databaseSelection || databaseSelection.viewId !== id) {
            v.selectionUpdated.emit(undefined);
            return;
          }
          v.selectionUpdated.emit(databaseSelection?.viewSelection);
        });
      })
    );
    this.handleEvent('selectionChange', ctx => {
      const selection = this.service?.selectionManager.value.find(selection =>
        PathFinder.equals(selection.path, this.path)
      );
      return !!selection;
    });
    requestAnimationFrame(() => {
      this.requestUpdate();
    });
  }

  @property({ attribute: false })
  modalMode?: boolean;

  @state()
  currentView?: string;

  private _view = createRef<BaseDataView>();

  _setViewId = (viewId: string) => {
    if (this.currentView !== viewId) {
      this.service?.selectionManager.set([]);
      requestAnimationFrame(() => {
        this.currentView = viewId;
        requestAnimationFrame(() => {
          this.requestUpdate();
        });
      });
    }
  };

  private _dataSource?: DataSource;
  public get dataSource(): DataSource {
    if (!this._dataSource) {
      this._dataSource = new DatabaseBlockDatasource(this.root, {
        type: 'database-block',
        pageId: this.root.page.id,
        blockId: this.model.id,
      });
    }
    return this._dataSource;
  }

  private viewMap: Record<string, ViewData> = {};
  private getViewDataById = (id: string) => {
    return this.model.views.find(v => v.id === id);
  };

  public focusFirstCell = () => {
    this._view.value?.focusFirstCell();
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

  private getView(id: string): ViewData {
    if (!this.viewMap[id]) {
      const view = new {
        table: DataViewTableManager,
        kanban: DataViewKanbanManager,
      }[this.getViewDataById(id)?.mode ?? 'table'](
        this.viewSource(id) as never,
        this.dataSource
      );
      this.viewMap[id] = {
        view: view,
        selectionUpdated: new Slot<DataViewSelectionState>(),
        setSelection: selection => {
          if (!selection) {
            this.root.selectionManager.set([]);
            return;
          }
          const data = this.root.selectionManager.getInstance('database', {
            path: this.path,
            viewSelection: selection as never,
          });
          this.root.selectionManager.set([data]);
        },
        handleEvent: (name, handler) => {
          return {
            dispose: this.root.uiEventDispatcher.add(
              name,
              context => {
                if (this.currentView === id) {
                  return handler(context);
                }
              },
              { path: this.path }
            ),
          };
        },
        bindHotkey: hotkeys => {
          return {
            dispose: this.root.uiEventDispatcher.bindHotkey(
              Object.fromEntries(
                Object.entries(hotkeys).map(([key, fn]) => [
                  key,
                  ctx => {
                    if (this.currentView === id) {
                      return fn(ctx);
                    }
                  },
                ])
              ),
              { path: this.path }
            ),
          };
        },
      };

      // init clipboard
      const clipboard = new {
        table: TableViewClipboard,
        kanban: KanbanViewClipboard,
      }[this.getViewDataById(id)?.mode ?? 'table'](this.root, {
        path: this.path,
        model: this.model,
        view: this._view,
        data: view,
      });
      clipboard.init();
    }
    return this.viewMap[id];
  }

  private renderViews = () => {
    return html` <data-view-header-views
      style="flex:1"
      .currentView="${this.currentView}"
      .setViewId="${this._setViewId}"
      .model="${this.model}"
    ></data-view-header-views>`;
  };
  private renderTitle = () => {
    const addRow = () => this._view.value?.addRow?.('start');
    return html` <affine-database-title
      .titleText="${this.model.title}"
      .readonly="${this.model.page.readonly}"
      .onPressEnterKey="${addRow}"
    ></affine-database-title>`;
  };
  private renderReference = () => {
    return html` <div></div>`;
  };

  private renderTools = (view: DataViewManager) => {
    const blockOperation: BlockOperation = {
      copy: () => {
        copyBlocks([this.model]);
      },
      delete: () => {
        const models = [this.model, ...this.model.children];
        models.forEach(model => this.page.deleteBlock(model));
      },
    };

    return html` <data-view-header-tools
      .viewEle="${this._view.value}"
      .copyBlock="${blockOperation.copy}"
      .deleteSelf="${blockOperation.delete}"
      .view="${view}"
    ></data-view-header-tools>`;
  };

  override render() {
    const views = this.model.views;
    const current = views.find(v => v.id === this.currentView) ?? views[0];
    const viewData = this.getView(current.id);
    const props = {
      titleText: this.model.title,
      selectionUpdated: viewData.selectionUpdated,
      setSelection: viewData.setSelection,
      bindHotkey: viewData.bindHotkey,
      handleEvent: viewData.handleEvent,
      view: viewData.view,
      modalMode: this.modalMode,
      getFlag: this.page.awarenessStore.getFlag.bind(this.page.awarenessStore),
    };
    return html`
      <div class="toolbar-hover-container data-view-root">
        <div
          style="margin-bottom: 16px;display:flex;flex-direction: column;gap: 8px"
        >
          <div style="display:flex;align-items:center;gap:12px;padding: 0 6px;">
            ${this.renderTitle()} ${this.renderReference()}
          </div>
          <div
            style="display:flex;align-items:center;justify-content: space-between;gap: 12px"
          >
            ${this.renderViews()} ${this.renderTools(viewData.view)}
          </div>
        </div>
        <uni-lit
          .ref="${this._view}"
          .uni="${viewRendererManager.getView(current.mode).view}"
          .props="${props}"
          class="affine-block-element"
        ></uni-lit>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlockComponent;
  }
}

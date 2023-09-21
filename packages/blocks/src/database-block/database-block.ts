// related component
import './common/group-by/define.js';
import './common/header/views.js';
import './common/header/title.js';
import './common/header/tools/tools.js';
import './common/filter/filter-bar.js';
import './data-view.js';

import { PathFinder } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { css, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';
import { when } from 'lit/directives/when.js';
import { html } from 'lit/static-html.js';

import type { DataSource } from '../__internal__/datasource/base.js';
import { DatabaseBlockDatasource } from '../__internal__/datasource/database-block-datasource.js';
import type { DataViewSelection } from '../__internal__/index.js';
import { defineUniComponent } from '../components/uni-component/uni-component.js';
import { dataViewCommonStyle } from './common/css-variable.js';
import type { DataViewProps, DataViewTypes } from './common/data-view.js';
import { type DataViewExpose } from './common/data-view.js';
import type { DataViewManager } from './common/data-view-manager.js';
import { renderFilterBar } from './common/filter/filter-bar.js';
import { renderTools } from './common/header/tools/tools.js';
import { DatabaseSelection } from './common/selection.js';
import type { SingleViewSource, ViewSource } from './common/view-source.js';
import type { DatabaseBlockModel } from './database-model.js';

@customElement('affine-database')
export class DatabaseBlockComponent extends BlockElement<DatabaseBlockModel> {
  static override styles = css`
    ${unsafeCSS(dataViewCommonStyle('affine-database'))}
    affine-database {
      display: block;
      border-radius: 8px;
      background-color: var(--affine-background-primary-color);
      padding: 8px;
      margin: 8px -8px -8px;
    }

    .database-block-selected {
      background-color: var(--affine-hover-color);
      border-radius: 4px;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.root.selection.slots.changed.on(selections => {
        const databaseSelection = selections.find(
          (selection): selection is DatabaseSelection => {
            if (!PathFinder.equals(selection.path, this.path)) {
              return false;
            }
            return selection instanceof DatabaseSelection;
          }
        );
        this.selectionUpdated.emit(databaseSelection?.viewSelection);
      })
    );
    this._disposables.add(
      this.model.propsUpdated.on(() => {
        this.viewSource.updateSlot.emit();
      })
    );
    this.handleEvent('selectionChange', () => {
      const selection = this.service?.selectionManager.value.find(selection =>
        PathFinder.equals(selection.path, this.path)
      );
      return !!selection;
    });
  }

  private _view = createRef<DataViewExpose>();

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

  public focusFirstCell = () => {
    this._view.value?.focusFirstCell();
  };

  private renderViews = () => {
    return html` <data-view-header-views
      style="flex:1"
      .viewSource="${this._viewSource}"
    ></data-view-header-views>`;
  };
  private renderTitle = (dataViewMethod: DataViewExpose) => {
    const addRow = () => dataViewMethod.addRow?.('start');
    return html` <affine-database-title
      .titleText="${this.model.title}"
      .readonly="${this.model.page.readonly}"
      .onPressEnterKey="${addRow}"
    ></affine-database-title>`;
  };
  private renderReference = () => {
    return html` <div></div>`;
  };

  headerComponent = defineUniComponent(
    ({
      view,
      viewMethods,
    }: {
      view: DataViewManager;
      viewMethods: DataViewExpose;
    }) => {
      return html`
        <div style="margin-bottom: 16px;display:flex;flex-direction: column">
          <div
            style="display:flex;align-items:center;gap:12px;padding: 0 6px;margin-bottom: 8px;"
          >
            ${this.renderTitle(viewMethods)} ${this.renderReference()}
          </div>
          <div
            style="display:flex;align-items:center;justify-content: space-between;gap: 12px"
          >
            ${this.renderViews()} ${renderTools(view, viewMethods)}
          </div>
          ${renderFilterBar(view)}
        </div>
      `;
    }
  );

  private _viewSource?: ViewSource;
  public get viewSource(): ViewSource {
    if (!this._viewSource) {
      this._viewSource = new DatabaseBlockViewSource(this.model);
    }
    return this._viewSource;
  }
  setSelection = (selection: DataViewSelection | undefined) => {
    this.selection.setGroup(
      'note',
      selection
        ? [new DatabaseSelection({ path: this.path, viewSelection: selection })]
        : []
    );
  };
  selectionUpdated = new Slot<DataViewSelection | undefined>();

  get getFlag() {
    return this.root.page.awarenessStore.getFlag.bind(
      this.root.page.awarenessStore
    );
  }
  _bindHotkey: DataViewProps['bindHotkey'] = hotkeys => {
    return {
      dispose: this.root.event.bindHotkey(hotkeys, {
        path: this.path,
      }),
    };
  };
  _handleEvent: DataViewProps['handleEvent'] = (name, handler) => {
    return {
      dispose: this.root.event.add(name, handler, {
        path: this.path,
      }),
    };
  };
  override render() {
    return html`
      <div style="position: relative">
        <affine-data-view-native
          .bindHotkey="${this._bindHotkey}"
          .handleEvent="${this._handleEvent}"
          .getFlag="${this.getFlag}"
          .selectionUpdated="${this.selectionUpdated}"
          .setSelection="${this.setSelection}"
          .dataSource="${this.dataSource}"
          .viewSource="${this.viewSource}"
          .headerComponent="${this.headerComponent}"
        ></affine-data-view-native>
        ${when(
          this.selected?.is('block'),
          () => html`<affine-block-selection></affine-block-selection>`
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlockComponent;
  }
}

class DatabaseBlockViewSource implements ViewSource {
  constructor(private model: DatabaseBlockModel) {}

  get currentViewId(): string {
    return this.currentId ?? this.model.views[0].id;
  }

  private viewMap = new Map<string, SingleViewSource>();
  private currentId?: string;

  public selectView(id: string): void {
    this.currentId = id;
    this.updateSlot.emit();
  }

  public updateSlot = new Slot();

  public get views(): SingleViewSource[] {
    return this.model.views.map(v => this.viewGet(v.id));
  }

  public get currentView(): SingleViewSource {
    return this.viewGet(this.currentViewId);
  }

  public get readonly(): boolean {
    return false;
  }

  public viewAdd(type: DataViewTypes): string {
    this.model.page.captureSync();
    const view = this.model.addView(type);
    this.model.applyViewsUpdate();
    return view.id;
  }

  public viewGet(id: string): SingleViewSource {
    let result = this.viewMap.get(id);
    if (!result) {
      const getView = () => {
        return this.model.views.find(v => v.id === id);
      };
      const view = getView();
      if (!view) {
        throw new Error('view not found');
      }
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      const slot = new Slot();
      this.updateSlot.pipe(slot);
      result = {
        get view() {
          const view = getView();
          if (!view) {
            throw new Error('view not found');
          }
          return view;
        },
        updateView: updater => {
          this.model.page.captureSync();
          this.model.updateView(id, updater);
          this.model.applyViewsUpdate();
        },
        delete: () => {
          this.model.page.captureSync();
          this.model.deleteView(id);
          this.currentId = undefined;
          this.model.applyViewsUpdate();
        },
        get readonly() {
          return self.model.page.readonly;
        },
        updateSlot: slot,
        isDeleted() {
          return !self.model.views.find(v => v.id === id);
        },
      };
      this.viewMap.set(id, result);
    }
    return result;
  }
}

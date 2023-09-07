import './table/define.js';
import './table/renderer.js';
import './kanban/define.js';
import './kanban/renderer.js';

import { Slot } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { keyed } from 'lit/directives/keyed.js';
import { createRef } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import type { DataSource } from '../__internal__/datasource/base.js';
import type {
  DataViewSelection,
  DataViewSelectionState,
} from '../__internal__/index.js';
import { renderUniLit } from '../components/uni-component/uni-component.js';
import type { BaseDataView } from './common/base-data-view.js';
import { dataViewCommonStyle } from './common/css-variable.js';
import type {
  DataViewExpose,
  DataViewHeaderComponentProp,
  DataViewProps,
  DataViewTypes,
} from './common/data-view.js';
import { viewRendererManager } from './common/data-view.js';
import type { DataViewManager } from './common/data-view-manager.js';
import type { SingleViewSource, ViewSource } from './common/view-source.js';
import { DataViewKanbanManager } from './kanban/kanban-view-manager.js';
import { DataViewTableManager } from './table/table-view-manager.js';

type ViewProps = {
  view: DataViewManager;
  viewUpdated: Slot;
  selectionUpdated: Slot<DataViewSelectionState>;
  setSelection: (selection?: DataViewSelectionState) => void;
  bindHotkey: BaseDataView['bindHotkey'];
  handleEvent: BaseDataView['handleEvent'];
};
const ViewManagerMap: Record<
  DataViewTypes,
  new (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    viewSource: SingleViewSource<any>,
    dataSource: DataSource
  ) => DataViewManager
> = {
  table: DataViewTableManager,
  kanban: DataViewKanbanManager,
};
@customElement('affine-data-view-native')
export class DataViewNative extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    ${unsafeCSS(dataViewCommonStyle('affine-data-view-native'))}
    affine-data-view-native {
      background-color: var(--affine-background-primary-color);
      display: contents;
    }
  `;
  @property({ attribute: false })
  bindHotkey!: BaseDataView['bindHotkey'];
  @property({ attribute: false })
  handleEvent!: BaseDataView['handleEvent'];
  @property({ attribute: false })
  getFlag?: Page['awarenessStore']['getFlag'];
  @property({ attribute: false })
  selectionUpdated!: Slot<DataViewSelection>;
  @property({ attribute: false })
  setSelection!: (selection: DataViewSelection | undefined) => void;
  @property({ attribute: false })
  dataSource!: DataSource;
  @property({ attribute: false })
  viewSource!: ViewSource;
  @property({ attribute: false })
  headerComponent!: DataViewHeaderComponentProp;
  override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.selectionUpdated.on(selection => {
        Object.entries(this.viewMap).forEach(([id, v]) => {
          if (!selection || selection.viewId !== id) {
            v.selectionUpdated.emit(undefined);
            return;
          }
          v.selectionUpdated.emit(selection);
        });
      })
    );
    this.disposables.add(
      this.viewSource.updateSlot.on(() => {
        this.requestUpdate();
        this.viewSource.views.forEach(v => {
          v.updateSlot.emit();
        });
      })
    );
  }

  @state()
  currentView?: string;

  private _view = createRef<DataViewExpose>();

  private viewMap: Record<string, ViewProps> = {};

  public focusFirstCell = () => {
    this._view.value?.focusFirstCell();
  };

  private getView(id: string): ViewProps {
    if (!this.viewMap[id]) {
      const singleViewSource = this.viewSource.viewGet(id);

      const view = new ViewManagerMap[singleViewSource.view.mode](
        singleViewSource,
        this.dataSource
      );
      this.viewMap[id] = {
        view: view,
        viewUpdated: singleViewSource.updateSlot,
        selectionUpdated: new Slot<DataViewSelectionState>(),
        setSelection: selection => {
          this.setSelection(selection);
        },
        handleEvent: (name, handler) =>
          this.handleEvent(name, context => {
            if (this.viewSource.currentViewId === id) {
              return handler(context);
            }
          }),
        bindHotkey: hotkeys =>
          this.bindHotkey(
            Object.fromEntries(
              Object.entries(hotkeys).map(([key, fn]) => [
                key,
                ctx => {
                  if (this.viewSource.currentViewId === id) {
                    return fn(ctx);
                  }
                },
              ])
            )
          ),
      };
    }
    return this.viewMap[id];
  }

  private renderView(viewData?: ViewProps) {
    if (!viewData) {
      return;
    }
    const props: DataViewProps = {
      view: viewData.view,
      header: this.headerComponent,
      selectionUpdated: viewData.selectionUpdated,
      setSelection: viewData.setSelection,
      bindHotkey: viewData.bindHotkey,
      handleEvent: viewData.handleEvent,
      getFlag: this.getFlag,
    };
    return keyed(
      viewData.view.id,
      renderUniLit(
        viewRendererManager.getView(viewData.view.type).view,
        props,
        { ref: this._view }
      )
    );
  }

  override render() {
    const views = this.viewSource.views;
    const viewData = views
      .map(view => this.getView(view.view.id))
      .find(v => v.view.id === this.viewSource.currentViewId);
    const containerClass = classMap({
      'toolbar-hover-container': true,
      'data-view-root': true,
    });
    return html`
      <div style="display: contents" class="${containerClass}">
        ${this.renderView(viewData)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-native': DataViewNative;
  }
}

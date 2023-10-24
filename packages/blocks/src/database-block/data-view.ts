import './table/define.js';
import './table/renderer.js';
import './kanban/define.js';
import './kanban/renderer.js';

import { Slot } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { keyed } from 'lit/directives/keyed.js';
import { createRef } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import { renderUniLit } from '../_common/components/uni-component/uni-component.js';
import type {
  DataViewSelection,
  DataViewSelectionState,
} from '../_common/utils/index.js';
import type { BaseDataView } from './common/base-data-view.js';
import { dataViewCommonStyle } from './common/css-variable.js';
import type {
  DataViewExpose,
  DataViewProps,
  DataViewTypes,
} from './common/data-view.js';
import { viewRendererManager } from './common/data-view.js';
import type { DataViewManager } from './common/data-view-manager.js';
import type { DataSource } from './common/datasource/base.js';
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

export type DataViewNativeConfig = {
  bindHotkey: DataViewProps['bindHotkey'];
  handleEvent: DataViewProps['handleEvent'];
  getFlag?: DataViewProps['getFlag'];
  selectionUpdated: Slot<DataViewSelection | undefined>;
  setSelection: (selection: DataViewSelection | undefined) => void;
  dataSource: DataSource;
  viewSource: ViewSource;
  headerComponent: DataViewProps['header'];
  onDrag?: DataViewProps['onDrag'];
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
  config!: DataViewNativeConfig;

  public get expose() {
    return this._view.value;
  }
  override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.config.selectionUpdated.on(selection => {
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
      this.config.viewSource.updateSlot.on(() => {
        this.requestUpdate();
        this.config.viewSource.views.forEach(v => {
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
      const singleViewSource = this.config.viewSource.viewGet(id);

      const view = new ViewManagerMap[singleViewSource.view.mode](
        singleViewSource,
        this.config.dataSource
      );
      this.viewMap[id] = {
        view: view,
        viewUpdated: singleViewSource.updateSlot,
        selectionUpdated: new Slot<DataViewSelectionState>(),
        setSelection: selection => {
          this.config.setSelection(selection);
        },
        handleEvent: (name, handler) =>
          this.config.handleEvent(name, context => {
            if (this.config.viewSource.currentViewId === id) {
              return handler(context);
            }
          }),
        bindHotkey: hotkeys =>
          this.config.bindHotkey(
            Object.fromEntries(
              Object.entries(hotkeys).map(([key, fn]) => [
                key,
                ctx => {
                  if (this.config.viewSource.currentViewId === id) {
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
      header: this.config.headerComponent,
      selectionUpdated: viewData.selectionUpdated,
      setSelection: viewData.setSelection,
      bindHotkey: viewData.bindHotkey,
      handleEvent: viewData.handleEvent,
      getFlag: this.config.getFlag,
      onDrag: this.config.onDrag,
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
    const views = this.config.viewSource.views;
    const viewData = views
      .map(view => this.getView(view.view.id))
      .find(v => v.view.id === this.config.viewSource.currentViewId);
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

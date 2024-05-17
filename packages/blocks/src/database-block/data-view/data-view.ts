import './common/group-by/define.js';

import type { BlockStdScope } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/global/utils';
import type { ReferenceElement } from '@floating-ui/dom';
import { css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { keyed } from 'lit/directives/keyed.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import { dataViewCommonStyle } from './common/css-variable.js';
import type { DataSource } from './common/data-source/base.js';
import { popSideDetail } from './common/detail/layout.js';
import type { ViewSource } from './common/index.js';
import type { DataViewSelection, DataViewSelectionState } from './types.js';
import { renderUniLit } from './utils/uni-component/index.js';
import type { DataViewExpose, DataViewProps } from './view/data-view.js';
import type { DataViewBase } from './view/data-view-base.js';
import type { DataViewManager } from './view/data-view-manager.js';

type ViewProps = {
  view: DataViewManager;
  viewUpdated: Slot;
  selectionUpdated: Slot<DataViewSelectionState>;
  setSelection: (selection?: DataViewSelectionState) => void;
  bindHotkey: DataViewBase['bindHotkey'];
  handleEvent: DataViewBase['handleEvent'];
};

export type DataViewRendererConfig = {
  bindHotkey: DataViewProps['bindHotkey'];
  handleEvent: DataViewProps['handleEvent'];
  getFlag?: DataViewProps['getFlag'];
  selectionUpdated: Slot<DataViewSelection | undefined>;
  setSelection: (selection: DataViewSelection | undefined) => void;
  dataSource: DataSource;
  viewSource: ViewSource;
  detailPanelConfig?: {
    target?: () => ReferenceElement;
  };
  headerWidget: DataViewProps['headerWidget'];
  onDrag?: DataViewProps['onDrag'];
  std: BlockStdScope;
};

@customElement('affine-data-view-renderer')
export class DataViewRenderer extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    ${unsafeCSS(dataViewCommonStyle('affine-data-view-renderer'))}
    affine-data-view-renderer {
      background-color: var(--affine-background-primary-color);
      display: contents;
    }
  `;
  @property({ attribute: false })
  config!: DataViewRendererConfig;

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

      const view = new (this.config.viewSource.getViewMeta(
        singleViewSource.view.mode
      ).model.dataViewManager)();
      view.init(this.config.dataSource, singleViewSource);
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

  openDetailPanel = (ops: {
    view: DataViewManager;
    rowId: string;
    onClose?: () => void;
  }) => {
    popSideDetail({
      attachTo: this.closest('editor-host') ?? document.body,
      target: this.config.detailPanelConfig?.target?.() ?? document.body,
      view: ops.view,
      rowId: ops.rowId,
      onClose: ops.onClose,
    });
  };

  private renderView(viewData?: ViewProps) {
    if (!viewData) {
      return;
    }
    const props: DataViewProps = {
      dataViewEle: this,
      view: viewData.view,
      headerWidget: this.config.headerWidget,
      selectionUpdated: viewData.selectionUpdated,
      setSelection: viewData.setSelection,
      bindHotkey: viewData.bindHotkey,
      handleEvent: viewData.handleEvent,
      getFlag: this.config.getFlag,
      onDrag: this.config.onDrag,
      std: this.config.std,
      viewSource: this.config.viewSource,
      dataSource: this.config.dataSource,
    };
    return keyed(
      viewData.view.id,
      renderUniLit(
        this.config.viewSource.getViewMeta(viewData.view.type).renderer.view,
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
    'affine-data-view-renderer': DataViewRenderer;
  }
}

export class DataView {
  private _ref = createRef<DataViewRenderer>();

  public get expose() {
    return this._ref.value?.expose;
  }

  render(props: DataViewRendererConfig) {
    return html` <affine-data-view-renderer
      ${ref(this._ref)}
      .config="${props}"
    ></affine-data-view-renderer>`;
  }
}

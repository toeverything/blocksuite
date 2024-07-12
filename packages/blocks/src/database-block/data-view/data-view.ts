import type { BlockStdScope } from '@blocksuite/block-std';
import type { ReferenceElement } from '@floating-ui/dom';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/global/utils';
import { type TemplateResult, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { keyed } from 'lit/directives/keyed.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import type { DataSource } from './common/data-source/base.js';
import type { ViewSource } from './common/index.js';
import type { DataViewSelection, DataViewSelectionState } from './types.js';
import type { DataViewExpose, DataViewProps } from './view/data-view.js';
import type { DataViewBase } from './view/data-view-base.js';
import type { DataViewManager } from './view/data-view-manager.js';

import { dataViewCommonStyle } from './common/css-variable.js';
import { createRecordDetail, popSideDetail } from './common/detail/layout.js';
import './common/group-by/define.js';
import { renderUniLit } from './utils/uni-component/index.js';

type ViewProps = {
  bindHotkey: DataViewBase['bindHotkey'];
  handleEvent: DataViewBase['handleEvent'];
  selectionUpdated: Slot<DataViewSelectionState>;
  setSelection: (selection?: DataViewSelectionState) => void;
  view: DataViewManager;
  viewUpdated: Slot<{ viewId: string }>;
};

export type DataViewRendererConfig = {
  bindHotkey: DataViewProps['bindHotkey'];
  dataSource: DataSource;
  detailPanelConfig?: {
    openDetailPanel?: (
      target: HTMLElement,
      template: TemplateResult
    ) => Promise<void>;
    target?: () => ReferenceElement;
  };
  getFlag?: DataViewProps['getFlag'];
  handleEvent: DataViewProps['handleEvent'];
  headerWidget: DataViewProps['headerWidget'];
  onDrag?: DataViewProps['onDrag'];
  selectionUpdated: Slot<DataViewSelection | undefined>;
  setSelection: (selection: DataViewSelection | undefined) => void;
  std: BlockStdScope;
  viewSource: ViewSource;
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

  private _view = createRef<DataViewExpose>();

  private viewMap: Record<string, ViewProps> = {};

  focusFirstCell = () => {
    this._view.value?.focusFirstCell();
  };

  openDetailPanel = (ops: {
    onClose?: () => void;
    rowId: string;
    view: DataViewManager;
  }) => {
    const openDetailPanel = this.config.detailPanelConfig?.openDetailPanel;
    if (openDetailPanel) {
      openDetailPanel(
        this,
        createRecordDetail({
          rowId: ops.rowId,
          view: ops.view,
        })
      )
        .catch(console.error)
        .finally(ops.onClose);
    } else {
      popSideDetail({
        onClose: ops.onClose,
        rowId: ops.rowId,
        target: this.config.detailPanelConfig?.target?.() ?? document.body,
        view: ops.view,
      });
    }
  };

  private getView(id: string): ViewProps {
    if (!this.viewMap[id]) {
      const singleViewSource = this.config.viewSource.viewGet(id);

      const view = new (this.config.viewSource.getViewMeta(
        singleViewSource.view.mode
      ).model.dataViewManager)();
      view.init(this.config.dataSource, singleViewSource);
      this.viewMap[id] = {
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
        handleEvent: (name, handler) =>
          this.config.handleEvent(name, context => {
            if (this.config.viewSource.currentViewId === id) {
              return handler(context);
            }
          }),
        selectionUpdated: new Slot<DataViewSelectionState>(),
        setSelection: selection => {
          this.config.setSelection(selection);
        },
        view: view,
        viewUpdated: singleViewSource.updateSlot,
      };
    }
    return this.viewMap[id];
  }

  private renderView(viewData?: ViewProps) {
    if (!viewData) {
      return;
    }
    const props: DataViewProps = {
      bindHotkey: viewData.bindHotkey,
      dataSource: this.config.dataSource,
      dataViewEle: this,
      getFlag: this.config.getFlag,
      handleEvent: viewData.handleEvent,
      headerWidget: this.config.headerWidget,
      onDrag: this.config.onDrag,
      selectionUpdated: viewData.selectionUpdated,
      setSelection: viewData.setSelection,
      std: this.config.std,
      view: viewData.view,
      viewSource: this.config.viewSource,
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
      })
    );
  }

  override render() {
    const views = this.config.viewSource.views;
    const viewData = views
      .map(view => this.getView(view.view.id))
      .find(v => v.view.id === this.config.viewSource.currentViewId);
    const containerClass = classMap({
      'data-view-root': true,
      'toolbar-hover-container': true,
    });
    return html`
      <div style="display: contents" class="${containerClass}">
        ${this.renderView(viewData)}
      </div>
    `;
  }

  get expose() {
    return this._view.value;
  }

  @property({ attribute: false })
  accessor config!: DataViewRendererConfig;

  @state()
  accessor currentView: string | undefined = undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-renderer': DataViewRenderer;
  }
}

export class DataView {
  private _ref = createRef<DataViewRenderer>();

  render(props: DataViewRendererConfig) {
    return html` <affine-data-view-renderer
      ${ref(this._ref)}
      .config="${props}"
    ></affine-data-view-renderer>`;
  }

  get expose() {
    return this._ref.value?.expose;
  }
}

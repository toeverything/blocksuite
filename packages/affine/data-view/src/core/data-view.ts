import type { BlockStdScope } from '@blocksuite/block-std';

import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { computed, type ReadonlySignal } from '@preact/signals-core';
import { css, unsafeCSS } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { keyed } from 'lit/directives/keyed.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import type { DataSource } from './common/data-source/base.js';
import type { DataViewSelection, DataViewSelectionState } from './types.js';
import type { DataViewExpose, DataViewProps } from './view/types.js';
import type { SingleView } from './view-manager/single-view.js';

import { dataViewCommonStyle } from './common/css-variable.js';
import { renderUniLit } from './utils/uni-component/index.js';

type ViewProps = {
  view: SingleView;
  selection$: ReadonlySignal<DataViewSelectionState>;
  setSelection: (selection?: DataViewSelectionState) => void;
  bindHotkey: DataViewProps['bindHotkey'];
  handleEvent: DataViewProps['handleEvent'];
};

export type DataViewRendererConfig = {
  bindHotkey: DataViewProps['bindHotkey'];
  handleEvent: DataViewProps['handleEvent'];
  virtualPadding$: DataViewProps['virtualPadding$'];
  selection$: ReadonlySignal<DataViewSelection | undefined>;
  setSelection: (selection: DataViewSelection | undefined) => void;
  dataSource: DataSource;
  detailPanelConfig: {
    openDetailPanel: (
      target: HTMLElement,
      data: {
        view: SingleView;
        rowId: string;
      }
    ) => Promise<void>;
  };
  headerWidget: DataViewProps['headerWidget'];
  onDrag?: DataViewProps['onDrag'];
  std: BlockStdScope;
};

export class DataViewRenderer extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    ${unsafeCSS(dataViewCommonStyle('affine-data-view-renderer'))}
    affine-data-view-renderer {
      background-color: var(--affine-background-primary-color);
      display: contents;
    }
  `;

  private _view = createRef<DataViewExpose>();

  private currentViewId$ = computed(() => {
    return this.config.dataSource.viewManager.currentViewId$.value;
  });

  currentViewConfig$ = computed<ViewProps | undefined>(() => {
    const currentViewId = this.currentViewId$.value;
    if (!currentViewId) {
      return;
    }
    const view = this.viewMap$.value[currentViewId];
    return {
      view: view,
      selection$: computed(() => {
        const selection$ = this.config.selection$;
        if (selection$.value?.viewId === currentViewId) {
          return selection$.value;
        }
        return;
      }),
      setSelection: selection => {
        this.config.setSelection(selection);
      },
      handleEvent: (name, handler) =>
        this.config.handleEvent(name, context => {
          return handler(context);
        }),
      bindHotkey: hotkeys =>
        this.config.bindHotkey(
          Object.fromEntries(
            Object.entries(hotkeys).map(([key, fn]) => [
              key,
              ctx => {
                return fn(ctx);
              },
            ])
          )
        ),
    };
  });

  focusFirstCell = () => {
    this._view.value?.focusFirstCell();
  };

  openDetailPanel = (ops: {
    view: SingleView;
    rowId: string;
    onClose?: () => void;
  }) => {
    const openDetailPanel = this.config.detailPanelConfig.openDetailPanel;
    if (openDetailPanel) {
      openDetailPanel(this, {
        view: ops.view,
        rowId: ops.rowId,
      })
        .catch(console.error)
        .finally(ops.onClose);
    }
  };

  viewMap$ = computed(() => {
    const manager = this.config.dataSource.viewManager;
    return Object.fromEntries(
      manager.views$.value.map(view => [view, manager.viewGet(view)])
    );
  });

  get expose() {
    return this._view.value;
  }

  private renderView(viewData?: ViewProps) {
    if (!viewData) {
      return;
    }
    const props: DataViewProps = {
      dataViewEle: this,
      headerWidget: this.config.headerWidget,
      view: viewData.view,
      selection$: viewData.selection$,
      setSelection: viewData.setSelection,
      bindHotkey: viewData.bindHotkey,
      handleEvent: viewData.handleEvent,
      onDrag: this.config.onDrag,
      std: this.config.std,
      dataSource: this.config.dataSource,
      virtualPadding$: this.config.virtualPadding$,
    };
    return keyed(
      viewData.view.id,
      renderUniLit(
        viewData.view.meta.renderer.view,
        { props },
        {
          ref: this._view,
        }
      )
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    let preId: string | undefined = undefined;
    this.disposables.add(
      this.currentViewId$.subscribe(current => {
        if (current !== preId) {
          this.config.setSelection(undefined);
        }
        preId = current;
      })
    );
  }

  override render() {
    const containerClass = classMap({
      'toolbar-hover-container': true,
      'data-view-root': true,
      'prevent-reference-popup': true,
    });
    return html`
      <div style="display: contents" class="${containerClass}">
        ${this.renderView(this.currentViewConfig$.value)}
      </div>
    `;
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

  get expose() {
    return this._ref.value?.expose;
  }

  render(props: DataViewRendererConfig) {
    return html` <affine-data-view-renderer
      ${ref(this._ref)}
      .config="${props}"
    ></affine-data-view-renderer>`;
  }
}

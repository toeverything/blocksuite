import { LitElement, html, unsafeCSS, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Disposable, Signal, Store } from '@blocksuite/store';
import type { GroupBlockModel, PageBlockModel } from '../..';
import {
  EdgelessBlockChildrenContainer,
  EdgelessSelectedRect,
} from './components';
import {
  BlockHost,
  BLOCK_ID_ATTR,
  hotkey,
  HOTKEYS,
  resetNativeSelection,
} from '../../__internal__';
import {
  EdgelessSelectionManager,
  EdgelessSelectionState,
  ViewportState,
  XYWH,
} from './selection-manager';
import style from './style.css';
import {
  bindCommonHotkey,
  handleBackspace,
  removeCommonHotKey,
  tryUpdateGroupSize,
} from '../utils';

export interface EdgelessContainer extends HTMLElement {
  readonly store: Store;
  readonly viewport: ViewportState;
  readonly mouseRoot: HTMLElement;
  readonly signals: {
    viewportUpdated: Signal;
    updateSelection: Signal<EdgelessSelectionState>;
  };
}

@customElement('edgeless-page-block')
export class EdgelessPageBlockComponent
  extends LitElement
  implements EdgelessContainer, BlockHost
{
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property()
  store!: Store;

  flavour = 'edgeless' as const;

  @property()
  mouseRoot!: HTMLElement;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  @state()
  viewport = new ViewportState();

  @state()
  selectedRect: DOMRect | null = null;

  signals = {
    viewportUpdated: new Signal(),
    updateSelection: new Signal<EdgelessSelectionState>(),
  };

  _historyDisposble!: Disposable;

  private _selection!: EdgelessSelectionManager;

  private _bindHotkeys() {
    const { store } = this;
    hotkey.addListener(HOTKEYS.BACKSPACE, this._backspace.bind(this));
    bindCommonHotkey(store);
  }

  private _removeHotkeys() {
    hotkey.removeListener([HOTKEYS.BACKSPACE]);
    removeCommonHotKey();
  }
  _backspace(e: KeyboardEvent) {
    if (this._selection.state.type === 'single') {
      handleBackspace(this.store, e);
    }
  }
  private _initViewport() {
    const bound = this.mouseRoot.getBoundingClientRect();
    this.viewport.setSize(bound.width, bound.height);

    const group = this.model.children[0] as GroupBlockModel;
    const [modelX, modelY, modelW, modelH] = JSON.parse(group.xywh) as XYWH;
    this.viewport.setCenter(modelX + modelW / 2, modelY + modelH / 2);
  }

  private _clearSelection() {
    requestAnimationFrame(() => {
      if (!this._selection.isActive) {
        resetNativeSelection(null);
      }
    });
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseRoot') && changedProperties.has('store')) {
      this._selection = new EdgelessSelectionManager(this);
    }
    super.update(changedProperties);
  }

  firstUpdated() {
    // TODO: listen to new children
    this.model.children.forEach(group => {
      group.propsUpdated.on(() => this._selection.syncSelectionBox());
    });

    this.signals.viewportUpdated.on(() => this._selection.syncSelectionBox());
    this.signals.updateSelection.on(() => this.requestUpdate());
    this._historyDisposble = this.store.signals.historyUpdated.on(() => {
      this._clearSelection();
    });

    this._bindHotkeys();

    this.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      tryUpdateGroupSize(this.store, this.viewport.zoom);
    });

    this._initViewport();
    // XXX: should be called after rich text components are mounted
    this._clearSelection();
  }

  disconnectedCallback() {
    this.signals.updateSelection.dispose();
    this.signals.viewportUpdated.dispose();
    this._historyDisposble.dispose();
    this._selection.dispose();
    this._removeHotkeys();
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = EdgelessBlockChildrenContainer(
      this.model,
      this,
      this.viewport
    );

    const { zoom } = this.viewport;
    const selectedRect = EdgelessSelectedRect(this._selection.state, zoom);

    return html`
      <style></style>
      <div class="affine-edgeless-page-block-container">
        ${childrenContainer} ${selectedRect}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-page-block': EdgelessPageBlockComponent;
  }
}

import { LitElement, html, unsafeCSS, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Disposable, Signal, Store } from '@blocksuite/store';
import type { GroupBlockModel, PageBlockModel } from '../..';
import {
  EdgelessBlockChildrenContainer,
  EdgelessHoverRect,
  EdgelessSelectedRect,
  EdgelessFrameSelectionRect,
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
  BlockSelectionState,
  ViewportState,
  XYWH,
} from './selection-manager';
import style from './style.css';
import {
  bindCommonHotkey,
  handleBackspace,
  removeCommonHotKey,
  tryUpdateGroupSize,
  updateTextType,
} from '../utils';

export interface EdgelessContainer extends HTMLElement {
  readonly store: Store;
  readonly viewport: ViewportState;
  readonly mouseRoot: HTMLElement;
  readonly signals: {
    hoverUpdated: Signal;
    viewportUpdated: Signal;
    updateSelection: Signal<BlockSelectionState>;
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

  signals = {
    viewportUpdated: new Signal(),
    updateSelection: new Signal<BlockSelectionState>(),
    hoverUpdated: new Signal(),
  };

  private _historyDisposable!: Disposable;
  private _selection!: EdgelessSelectionManager;

  private _bindHotkeys() {
    const { store } = this;

    hotkey.addListener(
      HOTKEYS.BACKSPACE,
      this._handleBackspace.bind(this),
      this.flavour
    );
    hotkey.addListener(HOTKEYS.H1, () =>
      this._updateType('paragraph', 'h1', store)
    );
    hotkey.addListener(HOTKEYS.H2, () =>
      this._updateType('paragraph', 'h2', store)
    );
    hotkey.addListener(HOTKEYS.H3, () =>
      this._updateType('paragraph', 'h3', store)
    );
    hotkey.addListener(HOTKEYS.H4, () =>
      this._updateType('paragraph', 'h4', store)
    );
    hotkey.addListener(HOTKEYS.H5, () =>
      this._updateType('paragraph', 'h5', store)
    );
    hotkey.addListener(HOTKEYS.H6, () =>
      this._updateType('paragraph', 'h6', store)
    );
    hotkey.addListener(HOTKEYS.NUMBERED_LIST, () =>
      this._updateType('list', 'numbered', store)
    );
    hotkey.addListener(HOTKEYS.BULLETED, () =>
      this._updateType('list', 'bulleted', store)
    );
    hotkey.addListener(HOTKEYS.TEXT, () =>
      this._updateType('paragraph', 'text', store)
    );

    bindCommonHotkey(store);
  }

  private _updateType(flavour: string, type: string, store: Store): void {
    updateTextType(flavour, type, store);
  }

  private _removeHotkeys() {
    hotkey.removeListener([HOTKEYS.BACKSPACE], this.flavour);
    removeCommonHotKey();
  }

  private _handleBackspace(e: KeyboardEvent) {
    if (this._selection.blockSelectionState.type === 'single') {
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
      group.propsUpdated.on(() => this._selection.syncBlockSelectionRect());
    });

    this.signals.viewportUpdated.on(() =>
      this._selection.syncBlockSelectionRect()
    );
    this.signals.hoverUpdated.on(() => this.requestUpdate());
    this.signals.updateSelection.on(() => this.requestUpdate());
    this._historyDisposable = this.store.signals.historyUpdated.on(() => {
      this._clearSelection();
    });

    this._bindHotkeys();

    this.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      tryUpdateGroupSize(this.store, this.viewport.zoom);
    });

    requestAnimationFrame(() => {
      this._initViewport();
      this.requestUpdate();
    });

    // XXX: should be called after rich text components are mounted
    this._clearSelection();
  }

  disconnectedCallback() {
    this.signals.updateSelection.dispose();
    this.signals.viewportUpdated.dispose();
    this.signals.hoverUpdated.dispose();
    this._historyDisposable.dispose();
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

    const { _selection } = this;
    const { frameSelectionRect } = _selection;
    const { zoom } = this.viewport;
    const selectedRect = EdgelessSelectedRect(_selection, zoom);
    const selectionRect = EdgelessFrameSelectionRect(frameSelectionRect);
    const hoverRect = EdgelessHoverRect(_selection.hoverRect, zoom);

    return html`
      <style></style>
      <div class="affine-edgeless-page-block-container">
        ${childrenContainer} ${hoverRect} ${selectionRect} ${selectedRect}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-page-block': EdgelessPageBlockComponent;
  }
}

/// <reference types="vite/client" />
import { LitElement, html, unsafeCSS, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Disposable, Signal, Page } from '@blocksuite/store';
import type {
  GroupBlockModel,
  MouseMode,
  PageBlockModel,
} from '../../index.js';
import {
  EdgelessBlockChildrenContainer,
  EdgelessHoverRect,
  EdgelessFrameSelectionRect,
} from './components.js';
import {
  BlockHost,
  BLOCK_ID_ATTR,
  hotkey,
  HOTKEYS,
  resetNativeSelection,
} from '../../__internal__/index.js';
import {
  EdgelessSelectionManager,
  BlockSelectionState,
  ViewportState,
  XYWH,
} from './selection-manager.js';
import {
  bindCommonHotkey,
  handleBackspace,
  removeCommonHotKey,
  tryUpdateGroupSize,
  updateSelectedTextType,
} from '../utils/index.js';
import style from './style.css';

export interface EdgelessContainer extends HTMLElement {
  readonly page: Page;
  readonly viewport: ViewportState;
  readonly mouseRoot: HTMLElement;
  readonly signals: {
    hoverUpdated: Signal;
    viewportUpdated: Signal;
    updateSelection: Signal<BlockSelectionState>;
    shapeUpdated: Signal;
  };
}

@customElement('affine-edgeless-page')
export class EdgelessPageBlockComponent
  extends LitElement
  implements EdgelessContainer, BlockHost
{
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property()
  page!: Page;

  @property()
  readonly = false;

  flavour = 'edgeless' as const;

  @property()
  mouseRoot!: HTMLElement;

  @property()
  mouseMode!: MouseMode;

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
    shapeUpdated: new Signal(),
  };

  private _historyDisposable!: Disposable;
  private _selection!: EdgelessSelectionManager;

  private _bindHotkeys() {
    const { page: space } = this;

    hotkey.addListener(HOTKEYS.BACKSPACE, this._handleBackspace.bind(this));
    hotkey.addListener(HOTKEYS.H1, () =>
      this._updateType('affine:paragraph', 'h1', space)
    );
    hotkey.addListener(HOTKEYS.H2, () =>
      this._updateType('affine:paragraph', 'h2', space)
    );
    hotkey.addListener(HOTKEYS.H3, () =>
      this._updateType('affine:paragraph', 'h3', space)
    );
    hotkey.addListener(HOTKEYS.H4, () =>
      this._updateType('affine:paragraph', 'h4', space)
    );
    hotkey.addListener(HOTKEYS.H5, () =>
      this._updateType('affine:paragraph', 'h5', space)
    );
    hotkey.addListener(HOTKEYS.H6, () =>
      this._updateType('affine:paragraph', 'h6', space)
    );
    hotkey.addListener(HOTKEYS.NUMBERED_LIST, () =>
      this._updateType('affine:list', 'numbered', space)
    );
    hotkey.addListener(HOTKEYS.BULLETED, () =>
      this._updateType('affine:list', 'bulleted', space)
    );
    hotkey.addListener(HOTKEYS.TEXT, () =>
      this._updateType('affine:paragraph', 'text', space)
    );

    bindCommonHotkey(space);
  }

  private _updateType(flavour: string, type: string, space: Page): void {
    updateSelectedTextType(flavour, type, space);
  }

  private _removeHotkeys() {
    hotkey.removeListener(
      [
        HOTKEYS.BACKSPACE,
        HOTKEYS.H1,
        HOTKEYS.H2,
        HOTKEYS.H3,
        HOTKEYS.H4,
        HOTKEYS.H5,
        HOTKEYS.H6,
        HOTKEYS.SHIFT_DOWN,
        HOTKEYS.NUMBERED_LIST,
        HOTKEYS.BULLETED,
        HOTKEYS.TEXT,
      ],
      this.flavour
    );
    removeCommonHotKey();
  }

  private _handleBackspace(e: KeyboardEvent) {
    if (this._selection.blockSelectionState.type === 'single') {
      handleBackspace(this.page, e);
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
    if (changedProperties.has('mouseRoot') && changedProperties.has('page')) {
      this._selection = new EdgelessSelectionManager(this);
    }
    if (changedProperties.has('mouseMode')) {
      this._selection.mouseMode = this.mouseMode;
    }
    super.update(changedProperties);
  }

  firstUpdated() {
    // TODO: listen to new children
    this.model.children.forEach(group => {
      group.propsUpdated.on(() => this._selection.syncBlockSelectionRect());
    });

    this.signals.viewportUpdated.on(() => {
      this._selection.syncBlockSelectionRect();
      this.requestUpdate();
    });
    this.signals.hoverUpdated.on(() => this.requestUpdate());
    this.signals.updateSelection.on(() => this.requestUpdate());
    this.signals.shapeUpdated.on(() => this.requestUpdate());
    this._historyDisposable = this.page.signals.historyUpdated.on(() => {
      this._clearSelection();
    });

    this._bindHotkeys();

    tryUpdateGroupSize(this.page, this.viewport.zoom);
    this.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      tryUpdateGroupSize(this.page, this.viewport.zoom);
    });

    requestAnimationFrame(() => {
      this._initViewport();
      this.requestUpdate();
    });

    // XXX: should be called after rich text components are mounted
    this._clearSelection();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.signals.updateSelection.dispose();
    this.signals.viewportUpdated.dispose();
    this.signals.hoverUpdated.dispose();
    this.signals.shapeUpdated.dispose();
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
    const selectionState = this._selection.blockSelectionState;
    const { zoom } = this.viewport;
    const selectionRect = EdgelessFrameSelectionRect(frameSelectionRect);
    const hoverRect = EdgelessHoverRect(_selection.hoverState, zoom);

    return html`
      <style></style>
      <div class="affine-edgeless-page-block-container">
        ${childrenContainer} ${hoverRect} ${selectionRect}
        ${selectionState.type !== 'none'
          ? html`<edgeless-selected-rect
              .state=${selectionState}
              .rect=${selectionState.rect}
              .zoom=${zoom}
              .readonly=${this.readonly}
            ></edgeless-selected-rect>`
          : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-page': EdgelessPageBlockComponent;
  }
}

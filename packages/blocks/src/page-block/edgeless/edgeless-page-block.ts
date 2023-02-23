/// <reference types="vite/client" />
import './toolbar/edgeless-toolbar-with-flag.js';

import { BLOCK_ID_ATTR, HOTKEYS } from '@blocksuite/global/config';
import type { XYWH } from '@blocksuite/phasor';
import { SurfaceManager } from '@blocksuite/phasor';
import { DisposableGroup, Page, Signal } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  BlockHost,
  hotkey,
  resetNativeSelection,
} from '../../__internal__/index.js';
import { getService } from '../../__internal__/service.js';
import { NonShadowLitElement } from '../../__internal__/utils/lit.js';
import type {
  FrameBlockModel,
  MouseMode,
  PageBlockModel,
} from '../../index.js';
import type { SurfaceBlockModel } from '../../surface-block/surface-model.js';
import {
  bindCommonHotkey,
  handleDown,
  handleMultiBlockBackspace,
  handleUp,
  removeCommonHotKey,
  tryUpdateFrameSize,
} from '../utils/index.js';
import {
  EdgelessBlockChildrenContainer,
  EdgelessFrameSelectionRect,
  EdgelessHoverRect,
} from './components.js';
import {
  EdgelessSelectionManager,
  EdgelessSelectionState,
  ViewportState,
} from './selection-manager.js';
import type { EdgelessToolbarWithFlag } from './toolbar/edgeless-toolbar-with-flag.js';

export interface EdgelessContainer extends HTMLElement {
  readonly page: Page;
  readonly viewport: ViewportState;
  readonly mouseRoot: HTMLElement;
  readonly signals: {
    hoverUpdated: Signal;
    viewportUpdated: Signal;
    updateSelection: Signal<EdgelessSelectionState>;
    shapeUpdated: Signal;
  };
}

@customElement('affine-edgeless-page')
export class EdgelessPageBlockComponent
  extends NonShadowLitElement
  implements EdgelessContainer, BlockHost
{
  static styles = css`
    .affine-edgeless-page-block-container {
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
      height: 100%;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-edgeless-text-color);
      font-weight: 400;
    }

    .affine-edgeless-surface-block-container {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .affine-surface-canvas {
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;
      pointer-events: none;
    }
  `;

  flavour = 'edgeless' as const;

  @property()
  showGrid = false;

  @property()
  page!: Page;

  @property()
  readonly = false;

  @property()
  mouseRoot!: HTMLElement;

  @property({ hasChanged: () => true })
  pageModel!: PageBlockModel;

  @property({ hasChanged: () => true })
  surfaceModel!: SurfaceBlockModel;

  @state()
  mouseMode: MouseMode = {
    type: 'default',
  };

  @query('.affine-surface-canvas')
  private _canvas!: HTMLCanvasElement;

  signals = {
    viewportUpdated: new Signal(),
    updateSelection: new Signal<EdgelessSelectionState>(),
    hoverUpdated: new Signal(),
    shapeUpdated: new Signal(),
    mouseModeUpdated: new Signal<MouseMode>(),
  };

  surface!: SurfaceManager;

  viewport = new ViewportState();

  getService = getService;

  private _disposables = new DisposableGroup();
  private _selection!: EdgelessSelectionManager;

  @query('edgeless-toolbar-with-flag')
  private _toolbar!: EdgelessToolbarWithFlag;

  private _bindHotkeys() {
    hotkey.addListener(HOTKEYS.BACKSPACE, this._handleBackspace);
    hotkey.addListener(HOTKEYS.UP, e => handleUp(e));
    hotkey.addListener(HOTKEYS.DOWN, e => handleDown(e));
    bindCommonHotkey(this.page);
  }

  private _removeHotkeys() {
    hotkey.removeListener(Object.values(HOTKEYS), this.flavour);

    removeCommonHotKey();
  }

  private _handleBackspace = (e: KeyboardEvent) => {
    if (this._selection.blockSelectionState.type === 'single') {
      // const selectedBlock = this._selection.blockSelectionState.selected;
      // if (selectedBlock.flavour === 'affine:shape') {
      //   this.page.captureSync();
      //   this.page.deleteBlock(selectedBlock);
      //   // TODO: cleanup state instead of create a instance
      //   this._selection = new EdgelessSelectionManager(this);
      //   this.signals.updateSelection.emit({
      //     type: 'none',
      //   });
      // } else {
      //   handleMultiBlockBackspace(this.page, e);
      // }
      handleMultiBlockBackspace(this.page, e);
    }
  };

  private _initViewport() {
    const bound = this.mouseRoot.getBoundingClientRect();
    this.viewport.setSize(bound.width, bound.height);

    const frame = this.pageModel.children[0] as FrameBlockModel;
    const [modelX, modelY, modelW, modelH] = JSON.parse(frame.xywh) as XYWH;
    this.viewport.setCenter(modelX + modelW / 2, modelY + modelH / 2);
  }

  private _clearSelection() {
    requestAnimationFrame(() => {
      if (!this._selection.isActive) {
        resetNativeSelection(null);
      }
    });
  }

  private _syncSurfaceViewport() {
    this.surface.setViewport(
      this.viewport.centerX,
      this.viewport.centerY,
      this.viewport.zoom
    );
  }

  // Should be called in requestAnimationFrame,
  // so as to avoid DOM mutation in SurfaceManager constructor
  private _initSurface() {
    const { page } = this;
    const yContainer = page.ySurfaceContainer;
    this.surface = new SurfaceManager(this._canvas, yContainer);
    this._syncSurfaceViewport();
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
    // this._initEdgelessToolBar();
    // TODO: listen to new children
    this.pageModel.children.forEach(frame => {
      frame.propsUpdated.on(() => this._selection.syncSelectionRect());
    });

    this.signals.viewportUpdated.on(() => {
      this.style.setProperty('--affine-zoom', `${this.viewport.zoom}`);

      this._syncSurfaceViewport();

      this._selection.syncSelectionRect();
      this.requestUpdate();
    });
    this.signals.hoverUpdated.on(() => this.requestUpdate());
    this.signals.updateSelection.on(() => this.requestUpdate());
    this.signals.shapeUpdated.on(() => this.requestUpdate());
    this.signals.mouseModeUpdated.on(mouseMode => (this.mouseMode = mouseMode));
    const historyDisposable = this.page.signals.historyUpdated.on(() => {
      this._clearSelection();
      this.requestUpdate();
    });
    this._disposables.add(historyDisposable);
    this._bindHotkeys();

    tryUpdateFrameSize(this.page, this.viewport.zoom);

    this.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      tryUpdateFrameSize(this.page, this.viewport.zoom);
    });

    requestAnimationFrame(() => {
      this._initViewport();
      this._initSurface();
      this.requestUpdate();
    });

    // XXX: should be called after rich text components are mounted
    this._clearSelection();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.signals.updateSelection.dispose();
    this.signals.viewportUpdated.dispose();
    this.signals.hoverUpdated.dispose();
    this.signals.shapeUpdated.dispose();
    this.signals.mouseModeUpdated.dispose();
    this._disposables.dispose();
    this._selection.dispose();
    this.surface.dispose();
    this._removeHotkeys();
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.pageModel.id);

    const childrenContainer = EdgelessBlockChildrenContainer(
      this.pageModel,
      this,
      this.viewport
    );

    const { _selection, viewport, page } = this;
    const { frameSelectionRect } = _selection;
    const selectionState = this._selection.blockSelectionState;
    const { zoom, viewportX, viewportY } = this.viewport;
    const selectionRect = EdgelessFrameSelectionRect(frameSelectionRect);
    const hoverRect = EdgelessHoverRect(_selection.hoverState, zoom);

    const translateX = -viewportX * zoom;
    const translateY = -viewportY * zoom;

    const gridStyle = {
      backgroundImage:
        'linear-gradient(#cccccc66 1px, transparent 1px),linear-gradient(90deg, #cccccc66 1px, transparent 1px)',
    };
    const defaultStyle = {};
    const style = this.showGrid ? gridStyle : defaultStyle;

    return html`
      <div class="affine-edgeless-surface-block-container">
        <canvas class="affine-surface-canvas"></canvas>
      </div>
      <div class="affine-edgeless-page-block-container">
        <style>
          .affine-block-children-container.edgeless {
            padding-left: 0;
            position: relative;
            overflow: hidden;
            height: 100%;
            background-size: ${20 * this.viewport.zoom}px
              ${20 * this.viewport.zoom}px;
            background-position: ${translateX}px ${translateY}px;
            background-color: #fff;
          }
        </style>
        <div
          class="affine-block-children-container edgeless"
          style=${styleMap(style)}
        >
          ${childrenContainer}
        </div>
        ${hoverRect} ${selectionRect}
        ${selectionState.type !== 'none'
          ? html`
              <edgeless-selected-rect
                .page=${page}
                .viewport=${viewport}
                .state=${selectionState}
                .rect=${selectionState.rect}
                .zoom=${zoom}
                .readonly=${this.readonly}
                .surface=${this.surface}
              ></edgeless-selected-rect>
            `
          : null}
      </div>
      <edgeless-toolbar-with-flag
        .mouseMode=${this.mouseMode}
        .edgeless=${this}
        .mouseRoot=${this.mouseRoot}
      ></edgeless-toolbar-with-flag>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-page': EdgelessPageBlockComponent;
  }
}

/// <reference types="vite/client" />
import './toolbar/edgeless-toolbar.js';
import './view-control-bar.js';

import { BLOCK_ID_ATTR, HOTKEYS } from '@blocksuite/global/config';
import { deserializeXYWH } from '@blocksuite/phasor';
import { SurfaceManager } from '@blocksuite/phasor';
import { DisposableGroup, Page, Slot } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
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
  EdgelessDraggingArea,
  EdgelessHoverRect,
} from './components.js';
import {
  EdgelessSelectionManager,
  EdgelessSelectionState,
} from './selection-manager.js';

export interface EdgelessContainer extends HTMLElement {
  readonly page: Page;
  readonly surface: SurfaceManager;
  readonly slots: {
    hoverUpdated: Slot;
    viewportUpdated: Slot;
    updateSelection: Slot<EdgelessSelectionState>;
    surfaceUpdated: Slot;
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

    .affine-edgeless-surface-block-container canvas {
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

  @property({ hasChanged: () => true })
  pageModel!: PageBlockModel;

  @property({ hasChanged: () => true })
  surfaceModel!: SurfaceBlockModel;

  @property()
  mouseMode: MouseMode = {
    type: 'default',
  };

  @state()
  private _toolbarEnabled = false;

  @query('.affine-edgeless-surface-block-container')
  private _surfaceContainer!: HTMLDivElement;

  slots = {
    viewportUpdated: new Slot(),
    updateSelection: new Slot<EdgelessSelectionState>(),
    hoverUpdated: new Slot(),
    surfaceUpdated: new Slot(),
    mouseModeUpdated: new Slot<MouseMode>(),
  };

  surface!: SurfaceManager;

  getService = getService;

  private _disposables = new DisposableGroup();
  private _selection!: EdgelessSelectionManager;

  // when user enters pan mode by pressing 'Space',
  // we should roll back to the last mouse mode once user releases the key;
  private _enterPanMouseModeByShortcut = false;

  private _bindHotkeys() {
    hotkey.addListener(HOTKEYS.BACKSPACE, this._handleBackspace);
    hotkey.addListener(HOTKEYS.UP, e => handleUp(e, this.page));
    hotkey.addListener(HOTKEYS.DOWN, e => handleDown(e, this.page));
    hotkey.addListener(HOTKEYS.SPACE, this._handleSpace, { keyup: true });
    bindCommonHotkey(this.page);
  }

  private _removeHotkeys() {
    hotkey.removeListener(Object.values(HOTKEYS), this.flavour);

    removeCommonHotKey();
  }

  private _handleBackspace = (e: KeyboardEvent) => {
    if (this._selection.blockSelectionState.type === 'single') {
      const { selected } = this._selection.blockSelectionState;

      if (this.surface.hasElement(selected.id)) {
        this.surface.removeElement(selected.id);
        this._selection.currentController.clearSelection();
        this.slots.updateSelection.emit(this._selection.blockSelectionState);
        return;
      }
      handleMultiBlockBackspace(this.page, e);
    }
  };

  private _handleSpace = (event: KeyboardEvent) => {
    const { mouseMode, lastMouseMode, blockSelectionState } = this._selection;
    if (event.type === 'keydown') {
      if (mouseMode.type === 'pan') {
        return;
      }

      // when user is editing, shouldn't enter pan mode
      if (
        mouseMode.type === 'default' &&
        blockSelectionState.type === 'single' &&
        blockSelectionState.active
      ) {
        return;
      }

      this.mouseMode = { type: 'pan' };
      this._enterPanMouseModeByShortcut = true;
    }
    if (event.type === 'keyup') {
      if (
        mouseMode.type === 'pan' &&
        this._enterPanMouseModeByShortcut &&
        lastMouseMode
      ) {
        this.mouseMode = lastMouseMode;
      }
    }
  };

  private _clearSelection() {
    requestAnimationFrame(() => {
      if (!this._selection.isActive) {
        resetNativeSelection(null);
      }
    });
  }

  // just init surface, attach to dom later
  private _initSurface() {
    const { page } = this;
    const yContainer = page.ySurfaceContainer;
    this.surface = new SurfaceManager(yContainer);

    const frame = this.pageModel.children[0] as FrameBlockModel;
    const [modelX, modelY, modelW, modelH] = deserializeXYWH(frame.xywh);
    this.surface.viewport.setCenter(modelX + modelW / 2, modelY + modelH / 2);
  }

  private _handleToolbarFlag() {
    const clientID = this.page.doc.clientID;

    this._toolbarEnabled =
      this.page.awarenessStore.getFlag('enable_edgeless_toolbar') ?? false;

    this._disposables.add(
      this.page.awarenessStore.slots.update.subscribe(
        msg => msg.state?.flags.enable_edgeless_toolbar,
        enable => {
          this._toolbarEnabled = enable ?? false;
        },
        {
          filter: msg => msg.id === clientID,
        }
      )
    );
  }

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('page')) {
      this._initSurface();
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
      frame.propsUpdated.on(() => this._selection.syncDraggingArea());
    });

    this.slots.viewportUpdated.on(() => {
      this.style.setProperty('--affine-zoom', `${this.surface.viewport.zoom}`);

      this._selection.syncDraggingArea();
      this.requestUpdate();
    });
    this.slots.hoverUpdated.on(() => this.requestUpdate());
    this.slots.updateSelection.on(() => this.requestUpdate());
    this.slots.surfaceUpdated.on(() => this.requestUpdate());
    this.slots.mouseModeUpdated.on(mouseMode => (this.mouseMode = mouseMode));

    const historyDisposable = this.page.slots.historyUpdated.on(() => {
      this._clearSelection();
      this.requestUpdate();
    });
    this._disposables.add(historyDisposable);
    this._bindHotkeys();

    tryUpdateFrameSize(this.page, this.surface.viewport.zoom);

    this.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      tryUpdateFrameSize(this.page, this.surface.viewport.zoom);
    });

    requestAnimationFrame(() => {
      // Should be called in requestAnimationFrame,
      // so as to avoid DOM mutation in SurfaceManager constructor
      this.surface.attach(this._surfaceContainer);
      // Due to change `this._toolbarEnabled` in this function
      this._handleToolbarFlag();
      this.requestUpdate();
    });

    // XXX: should be called after rich text components are mounted
    this._clearSelection();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.slots.updateSelection.dispose();
    this.slots.viewportUpdated.dispose();
    this.slots.hoverUpdated.dispose();
    this.slots.surfaceUpdated.dispose();
    this.slots.mouseModeUpdated.dispose();
    this._disposables.dispose();
    this._selection.dispose();
    this.surface.dispose();
    this._removeHotkeys();
  }

  render() {
    requestAnimationFrame(() => {
      this._selection.refreshRemoteSelection();
    });

    this.setAttribute(BLOCK_ID_ATTR, this.pageModel.id);

    const { viewport } = this.surface;

    const childrenContainer = EdgelessBlockChildrenContainer(
      this.pageModel,
      this,
      this.surface.viewport
    );

    const { _selection, page } = this;
    const selectionState = _selection.blockSelectionState;
    const { zoom, viewportX, viewportY } = viewport;
    const draggingArea = EdgelessDraggingArea(_selection.draggingArea);
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
        <!-- attach canvas later in Phasor -->
      </div>
      <div class="affine-edgeless-page-block-container">
        <style>
          .affine-block-children-container.edgeless {
            padding-left: 0;
            position: relative;
            overflow: hidden;
            height: 100%;
            background-size: ${20 * zoom}px ${20 * zoom}px;
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
        ${hoverRect} ${draggingArea}
        ${selectionState.type !== 'none'
          ? html`
              <edgeless-selected-rect
                .page=${page}
                .viewport=${viewport}
                .state=${selectionState}
                .rect=${selectionState.rect}
                .zoom=${zoom}
                .surface=${this.surface}
              ></edgeless-selected-rect>
            `
          : null}
      </div>
      ${this._toolbarEnabled
        ? html`
            <edgeless-toolbar
              .mouseMode=${this.mouseMode}
              .edgeless=${this}
            ></edgeless-toolbar>
          `
        : nothing}
      <edgeless-view-control-bar
        .edgeless=${this}
        .zoom=${zoom}
      ></edgeless-view-control-bar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-page': EdgelessPageBlockComponent;
  }
}

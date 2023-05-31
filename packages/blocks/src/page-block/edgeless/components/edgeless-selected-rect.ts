import './component-toolbar/component-toolbar.js';

import { WithDisposable } from '@blocksuite/lit';
import type { Bound } from '@blocksuite/phasor';
import {
  type ConnectorElement,
  serializeXYWH,
  TextElement,
} from '@blocksuite/phasor';
import { deserializeXYWH, SurfaceManager } from '@blocksuite/phasor';
import { Page } from '@blocksuite/store';
import type { Instance as PopperInstance } from '@popperjs/core';
import { createPopper } from '@popperjs/core';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessSelectionSlots } from '../edgeless-page-block.js';
import type {
  EdgelessSelectionState,
  Selectable,
} from '../selection-manager.js';
import {
  FRAME_MIN_HEIGHT,
  FRAME_MIN_WIDTH,
  handleElementChangedEffectForConnector,
  isTopLevelBlock,
  stopPropagation,
} from '../utils.js';
import type { EdgelessComponentToolbar } from './component-toolbar/component-toolbar.js';
import type { HandleDirection } from './resize-handles.js';
import { ResizeHandles, type ResizeMode } from './resize-handles.js';
import { HandleResizeManager } from './resize-manager.js';
import { SingleConnectorHandles } from './single-connector-handles.js';
import {
  getCommonRectStyle,
  getSelectableBounds,
  getSelectedRect,
} from './utils.js';

@customElement('edgeless-selected-rect')
export class EdgelessSelectedRect extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      user-select: none;
    }

    .affine-edgeless-selected-rect {
      position: absolute;
      border-radius: 0;
      pointer-events: none;
      box-sizing: border-box;
      z-index: 1;
      border: var(--affine-border-width) solid var(--affine-blue);
    }

    .affine-edgeless-selected-rect > [aria-label^='handle'] {
      position: absolute;
      width: 12px;
      height: 12px;
      box-sizing: border-box;
      border-radius: 6px;
      z-index: 10;
      border: 2px var(--affine-blue) solid;
      background: white;
      pointer-events: auto;
      user-select: none;
      outline: none;

      /**
       * Fix: pointerEvent stops firing after a short time.
       * When a gesture is started, the browser intersects the touch-action values of the touched element and its ancestors,
       * up to the one that implements the gesture (in other words, the first containing scrolling element)
       * https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
       */
      touchaction: none;
    }

    .affine-edgeless-selected-rect > [aria-label='handle-top-left'] {
      cursor: nwse-resize;
      left: -6px;
      top: -6px;
    }

    .affine-edgeless-selected-rect > [aria-label='handle-top-right'] {
      cursor: nesw-resize;
      top: -6px;
      right: -6px;
    }

    .affine-edgeless-selected-rect > [aria-label='handle-bottom-right'] {
      cursor: nwse-resize;
      right: -6px;
      bottom: -6px;
    }

    .affine-edgeless-selected-rect > [aria-label='handle-bottom-left'] {
      cursor: nesw-resize;
      bottom: -6px;
      left: -6px;
    }

    .affine-edgeless-selected-rect > [aria-label='handle-left'],
    .affine-edgeless-selected-rect > [aria-label='handle-right'] {
      cursor: ew-resize;
      top: 0;
      bottom: 0;
      height: 100%;
      width: 6px;
      border: 0;
      background: transparent;
    }

    .affine-edgeless-selected-rect > [aria-label='handle-left'] {
      left: -3.5px;
    }

    .affine-edgeless-selected-rect > [aria-label='handle-right'] {
      right: -3.5px;
    }

    .affine-edgeless-selected-rect > [aria-label='handle-left']:after,
    .affine-edgeless-selected-rect > [aria-label='handle-right']:after {
      position: absolute;
      width: 12px;
      height: 12px;
      box-sizing: border-box;
      border-radius: 6px;
      z-index: 10;
      border: 2px var(--affine-blue) solid;
      content: '';
      top: calc(50% - 6px);
      background: white;
    }

    .affine-edgeless-selected-rect > [aria-label='handle-left']:after {
      left: -3px;
    }

    .affine-edgeless-selected-rect > [aria-label='handle-right']:after {
      right: -3px;
    }

    edgeless-component-toolbar {
      /* greater than handle */
      z-index: 11;
    }
  `;

  @property({ type: Page })
  page!: Page;

  @property({ type: SurfaceManager })
  surface!: SurfaceManager;

  @property({ type: Object })
  state!: EdgelessSelectionState;

  @property()
  slots!: EdgelessSelectionSlots;

  @query('.affine-edgeless-selected-rect')
  private _selectedRect!: HTMLDivElement;

  @query('edgeless-component-toolbar')
  private _componentToolbar?: EdgelessComponentToolbar;

  private _componentToolbarPopper: PopperInstance | null = null;

  private _lock = false;
  private _resizeManager: HandleResizeManager;

  constructor() {
    super();
    this._resizeManager = new HandleResizeManager(
      this._onDragMove,
      this._onDragEnd
    );
    this.addEventListener('mousedown', stopPropagation);
  }

  get zoom() {
    return this.surface.viewport.zoom;
  }

  get resizeMode(): ResizeMode {
    if (
      this.state.selected.length === 1 &&
      this.state.selected[0].type === 'connector'
    ) {
      return 'none';
    }
    const hasBlockElement = this.state.selected.find(elem =>
      isTopLevelBlock(elem)
    );
    return hasBlockElement ? 'edge' : 'corner';
  }

  private _onDragMove = (newBounds: Map<string, Bound>) => {
    const selectedMap = new Map<string, Selectable>(
      this.state.selected.map(element => [element.id, element])
    );

    newBounds.forEach((bound, id) => {
      const element = selectedMap.get(id);
      if (!element) return;

      if (isTopLevelBlock(element)) {
        let frameX = bound.x;
        let frameY = bound.y;
        let frameW = bound.w;
        let frameH = deserializeXYWH(element.xywh)[3];
        // Limit the width of the selected frame
        if (frameW < FRAME_MIN_WIDTH) {
          frameW = FRAME_MIN_WIDTH;
          frameX = bound.x;
        }
        // Limit the height of the selected frame
        if (frameH < FRAME_MIN_HEIGHT) {
          frameH = FRAME_MIN_HEIGHT;
          frameY = bound.y;
        }
        const xywh = JSON.stringify([frameX, frameY, frameW, frameH]);
        this.page.updateBlock(element, { xywh });
      } else {
        if (element instanceof TextElement) {
          bound.w = element.w * (bound.h / element.h);
          this.surface.updateElement<'text'>(id, {
            xywh: serializeXYWH(bound.x, bound.y, bound.w, bound.h),
            fontSize: element.fontSize * (bound.h / element.h),
          });
        } else {
          this.surface.setElementBound(element.id, bound);
        }
      }
      handleElementChangedEffectForConnector(
        element,
        [element],
        this.surface,
        this.page
      );
    });

    this.requestUpdate();
  };

  private _onDragEnd = () => {
    if (this._lock) {
      this.page.captureSync();
    }
    this._lock = false;
  };

  override firstUpdated() {
    const { _disposables, slots } = this;
    _disposables.add(slots.viewportUpdated.on(() => this.requestUpdate()));

    this._componentToolbarPopper = this._componentToolbar
      ? createPopper(this._selectedRect, this._componentToolbar, {
          placement: 'top',
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 12],
              },
            },
            {
              name: 'flip',
              options: {
                fallbackPlacements: ['bottom'],
              },
            },
          ],
        })
      : null;
    _disposables.add(() => this._componentToolbarPopper?.destroy());

    if (this._componentToolbar) {
      // This hook is not waiting all children updated.
      // But children effect popper position. So we use ResizeObserver watching sizing change.
      const resizeObserver = new ResizeObserver(() =>
        this._componentToolbarPopper?.update()
      );
      resizeObserver.observe(this._componentToolbar);
      _disposables.add(() => resizeObserver.disconnect());
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    // when viewport updates, popper should update too.
    this._componentToolbarPopper?.update();
    super.updated(changedProperties);
  }

  override render() {
    if (
      this.state.selected.length === 0 ||
      (this.state.selected[0] instanceof TextElement && this.state.active)
    )
      return null;

    const { page, state, surface, resizeMode, _resizeManager } = this;
    const { active, selected } = state;
    const selectedRect = getSelectedRect(selected, surface.viewport);

    const style = getCommonRectStyle(selectedRect, active, true);

    const hasResizeHandles = !active && !page.readonly;
    const resizeHandles = hasResizeHandles
      ? ResizeHandles(
          resizeMode,
          (e: PointerEvent, direction: HandleDirection) => {
            const bounds = getSelectableBounds(this.state.selected);
            _resizeManager.onPointerDown(e, direction, bounds, this.zoom);
          }
        )
      : nothing;

    const connectorHandles =
      selected.length === 1 && selected[0].type === 'connector'
        ? SingleConnectorHandles(
            selected[0] as ConnectorElement,
            this.surface,
            this.page,
            () => {
              this.slots.selectionUpdated.emit({ ...state });
            }
          )
        : nothing;

    const componentToolbar = active
      ? nothing
      : html`<edgeless-component-toolbar
          .selected=${selected}
          .page=${this.page}
          .surface=${this.surface}
          .slots=${this.slots}
          .selectionState=${this.state}
        >
        </edgeless-component-toolbar>`;

    return html`
      <div class="affine-edgeless-selected-rect" style=${styleMap(style)}>
        ${resizeHandles} ${connectorHandles}
      </div>
      ${componentToolbar}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-selected-rect': EdgelessSelectedRect;
  }
}

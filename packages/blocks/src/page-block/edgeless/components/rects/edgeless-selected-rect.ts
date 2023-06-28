import '../component-toolbar/component-toolbar.js';

import { WithDisposable } from '@blocksuite/lit';
import type { Bound } from '@blocksuite/phasor';
import type { SurfaceManager } from '@blocksuite/phasor';
import {
  type ConnectorElement,
  deserializeXYWH,
  serializeXYWH,
  TextElement,
} from '@blocksuite/phasor';
import { matchFlavours, type Page } from '@blocksuite/store';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { stopPropagation } from '../../../../__internal__/utils/event.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import { NOTE_MIN_HEIGHT, NOTE_MIN_WIDTH } from '../../utils/consts.js';
import {
  getSelectableBounds,
  getSelectedRect,
  isTopLevelBlock,
} from '../../utils/query.js';
import type {
  EdgelessSelectionState,
  Selectable,
} from '../../utils/selection-manager.js';
import type { EdgelessComponentToolbar } from '../component-toolbar/component-toolbar.js';
import { SingleConnectorHandles } from '../connector/single-connector-handles.js';
import { handleElementChangedEffectForConnector } from '../connector/utils.js';
import type { HandleDirection } from '../resize/resize-handles.js';
import { ResizeHandles, type ResizeMode } from '../resize/resize-handles.js';
import { HandleResizeManager } from '../resize/resize-manager.js';

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
      border-radius: 8px;
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

    :host([disabled='true'])
      .affine-edgeless-selected-rect
      > [aria-label^='handle'] {
      pointer-events: none;
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
      width: 7px;
      height: 7px;
      box-sizing: border-box;
      border-radius: 6px;
      z-index: 10;
      border: 2px var(--affine-blue) solid;
      content: '';
      top: calc(50% - 6px);
      background: white;
    }

    .affine-edgeless-selected-rect > [aria-label='handle-left']:after {
      left: -1px;
    }

    .affine-edgeless-selected-rect > [aria-label='handle-right']:after {
      right: -1px;
    }

    edgeless-component-toolbar {
      /* greater than handle */
      z-index: 11;
    }
  `;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  surface!: SurfaceManager;

  @property({ type: Object })
  state!: EdgelessSelectionState;

  @property({ attribute: false })
  slots!: EdgelessSelectionSlots;

  @query('.affine-edgeless-selected-rect')
  private _selectedRect!: HTMLDivElement;

  @query('edgeless-component-toolbar')
  private _componentToolbar?: EdgelessComponentToolbar;

  private _lock = false;
  private _resizeManager: HandleResizeManager;

  constructor() {
    super();
    this._resizeManager = new HandleResizeManager(
      this._onDragMove,
      this._onDragEnd
    );
    this.addEventListener('pointerdown', stopPropagation);
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
    const { page, state, surface } = this;
    const selectedMap = new Map<string, Selectable>(
      state.selected.map(element => [element.id, element])
    );

    newBounds.forEach((bound, id) => {
      const element = selectedMap.get(id);
      if (!element) return;

      if (isTopLevelBlock(element)) {
        let noteX = bound.x;
        let noteY = bound.y;
        let noteW = bound.w;
        let noteH = deserializeXYWH(element.xywh)[3];
        // Limit the width of the selected note
        if (noteW < NOTE_MIN_WIDTH) {
          noteW = NOTE_MIN_WIDTH;
          noteX = bound.x;
        }
        // Limit the height of the selected note
        if (noteH < NOTE_MIN_HEIGHT) {
          noteH = NOTE_MIN_HEIGHT;
          noteY = bound.y;
        }
        page.updateBlock(element, {
          xywh: JSON.stringify([noteX, noteY, noteW, noteH]),
        });
      } else {
        if (element instanceof TextElement) {
          const p = bound.h / element.h;
          bound.w = element.w * p;
          surface.updateElement<'text'>(id, {
            xywh: serializeXYWH(bound.x, bound.y, bound.w, bound.h),
            fontSize: element.fontSize * p,
          });
        } else {
          surface.setElementBound(element.id, bound);
        }
      }
      handleElementChangedEffectForConnector(element, [element], surface, page);
    });

    this.requestUpdate();
  };

  private _onDragEnd = () => {
    if (this._lock) {
      this.page.captureSync();
    }
    this._lock = false;
  };

  private _computeComponentToolbarPosition() {
    const componentToolbar = this._componentToolbar;
    if (!componentToolbar) return;

    computePosition(this._selectedRect, componentToolbar, {
      placement: 'top-start',
      middleware: [
        offset({
          mainAxis: 8,
        }),
        flip(),
      ],
    }).then(({ x, y }) => {
      Object.assign(componentToolbar.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  override firstUpdated() {
    const { _disposables, slots } = this;
    _disposables.add(slots.viewportUpdated.on(() => this.requestUpdate()));
    _disposables.add(
      slots.pressShiftKeyUpdated.on(pressed =>
        this._resizeManager.onPressShiftKey(pressed)
      )
    );

    const componentToolbar = this._componentToolbar;
    if (!componentToolbar) return;

    autoUpdate(this._selectedRect, componentToolbar, () => {
      this._computeComponentToolbarPosition();
    });
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    // when viewport updates, popper should update too.
    this._computeComponentToolbarPosition();
  }

  override render() {
    const { state } = this;
    const { active, selected } = state;
    if (
      selected.length === 0 ||
      (active && selected[0] instanceof TextElement)
    ) {
      return nothing;
    }

    const isSingleHiddenNote =
      selected.length === 1 &&
      isTopLevelBlock(selected[0]) &&
      matchFlavours(selected[0], ['affine:note']) &&
      selected[0].hidden;

    const { page, surface, resizeMode, _resizeManager } = this;
    const selectedRect = getSelectedRect(selected, surface.viewport);

    const style = {
      '--affine-border-width': `${active ? 2 : 1}px`,
      left: selectedRect.x + 'px',
      top: selectedRect.y + 'px',
      width: selectedRect.width + 'px',
      height: selectedRect.height + 'px',
      borderStyle: isSingleHiddenNote ? 'dashed' : 'solid',
    };

    const hasResizeHandles = !active && !page.readonly;
    const resizeHandles = hasResizeHandles
      ? ResizeHandles(
          resizeMode,
          (e: PointerEvent, direction: HandleDirection) => {
            const bounds = getSelectableBounds(selected);
            _resizeManager.onPointerDown(
              e,
              direction,
              bounds,
              resizeMode,
              this.zoom
            );
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
          .selectionState=${state}
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

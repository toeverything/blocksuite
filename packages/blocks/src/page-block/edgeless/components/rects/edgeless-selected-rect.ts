import '../component-toolbar/component-toolbar.js';
import '../connector/connector-handle.js';

import { WithDisposable } from '@blocksuite/lit';
import {
  type Bound,
  ConnectorElement,
  deserializeXYWH,
  type IVec,
  normalizeDegAngle,
  normalizeShapeBound,
  type PhasorElement,
  serializeXYWH,
  ShapeElement,
  TextElement,
} from '@blocksuite/phasor';
import { matchFlavours } from '@blocksuite/store';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { stopPropagation } from '../../../../__internal__/utils/event.js';
import type { IPoint } from '../../../../__internal__/utils/types.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { NOTE_MIN_HEIGHT } from '../../utils/consts.js';
import {
  getSelectableBounds,
  getSelectedRect,
  isPhasorElementWithText,
  isTopLevelBlock,
} from '../../utils/query.js';
import type {
  EdgelessSelectionState,
  Selectable,
} from '../../utils/selection-manager.js';
import type { EdgelessComponentToolbar } from '../component-toolbar/component-toolbar.js';
import type { HandleDirection } from '../resize/resize-handles.js';
import { ResizeHandles, type ResizeMode } from '../resize/resize-handles.js';
import { HandleResizeManager } from '../resize/resize-manager.js';
import {
  calcAngle,
  calcAngleWithRotation,
  generateCursorUrl,
  rotateResizeCursor,
} from '../utils.js';

@customElement('edgeless-selected-rect')
export class EdgelessSelectedRect extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      user-select: none;
    }

    .affine-edgeless-selected-rect {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: 50% 50%;
      border-radius: 0;
      pointer-events: none;
      box-sizing: border-box;
      z-index: 1;
      border-color: var(--affine-blue);
      border-width: var(--affine-border-width);
      border-style: solid;
      border-radius: 8px;
      transform: translate(0, 0) rotate(0);
    }

    .affine-edgeless-selected-rect .handle {
      position: absolute;
      pointer-events: none;
      user-select: none;
      outline: none;

      /**
       * Fix: pointerEvent stops firing after a short time.
       * When a gesture is started, the browser intersects the touch-action values of the touched element and its ancestors,
       * up to the one that implements the gesture (in other words, the first containing scrolling element)
       * https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
       */
      touch-action: none;
    }

    .affine-edgeless-selected-rect[disabled='false'] .handle {
      pointer-events: auto;
    }

    .affine-edgeless-selected-rect .handle[aria-label^='top-'],
    .affine-edgeless-selected-rect .handle[aria-label^='bottom-'] {
      width: 18px;
      height: 18px;
      box-sizing: border-box;
      z-index: 10;
    }

    .affine-edgeless-selected-rect .handle[aria-label^='top-'] .resize,
    .affine-edgeless-selected-rect .handle[aria-label^='bottom-'] .resize {
      position: absolute;
      width: 12px;
      height: 12px;
      box-sizing: border-box;
      border-radius: 50%;
      border: 2px var(--affine-blue) solid;
      background: white;
    }

    .affine-edgeless-selected-rect .handle[aria-label^='top-'] .rotate,
    .affine-edgeless-selected-rect .handle[aria-label^='bottom-'] .rotate {
      position: absolute;
      width: 12px;
      height: 12px;
      box-sizing: border-box;
      background: transparent;
    }

    /* -18 + 6.5 */
    .affine-edgeless-selected-rect .handle[aria-label='top-left'] {
      left: -12px;
      top: -12px;
    }
    .affine-edgeless-selected-rect .handle[aria-label='top-left'] .resize {
      right: 0;
      bottom: 0;
    }
    .affine-edgeless-selected-rect .handle[aria-label='top-left'] .rotate {
      right: 6px;
      bottom: 6px;
    }

    .affine-edgeless-selected-rect .handle[aria-label='top-right'] {
      top: -12px;
      right: -12px;
    }
    .affine-edgeless-selected-rect .handle[aria-label='top-right'] .resize {
      left: 0;
      bottom: 0;
    }
    .affine-edgeless-selected-rect .handle[aria-label='top-right'] .rotate {
      left: 6px;
      bottom: 6px;
    }

    .affine-edgeless-selected-rect .handle[aria-label='bottom-right'] {
      right: -12px;
      bottom: -12px;
    }
    .affine-edgeless-selected-rect .handle[aria-label='bottom-right'] .resize {
      left: 0;
      top: 0;
    }
    .affine-edgeless-selected-rect .handle[aria-label='bottom-right'] .rotate {
      left: 6px;
      top: 6px;
    }

    .affine-edgeless-selected-rect .handle[aria-label='bottom-left'] {
      bottom: -12px;
      left: -12px;
    }
    .affine-edgeless-selected-rect .handle[aria-label='bottom-left'] .resize {
      right: 0;
      top: 0;
    }
    .affine-edgeless-selected-rect .handle[aria-label='bottom-left'] .rotate {
      right: 6px;
      top: 6px;
    }

    .affine-edgeless-selected-rect .handle[aria-label='left'],
    .affine-edgeless-selected-rect .handle[aria-label='right'] {
      top: 0;
      bottom: 0;
      height: 100%;
      width: 6px;
      border: 0;
      background: transparent;
    }
    /* calc(-1px - (6px - 1px) / 2) = -3.5px */
    .affine-edgeless-selected-rect .handle[aria-label='left'] {
      left: -3.5px;
    }
    .affine-edgeless-selected-rect .handle[aria-label='right'] {
      right: -3.5px;
    }

    .affine-edgeless-selected-rect .handle[aria-label='left'] .resize,
    .affine-edgeless-selected-rect .handle[aria-label='right'] .resize {
      width: 100%;
      height: 100%;
    }

    .affine-edgeless-selected-rect .handle[aria-label='left'] .resize:after,
    .affine-edgeless-selected-rect .handle[aria-label='right'] .resize:after {
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

    .affine-edgeless-selected-rect .handle[aria-label='left'] .resize:after {
      left: -0.5px;
    }
    .affine-edgeless-selected-rect .handle[aria-label='right'] .resize:after {
      right: -0.5px;
    }

    edgeless-component-toolbar {
      /* greater than handle */
      z-index: 11;
    }
  `;

  @property({ type: Object })
  state!: EdgelessSelectionState;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @query('.affine-edgeless-selected-rect')
  private _selectedRect!: HTMLDivElement;

  @query('edgeless-component-toolbar')
  private _componentToolbar!: EdgelessComponentToolbar;

  private _lock = false;
  private _resizeManager: HandleResizeManager;

  private _rotate = 0;
  private _cursorRotate = 0;

  constructor() {
    super();
    this._resizeManager = new HandleResizeManager(
      this._onDragStart,
      this._onDragMove,
      this._onDragRotate,
      this._onDragEnd
    );
    this.addEventListener('pointerdown', stopPropagation);
  }

  get page() {
    return this.edgeless.page;
  }

  get slots() {
    return this.edgeless.slots;
  }

  get surface() {
    return this.edgeless.surface;
  }

  get zoom() {
    return this.surface.viewport.zoom;
  }

  get resizeMode(): ResizeMode {
    if (this.state.selected.every(element => element.type === 'connector')) {
      return 'none';
    }
    const hasBlockElement = this.state.selected.find(isTopLevelBlock);
    return hasBlockElement ? 'edge' : 'corner';
  }

  private _onDragStart = () => {
    this._hideToolbar();
    this.requestUpdate();
  };

  private _onDragMove = (
    newBounds: Map<
      string,
      {
        bound: Bound;
      }
    >
  ) => {
    const { page, state, surface, _rotate, zoom } = this;
    const selectedMap = new Map<string, Selectable>(
      state.selected.map(element => [element.id, element])
    );

    let hasNotes = false;

    newBounds.forEach(({ bound }, id) => {
      const element = selectedMap.get(id);
      if (!element) return;

      if (isTopLevelBlock(element)) {
        hasNotes = true;

        let height = deserializeXYWH(element.xywh)[3];
        // // Limit the width of the selected note
        // if (noteW < NOTE_MIN_WIDTH) {
        //   noteW = NOTE_MIN_WIDTH;
        // }
        // Limit the height of the selected note
        if (height < NOTE_MIN_HEIGHT) {
          height = NOTE_MIN_HEIGHT;
        }
        page.updateBlock(element, {
          xywh: serializeXYWH(bound.x, bound.y, bound.w, height),
        });
      } else {
        if (element instanceof TextElement) {
          const p = bound.h / element.h;
          bound.w = element.w * p;
          surface.updateElement<'text'>(id, {
            xywh: bound.serialize(),
            fontSize: element.fontSize * p,
          });
        } else {
          if (element instanceof ShapeElement) {
            bound = normalizeShapeBound(element, bound);
          }
          surface.updateElement(id, {
            xywh: bound.serialize(),
          });
        }
      }
    });

    const currentRect = getSelectedRect(state.selected);
    const [x, y] = surface.viewport.toViewCoord(currentRect.x, currentRect.y);

    // notes resize observer
    if (!hasNotes) {
      this._selectedRect.style.height = `${currentRect.height * zoom}px`;
    }
    this._selectedRect.style.width = `${currentRect.width * zoom}px`;
    this._selectedRect.style.transform = `translate(${x}px, ${y}px) rotate(${_rotate}deg)`;
  };

  private _onDragRotate = (center: IPoint, delta: number) => {
    const {
      surface,
      state: { selected },
      _rotate,
      _resizeManager,
    } = this;
    const m = new DOMMatrix()
      .translateSelf(center.x, center.y)
      .rotateSelf(delta)
      .translateSelf(-center.x, -center.y);

    const elements = selected.filter(
      element => !isTopLevelBlock(element) && element.type !== 'connector'
    ) as PhasorElement[];

    elements.forEach(element => {
      const { id, rotate } = element;
      const [x, y, w, h] = element.deserializeXYWH();
      const center = new DOMPoint(x + w / 2, y + h / 2).matrixTransform(m);

      surface.updateElement(id, {
        xywh: serializeXYWH(center.x - w / 2, center.y - h / 2, w, h),
        rotate: normalizeDegAngle(rotate + delta),
      });
    });

    const angle = normalizeDegAngle(delta + _rotate);
    const { currentRect } = _resizeManager;
    const [x, y] = surface.viewport.toViewCoord(currentRect.x, currentRect.y);

    this._rotate = angle;
    this._selectedRect.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;

    this._updateCursor(true, { type: 'rotate', angle: delta });
  };

  private _onDragEnd = () => {
    if (this._lock) {
      this.page.captureSync();
    }
    this._lock = false;

    this._resizeManager.updateBounds(getSelectableBounds(this.state.selected));

    this._updateCursor(false);

    this._showToolbar();
  };

  private _updateCursor = (
    dragging: boolean,
    options?: {
      type: 'resize' | 'rotate';
      angle?: number;
      target?: HTMLElement;
      point?: IVec;
    }
  ) => {
    let cursor = 'default';

    if (dragging && options) {
      const { type, target, point } = options;
      let { angle } = options;
      if (type === 'rotate') {
        if (target && point) {
          angle = calcAngle(target, point, 45);
        }
        this._cursorRotate += angle || 0;
        cursor = generateCursorUrl(this._cursorRotate).toString();
      } else {
        if (this.resizeMode === 'edge') {
          cursor = 'ew';
        } else if (target && point) {
          angle = calcAngleWithRotation(
            target,
            point,
            this._resizeManager.currentRect,
            this._rotate,
            this.surface
          );

          cursor = rotateResizeCursor((angle * Math.PI) / 180);
        }
        cursor += '-resize';
      }
    } else {
      this._cursorRotate = 0;
    }

    this.slots.cursorUpdated.emit(cursor);
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

  private _updateSelectedRect() {
    const { _selectedRect } = this;
    if (!_selectedRect) return;

    const {
      state: { selected, active },
      surface,
      zoom,
    } = this;

    // in surface
    const rect = getSelectedRect(selected);

    // in viewport
    const [left, top] = surface.toViewCoord(rect.left, rect.top);
    const [width, height] = [rect.width * zoom, rect.height * zoom];

    let rotate = 0;
    if (selected.length === 1) {
      const element = selected[0];
      if (!isTopLevelBlock(element)) {
        rotate = element.rotate ?? 0;
      }
    }

    this._rotate = rotate;

    const isSingleHiddenNote =
      selected.length === 1 &&
      isTopLevelBlock(selected[0]) &&
      matchFlavours(selected[0], ['affine:note']) &&
      selected[0].hidden;

    _selectedRect.style.width = `${width}px`;
    _selectedRect.style.height = `${height}px`;
    _selectedRect.style.borderWidth = `${active ? 2 : 1}px`;
    _selectedRect.style.borderStyle = isSingleHiddenNote ? 'dashed' : 'solid';
    _selectedRect.style.transform = `translate(${left}px, ${top}px) rotate(${rotate}deg)`;
  }

  private _showToolbar() {
    this._componentToolbar.selectionState = this.state;
    this._componentToolbar.setAttribute('data-show', '');
  }

  private _hideToolbar() {
    this._componentToolbar?.removeAttribute('data-show');
  }

  override firstUpdated() {
    const { _disposables, slots } = this;

    _disposables.add(
      // vewport zooming / scrolling
      slots.viewportUpdated.on(() => {
        const {
          _resizeManager,
          _rotate,
          resizeMode,
          zoom,
          state: { selected },
        } = this;
        this._updateSelectedRect();
        _resizeManager.updateState(
          resizeMode,
          _rotate,
          zoom,
          getSelectedRect(selected)
        );
        _resizeManager.updateBounds(getSelectableBounds(selected));
        this._computeComponentToolbarPosition();
      })
    );
    _disposables.add(
      slots.selectedRectUpdated.on(action => {
        const { _selectedRect } = this;
        if (!_selectedRect) return;

        const {
          _resizeManager,
          _rotate,
          zoom,
          surface,
          state: { selected },
        } = this;

        switch (action.type) {
          case 'select': {
            const { dragging } = action;
            _selectedRect.setAttribute('disabled', dragging ? 'true' : 'false');
            break;
          }
          case 'move': {
            const { delta, dragging } = action;
            _selectedRect.setAttribute('disabled', dragging ? 'true' : 'false');

            if (delta) {
              const { left, top } = _resizeManager.updateRect(delta);
              const [x, y] = surface.toViewCoord(left, top);
              _selectedRect.style.transform = `translate(${x}px, ${y}px) rotate(${_rotate}deg)`;
            }

            if (dragging) {
              if (delta?.x || delta?.y) {
                this._hideToolbar();
              }
            } else {
              this._showToolbar();
              _resizeManager.updateBounds(getSelectableBounds(selected));
            }
            break;
          }
          case 'resize': {
            // frame resize
            const rect = getSelectedRect(selected);
            const width = rect.width * zoom;
            const height = rect.height * zoom;
            _selectedRect.style.width = `${width}px`;
            _selectedRect.style.height = `${height}px`;
            break;
          }
        }
      })
    );
    _disposables.add(
      slots.pressShiftKeyUpdated.on(pressed =>
        this._resizeManager.onPressShiftKey(pressed)
      )
    );

    const componentToolbar = this._componentToolbar;
    if (!componentToolbar) return;

    _disposables.add(
      autoUpdate(this._selectedRect, componentToolbar, () => {
        this._computeComponentToolbarPosition();
      })
    );
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('state')) {
      this._updateSelectedRect();
      this._resizeManager.updateState(
        this.resizeMode,
        this._rotate,
        this.zoom,
        getSelectedRect(this.state.selected)
      );
      this._resizeManager.updateBounds(
        getSelectableBounds(this.state.selected)
      );

      if (this.state.active) {
        this._hideToolbar();
      } else {
        this._showToolbar();
      }
      if (this.state.by !== 'selecting') {
        this._selectedRect?.setAttribute('disabled', 'false');
      }
    }

    this._computeComponentToolbarPosition();

    super.updated(changedProperties);
  }

  override render() {
    const { state } = this;
    const { active, selected } = state;
    if (
      selected.length === 0 ||
      (active && isPhasorElementWithText(selected[0]))
    ) {
      return nothing;
    }

    const { edgeless, page, resizeMode, slots, _resizeManager, _updateCursor } =
      this;

    const hasResizeHandles = !active && !page.readonly;
    const resizeHandles = hasResizeHandles
      ? ResizeHandles(
          resizeMode,
          (e: PointerEvent, direction: HandleDirection) =>
            _resizeManager.onPointerDown(e, direction),
          _updateCursor
        )
      : nothing;

    const connectorHandle =
      selected.length === 1 && selected[0] instanceof ConnectorElement
        ? html` <edgeless-connector-handle
            .connector=${selected[0]}
            .edgeless=${edgeless}
            .refresh=${() => slots.selectionUpdated.emit({ ...state })}
          ></edgeless-connector-handle>`
        : nothing;

    return html`
      <div class="affine-edgeless-selected-rect" disabled="true">
        ${resizeHandles} ${connectorHandle}
      </div>
      <edgeless-component-toolbar
        .selectionState=${state}
        .edgeless=${edgeless}
      >
      </edgeless-component-toolbar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-selected-rect': EdgelessSelectedRect;
  }
}

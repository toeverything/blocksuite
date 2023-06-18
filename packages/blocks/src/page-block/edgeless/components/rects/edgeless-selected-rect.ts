import '../component-toolbar/component-toolbar.js';

import { WithDisposable } from '@blocksuite/lit';
import {
  type Bound,
  type ConnectorElement,
  deserializeXYWH,
  type PhasorElement,
  serializeXYWH,
  type SurfaceManager,
  TextElement,
} from '@blocksuite/phasor';
import { type Page } from '@blocksuite/store';
import { autoUpdate, computePosition, flip, offset } from '@floating-ui/dom';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { stopPropagation } from '../../../../__internal__/utils/event.js';
import type { IPoint } from '../../../../__internal__/utils/types.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import { NOTE_MIN_HEIGHT } from '../../utils/consts.js';
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
      --top: 0px;
      --left: 0px;
      --rotate: 0deg;
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: 50% 50%;
      border-radius: 0;
      pointer-events: none;
      box-sizing: border-box;
      z-index: 1;
      border: var(--affine-border-width) solid var(--affine-blue);
      border-radius: 8px;
      transform: translate(var(--left), var(--top)) rotate(var(--rotate));
    }

    .affine-edgeless-selected-rect .handle {
      position: absolute;
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

    .affine-edgeless-selected-rect .handle[aria-label^='top-'],
    .affine-edgeless-selected-rect .handle[aria-label^='bottom-'] {
      width: 18px;
      height: 18px;
      box-sizing: border-box;
      z-index: 10;
      pointer-events: none;
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
      pointer-events: auto;
    }
    .affine-edgeless-selected-rect .handle .resize.nwse {
      cursor: nwse-resize;
    }
    .affine-edgeless-selected-rect .handle .resize.nesw {
      cursor: nesw-resize;
    }
    .affine-edgeless-selected-rect .handle .resize.ew {
      cursor: ew-resize;
    }

    .affine-edgeless-selected-rect .handle[aria-label^='top-'] .rotate,
    .affine-edgeless-selected-rect .handle[aria-label^='bottom-'] .rotate {
      position: absolute;
      width: 12px;
      height: 12px;
      box-sizing: border-box;
      background: red;
      pointer-events: auto;
    }

    :host([disabled='true']) .affine-edgeless-selected-rect .handle {
      pointer-events: none;
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

    /* calc((6px - 12px) / 2) = -3px */
    .affine-edgeless-selected-rect .handle[aria-label='left'] .resize:after {
      left: -3px;
    }
    .affine-edgeless-selected-rect .handle[aria-label='right'] .resize:after {
      right: -3px;
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
  private _componentToolbar!: EdgelessComponentToolbar;

  private _lock = false;
  private _resizeManager: HandleResizeManager;

  private _rotate = 0;

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
        flip: IPoint;
      }
    >
  ) => {
    const { page, state, surface, _rotate, _resizeManager, zoom } = this;
    const selectedMap = new Map<string, Selectable>(
      state.selected.map(element => [element.id, element])
    );

    let hasNotes = false;

    newBounds.forEach(({ bound, flip }, id) => {
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
            flipX: flip.x,
            flipY: flip.y,
          });
        } else {
          surface.updateElement(id, {
            xywh: bound.serialize(),
            flipX: flip.x,
            flipY: flip.y,
          });
        }
      }
      handleElementChangedEffectForConnector(element, [element], surface, page);
    });

    const { currentRect } = _resizeManager;
    const [x, y] = surface.viewport.toViewCoord(currentRect.x, currentRect.y);
    const { left, top, width, height } = new DOMRect(
      x,
      y,
      currentRect.width * zoom,
      currentRect.height * zoom
    );
    // notes resize observer
    if (!hasNotes) {
      this._selectedRect.style.height = `${height}px`;
    }
    this._selectedRect.style.width = `${width}px`;
    this._selectedRect.style.setProperty('--rotate', `${_rotate}deg`);
    this._selectedRect.style.setProperty('--top', `${top}px`);
    this._selectedRect.style.setProperty('--left', `${left}px`);
  };

  private _onDragRotate = (center: IPoint, delta: number) => {
    const {
      page,
      surface,
      state: { selected },
      _rotate,
    } = this;
    const matrix = new DOMMatrix()
      .translateSelf(center.x, center.y)
      .rotateSelf(delta)
      .translateSelf(-center.x, -center.y);

    const elements = selected.filter(
      element => !isTopLevelBlock(element)
    ) as PhasorElement[];

    elements.forEach(element => {
      const { id } = element;
      let { rotate = 0 } = element;
      const [x, y, w, h] = element.deserializeXYWH();
      const cx = x + w / 2;
      const cy = y + h / 2;

      const c = new DOMPoint(cx, cy).matrixTransform(matrix);

      rotate += delta;
      // normalize angle to positive value
      if (rotate < 0) rotate += 360;
      rotate %= 360;

      surface.updateElement(id, {
        xywh: serializeXYWH(c.x - w / 2, c.y - h / 2, w, h),
        rotate,
      });

      handleElementChangedEffectForConnector(element, [element], surface, page);
    });

    let angle = delta + _rotate;
    if (delta < 0) angle += 360;
    angle %= 360;

    this._rotate = angle;
    this._selectedRect.style.setProperty('--rotate', `${angle}deg`);
  };

  private _onDragEnd = () => {
    if (this._lock) {
      this.page.captureSync();
    }
    this._lock = false;

    this._resizeManager.updateBounds(getSelectableBounds(this.state.selected));

    this._showToolbar();
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

    _selectedRect.style.setProperty('--rotate', `${rotate}deg`);
    _selectedRect.style.setProperty('--top', `${top}px`);
    _selectedRect.style.setProperty('--left', `${left}px`);

    _selectedRect.style.setProperty(
      '--affine-border-width',
      `${active ? 2 : 1}px`
    );
    _selectedRect.style.backgroundColor =
      !active && selected ? 'var(--affine-hover-color)' : '';
    _selectedRect.style.width = `${width}px`;
    _selectedRect.style.height = `${height}px`;
  }

  override firstUpdated() {
    const { _disposables, slots } = this;

    _disposables.add(
      // vewport zooming / scrolling
      slots.viewportUpdated.on(() => {
        this._updateSelectedRect();
      })
    );
    _disposables.add(
      slots.selectedRectUpdated.on(action => {
        const {
          _selectedRect,
          _rotate,
          _resizeManager,
          zoom,
          surface,
          state: { selected },
        } = this;

        switch (action.type) {
          case 'drag': {
            const { delta, dragging } = action;
            if (dragging) {
              const rect = _resizeManager.updateRect({
                x: delta.x / zoom,
                y: delta.y / zoom,
              });
              const [x, y] = surface.toViewCoord(rect.x, rect.y);
              _selectedRect.style.setProperty('--rotate', `${_rotate}deg`);
              _selectedRect.style.setProperty('--left', `${x}px`);
              _selectedRect.style.setProperty('--top', `${y}px`);

              this._computeComponentToolbarPosition();
            } else {
              _resizeManager.updateBounds(getSelectableBounds(selected));
            }
            break;
          }
          case 'resize': {
            // frame resize
            const rect = getSelectedRect(selected);
            const width = rect.width * zoom;
            const height = rect.height * zoom;
            this._selectedRect.style.width = `${width}px`;
            this._selectedRect.style.height = `${height}px`;
            break;
          }
        }

        // this.requestUpdate();
      })
    );
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

    this._updateSelectedRect();
  }

  _showToolbar() {
    this._componentToolbar.selectionState = this.state;
    this._componentToolbar.selected = this.state.selected;
    this._componentToolbar.setAttribute('data-show', '');
  }

  _hideToolbar() {
    this._componentToolbar?.removeAttribute('data-show');
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
    }

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

    const { page, resizeMode, _resizeManager, slots, surface } = this;

    const hasResizeHandles = !active && !page.readonly;
    const resizeHandles = hasResizeHandles
      ? ResizeHandles(
          resizeMode,
          (e: PointerEvent, direction: HandleDirection) =>
            _resizeManager.onPointerDown(e, direction)
        )
      : nothing;

    const connectorHandles =
      selected.length === 1 && selected[0].type === 'connector'
        ? SingleConnectorHandles(
            selected[0] as ConnectorElement,
            surface,
            page,
            () => slots.selectionUpdated.emit({ ...state })
          )
        : nothing;

    return html`
      <div class="affine-edgeless-selected-rect">
        ${resizeHandles} ${connectorHandles}
      </div>
      <edgeless-component-toolbar
        .page=${page}
        .slots=${slots}
        .surface=${surface}
        .selected=${selected}
        .selectionState=${state}
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

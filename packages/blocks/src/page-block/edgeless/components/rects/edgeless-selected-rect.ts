import '../component-toolbar/component-toolbar.js';
import '../connector/connector-handle.js';
import '../auto-complete/edgeless-auto-complete.js';

import { pick } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { stopPropagation } from '../../../../__internal__/utils/event.js';
import { matchFlavours } from '../../../../__internal__/utils/model.js';
import type { IPoint } from '../../../../__internal__/utils/types.js';
import type { NoteBlockModel } from '../../../../index.js';
import {
  type Bound,
  ConnectorElement,
  deserializeXYWH,
  FrameElement,
  type IVec,
  normalizeDegAngle,
  normalizeShapeBound,
  type PhasorElement,
  serializeXYWH,
  ShapeElement,
  TextElement,
} from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import type { Selectable } from '../../services/tools-manager.js';
import { edgelessElementsBound } from '../../utils/bound-utils.js';
import { NOTE_MIN_HEIGHT } from '../../utils/consts.js';
import {
  getSelectableBounds,
  getSelectedRect,
  isPhasorElementWithText,
  isTopLevelBlock,
} from '../../utils/query.js';
import type { EdgelessComponentToolbar } from '../component-toolbar/component-toolbar.js';
import type { HandleDirection } from '../resize/resize-handles.js';
import { ResizeHandles, type ResizeMode } from '../resize/resize-handles.js';
import { HandleResizeManager } from '../resize/resize-manager.js';
import {
  calcAngle,
  calcAngleEdgeWithRotation,
  calcAngleWithRotation,
  generateCursorUrl,
  getResizeLabel,
  rotateResizeCursor,
} from '../utils.js';

export type SelectedRect = {
  left: number;
  top: number;
  width: number;
  height: number;
  borderWidth: number;
  borderStyle: string;
  borderRadius: number;
  rotate: number;
};

@customElement('edgeless-selected-rect')
export class EdgelessSelectedRect extends WithDisposable(LitElement) {
  // disable change-in-update warning
  static override enabledWarnings = [];
  static override styles = css`
    :host {
      display: block;
      user-select: none;
      contain: size layout;
      position: absolute;
      top: 0;
      left: 0;
    }

    .affine-edgeless-selected-rect {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: center center;
      border-radius: 0;
      pointer-events: none;
      box-sizing: border-box;
      z-index: 1;
      border-color: var(--affine-blue);
      border-width: var(--affine-border-width);
      border-style: solid;
      transform: translate(0, 0) rotate(0);
    }

    .affine-edgeless-selected-rect .handle {
      position: absolute;
      user-select: none;
      outline: none;
      pointer-events: auto;

      /**
       * Fix: pointerEvent stops firing after a short time.
       * When a gesture is started, the browser intersects the touch-action values of the touched element and its ancestors,
       * up to the one that implements the gesture (in other words, the first containing scrolling element)
       * https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
       */
      touch-action: none;
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

    .affine-edgeless-selected-rect .handle[aria-label='top'],
    .affine-edgeless-selected-rect .handle[aria-label='bottom'],
    .affine-edgeless-selected-rect .handle[aria-label='left'],
    .affine-edgeless-selected-rect .handle[aria-label='right'] {
      border: 0;
      background: transparent;
    }

    .affine-edgeless-selected-rect .handle[aria-label='left'],
    .affine-edgeless-selected-rect .handle[aria-label='right'] {
      top: 0;
      bottom: 0;
      height: 100%;
      width: 6px;
    }

    .affine-edgeless-selected-rect .handle[aria-label='top'],
    .affine-edgeless-selected-rect .handle[aria-label='bottom'] {
      left: 0;
      right: 0;
      width: 100%;
      height: 6px;
    }

    /* calc(-1px - (6px - 1px) / 2) = -3.5px */
    .affine-edgeless-selected-rect .handle[aria-label='left'] {
      left: -3.5px;
    }
    .affine-edgeless-selected-rect .handle[aria-label='right'] {
      right: -3.5px;
    }
    .affine-edgeless-selected-rect .handle[aria-label='top'] {
      top: -3.5px;
    }
    .affine-edgeless-selected-rect .handle[aria-label='bottom'] {
      bottom: -3.5px;
    }

    .affine-edgeless-selected-rect .handle[aria-label='top'] .resize,
    .affine-edgeless-selected-rect .handle[aria-label='bottom'] .resize,
    .affine-edgeless-selected-rect .handle[aria-label='left'] .resize,
    .affine-edgeless-selected-rect .handle[aria-label='right'] .resize {
      width: 100%;
      height: 100%;
    }

    .affine-edgeless-selected-rect .handle[aria-label='top'] .resize:after,
    .affine-edgeless-selected-rect .handle[aria-label='bottom'] .resize:after,
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
      background: white;
    }

    .affine-edgeless-selected-rect
      .handle[aria-label='top']
      .transparent-handle:after,
    .affine-edgeless-selected-rect
      .handle[aria-label='bottom']
      .transparent-handle:after,
    .affine-edgeless-selected-rect
      .handle[aria-label='left']
      .transparent-handle:after,
    .affine-edgeless-selected-rect
      .handle[aria-label='right']
      .transparent-handle:after {
      opacity: 0;
    }

    .affine-edgeless-selected-rect .handle[aria-label='left'] .resize:after,
    .affine-edgeless-selected-rect .handle[aria-label='right'] .resize:after {
      top: calc(50% - 6px);
    }

    .affine-edgeless-selected-rect .handle[aria-label='top'] .resize:after,
    .affine-edgeless-selected-rect .handle[aria-label='bottom'] .resize:after {
      left: calc(50% - 6px);
    }

    .affine-edgeless-selected-rect .handle[aria-label='left'] .resize:after {
      left: -0.5px;
    }
    .affine-edgeless-selected-rect .handle[aria-label='right'] .resize:after {
      right: -0.5px;
    }
    .affine-edgeless-selected-rect .handle[aria-label='top'] .resize:after {
      top: -0.5px;
    }
    .affine-edgeless-selected-rect .handle[aria-label='bottom'] .resize:after {
      bottom: -0.5px;
    }

    edgeless-component-toolbar {
      /* greater than handle */
      z-index: 11;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @query('edgeless-component-toolbar')
  private _componentToolbar!: EdgelessComponentToolbar;

  @query('.affine-edgeless-selected-rect')
  private _selectedRectEl!: HTMLDivElement;

  @state()
  private _selectedRect: SelectedRect = {
    width: 0,
    height: 0,
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: 0,
    left: 0,
    top: 0,
    rotate: 0,
  };

  @state()
  private _toolbarVisible = false;

  @state()
  private _toolbarPosition: {
    x: number;
    y: number;
  } = {
    x: 0,
    y: 0,
  };

  private _resizeManager: HandleResizeManager;
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
    this._disposables.add(
      this._resizeManager.slots.resizeEnd.on(() => {
        this.selection.elements.forEach(ele => {
          ele instanceof FrameElement &&
            this.surface.frame.calculateFrameColor(ele);
        });
      })
    );
  }

  get selection() {
    return this.edgeless.selectionManager;
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
    const elements = this.selection.elements;

    let isAllConnector = true;
    let isAllShapes = true;
    let hasNote = false;

    for (const element of elements) {
      if (isTopLevelBlock(element)) {
        hasNote = true;
      } else {
        if (element.type !== 'connector') isAllConnector = false;
        if (element.type !== 'shape') isAllShapes = false;
      }
    }

    if (hasNote) return 'edge';
    if (isAllConnector) return 'none';
    if (isAllShapes) return 'all';

    return 'corner';
  }

  private _shouldRenderSelection(elements?: Selectable[]) {
    elements = elements ?? this.selection.elements;

    return (
      elements.length > 0 &&
      (!this.selection.editing || !isPhasorElementWithText(elements[0]))
    );
  }

  private _onDragStart = () => {
    this._toolbarVisible = false;
    this._updateResizeManagerState(false);
  };

  private _onDragMove = (
    newBounds: Map<
      string,
      {
        bound: Bound;
      }
    >
  ) => {
    const { page, selection, surface } = this;
    const selectedMap = new Map<string, Selectable>(
      selection.elements.map(element => [element.id, element])
    );

    newBounds.forEach(({ bound }, id) => {
      const element = selectedMap.get(id);
      if (!element) return;

      if (isTopLevelBlock(element)) {
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
  };

  private _onDragRotate = (center: IPoint, delta: number) => {
    const { surface, selection } = this;
    const m = new DOMMatrix()
      .translateSelf(center.x, center.y)
      .rotateSelf(delta)
      .translateSelf(-center.x, -center.y);

    const elements = selection.elements.filter(
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

    this._updateCursor(true, { type: 'rotate', angle: delta });
  };

  private _onDragEnd = () => {
    this._updateCursor(false);
    this._toolbarVisible = true;
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
          const label = getResizeLabel(target);
          const { width, height, left, top } = this._selectedRect;
          if (
            label === 'top' ||
            label === 'bottom' ||
            label === 'left' ||
            label === 'right'
          ) {
            angle = calcAngleEdgeWithRotation(
              target,
              this._selectedRect.rotate
            );
          } else {
            angle = calcAngleWithRotation(
              target,
              point,
              new DOMRect(left, top, width, height),
              this._selectedRect.rotate
            );
          }
          cursor = rotateResizeCursor((angle * Math.PI) / 180);
        }
        cursor += '-resize';
      }
    } else {
      this._cursorRotate = 0;
    }

    this.slots.cursorUpdated.emit(cursor);
  };

  private async _updateToolbarPosition() {
    if (
      !this._toolbarVisible ||
      !this._shouldRenderSelection() ||
      this.page.readonly
    )
      return;

    if (!this._selectedRectEl || !this._componentToolbar) {
      await this.updateComplete;
    }

    if (this._componentToolbar.isUpdatePending)
      await this._componentToolbar.updateComplete;

    const componentToolbar = this._componentToolbar;
    const bound = edgelessElementsBound(this.selection.elements);

    const { viewport } = this.edgeless.surface;
    const [x, y] = viewport.toViewCoord(bound.x, bound.y);
    const rect = componentToolbar.getBoundingClientRect();
    const offset = 34;
    let top = y - rect.height - offset;
    top < 0 && (top = y + bound.h * viewport.zoom + offset);

    this._toolbarPosition = {
      x,
      y: top,
    };
  }

  private _updateSelectedRect() {
    const { surface, zoom, selection } = this;

    const elements = selection.elements;
    // in surface
    const rect = getSelectedRect(elements);

    // in viewport
    const [left, top] = surface.toViewCoord(rect.left, rect.top);
    const [width, height] = [rect.width * zoom, rect.height * zoom];

    let rotate = 0;
    if (elements.length === 1) {
      const element = elements[0];
      if (!isTopLevelBlock(element)) {
        rotate = element.rotate ?? 0;
      }
    }

    const isSingleNote =
      elements.length === 1 &&
      isTopLevelBlock(elements[0]) &&
      matchFlavours(elements[0], ['affine:note']);
    const isSingleHiddenNote =
      isSingleNote && (elements[0] as NoteBlockModel).hidden;

    this._selectedRect = {
      width,
      height,
      borderWidth: selection.editing ? 2 : 1,
      borderStyle: isSingleHiddenNote ? 'dashed' : 'solid',
      borderRadius: isSingleNote ? 8 * zoom : 0,
      left,
      top,
      rotate,
    };
  }

  /**
   * @param refresh indicate whether to completely refresh the state of resize manager, otherwise only update the position
   */
  private _updateResizeManagerState = (refresh: boolean) => {
    const {
      _resizeManager,
      _selectedRect,
      resizeMode,
      zoom,
      selection: { elements },
    } = this;

    const rect = getSelectedRect(elements);

    // if there are more than one element, we need to refresh the state of resize manager
    if (elements.length > 1) refresh = true;

    _resizeManager.updateState(
      resizeMode,
      _selectedRect.rotate,
      zoom,
      refresh ? undefined : rect,
      refresh ? rect : undefined
    );
    _resizeManager.updateBounds(getSelectableBounds(elements));
  };

  private _updateOnViewportChange = () => {
    this._updateSelectedRect();
  };

  private _updateOnSelectionChange = () => {
    this._updateSelectedRect();
    this._updateResizeManagerState(true);

    if (this.selection.editing) {
      this._toolbarVisible = false;
    } else {
      this._toolbarVisible = true;
    }
  };

  private _updateOnElementChange = (
    element: string | { id: string },
    fromRemote: boolean = false
  ) => {
    if (fromRemote && this._resizeManager.dragging) return;

    const id = typeof element === 'string' ? element : element.id;

    if (this.selection.has(id)) this._updateSelectedRect();
  };

  override firstUpdated() {
    const { _disposables, page, slots, selection, surface, edgeless } = this;

    _disposables.add(
      // viewport zooming / scrolling
      slots.viewportUpdated.on(this._updateOnViewportChange)
    );

    Object.values(
      pick(surface.slots, ['elementAdded', 'elementRemoved', 'elementUpdated'])
    ).forEach(slot => {
      _disposables.add(slot.on(this._updateOnElementChange));
    });

    _disposables.add(
      slots.pressShiftKeyUpdated.on(pressed =>
        this._resizeManager.onPressShiftKey(pressed)
      )
    );

    _disposables.add(selection.slots.updated.on(this._updateOnSelectionChange));
    _disposables.add(page.slots.blockUpdated.on(this._updateOnElementChange));
    _disposables.add(
      page.slots.yBlockUpdated.on(data => {
        this._updateOnElementChange(data, true);
      })
    );
    _disposables.add(
      edgeless.slots.readonlyUpdated.on(() => this.requestUpdate())
    );
  }

  protected override updated(
    _changedProperties: Map<PropertyKey, unknown>
  ): void {
    if (
      _changedProperties.has('_selectedRect') ||
      (_changedProperties.has('_toolbarVisible') && this._toolbarVisible)
    ) {
      this._updateToolbarPosition();
    }
  }

  private _canRotate() {
    return !this.selection.elements.some(ele => ele instanceof FrameElement);
  }

  override render() {
    const { selection } = this;
    const elements = selection.elements;

    if (!this._shouldRenderSelection(elements)) return nothing;

    const {
      edgeless,
      page,
      resizeMode,
      _resizeManager,
      _selectedRect,
      _toolbarPosition,
      _updateCursor,
    } = this;

    const hasResizeHandles = !selection.editing && !page.readonly;
    const resizeHandles = hasResizeHandles
      ? ResizeHandles(
          resizeMode,
          (e: PointerEvent, direction: HandleDirection) => {
            if (
              (<HTMLElement>e.target).classList.contains('rotate') &&
              !this._canRotate()
            )
              return;
            _resizeManager.onPointerDown(e, direction);
          },
          (
            dragging: boolean,
            options?: {
              type: 'resize' | 'rotate';
              angle?: number;
              target?: HTMLElement;
              point?: IVec;
            }
          ) => {
            if (options?.type === 'rotate' && !this._canRotate()) return;
            _updateCursor(dragging, options);
          }
        )
      : nothing;

    const connectorHandle =
      elements.length === 1 && elements[0] instanceof ConnectorElement
        ? html`<edgeless-connector-handle
            .connector=${elements[0]}
            .edgeless=${edgeless}
          ></edgeless-connector-handle>`
        : nothing;

    return html`
      ${page.readonly
        ? nothing
        : html`<edgeless-auto-complete
            .edgeless=${edgeless}
            .selectedRect=${_selectedRect}
          >
          </edgeless-auto-complete>`}
      <div
        class="affine-edgeless-selected-rect"
        style=${styleMap({
          width: `${_selectedRect.width}px`,
          height: `${_selectedRect.height}px`,
          borderWidth: `${_selectedRect.borderWidth}px`,
          borderStyle: _selectedRect.borderStyle,
          borderRadius: `${_selectedRect.borderRadius}px`,
          transform: `translate(${_selectedRect.left}px, ${_selectedRect.top}px) rotate(${_selectedRect.rotate}deg)`,
        })}
        disabled="true"
      >
        ${resizeHandles} ${connectorHandle}
      </div>
      ${this._toolbarVisible && !page.readonly
        ? html`<edgeless-component-toolbar
            style=${styleMap({
              left: `${_toolbarPosition.x}px`,
              top: `${_toolbarPosition.y}px`,
            })}
            .edgeless=${edgeless}
          >
          </edgeless-component-toolbar>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-selected-rect': EdgelessSelectedRect;
  }
}

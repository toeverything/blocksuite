import '../connector/connector-handle.js';
import '../auto-complete/edgeless-auto-complete.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { stopPropagation } from '../../../../_common/utils/event.js';
import { pickValues } from '../../../../_common/utils/iterable.js';
import { clamp } from '../../../../_common/utils/math.js';
import type {
  EdgelessElement,
  IPoint,
  Selectable,
} from '../../../../_common/utils/types.js';
import type { NoteBlockModel } from '../../../../models.js';
import {
  CanvasElementType,
  deserializeXYWH,
  GroupElement,
  normalizeTextBound,
} from '../../../../surface-block/index.js';
import {
  Bound,
  ConnectorElement,
  type IVec,
  normalizeDegAngle,
  normalizeShapeBound,
  serializeXYWH,
  ShapeElement,
  TextElement,
} from '../../../../surface-block/index.js';
import { getElementsWithoutGroup } from '../../../../surface-block/managers/group-manager.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import {
  NOTE_MIN_HEIGHT,
  NOTE_MIN_WIDTH,
  SELECTED_RECT_PADDING,
} from '../../utils/consts.js';
import {
  getSelectableBounds,
  getSelectedRect,
  isCanvasElement,
  isFrameBlock,
  isImageBlock,
  isNoteBlock,
} from '../../utils/query.js';
import { HandleDirection } from '../resize/resize-handles.js';
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
      z-index: 1;
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
      border-color: var('--affine-blue');
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
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @state()
  private _selectedRect: SelectedRect = {
    width: 0,
    height: 0,
    borderWidth: 0,
    borderStyle: 'solid',
    left: 0,
    top: 0,
    rotate: 0,
  };

  @state()
  private _isResizing = false;

  @state()
  private _isNoteWidthLimit = false;

  @state()
  private _isNoteHeightLimit = false;

  @property({ attribute: false })
  toolbarVisible = false;

  @property({ attribute: false })
  setToolbarVisible!: (visible: boolean) => void;

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
  }

  get dragging() {
    return this._resizeManager.dragging || this.edgeless.tools.dragging;
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

    let areAllConnectors = true;
    let areAllShapes = true;
    let areAllTexts = true;

    for (const element of elements) {
      if (isNoteBlock(element)) {
        areAllConnectors = false;
      } else if (isFrameBlock(element)) {
        areAllConnectors = false;
      } else if (isImageBlock(element)) {
        areAllConnectors = false;
        areAllShapes = false;
        areAllTexts = false;
      } else {
        if (element.type !== CanvasElementType.CONNECTOR)
          areAllConnectors = false;
        if (
          element.type !== CanvasElementType.SHAPE &&
          element.type !== CanvasElementType.GROUP
        )
          areAllShapes = false;
        if (element.type !== CanvasElementType.TEXT) areAllTexts = false;
      }
    }

    if (areAllConnectors) return 'none';
    if (areAllShapes) return 'all';
    if (areAllTexts) return 'edgeAndCorner';

    return 'corner';
  }

  private _shouldRenderSelection(elements?: Selectable[]) {
    elements = elements ?? this.selection.elements;
    return elements.length > 0 && !this.selection.editing;
  }

  private _onDragStart = () => {
    this.edgeless.slots.elementResizeStart.emit();
    this.setToolbarVisible(false);
    this._updateResizeManagerState(false);
  };

  private _onDragMove = (
    newBounds: Map<
      string,
      {
        bound: Bound;
      }
    >,
    direction: HandleDirection
  ) => {
    const { surface, edgeless } = this;

    newBounds.forEach(({ bound }, id) => {
      const element = surface.pickById(id);
      if (!element) return;

      if (isNoteBlock(element)) {
        const curBound = Bound.deserialize(element.xywh);
        const props: Partial<NoteBlockModel> = {};
        if (curBound.h !== bound.h && !element.edgeless.collapse) {
          edgeless.page.updateBlock(element, () => {
            element.edgeless.collapse = true;
          });
        }

        bound.w = clamp(bound.w, NOTE_MIN_WIDTH, Infinity);
        bound.h = clamp(bound.h, NOTE_MIN_HEIGHT, Infinity);

        this._isNoteWidthLimit = bound.w === NOTE_MIN_WIDTH ? true : false;
        this._isNoteHeightLimit = bound.h === NOTE_MIN_HEIGHT ? true : false;

        props.xywh = bound.serialize();
        edgeless.updateElementInLocal(element.id, props);
      } else if (isFrameBlock(element)) {
        edgeless.updateElementInLocal(element.id, {
          xywh: bound.serialize(),
        });
      } else {
        if (element instanceof TextElement) {
          let p = 1;
          if (
            direction === HandleDirection.Left ||
            direction === HandleDirection.Right
          ) {
            bound = normalizeTextBound(element, bound, true);
            // If the width of the text element has been changed by dragging,
            // We need to set hasMaxWidth to true for wrapping the text
            edgeless.updateElementInLocal(id, {
              xywh: bound.serialize(),
              fontSize: element.fontSize * p,
              hasMaxWidth: true,
            });
          } else {
            p = bound.h / element.h;
            // const newFontsize = element.fontSize * p;
            // bound = normalizeTextBound(element, bound, false, newFontsize);
            edgeless.updateElementInLocal(id, {
              xywh: bound.serialize(),
              fontSize: element.fontSize * p,
            });
          }
        } else {
          if (element instanceof ShapeElement) {
            bound = normalizeShapeBound(element, bound);
          }
          edgeless.updateElementInLocal(id, {
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
      element =>
        isImageBlock(element) ||
        (isCanvasElement(element) &&
          element.type !== CanvasElementType.CONNECTOR)
    ) as EdgelessElement[];

    getElementsWithoutGroup(elements).forEach(element => {
      const { id, rotate } = element;
      const { x, y, w, h } = Bound.deserialize(element.xywh);
      const center = new DOMPoint(x + w / 2, y + h / 2).matrixTransform(m);

      surface.updateElement(id, {
        xywh: serializeXYWH(center.x - w / 2, center.y - h / 2, w, h),
        rotate: normalizeDegAngle(rotate + delta),
      });
    });

    this._updateCursor(true, { type: 'rotate', angle: delta });
  };

  private _onDragEnd = () => {
    const selectedElements = this.edgeless.selectionManager.state.elements;
    this.edgeless.applyLocalRecord(selectedElements);

    this._isNoteWidthLimit = false;
    this._isNoteHeightLimit = false;

    this._updateCursor(false);
    this.setToolbarVisible(true);
    this.edgeless.slots.elementResizeEnd.emit();
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
      rotate = elements[0].rotate;
    }

    const isSingleNote = elements.length === 1 && isNoteBlock(elements[0]);
    const isSingleHiddenNote =
      isSingleNote && isNoteBlock(elements[0]) && elements[0].hidden;

    const padding = elements.length > 1 ? SELECTED_RECT_PADDING : 0;

    this._selectedRect = {
      width: width + padding * 2,
      height: height + padding * 2,
      borderWidth: selection.editing ? 2 : 1,
      borderStyle: isSingleHiddenNote ? 'dashed' : 'solid',
      left: left - padding,
      top: top - padding,
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
    const proportion = elements.some(ele => isImageBlock(ele));
    // if there are more than one element, we need to refresh the state of resize manager
    if (elements.length > 1) refresh = true;

    _resizeManager.updateState(
      resizeMode,
      _selectedRect.rotate,
      zoom,
      refresh ? undefined : rect,
      refresh ? rect : undefined,
      proportion
    );
    _resizeManager.updateBounds(getSelectableBounds(elements));
  };

  private _updateOnViewportChange = () => {
    this._updateSelectedRect();
  };

  private _updateOnSelectionChange = () => {
    this._updateSelectedRect();
    this._updateResizeManagerState(true);
    // Reset the cursor
    this._updateCursor(false);
  };

  private _updateOnElementChange = (
    element: string | { id: string },
    fromRemote: boolean = false
  ) => {
    if (fromRemote && this._resizeManager.dragging) return;

    const id = typeof element === 'string' ? element : element.id;

    if (this._resizeManager.bounds.has(id) || this.selection.isSelected(id))
      this._updateSelectedRect();
  };

  override firstUpdated() {
    const { _disposables, page, slots, selection, edgeless } = this;

    _disposables.add(
      // viewport zooming / scrolling
      slots.viewportUpdated.on(this._updateOnViewportChange)
    );

    pickValues(edgeless.slots, [
      'elementAdded',
      'elementRemoved',
      'elementUpdated',
    ]).forEach(slot => {
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
      page.slots.blockUpdated.on(data => {
        this._updateOnElementChange(data, true);
      })
    );
    _disposables.add(
      edgeless.slots.readonlyUpdated.on(() => this.requestUpdate())
    );

    _disposables.add(
      edgeless.slots.elementResizeStart.on(() => (this._isResizing = true))
    );
    _disposables.add(
      edgeless.slots.elementResizeEnd.on(() => (this._isResizing = false))
    );
  }

  private _canAutoComplete() {
    return (
      !this._isResizing &&
      this.selection.elements.length === 1 &&
      (this.selection.elements[0] instanceof ShapeElement ||
        isNoteBlock(this.selection.elements[0]))
    );
  }

  private _canRotate() {
    return !this.selection.elements.every(
      ele => isNoteBlock(ele) || isFrameBlock(ele)
    );
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
      _updateCursor,
    } = this;

    const hasResizeHandles = !selection.editing && !page.readonly;

    const resizeHandles = hasResizeHandles
      ? ResizeHandles(
          resizeMode,
          (e: PointerEvent, direction: HandleDirection) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('rotate') && !this._canRotate()) {
              return;
            }
            const proportional = elements.some(el => el instanceof TextElement);
            _resizeManager.onPointerDown(e, direction, proportional);
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
            if (!this._canRotate() && options?.type === 'rotate') return;
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

    const elementHandle =
      elements.length > 1
        ? elements.map(element => {
            const [modelX, modelY, w, h] = deserializeXYWH(element.xywh);
            const [x, y] = this.surface.toViewCoord(modelX, modelY);
            const { left, top, borderWidth } = this._selectedRect;
            const style = {
              position: 'absolute',
              boxSizing: 'border-box',
              left: `${x - left - borderWidth}px`,
              top: `${y - top - borderWidth}px`,
              width: `${w * this.zoom}px`,
              height: `${h * this.zoom}px`,
              border: `1px solid var(--affine-primary-color)`,
            };
            return html`<div
              class="element-handle"
              style=${styleMap(style)}
            ></div>`;
          })
        : nothing;

    const isSingleGroup =
      elements.length === 1 && elements[0] instanceof GroupElement;
    _selectedRect.borderStyle = isSingleGroup ? 'dashed' : 'solid';

    return html`
      <style>
        .affine-edgeless-selected-rect .handle[aria-label='right']::after {
          content: '';
          display: ${this._isNoteWidthLimit ? 'initial' : 'none'};
          position: absolute;
          top: 0;
          left: 1.5px;
          width: 2px;
          height: 100%;
          background: var(--affine-error-color);
          filter: drop-shadow(-6px 0px 12px rgba(235, 67, 53, 0.35));
        }

        .affine-edgeless-selected-rect .handle[aria-label='bottom']::after {
          content: '';
          display: ${this._isNoteHeightLimit ? 'initial' : 'none'};
          position: absolute;
          top: 1.5px;
          left: 0px;
          width: 100%;
          height: 2px;
          background: var(--affine-error-color);
          filter: drop-shadow(-6px 0px 12px rgba(235, 67, 53, 0.35));
        }
      </style>
      ${!page.readonly && this._canAutoComplete()
        ? html`<edgeless-auto-complete
            .current=${this.selection.elements[0]}
            .edgeless=${edgeless}
            .selectedRect=${_selectedRect}
          >
          </edgeless-auto-complete>`
        : nothing}
      <div
        class="affine-edgeless-selected-rect"
        style=${styleMap({
          width: `${_selectedRect.width}px`,
          height: `${_selectedRect.height}px`,
          borderWidth: `${_selectedRect.borderWidth}px`,
          borderStyle: _selectedRect.borderStyle,
          transform: `translate(${_selectedRect.left}px, ${_selectedRect.top}px) rotate(${_selectedRect.rotate}deg)`,
        })}
        disabled="true"
      >
        ${resizeHandles} ${connectorHandle} ${elementHandle}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-selected-rect': EdgelessSelectedRect;
  }
}

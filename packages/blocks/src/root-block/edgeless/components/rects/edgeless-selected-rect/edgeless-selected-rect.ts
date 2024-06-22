import '../../connector/connector-handle.js';
import '../../auto-complete/edgeless-auto-complete.js';

import { WithDisposable } from '@blocksuite/block-std';
import { assertType, type Disposable, Slot } from '@blocksuite/global/utils';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';

import { isMindmapNode } from '../../../../../_common/edgeless/mindmap/index.js';
import type { IPoint } from '../../../../../_common/types.js';
import {
  requestThrottledConnectFrame,
  stopPropagation,
} from '../../../../../_common/utils/event.js';
import { pickValues } from '../../../../../_common/utils/iterable.js';
import { NoteBlockModel } from '../../../../../note-block/note-model.js';
import { TextElementModel } from '../../../../../surface-block/element-model/text.js';
import {
  CanvasElementType,
  deserializeXYWH,
  GroupElementModel,
  type PointLocation,
  ShapeElementModel,
} from '../../../../../surface-block/index.js';
import {
  Bound,
  ConnectorElementModel,
  type IVec,
  normalizeDegAngle,
} from '../../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import { getElementsWithoutGroup } from '../../../utils/group.js';
import {
  getSelectableBounds,
  getSelectedRect,
  isAttachmentBlock,
  isBookmarkBlock,
  isCanvasElement,
  isEdgelessTextBlock,
  isEmbeddedBlock,
  isEmbedFigmaBlock,
  isEmbedGithubBlock,
  isEmbedHtmlBlock,
  isEmbedLinkedDocBlock,
  isEmbedLoomBlock,
  isEmbedSyncedDocBlock,
  isEmbedYoutubeBlock,
  isFrameBlock,
  isImageBlock,
  isNoteBlock,
} from '../../../utils/query.js';
import type { HandleDirection } from '../../resize/resize-handles.js';
import { ResizeHandles, type ResizeMode } from '../../resize/resize-handles.js';
import { HandleResizeManager } from '../../resize/resize-manager.js';
import {
  calcAngle,
  calcAngleEdgeWithRotation,
  calcAngleWithRotation,
  generateCursorUrl,
  getResizeLabel,
  rotateResizeCursor,
} from '../../utils.js';
import { edgelessSelectedRectStyles } from './style.js';

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
  get dragging() {
    return this._resizeManager.dragging || this.edgeless.tools.dragging;
  }

  get dragDirection() {
    return this._resizeManager.dragDirection;
  }

  get selection() {
    return this.edgeless.service.selection;
  }

  get doc() {
    return this.edgeless.doc;
  }

  get edgelessSlots() {
    return this.edgeless.slots;
  }

  get surface() {
    return this.edgeless.surface;
  }

  get zoom() {
    return this.edgeless.service.viewport.zoom;
  }

  get resizeMode(): ResizeMode {
    const elements = this.selection.selectedElements;

    let areAllConnectors = true;
    let areAllIndependentConnectors = elements.length > 1;
    let areAllShapes = true;
    let areAllTexts = true;
    let hasMindmapNode = false;

    for (const element of elements) {
      if (isNoteBlock(element) || isEmbedSyncedDocBlock(element)) {
        areAllConnectors = false;
        if (this._shiftKey) {
          areAllShapes = false;
          areAllTexts = false;
        }
      } else if (isEmbedHtmlBlock(element)) {
        areAllConnectors = false;
      } else if (isFrameBlock(element)) {
        areAllConnectors = false;
      } else if (this._isProportionalElement(element)) {
        areAllConnectors = false;
        areAllShapes = false;
        areAllTexts = false;
      } else if (isEdgelessTextBlock(element)) {
        areAllConnectors = false;
        areAllShapes = false;
      } else {
        assertType<BlockSuite.SurfaceElementModelType>(element);
        if (element.type === CanvasElementType.CONNECTOR) {
          const connector = element as ConnectorElementModel;
          areAllIndependentConnectors &&= !(
            connector.source.id || connector.target.id
          );
        } else {
          areAllConnectors = false;
        }
        if (
          element.type !== CanvasElementType.SHAPE &&
          element.type !== CanvasElementType.GROUP
        )
          areAllShapes = false;
        if (element.type !== CanvasElementType.TEXT) areAllTexts = false;

        if (isMindmapNode(element)) {
          hasMindmapNode = true;
        }
      }
    }

    if (areAllConnectors) {
      if (areAllIndependentConnectors) {
        return 'all';
      } else {
        return 'none';
      }
    }

    if (hasMindmapNode) return 'none';
    if (areAllShapes) return 'all';
    if (areAllTexts) return 'edgeAndCorner';

    return 'corner';
  }

  // disable change-in-update warning
  static override enabledWarnings = [];

  static override styles = edgelessSelectedRectStyles;

  @state()
  private accessor _selectedRect: SelectedRect = {
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    rotate: 0,
    borderWidth: 0,
    borderStyle: 'solid',
  };

  @state()
  private accessor _isResizing = false;

  @state()
  private accessor _mode: 'resize' | 'scale' | 'rotate' = 'resize';

  @state()
  private accessor _scalePercent: string | undefined = undefined;

  @state()
  private accessor _scaleDirection: HandleDirection | undefined = undefined;

  @state()
  private accessor _isWidthLimit = false;

  @state()
  private accessor _isHeightLimit = false;

  @state()
  private accessor _shiftKey = false;

  private _resizeManager: HandleResizeManager;

  private _cursorRotate = 0;

  private _propDisposables: Disposable[] = [];

  private _dragEndCallback: (() => void)[] = [];

  private _updateSelectedRect = requestThrottledConnectFrame(() => {
    const { zoom, selection, edgeless } = this;

    const elements = selection.selectedElements;
    // in surface
    const rect = getSelectedRect(elements);

    // in viewport
    const [left, top] = edgeless.service.viewport.toViewCoord(
      rect.left,
      rect.top
    );
    const [width, height] = [rect.width * zoom, rect.height * zoom];

    let rotate = 0;
    if (elements.length === 1 && elements[0].rotate) {
      rotate = elements[0].rotate;
    }

    this._selectedRect = {
      width,
      height,
      left,
      top,
      rotate,
      borderStyle: 'solid',
      borderWidth: selection.editing ? 2 : 1,
    };
  }, this);

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor autoCompleteOff = false;

  readonly slots = {
    dragStart: new Slot(),
    dragMove: new Slot(),
    dragRotate: new Slot(),
    dragEnd: new Slot(),
  };

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

  private _isProportionalElement(element: BlockSuite.EdgelessModelType) {
    return (
      isAttachmentBlock(element) ||
      isImageBlock(element) ||
      isBookmarkBlock(element) ||
      isEmbedFigmaBlock(element) ||
      isEmbedGithubBlock(element) ||
      isEmbedYoutubeBlock(element) ||
      isEmbedLoomBlock(element) ||
      isEmbedLinkedDocBlock(element)
    );
  }

  private _shouldRenderSelection(elements?: BlockSuite.EdgelessModelType[]) {
    elements = elements ?? this.selection.selectedElements;
    return elements.length > 0 && !this.selection.editing;
  }

  private _onDragStart = () => {
    this.slots.dragStart.emit();

    const rotation = this._resizeManager.rotation;

    this._dragEndCallback = [];
    this.edgeless.slots.elementResizeStart.emit();
    this.selection.selectedElements.forEach(el => {
      el.stash('xywh');

      if (el instanceof NoteBlockModel) {
        el.stash('edgeless');
      }

      if (rotation) {
        el.stash('rotate' as 'xywh');
      }

      if (el instanceof TextElementModel && !rotation) {
        el.stash('fontSize');
        el.stash('hasMaxWidth');
      }

      this._dragEndCallback.push(() => {
        el.pop('xywh');

        if (el instanceof NoteBlockModel) {
          el.pop('edgeless');
        }

        if (rotation) {
          el.pop('rotate' as 'xywh');
        }

        if (el instanceof TextElementModel && !rotation) {
          el.pop('fontSize');
          el.pop('hasMaxWidth');
        }
      });
    });
    this._updateResizeManagerState(true);
  };

  private _onDragMove = (
    newBounds: Map<
      string,
      {
        bound: Bound;
        path?: PointLocation[];
        matrix?: DOMMatrix;
      }
    >,
    direction: HandleDirection
  ) => {
    this.slots.dragMove.emit();

    const { edgeless } = this;

    newBounds.forEach(({ bound, matrix, path }, id) => {
      const element = edgeless.service.getElementById(id);
      if (!element) return;
      const controller = element.transformController;
      if (controller) {
        controller.adjust(element, {
          bound,
          matrix,
          path,
          rect: this,
          shiftKey: this._shiftKey,
          direction,
        });
      } else {
        this.#adjustUseFallback(element, bound, direction);
      }
    });
  };

  private _onDragRotate = (center: IPoint, delta: number) => {
    this.slots.dragRotate.emit();

    const { selection } = this;
    const m = new DOMMatrix()
      .translateSelf(center.x, center.y)
      .rotateSelf(delta)
      .translateSelf(-center.x, -center.y);

    const elements = selection.selectedElements.filter(
      element =>
        isCanvasElement(element) || !!element.transformController?.rotatable
    );

    getElementsWithoutGroup(elements).forEach(element => {
      const controller = element.transformController;

      const { id, rotate } = element;
      const bound = Bound.deserialize(element.xywh);
      const originalCenter = bound.center;
      const point = new DOMPoint(...originalCenter).matrixTransform(m);
      bound.center = [point.x, point.y];

      if (controller?.rotate !== undefined) {
        controller.rotate(element, {
          rect: this,
          shiftKey: this._shiftKey,
          bound,
          matrix: m,
        });
      } else {
        this.edgeless.service.updateElement(id, {
          xywh: bound.serialize(),
          rotate: normalizeDegAngle(rotate + delta),
        });
      }
    });

    this._updateCursor(true, { type: 'rotate', angle: delta });
    this._updateMode();
  };

  private _onDragEnd = () => {
    this.slots.dragEnd.emit();

    this.doc.transact(() => {
      this._dragEndCallback.forEach(cb => cb());
    });

    this._dragEndCallback = [];
    this._isWidthLimit = false;
    this._isHeightLimit = false;

    this._updateCursor(false);

    this._scalePercent = undefined;
    this._scaleDirection = undefined;
    this._updateMode();

    this.edgeless.slots.elementResizeEnd.emit();
  };

  private _updateMode = () => {
    if (this._cursorRotate) {
      this._mode = 'rotate';
      return;
    }

    const { selection } = this;
    const elements = selection.selectedElements;

    if (elements.length !== 1) this._mode = 'scale';

    const element = elements[0];

    if (isNoteBlock(element) || isEmbedSyncedDocBlock(element)) {
      this._mode = this._shiftKey ? 'scale' : 'resize';
    } else if (this._isProportionalElement(element)) {
      this._mode = 'scale';
    } else {
      this._mode = 'resize';
    }

    if (this._mode !== 'scale') {
      this._scalePercent = undefined;
      this._scaleDirection = undefined;
    }
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
              new DOMRect(
                left + this.edgeless.viewport.left,
                top + this.edgeless.viewport.top,
                width,
                height
              ),
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
    this.edgelessSlots.cursorUpdated.emit(cursor);
  };

  /**
   * @param refresh indicate whether to completely refresh the state of resize manager, otherwise only update the position
   */
  private _updateResizeManagerState = (refresh: boolean) => {
    const {
      _resizeManager,
      _selectedRect,
      resizeMode,
      zoom,
      selection: { selectedElements },
    } = this;

    const rect = getSelectedRect(selectedElements);
    const proportion = selectedElements.some(element =>
      this._isProportionalElement(element)
    );
    // if there are more than one element, we need to refresh the state of resize manager
    if (selectedElements.length > 1) refresh = true;

    _resizeManager.updateState(
      resizeMode,
      _selectedRect.rotate,
      zoom,
      refresh ? undefined : rect,
      refresh ? rect : undefined,
      proportion
    );
    _resizeManager.updateBounds(getSelectableBounds(selectedElements));
  };

  private _updateOnViewportChange = () => {
    if (this.selection.empty) {
      return;
    }

    this._updateSelectedRect();
    this._updateMode();
  };

  private _initSelectedSlot = () => {
    this._propDisposables.forEach(disposable => disposable.dispose());
    this._propDisposables = [];

    this.selection.selectedElements.forEach(element => {
      if ('flavour' in element) {
        this._propDisposables.push(
          element.propsUpdated.on(() => {
            this._updateOnElementChange(element.id);
          })
        );
      }
    });
  };

  private _updateOnSelectionChange = () => {
    this._initSelectedSlot();
    this._updateSelectedRect();
    this._updateResizeManagerState(true);
    // Reset the cursor
    this._updateCursor(false);
    this._updateMode();
  };

  private _updateOnElementChange = (
    element: string | { id: string },
    fromRemote: boolean = false
  ) => {
    if ((fromRemote && this._resizeManager.dragging) || !this.isConnected) {
      return;
    }

    const id = typeof element === 'string' ? element : element.id;

    if (this._resizeManager.bounds.has(id) || this.selection.has(id)) {
      this._updateSelectedRect();
      this._updateMode();
    }
  };

  private _canAutoComplete() {
    return (
      !this.autoCompleteOff &&
      !this._isResizing &&
      this.selection.selectedElements.length === 1 &&
      (this.selection.selectedElements[0] instanceof ShapeElementModel ||
        isNoteBlock(this.selection.selectedElements[0]))
    );
  }

  private _canRotate() {
    return !this.selection.selectedElements.every(
      ele =>
        isNoteBlock(ele) ||
        isFrameBlock(ele) ||
        isBookmarkBlock(ele) ||
        isAttachmentBlock(ele) ||
        isEmbeddedBlock(ele)
    );
  }

  #adjustUseFallback(
    element: BlockSuite.EdgelessModelType,
    bound: Bound,
    _direction: HandleDirection
  ) {
    this.edgeless.service.updateElement(element.id, {
      xywh: bound.serialize(),
    });
  }

  updateScaleDisplay(p: number, direction: HandleDirection) {
    this._scalePercent = `${Math.round(p * 100)}%`;
    this._scaleDirection = direction;
  }

  limit(limitWidth: boolean, limitHeight: boolean) {
    this._isWidthLimit = limitWidth;
    this._isHeightLimit = limitHeight;
  }

  override firstUpdated() {
    const { _disposables, edgelessSlots, selection, edgeless } = this;

    _disposables.add(
      // viewport zooming / scrolling
      edgeless.service.viewport.viewportUpdated.on(this._updateOnViewportChange)
    );

    pickValues(edgeless.service.surface, [
      'elementAdded',
      'elementRemoved',
      'elementUpdated',
    ]).forEach(slot => {
      _disposables.add(slot.on(this._updateOnElementChange));
    });

    _disposables.add(
      this.doc.slots.blockUpdated.on(this._updateOnElementChange)
    );

    _disposables.add(
      edgelessSlots.pressShiftKeyUpdated.on(pressed => {
        this._shiftKey = pressed;
        this._resizeManager.onPressShiftKey(pressed);
        this._updateSelectedRect();
        this._updateMode();
      })
    );

    _disposables.add(selection.slots.updated.on(this._updateOnSelectionChange));

    _disposables.add(
      edgeless.slots.readonlyUpdated.on(() => this.requestUpdate())
    );

    _disposables.add(
      edgeless.slots.elementResizeStart.on(() => (this._isResizing = true))
    );
    _disposables.add(
      edgeless.slots.elementResizeEnd.on(() => (this._isResizing = false))
    );
    _disposables.add(() => {
      this._propDisposables.forEach(disposable => disposable.dispose());
    });
  }

  override render() {
    if (!this.isConnected) return nothing;

    const { selection } = this;
    const elements = selection.selectedElements;

    if (!this._shouldRenderSelection(elements)) return nothing;

    const {
      edgeless,
      doc,
      resizeMode,
      _resizeManager,
      _selectedRect,
      _updateCursor,
    } = this;

    const hasResizeHandles = !selection.editing && !doc.readonly;
    const inoperable = selection.inoperable;
    const handlers = [];

    if (!inoperable) {
      const resizeHandles = hasResizeHandles
        ? ResizeHandles(
            resizeMode,
            (e: PointerEvent, direction: HandleDirection) => {
              const target = e.target as HTMLElement;
              if (target.classList.contains('rotate') && !this._canRotate()) {
                return;
              }
              const proportional = elements.some(
                el => el instanceof TextElementModel
              );
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
        elements.length === 1 && elements[0] instanceof ConnectorElementModel
          ? html`
              <edgeless-connector-handle
                .connector=${elements[0]}
                .edgeless=${edgeless}
              ></edgeless-connector-handle>
            `
          : nothing;

      const elementHandle =
        elements.length > 1 &&
        !elements.reduce(
          (p, e) => p && e instanceof ConnectorElementModel,
          true
        )
          ? elements.map(element => {
              const [modelX, modelY, w, h] = deserializeXYWH(element.xywh);
              const [x, y] = edgeless.service.viewport.toViewCoord(
                modelX,
                modelY
              );
              const { left, top, borderWidth } = this._selectedRect;
              const style = {
                position: 'absolute',
                boxSizing: 'border-box',
                left: `${x - left - borderWidth}px`,
                top: `${y - top - borderWidth}px`,
                width: `${w * this.zoom}px`,
                height: `${h * this.zoom}px`,
                transform: `rotate(${element.rotate}deg)`,
                border: `1px solid var(--affine-primary-color)`,
              };
              return html`<div
                class="element-handle"
                style=${styleMap(style)}
              ></div>`;
            })
          : nothing;

      handlers.push(resizeHandles, connectorHandle, elementHandle);
    }

    const isSingleGroup =
      elements.length === 1 && elements[0] instanceof GroupElementModel;

    if (elements.length === 1 && elements[0] instanceof ConnectorElementModel) {
      _selectedRect.width = 0;
      _selectedRect.height = 0;
      _selectedRect.borderWidth = 0;
    }

    _selectedRect.borderStyle = isSingleGroup ? 'dashed' : 'solid';

    return html`
      <style>
        .affine-edgeless-selected-rect .handle[aria-label='right']::after {
          content: '';
          display: ${this._isWidthLimit ? 'initial' : 'none'};
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
          display: ${this._isHeightLimit ? 'initial' : 'none'};
          position: absolute;
          top: 1.5px;
          left: 0px;
          width: 100%;
          height: 2px;
          background: var(--affine-error-color);
          filter: drop-shadow(-6px 0px 12px rgba(235, 67, 53, 0.35));
        }
      </style>

      ${!doc.readonly && !inoperable && this._canAutoComplete()
        ? html`<edgeless-auto-complete
            .current=${this.selection.selectedElements[0]}
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
        data-mode=${this._mode}
        data-scale-percent=${ifDefined(this._scalePercent)}
        data-scale-direction=${ifDefined(this._scaleDirection)}
      >
        ${handlers}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-selected-rect': EdgelessSelectedRect;
  }
}

import '../connector/connector-handle.js';
import '../auto-complete/edgeless-auto-complete.js';

import { WithDisposable } from '@blocksuite/block-std';
import { assertType, type Disposable } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EMBED_CARD_HEIGHT } from '../../../../_common/consts.js';
import type {
  EdgelessModel,
  IPoint,
  Selectable,
} from '../../../../_common/types.js';
import {
  requestThrottledConnectFrame,
  stopPropagation,
} from '../../../../_common/utils/event.js';
import { pickValues } from '../../../../_common/utils/iterable.js';
import { clamp } from '../../../../_common/utils/math.js';
import {
  EMBED_HTML_MIN_HEIGHT,
  EMBED_HTML_MIN_WIDTH,
} from '../../../../embed-html-block/styles.js';
import {
  SYNCED_MIN_HEIGHT,
  SYNCED_MIN_WIDTH,
} from '../../../../embed-synced-doc-block/styles.js';
import type {
  BookmarkBlockModel,
  EmbedHtmlModel,
  EmbedSyncedDocModel,
} from '../../../../index.js';
import { NoteBlockModel } from '../../../../note-block/note-model.js';
import { normalizeTextBound } from '../../../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import { TextElementModel } from '../../../../surface-block/element-model/text.js';
import type { ElementModel } from '../../../../surface-block/index.js';
import {
  CanvasElementType,
  deserializeXYWH,
  GroupElementModel,
  ShapeElementModel,
} from '../../../../surface-block/index.js';
import {
  Bound,
  ConnectorElementModel,
  type IVec,
  normalizeDegAngle,
  normalizeShapeBound,
  serializeXYWH,
} from '../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import { NOTE_MIN_HEIGHT, NOTE_MIN_WIDTH } from '../../utils/consts.js';
import { getElementsWithoutGroup } from '../../utils/group.js';
import {
  getSelectableBounds,
  getSelectedRect,
  isAttachmentBlock,
  isBookmarkBlock,
  isCanvasElement,
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

    .affine-edgeless-selected-rect .handle .resize::before {
      content: '';
      display: none;
      position: absolute;
      width: 20px;
      height: 20px;
      background-image: url("data:image/svg+xml,%3Csvg width='26' height='26' viewBox='0 0 26 26' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M23 3H19C10.1634 3 3 10.1634 3 19V23' stroke='black' stroke-opacity='0.3' stroke-width='5' stroke-linecap='round'/%3E%3C/svg%3E");
      background-size: contain;
      background-repeat: no-repeat;
    }
    .affine-edgeless-selected-rect[data-mode='scale']
      .handle[aria-label='top-left']
      .resize:hover::before,
    .affine-edgeless-selected-rect[data-scale-direction='top-left'][data-scale-percent]
      .handle[aria-label='top-left']
      .resize::before {
      display: block;
      top: 0px;
      left: 0px;
      transform: translate(-100%, -100%);
    }
    .affine-edgeless-selected-rect[data-mode='scale']
      .handle[aria-label='top-right']
      .resize:hover::before,
    .affine-edgeless-selected-rect[data-scale-direction='top-right'][data-scale-percent]
      .handle[aria-label='top-right']
      .resize::before {
      display: block;
      top: 0px;
      right: 0px;
      transform: translate(100%, -100%) rotate(90deg);
    }
    .affine-edgeless-selected-rect[data-mode='scale']
      .handle[aria-label='bottom-right']
      .resize:hover::before,
    .affine-edgeless-selected-rect[data-scale-direction='bottom-right'][data-scale-percent]
      .handle[aria-label='bottom-right']
      .resize::before {
      display: block;
      bottom: 0px;
      right: 0px;
      transform: translate(100%, 100%) rotate(180deg);
    }
    .affine-edgeless-selected-rect[data-mode='scale']
      .handle[aria-label='bottom-left']
      .resize:hover::before,
    .affine-edgeless-selected-rect[data-scale-direction='bottom-left'][data-scale-percent]
      .handle[aria-label='bottom-left']
      .resize::before {
      display: block;
      bottom: 0px;
      left: 0px;
      transform: translate(-100%, 100%) rotate(-90deg);
    }

    .affine-edgeless-selected-rect::after {
      content: attr(data-scale-percent);
      display: none;
      position: absolute;
      color: var(--affine-icon-color);
      font-feature-settings:
        'clig' off,
        'liga' off;
      font-family: var(--affine-font-family);
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: 24px;
    }
    .affine-edgeless-selected-rect[data-scale-direction='top-left']::after {
      display: block;
      top: -20px;
      left: -20px;
      transform: translate(-100%, -100%);
    }
    .affine-edgeless-selected-rect[data-scale-direction='top-right']::after {
      display: block;
      top: -20px;
      right: -20px;
      transform: translate(100%, -100%);
    }
    .affine-edgeless-selected-rect[data-scale-direction='bottom-right']::after {
      display: block;
      bottom: -20px;
      right: -20px;
      transform: translate(100%, 100%);
    }
    .affine-edgeless-selected-rect[data-scale-direction='bottom-left']::after {
      display: block;
      bottom: -20px;
      left: -20px;
      transform: translate(-100%, 100%);
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @state()
  private _selectedRect: SelectedRect = {
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    rotate: 0,
    borderWidth: 0,
    borderStyle: 'solid',
  };

  @state()
  private _isResizing = false;

  @state()
  private _mode: 'resize' | 'scale' | 'rotate' = 'resize';

  @state()
  private _scalePercent?: string;

  @state()
  private _scaleDirection?: HandleDirection;

  @state()
  private _isWidthLimit = false;

  @state()
  private _isHeightLimit = false;

  @state()
  private _shiftKey = false;

  @property({ attribute: false })
  autoCompleteOff = false;

  private _resizeManager: HandleResizeManager;
  private _cursorRotate = 0;
  private _propDiposables: Disposable[] = [];
  private _dragEndCallback: (() => void)[] = [];

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
    return this.edgeless.service.selection;
  }

  get doc() {
    return this.edgeless.doc;
  }

  get slots() {
    return this.edgeless.slots;
  }

  get surface() {
    return this.edgeless.surface;
  }

  get zoom() {
    return this.edgeless.service.viewport.zoom;
  }

  get resizeMode(): ResizeMode {
    const elements = this.selection.elements;

    let areAllConnectors = true;
    let areAllIndependentConnectors = elements.length > 1;
    let areAllShapes = true;
    let areAllTexts = true;

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
      } else {
        assertType<ElementModel>(element);
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
      }
    }

    if (areAllConnectors) {
      if (areAllIndependentConnectors) {
        return 'all';
      } else {
        return 'none';
      }
    }

    if (areAllShapes) return 'all';
    if (areAllTexts) return 'edgeAndCorner';

    return 'corner';
  }

  private _isProportionalElement(element: EdgelessModel) {
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

  private _shouldRenderSelection(elements?: Selectable[]) {
    elements = elements ?? this.selection.elements;
    return elements.length > 0 && !this.selection.editing;
  }

  private _onDragStart = () => {
    const rotation = this._resizeManager.rotation;

    this._dragEndCallback = [];
    this.edgeless.slots.elementResizeStart.emit();
    this.selection.elements.forEach(el => {
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
      }
    >,
    direction: HandleDirection
  ) => {
    const { edgeless } = this;

    newBounds.forEach(({ bound }, id) => {
      const element = edgeless.service.getElementById(id);
      if (!element) return;

      if (isNoteBlock(element)) {
        const curBound = Bound.deserialize(element.xywh);
        const props: Partial<NoteBlockModel> = {};

        let scale = element.edgeless.scale ?? 1;
        let width = curBound.w / scale;
        let height = curBound.h / scale;

        if (this._shiftKey) {
          scale = bound.w / width;
          this._scalePercent = `${Math.round(scale * 100)}%`;
          this._scaleDirection = direction;
        } else if (curBound.h !== bound.h) {
          edgeless.doc.updateBlock(element, () => {
            element.edgeless.collapse = true;
            element.edgeless.collapsedHeight = bound.h / scale;
          });
        }

        width = bound.w / scale;
        width = clamp(width, NOTE_MIN_WIDTH, Infinity);
        bound.w = width * scale;

        height = bound.h / scale;
        height = clamp(height, NOTE_MIN_HEIGHT, Infinity);
        bound.h = height * scale;

        this._isWidthLimit = width === NOTE_MIN_WIDTH;
        this._isHeightLimit = height === NOTE_MIN_HEIGHT;

        props.edgeless = { ...element.edgeless, scale };
        props.xywh = bound.serialize();
        edgeless.service.updateElement(element.id, props);
      } else if (isEmbedSyncedDocBlock(element)) {
        const curBound = Bound.deserialize(element.xywh);
        const props: Partial<EmbedSyncedDocModel> = {};

        let scale = element.scale ?? 1;
        let width = curBound.w / scale;
        let height = curBound.h / scale;
        if (this._shiftKey) {
          scale = bound.w / width;
          this._scalePercent = `${Math.round(scale * 100)}%`;
          this._scaleDirection = direction;
        }

        width = bound.w / scale;
        width = clamp(width, SYNCED_MIN_WIDTH, Infinity);
        bound.w = width * scale;

        height = bound.h / scale;
        height = clamp(height, SYNCED_MIN_HEIGHT, Infinity);
        bound.h = height * scale;

        this._isWidthLimit = width === SYNCED_MIN_WIDTH;
        this._isHeightLimit = height === SYNCED_MIN_HEIGHT;

        props.scale = scale;
        props.xywh = bound.serialize();
        edgeless.service.updateElement(element.id, props);
      } else if (isEmbedHtmlBlock(element)) {
        bound.w = clamp(bound.w, EMBED_HTML_MIN_WIDTH, Infinity);
        bound.h = clamp(bound.h, EMBED_HTML_MIN_HEIGHT, Infinity);

        this._isWidthLimit = bound.w === EMBED_HTML_MIN_WIDTH;
        this._isHeightLimit = bound.h === EMBED_HTML_MIN_HEIGHT;

        const props: Partial<EmbedHtmlModel> = {};
        props.xywh = bound.serialize();
        edgeless.service.updateElement(element.id, props);
      } else if (this._isProportionalElement(element)) {
        const curBound = Bound.deserialize(element.xywh);

        if (isImageBlock(element)) {
          const { height } = element;
          if (height) {
            this._scalePercent = `${Math.round((bound.h / height) * 100)}%`;
            this._scaleDirection = direction;
          }
        } else {
          const cardStyle = (element as BookmarkBlockModel).style;
          const height = EMBED_CARD_HEIGHT[cardStyle];
          this._scalePercent = `${Math.round((bound.h / height) * 100)}%`;
          this._scaleDirection = direction;
        }
        if (
          direction === HandleDirection.Left ||
          direction === HandleDirection.Right
        ) {
          bound.h = (curBound.h / curBound.w) * bound.w;
        } else if (
          direction === HandleDirection.Top ||
          direction === HandleDirection.Bottom
        ) {
          bound.w = (curBound.w / curBound.h) * bound.h;
        }

        edgeless.service.updateElement(element.id, {
          xywh: bound.serialize(),
        });
      } else {
        if (element instanceof TextElementModel) {
          let p = 1;
          if (
            direction === HandleDirection.Left ||
            direction === HandleDirection.Right
          ) {
            bound = normalizeTextBound(element, bound, true);
            // If the width of the text element has been changed by dragging,
            // We need to set hasMaxWidth to true for wrapping the text
            edgeless.service.updateElement(id, {
              xywh: bound.serialize(),
              fontSize: element.fontSize * p,
              hasMaxWidth: true,
            });
          } else {
            p = bound.h / element.h;
            // const newFontsize = element.fontSize * p;
            // bound = normalizeTextBound(element, bound, false, newFontsize);

            edgeless.service.updateElement(id, {
              xywh: bound.serialize(),
              fontSize: element.fontSize * p,
            });
          }
        } else {
          if (element instanceof ShapeElementModel) {
            bound = normalizeShapeBound(element, bound);
          }
          edgeless.service.updateElement(id, {
            xywh: bound.serialize(),
          });
        }
      }
    });
  };

  private _onDragRotate = (center: IPoint, delta: number) => {
    const { selection } = this;
    const m = new DOMMatrix()
      .translateSelf(center.x, center.y)
      .rotateSelf(delta)
      .translateSelf(-center.x, -center.y);

    const elements = selection.elements.filter(
      element =>
        isImageBlock(element) ||
        (isCanvasElement(element) &&
          element.type !== CanvasElementType.CONNECTOR)
    ) as EdgelessModel[];

    getElementsWithoutGroup(elements).forEach(element => {
      const { id, rotate } = element;
      const { x, y, w, h } = Bound.deserialize(element.xywh);
      const center = new DOMPoint(x + w / 2, y + h / 2).matrixTransform(m);

      this.edgeless.service.updateElement(id, {
        xywh: serializeXYWH(center.x - w / 2, center.y - h / 2, w, h),
        rotate: normalizeDegAngle(rotate + delta),
      });
    });

    this._updateCursor(true, { type: 'rotate', angle: delta });
    this._updateMode();
  };

  private _onDragEnd = () => {
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
    const elements = selection.elements;

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
    this.slots.cursorUpdated.emit(cursor);
  };

  private _updateSelectedRect = requestThrottledConnectFrame(() => {
    const { zoom, selection, edgeless } = this;

    const elements = selection.elements;
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
    const proportion = elements.some(element =>
      this._isProportionalElement(element)
    );
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
    if (this.selection.empty) {
      return;
    }

    this._updateSelectedRect();
    this._updateMode();
  };

  private _initSelectedSlot = () => {
    this._propDiposables.forEach(diposable => diposable.dispose());
    this._propDiposables = [];

    this.selection.elements.forEach(element => {
      if ('flavour' in element) {
        this._propDiposables.push(
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

  override firstUpdated() {
    const { _disposables, slots, selection, edgeless } = this;

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
      slots.pressShiftKeyUpdated.on(pressed => {
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
      this._propDiposables.forEach(diposable => diposable.dispose());
    });
  }

  private _canAutoComplete() {
    return (
      !this.autoCompleteOff &&
      !this._isResizing &&
      this.selection.elements.length === 1 &&
      (this.selection.elements[0] instanceof ShapeElementModel ||
        isNoteBlock(this.selection.elements[0]))
    );
  }

  private _canRotate() {
    return !this.selection.elements.every(
      ele =>
        isNoteBlock(ele) ||
        isFrameBlock(ele) ||
        isBookmarkBlock(ele) ||
        isAttachmentBlock(ele) ||
        isEmbeddedBlock(ele)
    );
  }

  override render() {
    if (!this.isConnected) return nothing;

    const { selection } = this;
    const elements = selection.elements;

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
          ? html`<edgeless-connector-handle
              .connector=${elements[0]}
              .edgeless=${edgeless}
            ></edgeless-connector-handle>`
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

import './components/rects/edgeless-selected-rect.js';
import './components/toolbar/edgeless-toolbar.js';
import './components/rects/edgeless-hover-rect.js';
import './components/rects/edgeless-dragging-area-rect.js';
import './components/edgeless-notes-container.js';

import type { SurfaceSelection } from '@blocksuite/block-std';
import {
  almostEqual,
  assertExists,
  noop,
  Slot,
  throttle,
} from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import {
  Bound,
  compare,
  ConnectorElement,
  deserializeXYWH,
  FrameElement,
  generateKeyBetween,
  generateNKeysBetween,
  getCommonBound,
  type IBound,
  intersects,
  type IVec,
  type PhasorElement,
  serializeXYWH,
  SurfaceManager,
} from '@blocksuite/phasor';
import { type BaseBlockModel, type Page } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { EdgelessClipboard } from '../../__internal__/clipboard/index.js';
import {
  BLOCK_ID_ATTR,
  EDGELESS_BLOCK_CHILD_BORDER_WIDTH,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '../../__internal__/consts.js';
import type { BlockHost, EdgelessTool } from '../../__internal__/index.js';
import {
  asyncFocusRichText,
  bringForward,
  getRectByBlockElement,
  handleNativeRangeAtPoint,
  Point,
  reorder,
  type ReorderingAction,
  type ReorderingRange,
  reorderTo,
  sendBackward,
  type TopLevelBlockModel,
} from '../../__internal__/index.js';
import { getService } from '../../__internal__/service/index.js';
import type { CssVariableName } from '../../__internal__/theme/css-variables.js';
import { isCssVariable } from '../../__internal__/theme/css-variables.js';
import {
  getThemePropertyValue,
  listenToThemeChange,
} from '../../__internal__/theme/utils.js';
import { toast } from '../../components/toast.js';
import type {
  EdgelessPageBlockWidgetName,
  ImageBlockModel,
  NoteBlockModel,
  PageBlockModel,
  SurfaceBlockModel,
} from '../../index.js';
import { FontLoader } from '../font-loader/index.js';
import { Gesture } from '../text-selection/gesture.js';
import { NoteSlicer } from './components/note-slicer/index.js';
import { EdgelessNotesStatus } from './components/notes-status.js';
import { EdgelessToolbar } from './components/toolbar/edgeless-toolbar.js';
import { readImageSize, updateNotesPosition } from './components/utils.js';
import { ZoomBarToggleButton } from './components/zoom/zoom-bar-toggle-button.js';
import {
  EdgelessZoomToolbar,
  type ZoomAction,
} from './components/zoom/zoom-tool-bar.js';
import { EdgelessConnectorManager } from './connector-manager.js';
import { EdgelessPageKeyboardManager } from './edgeless-keyboard.js';
import type { EdgelessPageService } from './edgeless-page-service.js';
import { EdgelessFrameManager } from './frame-manager.js';
import { EdgelessSelectionManager } from './services/selection-manager.js';
import {
  EdgelessToolsManager,
  type Selectable,
} from './services/tools-manager.js';
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_OFFSET_X,
  DEFAULT_NOTE_OFFSET_Y,
  DEFAULT_NOTE_WIDTH,
  FIT_TO_SCREEN_PADDING,
} from './utils/consts.js';
import { xywhArrayToObject } from './utils/convert.js';
import { NoteResizeObserver } from './utils/note-resize-observer.js';
import {
  getBackgroundGrid,
  getCursorMode,
  getEdgelessElement,
} from './utils/query.js';
import { EdgelessSnapManager } from './utils/snap-manager.js';

noop(NoteSlicer);
export interface EdgelessSelectionSlots {
  hoverUpdated: Slot;
  viewportUpdated: Slot<{ zoom: number; center: IVec }>;
  selectedRectUpdated: Slot<{
    type: 'move' | 'select' | 'resize';
    delta?: {
      x: number;
      y: number;
    };
    dragging?: boolean;
  }>;
  edgelessToolUpdated: Slot<EdgelessTool>;
  reorderingNotesUpdated: Slot<ReorderingAction<Selectable>>;
  reorderingShapesUpdated: Slot<ReorderingAction<Selectable>>;
  pressShiftKeyUpdated: Slot<boolean>;
  cursorUpdated: Slot<string>;
  copyAsPng: Slot<{
    notes: NoteBlockModel[];
    shapes: PhasorElement[];
  }>;
}

export interface EdgelessContainer extends HTMLElement {
  readonly page: Page;
  readonly surface: SurfaceManager;
  readonly slots: EdgelessSelectionSlots;
}

@customElement('affine-edgeless-page')
export class EdgelessPageBlockComponent
  extends BlockElement<
    PageBlockModel,
    EdgelessPageService,
    EdgelessPageBlockWidgetName
  >
  implements EdgelessContainer, BlockHost
{
  static override styles = css`
    .affine-edgeless-page-block-container {
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
      height: 100%;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
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

    .affine-block-children-container.edgeless {
      padding-left: 0;
      position: relative;
      overflow: hidden;
      height: 100%;
      /**
       * Fix: pointerEvent stops firing after a short time.
       * When a gesture is started, the browser intersects the touch-action values of the touched element and its ancestors,
       * up to the one that implements the gesture (in other words, the first containing scrolling element)
       * https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
       */
      touch-action: none;

      background-size: var(--affine-edgeless-gap) var(--affine-edgeless-gap);
      background-position: var(--affine-edgeless-x) var(--affine-edgeless-y);
      background-color: var(--affine-background-primary-color);
      background-image: var(--affine-edgeless-grid);
      z-index: 0;
    }

    .affine-edgeless-layer {
      position: absolute;
      top: 0;
      left: 0;
      contain: layout style size;
      transform: translate(var(--affine-edgeless-x), var(--affine-edgeless-y))
        scale(var(--affine-zoom));
    }

    .affine-edgeless-block-child {
      position: absolute;
      transform-origin: center;
      box-sizing: border-box;
      border: 2px solid var(--affine-white-10);
      border-radius: 8px;
      box-shadow: var(--affine-shadow-3);
      pointer-events: all;
    }

    @media screen and (max-width: 1200px) {
      edgeless-zoom-toolbar {
        display: none;
      }
    }

    @media screen and (min-width: 1200px) {
      zoom-bar-toggle-button {
        display: none;
      }
    }

    @media print {
      .selected {
        background-color: transparent !important;
      }
    }
  `;

  /**
   * Shared components
   */
  components = {
    toolbar: <EdgelessToolbar | null>null,
    zoomToolbar: <EdgelessZoomToolbar | null>null,
    zoomBarToggleButton: <ZoomBarToggleButton | null>null,
  };

  keyboardManager: EdgelessPageKeyboardManager | null = null;

  gesture: Gesture | null = null;

  mouseRoot!: HTMLElement;

  showGrid = true;

  @state()
  edgelessTool: EdgelessTool = {
    type: 'default',
  };

  @state()
  private _rectsOfSelectedBlocks: DOMRect[] = [];

  @query('.affine-edgeless-surface-block-container')
  private _surfaceContainer!: HTMLDivElement;

  @query('.affine-edgeless-page-block-container')
  pageBlockContainer!: HTMLDivElement;

  @query('.affine-edgeless-layer')
  edgelessLayer!: HTMLDivElement;

  private _edgelessLayerWillChange = false;

  clipboard = new EdgelessClipboard(this.page, this);

  slots = {
    viewportUpdated: new Slot<{ zoom: number; center: IVec }>(),
    selectedRectUpdated: new Slot<{
      type: 'move' | 'select' | 'resize';
      delta?: {
        x: number;
        y: number;
      };
      dragging?: boolean;
    }>(),
    hoverUpdated: new Slot(),
    edgelessToolUpdated: new Slot<EdgelessTool>(),
    reorderingNotesUpdated: new Slot<ReorderingAction<Selectable>>(),
    reorderingShapesUpdated: new Slot<ReorderingAction<Selectable>>(),
    zoomUpdated: new Slot<ZoomAction>(),
    pressShiftKeyUpdated: new Slot<boolean>(),
    cursorUpdated: new Slot<string>(),
    elementSizeUpdated: new Slot<string>(),
    copyAsPng: new Slot<{
      notes: NoteBlockModel[];
      shapes: PhasorElement[];
    }>(),
    subpageLinked: new Slot<{ pageId: string }>(),
    subpageUnlinked: new Slot<{ pageId: string }>(),
    pageLinkClicked: new Slot<{ pageId: string; blockId?: string }>(),
    tagClicked: new Slot<{ tagId: string }>(),
  };

  surface!: SurfaceManager;

  fontLoader!: FontLoader;

  indexes: { max: string; min: string } = { max: 'a0', min: 'a0' };

  getService = getService;

  selectionManager!: EdgelessSelectionManager;
  tools!: EdgelessToolsManager;

  snap!: EdgelessSnapManager;
  connector!: EdgelessConnectorManager;
  frame!: EdgelessFrameManager;

  // Gets the top level notes.
  get notes() {
    return this.model.children.filter(
      child => child.flavour === 'affine:note'
    ) as TopLevelBlockModel[];
  }

  // Gets the sorted notes.
  get sortedNotes() {
    return this.notes.sort(compare);
  }

  get dispatcher() {
    return this.service?.uiEventDispatcher;
  }

  private _editorContainer: HTMLElement | null = null;

  get editorContainer(): HTMLElement {
    if (this._editorContainer) return this._editorContainer;
    this._editorContainer = this.closest('editor-container');
    assertExists(this._editorContainer);
    return this._editorContainer;
  }

  private _resizeObserver: ResizeObserver | null = null;

  private _noteResizeObserver = new NoteResizeObserver();

  computeValue(value: string) {
    const { parentElement } = this;
    assertExists(parentElement);
    if (isCssVariable(value)) {
      const cssValue = getThemePropertyValue(
        parentElement,
        value as CssVariableName
      );
      if (cssValue === undefined) {
        console.error(
          new Error(
            `All variables should have a value. Please check for any dirty data or variable renaming.Variable: ${value}`
          )
        );
      }
      return cssValue ?? value;
    }
    return value;
  }

  // just init surface, attach to dom later
  private _initSurface() {
    const { page } = this;
    const surfaceBlock = this.model.children.find(
      child => child.flavour === 'affine:surface'
    ) as SurfaceBlockModel | undefined;
    assertExists(surfaceBlock);
    const yContainer = surfaceBlock.originProp('elements') as InstanceType<
      typeof page.YMap
    >;
    this.surface = new SurfaceManager(yContainer, this.computeValue.bind(this));
    const { surface } = this;
    this._disposables.add(
      surface.slots.elementAdded.on(id => {
        const element = this.surface.pickById(id);
        assertExists(element);
        if (element instanceof ConnectorElement) {
          this.connector.updatePath(element);
        } else if (element instanceof FrameElement) {
          this.frame.calculateFrameColor(element);
        }
      })
    );

    this._disposables.add(
      surface.slots.elementUpdated.on(({ id, props }) => {
        if ('xywh' in props || 'rotate' in props) {
          this.slots.elementSizeUpdated.emit(id);
        }

        const element = surface.pickById(id);
        assertExists(element);

        if (element instanceof ConnectorElement) {
          if ('target' in props || 'source' in props || 'mode' in props) {
            this.connector.updatePath(element as ConnectorElement);
          }
        }
      })
    );

    this._disposables.add(
      listenToThemeChange(this, () => {
        this.surface.refresh();
      })
    );
  }

  private _handleToolbarFlag() {
    const createToolbar = () => {
      const toolbar = new EdgelessToolbar(this);
      const zoomToolBar = new EdgelessZoomToolbar(this);
      const zoomBarToggleButton = new ZoomBarToggleButton(this);

      this.appendChild(toolbar);
      this.appendChild(zoomToolBar);
      this.appendChild(zoomBarToggleButton);
      this.components.toolbar = toolbar;
      this.components.zoomToolbar = zoomToolBar;
      this.components.zoomBarToggleButton = zoomBarToggleButton;
    };

    if (
      this.page.awarenessStore.getFlag('enable_edgeless_toolbar') &&
      !this.components.toolbar &&
      !this.components.zoomToolbar &&
      !this.components.zoomBarToggleButton
    ) {
      createToolbar();
    }

    this._disposables.add(
      this.page.awarenessStore.slots.update.subscribe(
        msg => msg.state?.flags.enable_edgeless_toolbar,
        enable => {
          if (enable) {
            if (this.components.toolbar) return;
            createToolbar();
            return;
          }

          this.components.toolbar?.remove();
          this.components.zoomToolbar?.remove();
          this.components.zoomBarToggleButton?.remove();
          this.components.toolbar = null;
          this.components.zoomToolbar = null;
          this.components.zoomBarToggleButton = null;
        },
        {
          filter: msg => msg.id === this.page.doc.clientID,
        }
      )
    );
  }

  private _initSlotEffects() {
    // TODO: listen to new children
    // this.model.children.forEach(note => {
    //   note.propsUpdated.on(() => this.selectionManager.syncDraggingArea());
    // });
    const {
      _disposables,
      slots,
      selectionManager: selection,
      page,
      surface,
    } = this;
    _disposables.add(
      page.slots.yBlockUpdated.on(({ id, props }) => {
        const block = page.getBlockById(id);
        if (block && block.flavour === 'affine:note') {
          if ('prop:xywh' in props) {
            this.slots.elementSizeUpdated.emit(id);
          }
        }
      })
    );

    _disposables.add(
      slots.elementSizeUpdated.on(id => {
        const element = getEdgelessElement(this, id);
        if (element) {
          this.connector.syncConnectorPos([element]);
        }
      })
    );

    _disposables.add(
      surface.viewport.slots.viewportUpdated.on(({ zoom, center }) => {
        this.slots.viewportUpdated.emit({ zoom, center });
      })
    );

    let resetWillChange: ReturnType<typeof setTimeout> | null = null;
    _disposables.add(
      slots.viewportUpdated.on(() => {
        if (!this._edgelessLayerWillChange) {
          this._edgelessLayerWillChange = true;
          requestAnimationFrame(() => {
            if (!this.edgelessLayer) return;

            if (this.edgelessLayer.style.willChange !== 'transform') {
              this.edgelessLayer.style.willChange = 'transform';
            }
          });
        }

        if (resetWillChange) clearTimeout(resetWillChange);
        resetWillChange = setTimeout(() => {
          this._edgelessLayerWillChange = false;
          resetWillChange = null;
          requestAnimationFrame(() => {
            if (!this.edgelessLayer) return;

            this.edgelessLayer.style.removeProperty('will-change');
          });
        }, 150);
      })
    );

    _disposables.add(
      slots.viewportUpdated.on(() => {
        const prevZoom = this.style.getPropertyValue('--affine-zoom');
        const newZoom = this.surface.viewport.zoom;
        if (!prevZoom || +prevZoom !== newZoom) {
          this.style.setProperty('--affine-zoom', `${newZoom}`);
        }
        const { showGrid } = this;
        const { zoom, viewportX, viewportY } = this.surface.viewport;

        const { grid, gap, translateX, translateY } = getBackgroundGrid(
          viewportX,
          viewportY,
          zoom,
          showGrid
        );

        this.pageBlockContainer.style.setProperty(
          '--affine-edgeless-gap',
          `${gap}px`
        );
        this.pageBlockContainer.style.setProperty(
          '--affine-edgeless-grid',
          grid
        );
        this.pageBlockContainer.style.setProperty(
          '--affine-edgeless-x',
          `${translateX}px`
        );
        this.pageBlockContainer.style.setProperty(
          '--affine-edgeless-y',
          `${translateY}px`
        );

        if (this.selectionManager.selectedBlocks.length) {
          this.selectionManager.setSelectedBlocks([
            ...this.selectionManager.selectedBlocks,
          ]);
        }

        updateNotesPosition(this, this.notes);
      })
    );
    _disposables.add(
      selection.slots.blocksUpdated.on(selectedBlocks => {
        this.selectionManager.selectedBlocks = selectedBlocks;
        // TODO: remove `requestAnimationFrame`
        requestAnimationFrame(() => {
          this._rectsOfSelectedBlocks = selectedBlocks.map(
            getRectByBlockElement
          );
        });
      })
    );

    _disposables.add(
      slots.edgelessToolUpdated.on(edgelessTool => {
        this.edgelessTool = edgelessTool;

        slots.cursorUpdated.emit(getCursorMode(edgelessTool));
      })
    );
    _disposables.add(
      this.page.slots.historyUpdated.on(() => {
        this.requestUpdate();
      })
    );
    _disposables.add(this.tools);
    _disposables.add(this.selectionManager);
    _disposables.add(this.surface);

    _disposables.add(this._noteResizeObserver);
    _disposables.add(
      this._noteResizeObserver.slots.resize.on(resizedNotes => {
        const page = this.page;
        resizedNotes.forEach(([domRect, prevDomRect], id) => {
          const model = page.getBlockById(id) as TopLevelBlockModel;
          const { index, xywh } = model;
          const [x, y, w, h] = deserializeXYWH(xywh);

          if (index < this.indexes.min) {
            this.indexes.min = index;
          } else if (index > this.indexes.max) {
            this.indexes.max = index;
          }

          // ResizeObserver is not effected by CSS transform, so don't deal with viewport zoom.
          const newModelHeight =
            domRect.height +
            EDGELESS_BLOCK_CHILD_PADDING * 2 +
            EDGELESS_BLOCK_CHILD_BORDER_WIDTH * 2;

          if (!almostEqual(newModelHeight, h)) {
            const updateBlock = () => {
              page.updateBlock(model, {
                xywh: JSON.stringify([x, y, w, Math.round(newModelHeight)]),
              });
            };

            // Assume it's user-triggered resizing if both width and height change,
            // otherwise we don't add the size updating into history.
            // See https://github.com/toeverything/blocksuite/issues/3671
            const isResize =
              prevDomRect && !almostEqual(domRect.width, prevDomRect.width);
            if (isResize) {
              updateBlock();
            } else {
              page.withoutTransact(updateBlock);
            }
          }
        });

        slots.selectedRectUpdated.emit({ type: 'resize' });
      })
    );

    _disposables.add(slots.reorderingNotesUpdated.on(this.reorderNotes));
    _disposables.add(slots.reorderingShapesUpdated.on(this.reorderShapes));
    _disposables.add(
      slots.zoomUpdated.on((action: ZoomAction) =>
        this.components.zoomToolbar?.setZoomByAction(action)
      )
    );
    _disposables.add(
      slots.pressShiftKeyUpdated.on(pressed => {
        this.tools.shiftKey = pressed;
      })
    );
    _disposables.add(
      slots.cursorUpdated.on(
        throttle((cursor: string) => {
          this.style.cursor = cursor;
        }, 144)
      )
    );

    let canCopyAsPng = true;
    _disposables.add(
      slots.copyAsPng.on(({ notes, shapes }) => {
        if (!canCopyAsPng) return;
        canCopyAsPng = false;
        this.clipboard
          .copyAsPng(notes, shapes)
          .then(() => toast('Copied to clipboard'))
          .catch(() => toast('Failed to copy as PNG'))
          .finally(() => {
            canCopyAsPng = true;
          });
      })
    );
  }

  /**
   * Brings to front or sends to back.
   */
  private _reorderTo(
    elements: Selectable[],
    getIndexes: (elements: Selectable[]) => {
      start: string | null;
      end: string | null;
    },
    updateIndexes: (keys: string[], elements: Selectable[]) => void
  ) {
    reorderTo(
      elements,
      compare,
      getIndexes,
      (start, end, len) => generateNKeysBetween(start, end, len),
      updateIndexes
    );
  }

  /**
   * Brings forward or sends backward layer by layer.
   */
  private _reorder(
    elements: Selectable[],
    getIndexes: (pickedElements: Selectable[]) => {
      start: string | null;
      end: string | null;
    },
    pick: () => Selectable[],
    order: (ranges: ReorderingRange[], pickedElements: Selectable[]) => void,
    updateIndexes: (keys: string[], elements: Selectable[]) => void
  ) {
    reorder(
      elements,
      compare,
      pick,
      getIndexes,
      order,
      (start, end, len) => generateNKeysBetween(start, end, len),
      updateIndexes
    );
  }

  updateIndexes(
    keys: string[],
    elements: TopLevelBlockModel[],
    callback: (keys: string[]) => void
  ) {
    let index;
    let i = 0;
    let element;
    const len = elements.length;
    for (; i < len; i++) {
      index = keys[i];
      element = elements[i];
      if (element.index === index) continue;
      this.page.updateBlock(element, {
        index,
      });
    }

    callback(keys);
  }

  getElementModel(id: string) {
    return this.page.getBlockById(id) ?? this.surface.pickById(id) ?? null;
  }

  getSortedElementsWithViewportBounds(elements: Selectable[]) {
    const bounds = this.surface.viewport.viewportBounds;
    // TODO: opt filter
    return this.sortedNotes.filter(element => {
      if (elements.includes(element)) return true;
      return intersects(bounds, xywhArrayToObject(element));
    });
  }

  getSortedElementsByBound(bound: IBound) {
    return this.sortedNotes.filter(element => {
      return intersects(bound, xywhArrayToObject(element));
    });
  }

  // Just update `index`, we don't change the order of the notes in the children.
  reorderNotes = ({ elements, type }: ReorderingAction<Selectable>) => {
    const updateIndexes = (keys: string[], elements: Selectable[]) => {
      this.updateIndexes(keys, elements as TopLevelBlockModel[], keys => {
        const min = keys[0];
        if (min < this.indexes.min) {
          this.indexes.min = min;
        }
        const max = keys[keys.length - 1];
        if (max > this.indexes.max) {
          this.indexes.max = max;
        }
      });
    };

    switch (type) {
      case 'front':
        this._reorderTo(
          elements,
          () => ({
            start: this.indexes.max,
            end: null,
          }),
          updateIndexes
        );
        break;
      case 'forward':
        this._reorder(
          elements,
          (pickedElements: Selectable[]) => ({
            start: generateKeyBetween(null, pickedElements[0].index),
            end: null,
          }),
          () => this.getSortedElementsWithViewportBounds(elements),
          bringForward,
          updateIndexes
        );
        break;
      case 'backward':
        this._reorder(
          elements,
          (pickedElements: Selectable[]) => ({
            start: null,
            end: pickedElements[pickedElements.length - 1].index,
          }),
          () => this.getSortedElementsWithViewportBounds(elements),
          sendBackward,
          updateIndexes
        );
        break;
      case 'back':
        this._reorderTo(
          elements,
          () => ({
            start: null,
            end: this.indexes.min,
          }),
          updateIndexes
        );
        break;
    }
  };

  // Just update `index`, we don't change the order of the shapes in the children.
  reorderShapes = ({ elements, type }: ReorderingAction<Selectable>) => {
    const { surface } = this;
    const batch = surface.getBatch(surface.defaultBatch);
    const updateIndexes = (keys: string[], elements: Selectable[]) => {
      this.surface.updateIndexes(keys, elements as PhasorElement[], keys => {
        const min = keys[0];
        if (min < batch.min) {
          batch.min = min;
        }
        const max = keys[keys.length - 1];
        if (max > batch.max) {
          batch.max = max;
        }
      });
    };

    switch (type) {
      case 'front':
        this._reorderTo(
          elements,
          () => ({
            start: batch.max,
            end: null,
          }),
          updateIndexes
        );
        break;
      case 'forward':
        this._reorder(
          elements,
          (pickedElements: Selectable[]) => ({
            start: generateKeyBetween(null, pickedElements[0].index),
            end: null,
          }),
          () => this.surface.getSortedElementsWithViewportBounds(),
          bringForward,
          updateIndexes
        );
        break;
      case 'backward':
        this._reorder(
          elements,
          (pickedElements: Selectable[]) => ({
            start: null,
            end: pickedElements[pickedElements.length - 1].index,
          }),
          () => this.surface.getSortedElementsWithViewportBounds(),
          sendBackward,
          updateIndexes
        );
        break;
      case 'back':
        this._reorderTo(
          elements,
          () => ({
            start: null,
            end: batch.min,
          }),
          updateIndexes
        );
        break;
    }
  };

  /**
   * Adds a new note with the given point on the editor-container.
   *
   * @param: point Point
   * @returns: The id of new note
   */
  addNoteWithPoint(
    point: Point,
    options: {
      width?: number;
      height?: number;
      parentId?: string;
      noteIndex?: number;
      offsetX?: number;
      offsetY?: number;
    } = {}
  ) {
    const {
      width = DEFAULT_NOTE_WIDTH,
      height = DEFAULT_NOTE_HEIGHT,
      offsetX = DEFAULT_NOTE_OFFSET_X,
      offsetY = DEFAULT_NOTE_OFFSET_Y,
      parentId = this.page.root?.id,
      noteIndex: noteIndex,
    } = options;
    const [x, y] = this.surface.toModelCoord(point.x, point.y);
    return this.page.addBlock(
      'affine:note',
      {
        xywh: serializeXYWH(x - offsetX, y - offsetY, width, height),
        index: this.indexes.max,
      },
      parentId,
      noteIndex
    );
  }

  /**
   * Adds a new note with the given blocks and point.
   * @param blocks Array<Partial<BaseBlockModel>>
   * @param point Point
   */
  addNewNote(
    blocks: Array<Partial<BaseBlockModel>>,
    point: Point,
    options?: {
      width?: number;
      height?: number;
      parentId?: string;
      noteIndex?: number;
      offsetX?: number;
      offsetY?: number;
    }
  ): {
    noteId: string;
    ids: string[];
  } {
    this.page.captureSync();
    const { left, top } = this.surface.viewport;
    point.x -= left;
    point.y -= top;
    const noteId = this.addNoteWithPoint(point, options);
    const ids = this.page.addBlocks(
      blocks.map(({ flavour, ...blockProps }) => {
        assertExists(flavour);
        return {
          flavour,
          blockProps,
        };
      }),
      noteId
    );
    return {
      noteId,
      ids,
    };
  }

  addImage(
    model: Partial<ImageBlockModel>,
    point?: Point
  ): { noteId: string; ids: string[] } {
    const options = {
      width: model.width ?? 0,
      height: model.height ?? 0,
    };
    // force update size of image
    {
      delete model.width;
      delete model.height;
    }

    const rect = this.pageBlockContainer.getBoundingClientRect();
    const { width, height } = rect;

    if (options.width && options.height) {
      const w = width > 100 ? width - 100 : width;
      const h = height > 100 ? height - 100 : height;
      const s = w / h;
      const p = options.width / options.height;
      if (s >= 1) {
        options.height = Math.min(options.height, h);
        options.width = options.height * p;
      } else {
        options.width = Math.min(options.width, w);
        options.height = options.width / p;
      }
    }

    const { zoom } = this.surface.viewport;

    if (!point) point = new Point(0, 0);

    if (point.x === 0 && point.y === 0) {
      const { centerX, centerY } = this.surface.viewport;
      const [cx, cy] = this.surface.toViewCoord(centerX, centerY);
      point.x = cx;
      point.y = cy;
    }
    const cx = point.x;
    const cy = point.y;

    let x = 0;
    let y = 0;
    if (zoom > 1) {
      x = cx - options.width / 2;
      y = cy - options.height / 2;
    } else {
      x = cx - (options.width * zoom) / 2;
      y = cy - (options.height * zoom) / 2;
    }

    return this.addNewNote([model], new Point(x, y), options);
  }

  async addImages(
    fileInfos: {
      file: File;
      sourceId: string;
    }[],
    point?: Point
  ) {
    const models: Partial<ImageBlockModel>[] = [];
    for (const { file, sourceId } of fileInfos) {
      const size = await readImageSize(file);
      models.push({
        flavour: 'affine:image',
        sourceId,
        ...size,
      });
    }

    const notes = models.map(model => this.addImage(model, point));
    const { noteId } = notes[notes.length - 1];

    const note = this.notes.find(note => note.id === noteId);
    assertExists(note);

    this.tools.switchToDefaultMode({
      elements: [note.id],
      editing: false,
    });
  }

  /*
   * Set selection state by giving noteId & blockId.
   * Not supports surface elements.
   */
  setSelection(noteId: string, _active = true, blockId: string, point?: Point) {
    const noteBlock = this.notes.find(b => b.id === noteId);
    assertExists(noteBlock);

    requestAnimationFrame(() => {
      this.selectionManager.setSelectedBlocks([]);
      this.selectionManager.setSelection({
        elements: [noteBlock.id],
        editing: false,
      });
      // Waiting dom updated, `note mask` is removed
      this.updateComplete.then(() => {
        if (blockId) {
          asyncFocusRichText(this.page, blockId);
        } else if (point) {
          // Cannot reuse `handleNativeRangeClick` directly here,
          // since `retargetClick` will re-target to pervious editor
          handleNativeRangeAtPoint(point.x, point.y);
        }
      });
    });
  }

  getElementsBound(): IBound | null {
    const bounds = [];

    this.notes.forEach(note => {
      bounds.push(Bound.deserialize(note.xywh));
    });

    const surfaceElementsBound = this.surface.getElementsBound();
    if (surfaceElementsBound) {
      bounds.push(surfaceElementsBound);
    }

    return getCommonBound(bounds);
  }

  override update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('page')) {
      this._initSurface();
      this.connector = new EdgelessConnectorManager(this);
      this.frame = new EdgelessFrameManager(this);
      this.snap = new EdgelessSnapManager(this);
      this.surface.init();
    }
    if (changedProperties.has('edgelessTool')) {
      this.tools.edgelessTool = this.edgelessTool;
    }
    super.update(changedProperties);
  }

  private _initResizeEffect() {
    const resizeObserver = new ResizeObserver((_: ResizeObserverEntry[]) => {
      this.surface.onResize();
      this.selectionManager.setSelectedBlocks([
        ...this.selectionManager.selectedBlocks,
      ]);
      this.selectionManager.setSelection(this.selectionManager.state);
    });
    resizeObserver.observe(this.pageBlockContainer);
    this._resizeObserver = resizeObserver;
  }

  private _initPixelRatioChangeEffect() {
    let media: MediaQueryList;

    const onPixelRatioChange = () => {
      if (media) {
        this.surface?.onResize();
        media.removeEventListener('change', onPixelRatioChange);
      }

      media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      media.addEventListener('change', onPixelRatioChange);
    };

    onPixelRatioChange();
  }

  private _initNoteHeightUpdate() {
    const resetNoteResizeObserver = throttle(
      () => {
        requestAnimationFrame(() => {
          this._noteResizeObserver.resetListener(this.page);
        });
      },
      16,
      { leading: true }
    );
    const listenChildrenUpdate = (root: BaseBlockModel<object> | null) => {
      if (!root) return;

      this._disposables.add(root.childrenUpdated.on(resetNoteResizeObserver));
    };

    listenChildrenUpdate(this.page.root);
    this._disposables.add(
      this.page.slots.rootAdded.on(root => listenChildrenUpdate(root))
    );
  }

  private _initFontloader() {
    if (!this.fontLoader) this.fontLoader = new FontLoader();

    this._disposables.add(
      this.fontLoader.slots.loaded.on(font => {
        if (font !== 'Kalam:n4,n7' || !this.surface) return;

        if (this.surface.getElementsByType('text').length > 0) {
          this.surface.refresh();
        }
      })
    );
    this.fontLoader.load(['Kalam:n4,n7']);
  }

  override firstUpdated() {
    this._initSlotEffects();
    this._initResizeEffect();
    this._initPixelRatioChangeEffect();
    this._initNoteHeightUpdate();
    this._initFontloader();
    this.clipboard.init(this.page);

    requestAnimationFrame(() => {
      // Should be called in requestAnimationFrame,
      // so as to avoid DOM mutation in SurfaceManager constructor
      this.surface.attach(this._surfaceContainer);
      this._noteResizeObserver.resetListener(this.page);
      if (!this._tryLoadViewportLocalRecord()) {
        this._initViewport();
      }

      this._handleToolbarFlag();
      this.requestUpdate();
    });
  }

  private _tryLoadViewportLocalRecord() {
    const { viewport } = this.surface;
    const key = 'blocksuite:' + this.page.id + ':edgelessViewport';
    const viewportData = sessionStorage.getItem(key);
    if (viewportData) {
      try {
        const { x, y, zoom } = JSON.parse(viewportData);
        viewport.setViewport(zoom, [x, y]);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  public getFitToScreenData(
    padding: [number, number, number, number] = [0, 0, 0, 0]
  ) {
    const bounds = [];

    this.notes.forEach(note => {
      bounds.push(Bound.deserialize(note.xywh));
    });

    const surfaceElementsBound = this.surface.getElementsBound();
    if (surfaceElementsBound) {
      bounds.push(surfaceElementsBound);
    }

    const [pt, pr, pb, pl] = padding;
    const { viewport } = this.surface;
    let { centerX, centerY, zoom } = viewport;

    if (bounds.length) {
      const { width, height } = viewport;
      const bound = getCommonBound(bounds);
      assertExists(bound);

      zoom = Math.min(
        (width - FIT_TO_SCREEN_PADDING - (pr + pl)) / bound.w,
        (height - FIT_TO_SCREEN_PADDING - (pt + pb)) / bound.h
      );

      centerX = bound.x + (bound.w + pr / zoom) / 2 - pl / zoom / 2;
      centerY = bound.y + (bound.h + pb / zoom) / 2 - pt / zoom / 2;
    } else {
      zoom = 1;
    }
    return { zoom, centerX, centerY };
  }

  private _initViewport() {
    const { zoom, centerX, centerY } = this.getFitToScreenData();
    const { viewport } = this.surface;
    viewport.setViewport(zoom, [centerX, centerY]);
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
  }

  override connectedCallback() {
    super.connectedCallback();

    this.gesture = new Gesture(this);
    this.keyboardManager = new EdgelessPageKeyboardManager(this);

    this.handleEvent('selectionChange', () => {
      const surface = this.root.selectionManager.value.find(
        (sel): sel is SurfaceSelection => sel.is('surface')
      );
      if (!surface) return;

      const el = this.surface.pickById(surface.elements[0]);
      if (el?.type === 'shape') {
        return true;
      }

      return;
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.mouseRoot = this.parentElement!;
    this.selectionManager = new EdgelessSelectionManager(this);
    this.tools = new EdgelessToolsManager(this, this.root.uiEventDispatcher);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clipboard.dispose();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    this.gesture = null;
    this.keyboardManager = null;

    this.tools.clear();
    this.tools.dispose();

    this.selectionManager.dispose();
  }

  override render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const { _rectsOfSelectedBlocks, sortedNotes, surface } = this;
    const { viewport } = surface;

    const { left, top } = viewport;

    const widgets = html`${repeat(
      Object.entries(this.widgets),
      ([id]) => id,
      ([_, widget]) => widget
    )}`;

    return html`
      <div class="affine-edgeless-surface-block-container">
        <!-- attach canvas later in Phasor -->
      </div>
      <div class="affine-edgeless-page-block-container">
        <div class="affine-block-children-container edgeless">
          <affine-note-slicer .edgelessPage=${this}></affine-note-slicer>
          <div class="affine-edgeless-layer">
            <edgeless-notes-container
              .edgeless=${this}
              .notes=${sortedNotes}
              .renderer=${this.renderModel.bind(this)}
            ></edgeless-notes-container>
          </div>
        </div>
        <affine-selected-blocks
          .mouseRoot=${this.mouseRoot}
          .state=${{
            rects: _rectsOfSelectedBlocks,
            grab: false,
          }}
          .offset=${{
            x: -left,
            y: -top,
          }}
        ></affine-selected-blocks>
        <edgeless-hover-rect .edgeless=${this}> </edgeless-hover-rect>
        <edgeless-dragging-area-rect
          .edgeless=${this}
        ></edgeless-dragging-area-rect>
        <edgeless-selected-rect .edgeless=${this}></edgeless-selected-rect>
        ${EdgelessNotesStatus(this, this.notes)} ${widgets}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-page': EdgelessPageBlockComponent;
  }
}

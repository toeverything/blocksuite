/// <reference types="vite/client" />
import './components/rects/edgeless-selected-rect.js';
import './components/toolbar/edgeless-toolbar.js';

import {
  BLOCK_ID_ATTR,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '@blocksuite/global/config';
import { BlockElement } from '@blocksuite/lit';
import {
  Bound,
  compare,
  deserializeXYWH,
  generateKeyBetween,
  generateNKeysBetween,
  getCommonBound,
  type IBound,
  intersects,
  type PhasorElement,
  serializeXYWH,
  SurfaceManager,
} from '@blocksuite/phasor';
import {
  assertExists,
  type BaseBlockModel,
  type Page,
  Slot,
} from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EdgelessClipboard } from '../../__internal__/clipboard/index.js';
import {
  almostEqual,
  asyncFocusRichText,
  type BlockComponentElement,
  bringForward,
  getRectByBlockElement,
  handleNativeRangeAtPoint,
  type Point,
  reorder,
  type ReorderingAction,
  type ReorderingRange,
  reorderTo,
  resetNativeSelection,
  sendBackward,
  type TopLevelBlockModel,
} from '../../__internal__/index.js';
import { getService, registerService } from '../../__internal__/service.js';
import type { CssVariableName } from '../../__internal__/theme/css-variables.js';
import { isCssVariable } from '../../__internal__/theme/css-variables.js';
import {
  getThemePropertyValue,
  listenToThemeChange,
} from '../../__internal__/theme/utils.js';
import type {
  BlockHost,
  DragHandle,
  EdgelessTool,
  NoteBlockModel,
  PageBlockModel,
  SurfaceBlockModel,
} from '../../index.js';
import { PageBlockService } from '../../index.js';
import { tryUpdateNoteSize } from '../utils/index.js';
import { EdgelessBlockChildrenContainer } from './components/block-children-container.js';
import { createDragHandle } from './components/create-drag-handle.js';
import { EdgelessDraggingAreaRect } from './components/rects/dragging-area-rect.js';
import { EdgelessHoverRect } from './components/rects/hover-rect.js';
import {
  EdgelessToolbar,
  type ZoomAction,
} from './components/toolbar/edgeless-toolbar.js';
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_OFFSET_X,
  DEFAULT_NOTE_OFFSET_Y,
  DEFAULT_NOTE_WIDTH,
  FIT_TO_SCREEN_PADDING,
} from './utils/consts.js';
import { xywhArrayToObject } from './utils/convert.js';
import { bindEdgelessHotkeys } from './utils/hotkey.js';
import { NoteResizeObserver } from './utils/note-resize-observer.js';
import { getBackgroundGrid, getCursorMode } from './utils/query.js';
import {
  EdgelessSelectionManager,
  type EdgelessSelectionState,
  type Selectable,
} from './utils/selection-manager.js';
import { EdgelessSnapManager } from './utils/snap-manager.js';

export interface EdgelessSelectionSlots {
  hoverUpdated: Slot;
  viewportUpdated: Slot;
  selectionUpdated: Slot<EdgelessSelectionState>;
  surfaceUpdated: Slot;
  edgelessToolUpdated: Slot<EdgelessTool>;
  reorderingNotesUpdated: Slot<ReorderingAction<Selectable>>;
  reorderingShapesUpdated: Slot<ReorderingAction<Selectable>>;
  pressShiftKeyUpdated: Slot<boolean>;
}

export interface EdgelessContainer extends HTMLElement {
  readonly page: Page;
  readonly surface: SurfaceManager;
  readonly slots: EdgelessSelectionSlots;
}

@customElement('affine-edgeless-page')
export class EdgelessPageBlockComponent
  extends BlockElement<PageBlockModel>
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
      contain: layout style size;
      transform: translate(var(--affine-edgeless-x), var(--affine-edgeless-y))
        scale(var(--affine-zoom));
    }

    .affine-edgeless-hover-rect {
      position: absolute;
      border-radius: 0;
      pointer-events: none;
      box-sizing: border-box;
      z-index: 1;
      border: var(--affine-border-width) solid var(--affine-blue);
    }
  `;

  flavour = 'edgeless' as const;

  /**
   * Shared components
   */
  components = {
    dragHandle: <DragHandle | null>null,
    toolbar: <EdgelessToolbar | null>null,
  };

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

  clipboard = new EdgelessClipboard(this.page, this);

  slots = {
    viewportUpdated: new Slot(),
    selectedBlocksUpdated: new Slot<BlockComponentElement[]>(),
    selectionUpdated: new Slot<EdgelessSelectionState>(),
    hoverUpdated: new Slot(),
    surfaceUpdated: new Slot(),
    edgelessToolUpdated: new Slot<EdgelessTool>(),
    reorderingNotesUpdated: new Slot<ReorderingAction<Selectable>>(),
    reorderingShapesUpdated: new Slot<ReorderingAction<Selectable>>(),
    zoomUpdated: new Slot<ZoomAction>(),
    pressShiftKeyUpdated: new Slot<boolean>(),

    subpageLinked: new Slot<{ pageId: string }>(),
    subpageUnlinked: new Slot<{ pageId: string }>(),
    pageLinkClicked: new Slot<{ pageId: string; blockId?: string }>(),
  };

  surface!: SurfaceManager;

  indexes: { max: string; min: string } = { max: 'a0', min: 'a0' };

  getService = getService;

  selection!: EdgelessSelectionManager;

  snap!: EdgelessSnapManager;

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

  private _resizeObserver: ResizeObserver | null = null;

  private _noteResizeObserver = new NoteResizeObserver();

  private _clearSelection() {
    requestAnimationFrame(() => {
      if (!this.selection.isActive) {
        resetNativeSelection(null);
      }
    });
  }

  // just init surface, attach to dom later
  private _initSurface() {
    const { page, parentElement } = this;
    const surfaceBlock = this.model.children.find(
      child => child.flavour === 'affine:surface'
    ) as SurfaceBlockModel | undefined;
    assertExists(parentElement);
    assertExists(surfaceBlock);
    const yContainer = surfaceBlock.originProp('elements') as InstanceType<
      typeof page.YMap
    >;
    this.surface = new SurfaceManager(yContainer, value => {
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
    });
    this._disposables.add(
      listenToThemeChange(this, () => {
        this.surface.refresh();
      })
    );
  }

  private _handleToolbarFlag() {
    const createToolbar = () => {
      const toolbar = new EdgelessToolbar(this);
      this.appendChild(toolbar);
      this.components.toolbar = toolbar;
    };

    if (
      this.page.awarenessStore.getFlag('enable_edgeless_toolbar') &&
      !this.components.toolbar
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
          this.components.toolbar = null;
        },
        {
          filter: msg => msg.id === this.page.doc.clientID,
        }
      )
    );
  }

  private _initDragHandle = () => {
    const createHandle = () => {
      this.components.dragHandle = createDragHandle(this);
    };
    if (
      this.page.awarenessStore.getFlag('enable_drag_handle') &&
      !this.components.dragHandle
    ) {
      createHandle();
    }
    this._disposables.add(
      this.page.awarenessStore.slots.update.subscribe(
        msg => msg.state?.flags.enable_drag_handle,
        enable => {
          if (enable) {
            if (this.components.dragHandle) return;
            createHandle();
            return;
          }
          this.components.dragHandle?.remove();
          this.components.dragHandle = null;
        },
        {
          filter: msg => msg.id === this.page.doc.clientID,
        }
      )
    );
  };

  private _initSlotEffects() {
    // TODO: listen to new children
    // this.model.children.forEach(note => {
    //   note.propsUpdated.on(() => this.selection.syncDraggingArea());
    // });
    const { _disposables, slots } = this;
    _disposables.add(
      slots.viewportUpdated.on(() => {
        const prevZoom = this.style.getPropertyValue('--affine-zoom');
        const newZoom = this.surface.viewport.zoom;
        if (!prevZoom || +prevZoom !== newZoom) {
          this.style.setProperty('--affine-zoom', `${newZoom}`);
          this.components.dragHandle?.setScale(newZoom);
        }
        this.components.dragHandle?.hide();
        if (this.selection.selectedBlocks.length) {
          slots.selectedBlocksUpdated.emit([...this.selection.selectedBlocks]);
        }
        this.requestUpdate();
      })
    );
    _disposables.add(
      slots.selectedBlocksUpdated.on(selectedBlocks => {
        this.selection.selectedBlocks = selectedBlocks;
        // TODO: remove `requestAnimationFrame`
        requestAnimationFrame(() => {
          this._rectsOfSelectedBlocks = selectedBlocks.map(
            getRectByBlockElement
          );
        });
        // this.requestUpdate();
      })
    );
    _disposables.add(slots.hoverUpdated.on(() => this.requestUpdate()));
    _disposables.add(
      slots.selectionUpdated.on(state => {
        this.selection.state = state;
        this._clearSelection();
        this.requestUpdate();
      })
    );
    _disposables.add(slots.surfaceUpdated.on(() => this.requestUpdate()));
    _disposables.add(
      slots.edgelessToolUpdated.on(edgelessTool => {
        if (edgelessTool.type !== 'default') {
          this.components.dragHandle?.hide();
        }
        this.edgelessTool = edgelessTool;
      })
    );
    _disposables.add(
      this.page.slots.historyUpdated.on(() => {
        this._clearSelection();
        this.requestUpdate();
      })
    );
    _disposables.add(this.selection);
    _disposables.add(this.surface);
    _disposables.add(bindEdgelessHotkeys(this));

    _disposables.add(this._noteResizeObserver);
    _disposables.add(
      this._noteResizeObserver.slots.resize.on(resizedNotes => {
        const page = this.page;
        resizedNotes.forEach((domRect, id) => {
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
            domRect.height + EDGELESS_BLOCK_CHILD_PADDING * 2;

          if (!almostEqual(newModelHeight, h)) {
            page.updateBlock(model, {
              xywh: JSON.stringify([x, y, w, Math.round(newModelHeight)]),
            });
          }
        });

        // FIXME: force updating selection for triggering re-render `selected-rect`
        slots.selectionUpdated.emit({ ...this.selection.state });
      })
    );

    _disposables.add(slots.reorderingNotesUpdated.on(this.reorderNotes));
    _disposables.add(slots.reorderingShapesUpdated.on(this.reorderShapes));
    _disposables.add(
      slots.zoomUpdated.on((action: ZoomAction) =>
        this.components.toolbar?.setZoomByAction(action)
      )
    );
    _disposables.add(
      slots.pressShiftKeyUpdated.on(pressed => {
        this.selection.shiftKey = pressed;
        this.requestUpdate();
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

  getSortedElementsWithViewportBounds(elements: Selectable[]) {
    const bounds = this.surface.viewport.viewportBounds;
    // TODO: opt filter
    return this.sortedNotes.filter(element => {
      if (elements.includes(element)) return true;
      return intersects(bounds, xywhArrayToObject(element));
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
    const updateIndexes = (keys: string[], elements: Selectable[]) => {
      this.surface.updateIndexes(keys, elements as PhasorElement[], keys => {
        const min = keys[0];
        if (min < this.surface.indexes.min) {
          this.surface.indexes.min = min;
        }
        const max = keys[keys.length - 1];
        if (max > this.surface.indexes.max) {
          this.surface.indexes.max = max;
        }
      });
    };

    switch (type) {
      case 'front':
        this._reorderTo(
          elements,
          () => ({
            start: this.surface.indexes.max,
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
            end: this.surface.indexes.min,
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
  ) {
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

  /** Moves selected blocks into a new note at the given point. */
  moveBlocksWithNewNote(
    blocks: BaseBlockModel[],
    point: Point,
    {
      rect,
      focus,
      parentId,
      noteIndex,
    }: {
      rect?: DOMRect;
      focus?: boolean;
      parentId?: string;
      noteIndex?: number;
    } = {}
  ) {
    const { left, top, zoom } = this.surface.viewport;
    const width = rect?.width
      ? rect.width / zoom + EDGELESS_BLOCK_CHILD_PADDING * 2
      : DEFAULT_NOTE_WIDTH;
    point.x -= left;
    point.y -= top;
    const noteId = this.addNoteWithPoint(point, {
      width,
      parentId,
      noteIndex,
    });
    const noteModel = this.page.getBlockById(noteId) as NoteBlockModel;
    this.page.moveBlocks(blocks, noteModel);

    focus && this.setSelection(noteId, true, blocks[0].id, point);
  }

  /*
   * Set selection state by giving noteId & blockId.
   * Not supports surface elements.
   */
  setSelection(noteId: string, active = true, blockId: string, point?: Point) {
    const noteBlock = this.notes.find(b => b.id === noteId);
    assertExists(noteBlock);

    requestAnimationFrame(() => {
      this.slots.selectedBlocksUpdated.emit([]);
      this.slots.selectionUpdated.emit({
        selected: [noteBlock as TopLevelBlockModel],
        active,
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

  /**
   * Clear selected blocks.
   */
  clearSelectedBlocks() {
    if (this.selection.selectedBlocks.length) {
      this.slots.selectedBlocksUpdated.emit([]);
    }
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
      this.selection = new EdgelessSelectionManager(
        this,
        this.root.uiEventDispatcher
      );
      this.snap = new EdgelessSnapManager(this);
    }
    if (changedProperties.has('edgelessTool')) {
      this.selection.edgelessTool = this.edgelessTool;
    }
    super.update(changedProperties);
  }

  private _initResizeEffect() {
    const resizeObserver = new ResizeObserver((_: ResizeObserverEntry[]) => {
      this.surface.onResize();
      this.slots.selectedBlocksUpdated.emit([...this.selection.selectedBlocks]);
      this.slots.selectionUpdated.emit({ ...this.selection.state });
    });
    resizeObserver.observe(this.pageBlockContainer);
    this._resizeObserver = resizeObserver;
  }

  override firstUpdated() {
    this._initSlotEffects();
    this._initDragHandle();
    this._initResizeEffect();
    this.clipboard.init(this.page);
    tryUpdateNoteSize(this.page, this.surface.viewport.zoom);

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

    // XXX: should be called after rich text components are mounted
    this._clearSelection();

    // should be updated on any frame add and delete
    this.page.root?.childrenUpdated.on(() => {
      requestAnimationFrame(() => {
        this._noteResizeObserver.resetListener(this.page);
      });
    });
  }

  private _tryLoadViewportLocalRecord() {
    const { viewport } = this.surface;
    const key = 'blocksuite:' + this.page.id + ':edgelessViewport';
    const viewportData = sessionStorage.getItem(key);
    if (viewportData) {
      try {
        const { x, y, zoom } = JSON.parse(viewportData);
        viewport.setCenter(x, y);
        viewport.setZoom(zoom);
        this.slots.viewportUpdated.emit();
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  public getFitToScreenData() {
    const bounds = [];

    this.notes.forEach(note => {
      bounds.push(Bound.deserialize(note.xywh));
    });

    const surfaceElementsBound = this.surface.getElementsBound();
    if (surfaceElementsBound) {
      bounds.push(surfaceElementsBound);
    }

    const { viewport } = this.surface;
    let { centerX, centerY, zoom } = viewport;

    if (bounds.length) {
      const { width, height } = viewport;
      const bound = getCommonBound(bounds);
      assertExists(bound);

      zoom = Math.min(
        (width - FIT_TO_SCREEN_PADDING) / bound.w,
        (height - FIT_TO_SCREEN_PADDING) / bound.h
      );

      centerX = bound.x + bound.w / 2;
      centerY = bound.y + bound.h / 2;
    } else {
      zoom = 1;
    }
    return { zoom, centerX, centerY };
  }
  private _initViewport() {
    const viewData = this.getFitToScreenData();
    const { viewport } = this.surface;
    viewport.setCenter(viewData.centerX, viewData.centerY);
    viewport.setZoom(viewData.zoom);
    this.slots.viewportUpdated.emit();
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
  }

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:page', PageBlockService);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.mouseRoot = this.parentElement!;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clipboard.dispose();
    this.components.dragHandle?.remove();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  override render() {
    requestAnimationFrame(() => {
      this.selection.refreshRemoteSelection();
    });

    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const { edgelessTool, page, selection, surface, _rectsOfSelectedBlocks } =
      this;
    const { state, draggingArea } = selection;
    const { viewport } = surface;

    const childrenContainer = EdgelessBlockChildrenContainer(
      this.sortedNotes,
      state.active,
      this.root.renderModel
    );

    const { zoom, viewportX, viewportY, left, top } = viewport;
    const draggingAreaTpl = EdgelessDraggingAreaRect(draggingArea);

    const hoverState = selection.getHoverState();
    const hoverRectTpl = EdgelessHoverRect(hoverState);

    const { grid, gap, translateX, translateY } = getBackgroundGrid(
      viewportX,
      viewportY,
      zoom,
      this.showGrid
    );

    const blockContainerStyle = {
      cursor: getCursorMode(edgelessTool),
      '--affine-edgeless-gap': `${gap}px`,
      '--affine-edgeless-grid': grid,
      '--affine-edgeless-x': `${translateX}px`,
      '--affine-edgeless-y': `${translateY}px`,
    };

    return html`
      <div class="affine-edgeless-surface-block-container">
        <!-- attach canvas later in Phasor -->
      </div>
      <div
        class="affine-edgeless-page-block-container"
        style=${styleMap(blockContainerStyle)}
      >
        <div class="affine-block-children-container edgeless">
          <div class="affine-edgeless-layer">${childrenContainer}</div>
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
        ${hoverRectTpl} ${draggingAreaTpl}
        ${state.selected.length
          ? html`
              <edgeless-selected-rect
                disabled=${edgelessTool.type === 'pan'}
                .page=${page}
                .state=${state}
                .slots=${this.slots}
                .surface=${surface}
              ></edgeless-selected-rect>
            `
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-page': EdgelessPageBlockComponent;
  }
}

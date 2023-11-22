import './components/toolbar/edgeless-toolbar.js';
import '../../surface-block/surface-block.js';

import type { SurfaceSelection } from '@blocksuite/block-std';
import {
  assertExists,
  debounce,
  Slot,
  throttle,
} from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { toast } from '../../_common/components/toast.js';
import { BLOCK_ID_ATTR } from '../../_common/consts.js';
import { listenToThemeChange } from '../../_common/theme/utils.js';
import { getViewportFromSession } from '../../_common/utils/edgeless.js';
import type {
  EdgelessElement,
  EdgelessTool,
  Point,
  Selectable,
} from '../../_common/utils/index.js';
import {
  asyncFocusRichText,
  handleNativeRangeAtPoint,
  type ReorderingAction,
  type TopLevelBlockModel,
} from '../../_common/utils/index.js';
import { keys, pick } from '../../_common/utils/iterable.js';
import { EdgelessClipboard } from '../../_legacy/clipboard/index.js';
import { getService } from '../../_legacy/service/index.js';
import type { ImageBlockModel } from '../../image-block/index.js';
import type { NoteBlockModel } from '../../note-block/index.js';
import { ZOOM_INITIAL } from '../../surface-block/consts.js';
import { EdgelessBlockType } from '../../surface-block/edgeless-types.js';
import {
  Bound,
  clamp,
  getCommonBound,
  GroupElement,
  type IBound,
  intersects,
  type IVec,
  type PhasorElement,
  type PhasorElementLocalRecordValues,
  serializeXYWH,
  Vec,
  ZOOM_MIN,
} from '../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../surface-block/surface-block.js';
import { type SurfaceBlockModel } from '../../surface-block/surface-model.js';
import { ClipboardController as PageClipboardController } from '../clipboard/index.js';
import type { FontLoader } from '../font-loader/font-loader.js';
import type { PageBlockModel } from '../page-model.js';
import { Gesture } from '../text-selection/gesture.js';
import { pageRangeSyncFilter } from '../text-selection/sync-filter.js';
import type { EdgelessPageBlockWidgetName } from '../types.js';
import type { EdgelessBlockPortalContainer } from './components/block-portal/edgeless-block-portal.js';
import { EdgelessToolbar } from './components/toolbar/edgeless-toolbar.js';
import { readImageSize } from './components/utils.js';
import { ZoomBarToggleButton } from './components/zoom/zoom-bar-toggle-button.js';
import {
  EdgelessZoomToolbar,
  type ZoomAction,
} from './components/zoom/zoom-tool-bar.js';
import { EdgelessClipboardController } from './controllers/clipboard.js';
import { EdgelessPageKeyboardManager } from './edgeless-keyboard.js';
import type { EdgelessPageService } from './edgeless-page-service.js';
import { LocalRecordManager } from './services/local-record-manager.js';
import { EdgelessSelectionManager } from './services/selection-manager.js';
import { EdgelessToolsManager } from './services/tools-manager.js';
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_OFFSET_X,
  DEFAULT_NOTE_OFFSET_Y,
  DEFAULT_NOTE_WIDTH,
  FIT_TO_SCREEN_PADDING,
} from './utils/consts.js';
import { xywhArrayToObject } from './utils/convert.js';
import { getCursorMode, isFrameBlock, isPhasorElement } from './utils/query.js';

type EdtitorContainer = HTMLElement & { mode: 'page' | 'edgeless' };

const { NOTE, IMAGE, FRAME } = EdgelessBlockType;

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
  reorderingBlocksUpdated: Slot<ReorderingAction<Selectable>>;
  reorderingShapesUpdated: Slot<ReorderingAction<Selectable>>;
  pressShiftKeyUpdated: Slot<boolean>;
  cursorUpdated: Slot<string>;
  copyAsPng: Slot<{
    notes: NoteBlockModel[];
    shapes: PhasorElement[];
  }>;
  readonlyUpdated: Slot<boolean>;
}
@customElement('affine-edgeless-page')
export class EdgelessPageBlockComponent extends BlockElement<
  PageBlockModel,
  EdgelessPageService,
  EdgelessPageBlockWidgetName
> {
  static override styles = css`
    .widgets-container {
      position: absolute;
      left: 0;
      top: 0;
      contain: size layout;
    }

    .affine-edgeless-layer {
      position: absolute;
      top: 0;
      left: 0;
      contain: size layout style;
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

  @state()
  edgelessTool: EdgelessTool = {
    type: localStorage.defaultTool ?? 'default',
  };

  @query('edgeless-block-portal-container')
  pageBlockContainer!: EdgelessBlockPortalContainer;

  @query('.affine-edgeless-layer')
  edgelessLayer!: HTMLDivElement;

  clipboard = new EdgelessClipboard(this.page, this);

  pageClipboardController = new PageClipboardController(this);
  clipboardController = new EdgelessClipboardController(
    this,
    this.pageClipboardController
  );

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
    reorderingBlocksUpdated: new Slot<ReorderingAction<TopLevelBlockModel>>(),
    reorderingShapesUpdated: new Slot<ReorderingAction<Selectable>>(),
    zoomUpdated: new Slot<ZoomAction>(),
    pressShiftKeyUpdated: new Slot<boolean>(),
    cursorUpdated: new Slot<string>(),
    copyAsPng: new Slot<{
      blocks: TopLevelBlockModel[];
      shapes: PhasorElement[];
    }>(),
    subpageLinked: new Slot<{ pageId: string }>(),
    subpageUnlinked: new Slot<{ pageId: string }>(),
    pageLinkClicked: new Slot<{ pageId: string; blockId?: string }>(),
    tagClicked: new Slot<{ tagId: string }>(),
    readonlyUpdated: new Slot<boolean>(),
    draggingAreaUpdated: new Slot(),

    elementUpdated: new Slot<{
      id: string;
      props: Record<string, unknown>;
    }>(),
    elementAdded: new Slot<string>(),
    elementRemoved: new Slot<{ id: string; element: EdgelessElement }>(),
  };

  @query('affine-surface')
  surface!: SurfaceBlockComponent;

  fontLoader!: FontLoader;

  getService = getService;

  selectionManager!: EdgelessSelectionManager;
  tools!: EdgelessToolsManager;
  localRecord!: LocalRecordManager<PhasorElementLocalRecordValues>;

  get dispatcher() {
    return this.service?.uiEventDispatcher;
  }

  private _editorContainer: EdtitorContainer | null = null;

  get editorContainer(): EdtitorContainer {
    if (this._editorContainer) return this._editorContainer;
    this._editorContainer = this.closest('editor-container');
    assertExists(this._editorContainer);
    return this._editorContainer;
  }
  private _resizeObserver: ResizeObserver | null = null;

  get surfaceBlockModel() {
    return this.model.children.find(
      child => child.flavour === 'affine:surface'
    ) as SurfaceBlockModel;
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
      !this.components.toolbar &&
      !this.components.zoomToolbar &&
      !this.components.zoomBarToggleButton
    ) {
      createToolbar();
    }
  }

  private _initSlotEffects() {
    const { _disposables, slots, surface } = this;

    _disposables.add(
      surface.viewport.slots.viewportUpdated.on(({ zoom, center }) => {
        this.slots.viewportUpdated.emit({ zoom, center });
      })
    );

    this._disposables.add(
      listenToThemeChange(this, () => {
        this.surface.refresh();
      })
    );

    _disposables.add(
      slots.edgelessToolUpdated.on(edgelessTool => {
        this.edgelessTool = edgelessTool;
        slots.cursorUpdated.emit(getCursorMode(edgelessTool));
      })
    );
    _disposables.add(this.tools);
    _disposables.add(this.selectionManager);
    _disposables.add(this.surface);

    _disposables.add(
      slots.zoomUpdated.on(
        (action: ZoomAction) =>
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
      slots.copyAsPng.on(({ blocks, shapes }) => {
        if (!canCopyAsPng) return;
        canCopyAsPng = false;

        (this.clipboardController._enabled
          ? this.clipboardController
          : this.clipboard
        )
          .copyAsPng(blocks, shapes)
          .then(() => toast('Copied to clipboard'))
          .catch(() => toast('Failed to copy as PNG'))
          .finally(() => {
            canCopyAsPng = true;
          });
      })
    );
  }

  getSortedElementsWithViewportBounds(elements: Selectable[]) {
    const viewportBound = this.surface.viewport.viewportBounds;
    return this.surface.sortedBlocks.filter(element => {
      if (isFrameBlock(element)) return false;
      if (elements.includes(element)) return true;
      return intersects(viewportBound, xywhArrayToObject(element));
    });
  }

  getSortedElementsByBound(bound: IBound) {
    return this.surface.sortedBlocks.filter(element => {
      if (isFrameBlock(element)) return false;
      return intersects(bound, xywhArrayToObject(element));
    });
  }

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
    return this.surface.addElement(
      NOTE,
      {
        xywh: serializeXYWH(x - offsetX, y - offsetY, width, height),
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

  addImage(model: Partial<ImageBlockModel>, point: IVec) {
    const options = {
      width: model.width ?? 0,
      height: model.height ?? 0,
    };
    {
      delete model.width;
      delete model.height;
    }
    point = this.surface.toModelCoord(point[0], point[1]);
    const bound = new Bound(point[0], point[1], options.width, options.height);
    return this.surface.addElement(
      IMAGE,
      { ...model, xywh: bound.serialize() },
      this.surface.model
    );
  }

  async addImages(
    fileInfos: {
      file: File;
      sourceId: string;
    }[]
  ) {
    const models: Partial<ImageBlockModel>[] = [];
    for (const { file, sourceId } of fileInfos) {
      const size = await readImageSize(file);
      models.push({
        flavour: IMAGE,
        sourceId,
        ...size,
      });
    }

    const center = Vec.toVec(this.surface.viewport.center);

    const ids = models.map(model => {
      const bound = Bound.fromCenter(
        center,
        model.width ?? 0,
        model.height ?? 0
      );
      return this.surface.addElement(
        IMAGE,
        {
          xywh: bound.serialize(),
          sourceId: model.sourceId,
        },
        this.surface.model
      );
    });

    this.selectionManager.setSelection({
      elements: ids.map(id => id),
      editing: false,
    });
  }

  /*
   * Set selection state by giving noteId & blockId.
   * Not supports surface elements.
   */
  setSelection(noteId: string, _active = true, blockId: string, point?: Point) {
    const noteBlock = this.surface.getBlocks(NOTE).find(b => b.id === noteId);
    assertExists(noteBlock);

    requestAnimationFrame(() => {
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

    Object.values(EdgelessBlockType).forEach(edgelessBlock => {
      this.surface.getBlocks(edgelessBlock).forEach(block => {
        bounds.push(Bound.deserialize(block.xywh));
      });
    });

    const surfaceElementsBound = this.surface.getElementsBound();
    if (surfaceElementsBound) {
      bounds.push(surfaceElementsBound);
    }

    return getCommonBound(bounds);
  }

  updateElementInLocal(
    elementId: string,
    record: Partial<PhasorElementLocalRecordValues>
  ) {
    this.localRecord.update(elementId, record);
  }

  applyLocalRecord(elements: string[]) {
    if (!this.surface) return;

    const elementsSet = new Set(elements);

    this.localRecord.each((id, record) => {
      if (!elementsSet.has(id) || !this.surface.pickById(id)) return;

      const element = this.surface.pickById(id) as EdgelessElement;

      if (element instanceof GroupElement) {
        this.applyLocalRecord(element.childElements.map(e => e.id));
        return;
      }

      const updateProps: Record<string, unknown> = {};
      let flag = false;

      Object.keys(record).forEach(key => {
        if (key in element) {
          flag = true;
          updateProps[key] = record[key as keyof typeof record];
          delete record[key as keyof typeof record];
        }
      });

      if (!flag) return;

      this.localRecord.update(id, record);
      this.surface.updateElement(id, updateProps);
    });
  }

  override update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('edgelessTool')) {
      this.tools.edgelessTool = this.edgelessTool;
    }
    super.update(changedProperties);
  }

  private _initResizeEffect() {
    const resizeObserver = new ResizeObserver((_: ResizeObserverEntry[]) => {
      this.surface.onResize();
      this.selectionManager.setSelection(this.selectionManager.state);
    });

    resizeObserver.observe(this.editorContainer);
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

  private _initFontloader() {
    const fontLoader = this.service?.fontLoader;
    assertExists(fontLoader);

    fontLoader.load.then(() => {
      this.surface.refresh();
    });
  }

  private _initReadonlyListener() {
    const page = this.page;

    let readonly = page.readonly;
    this._disposables.add(
      page.awarenessStore.slots.update.on(() => {
        if (readonly !== page.readonly) {
          readonly = page.readonly;
          this.slots.readonlyUpdated.emit(readonly);
        }
      })
    );
  }

  private _initRemoteCursor() {
    const setRemoteCursor = debounce(
      (pos: { x: number; y: number }) => {
        const cursorPosition = this.surface.toModelCoord(pos.x, pos.y);
        this.selectionManager.setCursor({
          x: cursorPosition[0],
          y: cursorPosition[1],
        });
      },
      1000 / 60,
      { trailing: true }
    );

    this.handleEvent('pointerMove', e => {
      const pointerEvent = e.get('pointerState');
      setRemoteCursor(pointerEvent);
    });
  }

  override firstUpdated() {
    this._initElementSlot();
    this._initSlotEffects();
    this._initResizeEffect();
    this._initPixelRatioChangeEffect();
    this._initFontloader();
    this._initReadonlyListener();
    this._initRemoteCursor();

    if (!this.clipboardController._enabled) {
      this.clipboard.init(this.page);
    }

    this._initViewport();

    if (this.page.readonly) {
      this.tools.setEdgelessTool({ type: 'pan', panning: true });
    }

    requestAnimationFrame(() => {
      this._handleToolbarFlag();
      this.requestUpdate();
    });
  }

  private _getSavedViewport() {
    const { viewport } = this.surface;
    const viewportData = getViewportFromSession(this.page.id);

    if (!viewportData) {
      return null;
    }

    if ('referenceId' in viewportData) {
      const block = this.surface.pickById(
        viewportData.referenceId
      ) as EdgelessElement;

      if (block) {
        viewport.setViewportByBound(
          Bound.deserialize(block.xywh),
          viewportData.padding
        );
        return { xywh: block.xywh, padding: viewportData.padding };
      }

      return null;
    } else {
      const { zoom, x, y } = viewportData;

      return {
        zoom,
        centerX: x,
        centerY: y,
      };
    }
  }

  public getFitToScreenData(
    padding: [number, number, number, number] = [0, 0, 0, 0]
  ) {
    const bounds = [];

    this.surface.blocks.forEach(block => {
      bounds.push(Bound.deserialize(block.xywh));
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
      zoom = clamp(zoom, ZOOM_MIN, ZOOM_INITIAL);

      centerX = bound.x + (bound.w + pr / zoom) / 2 - pl / zoom / 2;
      centerY = bound.y + (bound.h + pb / zoom) / 2 - pt / zoom / 2;
    } else {
      zoom = ZOOM_INITIAL;
    }
    return { zoom, centerX, centerY };
  }

  private _initViewport() {
    const run = () => {
      const viewport = this._getSavedViewport() ?? this.getFitToScreenData();

      if ('xywh' in viewport) {
        const { xywh, padding } = viewport;
        const bound = Bound.deserialize(xywh);
        this.surface.viewport.setViewportByBound(bound, padding);
      } else {
        const { zoom, centerX, centerY } = viewport;
        this.surface.viewport.setViewport(zoom, [centerX, centerY]);
      }
    };

    if (this.surface.isUpdatePending) {
      this.surface.updateComplete.then(run);
    } else {
      run();
    }
  }

  private _initLocalRecordManager() {
    this.localRecord = new LocalRecordManager<PhasorElementLocalRecordValues>();
    this.localRecord.slots.updated.on(({ id, data }) => {
      const element = this.surface.pickById(id);

      if (!element) return;

      this.surface.refresh();

      const changedProps = pick(
        data.new,
        keys(data.new).filter(key => key in element)
      );

      this.slots.elementUpdated.emit({
        id,
        props: changedProps,
      });
    });

    this.disposables.add(() => {
      this.localRecord.destroy();
    });
  }

  private _initElementSlot() {
    this._disposables.add(
      this.page.slots.blockUpdated.on(event => {
        if (![IMAGE, NOTE, FRAME].includes(event.flavour as EdgelessBlockType))
          return;

        switch (event.type) {
          case 'update':
            this.slots.elementUpdated.emit({
              id: event.id,
              props: event.props,
            });
            break;
          case 'add':
            this.slots.elementAdded.emit(event.id);
            break;
          case 'delete':
            this.slots.elementRemoved.emit({
              id: event.id,
              element: event.model as TopLevelBlockModel,
            });
        }
      })
    );
  }

  override connectedCallback() {
    super.connectedCallback();

    this.root.rangeManager?.rangeSynchronizer.setFilter(pageRangeSyncFilter);

    this.gesture = new Gesture(this);
    this.keyboardManager = new EdgelessPageKeyboardManager(this);

    this.handleEvent('selectionChange', () => {
      const surface = this.root.selection.value.find(
        (sel): sel is SurfaceSelection => sel.is('surface')
      );
      if (!surface) return;

      const el = this.surface.pickById(surface.elements[0]);
      if (isPhasorElement(el)) {
        return true;
      }

      return;
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.mouseRoot = this.parentElement!;
    this.selectionManager = new EdgelessSelectionManager(this);
    this.tools = new EdgelessToolsManager(this, this.root.event);
    this._initLocalRecordManager();
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

    const widgets = html`${repeat(
      Object.entries(this.widgets),
      ([id]) => id,
      ([_, widget]) => widget
    )}`;

    return html`${this.renderModel(this.surfaceBlockModel)}
      <edgeless-block-portal-container .edgeless=${this}>
      </edgeless-block-portal-container>
      <div class="widgets-container">${widgets}</div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-page': EdgelessPageBlockComponent;
  }
}

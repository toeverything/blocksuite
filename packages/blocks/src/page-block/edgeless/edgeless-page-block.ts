import './components/toolbar/edgeless-toolbar.js';
import '../../surface-block/surface-block.js';
import './components/block-portal/frame/edgeless-frame.js';

import type { SurfaceSelection } from '@blocksuite/block-std';
import {
  assertExists,
  assertInstanceOf,
  debounce,
  Slot,
  throttle,
} from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { type BlockModel } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { toast } from '../../_common/components/toast.js';
import { BLOCK_ID_ATTR } from '../../_common/consts.js';
import { listenToThemeChange } from '../../_common/theme/utils.js';
import {
  type EdgelessElement,
  type EdgelessTool,
  Point,
  type Selectable,
} from '../../_common/utils/index.js';
import {
  asyncFocusRichText,
  handleNativeRangeAtPoint,
  on,
  type ReorderingAction,
  type TopLevelBlockModel,
} from '../../_common/utils/index.js';
import { humanFileSize } from '../../_common/utils/math.js';
import {
  SURFACE_IMAGE_CARD_HEIGHT,
  SURFACE_IMAGE_CARD_WIDTH,
} from '../../image-block/components/image-card.js';
import type { ImageBlockProps } from '../../image-block/image-model.js';
import { ImageService } from '../../image-block/image-service.js';
import type { FrameBlockModel, ImageBlockModel } from '../../models.js';
import { ZOOM_INITIAL } from '../../surface-block/consts.js';
import {
  Bound,
  type CanvasElement,
  clamp,
  type EdgelessBlockType,
  getCommonBound,
  type IBound,
  type IVec,
  serializeXYWH,
  Vec,
  ZOOM_MIN,
} from '../../surface-block/index.js';
import type { SerializedViewport } from '../../surface-block/managers/edit-session.js';
import type {
  IndexedCanvasUpdateEvent,
  SurfaceBlockComponent,
} from '../../surface-block/surface-block.js';
import { type SurfaceBlockModel } from '../../surface-block/surface-model.js';
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
} from './components/zoom/zoom-toolbar.js';
import { EdgelessClipboardController } from './controllers/clipboard.js';
import { EdgelessPageKeyboardManager } from './edgeless-keyboard.js';
import type { EdgelessPageService } from './edgeless-page-service.js';
import { EdgelessToolsManager } from './services/tools-manager.js';
import { edgelessElementsBound } from './utils/bound-utils.js';
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_OFFSET_X,
  DEFAULT_NOTE_OFFSET_Y,
  DEFAULT_NOTE_WIDTH,
  FIT_TO_SCREEN_PADDING,
} from './utils/consts.js';
import { getCursorMode, isCanvasElement } from './utils/query.js';

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
      z-index: 1;
    }

    .affine-edgeless-layer {
      position: absolute;
      top: 0;
      left: 0;
      contain: size layout style;
    }

    @container viewport (width <= 1200px) {
      edgeless-zoom-toolbar {
        display: none;
      }
    }

    @container viewport (width >= 1200px) {
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

  clipboardController = new EdgelessClipboardController(this);

  slots = {
    selectedRectUpdated: new Slot<{
      type: 'move' | 'select' | 'resize';
      delta?: {
        x: number;
        y: number;
      };
      dragging?: boolean;
    }>(),
    edgelessToolUpdated: new Slot<EdgelessTool>(),
    reorderingElements: new Slot<ReorderingAction<Selectable>>(),
    zoomUpdated: new Slot<ZoomAction>(),
    pressShiftKeyUpdated: new Slot<boolean>(),
    cursorUpdated: new Slot<string>(),
    copyAsPng: new Slot<{
      blocks: TopLevelBlockModel[];
      shapes: CanvasElement[];
    }>(),
    subpageLinked: new Slot<{ pageId: string }>(),
    subpageUnlinked: new Slot<{ pageId: string }>(),
    pageLinkClicked: new Slot<{ pageId: string; blockId?: string }>(),
    tagClicked: new Slot<{ tagId: string }>(),
    readonlyUpdated: new Slot<boolean>(),
    draggingAreaUpdated: new Slot(),
    navigatorSettingUpdated: new Slot<{
      hideToolbar?: boolean;
      blackBackground?: boolean;
      fillScreen?: boolean;
    }>(),
    navigatorFrameChanged: new Slot<FrameBlockModel>(),
    fullScrennToggled: new Slot(),

    elementAdded: new Slot<{ id: string }>(),
    elementRemoved: new Slot<{ id: string; element: EdgelessElement }>(),
    elementResizeStart: new Slot(),
    elementResizeEnd: new Slot(),
  };

  @query('affine-surface')
  surface!: SurfaceBlockComponent;

  fontLoader!: FontLoader;

  tools!: EdgelessToolsManager;

  get dispatcher() {
    return this.service?.uiEventDispatcher;
  }

  override get service() {
    return super.service!;
  }

  private _viewportElement: HTMLElement | null = null;

  get viewportElement(): HTMLElement {
    if (this._viewportElement) return this._viewportElement;
    this._viewportElement = this.host.closest(
      'edgeless-editor'
    ) as HTMLElement | null;
    assertExists(this._viewportElement);
    return this._viewportElement;
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
    const { _disposables, slots } = this;

    this._disposables.add(() =>
      listenToThemeChange(this, () => this.surface.refresh())
    );

    _disposables.add(
      slots.edgelessToolUpdated.on(edgelessTool => {
        this.edgelessTool = edgelessTool;
        slots.cursorUpdated.emit(getCursorMode(edgelessTool));
      })
    );
    _disposables.add(this.tools);
    _disposables.add(this.service.selection);
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

        this.clipboardController
          .copyAsPng(blocks, shapes)
          .then(() => toast('Copied to clipboard'))
          .catch(() => toast('Failed to copy as PNG'))
          .finally(() => {
            canCopyAsPng = true;
          });
      })
    );
  }

  /**
   * Adds a new note with the given point on the affine-editor-container.
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
    const [x, y] = this.service.toModelCoord(point.x, point.y);
    return this.service.addBlock(
      'affine:note',
      {
        xywh: serializeXYWH(x - offsetX, y - offsetY, width, height),
      },
      parentId,
      noteIndex
    );
  }

  /**
   * Adds a new note with the given blocks and point.
   * @param blocks Array<Partial<BlockModel>>
   * @param point Point
   */
  addNewNote(
    blocks: Array<Partial<BlockModel>>,
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
    const { left, top } = this.service.viewport;
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
    point = this.service.toModelCoord(point[0], point[1]);
    const bound = new Bound(point[0], point[1], options.width, options.height);
    return this.service.addBlock(
      'affine:image',
      { ...model, xywh: bound.serialize() },
      this.surface.model
    );
  }

  async addImages(files: File[], point?: Point): Promise<string[]> {
    const imageFiles = [...files].filter(file =>
      file.type.startsWith('image/')
    );
    if (!imageFiles.length) return [];

    const imageService = this.host.spec.getService('affine:image');
    assertExists(imageService);
    assertInstanceOf(imageService, ImageService);
    const maxFileSize = imageService.maxFileSize;
    const isSizeExceeded = imageFiles.some(file => file.size > maxFileSize);
    if (isSizeExceeded) {
      toast(
        `You can only upload files less than ${humanFileSize(
          maxFileSize,
          true,
          0
        )}`
      );
      return [];
    }

    let { x, y } = this.service.viewport.center;
    if (point) [x, y] = this.service.viewport.toModelCoord(point.x, point.y);

    const dropInfos: { point: Point; blockId: string }[] = [];

    const IMAGE_STACK_GAP = 32;

    // create image cards without image data
    imageFiles.map((file, index) => {
      const point = new Point(
        x + index * IMAGE_STACK_GAP,
        y + index * IMAGE_STACK_GAP
      );
      const center = Vec.toVec(point);
      const bound = Bound.fromCenter(
        center,
        SURFACE_IMAGE_CARD_WIDTH,
        SURFACE_IMAGE_CARD_HEIGHT
      );
      const blockId = this.service.addBlock(
        'affine:image',
        {
          size: file.size,
          xywh: bound.serialize(),
        },
        this.surface.model
      );
      dropInfos.push({ point, blockId });
    });

    // upload image data and update the image model
    const uploadPromises = imageFiles.map(async (file, index) => {
      const { point, blockId } = dropInfos[index];

      const sourceId = await this.page.blob.set(file);
      const imageSize = await readImageSize(file);

      const center = Vec.toVec(point);
      const bound = Bound.fromCenter(center, imageSize.width, imageSize.height);

      this.page.withoutTransact(() => {
        this.service.updateElement(blockId, {
          sourceId,
          ...imageSize,
          xywh: bound.serialize(),
        } satisfies Partial<ImageBlockProps>);
      });
    });
    await Promise.all(uploadPromises);

    const blockIds = dropInfos.map(info => info.blockId);
    this.service.selection.set({
      elements: blockIds,
      editing: false,
    });
    return blockIds;
  }

  /*
   * Set selection state by giving noteId & blockId.
   * Not supports surface elements.
   */
  setSelection(noteId: string, _active = true, blockId: string, point?: Point) {
    const noteBlock = this.service.blocks
      .filter(block => block.flavour === 'affine:note')
      .find(b => b.id === noteId);
    assertExists(noteBlock);

    requestAnimationFrame(() => {
      this.service.selection.set({
        elements: [noteBlock.id],
        editing: false,
      });
      // Waiting dom updated, `note mask` is removed
      this.updateComplete
        .then(() => {
          if (blockId) {
            asyncFocusRichText(this.host, this.page, blockId)?.catch(
              console.error
            );
          } else if (point) {
            // Cannot reuse `handleNativeRangeClick` directly here,
            // since `retargetClick` will re-target to pervious editor
            handleNativeRangeAtPoint(point.x, point.y);
          }
        })
        .catch(console.error);
    });
  }

  getElementsBound(): IBound | null {
    const { service } = this;
    return edgelessElementsBound([...service.elements, ...service.blocks]);
  }

  override update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('edgelessTool')) {
      this.tools.edgelessTool = this.edgelessTool;
    }
    super.update(changedProperties);
  }

  private _initResizeEffect() {
    const resizeObserver = new ResizeObserver((_: ResizeObserverEntry[]) => {
      this.service.selection.set(this.service.selection.selections);
    });

    resizeObserver.observe(this.viewportElement);
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

    fontLoader.ready
      .then(() => {
        this.surface.refresh();
      })
      .catch(console.error);
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
        const cursorPosition = this.service.viewport.toModelCoord(pos.x, pos.y);
        this.service.selection.setCursor({
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

  private _initSurface() {
    const appendIndexedCanvasToPortal = (
      canvases: HTMLCanvasElement[] = this.surface.indexedCanvases
    ) => {
      this.pageBlockContainer.setSlotContent(canvases);
    };

    this._disposables.add(
      on(this.surface, 'indexedcanvasupdate', e => {
        appendIndexedCanvasToPortal(
          (e as IndexedCanvasUpdateEvent).detail.content
        );
      })
    );

    if (this.pageBlockContainer.isUpdatePending) {
      this.pageBlockContainer.updateComplete
        .then(() => appendIndexedCanvasToPortal())
        .catch(console.error);
    } else {
      appendIndexedCanvasToPortal();
    }
  }

  override firstUpdated() {
    this._initElementSlot();
    this._initSlotEffects();
    this._initResizeEffect();
    this._initPixelRatioChangeEffect();
    this._initFontloader();
    this._initReadonlyListener();
    this._initRemoteCursor();
    this._initSurface();

    this._initViewport();

    if (this.page.readonly) {
      this.tools.setEdgelessTool({ type: 'pan', panning: true });
    }

    requestAnimationFrame(() => {
      this._handleToolbarFlag();
      this.requestUpdate();
    });
  }

  private _getSavedViewport(): SerializedViewport | null {
    let result: SerializedViewport | null = null;
    const storedViewport = this.surface.service.editSession.getItem('viewport');
    if (!storedViewport) return null;

    if ('referenceId' in storedViewport) {
      const block = this.service.getElementById(storedViewport.referenceId);

      if (block) {
        this.service.viewport.setViewportByBound(
          Bound.deserialize(block.xywh),
          storedViewport.padding
        );
        result = storedViewport;
      } else {
        result = null;
      }
    } else {
      result = storedViewport;
    }

    return result;
  }

  public getFitToScreenData(
    padding: [number, number, number, number] = [0, 0, 0, 0]
  ) {
    const bounds = [];

    this.service.blocks.forEach(block => {
      bounds.push(Bound.deserialize(block.xywh));
    });

    const surfaceElementsBound = getCommonBound(this.service.elements);
    if (surfaceElementsBound) {
      bounds.push(surfaceElementsBound);
    }

    const [pt, pr, pb, pl] = padding;
    const { viewport } = this.service;
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
    this.service.viewport.setContainer(this);

    const run = () => {
      const viewport = this._getSavedViewport() ?? this.getFitToScreenData();
      if ('xywh' in viewport) {
        const { xywh, padding } = viewport;
        const bound = Bound.deserialize(xywh);
        this.service.viewport.setViewportByBound(bound, padding);
      } else {
        const { zoom, centerX, centerY } = viewport;
        this.service.viewport.setViewport(zoom, [centerX, centerY]);
      }
    };

    if (this.surface.isUpdatePending) {
      this.surface.updateComplete.then(run).catch(console.error);
    } else {
      run();
    }
  }

  private _initElementSlot() {
    this._disposables.add(
      this.page.slots.blockUpdated.on(event => {
        if (
          ![
            'affine:image',
            'affine:note',
            'affine:frame',
            'affine:bookmark',
          ].includes(event.flavour as EdgelessBlockType) &&
          !/affine:embed-*/.test(event.flavour)
        )
          return;

        if (
          event.flavour === 'affine:image' ||
          event.flavour === 'affine:bookmark'
        ) {
          const parent =
            event.type === 'delete'
              ? this.page.getParent(event.model)
              : this.page.getParent(this.page.getBlockById(event.id)!);

          if (parent && parent.id !== this.surfaceBlockModel.id) {
            return;
          }
        }

        switch (event.type) {
          case 'add':
            this.slots.elementAdded.emit({ id: event.id });
            break;
        }
      })
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    this.clipboardController.hostConnected();
    this.host.rangeManager?.rangeSynchronizer.setFilter(pageRangeSyncFilter);

    this.gesture = new Gesture(this);
    this.keyboardManager = new EdgelessPageKeyboardManager(this);

    this.handleEvent('selectionChange', () => {
      const surface = this.host.selection.value.find(
        (sel): sel is SurfaceSelection => sel.is('surface')
      );
      if (!surface) return;

      const el = this.service.getElementById(surface.elements[0]);
      if (isCanvasElement(el)) {
        this.host.event.activate();
        return true;
      }

      return;
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.mouseRoot = this.parentElement!;
    this.tools = new EdgelessToolsManager(this, this.host.event);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clipboardController.hostDisconnected();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    this.gesture = null;
    this.keyboardManager = null;

    this.tools.clear();
    this.tools.dispose();
  }

  override render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const widgets = html`${repeat(
      Object.entries(this.widgets),
      ([id]) => id,
      ([_, widget]) => widget
    )}`;

    return html`${this.renderModel(this.surfaceBlockModel)}
      <edgeless-block-portal-container
        .edgeless=${this}
        .frames=${this.service.frames}
      >
      </edgeless-block-portal-container>
      <edgeless-frames-container
        .surface=${this.surface}
        .edgeless=${this}
        .frames=${this.service.frames}
        .onlyTitle=${true}
      >
      </edgeless-frames-container>
      <div class="widgets-container">${widgets}</div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-page': EdgelessPageBlockComponent;
  }
}

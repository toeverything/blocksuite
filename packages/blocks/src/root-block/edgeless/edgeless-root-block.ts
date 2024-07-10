import '../../surface-block/surface-block.js';
import './components/block-portal/frame/edgeless-frame.js';
import './components/toolbar/edgeless-toolbar.js';

import type { SurfaceSelection } from '@blocksuite/block-std';
import { BlockElement } from '@blocksuite/block-std';
import { IS_WINDOWS } from '@blocksuite/global/env';
import { assertExists, throttle } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { toast } from '../../_common/components/toast.js';
import {
  BLOCK_ID_ATTR,
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '../../_common/consts.js';
import { ThemeObserver } from '../../_common/theme/theme-observer.js';
import {
  asyncFocusRichText,
  handleNativeRangeAtPoint,
  type IPoint,
  isPinchEvent,
  NoteDisplayMode,
  on,
  Point,
  requestConnectedFrame,
  type Viewport,
} from '../../_common/utils/index.js';
import { humanFileSize } from '../../_common/utils/math.js';
import type { AttachmentBlockProps } from '../../attachment-block/attachment-model.js';
import {
  setAttachmentUploaded,
  setAttachmentUploading,
} from '../../attachment-block/utils.js';
import type {
  ImageBlockModel,
  ImageBlockProps,
} from '../../image-block/image-model.js';
import {
  Bound,
  type IBound,
  type IVec2,
  normalizeWheelDeltaY,
  serializeXYWH,
  Vec,
} from '../../surface-block/index.js';
import type {
  IndexedCanvasUpdateEvent,
  SurfaceBlockComponent,
} from '../../surface-block/surface-block.js';
import type { SurfaceBlockModel } from '../../surface-block/surface-model.js';
import type { FontLoader } from '../font-loader/font-loader.js';
import type { RootBlockModel } from '../root-model.js';
import type { EdgelessRootBlockWidgetName } from '../types.js';
import type { EdgelessBlockPortalContainer } from './components/block-portal/edgeless-block-portal.js';
import { EdgelessToolbar } from './components/toolbar/edgeless-toolbar.js';
import { calcBoundByOrigin, readImageSize } from './components/utils.js';
import { EdgelessClipboardController } from './controllers/clipboard.js';
import {
  BrushToolController,
  ConnectorToolController,
  CopilotSelectionController,
  DefaultToolController,
  EraserToolController,
  FrameToolController,
  LassoToolController,
  MindmapToolController,
  NoteToolController,
  PanToolController,
  PresentToolController,
  ShapeToolController,
  TemplateToolController,
  TextToolController,
} from './controllers/tools/index.js';
import { EdgelessPageKeyboardManager } from './edgeless-keyboard.js';
import type { EdgelessRootService } from './edgeless-root-service.js';
import type { EdgelessToolConstructor } from './services/tools-manager.js';
import type { EdgelessTool } from './types.js';
import { edgelessElementsBound } from './utils/bound-utils.js';
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_OFFSET_X,
  DEFAULT_NOTE_OFFSET_Y,
  DEFAULT_NOTE_WIDTH,
} from './utils/consts.js';
import { isCanvasElement } from './utils/query.js';
export interface EdgelessViewport {
  left: number;
  top: number;
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
}

@customElement('affine-edgeless-root')
export class EdgelessRootBlockComponent extends BlockElement<
  RootBlockModel,
  EdgelessRootService,
  EdgelessRootBlockWidgetName
> {
  get tools() {
    return this.service.tool;
  }

  get dispatcher() {
    return this.service?.uiEventDispatcher;
  }

  get slots() {
    return this.service.slots;
  }

  get viewportElement(): HTMLElement {
    if (this._viewportElement) return this._viewportElement;
    this._viewportElement = this.host.closest(
      '.affine-edgeless-viewport'
    ) as HTMLElement | null;
    assertExists(this._viewportElement);
    return this._viewportElement;
  }

  get viewport(): Viewport {
    const {
      scrollLeft,
      scrollTop,
      scrollWidth,
      scrollHeight,
      clientWidth,
      clientHeight,
    } = this.viewportElement;
    const { top, left } = this.viewportElement.getBoundingClientRect();
    return {
      top,
      left,
      scrollLeft,
      scrollTop,
      scrollWidth,
      scrollHeight,
      clientWidth,
      clientHeight,
    };
  }

  get surfaceBlockModel() {
    return this.model.children.find(
      child => child.flavour === 'affine:surface'
    ) as SurfaceBlockModel;
  }

  static override styles = css`
    affine-edgeless-root {
      -webkit-user-select: none;
      user-select: none;
    }

    .widgets-container {
      position: absolute;
      left: 0;
      top: 0;
      contain: size layout;
      z-index: 1;
      height: 100%;
    }

    .affine-edgeless-layer {
      position: absolute;
      top: 0;
      left: 0;
      contain: size layout style;
    }

    @media print {
      .selected {
        background-color: transparent !important;
      }
    }
  `;

  private _viewportElement: HTMLElement | null = null;

  private readonly _themeObserver = new ThemeObserver();

  private _resizeObserver: ResizeObserver | null = null;

  /**
   * Disable components
   *
   * Toolbar is not allowed to display in `syncd doc block`.
   */
  disableComponents = false;

  /**
   * Shared components
   */
  components = {
    toolbar: null as EdgelessToolbar | null,
  };

  keyboardManager: EdgelessPageKeyboardManager | null = null;

  mouseRoot!: HTMLElement;

  @state()
  accessor edgelessTool: EdgelessTool = {
    type: localStorage.defaultTool ?? 'default',
  };

  @query('edgeless-block-portal-container')
  accessor rootElementContainer!: EdgelessBlockPortalContainer;

  @query('.affine-edgeless-layer')
  accessor edgelessLayer!: HTMLDivElement;

  clipboardController = new EdgelessClipboardController(this);

  @query('affine-surface')
  accessor surface!: SurfaceBlockComponent;

  fontLoader!: FontLoader;

  private _handleToolbarFlag() {
    const createToolbar = () => {
      const toolbar = new EdgelessToolbar(this);

      this.append(toolbar);
      this.components.toolbar = toolbar;
    };

    if (!this.components.toolbar) {
      createToolbar();
    }
  }

  private _initSlotEffects() {
    const { disposables, slots } = this;

    this._themeObserver.observe(document.documentElement);
    this._themeObserver.on(() => this.surface.refresh());
    this.disposables.add(() => this._themeObserver.dispose());

    disposables.add(this.service.selection);
    disposables.add(
      slots.edgelessToolUpdated.on(tool => {
        this.edgelessTool = tool;
      })
    );
    disposables.add(
      slots.cursorUpdated.on(
        throttle((cursor: string) => {
          this.style.cursor = cursor;
        }, 144)
      )
    );

    let canCopyAsPng = true;
    disposables.add(
      slots.copyAsPng.on(({ blocks, shapes }) => {
        if (!canCopyAsPng) return;
        canCopyAsPng = false;

        this.clipboardController
          .copyAsPng(blocks, shapes)
          .then(() => toast(this.host, 'Copied to clipboard'))
          .catch(() => toast(this.host, 'Failed to copy as PNG'))
          .finally(() => {
            canCopyAsPng = true;
          });
      })
    );
  }

  private _initResizeEffect() {
    const resizeObserver = new ResizeObserver((_: ResizeObserverEntry[]) => {
      this.service.selection.set(this.service.selection.surfaceSelections);
      this.service.viewport.onResize();
    });

    resizeObserver.observe(this.viewportElement);
    this._resizeObserver = resizeObserver;
  }

  private _initPixelRatioChangeEffect() {
    let media: MediaQueryList;

    const onPixelRatioChange = () => {
      if (media) {
        this.service.viewport.onResize();
        media.removeEventListener('change', onPixelRatioChange);
      }

      media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      media.addEventListener('change', onPixelRatioChange);
    };

    onPixelRatioChange();

    this._disposables.add(() => {
      media?.removeEventListener('change', onPixelRatioChange);
    });
  }

  private _initFontLoader() {
    const fontLoader = this.service?.fontLoader;
    assertExists(fontLoader);

    fontLoader.ready
      .then(() => {
        this.surface.refresh();
      })
      .catch(console.error);
  }

  private _initRemoteCursor() {
    let rafId: number | null = null;

    const setRemoteCursor = (pos: { x: number; y: number }) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestConnectedFrame(() => {
        const cursorPosition = this.service.viewport.toModelCoord(pos.x, pos.y);
        this.service.selection.setCursor({
          x: cursorPosition[0],
          y: cursorPosition[1],
        });
        rafId = null;
      }, this);
    };

    this.handleEvent('pointerMove', e => {
      const pointerEvent = e.get('pointerState');
      setRemoteCursor(pointerEvent);
    });
  }

  private _initSurface() {
    const appendIndexedCanvasToPortal = (
      canvases: HTMLCanvasElement[] = this.surface.renderer.stackingCanvas
    ) => {
      this.rootElementContainer.setSlotContent(canvases);
    };

    this._disposables.add(
      on(this.surface, 'indexedcanvasupdate', e => {
        appendIndexedCanvasToPortal(
          (e as IndexedCanvasUpdateEvent).detail.content
        );
      })
    );

    this._disposables.add(
      this.std.event.slots.editorHostPanned.on(() => {
        this.service.viewport.onResize();
      })
    );

    if (this.rootElementContainer.isUpdatePending) {
      this.rootElementContainer.updateComplete
        .then(() => appendIndexedCanvasToPortal())
        .catch(console.error);
    } else {
      appendIndexedCanvasToPortal();
    }
  }

  private _initViewport() {
    const { service } = this;

    service.viewport.setContainer(this);

    const run = () => {
      const viewport =
        service.editPropsStore.getStorage('viewport') ??
        service.getFitToScreenData();

      if ('xywh' in viewport) {
        const bound = Bound.deserialize(viewport.xywh);
        service.viewport.setViewportByBound(bound, viewport.padding);
      } else {
        const { zoom, centerX, centerY } = viewport;
        service.viewport.setViewport(zoom, [centerX, centerY]);
      }
    };

    if (this.surface.isUpdatePending) {
      this.surface.updateComplete.then(run).catch(console.error);
    } else {
      run();
    }

    this._disposables.add(() => {
      service.editPropsStore.setStorage('viewport', {
        centerX: service.viewport.centerX,
        centerY: service.viewport.centerY,
        zoom: service.viewport.zoom,
      });
    });
  }

  private _initTools() {
    const tools = [
      DefaultToolController,
      BrushToolController,
      EraserToolController,
      TextToolController,
      ShapeToolController,
      ConnectorToolController,
      NoteToolController,
      FrameToolController,
      PanToolController,
      PresentToolController,
      CopilotSelectionController,
      LassoToolController,
      TemplateToolController,
      MindmapToolController,
    ] as EdgelessToolConstructor[];

    tools.forEach(tool => {
      this.service.registerTool(tool);
    });
    this.service.tool.mount(this);
  }

  private _initWheelEvent() {
    this._disposables.add(
      this.dispatcher.add('wheel', ctx => {
        const state = ctx.get('defaultState');
        const e = state.event as WheelEvent;

        e.preventDefault();

        const { viewport, locked } = this.service;

        if (locked) return;

        // zoom
        if (isPinchEvent(e)) {
          const rect = this.getBoundingClientRect();
          // Perform zooming relative to the mouse position
          const [baseX, baseY] = this.service.viewport.toModelCoord(
            e.clientX - rect.x,
            e.clientY - rect.y
          );

          const zoom = normalizeWheelDeltaY(e.deltaY, viewport.zoom);
          viewport.setZoom(zoom, new Point(baseX, baseY));
          e.stopPropagation();
        }
        // pan
        else {
          const simulateHorizontalScroll = IS_WINDOWS && e.shiftKey;
          const dx = simulateHorizontalScroll
            ? e.deltaY / viewport.zoom
            : e.deltaX / viewport.zoom;
          const dy = simulateHorizontalScroll ? 0 : e.deltaY / viewport.zoom;

          viewport.applyDeltaCenter(dx, dy);
          viewport.viewportMoved.emit([dx, dy]);
          e.stopPropagation();
        }
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
    point: IPoint,
    options: {
      width?: number;
      height?: number;
      parentId?: string;
      noteIndex?: number;
      offsetX?: number;
      offsetY?: number;
      scale?: number;
    } = {}
  ) {
    const {
      width = DEFAULT_NOTE_WIDTH,
      height = DEFAULT_NOTE_HEIGHT,
      offsetX = DEFAULT_NOTE_OFFSET_X,
      offsetY = DEFAULT_NOTE_OFFSET_Y,
      parentId = this.doc.root?.id,
      noteIndex: noteIndex,
      scale = 1,
    } = options;
    const [x, y] = this.service.viewport.toModelCoord(point.x, point.y);
    const blockId = this.service.addBlock(
      'affine:note',
      {
        xywh: serializeXYWH(
          x - offsetX * scale,
          y - offsetY * scale,
          width,
          height
        ),
        displayMode: NoteDisplayMode.EdgelessOnly,
      },
      parentId,
      noteIndex
    );

    this.service.telemetryService?.track('CanvasElementAdded', {
      control: 'canvas:draw',
      page: 'whiteboard editor',
      module: 'toolbar',
      segment: 'toolbar',
      type: 'note',
    });

    return blockId;
  }

  /**
   * Adds a new note with the given blocks and point.
   * @param blocks Array\<Partial\<BlockModel\>\>
   * @param point Point
   */
  addNewNote(
    blocks: Array<Partial<BlockModel>>,
    point: IPoint,
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
    this.doc.captureSync();
    const { left, top } = this.service.viewport;
    point.x -= left;
    point.y -= top;
    const noteId = this.addNoteWithPoint(point, options);
    const ids = this.doc.addBlocks(
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

  addImage(model: Partial<ImageBlockModel>, point: IPoint) {
    const options = {
      width: model.width ?? 0,
      height: model.height ?? 0,
    };
    {
      delete model.width;
      delete model.height;
    }
    const [x, y] = this.service.viewport.toModelCoord(point.x, point.y);
    const bound = new Bound(x, y, options.width, options.height);
    return this.service.addBlock(
      'affine:image',
      { ...model, xywh: bound.serialize() },
      this.surface.model
    );
  }

  async addImages(
    files: File[],
    point?: IVec2,
    inTopLeft?: boolean
  ): Promise<string[]> {
    const imageFiles = [...files].filter(file =>
      file.type.startsWith('image/')
    );
    if (!imageFiles.length) return [];

    const imageService = this.host.spec.getService('affine:image');
    const maxFileSize = imageService.maxFileSize;
    const isSizeExceeded = imageFiles.some(file => file.size > maxFileSize);
    if (isSizeExceeded) {
      toast(
        this.host,
        `You can only upload files less than ${humanFileSize(
          maxFileSize,
          true,
          0
        )}`
      );
      return [];
    }

    let { x, y } = this.service.viewport.center;
    if (point) [x, y] = this.service.viewport.toModelCoord(...point);

    const dropInfos: { point: Point; blockId: string }[] = [];

    const IMAGE_STACK_GAP = 32;

    // create image cards without image data
    imageFiles.map((file, index) => {
      const point = new Point(
        x + index * IMAGE_STACK_GAP,
        y + index * IMAGE_STACK_GAP
      );
      const center = Vec.toVec(point);
      const bound = calcBoundByOrigin(center, inTopLeft);
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

      const sourceId = await this.doc.blobSync.set(file);
      const imageSize = await readImageSize(file);

      const center = Vec.toVec(point);
      const bound = calcBoundByOrigin(
        center,
        inTopLeft,
        imageSize.width,
        imageSize.height
      );

      this.doc.withoutTransact(() => {
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

  async addAttachments(files: File[], point?: IVec2): Promise<string[]> {
    if (!files.length) return [];

    const attachmentService = this.host.spec.getService('affine:attachment');
    const maxFileSize = attachmentService.maxFileSize;
    const isSizeExceeded = files.some(file => file.size > maxFileSize);
    if (isSizeExceeded) {
      toast(
        this.host,
        `You can only upload files less than ${humanFileSize(
          maxFileSize,
          true,
          0
        )}`
      );
      return [];
    }

    let { x, y } = this.service.viewport.center;
    if (point) [x, y] = this.service.viewport.toModelCoord(...point);

    const CARD_STACK_GAP = 32;

    const dropInfos: { blockId: string; file: File }[] = files.map(
      (file, index) => {
        const point = new Point(
          x + index * CARD_STACK_GAP,
          y + index * CARD_STACK_GAP
        );
        const center = Vec.toVec(point);
        const bound = Bound.fromCenter(
          center,
          EMBED_CARD_WIDTH.cubeThick,
          EMBED_CARD_HEIGHT.cubeThick
        );
        const blockId = this.service.addBlock(
          'affine:attachment',
          {
            name: file.name,
            size: file.size,
            type: file.type,
            style: 'cubeThick',
            xywh: bound.serialize(),
          } satisfies Partial<AttachmentBlockProps>,
          this.surface.model
        );

        return { blockId, file };
      }
    );

    // upload file and update the attachment model
    const uploadPromises = dropInfos.map(async ({ blockId, file }) => {
      let sourceId: string | undefined;
      try {
        setAttachmentUploading(blockId);
        sourceId = await this.doc.blobSync.set(file);
      } catch (error) {
        console.error(error);
        if (error instanceof Error) {
          toast(
            this.host,
            `Failed to upload attachment! ${error.message || error.toString()}`
          );
        }
      } finally {
        setAttachmentUploaded(blockId);
        this.doc.withoutTransact(() => {
          this.service.updateElement(blockId, {
            sourceId,
          } satisfies Partial<AttachmentBlockProps>);
        });
      }
      return blockId;
    });
    const blockIds = await Promise.all(uploadPromises);

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
            asyncFocusRichText(this.host, blockId)?.catch(console.error);
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

  override firstUpdated() {
    this._initSlotEffects();
    this._initResizeEffect();
    this._initPixelRatioChangeEffect();
    this._initFontLoader();
    this._initRemoteCursor();
    this._initSurface();

    this._initViewport();
    this._initWheelEvent();

    if (this.doc.readonly) {
      this.tools.setEdgelessTool({ type: 'pan', panning: true });
    }

    if (this.disableComponents) return;
    requestConnectedFrame(() => {
      this._handleToolbarFlag();
      this.requestUpdate();
    }, this);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.clipboardController.hostConnected();

    this.keyboardManager = new EdgelessPageKeyboardManager(this);

    this.handleEvent('selectionChange', () => {
      const surface = this.host.selection.value.find(
        (sel): sel is SurfaceSelection => sel.is('surface')
      );
      if (!surface) return;

      const el = this.service.getElementById(surface.elements[0]);
      if (isCanvasElement(el)) {
        return true;
      }

      return;
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.mouseRoot = this.parentElement!;
    this._initTools();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clipboardController.hostDisconnected();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    this.keyboardManager = null;
    this.components.toolbar?.remove();
    this.components.toolbar = null;
  }

  override renderBlock() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const widgets = repeat(
      Object.entries(this.widgets),
      ([id]) => id,
      ([_, widget]) => widget
    );

    return html`${this.host.renderModel(this.surfaceBlockModel)}
      <edgeless-block-portal-container .edgeless=${this}>
      </edgeless-block-portal-container>
      <div class="widgets-container">${widgets}</div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-root': EdgelessRootBlockComponent;
  }
}

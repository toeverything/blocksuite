import type {
  BlockStdScope,
  SurfaceSelection,
  UIEventStateContext,
} from '@blocksuite/block-std';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import {
  type BlockSnapshot,
  fromJSON,
  Job,
  Workspace,
} from '@blocksuite/store';

import type {
  EdgelessElement,
  Selectable,
  TopLevelBlockModel,
} from '../../../_common/types.js';
import { matchFlavours } from '../../../_common/utils/index.js';
import { groupBy } from '../../../_common/utils/iterable.js';
import {
  getBlockComponentByModel,
  getBlockComponentByPath,
  getEditorContainer,
  isPageMode,
} from '../../../_common/utils/query.js';
import type { BookmarkBlockModel } from '../../../bookmark-block/bookmark-model.js';
import type { FrameBlockModel } from '../../../frame-block/frame-model.js';
import type { ImageBlockModel } from '../../../image-block/image-model.js';
import type { NoteBlockModel } from '../../../note-block/note-model.js';
import type { IBound } from '../../../surface-block/consts.js';
import { EdgelessBlockType } from '../../../surface-block/edgeless-types.js';
import { ConnectorElement } from '../../../surface-block/elements/connector/connector-element.js';
import type { Connection } from '../../../surface-block/elements/connector/types.js';
import { CanvasElementType } from '../../../surface-block/elements/edgeless-element.js';
import {
  type CanvasElement,
  GroupElement,
} from '../../../surface-block/elements/index.js';
import { compare } from '../../../surface-block/managers/group-manager.js';
import type { SurfaceBlockComponent } from '../../../surface-block/surface-block.js';
import { Bound, getCommonBound } from '../../../surface-block/utils/bound.js';
import {
  deserializeXYWH,
  serializeXYWH,
} from '../../../surface-block/utils/xywh.js';
import { PageClipboard } from '../../clipboard/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { deleteElements } from '../utils/crud.js';
import {
  isBookmarkBlock,
  isCanvasElementWithText,
  isFrameBlock,
  isImageBlock,
  isNoteBlock,
  isTopLevelBlock,
} from '../utils/query.js';

const BLOCKSUITE_SURFACE = 'blocksuite/surface';
const IMAGE_PNG = 'image/png';

const { GROUP } = CanvasElementType;

export class EdgelessClipboardController extends PageClipboard {
  constructor(public override host: EdgelessPageBlockComponent) {
    super(host);
  }

  private get std() {
    return this.host.std;
  }

  private get page() {
    return this.host.page;
  }

  private get surface() {
    return this.host.surface;
  }

  private get toolManager() {
    return this.host.tools;
  }

  private get selectionManager() {
    return this.host.selectionManager;
  }

  override hostConnected() {
    if (this._disposables.disposed) {
      this._disposables = new DisposableGroup();
    }
    this._init();
    this._initEdgelessClipboard();
  }

  private _initEdgelessClipboard = () => {
    this.host.handleEvent(
      'copy',
      ctx => {
        const surfaceSelection = this.selectionManager.state;
        const elements = surfaceSelection.elements;
        if (elements.length === 0) return false;

        this._onCopy(ctx, surfaceSelection).catch(console.error);
        return;
      },
      { global: true }
    );

    this.host.handleEvent(
      'paste',
      ctx => {
        this._onPaste(ctx).catch(console.error);
      },
      { global: true }
    );

    this.host.handleEvent(
      'cut',
      ctx => {
        this._onCut(ctx);
      },
      { global: true }
    );
  };

  private _blockElmentGetter(model: BaseBlockModel) {
    if (matchFlavours(model, ['affine:image', 'affine:frame'])) {
      let current: BaseBlockModel | null = model;
      const path: string[] = [];
      while (current) {
        // Top level image render under page block not surface block
        if (!matchFlavours(current, ['affine:surface'])) {
          path.unshift(current.id);
        }
        current = current.page.getParent(current);
      }

      return getBlockComponentByPath(path);
    } else {
      return getBlockComponentByModel(model);
    }
  }

  private _onCopy = async (
    _context: UIEventStateContext,
    surfaceSelection: SurfaceSelection
  ) => {
    const event = _context.get('clipboardState').raw;
    event.preventDefault();

    const elements = getCopyElements(
      this.surface,
      this.selectionManager.elements
    );
    // when note active, handle copy like page mode
    if (surfaceSelection.editing) {
      // use build-in copy handler in rich-text when copy in surface text element
      if (isCanvasElementWithText(elements[0])) return;
      this.onPageCopy(_context);
      return;
    }

    this.std.clipboard
      .writeToClipboard(async _items => {
        const data = await prepareClipboardData(elements, this.std);
        return {
          ..._items,
          [BLOCKSUITE_SURFACE]: JSON.stringify(data),
        };
      })
      .catch(console.error);
  };

  private _onPaste = async (_context: UIEventStateContext) => {
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement
    ) {
      return;
    }
    const event = _context.get('clipboardState').raw;
    event.preventDefault();

    const { state, elements } = this.selectionManager;
    if (state.editing) {
      // use build-in paste handler in rich-text when paste in surface text element
      if (isCanvasElementWithText(elements[0])) return;
      this.onPagePaste(_context);
      return;
    }

    const data = event.clipboardData;
    if (!data) return;

    if (isPureFileInClipboard(data)) {
      const files = data.files;
      if (files.length === 0) return;

      const imageFiles = [...files].filter(file =>
        file.type.startsWith('image/')
      );
      await this.host.addImages(imageFiles);

      return;
    }

    const json = this.std.clipboard.readFromClipboard(data);
    const elementsRawData = JSON.parse(json[BLOCKSUITE_SURFACE]);
    this._pasteShapesAndBlocks(elementsRawData).catch(console.error);
  };

  private _onCut = (_context: UIEventStateContext) => {
    const { state, elements } = this.selectionManager;
    if (state.elements.length === 0) return;

    const event = _context.get('clipboardState').event;
    event.preventDefault();

    this._onCopy(_context, state).catch(console.error);
    if (state.editing) {
      // use build-in cut handler in rich-text when cut in surface text element
      if (isCanvasElementWithText(elements[0])) return;
      this.onPageCut(_context);
      return;
    }

    this.page.transact(() => {
      deleteElements(this.surface, elements);
    });

    this.selectionManager.setSelection({
      editing: false,
      elements: [],
    });
  };

  private _createCanvasElement(
    clipboardData: Record<string, unknown>,
    idMap: Map<string, string>
  ) {
    if (clipboardData.type === GROUP) {
      const yMap = new Workspace.Y.Map();
      const children = clipboardData.children ?? {};
      for (const [key, value] of Object.entries(children)) {
        const newKey = idMap.get(key);
        assertExists(newKey);
        yMap.set(newKey, value);
      }
      clipboardData.children = yMap;
    }
    const id = this.surface.addElement(
      clipboardData.type as CanvasElementType,
      clipboardData
    );
    const element = this.surface.pickById(id) as CanvasElement;
    assertExists(element);
    return element;
  }

  private _createCanvasElements(
    elements: Record<string, unknown>[],
    idMap: Map<string, string>
  ) {
    const result = groupBy(elements, item => {
      switch (item.type) {
        case 'connector':
          return 'connectors';
        case 'group':
          return 'groups';
        default:
          return 'others';
      }
    });

    return [
      ...(result.others
        ?.map(d => {
          const oldId = d.id as string;
          assertExists(oldId);
          const element = this._createCanvasElement(d, idMap);
          idMap.set(oldId, element.id);
          return element;
        })
        .filter(e => !!e) ?? []),

      ...(result.connectors?.map(connector => {
        const sourceId = (<Connection>connector.source).id;
        if (sourceId) {
          (<Connection>connector.source).id =
            idMap.get(sourceId) ?? (sourceId as string);
        }
        const targetId = (<Connection>connector.target).id;
        if (targetId) {
          (<Connection>connector.target).id =
            idMap.get(targetId) ?? (targetId as string);
        }
        const element = this._createCanvasElement(connector, idMap);
        idMap.set(connector.id as string, element.id);
        return element;
      }) ?? []),

      ...(result.groups?.map(group => {
        const oldId = group.id as string;
        assertExists(oldId);
        const element = this._createCanvasElement(group, idMap);
        idMap.set(oldId, element.id);
        return element;
      }) ?? []),
    ];
  }

  private async _createNoteBlocks(
    notes: BlockSnapshot[],
    oldToNewIdMap: Map<string, string>
  ) {
    const { surface } = this;
    const noteIds = await Promise.all(
      notes.map(async ({ id, props, children }) => {
        delete props.index;
        assertExists(props.xywh);
        const noteId = this.surface.addElement(
          EdgelessBlockType.NOTE,
          props,
          this.page.root?.id
        );
        const note = surface.pickById(noteId) as NoteBlockModel;
        if (id) oldToNewIdMap.set(id, noteId);
        assertExists(note);

        children.forEach(child => {
          this.onBlockSnapshotPaste(child, this.page, note.id, 0);
        });
        return noteId;
      })
    );
    return noteIds;
  }

  private async _createFrameBlocks(frames: BlockSnapshot[]) {
    const frameIds = await Promise.all(
      frames.map(async ({ props }) => {
        const { xywh, title, background } = props;
        const frameId = this.surface.addElement(
          EdgelessBlockType.FRAME,
          {
            xywh,
            background,
            title: fromJSON(title),
          },
          this.surface.model.id
        );
        return frameId;
      })
    );
    return frameIds;
  }

  private async _createImageBlocks(images: BlockSnapshot[]) {
    const imageIds = await Promise.all(
      images.map(async ({ props }) => {
        const { xywh, sourceId, rotate } = props;
        const imageId = this.surface.addElement(
          EdgelessBlockType.IMAGE,
          {
            xywh,
            sourceId,
            rotate,
          },
          this.surface.model.id
        );
        return imageId;
      })
    );
    return imageIds;
  }

  private async _createBookmarkBlocks(bookmarks: BlockSnapshot[]) {
    const bookmarkIds = await Promise.all(
      bookmarks.map(async ({ props }) => {
        const { xywh, style, url, caption, description, icon, image, title } =
          props;
        const bookmarkId = this.surface.addElement(
          EdgelessBlockType.BOOKMARK,
          {
            xywh,
            style,
            url,
            caption,
            description,
            icon,
            image,
            title,
          },
          this.surface.model.id
        );
        return bookmarkId;
      })
    );
    return bookmarkIds;
  }

  private _getOldCommonBound(
    canvasElements: CanvasElement[],
    blocks: TopLevelBlockModel[]
  ) {
    const commonBound = getCommonBound(
      [...canvasElements, ...blocks]
        .map(({ xywh }) => {
          if (!xywh) {
            return;
          }
          const [x, y, w, h] =
            typeof xywh === 'string' ? deserializeXYWH(xywh) : xywh;

          return {
            x,
            y,
            w,
            h,
          };
        })
        .filter(b => !!b) as Bound[]
    );
    assertExists(commonBound);
    return commonBound;
  }

  private _emitSelectionChangeAfterPaste(
    canvasElementIds: string[],
    blockIds: string[]
  ) {
    const newSelected = [
      ...canvasElementIds,
      ...blockIds.filter(id => {
        return isTopLevelBlock(this.page.getBlockById(id));
      }),
    ];

    this.selectionManager.setSelection({
      editing: false,
      elements: newSelected,
    });
  }

  async createElementsFromClipboardData(
    elementsRawData: Record<string, unknown>[]
  ) {
    const groupedByType = groupBy(elementsRawData, data =>
      isNoteBlock(data as unknown as Selectable)
        ? 'notes'
        : isFrameBlock(data as unknown as Selectable)
          ? 'frames'
          : isImageBlock(data as unknown as Selectable)
            ? 'images'
            : isBookmarkBlock(data as unknown as Selectable)
              ? 'bookmarks'
              : 'elements'
    ) as unknown as {
      frames: BlockSnapshot[];
      notes?: BlockSnapshot[];
      images?: BlockSnapshot[];
      bookmarks?: BlockSnapshot[];
      elements?: { type: CanvasElement['type'] }[];
    };

    // map old id to new id to rebuild connector's source and target
    const oldIdToNewIdMap = new Map<string, string>();

    // create and add blocks to page
    const noteIds = await this._createNoteBlocks(
      groupedByType.notes || [],
      oldIdToNewIdMap
    );
    const frameIds = await this._createFrameBlocks(groupedByType.frames ?? []);
    const imageIds = await this._createImageBlocks(groupedByType.images ?? []);
    const bookmarkIds = await this._createBookmarkBlocks(
      groupedByType.bookmarks ?? []
    );

    const notes = noteIds.map(id =>
      this.page.getBlockById(id)
    ) as NoteBlockModel[];

    const frames = frameIds.map(id =>
      this.page.getBlockById(id)
    ) as FrameBlockModel[];

    const images = imageIds.map(id =>
      this.surface.pickById(id)
    ) as ImageBlockModel[];

    const bookmarks = bookmarkIds.map(id =>
      this.surface.pickById(id)
    ) as BookmarkBlockModel[];

    const elements = this._createCanvasElements(
      groupedByType.elements || [],
      oldIdToNewIdMap
    );

    const { lastMousePos } = this.toolManager;
    const [modelX, modelY] = this.surface.toModelCoord(
      lastMousePos.x,
      lastMousePos.y
    );
    const oldCommonBound = this._getOldCommonBound(elements, [
      ...notes,
      ...frames,
      ...images,
      ...bookmarks,
    ]);
    const pasteX = modelX - oldCommonBound.w / 2;
    const pasteY = modelY - oldCommonBound.h / 2;

    // update canvas elements' position to mouse position
    elements.forEach(ele => {
      const newBound = new Bound(
        pasteX + ele.x - oldCommonBound.x,
        pasteY + ele.y - oldCommonBound.y,
        ele.w,
        ele.h
      );
      if (ele instanceof ConnectorElement) {
        this.surface.connector.updateXYWH(ele, newBound);
      } else {
        this.surface.updateElement(ele.id, {
          xywh: newBound.serialize(),
        });
      }
    });

    const blocks = [...notes, ...frames, ...images, ...bookmarks];
    blocks.forEach(block => {
      const [x, y, w, h] = deserializeXYWH(block.xywh);
      const newBound = new Bound(
        pasteX + x - oldCommonBound.x,
        pasteY + y - oldCommonBound.y,
        w,
        h
      );
      this.surface.updateElement(block.id, {
        xywh: serializeXYWH(newBound.x, newBound.y, newBound.w, newBound.h),
      });
    });

    return [elements, blocks] as const;
  }

  private async _pasteShapesAndBlocks(
    elementsRawData: Record<string, unknown>[]
  ) {
    const [elements, blocks] =
      await this.createElementsFromClipboardData(elementsRawData);
    this._emitSelectionChangeAfterPaste(
      elements.map(ele => ele.id),
      blocks.map(block => block.id)
    );
  }

  async toCanvas(blocks: TopLevelBlockModel[], shapes: CanvasElement[]) {
    blocks.sort(compare);
    shapes.sort(compare);

    const bounds: IBound[] = [];
    blocks.forEach(block => {
      bounds.push(Bound.deserialize(block.xywh));
    });
    shapes.forEach(shape => {
      bounds.push(Bound.deserialize(shape.xywh));
    });
    const bound = getCommonBound(bounds);
    assertExists(bound, 'bound not exist');

    const canvas = await this._edgelessToCanvas(
      this.host,
      bound,
      blocks,
      shapes
    );
    return canvas;
  }

  async copyAsPng(blocks: TopLevelBlockModel[], shapes: CanvasElement[]) {
    const blocksLen = blocks.length;
    const shapesLen = shapes.length;

    if (blocksLen + shapesLen === 0) return;
    const canvas = await this.toCanvas(blocks, shapes);
    assertExists(canvas);
    // @ts-ignore
    if (window.apis?.clipboard?.copyAsImageFromString) {
      // @ts-ignore
      await window.apis.clipboard?.copyAsImageFromString(
        canvas.toDataURL(IMAGE_PNG)
      );
    } else {
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          blob => (blob ? resolve(blob) : reject('Canvas can not export blob')),
          IMAGE_PNG
        )
      );
      assertExists(blob);

      this.std.clipboard
        .writeToClipboard(async _items => {
          return {
            ..._items,
            [IMAGE_PNG]: blob,
          };
        })
        .catch(console.error);
    }
  }

  private async _replaceRichTextWithSvgElement(element: HTMLElement) {
    const richList = Array.from(element.querySelectorAll('rich-text'));
    await Promise.all(
      richList.map(async rich => {
        const svgEle = await this._elementToSvgElement(
          rich.cloneNode(true) as HTMLElement,
          rich.clientWidth,
          rich.clientHeight + 1
        );
        rich.parentElement?.appendChild(svgEle);
        rich.parentElement?.removeChild(rich);
      })
    );
  }

  private async _elementToSvgElement(
    node: HTMLElement,
    width: number,
    height: number
  ) {
    const xmlns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(xmlns, 'svg');
    const foreignObject = document.createElementNS(xmlns, 'foreignObject');

    svg.setAttribute('width', `${width}`);
    svg.setAttribute('height', `${height}`);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    foreignObject.setAttribute('width', '100%');
    foreignObject.setAttribute('height', '100%');
    foreignObject.setAttribute('x', '0');
    foreignObject.setAttribute('y', '0');
    foreignObject.setAttribute('externalResourcesRequired', 'true');

    svg.appendChild(foreignObject);
    foreignObject.appendChild(node);
    return svg;
  }

  private async _edgelessToCanvas(
    edgeless: EdgelessPageBlockComponent,
    bound: IBound,
    nodes?: TopLevelBlockModel[],
    canvasElements: CanvasElement[] = []
  ): Promise<HTMLCanvasElement | undefined> {
    const root = this.page.root;
    if (!root) return;

    const html2canvas = (await import('html2canvas')).default;
    if (!(html2canvas instanceof Function)) return;

    const pathname = location.pathname;
    const pageMode = isPageMode(this.page);

    const editorContainer = getEditorContainer(this.page);
    const container = document.querySelector(
      '.affine-block-children-container'
    );
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.width = (bound.w + 100) * dpr;
    canvas.height = (bound.h + 100) * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = window.getComputedStyle(container).backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const replaceRichTextWithSvgElementFunc =
      this._replaceRichTextWithSvgElement.bind(this);

    let _imageProxyEndpoint: string | undefined;
    if (
      !_imageProxyEndpoint &&
      location.protocol === 'https:' &&
      location.hostname.split('.').includes('affine')
    ) {
      _imageProxyEndpoint =
        'https://workers.toeverything.workers.dev/proxy/image';
    }

    const html2canvasOption = {
      ignoreElements: function (element: Element) {
        if (
          element.tagName === 'AFFINE-BLOCK-HUB' ||
          element.tagName === 'EDGELESS-TOOLBAR' ||
          element.classList.contains('dg')
        ) {
          return true;
        } else {
          return false;
        }
      },
      onclone: async function (documentClone: Document, element: HTMLElement) {
        // html2canvas can't support transform feature
        element.style.setProperty('transform', 'none');
        const layer = documentClone.querySelector('.affine-edgeless-layer');
        if (layer && layer instanceof HTMLElement) {
          layer.style.setProperty('transform', 'none');
        }

        const boxShadowEles = documentClone.querySelectorAll(
          "[style*='box-shadow']"
        );
        boxShadowEles.forEach(function (element) {
          if (element instanceof HTMLElement) {
            element.style.setProperty('box-shadow', 'none');
          }
        });

        await replaceRichTextWithSvgElementFunc(element);
      },
      backgroundColor: window.getComputedStyle(editorContainer).backgroundColor,
      useCORS: _imageProxyEndpoint ? false : true,
      proxy: _imageProxyEndpoint,
    };

    const _drawTopLevelBlock = async (
      block: TopLevelBlockModel,
      isInFrame = false
    ) => {
      const blockElement = this._blockElmentGetter(block)?.parentElement;
      const blockBound = Bound.deserialize(block.xywh);
      const canvasData = await html2canvas(
        blockElement as HTMLElement,
        html2canvasOption
      );
      ctx.drawImage(
        canvasData,
        blockBound.x - bound.x + 50,
        blockBound.y - bound.y + 50,
        blockBound.w,
        isInFrame
          ? (blockBound.w / canvasData.width) * canvasData.height
          : blockBound.h
      );
    };

    const nodeElements = nodes ?? edgeless.getSortedElementsByBound(bound);
    for (const nodeElement of nodeElements) {
      await _drawTopLevelBlock(nodeElement);

      if (nodeElement.flavour === EdgelessBlockType.FRAME) {
        const blocksInsideFrame: TopLevelBlockModel[] = [];
        this.surface.frame
          .getElementsInFrame(nodeElement, false)
          .forEach(ele => {
            if (isTopLevelBlock(ele)) {
              blocksInsideFrame.push(ele);
            } else {
              canvasElements.push(ele);
            }
          });

        for (let i = 0; i < blocksInsideFrame.length; i++) {
          const element = blocksInsideFrame[i];
          await _drawTopLevelBlock(element, true);
        }
      }

      this._checkCanContinueToCanvas(pathname, pageMode);
    }

    const surfaceCanvas = edgeless.surface.viewport.getCanvasByBound(
      bound,
      canvasElements
    );
    ctx.drawImage(surfaceCanvas, 50, 50, bound.w, bound.h);

    return canvas;
  }

  private _checkCanContinueToCanvas(pathName: string, pageMode: boolean) {
    if (location.pathname !== pathName || isPageMode(this.page) !== pageMode) {
      throw new Error('Unable to export content to canvas');
    }
  }
}

export function getCopyElements(
  surface: SurfaceBlockComponent,
  elements: EdgelessElement[]
) {
  const set = new Set<EdgelessElement>();

  elements.forEach(element => {
    if (isFrameBlock(element)) {
      set.add(element);
      surface.frame.getElementsInFrame(element).forEach(ele => set.add(ele));
    } else if (element instanceof GroupElement) {
      getCopyElements(surface, element.childElements).forEach(ele =>
        set.add(ele)
      );
      set.add(element);
    } else {
      set.add(element);
    }
  });
  return Array.from(set);
}

function prepareConnectorClipboardData(
  connector: ConnectorElement,
  selected: Selectable[]
) {
  const sourceId = connector.source?.id;
  const targetId = connector.target?.id;
  const serialized = connector.serialize();
  if (sourceId && !selected.find(s => s.id === sourceId)) {
    serialized.source = { position: connector.absolutePath[0] };
  }
  if (targetId && !selected.find(s => s.id === targetId)) {
    serialized.target = {
      position: connector.absolutePath[connector.absolutePath.length - 1],
    };
  }
  return serialized;
}

export async function prepareClipboardData(
  selectedAll: Selectable[],
  std: BlockStdScope
) {
  const selected = await Promise.all(
    selectedAll.map(async selected => {
      const job = new Job({
        workspace: std.workspace,
      });

      if (isNoteBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (isFrameBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (isImageBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (isBookmarkBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (selected instanceof ConnectorElement) {
        return prepareConnectorClipboardData(selected, selectedAll);
      } else {
        return selected.serialize();
      }
    })
  );
  return selected.filter(d => !!d);
}

function isPureFileInClipboard(clipboardData: DataTransfer) {
  const types = clipboardData.types;
  return (
    (types.length === 1 && types[0] === 'Files') ||
    (types.length === 2 &&
      (types.includes('text/plain') || types.includes('text/html')) &&
      types.includes('Files'))
  );
}

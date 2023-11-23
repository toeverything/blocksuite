import type {
  BlockStdProvider,
  SurfaceSelection,
  UIEventStateContext,
} from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type BlockSnapshot, fromJSON, Job } from '@blocksuite/store';
import type { ReactiveController } from 'lit';

import { groupBy } from '../../../_common/utils/iterable.js';
import {
  getBlockElementByModel,
  getEditorContainer,
  isPageMode,
} from '../../../_common/utils/query.js';
import type {
  EdgelessElement,
  Selectable,
  TopLevelBlockModel,
} from '../../../_common/utils/types.js';
import type { FrameBlockModel } from '../../../frame-block/frame-model.js';
import type { ImageBlockModel } from '../../../image-block/image-model.js';
import type { NoteBlockModel } from '../../../note-block/note-model.js';
import type { IBound } from '../../../surface-block/consts.js';
import { EdgelessBlockType } from '../../../surface-block/edgeless-types.js';
import { ConnectorElement } from '../../../surface-block/elements/connector/connector-element.js';
import type { Connection } from '../../../surface-block/elements/connector/types.js';
import type { PhasorElementType } from '../../../surface-block/elements/edgeless-element.js';
import {
  GroupElement,
  type PhasorElement,
} from '../../../surface-block/elements/index.js';
import type { SurfaceElement } from '../../../surface-block/elements/surface-element.js';
import { compare } from '../../../surface-block/managers/group-manager.js';
import type { SurfaceBlockComponent } from '../../../surface-block/surface-block.js';
import { Bound, getCommonBound } from '../../../surface-block/utils/bound.js';
import {
  deserializeXYWH,
  serializeXYWH,
} from '../../../surface-block/utils/xywh.js';
import type { ClipboardController } from '../../clipboard/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { xywhArrayToObject } from '../utils/convert.js';
import { deleteElements } from '../utils/crud.js';
import {
  isFrameBlock,
  isImageBlock,
  isNoteBlock,
  isPhasorElementWithText,
  isTopLevelBlock,
} from '../utils/query.js';

const BLOCKSUITE_SURFACE = 'blocksuite/surface';
const IMAGE_PNG = 'image/png';

export class EdgelessClipboardController implements ReactiveController {
  constructor(
    public host: EdgelessPageBlockComponent,
    public pageClipboardController: ClipboardController
  ) {
    host.addController(this);
  }

  get _enabled() {
    return this.std.page.awarenessStore.getFlag('enable_transformer_clipboard');
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

  get textSelection() {
    return this.host.selection.find('text');
  }

  hostConnected() {
    this.host.updateComplete.then(() => {
      if (this._enabled) {
        this._init();
      }
    });
  }

  private _init = () => {
    this.host.handleEvent('copy', ctx => {
      const surfaceSelection = this.selectionManager.state;
      const elements = surfaceSelection.elements;
      if (elements.length === 0) return false;

      this._onCopy(ctx, surfaceSelection);
      return true;
    });

    this.host.handleEvent('paste', ctx => {
      this._onPaste(ctx);
      return true;
    });

    this.host.handleEvent('cut', ctx => {
      this._onCut(ctx);
      return true;
    });
  };

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
      if (isPhasorElementWithText(elements[0])) return;
      this.pageClipboardController.onPageCopy(_context);
      return;
    }

    this.std.clipboard.writeToClipboard(async _items => {
      const data = await prepareClipboardData(elements, this.std);
      return {
        ..._items,
        [BLOCKSUITE_SURFACE]: JSON.stringify(data),
      };
    });
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
      if (isPhasorElementWithText(elements[0])) return;
      this.pageClipboardController.onPagePaste(_context);
      return;
    }

    const data = event.clipboardData;
    if (!data) return;

    if (isPureFileInClipboard(data)) {
      const files = data.files;
      if (files.length === 0) {
        return;
      }
      const res: { file: File; sourceId: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image')) {
          const sourceId = await this.page.blob.set(file);
          res.push({ file, sourceId });
        }
      }
      await this.host.addImages(res);
      return;
    }

    const json = this.std.clipboard.readFromClipboard(data);
    const elementsRawData = JSON.parse(json[BLOCKSUITE_SURFACE]);
    this._pasteShapesAndBlocks(elementsRawData);
  };

  private _onCut = (_context: UIEventStateContext) => {
    const { state, elements } = this.selectionManager;
    if (state.elements.length === 0) return;

    const event = _context.get('clipboardState').event;
    event.preventDefault();

    this._onCopy(_context, state);
    if (state.editing) {
      // use build-in cut handler in rich-text when cut in surface text element
      if (isPhasorElementWithText(elements[0])) return;
      this.pageClipboardController.onPageCut(_context);
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

  private _createPhasorElement(clipboardData: Record<string, unknown>) {
    const id = this.surface.addElement(
      clipboardData.type as PhasorElementType,
      clipboardData
    );
    const element = this.surface.pickById(id) as PhasorElement;
    assertExists(element);
    return element;
  }

  private _createPhasorElements(
    elements: Record<string, unknown>[],
    idMap: Map<string, string>
  ) {
    const result = groupBy(elements, item =>
      item.type === 'connector' ? 'connectors' : 'nonConnectors'
    );

    return [
      ...(result.nonConnectors
        ?.map(d => {
          const oldId = d.id as string;
          assertExists(oldId);
          const element = this._createPhasorElement(d);
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
        return this._createPhasorElement(connector);
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
        const { xywh, background } = props;
        assertExists(xywh);

        const noteId = this.surface.addElement(
          EdgelessBlockType.NOTE,
          {
            xywh,
            background,
          },
          this.page.root?.id
        );
        const note = surface.pickById(noteId) as NoteBlockModel;
        if (id) oldToNewIdMap.set(id, noteId);
        assertExists(note);

        children.forEach(child => {
          this.pageClipboardController.onBlockSnapshotPaste(
            child,
            this.page,
            note.id,
            0
          );
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

  private _getOldCommonBound(
    phasorElements: PhasorElement[],
    blocks: TopLevelBlockModel[]
  ) {
    const commonBound = getCommonBound(
      [...phasorElements, ...blocks]
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
    phasorElementIds: string[],
    blockIds: string[]
  ) {
    const newSelected = [
      ...phasorElementIds,
      ...blockIds.filter(id => {
        return isTopLevelBlock(this.page.getBlockById(id));
      }),
    ];

    this.selectionManager.setSelection({
      editing: false,
      elements: newSelected,
    });
  }

  private async _pasteShapesAndBlocks(
    elementsRawData: Record<string, unknown>[]
  ) {
    const groupedByType = groupBy(elementsRawData, data =>
      isNoteBlock(data as unknown as Selectable)
        ? 'notes'
        : isFrameBlock(data as unknown as Selectable)
          ? 'frames'
          : isImageBlock(data as unknown as Selectable)
            ? 'images'
            : 'elements'
    ) as unknown as {
      frames: BlockSnapshot[];
      notes?: BlockSnapshot[];
      images?: BlockSnapshot[];
      elements?: { type: PhasorElement['type'] }[];
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

    const notes = noteIds.map(id =>
      this.page.getBlockById(id)
    ) as NoteBlockModel[];

    const frames = frameIds.map(id =>
      this.page.getBlockById(id)
    ) as FrameBlockModel[];

    const images = imageIds.map(id =>
      this.surface.pickById(id)
    ) as ImageBlockModel[];

    const elements = this._createPhasorElements(
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
    ]);
    const pasteX = modelX - oldCommonBound.w / 2;
    const pasteY = modelY - oldCommonBound.h / 2;

    // update phasor elements' position to mouse position
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

    [...notes, ...frames, ...images].forEach(block => {
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

    this._emitSelectionChangeAfterPaste(
      elements.map(ele => ele.id),
      [...noteIds, ...frameIds, ...imageIds]
    );
  }

  async copyAsPng(blocks: TopLevelBlockModel[], shapes: PhasorElement[]) {
    const blocksLen = blocks.length;
    const shapesLen = shapes.length;

    if (blocksLen + shapesLen === 0) return;

    // sort by `index`
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
    if (!bound) {
      return;
    }

    const canvas = await this._edgelessToCanvas(
      this.host,
      bound,
      blocks,
      shapes
    );

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

      this.std.clipboard.writeToClipboard(async _items => {
        return {
          ..._items,
          [IMAGE_PNG]: blob,
        };
      });
    }
  }

  private async _replaceRichTextWithSvgElement(element: HTMLElement) {
    const richList = Array.from(element.querySelectorAll('.affine-rich-text'));
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
    surfaces?: SurfaceElement[]
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

    const nodeElements = nodes ?? edgeless.getSortedElementsByBound(bound);
    for (const nodeElement of nodeElements) {
      const blockElement = getBlockElementByModel(nodeElement)?.parentElement;
      const blockBound = xywhArrayToObject(nodeElement);
      const canvasData = await html2canvas(
        blockElement as HTMLElement,
        html2canvasOption
      );
      ctx.drawImage(
        canvasData,
        blockBound.x - bound.x + 50,
        blockBound.y - bound.y + 50,
        blockBound.w,
        blockBound.h
      );
      this._checkCanContinueToCanvas(pathname, pageMode);
    }

    const surfaceCanvas = edgeless.surface.viewport.getCanvasByBound(
      bound,
      surfaces
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

async function prepareClipboardData(
  selectedAll: Selectable[],
  std: BlockStdProvider
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

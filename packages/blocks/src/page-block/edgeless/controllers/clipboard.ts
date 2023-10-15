import type {
  SurfaceSelection,
  UIEventStateContext,
} from '@blocksuite/block-std';
import { assertExists, groupBy } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';
import type { ReactiveController } from 'lit';

import {
  clipboardData2Blocks,
  copyBlocksInPage,
  getBlockClipboardInfo,
} from '../../../__internal__/clipboard/index.js';
import { deleteModelsByTextSelection } from '../../../__internal__/clipboard/utils/operation.js';
import {
  CLIPBOARD_MIMETYPE,
  isPureFileInClipboard,
} from '../../../__internal__/clipboard/utils/pure.js';
import { addSerializedBlocks } from '../../../__internal__/service/json2block.js';
import type { FrameBlockService } from '../../../__internal__/service/legacy-services/frame-service.js';
import type { ImageBlockService } from '../../../__internal__/service/legacy-services/image-service.js';
import { getService } from '../../../__internal__/service/singleton.js';
import { ContentParser } from '../../../content-parser.js';
import type {
  Connection,
  EdgelessElement,
  FrameBlockModel,
  IBound,
  ImageBlockModel,
  NoteBlockModel,
  PhasorElement,
  PhasorElementType,
  Selectable,
  SerializedBlock,
  SurfaceBlockComponent,
  TopLevelBlockModel,
} from '../../../index.js';
import {
  Bound,
  compare,
  ConnectorElement,
  deserializeXYWH,
  getCommonBound,
  getSelectedContentModels,
  serializeXYWH,
} from '../../../index.js';
import { EdgelessBlockType } from '../../../surface-block/edgeless-types.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { deleteElements } from '../utils/crud.js';
import {
  isFrameBlock,
  isImageBlock,
  isNoteBlock,
  isPhasorElementWithText,
  isTopLevelBlock,
} from '../utils/query.js';

export class EdgelessClipboardController implements ReactiveController {
  constructor(public host: EdgelessPageBlockComponent) {
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

  private get root() {
    return this.host.root;
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
    if (this._enabled) {
      this._init();
    }
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
    const event = _context.get('clipboardState').event;
    event.preventDefault();

    const elements = getCopyElements(
      this.surface,
      this.selectionManager.elements
    );
    // when note active, handle copy like page mode
    if (surfaceSelection.editing) {
      // use build-in copy handler in rich-text when copy in surface text element
      if (isPhasorElementWithText(elements[0])) return;
      await copyBlocksInPage(this.root);
      return;
    }

    this.std.clipboard.writeToClipboard(async _items => {
      const data = await prepareClipboardData(elements);
      return {
        ..._items,
        [CLIPBOARD_MIMETYPE.BLOCKSUITE_SURFACE]: JSON.stringify(data),
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
      await this._pasteInTextNote(event);
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
          const sourceId = await this.page.blobs.set(file);
          res.push({ file, sourceId });
        }
      }
      await this.host.addImages(res);
      return;
    }

    const stringifyData = await this.std.clipboard.readFromClipboard(data);
    const elementsRawData =
      JSON.parse(stringifyData)[CLIPBOARD_MIMETYPE.BLOCKSUITE_SURFACE];
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
      deleteModelsByTextSelection(this.host.root);
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

  private async _pasteInTextNote(e: ClipboardEvent) {
    const blocks = await clipboardData2Blocks(this.page, e.clipboardData);
    if (!blocks.length) {
      return;
    }
    this.page.captureSync();

    deleteModelsByTextSelection(this.host.root);

    const textSelection = this.textSelection;
    assertExists(textSelection);
    const selectedModels = getSelectedContentModels(this.host.root, ['text']);

    const focusedBlockModel = selectedModels[0];
    assertExists(focusedBlockModel);
    const service = getService(focusedBlockModel.flavour);
    await service.json2Block(focusedBlockModel, blocks, textSelection.from);
  }

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
    notes: SerializedBlock[],
    oldToNewIdMap: Map<string, string>
  ) {
    const { surface } = this;
    const noteIds = await Promise.all(
      notes.map(async ({ id, xywh, children, background }) => {
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

        await addSerializedBlocks(this.page, children, note, 0);
        return noteId;
      })
    );
    return noteIds;
  }

  private async _createFrameBlocks(frames: SerializedBlock[]) {
    const frameIds = await Promise.all(
      frames.map(async ({ xywh, title, background }) => {
        const frameId = this.surface.addElement(
          EdgelessBlockType.FRAME,
          {
            xywh,
            background,
            title: new Workspace.Y.Text(title),
          },
          this.surface.model.id
        );
        return frameId;
      })
    );
    return frameIds;
  }

  private async _createImageBlocks(images: SerializedBlock[]) {
    const imageIds = await Promise.all(
      images.map(async ({ xywh, sourceId, rotate }) => {
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
      frames: SerializedBlock[];
      notes?: SerializedBlock[];
      images?: SerializedBlock[];
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

    // TODO: remove ContentParser
    const parser = new ContentParser(this.page);
    const canvas = await parser.edgelessToCanvas(
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
        canvas.toDataURL(CLIPBOARD_MIMETYPE.IMAGE_PNG)
      );
    } else {
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          blob => (blob ? resolve(blob) : reject('Canvas can not export blob')),
          CLIPBOARD_MIMETYPE.IMAGE_PNG
        )
      );
      assertExists(blob);

      this.std.clipboard.writeToClipboard(async _items => {
        return {
          ..._items,
          [CLIPBOARD_MIMETYPE.IMAGE_PNG]: blob,
        };
      });
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

async function prepareClipboardData(selectedAll: Selectable[]) {
  const selected = await Promise.all(
    selectedAll.map(async selected => {
      if (isNoteBlock(selected)) {
        return (await getBlockClipboardInfo(selected)).json;
      } else if (isFrameBlock(selected)) {
        const service = getService(selected.flavour) as FrameBlockService;
        return { ...service.block2Json(selected) };
      } else if (isImageBlock(selected)) {
        const service = getService(selected.flavour) as ImageBlockService;
        return { ...service.block2Json(selected, []) };
      } else if (selected instanceof ConnectorElement) {
        return prepareConnectorClipboardData(selected, selectedAll);
      } else {
        return selected.serialize();
      }
    })
  );
  return selected.filter(d => !!d);
}

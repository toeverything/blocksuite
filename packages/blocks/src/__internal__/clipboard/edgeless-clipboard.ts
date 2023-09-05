import { assertExists, groupBy } from '@blocksuite/global/utils';
import { type Page } from '@blocksuite/store';

import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import type { Selectable } from '../../page-block/edgeless/services/tools-manager.js';
import { deleteElements } from '../../page-block/edgeless/utils/crud.js';
import {
  isPhasorElementWithText,
  isTopLevelBlock,
} from '../../page-block/edgeless/utils/query.js';
import { getSelectedContentModels } from '../../page-block/utils/selection.js';
import type { SurfaceBlockComponent } from '../../surface-block/index.js';
import {
  Bound,
  compare,
  type Connection,
  ConnectorElement,
  deserializeXYWH,
  FrameElement,
  getCommonBound,
  type IBound,
  type PhasorElement,
  type PhasorElementType,
  serializeXYWH,
} from '../../surface-block/index.js';
import { ContentParser } from '../content-parser/index.js';
import {
  type EdgelessElement,
  type SerializedBlock,
  type TopLevelBlockModel,
} from '../index.js';
import { getService } from '../service/index.js';
import { addSerializedBlocks } from '../service/json2block.js';
import type { Clipboard } from './type.js';
import {
  clipboardData2Blocks,
  copyBlocksInPage,
  copyOnPhasorElementWithText,
  getBlockClipboardInfo,
} from './utils/commons.js';
import {
  CLIPBOARD_MIMETYPE,
  createSurfaceClipboardItems,
  getSurfaceClipboardData,
  isPureFileInClipboard,
  performNativeCopy,
} from './utils/index.js';
import { deleteModelsByTextSelection } from './utils/operation.js';

export function getCopyElements(
  surface: SurfaceBlockComponent,
  elements: EdgelessElement[]
) {
  const set = new Set<EdgelessElement>();

  elements.forEach(element => {
    if (element instanceof FrameElement) {
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
      if (isTopLevelBlock(selected)) {
        return (await getBlockClipboardInfo(selected)).json;
      } else if (selected instanceof ConnectorElement) {
        return prepareConnectorClipboardData(selected, selectedAll);
      } else {
        return selected.serialize();
      }
    })
  );
  return selected.filter(d => !!d);
}

export class EdgelessClipboard implements Clipboard {
  private _page!: Page;
  private _edgeless: EdgelessPageBlockComponent;

  constructor(page: Page, edgeless: EdgelessPageBlockComponent) {
    this._page = page;
    this._edgeless = edgeless;
  }

  init(page: Page = this._page) {
    this._page = page;
    document.body.addEventListener('cut', this._onCut);
    document.body.addEventListener('copy', this._onCopy);
    document.body.addEventListener('paste', this._onPaste);
  }

  get toolMgr() {
    return this._edgeless.tools;
  }

  get selection() {
    return this._edgeless.selectionManager;
  }

  get textSelection() {
    return this._edgeless.selection.find('text');
  }

  get slots() {
    return this._edgeless.slots;
  }

  get surface() {
    return this._edgeless.surface;
  }

  public dispose() {
    document.body.removeEventListener('cut', this._onCut);
    document.body.removeEventListener('copy', this._onCopy);
    document.body.removeEventListener('paste', this._onPaste);
  }

  private _onCut = (e: ClipboardEvent) => {
    e.preventDefault();
    this._onCopy(e);

    const { state, elements } = this.selection;
    if (state.editing) {
      deleteModelsByTextSelection(this._edgeless.root);
      return;
    }

    this._page.transact(() => {
      deleteElements(this.surface, elements);
    });

    this.selection.setSelection({
      editing: false,
      elements: [],
    });
  };

  private _onCopy = async (e: ClipboardEvent) => {
    e.preventDefault();
    await this.copy();
  };

  async copy() {
    const { state } = this.selection;
    const elements = getCopyElements(this.surface, this.selection.elements);
    // when note active, handle copy like page mode
    if (state.editing) {
      if (isPhasorElementWithText(elements[0])) {
        copyOnPhasorElementWithText(this._edgeless);
      } else {
        await copyBlocksInPage(this._edgeless.root);
      }
      return;
    }
    const data = await prepareClipboardData(elements);

    const clipboardItems = createSurfaceClipboardItems(data);
    performNativeCopy(clipboardItems);
  }

  private _onPaste = async (e: ClipboardEvent) => {
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement
    ) {
      return;
    }
    e.preventDefault();
    const { state, elements } = this.selection;
    if (state.editing) {
      if (!isPhasorElementWithText(elements[0])) {
        this._pasteInTextNote(e);
      }
      // use build-in paste handler in virgo-input when paste in surface text element
      return;
    }

    if (e.clipboardData && isPureFileInClipboard(e.clipboardData)) {
      const files = e.clipboardData.files;
      if (files.length === 0) {
        return;
      }
      const res: { file: File; sourceId: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image')) {
          const sourceId = await this._edgeless.page.blobs.set(file);
          res.push({ file, sourceId });
        }
      }
      await this._edgeless.addImages(res);
      return;
    }

    const elementsRawData = getSurfaceClipboardData(e);
    if (!elementsRawData) {
      return;
    }

    this._pasteShapesAndNotes(elementsRawData);
  };

  private async _pasteInTextNote(e: ClipboardEvent) {
    const blocks = await clipboardData2Blocks(this._page, e.clipboardData);
    if (!blocks.length) {
      return;
    }
    this._page.captureSync();

    deleteModelsByTextSelection(this._edgeless.root);

    const textSelection = this.textSelection;
    assertExists(textSelection);
    const selectedModels = getSelectedContentModels(this._edgeless.root, [
      'text',
    ]);

    const focusedBlockModel = selectedModels[0];
    assertExists(focusedBlockModel);
    const service = getService(focusedBlockModel.flavour);
    await service.json2Block(focusedBlockModel, blocks, textSelection.from);
  }

  private _createPhasorElement(clipboardData: Record<string, unknown>) {
    const id = this.surface.addElement(
      clipboardData.type as keyof PhasorElementType,
      clipboardData
    );
    const element = this.surface.pickById(id);
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
    const noteIds = await Promise.all(
      notes.map(async ({ id, xywh, children, background }) => {
        assertExists(xywh);

        const [oldX, oldY, oldW, oldH] = deserializeXYWH(xywh);
        const newXywh = serializeXYWH(oldX, oldY, oldW, oldH);
        const noteId = this._page.addBlock(
          'affine:note',
          {
            xywh: newXywh,
            background,
          },
          this._page.root?.id
        );
        const note = this._page.getBlockById(noteId);
        if (id) oldToNewIdMap.set(id, noteId);
        assertExists(note);

        await addSerializedBlocks(this._page, children, note, 0);
        return noteId;
      })
    );
    return noteIds;
  }

  private _getOldCommonBound(
    phasorElements: PhasorElement[],
    notes: TopLevelBlockModel[]
  ) {
    const commonBound = getCommonBound(
      [...phasorElements, ...notes]
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
    noteIds: string[]
  ) {
    const newSelected = [
      ...phasorElementIds,
      ...noteIds.filter(id => {
        return this._page.getBlockById(id)?.flavour === 'affine:note';
      }),
    ];

    this.selection.setSelection({
      editing: false,
      elements: newSelected,
    });
  }

  private async _pasteShapesAndNotes(
    elementsRawData: Record<string, unknown>[]
  ) {
    const groupedByType = groupBy(elementsRawData, data =>
      isTopLevelBlock(data as unknown as Selectable) ? 'notes' : 'elements'
    ) as unknown as {
      notes?: SerializedBlock[];
      elements?: { type: PhasorElement['type'] }[];
    };

    // map old id to new id to rebuild connector's source and target
    const oldIdToNewIdMap = new Map<string, string>();

    // create and add blocks to page
    const noteIds = await this._createNoteBlocks(
      groupedByType.notes || [],
      oldIdToNewIdMap
    );

    const notes = noteIds.map(id =>
      this._page.getBlockById(id)
    ) as TopLevelBlockModel[];

    const elements = this._createPhasorElements(
      groupedByType.elements || [],
      oldIdToNewIdMap
    );

    const { lastMousePos } = this.toolMgr;
    const [modelX, modelY] = this.surface.toModelCoord(
      lastMousePos.x,
      lastMousePos.y
    );
    const oldCommonBound = this._getOldCommonBound(elements, notes);
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

    notes.forEach(note => {
      const [x, y, w, h] = deserializeXYWH(note.xywh);
      const newBound = new Bound(
        pasteX + x - oldCommonBound.x,
        pasteY + y - oldCommonBound.y,
        w,
        h
      );
      this._page.updateBlock(note, {
        xywh: serializeXYWH(newBound.x, newBound.y, newBound.w, newBound.h),
      });
    });

    this._emitSelectionChangeAfterPaste(
      elements.map(ele => ele.id),
      noteIds
    );
  }

  async copyAsPng(notes: TopLevelBlockModel[], shapes: PhasorElement[]) {
    const notesLen = notes.length;
    const shapesLen = shapes.length;

    if (notesLen + shapesLen === 0) return;

    // sort by `index`
    notes.sort(compare);
    shapes.sort(compare);

    const bounds: IBound[] = [];
    notes.forEach(note => {
      bounds.push(Bound.deserialize(note.xywh));
    });
    shapes.forEach(shape => {
      bounds.push(Bound.deserialize(shape.xywh));
    });
    const bound = getCommonBound(bounds);
    if (!bound) {
      return;
    }

    const parser = new ContentParser(this._page);
    const canvas = await parser.edgelessToCanvas(
      this._edgeless,
      bound,
      notes,
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
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
    }
  }
}
